const fs = require('fs')
const os = require('os')
const path = require('path')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const { cleanTempUploads } = require('../services/tempCleanup')
const { deleteFile } = require('../middlewares/commonFileUploader')

const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(32)])
let http, admin, other, course, chapter
const stored = []

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  admin = await makeUser('boss@example.com', 'admin')
  other = await makeUser('viewer@example.com', 'viewer')
  course = await models.Course.create({ title: 'C', price: 0, added_by: admin.user.id, updated_by: admin.user.id })
  chapter = await models.Chapter.create({ title: 'U', price: 0, course_parent_id: course.id, added_by: admin.user.id, updated_by: admin.user.id })
})
afterAll(async () => { for (const f of stored) await deleteFile(f) })

const send = (id, name, key, auth = admin.auth, bytes = MP4) =>
  http.post(`/api/chapters/${id}/files`).set(MOBILE).set(auth).field('upload_key', key).attach('chapter_file', bytes, name)

describe('unit file upload, one request per file', () => {
  test('limits are published before any upload', async () => {
    const res = await http.get('/api/chapters/upload-limits').set(MOBILE).set(admin.auth)
    expect(res.status).toBe(200)
    expect(res.body.maxFilesPerUnit).toBeGreaterThan(0)
    expect(res.body.maxFileBytes).toBeGreaterThan(0)
    expect(res.body.videoExtensions).toContain('.mp4')
  })

  test('create returns the id so the browser can attach files to it', async () => {
    const res = await http.post('/api/chapters').set(MOBILE).set(admin.auth).send({ _title: 'New', _course_parent_id: course.id, _price: 0 })
    expect(res.body.message).toBe('Successfully Created')
    expect(res.body.id).toBeGreaterThan(0)
  })

  test('files are appended in order and a retry with the same key does not duplicate', async () => {
    const first = await send(chapter.id, 'one.mp4', 'key-aaaaaaaa-1')
    expect(first.status).toBe(200)
    expect(first.body.total).toBe(1)
    stored.push(first.body.file.filepath)
    const retry = await send(chapter.id, 'one.mp4', 'key-aaaaaaaa-1')
    expect(retry.body.duplicate).toBe(true)
    const second = await send(chapter.id, 'two.mp4', 'key-aaaaaaaa-2')
    stored.push(second.body.file.filepath)
    const files = JSON.parse((await models.Chapter.findByPk(chapter.id)).chapter_files)
    expect(files.map((f) => f.filename)).toEqual(['one.mp4', 'two.mp4'])
    expect(fs.existsSync(path.join(__dirname, '..', 'files', first.body.file.filepath))).toBe(true)
  })

  test('parallel requests for one unit lose nothing', async () => {
    const results = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => send(chapter.id, `p${n}.mp4`, `key-parallel-${n}`)))
    results.forEach((r) => { expect(r.status).toBe(200); stored.push(r.body.file.filepath) })
    const files = JSON.parse((await models.Chapter.findByPk(chapter.id)).chapter_files)
    expect(files).toHaveLength(8)
  })

  test('a unit can hold well over 100 videos', async () => {
    const big = await models.Chapter.create({ title: 'Big', price: 0, course_parent_id: course.id, added_by: admin.user.id, updated_by: admin.user.id })
    for (let n = 0; n < 120; n++) {
      const r = await send(big.id, `v${n}.mp4`, `key-bulk-${String(n).padStart(4, '0')}`)
      expect(r.status).toBe(200)
      stored.push(r.body.file.filepath)
    }
    expect(JSON.parse((await models.Chapter.findByPk(big.id)).chapter_files)).toHaveLength(120)
  }, 60000)

  test('rejects people who cannot manage the unit, bad keys, and disallowed files', async () => {
    expect((await send(chapter.id, 'x.mp4', 'key-bbbbbbbb-1', other.auth)).status).toBe(401)
    expect((await send(chapter.id, 'x.mp4', 'bad key!')).status).toBe(400)
    const bad = await send(chapter.id, 'shell.php', 'key-bbbbbbbb-2', admin.auth, Buffer.from('<?php ?>'))
    expect(bad.status).toBe(400)
    expect((await send(999999, 'x.mp4', 'key-bbbbbbbb-3')).status).toBe(401)
    expect(JSON.parse((await models.Chapter.findByPk(chapter.id)).chapter_files)).toHaveLength(8)
  })
})

describe('temp upload cleanup', () => {
  test('removes only old plain files', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tmpclean-'))
    const old = path.join(dir, 'tmp-1-1700000000000'); const fresh = path.join(dir, 'tmp-2-1700000000001')
    const stranger = path.join(dir, 'notes.txt') // not one of the upload parser's own temp names: never touched
    fs.writeFileSync(old, 'x'); fs.writeFileSync(fresh, 'x'); fs.writeFileSync(stranger, 'x'); fs.mkdirSync(path.join(dir, 'sub'))
    const past = new Date(Date.now() - 3 * 86400000)
    fs.utimesSync(old, past, past); fs.utimesSync(stranger, past, past)
    expect(await cleanTempUploads({ dir })).toBe(1)
    expect(fs.existsSync(old)).toBe(false)
    expect(fs.existsSync(stranger)).toBe(true)
    expect(fs.existsSync(fresh)).toBe(true)
    expect(fs.existsSync(path.join(dir, 'sub'))).toBe(true)
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
