/* H2 (database-level protection of chapter_files) and M1 (atomic, race-safe batch creation).
 *
 * These tests use a FILE-backed SQLite database with WAL, so that every transaction really has its own connection and
 * the requests really overlap. SQLite is NOT MySQL: it has one write lock for the whole database, so it proves the
 * logic (no lost update, no duplicate, no 500 on a race) but not InnoDB row-lock behaviour. The MySQL statements are
 * checked below by generating the SQL and are listed as "not verified on a live MySQL" in the release notes. */
const os = require('os')
const fs = require('fs')
const path = require('path')
const dbFile = path.join(os.tmpdir(), `johar-conc-${process.pid}-${Date.now()}.sqlite`)
process.env.SQLITE_STORAGE = dbFile

const crypto = require('crypto')
const Sequelize = require('sequelize')
const { resetDb, makeUser, api, models, sequelize, MOBILE } = require('./helpers')
const { deleteFile } = require('../middlewares/commonFileUploader')
const { withChapter, inTransaction, parseFiles } = require('../services/chapterFiles')
const config = require('../config')

const COMMON = path.join(__dirname, '..', 'files', 'uploads', 'common')
const mp4 = (n = 0, fill = 0) => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(32 + n, fill)])
let http, instructor, admin, course
const created = new Set()

const as = (u) => ({ ...MOBILE, ...u.auth })
let seq = 0
const key = (p) => `${p}-${process.pid}-${Date.now()}-${++seq}`.slice(0, 60)
const manifest = (n, size = mp4().length) => Array.from({ length: n }, (_, i) => ({ client_key: key('k'), name: `v${i}.mp4`, size }))
const newChapter = (title = 'U') => models.Chapter.create({ title, price: 0, course_parent_id: course.id, added_by: instructor.user.id, updated_by: instructor.user.id })
const createBatch = (chapterId, files, batch_key = key('b'), user = instructor) =>
  http.post(`/api/chapters/${chapterId}/batches`).set(as(user)).send({ batch_key, files })
const sendFile = (batchId, fileId, bytes = mp4(), name = 'v.mp4', user = instructor) =>
  http.post(`/api/chapters/batches/${batchId}/files/${fileId}`).set(as(user)).attach('chapter_file', bytes, name)
const listFiles = async (id) => parseFiles((await models.Chapter.findByPk(id)).chapter_files)
const commonNames = () => (fs.existsSync(COMMON) ? fs.readdirSync(COMMON).filter((n) => n.startsWith('file_')) : [])
const remember = async (id) => { for (const f of await listFiles(id)) created.add(f.filepath) }

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  instructor = await makeUser('teach@example.com', 'instructor')
  admin = await makeUser('boss@example.com', 'admin')
  course = await models.Course.create({ title: 'C', price: 0, added_by: instructor.user.id, updated_by: instructor.user.id })
})
afterAll(async () => {
  for (const p of created) await deleteFile(p)
  await sequelize.close()
  for (const suffix of ['', '-wal', '-shm', '-journal']) fs.rmSync(dbFile + suffix, { force: true })
})

test('the suite really runs on a file database with separate connections', () => {
  // the same logic runs on MySQL when TEST_DB_DIALECT=mysql (then the connections are separate by construction)
  if (process.env.TEST_DB_DIALECT === 'mysql') return expect(sequelize.getDialect()).toBe('mysql')
  expect(sequelize.getDialect()).toBe('sqlite')
  expect(sequelize.options.storage).toBe(dbFile)
})

describe('H2: chapter file list under concurrency', () => {
  test('eight uploads to one unit at the same moment: none overwrites another', async () => {
    const c = await newChapter('Eight')
    const b = (await createBatch(c.id, manifest(8))).body.batch
    const results = await Promise.all(b.files.map((f, i) => sendFile(b.id, f.id, mp4(0, i + 1), `v${i}.mp4`)))
    expect(results.map((r) => r.status)).toEqual(Array(8).fill(200))
    const list = await listFiles(c.id)
    expect(list).toHaveLength(8)
    expect(new Set(list.map((f) => f.upload_key)).size).toBe(8)
    expect(new Set(list.map((f) => f.filepath)).size).toBe(8)
    for (const f of list) expect(fs.existsSync(path.join(__dirname, '..', 'files', f.filepath))).toBe(true)
    const final = (await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body.batch
    expect(final.status).toBe('completed')
    await remember(c.id)
  }, 60000)

  test('uploads and edits at the same moment lose neither: the edit does not wipe files and the uploads do not undo the edit', async () => {
    const c = await newChapter('Mixed')
    const b = (await createBatch(c.id, manifest(5))).body.batch
    const edits = [1, 2, 3].map((n) => http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _title: `Edit ${n}`, _chapter_files: '[]' }))
    const ups = b.files.map((f, i) => sendFile(b.id, f.id, mp4(0, i + 1)))
    const all = await Promise.all([...edits, ...ups])
    expect(all.slice(0, 3).every((r) => r.body.message === 'Successfully Updated')).toBe(true)
    expect(all.slice(3).map((r) => r.status)).toEqual(Array(5).fill(200))
    expect(await listFiles(c.id)).toHaveLength(5)
    expect((await models.Chapter.findByPk(c.id)).title).toMatch(/^Edit [123]$/)
    await remember(c.id)
  }, 60000)

  test('the same file sent six times at once is registered once and stored once', async () => {
    const c = await newChapter('Dup')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const before = commonNames().length
    const results = await Promise.all(Array.from({ length: 6 }, () => sendFile(b.id, b.files[0].id)))
    expect(results.every((r) => r.status === 200)).toBe(true)
    expect(results.filter((r) => !r.body.duplicate)).toHaveLength(1)
    expect(await listFiles(c.id)).toHaveLength(1)
    expect(commonNames().length - before).toBe(1) // the copies made by the losing requests were removed
    await remember(c.id)
  }, 60000)

  test('a legacy per-file upload with the same key twice at once registers one entry', async () => {
    const c = await newChapter('Legacy')
    const k = key('legacy')
    const post = () => http.post(`/api/chapters/${c.id}/files`).set(as(instructor)).field('upload_key', k).attach('chapter_file', mp4(), 'v.mp4')
    const results = await Promise.all([post(), post(), post(), post()])
    expect(results.every((r) => r.status === 200)).toBe(true)
    expect(await listFiles(c.id)).toHaveLength(1)
    await remember(c.id)
  }, 60000)

  test('withChapter serialises a read-modify-write: 25 parallel increments are all kept', async () => {
    const c = await newChapter('Counter')
    await Promise.all(Array.from({ length: 25 }, (_, i) => withChapter(c.id, async ({ chapter, files, transaction }) => {
      chapter.chapter_files = JSON.stringify([...files, { n: i }])
      await chapter.save({ transaction })
    })))
    const list = await listFiles(c.id)
    expect(list).toHaveLength(25)
    expect(new Set(list.map((x) => x.n)).size).toBe(25)
  }, 60000)

  test('a failed transaction leaves the list unchanged', async () => {
    const c = await newChapter('Rollback')
    await expect(withChapter(c.id, async ({ chapter, files, transaction }) => {
      chapter.chapter_files = JSON.stringify([...files, { n: 1 }])
      await chapter.save({ transaction })
      throw new Error('boom')
    })).rejects.toThrow('boom')
    expect(await listFiles(c.id)).toHaveLength(0)
  })

  test('the locking statements are what InnoDB needs (generated MySQL SQL, no server involved)', () => {
    const mysql = new Sequelize('db', 'u', 'p', { dialect: 'mysql', logging: false })
    const Chapter = mysql.define('Chapter', { title: Sequelize.STRING })
    const qg = mysql.getQueryInterface().queryGenerator
    const select = qg.selectQuery('Chapters', { where: { id: 5 }, limit: 1, lock: 'UPDATE' }, Chapter)
    expect(select).toMatch(/WHERE `Chapter`\.`id` = 5/)
    expect(select).toMatch(/FOR UPDATE;?$/)
    expect(qg.startTransactionQuery({ options: {} })).toMatch(/START TRANSACTION/)
  })
})

describe('M1: batch creation is atomic and race-safe', () => {
  test('normal creation returns every file', async () => {
    const c = await newChapter('Normal')
    const res = await createBatch(c.id, manifest(4))
    expect(res.status).toBe(200)
    expect(res.body.batch.files).toHaveLength(4)
    expect(res.body.batch.files.every((f) => f.status === 'pending')).toBe(true)
  })

  test('an empty selection is refused and creates nothing', async () => {
    const c = await newChapter('Empty')
    const res = await createBatch(c.id, [])
    expect(res.status).toBe(400)
    expect(await models.UploadBatch.count({ where: { chapter_id: c.id } })).toBe(0)
  })

  test('a failure between the batch row and the file rows leaves NOTHING behind, and the retry works', async () => {
    const c = await newChapter('Interrupted')
    const bk = key('b')
    const spy = jest.spyOn(models.UploadBatchFile, 'bulkCreate').mockRejectedValueOnce(new Error('connection lost'))
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const failed = await createBatch(c.id, manifest(3), bk)
      expect(failed.status).toBe(500)
    } finally { spy.mockRestore(); errors.mockRestore() }
    expect(await models.UploadBatch.count({ where: { chapter_id: c.id } })).toBe(0)
    expect(await models.UploadBatchFile.count({ where: { chapter_id: c.id } })).toBe(0)
    const retry = await createBatch(c.id, manifest(3), bk)
    expect(retry.status).toBe(200)
    expect(retry.body.batch.files).toHaveLength(3)
  })

  test('a batch left empty by the earlier release (batch row, no file rows) is repaired by the next attempt', async () => {
    const c = await newChapter('LegacyEmpty')
    const bk = key('b')
    const stuck = await models.UploadBatch.create({ id: crypto.randomUUID(), batch_key: bk, chapter_id: c.id, user_id: instructor.user.id, total_files: 3, total_bytes: 3 * mp4().length })
    const files = manifest(3)
    const res = await createBatch(c.id, files, bk)
    expect(res.status).toBe(200)
    expect(res.body.existing).toBe(true)
    expect(res.body.repaired).toBe(true)
    expect(res.body.batch.id).toBe(stuck.id)
    expect(res.body.batch.files).toHaveLength(3)
    // a second attempt adds nothing
    const again = await createBatch(c.id, files, bk)
    expect(again.body.batch.files).toHaveLength(3)
    expect(again.body.repaired).toBe(false)
    expect(await models.UploadBatchFile.count({ where: { batch_id: stuck.id } })).toBe(3)
    // and the repaired batch is usable
    expect((await sendFile(stuck.id, res.body.batch.files[0].id)).status).toBe(200)
    await remember(c.id)
  })

  test('six simultaneous requests with the same user and key: one batch, six answers, no 500', async () => {
    const c = await newChapter('Race')
    const bk = key('b')
    const files = manifest(5)
    const results = await Promise.all(Array.from({ length: 6 }, () => createBatch(c.id, files, bk)))
    expect(results.map((r) => r.status)).toEqual(Array(6).fill(200))
    expect(new Set(results.map((r) => r.body.batch.id)).size).toBe(1)
    expect(await models.UploadBatch.count({ where: { chapter_id: c.id } })).toBe(1)
    expect(await models.UploadBatchFile.count({ where: { chapter_id: c.id } })).toBe(5)
    expect(results.filter((r) => !r.body.existing)).toHaveLength(1)
  }, 60000)

  test('different users may use the same batch key, each gets their own batch', async () => {
    const c = await newChapter('TwoUsers')
    const bk = key('b')
    const mine = await createBatch(c.id, manifest(2), bk, instructor)
    const theirs = await createBatch(c.id, manifest(2), bk, admin)
    expect(mine.status).toBe(200)
    expect(theirs.status).toBe(200)
    expect(theirs.body.batch.id).not.toBe(mine.body.batch.id)
    expect(theirs.body.existing).toBeUndefined()
  })

  test('an existing batch with completed files keeps them; asking again does not duplicate rows or re-open them', async () => {
    const c = await newChapter('Half')
    const bk = key('b')
    const files = manifest(3)
    const first = (await createBatch(c.id, files, bk)).body.batch
    await sendFile(first.id, first.files[0].id)
    const again = await createBatch(c.id, files, bk)
    expect(again.body.existing).toBe(true)
    expect(again.body.batch.files.map((f) => f.status)).toEqual(['done', 'pending', 'pending'])
    expect(await models.UploadBatchFile.count({ where: { batch_id: first.id } })).toBe(3)
    await remember(c.id)
  })

  test('the same batch key for a different unit is refused', async () => {
    const c1 = await newChapter('K1'); const c2 = await newChapter('K2')
    const bk = key('b')
    await createBatch(c1.id, manifest(1), bk)
    expect((await createBatch(c2.id, manifest(1), bk)).status).toBe(409)
  })
})
