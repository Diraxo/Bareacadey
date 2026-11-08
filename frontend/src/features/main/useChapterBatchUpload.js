import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'
import { apiSlice } from '../../app/api/apiSlice'
import { useAcknowledgeUploadBatchMutation, useCreateUploadBatchMutation, useLazyGetUploadBatchQuery, useUploadBatchFileMutation } from './chaptersApiSlice'
import { matchFilesStrong, runBatch } from '../../utils/batchUploadRunner'
import { fingerprintAll } from '../../utils/fileFingerprint'
import { summarizeBatch } from '../../utils/uploadSummary'

/* Uploads the files of one unit from a single Submit, with the progress kept on the SERVER (an upload batch).
 *  - `start` creates the batch (same key on a repeat, so a lost answer does not make a second batch) and sends the files;
 *  - `resume` sends only what the server does not have yet, given the same files chosen again;
 *  - the page being hidden, a tab switch or losing focus is ignored on purpose: the browser keeps the request going,
 *    and when it does not, the server record says exactly where to continue.
 * Pages in this tab that already send a batch are listed in `activeBatchIds` so two screens never send it twice. */
export const activeBatchIds = new Set()

const signature = (files) => Array.from(files).map((f) => `${f.name}:${f.size}`).join('|')

export const useChapterBatchUpload = () => {
  const dispatch = useDispatch()
  const [createBatch] = useCreateUploadBatchMutation()
  const [sendFile] = useUploadBatchFileMutation()
  const [fetchBatch] = useLazyGetUploadBatchQuery()
  const [ack] = useAcknowledgeUploadBatchMutation()
  const [batch, setBatch] = useState(null) // the server's snapshot
  const [live, setLive] = useState({ phase: 'idle', current: null, loaded: 0, waiting: '' })
  const [error, setError] = useState('')
  const [stopped, setStopped] = useState(null)
  const [localFiles, setLocalFiles] = useState(() => new Map())
  const [ambiguous, setAmbiguous] = useState([])
  const running = live.phase === 'uploading' || live.phase === 'waiting' || live.phase === 'finalizing'
  const runningRef = useRef(false)
  const keyRef = useRef({ signature: '', key: '' })
  const filesRef = useRef([])

  // closing the tab mid-upload loses the request that is in flight; ask first
  useEffect(() => {
    if (!running) return undefined
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [running])

  const run = useCallback(async (snapshot, files, only = null) => {
    if (runningRef.current || activeBatchIds.has(snapshot.id)) return { batch: snapshot, busy: true }
    runningRef.current = true
    activeBatchIds.add(snapshot.id)
    filesRef.current = Array.from(files)
    // identity check stronger than name + size (fingerprint of the file's start and end); ambiguous pairs are not guessed
    const { matches, ambiguous: unsure } = matchFilesStrong(snapshot.files, files, await fingerprintAll(files))
    setLocalFiles(matches)
    setAmbiguous(unsure)
    setBatch(snapshot)
    setError('')
    setStopped(null)
    try {
      const result = await runBatch({
        batch: snapshot,
        files,
        matches,
        only,
        uploadFile: (batchId, row, file, onProgress) => {
          const formData = new FormData()
          formData.append('chapter_file', file)
          return sendFile({ batchId, fileId: row.id, formData, onUploadProgress: (e) => onProgress(e.loaded || 0) }).unwrap()
        },
        getBatch: (batchId) => fetchBatch(batchId, false).unwrap(),
        onUpdate: ({ batch: b, phase, current, loaded, waiting }) => {
          setBatch(b)
          setLive({ phase, current: current ?? null, loaded: loaded ?? 0, waiting: waiting ?? '' })
        },
      })
      setBatch(result.batch)
      setStopped(result.stopped)
      setLive({ phase: 'idle', current: null, loaded: 0, waiting: '' })
      return result
    } finally {
      runningRef.current = false
      activeBatchIds.delete(snapshot.id)
      dispatch(apiSlice.util.invalidateTags(['Chapters']))
    }
  }, [dispatch, fetchBatch, sendFile])

  /* Creates the batch for `chapterId` and sends `files`. Resolves with {batch, stopped} or {error}. */
  const start = useCallback(async (chapterId, files) => {
    const list = Array.from(files)
    const sig = signature(list)
    if (keyRef.current.signature !== sig) keyRef.current = { signature: sig, key: uuidv4().replace(/-/g, '') }
    const prints = await fingerprintAll(list)
    const manifest = list.map((file) => ({ client_key: uuidv4().replace(/-/g, ''), name: file.name, size: file.size, fingerprint: prints.get(file) || undefined, last_modified: file.lastModified }))
    let created
    try {
      // the server keeps the first manifest for this key, so a repeat after a lost answer reuses the same files
      created = await createBatch({ chapterId, batch_key: keyRef.current.key, files: manifest }).unwrap()
    } catch (err) {
      const message = err?.data?.message || 'Could not start the upload. Check your connection and press Submit again.'
      setError(message)
      return { error: message }
    }
    return run(created.batch, list)
  }, [createBatch, run])

  /* Continues a batch the server already knows, with the same files chosen again. */
  const resume = useCallback(async (snapshot, files) => run(snapshot, files), [run])

  /* Sends only the files the server marked failed or pending (or only `ids`, to retry single files). Finished files are
   * never sent again; a retried file is sent again from its first byte. */
  const retryFailed = useCallback(async (ids = null) => {
    if (!batch) return null
    return run(batch, filesRef.current, ids ? new Set(ids) : null)
  }, [batch, run])

  /* Marks the finished result as seen on the server, so it is not announced again. Never throws. */
  const acknowledge = useCallback((batchId) => ack(batchId).unwrap().catch(() => null), [ack])

  const reset = useCallback(() => {
    setBatch(null); setError(''); setStopped(null); setLocalFiles(new Map()); setAmbiguous([]); filesRef.current = []
    setLive({ phase: 'idle', current: null, loaded: 0, waiting: '' })
    keyRef.current = { signature: '', key: '' }
  }, [])

  /* One row per file: what the server recorded, plus what this page is doing right now. */
  const items = useMemo(() => (batch?.files || []).map((f) => ({
    ...f,
    uploading: running && live.current === f.id && f.status !== 'done',
    progress: running && live.current === f.id && f.size ? Math.min(99, Math.round((live.loaded * 100) / f.size)) : 0,
    needsFile: f.status !== 'done' && !localFiles.has(f.id),
  })), [batch, live, running, localFiles])

  const summary = useMemo(() => summarizeBatch({ batch, items, live, running }), [batch, items, live, running])

  return { batch, items, running, live, summary, error, stopped, ambiguous, start, resume, retryFailed, acknowledge, reset }
}
