/* Upload behaviour that only a real MySQL 8 / InnoDB server can prove: row locks, the unique key, NULL handling in a
 * unique index, non-transactional DDL, and rollback of a transaction that really had its own connection.
 *
 * Run with TEST_DB_DIALECT=mysql (and TEST_DB_* pointing at a LOCAL database whose name ends in _test; see helpers.js).
 * On the default SQLite run this file is not applicable and its tests are skipped; nothing here weakens another suite.
 * All data is synthetic. */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Sequelize = require('sequelize')
const { resetDb, makeUser, api, models, sequelize, MOBILE } = require('./helpers')
const { deleteFile, planMediaFile } = require('../middlewares/commonFileUploader')
const { withChapter, parseFiles } = require('../services/chapterFiles')
const { absolutePath, reconcileUploads } = require('../services/uploadJournal')

const ON_MYSQL = process.env.TEST_DB_DIALECT === 'mysql'
const suite = ON_MYSQL ? describe : describe.skip

const ROOT = path.join(__dirname, '..', 'files')
const mp4 = (fill = 0) => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(32, fill)])
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex')
let http, instructor, course, raw
const created = new Set()
let seq = 0
const key = (p) => `${p}-${process.pid}-${Date.now()}-${++seq}`.slice(0, 60)
const as = (u) => ({ ...MOBILE, ...u.auth })
const manifest = (n) => Array.from({ length: n }, (_, i) => ({ client_key: key('k'), name: `v${i}.mp4`, size: mp4().length }))
const newChapter = (title = 'U') => models.Chapter.create({ title, price: 0, course_parent_id: course.id, added_by: instructor.user.id, updated_by: instructor.user.id })
const createBatch = (id, files, batch_key = key('b')) => http.post(`/api/chapters/${id}/batches`).set(as(instructor)).send({ batch_key, files })
const sendFile = (batchId, fileId, bytes = mp4(), name = 'v.mp4') =>
  http.post(`/api/chapters/batches/${batchId}/files/${fileId}`).set(as(instructor)).attach('chapter_file', bytes, name)
const list = async (id) => parseFiles((await models.Chapter.findByPk(id)).chapter_files)
const common = () => fs.readdirSync(path.join(ROOT, 'uploads', 'common')).filter((n) => n.startsWith('file_'))
const remember = async (id) => { for (const f of await list(id)) created.add(f.filepath) }
// a second, independent connection: NOWAIT fails at once (errno 3572) if InnoDB holds a lock on the row
const nowait = (id) => raw.query('SELECT id FROM Chapters WHERE id = ? FOR UPDATE NOWAIT', { replacements: [id] })
const batchRow = (id, chapter_id, user_id = instructor.user.id) => models.UploadBatch.create({ id, batch_key: `bk-${id}`.slice(0, 40), chapter_id, user_id })
const fileRow = (id, batch_id, chapter_id, client_key) =>
  models.UploadBatchFile.create({ id, batch_id, chapter_id, client_key, original_name: 'v.mp4', expected_size: 1 })

beforeAll(async () => {
  if (!ON_MYSQL) return
  await resetDb()
  ;({ http } = api())
  instructor = await makeUser('teach@example.com', 'instructor')
  course = await models.Course.create({ title: 'C', price: 0, added_by: instructor.user.id, updated_by: instructor.user.id })
  raw = new Sequelize(process.env.TEST_DB_NAME, process.env.TEST_DB_USER, process.env.TEST_DB_PASSWORD, {
    dialect: 'mysql', host: process.env.TEST_DB_HOST || '127.0.0.1', port: parseInt(process.env.TEST_DB_PORT, 10) || 3306, logging: false,
  })
}, 180000) // dropping and re-creating every table on a real server is slow
afterAll(async () => {
  if (!ON_MYSQL) return
  for (const p of created) await deleteFile(p)
  if (raw) await raw.close()
}, 60000)

suite('MySQL 8: the test really runs on InnoDB', () => {
  test('server, engine and charset', async () => {
    expect(sequelize.getDialect()).toBe('mysql')
    const [[v]] = await sequelize.query('SELECT VERSION() AS v')
    expect(v.v).toMatch(/^8\./)
    const [[t]] = await sequelize.query("SELECT ENGINE AS e FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Chapters'")
    expect(t.e).toBe('InnoDB')
  })
})

suite('MySQL 8: concurrent uploads', () => {
  test('same chapter: 12 simultaneous files are all kept, none overwritten, no 5xx', async () => {
    const c = await newChapter('Same')
    const b = (await createBatch(c.id, manifest(12))).body.batch
    const res = await Promise.all(b.files.map((f, i) => sendFile(b.id, f.id, mp4(i + 1), `v${i}.mp4`)))
    expect(res.map((r) => r.status)).toEqual(Array(12).fill(200))
    const files = await list(c.id)
    expect(files).toHaveLength(12)
    expect(new Set(files.map((f) => f.upload_key)).size).toBe(12)
    expect(new Set(files.map((f) => f.filepath)).size).toBe(12)
    for (const f of files) expect(fs.existsSync(path.join(ROOT, f.filepath))).toBe(true)
    expect((await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body.batch.status).toBe('completed')
    await remember(c.id)
  }, 90000)

  test('different chapters: parallel uploads each end with exactly their own files', async () => {
    const chapters = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => newChapter(`Diff${n}`)))
    const batches = await Promise.all(chapters.map(async (c) => (await createBatch(c.id, manifest(4))).body.batch))
    const res = await Promise.all(batches.flatMap((b, bi) => b.files.map((f, i) => sendFile(b.id, f.id, mp4(bi * 10 + i + 1), `c${bi}-${i}.mp4`))))
    expect(res.every((r) => r.status === 200)).toBe(true)
    for (let i = 0; i < chapters.length; i++) {
      const files = await list(chapters[i].id)
      expect(files).toHaveLength(4)
      expect(files.every((f) => f.batch_id === batches[i].id)).toBe(true)
      await remember(chapters[i].id)
    }
  }, 120000)

  test('InnoDB row lock: the same chapter is locked while a registration runs, another chapter is not', async () => {
    const a = await newChapter('LockA')
    const b = await newChapter('LockB')
    let inside
    await withChapter(a.id, async () => {
      inside = {
        same: await nowait(a.id).then(() => 'free', (e) => e?.parent?.errno || e?.original?.errno),
        other: await nowait(b.id).then(() => 'free', (e) => e?.parent?.errno),
      }
    })
    expect(inside.same).toBe(3572) // ER_LOCK_NOWAIT: held by the transaction
    expect(inside.other).toBe('free')
    await expect(nowait(a.id)).resolves.toBeDefined() // released after commit
  })

  test('parallel read-modify-write through withChapter keeps all 30 entries', async () => {
    const c = await newChapter('Counter')
    await Promise.all(Array.from({ length: 30 }, (_, i) => withChapter(c.id, async ({ chapter, files, transaction }) => {
      chapter.chapter_files = JSON.stringify([...files, { n: i }])
      await chapter.save({ transaction })
    })))
    expect(new Set((await list(c.id)).map((x) => x.n)).size).toBe(30)
  }, 60000)
})

suite('MySQL 8: duplicate upload keys', () => {
  test('the unique index exists on (chapter_id, client_key)', async () => {
    const [rows] = await sequelize.query("SELECT COLUMN_NAME c, NON_UNIQUE u FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'UploadBatchFiles' AND INDEX_NAME = 'upload_batch_files_chapter_key' ORDER BY SEQ_IN_INDEX")
    expect(rows.map((r) => r.c)).toEqual(['chapter_id', 'client_key'])
    expect(Number(rows[0].u)).toBe(0)
  })

  test('the same key twice in one unit is refused by the server; in another unit it is allowed', async () => {
    const c1 = await newChapter('K1'); const c2 = await newChapter('K2')
    const k = key('shared')
    await batchRow('dk-b1', c1.id); await batchRow('dk-b2', c1.id); await batchRow('dk-b3', c2.id)
    await fileRow('dk-f1', 'dk-b1', c1.id, k)
    await expect(fileRow('dk-f2', 'dk-b2', c1.id, k)).rejects.toThrow(Sequelize.UniqueConstraintError)
    await expect(fileRow('dk-f3', 'dk-b3', c2.id, k)).resolves.toBeDefined()
  })

  test('a manifest that repeats a key is rejected and creates nothing; the retry of one batch key gives one batch', async () => {
    const c = await newChapter('K3')
    const k = key('dup')
    const bad = await createBatch(c.id, [{ client_key: k, name: 'a.mp4', size: 40 }, { client_key: k, name: 'b.mp4', size: 40 }])
    expect(bad.status).toBe(400)
    expect(await models.UploadBatch.count({ where: { chapter_id: c.id } })).toBe(0)
    const bk = key('bk'); const files = manifest(3)
    const res = await Promise.all(Array.from({ length: 6 }, () => createBatch(c.id, files, bk)))
    expect(res.every((r) => r.status === 200)).toBe(true)
    expect(new Set(res.map((r) => r.body.batch.id)).size).toBe(1)
    expect(await models.UploadBatch.count({ where: { chapter_id: c.id } })).toBe(1)
    expect(await models.UploadBatchFile.count({ where: { chapter_id: c.id } })).toBe(3)
  }, 60000)

  test('the same file sent 6 times at once is registered once and stored once', async () => {
    const c = await newChapter('K4')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const before = common().length
    const res = await Promise.all(Array.from({ length: 6 }, () => sendFile(b.id, b.files[0].id)))
    expect(res.every((r) => r.status === 200)).toBe(true)
    expect(res.filter((r) => !r.body.duplicate)).toHaveLength(1)
    expect(await list(c.id)).toHaveLength(1)
    expect(common().length - before).toBe(1)
    await remember(c.id)
  }, 60000)
})

suite('MySQL 8: NULL chapter_id', () => {
  test('the column is nullable and NULLs do not collide in the unique index', async () => {
    const [[col]] = await sequelize.query("SELECT IS_NULLABLE n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'UploadBatchFiles' AND COLUMN_NAME = 'chapter_id'")
    expect(col.n).toBe('YES')
    await batchRow('nl-b1', 9001); await batchRow('nl-b2', 9002)
    const k = key('nullkey')
    await fileRow('nl-f1', 'nl-b1', null, k)
    await fileRow('nl-f2', 'nl-b2', null, k) // MySQL: any number of NULLs in a unique index
    expect(await models.UploadBatchFile.count({ where: { client_key: k } })).toBe(2)
  })

  test('giving a NULL row a unit that already uses the key is refused; a free unit is fine', async () => {
    const k = key('nullkey2')
    await batchRow('nl-b3', 9003); await batchRow('nl-b4', 9003)
    await fileRow('nl-f3', 'nl-b3', 9003, k)
    await fileRow('nl-f4', 'nl-b4', null, k)
    await expect(models.UploadBatchFile.update({ chapter_id: 9003 }, { where: { id: 'nl-f4' } })).rejects.toThrow(Sequelize.UniqueConstraintError)
    await expect(models.UploadBatchFile.update({ chapter_id: 9004 }, { where: { id: 'nl-f4' } })).resolves.toBeDefined()
  })

  test('the 0006 duplicate pre-check ignores NULL chapter_id rows (so production NULL rows cannot block the migration)', async () => {
    const [dups] = await sequelize.query('SELECT chapter_id, client_key, COUNT(*) n FROM UploadBatchFiles WHERE chapter_id IS NOT NULL GROUP BY chapter_id, client_key HAVING COUNT(*) > 1')
    expect(dups).toHaveLength(0)
    const [[nulls]] = await sequelize.query('SELECT COUNT(*) n FROM UploadBatchFiles WHERE chapter_id IS NULL')
    expect(Number(nulls.n)).toBeGreaterThanOrEqual(2)
  })
})

suite('MySQL 8: interrupted migration 0006 (DDL is not transactional)', () => {
  const qi = () => sequelize.getQueryInterface()
  const up = (queryInterface = qi()) => require('../db/migrations/0006_upload_journal').up({ sequelize, queryInterface, models })
  const oldShape = async () => {
    await sequelize.query('DROP TABLE IF EXISTS UploadBatchFiles')
    await sequelize.query("CREATE TABLE UploadBatchFiles (id VARCHAR(36) PRIMARY KEY, batch_id VARCHAR(36) NOT NULL, client_key VARCHAR(64) NOT NULL, original_name VARCHAR(255) NOT NULL, expected_size BIGINT NOT NULL, status VARCHAR(12) NOT NULL DEFAULT 'pending', error VARCHAR(255), stored_size BIGINT, attempts INTEGER NOT NULL DEFAULT 0, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL) ENGINE=InnoDB")
    await sequelize.query('CREATE UNIQUE INDEX upload_batch_files_batch_id_client_key ON UploadBatchFiles (batch_id, client_key)')
  }
  const seed = (id, batch, k) => sequelize.query('INSERT INTO UploadBatchFiles (id, batch_id, client_key, original_name, expected_size, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())', { replacements: [id, batch, k, 'v.mp4'] })
  const shape = async () => {
    const [cols] = await sequelize.query("SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'UploadBatchFiles' ORDER BY COLUMN_NAME")
    const [idx] = await sequelize.query("SELECT INDEX_NAME i, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) c, MIN(NON_UNIQUE) u FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'UploadBatchFiles' GROUP BY INDEX_NAME ORDER BY INDEX_NAME")
    return { cols: cols.map((x) => x.c), idx: idx.map((x) => `${x.i}:${x.c}:${x.u}`) }
  }
  afterAll(async () => { await models.UploadBatchFile.sync({ force: true }) }) // restore the model shape for the suites that follow

  test('killed after the columns were added and before the index: columns stay, no data lost, the rerun finishes and matches a clean run', async () => {
    await models.UploadBatch.destroy({ where: {} })
    await models.UploadBatch.create({ id: 'im-1', batch_key: 'bk-im-1-aaaa', chapter_id: 71, user_id: 1 })
    await oldShape(); await seed('i1', 'im-1', 'key-im-aaaa'); await seed('i2', 'im-1', 'key-im-bbbb')
    const crashing = Object.create(qi())
    crashing.addIndex = async () => { throw new Error('connection lost (simulated)') }
    await expect(up(crashing)).rejects.toThrow('connection lost')
    let mid = await shape()
    expect(mid.cols).toEqual(expect.arrayContaining(['chapter_id', 'position', 'fingerprint', 'last_modified', 'stored_path', 'content_sha256'])) // MySQL committed each ALTER
    expect(mid.idx.some((i) => i.startsWith('upload_batch_files_chapter_key'))).toBe(false)
    expect((await sequelize.query('SELECT COUNT(*) n FROM UploadBatchFiles'))[0][0].n).toBe(2)
    await up()
    const after = await shape()
    expect(after.idx).toEqual(expect.arrayContaining(['upload_batch_files_chapter_key:chapter_id,client_key:0']))
    const [rows] = await sequelize.query('SELECT id, chapter_id FROM UploadBatchFiles ORDER BY id')
    expect(rows).toEqual([{ id: 'i1', chapter_id: 71 }, { id: 'i2', chapter_id: 71 }])
    await up() // a third run changes nothing
    expect(await shape()).toEqual(after)
    await models.UploadBatchFile.sync({ force: true })
    const clean = await shape()
    expect(after.cols).toEqual(clean.cols)
  })

  test('refuses (changes nothing more) when a unit already uses a key twice, and runs once the duplicate is fixed', async () => {
    await oldShape()
    await models.UploadBatch.destroy({ where: {} })
    await models.UploadBatch.create({ id: 'im-2', batch_key: 'bk-im-2-aaaa', chapter_id: 72, user_id: 1 })
    await models.UploadBatch.create({ id: 'im-3', batch_key: 'bk-im-3-aaaa', chapter_id: 72, user_id: 2 })
    await seed('d1', 'im-2', 'same-key-dddd'); await seed('d2', 'im-3', 'same-key-dddd')
    await expect(up()).rejects.toThrow(/used twice inside one unit/)
    expect((await shape()).idx.some((i) => i.startsWith('upload_batch_files_chapter_key'))).toBe(false)
    expect((await sequelize.query('SELECT COUNT(*) n FROM UploadBatchFiles'))[0][0].n).toBe(2)
    await sequelize.query("UPDATE UploadBatchFiles SET client_key = 'fixed-key-dddd' WHERE id = 'd2'")
    await up()
    expect((await shape()).idx.some((i) => i.startsWith('upload_batch_files_chapter_key'))).toBe(true)
  })

  test('migrate() applies 0001..0007 in order on an empty MySQL database and a second run applies nothing', async () => {
    const { wipeDb } = require('./helpers')
    const { migrate, listMigrationFiles } = require('../db/migrate')
    await wipeDb()
    const ran = await migrate()
    expect(ran).toEqual(listMigrationFiles())
    expect(await migrate()).toEqual([])
    // the database was wiped: recreate the synthetic user and course the later suites use
    await resetDb()
    instructor = await makeUser('teach2@example.com', 'instructor')
    course = await models.Course.create({ title: 'C2', price: 0, added_by: instructor.user.id, updated_by: instructor.user.id })
  }, 120000)
})

suite('MySQL 8: rollback and cleanup', () => {
  test('a transaction that fails after writing the chapter AND the batch row rolls both back and releases its lock', async () => {
    const c = await newChapter('Rb')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    await expect(withChapter(c.id, async ({ chapter, files, transaction }) => {
      chapter.chapter_files = JSON.stringify([...files, { n: 1 }])
      await chapter.save({ transaction })
      await models.UploadBatchFile.update({ status: 'done' }, { where: { id: b.files[0].id }, transaction })
      throw new Error('boom')
    })).rejects.toThrow('boom')
    expect(await list(c.id)).toHaveLength(0)
    expect((await models.UploadBatchFile.findByPk(b.files[0].id)).status).toBe('pending')
    await expect(nowait(c.id)).resolves.toBeDefined()
  })

  test('a database failure while registering: no done row, no listed file, no stray copy, no leftover lock; the retry succeeds', async () => {
    const c = await newChapter('Rb2')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const before = common().length
    const spy = jest.spyOn(models.Chapter.prototype, 'save').mockRejectedValueOnce(new Error('db went away'))
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    let res
    try { res = await sendFile(b.id, b.files[0].id) } finally { spy.mockRestore(); errors.mockRestore() }
    expect(res.status).toBe(500)
    expect((await models.UploadBatchFile.findByPk(b.files[0].id)).status).toBe('failed')
    expect(await list(c.id)).toHaveLength(0)
    expect(common().length).toBe(before)
    await expect(nowait(c.id)).resolves.toBeDefined()
    expect((await sendFile(b.id, b.files[0].id)).status).toBe(200)
    expect(common().length).toBe(before + 1)
    await remember(c.id)
  })

  test('a file moved but never registered is adopted by the retry (no second copy)', async () => {
    const c = await newChapter('Adopt')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const bytes = mp4(7)
    const plan = planMediaFile({ name: 'v.mp4' }, 0)
    fs.writeFileSync(absolutePath(plan.filepath), bytes)
    await models.UploadBatchFile.update({ status: 'uploading', stored_path: plan.filepath, content_sha256: sha(bytes), attempts: 1 }, { where: { id: b.files[0].id } })
    const before = common().length
    const res = await sendFile(b.id, b.files[0].id, bytes)
    expect(res.status).toBe(200)
    expect((await list(c.id))[0].filepath).toBe(plan.filepath)
    expect(common().length).toBe(before)
    await remember(c.id)
  })

  test('a retry with different bytes does not adopt the stale copy and removes it', async () => {
    const c = await newChapter('NoAdopt')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const plan = planMediaFile({ name: 'v.mp4' }, 0)
    fs.writeFileSync(absolutePath(plan.filepath), mp4(1))
    await models.UploadBatchFile.update({ status: 'uploading', stored_path: plan.filepath, content_sha256: sha(mp4(1)) }, { where: { id: b.files[0].id } })
    expect((await sendFile(b.id, b.files[0].id, mp4(2))).status).toBe(200)
    expect((await list(c.id))[0].filepath).not.toBe(plan.filepath)
    await new Promise((r) => setTimeout(r, 150))
    expect(fs.existsSync(path.join(ROOT, plan.filepath))).toBe(false)
    await remember(c.id)
  })

  test('reconcile (aged row): deletes a journaled orphan, never a file a chapter lists', async () => {
    const c = await newChapter('Rec')
    const bOrphan = (await createBatch(c.id, manifest(1))).body.batch
    const bOk = (await createBatch(c.id, manifest(1))).body.batch
    expect((await sendFile(bOk.id, bOk.files[0].id)).status).toBe(200)
    await remember(c.id)
    const [kept] = await list(c.id)
    const plan = planMediaFile({ name: 'v.mp4' }, 0)
    fs.writeFileSync(absolutePath(plan.filepath), mp4(3))
    await models.UploadBatchFile.update({ status: 'uploading', stored_path: plan.filepath, content_sha256: sha(mp4(3)) }, { where: { id: bOrphan.files[0].id } })
    await sequelize.query('UPDATE UploadBatchFiles SET updatedAt = ? WHERE id = ?', { replacements: [new Date(Date.now() - 24 * 3600 * 1000), bOrphan.files[0].id] })
    const dry = await reconcileUploads({ apply: false })
    expect(dry.orphansFound).toBeGreaterThanOrEqual(1)
    expect(fs.existsSync(absolutePath(plan.filepath))).toBe(true)
    await reconcileUploads({ apply: true })
    expect(fs.existsSync(path.join(ROOT, plan.filepath))).toBe(false)
    expect(fs.existsSync(path.join(ROOT, kept.filepath))).toBe(true)
    expect((await models.UploadBatchFile.findByPk(bOrphan.files[0].id)).status).toBe('failed')
  })
})
