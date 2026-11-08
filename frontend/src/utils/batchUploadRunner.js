/* Sends the files of one upload batch, one request each, and reports what the SERVER says.
 * No React or network-library code here (the caller passes the functions), so it can be tested on its own.
 *
 *  - A file counts as uploaded only when the server's answer says so; the server's batch snapshot is the truth.
 *  - A temporary problem (no network, timeout, 408/429/5xx) is retried with a pause; the run waits while the browser
 *    is offline. Nothing here looks at tab visibility or focus, and nothing here signs the user out.
 *  - Re-sending a file whose earlier answer was lost is safe: the server recognises the file and replies "already saved".
 *  - A problem with one file (too large, wrong type, cut off ...) marks only that file as failed; the others go on. */

export const sameFile = (row, file) => row.name === file.name && Number(row.size) === Number(file.size)

/* Pairs batch rows with local File objects. Name + size alone is not an identity: two different videos can share both.
 *   - a row that carries a fingerprint only matches a file with that same fingerprint;
 *   - a row without one (older batch, or a browser that cannot compute it) matches by name + size, but ONLY when exactly
 *     one waiting row and exactly one chosen file have that name and size. Otherwise those rows are `ambiguous` and nothing
 *     is guessed.
 * `fingerprints` is a Map<File, string|null> (see utils/fileFingerprint.js). Returns { matches: Map(rowId -> File), ambiguous: [rowId] }. */
export const matchFilesStrong = (rows, files, fingerprints = new Map()) => {
  const free = new Set(Array.from(files || []))
  const matches = new Map()
  const ambiguous = []
  const weak = []
  for (const row of rows) {
    if (row.fingerprint) {
      const hit = Array.from(free).find((f) => fingerprints.get(f) === row.fingerprint && sameFile(row, f))
      if (hit) { matches.set(row.id, hit); free.delete(hit) }
    } else {
      weak.push(row)
    }
  }
  for (const row of weak) {
    const rowsLike = weak.filter((r) => r.name === row.name && Number(r.size) === Number(row.size))
    const filesLike = Array.from(free).filter((f) => sameFile(row, f))
    if (filesLike.length === 0) continue
    if (rowsLike.length === 1 && filesLike.length === 1) { matches.set(row.id, filesLike[0]); free.delete(filesLike[0]) }
    else ambiguous.push(row.id)
  }
  return { matches, ambiguous }
}

/* Synchronous convenience form (no fingerprints): the unambiguous name + size matches only. */
export const matchFiles = (rows, files) => matchFilesStrong(rows, files).matches

/* 'retry'  temporary: try again after a pause
 * 'file'   this file cannot be stored as it is; the others can still go
 * 'stop'   nothing more can be sent right now (signed out / no longer allowed); progress is kept and nothing is cleared */
export const classifyUploadError = (err) => {
  const status = err?.status
  if (!status) return 'retry'
  if (err?.renewalFailed === 'transient') return 'retry' // 403 only because the session could not be renewed yet
  if (status === 408 || status === 429 || status >= 500) return 'retry'
  if (status === 401 || status === 403) return 'stop'
  return 'file'
}

export const describeError = (err) => {
  const status = err?.status
  const message = err?.data?.message
  if (!status || err?.renewalFailed === 'transient') return 'The connection was lost or timed out.'
  if (status === 413) return message || 'The server refused this file because it is too large.'
  if (status === 401 && /assigned/i.test(message || '')) return 'You are no longer allowed to change this unit.'
  if (status === 401 || status === 403) return 'Your session could not be renewed. Sign in again; your progress is saved.'
  if (status >= 500 || status === 408 || status === 429) return message || 'The server could not save this file.'
  return message || `The upload was refused (${status}).`
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const BACKOFF = [1000, 3000, 8000]
/* Losing the connection (a laptop waking from sleep needs a while to find the network again) gets a longer, still bounded
 * schedule: about 2 minutes in total. Answers from the server keep the short one. */
const NETWORK_BACKOFF = [1000, 3000, 8000, 15000, 30000, 60000]
const lostConnection = (err) => !err?.status || err?.renewalFailed === 'transient'

/* uploadFile(batchId, row, file, onProgress) -> server answer {batch, file}   (throws {status, data} on failure)
 * getBatch(batchId) -> {batch}
 * Calls onUpdate({ batch, current, loaded, phase, waiting, notice }) as things change. Resolves with the final batch
 * snapshot (or the last known one when the run had to stop) plus `stopped` when it could not finish sending. */
export const runBatch = async ({
  batch, files, uploadFile, getBatch, onUpdate = () => {},
  isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false),
  waitOnline = () => new Promise((resolve) => window.addEventListener('online', resolve, { once: true })),
  sleep = defaultSleep, shouldStop = () => false,
  matches = null, only = null,
}) => {
  let current = batch
  let stopped = null
  // `matches` (rowId -> File) can be prepared by the caller with fingerprints; `only` limits the run to some rows
  const local = matches || matchFiles(current.files, files)
  const emit = (extra = {}) => onUpdate({ batch: current, phase: 'uploading', ...extra })
  emit()

  for (const row of current.files) {
    if (shouldStop() || stopped) break
    const live = current.files.find((f) => f.id === row.id)
    if (!live || live.status === 'done') continue // already stored: never sent again
    if (only && !only.has(row.id)) continue
    const file = local.get(row.id)
    if (!file) continue // not chosen again after a refresh: stays pending
    let attempt = 0
    for (;;) {
      if (!isOnline()) { emit({ phase: 'waiting', waiting: 'You are offline. The upload continues when the connection is back.' }); await waitOnline() }
      emit({ current: row.id, loaded: 0 })
      try {
        const answer = await uploadFile(current.id, row, file, (loaded) => emit({ current: row.id, loaded }))
        if (answer?.batch) current = answer.batch
        break
      } catch (err) {
        const kind = classifyUploadError(err)
        if (kind === 'stop') { stopped = { reason: describeError(err), status: err?.status }; break }
        if (kind === 'file') {
          current = { ...current, files: current.files.map((f) => (f.id === row.id ? { ...f, status: 'failed', error: describeError(err) } : f)) }
          if (err?.data?.batch) current = err.data.batch // the server's own record of the failure
          break
        }
        attempt += 1
        const schedule = lostConnection(err) ? NETWORK_BACKOFF : BACKOFF
        if (attempt > schedule.length) {
          current = { ...current, files: current.files.map((f) => (f.id === row.id ? { ...f, status: 'failed', error: describeError(err) } : f)) }
          // several tries in a row without any answer: the connection is down, so do not burn through every file
          if (lostConnection(err)) stopped = { reason: describeError(err), status: 0 }
          break
        }
        emit({ phase: 'waiting', waiting: `Retrying in ${schedule[attempt - 1] / 1000}s (attempt ${attempt + 1})` })
        await sleep(schedule[attempt - 1])
      }
    }
  }

  // the server, not this loop, says how it ended
  emit({ phase: 'finalizing' })
  try {
    const answer = await getBatch(current.id)
    if (answer?.batch) current = answer.batch
  } catch (err) { /* keep the last snapshot; the recovery banner will ask again */ }
  return { batch: current, stopped }
}
