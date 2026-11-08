/* H1: a request is authenticated BEFORE its multipart body is read, so a rejected request never creates a temporary file.
 * The "no temporary file" assertions compare the contents of the real upload temp directory before and after. */
const fs = require('fs')
const http1 = require('http')
const jwt = require('jsonwebtoken')
const { resetDb, makeUser, api, models, MOBILE, ORIGIN, PASSWORD, createApp } = require('./helpers')
const { TEMP_DIR } = require('../services/tempCleanup')
const { deleteFile } = require('../middlewares/commonFileUploader')
const config = require('../config')

const mp4 = (n = 0) => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(32 + n)])
let http, instructor, other, viewer, chapter, batch, row
const stored = []

const tempListing = () => (fs.existsSync(TEMP_DIR) ? fs.readdirSync(TEMP_DIR).sort() : [])
const settle = () => new Promise((r) => setTimeout(r, 150)) // temp files are removed when the response closes
const sign = (claims, options = {}) => jwt.sign(claims, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m', algorithm: 'HS256', ...options })
const claimsOf = (u) => ({ id: u.user.id, role: 'x', permissions: u.permissions })
const url = () => `/api/chapters/batches/${batch.id}/files/${row.id}`
const bigBody = Buffer.concat([mp4(), Buffer.alloc(200 * 1024, 1)])

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  instructor = await makeUser('teach@example.com', 'instructor')
  other = await makeUser('other@example.com', 'instructor')
  viewer = await makeUser('view@example.com', 'viewer')
  const course = await models.Course.create({ title: 'C', price: 0, added_by: instructor.user.id, updated_by: instructor.user.id })
  chapter = await models.Chapter.create({ title: 'U', price: 0, course_parent_id: course.id, added_by: instructor.user.id, updated_by: instructor.user.id })
  const created = await http.post(`/api/chapters/${chapter.id}/batches`).set(MOBILE).set(instructor.auth)
    .send({ batch_key: 'gate-batch-0001', files: [{ client_key: 'gate-file-0001', name: 'v.mp4', size: bigBody.length }] })
  batch = created.body.batch
  row = batch.files[0]
})
afterAll(async () => {
  for (const c of await models.Chapter.findAll()) for (const f of JSON.parse(c.chapter_files || '[]')) stored.push(f.filepath)
  for (const f of stored) await deleteFile(f)
})

const send = (headers) => {
  let r = http.post(url()).set(MOBILE)
  for (const [k, v] of Object.entries(headers)) r = r.set(k, v)
  return r.attach('chapter_file', bigBody, 'v.mp4')
}

describe('credentials are checked before the body is accepted', () => {
  const cases = {
    'no Authorization header': () => ({}),
    'not a bearer token': () => ({ Authorization: 'Basic abc' }),
    'malformed token': () => ({ Authorization: 'Bearer not.a.jwt' }),
    'token signed with another secret': () => ({ Authorization: `Bearer ${jwt.sign(claimsOf(instructor), 'wrong-secret-0000000000000000000000000', { expiresIn: '15m' })}` }),
    'token that expired before the request started': () => ({ Authorization: `Bearer ${sign(claimsOf(instructor), { expiresIn: -30 })}` }),
    'single-purpose token (password reset)': () => ({ Authorization: `Bearer ${sign({ id: instructor.user.id, typ: 'reset' })}` }),
    'only the refresh cookie (not an access credential)': () => ({ Cookie: 'rt=rs1.anything' }),
  }
  for (const [name, headers] of Object.entries(cases)) {
    test(`${name}: refused, nothing written to the temp directory, nothing registered`, async () => {
      const before = tempListing()
      const res = await send(headers())
      expect([401, 403]).toContain(res.status)
      await settle()
      expect(tempListing()).toEqual(before)
      expect(JSON.parse((await models.Chapter.findByPk(chapter.id)).chapter_files || '[]')).toHaveLength(0)
    })
  }

  test('revoked session: the access token of a signed-out session is refused before the body', async () => {
    const login = await http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: 'teach@example.com', password: PASSWORD, device: 'd' })
    expect(login.status).toBe(200)
    await http.delete('/api/user/token/logout').set(MOBILE).send({ token: login.body.rt })
    const before = tempListing()
    const res = await send({ Authorization: `Bearer ${login.body.accessToken}` })
    expect(res.status).toBe(403)
    await settle()
    expect(tempListing()).toEqual(before)
  })

  test('the identity is the token, never a form field: another instructor naming the owner still gets nothing', async () => {
    const before = tempListing()
    const res = await send({ ...other.auth }).field('user_id', String(instructor.user.id)).field('added_by', String(instructor.user.id))
    expect(res.status).toBe(404) // not their batch
    await settle()
    expect(tempListing()).toEqual(before) // and the temporary copy was removed after the refusal
    expect(JSON.parse((await models.Chapter.findByPk(chapter.id)).chapter_files || '[]')).toHaveLength(0)
  })

  test('a valid user without chapter permission is refused, and the temp file made for them is removed', async () => {
    const before = tempListing()
    const res = await send(viewer.auth)
    expect(res.status).toBe(401)
    await settle()
    expect(tempListing()).toEqual(before)
  })

  test('a valid user without access to this unit cannot create a batch for it', async () => {
    const res = await http.post(`/api/chapters/${chapter.id}/batches`).set(MOBILE).set(other.auth)
      .send({ batch_key: 'gate-batch-0002', files: [{ client_key: 'gate-file-0002', name: 'v.mp4', size: 10 }] })
    expect(res.status).toBe(401)
  })
})

describe('a token that is valid when the request starts', () => {
  const slowUpload = (port, token, waitMs) => new Promise((resolve, reject) => {
    const boundary = '----gate' + Date.now()
    const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chapter_file"; filename="v.mp4"\r\nContent-Type: video/mp4\r\n\r\n`)
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
    const req = http1.request({
      port, path: url(), method: 'POST',
      headers: { ...MOBILE, Authorization: `Bearer ${token}`, 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': head.length + bigBody.length + tail.length },
    }, (res) => { let d = ''; res.on('data', (c) => { d += c }); res.on('end', () => resolve({ status: res.statusCode, body: d })) })
    req.on('error', reject)
    req.write(Buffer.concat([head, bigBody.subarray(0, 1000)]))
    setTimeout(() => { req.write(Buffer.concat([bigBody.subarray(1000), tail])); req.end() }, waitMs)
  })

  test('is accepted although it expires while the file is still arriving', async () => {
    const server = http1.createServer(createApp()).listen(0)
    try {
      const res = await slowUpload(server.address().port, sign(claimsOf(instructor), { expiresIn: 1 }), 2300)
      expect(res.status).toBe(200)
      expect(JSON.parse(res.body).batch.status).toBe('completed')
    } finally { server.close() }
  }, 20000)
})

describe('other requests are not affected', () => {
  test('JSON requests with a bad token are still answered by the normal check', async () => {
    expect((await http.get('/api/roles/mine').set(MOBILE).set({ Authorization: 'Bearer nope' })).status).toBe(403)
    expect((await http.get('/api/roles/mine').set(MOBILE)).status).toBe(401)
  })

  test('the public sign-up form (with a photo) still works without a token and leaves no temp file behind', async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])
    const before = tempListing()
    const res = await http.post('/api/auth/create_account').set(ORIGIN)
      .field('first_name', 'New').field('last_name', 'Student').field('username', 'newstudent').field('email', 'new.student@example.com')
      .field('password', 'Str0ng!Passw0rd').field('device', 'd')
      .attach('file', png, 'me.png')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Successfully Registered')
    await settle()
    expect(tempListing()).toEqual(before)
    const user = await models.User.findOne({ where: { email: 'new.student@example.com' } })
    expect(user.upload_id).toBeTruthy()
  })

  test('multipart to any other anonymous route is refused before parsing', async () => {
    const before = tempListing()
    const res = await http.post('/api/public/anything').set(ORIGIN).attach('file', bigBody, 'x.bin')
    expect([401, 403]).toContain(res.status)
    await settle()
    expect(tempListing()).toEqual(before)
  })
})
