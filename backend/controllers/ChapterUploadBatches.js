/* Persistent, recoverable multi-file uploads for a unit (chapter).
 *
 *   POST /api/chapters/:id/batches                         create (or fetch again) the batch for one Submit
 *   GET  /api/chapters/batches/active                      my batches whose result I have not acknowledged yet
 *   GET  /api/chapters/batches/:batchId                    status of one batch (owner or administrator)
 *   POST /api/chapters/batches/:batchId/files/:fileId      one file; safe to repeat
 *   POST /api/chapters/batches/:batchId/acknowledge        "I have seen the result"
 *
 * What this does and does not give you (kept honest on purpose):
 *   - batch recovery   the server remembers every file of the batch and its state across refreshes, closed browsers and
 *                      new sign-ins. Done files are never sent or stored again.
 *   - file retry       a failed or interrupted file is selected again and sent from its first byte.
 *   - NOT byte-offset resume: a transfer cut in the middle starts over from zero.
 *
 * The database is the authority. A file counts as uploaded only when its row says `done`, and `done` is written in the
 * same transaction that lists the file in the chapter (see services/uploadJournal.js for the crash windows). A repeated
 * request for a `done` file is answered from the row and stores nothing. Identity of a file inside a chapter is the
 * server-made row id ('b:<id>' on the chapter entry), never the browser's key, name or size alone. */
const crypto = require('crypto')
const express = require('express')
const { Op, UniqueConstraintError } = require('sequelize')
const route = express.Router()
const Chapter = require('../models/Chapter')
const { UploadBatch, UploadBatchFile } = require('../models/UploadBatch')
const verifyRoles = require('../middlewares/verifyRoles')
const Roles = require('../roles')
const config = require('../config')
const { requireChapterAccess, canManageChapter, canManageAll } = require('../services/courseAccess')
const { storeMediaFile, planMediaFile, deleteFile } = require('../middlewares/commonFileUploader')
const { UploadError, KINDS, validateFile } = require('../middlewares/safeUpload')
const { withChapter, inTransaction, parseFiles } = require('../services/chapterFiles')
const { fingerprintFile, exists: storedFileExists, sizeOnDisk } = require('../services/uploadJournal')
const fs = require('fs')

const KEY = /^[A-Za-z0-9_-]{8,64}$/
const FINGERPRINT = /^[a-f0-9]{64}$/
const RECENT_MS = 14 * 24 * 60 * 60 * 1000
const uuid = () => crypto.randomUUID()
const removeTemp = (file) => { if (file?.tempFilePath) fs.unlink(file.tempFilePath, () => {}) }
const ext = (name) => { const m = /\.[^./\\]+$/.exec(String(name || '').toLowerCase()); return m ? m[0] : '' }
const entryKey = (row) => `b:${row.id}`

/* file states -> batch status. `in_progress` while anything is still to be sent. */
const deriveStatus = (files) => {
  const done = files.filter((f) => f.status === 'done').length
  const failed = files.filter((f) => f.status === 'failed').length
  if (files.length > 0 && done === files.length) return 'completed'
  if (done + failed < files.length) return 'in_progress'
  return done > 0 ? 'partial' : 'failed'
}

const serialize = (batch, files) => {
  const bytes = (list) => list.reduce((n, f) => n + Number(f.expected_size), 0)
  const done = files.filter((f) => f.status === 'done')
  return {
    id: batch.id,
    chapter_id: batch.chapter_id,
    status: deriveStatus(files),
    acknowledged: !!batch.acknowledged_at,
    created_at: batch.createdAt,
    updated_at: batch.updatedAt,
    total_files: files.length,
    done_files: done.length,
    failed_files: files.filter((f) => f.status === 'failed').length,
    pending_files: files.filter((f) => f.status === 'pending' || f.status === 'uploading').length,
    total_bytes: bytes(files),
    done_bytes: bytes(done),
    files: files.map((f) => ({
      id: f.id, client_key: f.client_key, name: f.original_name, size: Number(f.expected_size),
      fingerprint: f.fingerprint || null, last_modified: f.last_modified == null ? null : Number(f.last_modified),
      status: f.status, error: f.error || null, attempts: f.attempts,
    })),
  }
}

const loadFiles = (batchId, options = {}) => UploadBatchFile.findAll({ where: { batch_id: batchId }, order: [['position', 'ASC'], ['createdAt', 'ASC'], ['id', 'ASC']], ...options })

const load = async (batchId) => {
  const batch = await UploadBatch.findOne({ where: { id: String(batchId) } })
  if (!batch) return {}
  return { batch, files: await loadFiles(batch.id) }
}

/* Keeps the stored status and updatedAt in step with the files. */
const touch = async (batch, files) => {
  batch.status = deriveStatus(files)
  batch.changed('updatedAt', true)
  await batch.save()
}

/* Owner, or an administrator; and the person must still be allowed to manage the unit. */
const authorise = async (req, res, batch) => {
  if (!batch || (batch.user_id !== req.user.id && !canManageAll(req.user))) {
    res.status(404).json({ error: true, message: 'Upload batch not found' }) // does not reveal other people's batches
    return false
  }
  if (!(await canManageChapter(req.user, batch.chapter_id))) {
    res.status(401).json({ error: true, message: 'You are not assigned to this course' })
    return false
  }
  return true
}

route.get('/upload-limits', verifyRoles(Roles?.chapter_saveRoles), (req, res) => {
  res.json({
    maxFilesPerUnit: config.upload.maxFilesPerUnit,
    maxFileBytes: config.upload.maxFileBytes,
    maxBatchBytes: null, // files are sent one request each, so there is no combined request size
    allowedExtensions: KINDS.media.extensions,
    videoExtensions: ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.wmv', '.flv'],
  })
})

/* Validates the manifest sent by the browser. Returns { rows } or { error }. */
const readManifest = (input) => {
  if (!Array.isArray(input) || input.length === 0) return { error: 'Select at least one file' }
  const seen = new Set()
  const rows = []
  for (const item of input) {
    const key = String(item?.client_key || '')
    const name = String(item?.name || '')
    const size = Number(item?.size)
    if (!KEY.test(key) || seen.has(key)) return { error: 'Every file needs its own valid key' }
    seen.add(key)
    if (!name || name.length > 255) return { error: 'Invalid file name' }
    if (!KINDS.media.extensions.includes(ext(name))) return { error: `This file type is not allowed: ${name}` }
    if (!Number.isFinite(size) || size <= 0) return { error: `Invalid size for ${name}` }
    if (size > config.upload.maxFileBytes) return { error: `${name} is larger than the ${config.upload.maxFileBytes} byte limit per file` }
    const fingerprint = item?.fingerprint == null ? null : String(item.fingerprint)
    if (fingerprint !== null && !FINGERPRINT.test(fingerprint)) return { error: `Invalid fingerprint for ${name}` }
    const modified = item?.last_modified == null ? null : Number(item.last_modified)
    if (modified !== null && !Number.isFinite(modified)) return { error: `Invalid modification time for ${name}` }
    rows.push({ position: rows.length, client_key: key, original_name: name, expected_size: size, fingerprint, last_modified: modified === null ? null : Math.round(modified) })
  }
  return { rows }
}

/* Answers for a batch that already exists for this user and key. If an interrupted creation left it without (all of)
 * its file rows, the missing ones are added now from the manifest the browser sent again, so the batch is never stuck. */
const respondExisting = async (res, existing, chapterId, manifestRows) => {
  if (String(existing.chapter_id) !== String(chapterId)) return res.status(409).json({ error: true, message: 'This batch key belongs to another unit' })
  let files = await loadFiles(existing.id)
  let repaired = false
  if (files.length < existing.total_files && manifestRows && manifestRows.length === existing.total_files) {
    const have = new Set(files.map((f) => f.client_key))
    const missing = manifestRows.filter((r) => !have.has(r.client_key))
    try {
      await inTransaction((transaction) => UploadBatchFile.bulkCreate(missing.map((r) => ({ ...r, id: uuid(), batch_id: existing.id, chapter_id: existing.chapter_id })), { transaction }))
      repaired = missing.length > 0
    } catch (e) {
      if (!(e instanceof UniqueConstraintError)) throw e // a parallel repair or a key used elsewhere in the unit: fall through to what exists
    }
    files = await loadFiles(existing.id)
  }
  return res.json({ batch: serialize(existing, files), existing: true, repaired })
}

route.post('/:id/batches', verifyRoles(Roles?.chapter_saveRoles), requireChapterAccess((req) => req.params?.id), async (req, res) => {
  try {
    const batchKey = String(req.body?.batch_key || '')
    if (!KEY.test(batchKey)) return res.status(400).json({ error: true, message: 'Missing or invalid batch key' })
    const manifest = readManifest(req.body?.files)
    if (manifest.error) return res.status(400).json({ error: true, message: manifest.error })

    const existing = await UploadBatch.findOne({ where: { user_id: req.user.id, batch_key: batchKey } })
    if (existing) return await respondExisting(res, existing, req.params.id, manifest.rows)

    const chapter = await Chapter.findOne({ where: { id: req.params.id } })
    if (!chapter) return res.status(404).json({ error: true, message: 'Unit not found' })
    const room = config.upload.maxFilesPerUnit - parseFiles(chapter.chapter_files).length
    if (manifest.rows.length > room) {
      return res.status(400).json({ error: true, message: `This server supports a maximum of ${config.upload.maxFilesPerUnit} files per unit; this unit has room for ${Math.max(room, 0)} more` })
    }

    try {
      // the batch and ALL of its file rows are created together or not at all
      const created = await inTransaction(async (transaction) => {
        const batch = await UploadBatch.create({
          id: uuid(), batch_key: batchKey, chapter_id: chapter.id, user_id: req.user.id,
          total_files: manifest.rows.length, total_bytes: manifest.rows.reduce((n, r) => n + r.expected_size, 0),
        }, { transaction })
        const rows = await UploadBatchFile.bulkCreate(manifest.rows.map((r) => ({ ...r, id: uuid(), batch_id: batch.id, chapter_id: chapter.id })), { transaction })
        return { batch, rows }
      })
      return res.json({ batch: serialize(created.batch, created.rows) })
    } catch (e) {
      if (!(e instanceof UniqueConstraintError)) throw e
      // someone created the same batch a moment ago (a double click, a retry racing the first request): that is the answer
      const winner = await UploadBatch.findOne({ where: { user_id: req.user.id, batch_key: batchKey } })
      if (winner) return await respondExisting(res, winner, req.params.id, manifest.rows)
      // otherwise the clash is on a file key that another batch already uses in this unit
      return res.status(409).json({ error: true, message: 'One of these file keys is already used in this unit. Press Submit again.' })
    }
  } catch (e) {
    console.error('create upload batch failed:', e?.message)
    return res.status(500).json({ error: true, message: 'Could not start the upload. Try again.' })
  }
})

route.get('/batches/active', verifyRoles(Roles?.chapter_saveRoles), async (req, res) => {
  try {
    const batches = await UploadBatch.findAll({
      where: { user_id: req.user.id, acknowledged_at: null, createdAt: { [Op.gt]: new Date(Date.now() - RECENT_MS) } },
      order: [['createdAt', 'DESC']], limit: 20,
    })
    const out = []
    for (const batch of batches) out.push(serialize(batch, await loadFiles(batch.id)))
    return res.json({ batches: out })
  } catch (e) {
    console.error('list upload batches failed:', e?.message)
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
})

route.get('/batches/:batchId', verifyRoles(Roles?.chapter_saveRoles), async (req, res) => {
  try {
    const { batch, files } = await load(req.params.batchId)
    if (!(await authorise(req, res, batch))) return
    return res.json({ batch: serialize(batch, files) })
  } catch (e) {
    console.error('read upload batch failed:', e?.message)
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
})

route.post('/batches/:batchId/acknowledge', verifyRoles(Roles?.chapter_saveRoles), async (req, res) => {
  try {
    const { batch, files } = await load(req.params.batchId)
    if (!(await authorise(req, res, batch))) return
    // a result can be dismissed once nothing is left to send; a running batch keeps being announced
    if (deriveStatus(files) === 'in_progress') return res.status(409).json({ error: true, message: 'This upload is not finished yet' })
    if (!batch.acknowledged_at) { batch.acknowledged_at = new Date(); await batch.save() }
    return res.json({ batch: serialize(batch, files) })
  } catch (e) {
    console.error('acknowledge upload batch failed:', e?.message)
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
})

/* Inside the chapter lock: is this row already finished or already listed? If so make the row say so. Returns the
 * outcome, or null when the file still has to be stored. */
const settleIfAlreadyRegistered = async ({ chapter, files, transaction }, row) => {
  if (!chapter) return { gone: true }
  const fresh = await UploadBatchFile.findOne({ where: { id: row.id }, transaction, lock: transaction.LOCK.UPDATE })
  if (fresh.status === 'done') return { duplicate: true }
  // the file is listed under THIS row's identity (not just a matching browser key): an earlier attempt died before marking it
  const listed = files.find((item) => item?.upload_key === entryKey(row) && item?.batch_file_id === row.id)
  if (listed) {
    await fresh.update({ status: 'done', error: null, stored_size: listed.size ?? row.expected_size, stored_path: listed.filepath }, { transaction })
    return { duplicate: true }
  }
  return null
}

route.post('/batches/:batchId/files/:fileId', verifyRoles(Roles?.chapter_saveRoles), async (req, res) => {
  const file = Array.isArray(req.files?.chapter_file) ? req.files.chapter_file[0] : req.files?.chapter_file
  let stored = null // permanent file this request created and nobody refers to yet
  try {
    const { batch } = await load(req.params.batchId)
    if (!(await authorise(req, res, batch))) return
    const row = await UploadBatchFile.findOne({ where: { id: String(req.params.fileId), batch_id: batch.id } })
    if (!row) return res.status(404).json({ error: true, message: 'File not found in this batch' })

    const respond = async (code, body) => {
      const files = await loadFiles(batch.id)
      await touch(batch, files)
      const snapshot = serialize(batch, files)
      return res.status(code).json({ ...body, file: snapshot.files.find((f) => f.id === row.id), batch: snapshot })
    }
    const fail = async (message, status = 400) => {
      await UploadBatchFile.update({ status: 'failed', error: String(message).slice(0, 255), attempts: row.attempts + 1 }, { where: { id: row.id, status: { [Op.ne]: 'done' } } })
      return respond(status, { error: true, message })
    }

    // 1. already finished, or finished by an earlier attempt that died before the row was updated? then nothing is stored
    const settled = await withChapter(batch.chapter_id, (ctx) => settleIfAlreadyRegistered(ctx, row))
    if (settled?.gone) return res.status(404).json({ error: true, message: 'Unit not found' })
    if (settled?.duplicate) return respond(200, { message: 'Already saved', duplicate: true })

    if (!file) return res.status(400).json({ error: true, message: 'No file was uploaded' })

    // 2. check what arrived, before anything permanent happens
    try {
      validateFile(file, 'media')
      if (Number(file.size) !== Number(row.expected_size)) {
        throw new UploadError(`The server received ${file.size} bytes but ${row.expected_size} were announced, so the file was cut off. Try again.`)
      }
      if (row.fingerprint && file.tempFilePath && (await fingerprintFile(file.tempFilePath, Number(file.size))) !== row.fingerprint) {
        throw new UploadError('This is not the file that was selected when the upload started. Select the original file and try again.')
      }
    } catch (e) {
      if (!(e instanceof UploadError)) throw e
      return await fail(e.message, e.status || 400)
    }
    const existingCount = parseFiles((await Chapter.findOne({ where: { id: batch.chapter_id }, attributes: ['chapter_files'] }))?.chapter_files).length
    if (existingCount >= config.upload.maxFilesPerUnit) {
      return await fail(`This unit already holds the maximum of ${config.upload.maxFilesPerUnit} files`, 409)
    }

    // 3. journal the intent, then move the file. An interrupted earlier copy of the SAME bytes is adopted, not duplicated.
    const digest = file.md5 || null // sha256 hex (see middlewares/uploadGuard.js)
    const adopt = !!(row.stored_path && digest && row.content_sha256 === digest && storedFileExists(row.stored_path) && sizeOnDisk(row.stored_path) === Number(row.expected_size))
    const plan = adopt ? { filepath: row.stored_path } : planMediaFile(file, existingCount)
    const [claimed] = await UploadBatchFile.update(
      { status: 'uploading', attempts: row.attempts + 1, error: null, stored_path: plan.filepath, content_sha256: digest },
      { where: { id: row.id, status: { [Op.ne]: 'done' } } },
    )
    if (!claimed) return respond(200, { message: 'Already saved', duplicate: true }) // finished in parallel
    const staleCopy = !adopt && row.stored_path && row.stored_path !== plan.filepath ? row.stored_path : null

    let entry
    if (adopt) {
      entry = { filename: file.name, mimetype: file.mimetype, size: file.size, filepath: row.stored_path, type: 'localStorage' }
    } else {
      entry = await storeMediaFile(file, existingCount, plan)
    }
    stored = adopt ? null : entry.filepath

    // 4. register: chapter list + row in ONE transaction under the chapter lock
    const outcome = await withChapter(batch.chapter_id, async (ctx) => {
      const already = await settleIfAlreadyRegistered(ctx, row)
      if (already) return already
      const { chapter, files, transaction } = ctx
      if (files.length >= config.upload.maxFilesPerUnit) {
        const err = new UploadError(`This unit already holds the maximum of ${config.upload.maxFilesPerUnit} files`)
        err.status = 409
        throw err
      }
      chapter.chapter_files = JSON.stringify([...files, { ...entry, upload_key: entryKey(row), batch_id: batch.id, batch_file_id: row.id }])
      chapter.updated_by = req.user.id
      await chapter.save({ transaction })
      await UploadBatchFile.update({ status: 'done', error: null, stored_size: entry.size, stored_path: entry.filepath }, { where: { id: row.id }, transaction })
      return { duplicate: false }
    })
    if (outcome.gone) return res.status(404).json({ error: true, message: 'Unit not found' })
    if (outcome.duplicate) {
      // a parallel request registered this file first; the copy this request made is not needed
      if (stored) await deleteFile(stored)
      stored = null
      return respond(200, { message: 'Already saved', duplicate: true })
    }
    stored = null // registered: from now on the chapter owns it
    if (staleCopy) await deleteFile(staleCopy) // leftover of an earlier attempt with different bytes; no chapter lists it
    return respond(200, { message: 'Uploaded' })
  } catch (e) {
    if (e instanceof UploadError) {
      try {
        if (stored) { await deleteFile(stored); stored = null }
        await UploadBatchFile.update({ status: 'failed', error: e.message.slice(0, 255) }, { where: { id: String(req.params.fileId), batch_id: String(req.params.batchId), status: { [Op.ne]: 'done' } } })
        const { batch, files } = await load(req.params.batchId)
        if (batch && !res.headersSent) return res.status(e.status || 400).json({ error: true, message: e.message, batch: serialize(batch, files) })
      } catch (_) { /* fall through */ }
    }
    console.error('batch file upload failed:', e?.message)
    try {
      // nothing was registered, so the permanent copy this request made is unreferenced; remove it (the journal row still
      // names it, so reconcile would find it if even this deletion failed)
      if (stored) await deleteFile(stored)
      await UploadBatchFile.update({ status: 'failed', error: 'The server could not save this file.' }, { where: { id: String(req.params.fileId), batch_id: String(req.params.batchId), status: { [Op.ne]: 'done' } } })
    } catch (_) { /* best effort */ }
    if (res.headersSent) return
    return res.status(500).json({ error: true, message: 'The server could not save this file. Try again.' })
  } finally {
    removeTemp(file)
  }
})

module.exports = route
module.exports.deriveStatus = deriveStatus
