/* Crash safety for unit file uploads.
 *
 * A file upload spans three things that no single transaction can cover: the temporary file, the permanent file on disk,
 * and the database (the chapter's file list + the batch row). MySQL cannot roll back a file rename, so the order of the
 * steps and a small journal on the batch row make every crash window recoverable:
 *
 *   1. received     temp file complete, size/type/fingerprint checked          (nothing durable yet)
 *   2. journaled    row.status='uploading', row.stored_path=<planned name>, row.content_sha256=<digest of the bytes>
 *   3. moved        temp file renamed to stored_path                            (a file now exists)
 *   4. registered   ONE transaction: chapter row locked, entry appended to chapter_files, row.status='done'
 *
 * Crash windows and what repairs them
 *   after 1, before 2   nothing durable; the client simply sends the file again.
 *   after 2, before 3   row says 'uploading' but no file exists; a retry starts over, reconcile marks the row failed.
 *   after 3, before 4   an ORPHAN file exists (named by row.stored_path, listed by no chapter). A retry of the same file
 *                       (same sha256) ADOPTS it: no second copy is stored. If it is never retried, reconcile deletes the
 *                       orphan after the grace period, because it is journaled, unreferenced and stale.
 *   during 4            the transaction commits both changes or neither; there is no state with a registered file whose
 *                       row says 'uploading' and none with a 'done' row whose file is not listed.
 *   after 4             nothing to repair. A lost HTTP response is answered from the 'done' row.
 * Unavoidable: a power loss between the rename and the journal being flushed to disk can in theory lose the journal write
 * of step 2 on a database that is not durable; the orphan then has no journal row and is only reported by
 * `npm run uploads:reconcile` (never deleted), because nothing proves it is not wanted.
 *
 * What may be deleted: only a file named by a journal row that is not 'done', whose path is referenced by NO chapter and
 * NO other journal row, whose name has the generated shape, and that is older than the grace period. Temporary files
 * (files/uploads/temp/tmp-*) are cleaned separately (services/tempCleanup.js). Files referenced by a chapter are never
 * touched here. */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { Op } = require('sequelize')
const Chapter = require('../models/Chapter')
const { UploadBatchFile } = require('../models/UploadBatch')
const { withChapter, parseFiles } = require('./chapterFiles')
const { deleteFile } = require('../middlewares/commonFileUploader')

const FILES_ROOT = path.resolve(__dirname, '..', 'files')
const SAFE_PATH = /^\/uploads\/common\/file_[0-9a-f]{8,}_\d+--[A-Za-z0-9._-]*$/
const HEAD_TAIL = 64 * 1024

const absolutePath = (publicPath) => {
  if (typeof publicPath !== 'string' || !SAFE_PATH.test(publicPath)) return null
  const target = path.resolve(FILES_ROOT, '.' + publicPath)
  return target.startsWith(path.join(FILES_ROOT, 'uploads', 'common') + path.sep) ? target : null
}

/* sha256 of  "<size>:" + first 64 KiB + last 64 KiB.  The browser computes the same value from the selected File, so the
 * server can tell that the bytes it received are the file that was chosen when the batch was created, without reading
 * the whole video twice. (Not a full-content hash: a change in the middle of a file is not detected here; the full
 * sha256 of the received bytes is recorded separately as content_sha256.) */
const fingerprintFile = async (filePath, size) => {
  const handle = await fs.promises.open(filePath, 'r')
  try {
    const head = Buffer.alloc(Math.min(HEAD_TAIL, size))
    const tail = Buffer.alloc(Math.min(HEAD_TAIL, size))
    if (head.length) await handle.read(head, 0, head.length, 0)
    if (tail.length) await handle.read(tail, 0, tail.length, Math.max(0, size - HEAD_TAIL))
    return crypto.createHash('sha256').update(`${size}:`).update(head).update(tail).digest('hex')
  } finally {
    await handle.close()
  }
}

const exists = (publicPath) => {
  const abs = absolutePath(publicPath)
  return abs ? fs.existsSync(abs) : false
}
const sizeOnDisk = (publicPath) => {
  const abs = absolutePath(publicPath)
  try { return abs ? fs.statSync(abs).size : null } catch (e) { return null }
}

/* Every filepath any chapter lists, as a Set. */
const referencedPaths = async () => {
  const set = new Set()
  const chapters = await Chapter.findAll({ attributes: ['id', 'chapter_files'] })
  for (const c of chapters) for (const f of parseFiles(c.chapter_files)) if (f?.filepath) set.add(f.filepath)
  return set
}

/* Looks at journal rows that were left in the middle of an upload and repairs or reports them.
 *   apply:false  report only (default for the CLI)
 *   graceMs      rows touched more recently than this are left alone (their request may still be running) */
const reconcileUploads = async ({ apply = false, graceMs = 6 * 60 * 60 * 1000, now = Date.now(), log = () => {} } = {}) => {
  const report = { examined: 0, registered: 0, orphansDeleted: 0, orphansFound: 0, markedFailed: 0, skippedReferenced: 0, details: [] }
  const rows = await UploadBatchFile.findAll({
    where: { status: { [Op.in]: ['uploading', 'failed'] }, stored_path: { [Op.ne]: null }, updatedAt: { [Op.lt]: new Date(now - graceMs) } },
    order: [['updatedAt', 'ASC']],
  })
  const referenced = await referencedPaths()
  const claimed = new Map() // path -> row ids that name it
  for (const r of await UploadBatchFile.findAll({ where: { stored_path: { [Op.ne]: null } }, attributes: ['id', 'stored_path', 'status'] })) {
    if (!claimed.has(r.stored_path)) claimed.set(r.stored_path, [])
    claimed.get(r.stored_path).push(r)
  }

  for (const row of rows) {
    report.examined += 1
    const detail = { row: row.id, chapter: row.chapter_id, path: row.stored_path, action: 'none' }
    report.details.push(detail)

    if (referenced.has(row.stored_path)) {
      // the file is listed by a chapter: the registration happened, only the row is behind. Finish it.
      detail.action = 'register-row'
      report.registered += 1
      if (apply) {
        await withChapter(row.chapter_id, async ({ files, transaction }) => {
          const entry = files.find((f) => f.filepath === row.stored_path)
          if (entry) await UploadBatchFile.update({ status: 'done', error: null, stored_size: entry.size ?? row.expected_size }, { where: { id: row.id, status: { [Op.ne]: 'done' } }, transaction })
        })
      }
      continue
    }

    const sharedWithOther = (claimed.get(row.stored_path) || []).some((r) => r.id !== row.id && r.status === 'done')
    if (sharedWithOther || !SAFE_PATH.test(row.stored_path)) { detail.action = 'skipped'; report.skippedReferenced += 1; continue }

    if (!exists(row.stored_path)) {
      detail.action = 'no-file'
      report.markedFailed += 1
      if (apply && row.status === 'uploading') {
        await row.update({ status: 'failed', error: 'The upload was interrupted. Select the file again and resend it.', stored_path: null })
      }
      continue
    }

    report.orphansFound += 1
    detail.action = apply ? 'orphan-deleted' : 'orphan'
    if (apply) {
      await deleteFile(row.stored_path)
      report.orphansDeleted += 1
      await row.update({ status: 'failed', error: 'The upload was interrupted. Select the file again and resend it.', stored_path: null })
    }
  }
  log(JSON.stringify({ ...report, details: undefined }))
  return report
}

const scheduleUploadReconcile = () => {
  const run = () => reconcileUploads({ apply: true }).then((r) => { if (r.orphansDeleted || r.registered) console.log(`upload reconcile: ${r.registered} row(s) finished, ${r.orphansDeleted} orphan file(s) removed`) }).catch((e) => console.error('upload reconcile failed:', e?.message))
  setTimeout(run, 2 * 60 * 1000).unref()
  setInterval(run, 60 * 60 * 1000).unref()
}

module.exports = { fingerprintFile, absolutePath, exists, sizeOnDisk, referencedPaths, reconcileUploads, scheduleUploadReconcile, SAFE_PATH }
