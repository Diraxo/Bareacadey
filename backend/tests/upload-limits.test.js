/* Resource protection for upload temp storage: request size, file count, per-file size and the rate of upload starts.
 * The limits are configurable; this file shrinks them through the environment BEFORE the config is loaded. */
process.env.UPLOAD_MAX_FILE_BYTES = '5000'
process.env.UPLOAD_MAX_FILES_PER_REQUEST = '2'
process.env.UPLOAD_MAX_REQUEST_BYTES = '9000'
process.env.UPLOAD_INIT_RATE_LIMIT_PER_MIN = '6'
process.env.UPLOAD_PUBLIC_RATE_LIMIT_PER_HOUR = '2'

const fs = require('fs')
const http1 = require('http')
const { resetDb, makeUser, api, models, MOBILE, ORIGIN, createApp } = require('./helpers')
const { TEMP_DIR, cleanTempUploads } = require('../services/tempCleanup')
const config = require('../config')

let http, instructor, chapter
const tempListing = () => (fs.existsSync(TEMP_DIR) ? fs.readdirSync(TEMP_DIR).sort() : [])
// the request directory is removed asynchronously after the response closes (fs.rm retries on Windows); wait for that
// instead of a fixed sleep. The caller still asserts the listing is exactly what it was before.
const settle = async (before, ms = 5000) => {
  const end = Date.now() + ms
  do { await new Promise((r) => setTimeout(r, 50)) } while (Date.now() < end && tempListing().join('|') !== before.join('|'))
}
const mp4 = (n) => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(n)])

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  instructor = await makeUser('teach@example.com', 'instructor')
  const course = await models.Course.create({ title: 'C', price: 0, added_by: instructor.user.id, updated_by: instructor.user.id })
  chapter = await models.Chapter.create({ title: 'U', price: 0, course_parent_id: course.id, added_by: instructor.user.id, updated_by: instructor.user.id })
})

test('the limits come from configuration', () => {
  expect(config.upload.maxFileBytes).toBe(5000)
  expect(config.upload.maxFilesPerRequest).toBe(2)
  expect(config.upload.maxRequestBytes).toBe(9000)
})

describe('size and count', () => {
  test('a declared body larger than the request limit is refused before anything is read', async () => {
    const before = tempListing()
    const server = http1.createServer(createApp()).listen(0)
    try {
      const status = await new Promise((resolve, reject) => {
        const req = http1.request({
          port: server.address().port, path: `/api/chapters/batches/x/files/y`, method: 'POST',
          headers: { ...MOBILE, ...instructor.auth, 'content-type': 'multipart/form-data; boundary=zzz', 'content-length': config.upload.maxRequestBytes + 1 },
        }, (res) => { res.resume(); resolve(res.statusCode) })
        req.on('error', reject)
        req.write('--zzz\r\n') // headers and a few bytes only; the declared length is what is judged
      })
      expect(status).toBe(413)
    } finally { server.close() }
    await settle(before)
    expect(tempListing()).toEqual(before)
  })

  test('a file over the per-file limit is cut off and leaves no temporary file', async () => {
    const before = tempListing()
    const res = await http.post('/api/chapters/batches/x/files/y').set(MOBILE).set(instructor.auth).attach('chapter_file', mp4(6000), 'v.mp4')
    expect(res.status).toBe(413)
    await settle(before)
    expect(tempListing()).toEqual(before)
  })

  test('more files than allowed per request are refused and every temporary file is removed', async () => {
    const before = tempListing()
    const res = await http.post('/api/chapters/batches/x/files/y').set(MOBILE).set(instructor.auth)
      .attach('chapter_file', mp4(100), 'a.mp4').attach('chapter_file', mp4(100), 'b.mp4').attach('chapter_file', mp4(100), 'c.mp4')
    expect(res.status).toBe(413)
    expect(res.body.code).toBe('too_many_files')
    await settle(before)
    expect(tempListing()).toEqual(before)
  })

  test('a batch whose announced file is over the limit is refused when the batch is created', async () => {
    const res = await http.post(`/api/chapters/${chapter.id}/batches`).set(MOBILE).set(instructor.auth)
      .send({ batch_key: 'limits-batch-001', files: [{ client_key: 'limits-file-001', name: 'v.mp4', size: 5001 }] })
    expect(res.status).toBe(400)
  })
})

describe('rate limiting of upload starts', () => {
  test('a signed-in user can only start so many uploads per minute; the 429 arrives before the body is read', async () => {
    const other = await makeUser('burst@example.com', 'instructor')
    const before = tempListing()
    const codes = []
    for (let i = 0; i < 9; i++) {
      codes.push((await http.post('/api/chapters/batches/x/files/y').set(MOBILE).set(other.auth).attach('chapter_file', mp4(50), 'v.mp4')).status)
    }
    expect(codes.slice(0, 6).every((c) => c !== 429)).toBe(true)
    expect(codes.slice(6)).toEqual([429, 429, 429])
    await settle(before)
    expect(tempListing()).toEqual(before)
    // another user is not affected by this user's burst
    expect((await http.post('/api/chapters/batches/x/files/y').set(MOBILE).set(instructor.auth).attach('chapter_file', mp4(50), 'v.mp4')).status).not.toBe(429)
  })

  test('anonymous sign-up uploads are limited per address', async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)])
    const post = (n) => http.post('/api/auth/create_account').set(ORIGIN).field('first_name', 'A').field('last_name', 'B')
      .field('username', `anon${n}`).field('email', `anon${n}@example.com`).field('password', 'Str0ng!Passw0rd').attach('file', png, 'p.png')
    const codes = []
    for (let i = 0; i < 4; i++) codes.push((await post(i)).status)
    expect(codes).toEqual([200, 200, 429, 429])
  })
})

describe('abandoned temporary files', () => {
  test('only upload-parser temp names older than the age limit are removed, from the real temp directory', async () => {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
    const old = `${TEMP_DIR}/tmp-9001-1700000000000`
    const fresh = `${TEMP_DIR}/tmp-9002-1700000000001`
    const stranger = `${TEMP_DIR}/keep-me.txt`
    for (const f of [old, fresh, stranger]) fs.writeFileSync(f, 'x')
    const past = new Date(Date.now() - config.upload.tempMaxAgeMs - 60000)
    fs.utimesSync(old, past, past); fs.utimesSync(stranger, past, past)
    expect(await cleanTempUploads()).toBe(1)
    expect(fs.existsSync(old)).toBe(false)
    expect(fs.existsSync(fresh)).toBe(true)
    expect(fs.existsSync(stranger)).toBe(true)
    fs.unlinkSync(fresh); fs.unlinkSync(stranger)
  })
})
