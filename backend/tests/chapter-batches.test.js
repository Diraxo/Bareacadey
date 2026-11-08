const fs = require('fs')
const path = require('path')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const { deleteFile } = require('../middlewares/commonFileUploader')
const config = require('../config')


const mp4 = (n = 0) => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(32 + n)])
let http, admin, instructor, outsider, course, chapter
const stored = []

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  admin = await makeUser('boss@example.com', 'admin')
  instructor = await makeUser('teach@example.com', 'instructor')
  outsider = await makeUser('other@example.com', 'instructor')
  course = await models.Course.create({ title: 'C', price: 0, added_by: instructor.user.id, updated_by: instructor.user.id })
  chapter = await models.Chapter.create({ title: 'U', price: 0, course_parent_id: course.id, added_by: instructor.user.id, updated_by: instructor.user.id })
})
afterAll(async () => { for (const f of stored) await deleteFile(f) })

const as = (user) => ({ ...MOBILE, ...user.auth })
const newChapter = (title = 'U') => models.Chapter.create({ title, price: 0, course_parent_id: course.id, added_by: instructor.user.id, updated_by: instructor.user.id })
let seq = 0
const key = (p) => `${p}-${Date.now()}-${++seq}`.slice(0, 60)
const manifest = (n, size = mp4().length) => Array.from({ length: n }, (_, i) => ({ client_key: key('k'), name: `v${i}.mp4`, size }))
const createBatch = (id, files, batch_key = key('b'), user = instructor) =>
  http.post(`/api/chapters/${id}/batches`).set(as(user)).send({ batch_key, files })
const sendFile = (batchId, fileId, bytes = mp4(), name = 'v.mp4', user = instructor) =>
  http.post(`/api/chapters/batches/${batchId}/files/${fileId}`).set(as(user)).attach('chapter_file', bytes, name)

const chapterFiles = async (id) => JSON.parse((await models.Chapter.findByPk(id)).chapter_files || '[]')
const collect = async (id) => { (await chapterFiles(id)).forEach((f) => stored.push(f.filepath)) }

describe('migration 0004', () => {
  test('is registered, additive and repeatable', async () => {
    const { listMigrationFiles } = require('../db/migrate')
    expect(listMigrationFiles()).toContain('0004_upload_batches.js')
    const up = require('../db/migrations/0004_upload_batches').up
    await up({ models })
    await up({ models })
    expect(await models.UploadBatch.count()).toBeGreaterThanOrEqual(0)
  })
})

describe('units without videos still work', () => {
  test('create a unit with no files', async () => {
    const res = await http.post('/api/chapters').set(as(instructor)).send({ _title: 'Plain', _course_parent_id: course.id, _price: 0 })
    expect(res.body.message).toBe('Successfully Created')
    expect(res.body.id).toBeGreaterThan(0)
  })
  test('edit title only keeps existing files', async () => {
    const c = await newChapter('Keep')
    const b = (await createBatch(c.id, manifest(2))).body.batch
    for (const f of b.files) expect((await sendFile(b.id, f.id)).status).toBe(200)
    await collect(c.id)
    const before = await chapterFiles(c.id)
    const res = await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _title: 'Renamed', _chapter_files: JSON.stringify(before) })
    expect(res.body.message).toBe('Successfully Updated')
    expect(await chapterFiles(c.id)).toHaveLength(2)
    expect((await models.Chapter.findByPk(c.id)).title).toBe('Renamed')
  })
  test('a stale edit form cannot drop files of an unfinished batch', async () => {
    const c = await newChapter('Stale')
    const b = (await createBatch(c.id, manifest(3))).body.batch
    await sendFile(b.id, b.files[0].id)
    await collect(c.id)
    // the edit form was opened before the first file arrived, so it lists no files
    const res = await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _title: 'X', _chapter_files: '[]' })
    expect(res.body.message).toBe('Successfully Updated')
    expect(await chapterFiles(c.id)).toHaveLength(1)
    expect(fs.existsSync(path.join(__dirname, '..', 'files', (await chapterFiles(c.id))[0].filepath))).toBe(true)
  })
})

describe.each([24, 50, 100])('batch of %i videos', (count) => {
  test('every file is confirmed, then the batch completes', async () => {
    const c = await newChapter(`B${count}`)
    const created = await createBatch(c.id, manifest(count))
    expect(created.status).toBe(200)
    const b = created.body.batch
    expect(b.status).toBe('in_progress')
    expect(b.total_files).toBe(count)
    for (let i = 0; i < b.files.length; i++) {
      const r = await sendFile(b.id, b.files[i].id)
      expect(r.status).toBe(200)
      if (i < b.files.length - 1) expect(r.body.batch.status).toBe('in_progress') // never "completed" early
    }
    const final = (await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body.batch
    expect(final.status).toBe('completed')
    expect(final.done_files).toBe(count)
    expect(final.done_bytes).toBe(final.total_bytes)
    expect(await chapterFiles(c.id)).toHaveLength(count)
    await collect(c.id)
  }, 120000)
})

describe('limits are enforced by the server', () => {
  test('too many files are refused before any upload', async () => {
    const c = await newChapter('Many')
    const res = await createBatch(c.id, manifest(config.upload.maxFilesPerUnit + 1))
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/maximum/)
    expect(await models.UploadBatch.count({ where: { chapter_id: c.id } })).toBe(0)
  })
  test('a file over the size limit or of a bad type is refused up front', async () => {
    const c = await newChapter('Big')
    const big = await createBatch(c.id, [{ client_key: key('k'), name: 'huge.mp4', size: config.upload.maxFileBytes + 1 }])
    expect(big.status).toBe(400)
    const bad = await createBatch(c.id, [{ client_key: key('k'), name: 'run.exe', size: 10 }])
    expect(bad.status).toBe(400)
  })
  test('a file whose bytes are not the announced size is rejected and can be retried', async () => {
    const c = await newChapter('Cut')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const cut = await sendFile(b.id, b.files[0].id, mp4(500))
    expect(cut.status).toBe(400)
    expect(cut.body.batch.files[0].status).toBe('failed')
    expect(await chapterFiles(c.id)).toHaveLength(0)
    const ok = await sendFile(b.id, b.files[0].id)
    expect(ok.status).toBe(200)
    expect(ok.body.batch.status).toBe('completed')
    await collect(c.id)
  })
  test('a disallowed file is rejected by the server even if announced as fine', async () => {
    const c = await newChapter('Sniff')
    const b = (await createBatch(c.id, [{ client_key: key('k'), name: 'pic.png', size: 10 }])).body.batch
    const res = await sendFile(b.id, b.files[0].id, Buffer.alloc(10), 'pic.png')
    expect(res.status).toBe(400)
    expect(res.body.batch.status).toBe('failed')
  })
})

describe('interruption, retry and duplicates', () => {
  test('a lost response is answered from the record and stores nothing twice', async () => {
    const c = await newChapter('Lost')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const first = await sendFile(b.id, b.files[0].id)
    expect(first.body.duplicate).toBeUndefined()
    const again = await sendFile(b.id, b.files[0].id)
    expect(again.status).toBe(200)
    expect(again.body.duplicate).toBe(true)
    expect(await chapterFiles(c.id)).toHaveLength(1)
    await collect(c.id)
  })
  test('a crash after the file was listed but before its row was marked is repaired', async () => {
    const c = await newChapter('Crash')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const first = await sendFile(b.id, b.files[0].id)
    expect(first.status).toBe(200)
    await models.UploadBatchFile.update({ status: 'pending' }, { where: { id: b.files[0].id } })
    const retry = await sendFile(b.id, b.files[0].id)
    expect(retry.body.duplicate).toBe(true)
    expect(await chapterFiles(c.id)).toHaveLength(1)
    expect(retry.body.batch.status).toBe('completed')
    await collect(c.id)
  })
  test('creating the same batch twice returns the same batch', async () => {
    const c = await newChapter('Twice')
    const bk = key('b')
    const files = manifest(2)
    const a = await createBatch(c.id, files, bk)
    const b = await createBatch(c.id, files, bk)
    expect(b.body.existing).toBe(true)
    expect(b.body.batch.id).toBe(a.body.batch.id)
    expect(await models.UploadBatchFile.count({ where: { batch_id: a.body.batch.id } })).toBe(2)
  })
  test('47 of 50 succeed: only the 3 failed files are retried and nothing is duplicated', async () => {
    const c = await newChapter('Partial')
    const b = (await createBatch(c.id, manifest(50))).body.batch
    const failedIdx = [5, 20, 33]
    for (let i = 0; i < 50; i++) {
      const bytes = failedIdx.includes(i) ? mp4(7) : mp4() // wrong size = truncated upload
      await sendFile(b.id, b.files[i].id, bytes)
    }
    let state = (await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body.batch
    expect(state.status).toBe('partial')
    expect(state.done_files).toBe(47)
    expect(state.failed_files).toBe(3)
    expect((await chapterFiles(c.id))).toHaveLength(47)
    const before = (await chapterFiles(c.id)).map((f) => f.filepath)
    for (const f of state.files.filter((x) => x.status === 'failed')) expect((await sendFile(b.id, f.id)).status).toBe(200)
    state = (await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body.batch
    expect(state.status).toBe('completed')
    const after = (await chapterFiles(c.id)).map((f) => f.filepath)
    expect(after).toHaveLength(50)
    expect(new Set(after).size).toBe(50)
    before.forEach((p) => expect(after).toContain(p)) // successful files were kept as they were
    await collect(c.id)
  }, 120000)
  test('all files failing gives status failed', async () => {
    const c = await newChapter('AllFail')
    const b = (await createBatch(c.id, manifest(2))).body.batch
    for (const f of b.files) await sendFile(b.id, f.id, mp4(3))
    const state = (await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body.batch
    expect(state.status).toBe('failed')
  })
})

describe('recovery after refresh and notification', () => {
  test('an unfinished batch is listed with its pending files; a finished one is announced once', async () => {
    const c = await newChapter('Recover')
    const b = (await createBatch(c.id, manifest(3))).body.batch
    await sendFile(b.id, b.files[0].id)
    let active = (await http.get('/api/chapters/batches/active').set(as(instructor))).body.batch || (await http.get('/api/chapters/batches/active').set(as(instructor))).body.batches
    const mine = active.find((x) => x.id === b.id)
    expect(mine.status).toBe('in_progress')
    expect(mine.done_files).toBe(1)
    expect(mine.pending_files).toBe(2)
    // cannot dismiss while running
    expect((await http.post(`/api/chapters/batches/${b.id}/acknowledge`).set(as(instructor))).status).toBe(409)
    for (const f of b.files.slice(1)) await sendFile(b.id, f.id)
    active = (await http.get('/api/chapters/batches/active').set(as(instructor))).body.batches
    expect(active.find((x) => x.id === b.id).status).toBe('completed')
    expect((await http.post(`/api/chapters/batches/${b.id}/acknowledge`).set(as(instructor))).status).toBe(200)
    active = (await http.get('/api/chapters/batches/active').set(as(instructor))).body.batches
    expect(active.find((x) => x.id === b.id)).toBeUndefined() // not announced again after a refresh
    const still = await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))
    expect(still.body.batch.status).toBe('completed') // the record itself remains
    await collect(c.id)
  })
})

describe('privacy and permissions', () => {
  test('another instructor cannot read, upload to or dismiss someone else’s batch', async () => {
    const c = await newChapter('Private')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    expect((await http.get(`/api/chapters/batches/${b.id}`).set(as(outsider))).status).toBe(404)
    expect((await sendFile(b.id, b.files[0].id, mp4(), 'v.mp4', outsider)).status).toBe(404)
    expect((await http.post(`/api/chapters/batches/${b.id}/acknowledge`).set(as(outsider))).status).toBe(404)
    expect((await http.get('/api/chapters/batches/active').set(as(outsider))).body.batches.find((x) => x.id === b.id)).toBeUndefined()
    expect((await createBatch(c.id, manifest(1), key('b'), outsider)).status).toBe(401)
    expect(await chapterFiles(c.id)).toHaveLength(0)
  })
  test('an administrator can read any batch', async () => {
    const c = await newChapter('Admin')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    expect((await http.get(`/api/chapters/batches/${b.id}`).set(as(admin))).status).toBe(200)
  })
  test('a viewer cannot start a batch and status never exposes server paths', async () => {
    const viewer = await makeUser('view@example.com', 'viewer')
    const c = await newChapter('Viewer')
    expect((await createBatch(c.id, manifest(1), key('b'), viewer)).status).toBe(401)
    const b = (await createBatch(c.id, manifest(1))).body.batch
    await sendFile(b.id, b.files[0].id)
    expect(JSON.stringify((await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body)).not.toMatch(/uploads|tempFile|filepath/i)
    await collect(c.id)
  })
  test('without a token nothing is reachable', async () => {
    expect((await http.get('/api/chapters/batches/active').set(MOBILE)).status).toBe(401)
  })
})

describe('access token that expires while a file is still arriving', () => {
  const jwt = require('jsonwebtoken')
  const httpMod = require('http')
  const { createApp } = require('../app')

  /* Sends the multipart headers and half of the body, waits past the token's expiry, then sends the rest. */
  const slowUpload = (port, urlPath, token, parts) => new Promise((resolve, reject) => {
    const boundary = '----x' + Date.now()
    const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chapter_file"; filename="v.mp4"\r\nContent-Type: video/mp4\r\n\r\n`)
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
    const body = mp4()
    const total = head.length + body.length + tail.length
    const req = httpMod.request({ port, path: urlPath, method: 'POST', headers: { ...MOBILE, Authorization: `Bearer ${token}`, 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': total } }, (res) => {
      let data = ''; res.on('data', (d) => { data += d }); res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.write(Buffer.concat([head, body.subarray(0, 10)]))
    setTimeout(() => { req.write(Buffer.concat([body.subarray(10), tail])); req.end() }, parts.waitMs)
  })

  test('a request that started with a valid token finishes even if the token expires meanwhile', async () => {
    const c = await newChapter('Expiry')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const server = httpMod.createServer(createApp()).listen(0)
    try {
      const short = jwt.sign({ id: instructor.user.id, role: 'x', permissions: instructor.permissions }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 1, algorithm: 'HS256' })
      const res = await slowUpload(server.address().port, `/api/chapters/batches/${b.id}/files/${b.files[0].id}`, short, { waitMs: 2200 })
      expect(res.status).toBe(200)
      expect(JSON.parse(res.body).batch.status).toBe('completed')
      // a token that is already expired when the request starts is still refused
      const expired = jwt.sign({ id: instructor.user.id, role: 'x', permissions: instructor.permissions }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -10, algorithm: 'HS256' })
      const b2 = (await createBatch(c.id, manifest(1))).body.batch
      const refused = await slowUpload(server.address().port, `/api/chapters/batches/${b2.id}/files/${b2.files[0].id}`, expired, { waitMs: 100 })
      expect(refused.status).toBe(403)
      await collect(c.id)
    } finally { server.close() }
  }, 30000)
})
