/* M2 (stale edit forms), M3 (file identity), M4 (crash safety / journal / reconcile) and the stronger file check. */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const { deleteFile, planMediaFile } = require('../middlewares/commonFileUploader')
const { parseFiles } = require('../services/chapterFiles')
const { fingerprintFile, reconcileUploads, absolutePath } = require('../services/uploadJournal')

const ROOT = path.join(__dirname, '..', 'files')
const mp4 = (fill = 0) => Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(32, fill)])
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex')
let http, instructor, other, admin, course
const created = new Set()
let seq = 0
const key = (p) => `${p}-${Date.now()}-${++seq}`.slice(0, 60)

const as = (u) => ({ ...MOBILE, ...u.auth })
const newChapter = (title = 'U') => models.Chapter.create({ title, price: 0, course_parent_id: course.id, added_by: instructor.user.id, updated_by: instructor.user.id })
const manifest = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ client_key: key('k'), name: `v${i}.mp4`, size: mp4().length, ...extra }))
const createBatch = (id, files, batch_key = key('b'), user = instructor) => http.post(`/api/chapters/${id}/batches`).set(as(user)).send({ batch_key, files })
const sendFile = (batchId, fileId, bytes = mp4(), name = 'v.mp4', user = instructor) =>
  http.post(`/api/chapters/batches/${batchId}/files/${fileId}`).set(as(user)).attach('chapter_file', bytes, name)
const list = async (id) => parseFiles((await models.Chapter.findByPk(id)).chapter_files)
const onDisk = (p) => fs.existsSync(path.join(ROOT, p))
const common = () => fs.readdirSync(path.join(ROOT, 'uploads', 'common')).filter((n) => n.startsWith('file_'))
const remember = async (id) => { for (const f of await list(id)) created.add(f.filepath) }

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  instructor = await makeUser('teach@example.com', 'instructor')
  other = await makeUser('other@example.com', 'instructor')
  admin = await makeUser('boss@example.com', 'admin')
  course = await models.Course.create({ title: 'C', price: 0, added_by: instructor.user.id, updated_by: instructor.user.id })
})
afterAll(async () => { for (const p of created) await deleteFile(p) })

describe('M2: an old edit form cannot remove uploaded files', () => {
  test('the form opened before a batch finished is submitted afterwards: nothing is lost, files stay playable', async () => {
    const c = await newChapter('Stale')
    const staleForm = JSON.stringify(await list(c.id)) // 1. form opened: no files
    const b = (await createBatch(c.id, manifest(2))).body.batch // 2. files uploaded through another request
    for (const f of b.files) expect((await sendFile(b.id, f.id)).status).toBe(200)
    expect((await http.get(`/api/chapters/batches/${b.id}`).set(as(instructor))).body.batch.status).toBe('completed') // 3. completed
    const res = await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _title: 'Renamed', _chapter_files: staleForm }) // 4. old form
    expect(res.body.message).toBe('Successfully Updated')
    expect(res.body.kept_files).toBe(2)
    const after = await list(c.id)
    expect(after).toHaveLength(2) // 5.
    for (const f of after) expect(onDisk(f.filepath)).toBe(true)
    const play = await http.get(`/uploads/common/${path.basename(after[0].filepath)}`).set(MOBILE)
    expect(play.status).not.toBe(404)
    await remember(c.id)
  })

  test('an unfinished batch is protected as well, and so are files from the older per-file route', async () => {
    const c = await newChapter('Unfinished')
    const b = (await createBatch(c.id, manifest(3))).body.batch
    await sendFile(b.id, b.files[0].id)
    await http.post(`/api/chapters/${c.id}/files`).set(as(instructor)).field('upload_key', key('legacy')).attach('chapter_file', mp4(9), 'v.mp4')
    await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _title: 'X', _chapter_files: '[]' })
    expect(await list(c.id)).toHaveLength(2)
    await remember(c.id)
  })

  test('leaving a file out of the form never deletes it; only the explicit removal list does', async () => {
    const c = await newChapter('Explicit')
    const b = (await createBatch(c.id, manifest(3))).body.batch
    for (const f of b.files) await sendFile(b.id, f.id, mp4(b.files.indexOf(f) + 1))
    const [first, second, third] = await list(c.id)
    await remember(c.id)
    // the form lists only the first file, but removes nothing explicitly
    await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _chapter_files: JSON.stringify([first]) })
    expect(await list(c.id)).toHaveLength(3)
    // explicit removal of one file
    const res = await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _chapter_files: JSON.stringify([first, second, third]), _removed_files: JSON.stringify([second.filepath]) })
    expect(res.body.message).toBe('Successfully Updated')
    expect((await list(c.id)).map((f) => f.filepath)).toEqual([first.filepath, third.filepath])
    await new Promise((r) => setTimeout(r, 100))
    expect(onDisk(second.filepath)).toBe(false)
    expect(onDisk(first.filepath)).toBe(true)
  })

  test('the form can reorder files it knows about, and unknown paths in it are ignored', async () => {
    const c = await newChapter('Order')
    const b = (await createBatch(c.id, manifest(2))).body.batch
    await sendFile(b.id, b.files[0].id, mp4(1)); await sendFile(b.id, b.files[1].id, mp4(2))
    const [a, bb] = await list(c.id)
    await remember(c.id)
    await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _chapter_files: JSON.stringify([bb, { filepath: '/uploads/users/secret.png' }, a]) })
    expect((await list(c.id)).map((f) => f.filepath)).toEqual([bb.filepath, a.filepath])
  })

  test('DELETE /:id/files removes one file of THIS unit; a path from another unit or outside the list is refused and untouched', async () => {
    const c1 = await newChapter('Del1'); const c2 = await newChapter('Del2')
    for (const c of [c1, c2]) {
      const b = (await createBatch(c.id, manifest(1))).body.batch
      await sendFile(b.id, b.files[0].id, mp4(c.id % 200))
      await remember(c.id)
    }
    const [f1] = await list(c1.id); const [f2] = await list(c2.id)
    const wrongUnit = await http.delete(`/api/chapters/${c1.id}/files`).set(as(instructor)).send({ filepath: f2.filepath })
    expect(wrongUnit.status).toBe(404)
    expect(onDisk(f2.filepath)).toBe(true)
    expect((await http.delete(`/api/chapters/${c1.id}/files`).set(as(instructor)).send({ filepath: '/uploads/users/profile/x.png' })).status).toBe(404)
    expect((await http.delete(`/api/chapters/${c1.id}/files`).set(as(other)).send({ filepath: f1.filepath })).status).toBe(401) // not their unit
    expect((await http.delete(`/api/chapters/${c1.id}/files`).set(as(instructor)).send({})).status).toBe(400)
    const ok = await http.delete(`/api/chapters/${c1.id}/files`).set(as(instructor)).send({ filepath: f1.filepath })
    expect(ok.status).toBe(200)
    expect(await list(c1.id)).toHaveLength(0)
    expect(await list(c2.id)).toHaveLength(1)
  })

  test('a removal name that is not in the list deletes nothing on disk', async () => {
    const c = await newChapter('Bogus')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    await sendFile(b.id, b.files[0].id)
    const [f] = await list(c.id); await remember(c.id)
    const [elsewhere] = await list((await models.Chapter.findOne({ where: { title: 'Del2' } })).id)
    await http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _removed_files: JSON.stringify([elsewhere.filepath, '../../etc/passwd']) })
    expect(onDisk(elsewhere.filepath)).toBe(true)
    expect(onDisk(f.filepath)).toBe(true)
  })

  test('two edits at once: files survive', async () => {
    const c = await newChapter('TwoEdits')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    await sendFile(b.id, b.files[0].id)
    await remember(c.id)
    await Promise.all([1, 2, 3].map((n) => http.put('/api/chapters').set(as(instructor)).send({ id: c.id, _title: `T${n}`, _chapter_files: '[]' })))
    expect(await list(c.id)).toHaveLength(1)
  })
})

describe('M3: a file is identified by the server, not by a reusable key', () => {
  test('a key already used in this unit cannot be reused by another batch', async () => {
    const c = await newChapter('Keys')
    const files = manifest(1)
    const first = await createBatch(c.id, files)
    expect(first.status).toBe(200)
    const second = await createBatch(c.id, files, key('b')) // a different batch, same file key
    expect(second.status).toBe(409)
    expect(await models.UploadBatch.count({ where: { chapter_id: c.id } })).toBe(1)
  })

  test('the same key in another unit or by another user is independent, and completing one never completes the other', async () => {
    const c1 = await newChapter('KeyA'); const c2 = await newChapter('KeyB')
    const files = manifest(1)
    const a = (await createBatch(c1.id, files)).body.batch
    const b = (await createBatch(c2.id, files)).body.batch
    const adm = (await createBatch(c2.id, files, key('b'), admin))
    expect(adm.status).toBe(409) // same unit as b: still refused, whoever asks
    await sendFile(b.id, b.files[0].id)
    expect((await models.UploadBatchFile.findByPk(a.files[0].id)).status).toBe('pending')
    expect((await http.get(`/api/chapters/batches/${a.id}`).set(as(instructor))).body.batch.status).toBe('in_progress')
    await remember(c2.id)
  })

  test('a chapter entry that merely carries a matching key (old scheme or another row) does not complete a row', async () => {
    const c = await newChapter('Forged')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const row = b.files[0]
    await c.update({ chapter_files: JSON.stringify([
      { filename: 'x.mp4', size: 1, filepath: '/uploads/common/file_deadbeef0_1--x', upload_key: row.client_key },
      { filename: 'y.mp4', size: 1, filepath: '/uploads/common/file_deadbeef1_1--y', upload_key: 'b:some-other-row', batch_file_id: 'some-other-row' },
    ]) })
    const res = await sendFile(b.id, row.id)
    expect(res.status).toBe(200)
    expect(res.body.duplicate).toBeUndefined() // it was really stored, not "found"
    const mine = (await list(c.id)).filter((f) => f.batch_file_id === row.id)
    expect(mine).toHaveLength(1)
    expect(mine[0].upload_key).toBe(`b:${row.id}`)
    await remember(c.id)
  })

  test('the identity written on a chapter entry is the server-made row id', async () => {
    const c = await newChapter('Identity')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    await sendFile(b.id, b.files[0].id)
    const [entry] = await list(c.id)
    expect(entry.upload_key).toBe(`b:${b.files[0].id}`)
    expect(entry.batch_id).toBe(b.id)
    await remember(c.id)
  })

  test('two different files with the same name and size are told apart by their fingerprint', async () => {
    const c = await newChapter('Twins')
    const fileA = mp4(1); const fileB = mp4(2)
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'fp-'))
    fs.writeFileSync(path.join(dir, 'a'), fileA); fs.writeFileSync(path.join(dir, 'b'), fileB)
    const fa = await fingerprintFile(path.join(dir, 'a'), fileA.length)
    const fb = await fingerprintFile(path.join(dir, 'b'), fileB.length)
    expect(fa).not.toBe(fb)
    expect(fa).toMatch(/^[a-f0-9]{64}$/)
    fs.rmSync(dir, { recursive: true, force: true })
    const b = (await createBatch(c.id, [
      { client_key: key('k'), name: 'same.mp4', size: fileA.length, fingerprint: fa },
      { client_key: key('k'), name: 'same.mp4', size: fileB.length, fingerprint: fb },
    ])).body.batch
    // sending B's bytes to A's row is refused; the right bytes are accepted
    const wrong = await sendFile(b.id, b.files[0].id, fileB, 'same.mp4')
    expect(wrong.status).toBe(400)
    expect(wrong.body.message).toMatch(/not the file that was selected/)
    expect(wrong.body.batch.files[0].status).toBe('failed')
    expect((await sendFile(b.id, b.files[0].id, fileA, 'same.mp4')).status).toBe(200)
    expect((await sendFile(b.id, b.files[1].id, fileB, 'same.mp4')).status).toBe(200)
    await remember(c.id)
  })

  test('the fingerprint matches what the browser computes (size, first 64 KiB, last 64 KiB)', async () => {
    const big = Buffer.alloc(200 * 1024)
    for (let i = 0; i < big.length; i++) big[i] = i % 251
    const file = path.join(require('os').tmpdir(), `fp-${Date.now()}`)
    fs.writeFileSync(file, big)
    const expected = crypto.createHash('sha256').update(`${big.length}:`).update(big.subarray(0, 65536)).update(big.subarray(big.length - 65536)).digest('hex')
    expect(await fingerprintFile(file, big.length)).toBe(expected)
    fs.rmSync(file)
  })
})

describe('M4: crash windows and recovery', () => {
  test('a failed database write leaves no "done" row, no listed file and no stray copy; the retry then succeeds', async () => {
    const c = await newChapter('DbFail')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const before = common().length
    const spy = jest.spyOn(models.Chapter.prototype, 'save').mockRejectedValueOnce(new Error('db went away'))
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    let res
    try { res = await sendFile(b.id, b.files[0].id) } finally { spy.mockRestore(); errors.mockRestore() }
    expect(res.status).toBe(500)
    const row = await models.UploadBatchFile.findByPk(b.files[0].id)
    expect(row.status).toBe('failed')
    expect(await list(c.id)).toHaveLength(0)
    expect(common().length).toBe(before)
    const retry = await sendFile(b.id, b.files[0].id)
    expect(retry.status).toBe(200)
    expect(common().length).toBe(before + 1)
    await remember(c.id)
  })

  test('a crash after the file was moved but before it was registered: the retry adopts the file, no second copy', async () => {
    const c = await newChapter('Adopt')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const bytes = mp4(7)
    // simulate the dead process: journal written, file moved, nothing registered
    const plan = planMediaFile({ name: 'v.mp4' }, 0)
    fs.writeFileSync(absolutePath(plan.filepath), bytes)
    await models.UploadBatchFile.update({ status: 'uploading', stored_path: plan.filepath, content_sha256: sha(bytes), attempts: 1 }, { where: { id: b.files[0].id } })
    const before = common().length
    const res = await sendFile(b.id, b.files[0].id, bytes)
    expect(res.status).toBe(200)
    const [entry] = await list(c.id)
    expect(entry.filepath).toBe(plan.filepath)
    expect(common().length).toBe(before) // nothing new was stored
    expect(res.body.batch.status).toBe('completed')
    await remember(c.id)
  })

  test('a retry with different bytes does not adopt the old orphan and removes it', async () => {
    const c = await newChapter('NoAdopt')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    const plan = planMediaFile({ name: 'v.mp4' }, 0)
    fs.writeFileSync(absolutePath(plan.filepath), mp4(1))
    await models.UploadBatchFile.update({ status: 'uploading', stored_path: plan.filepath, content_sha256: sha(mp4(1)) }, { where: { id: b.files[0].id } })
    const res = await sendFile(b.id, b.files[0].id, mp4(2))
    expect(res.status).toBe(200)
    const [entry] = await list(c.id)
    expect(entry.filepath).not.toBe(plan.filepath)
    await new Promise((r) => setTimeout(r, 100))
    expect(onDisk(plan.filepath)).toBe(false)
    await remember(c.id)
  })

  test('re-sending a finished file stores nothing and never deletes the valid video', async () => {
    const c = await newChapter('Resend')
    const b = (await createBatch(c.id, manifest(1))).body.batch
    await sendFile(b.id, b.files[0].id)
    const [entry] = await list(c.id); await remember(c.id)
    const before = common().length
    for (let i = 0; i < 3; i++) expect((await sendFile(b.id, b.files[0].id)).body.duplicate).toBe(true)
    expect(common().length).toBe(before)
    expect(onDisk(entry.filepath)).toBe(true)
    expect(await list(c.id)).toHaveLength(1)
  })

  describe('reconcile', () => {
    const stale = (id) => models.sequelize ? null : null
    const age = (id) => require('../database').query('UPDATE UploadBatchFiles SET updatedAt = ? WHERE id = ?', { replacements: [new Date(Date.now() - 24 * 3600 * 1000), id] })

    test('reports a journaled orphan without touching it, then deletes it when applied; referenced files and unknown files stay', async () => {
      const c = await newChapter('Rec')
      const b = (await createBatch(c.id, manifest(2))).body.batch
      await sendFile(b.id, b.files[0].id)
      const [listed] = await list(c.id); await remember(c.id)
      // orphan of the second file
      const plan = planMediaFile({ name: 'v.mp4' }, 1)
      fs.writeFileSync(absolutePath(plan.filepath), mp4(5))
      await models.UploadBatchFile.update({ status: 'uploading', stored_path: plan.filepath, content_sha256: sha(mp4(5)) }, { where: { id: b.files[1].id } })
      await age(b.files[1].id)
      // a file nobody journaled (could belong to anything)
      const stranger = planMediaFile({ name: 'q.mp4' }, 9)
      fs.writeFileSync(absolutePath(stranger.filepath), mp4(6)); created.add(stranger.filepath)

      const dry = await reconcileUploads({ apply: false })
      expect(dry.orphansFound).toBe(1)
      expect(onDisk(plan.filepath)).toBe(true)

      const done = await reconcileUploads({ apply: true })
      expect(done.orphansDeleted).toBe(1)
      await new Promise((r) => setTimeout(r, 100))
      expect(onDisk(plan.filepath)).toBe(false)
      expect(onDisk(listed.filepath)).toBe(true)
      expect(onDisk(stranger.filepath)).toBe(true)
      const row = await models.UploadBatchFile.findByPk(b.files[1].id)
      expect(row.status).toBe('failed')
      expect(row.stored_path).toBeNull()
      // the failed row can be sent again
      expect((await sendFile(b.id, b.files[1].id, mp4(0))).status).toBe(200)
      await remember(c.id)
    })

    test('a journaled path that a chapter lists is never deleted; the row is finished instead', async () => {
      const c = await newChapter('Rec2')
      const b = (await createBatch(c.id, manifest(1))).body.batch
      await sendFile(b.id, b.files[0].id)
      const [listed] = await list(c.id); await remember(c.id)
      await models.UploadBatchFile.update({ status: 'uploading', stored_path: listed.filepath }, { where: { id: b.files[0].id } })
      await age(b.files[0].id)
      const rep = await reconcileUploads({ apply: true })
      expect(rep.orphansDeleted).toBe(0)
      expect(rep.registered).toBeGreaterThanOrEqual(1)
      expect(onDisk(listed.filepath)).toBe(true)
      expect((await models.UploadBatchFile.findByPk(b.files[0].id)).status).toBe('done')
    })

    test('a path shared with another user\'s finished row is skipped, and recent rows are left alone', async () => {
      const c = await newChapter('Rec3')
      const b = (await createBatch(c.id, manifest(1))).body.batch
      const plan = planMediaFile({ name: 'v.mp4' }, 2)
      fs.writeFileSync(absolutePath(plan.filepath), mp4(8)); created.add(plan.filepath)
      await models.UploadBatchFile.update({ status: 'uploading', stored_path: plan.filepath }, { where: { id: b.files[0].id } })
      const recent = await reconcileUploads({ apply: true })
      expect(recent.examined).toBe(0)
      expect(onDisk(plan.filepath)).toBe(true)
      // mark another finished row as owner of the same path, then age the first
      const c2 = await newChapter('Rec3b')
      const b2 = (await createBatch(c2.id, manifest(1))).body.batch
      await models.UploadBatchFile.update({ status: 'done', stored_path: plan.filepath }, { where: { id: b2.files[0].id } })
      await age(b.files[0].id)
      const rep = await reconcileUploads({ apply: true })
      expect(rep.orphansDeleted).toBe(0)
      expect(onDisk(plan.filepath)).toBe(true)
    })
  })
})
