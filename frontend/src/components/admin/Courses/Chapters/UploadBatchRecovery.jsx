import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, LinearProgress } from '@mui/material'
import { useDispatch } from 'react-redux'
import { apiSlice } from '../../../../app/api/apiSlice'
import { useAcknowledgeUploadBatchMutation, useGetActiveUploadBatchesQuery } from '../../../../features/main/chaptersApiSlice'
import { activeBatchIds, useChapterBatchUpload } from '../../../../features/main/useChapterBatchUpload'
import { matchFilesStrong } from '../../../../utils/batchUploadRunner'
import { fingerprintAll } from '../../../../utils/fileFingerprint'
import { describeSelection, hasRunningBatch, RECOVERY_HINT, visibleRecoveryBatches } from '../../../../utils/uploadRecovery'
import { formatBytes } from '../../../../utils/chapterUpload'

/* Shows the result of unit uploads that were started earlier and not yet acknowledged - after a refresh, after the
 * browser was closed, or after coming back from another tab. The list comes from the server; the browser remembers
 * nothing. Hiding the page never changes anything here: the page only asks the server again when it becomes visible. */
const UploadBatchRecovery = () => {
  const dispatch = useDispatch()
  const { data, refetch } = useGetActiveUploadBatchesQuery(undefined, { refetchOnMountOrArgChange: true })
  const [acknowledge] = useAcknowledgeUploadBatchMutation()
  const sender = useChapterBatchUpload()
  const input = useRef(null)
  const [target, setTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const batches = visibleRecoveryBatches(data?.batches, activeBatchIds, sender.batch?.id)
  const unfinished = hasRunningBatch(data?.batches)

  // read-only: look at the server again when the user returns or the connection comes back (never cancels anything)
  useEffect(() => {
    const again = () => { if (document.visibilityState !== 'hidden') refetch() }
    document.addEventListener('visibilitychange', again)
    window.addEventListener('online', again)
    return () => { document.removeEventListener('visibilitychange', again); window.removeEventListener('online', again) }
  }, [refetch])

  // a batch another tab is still sending changes on the server; keep looking while that may be going on
  useEffect(() => {
    if (!unfinished) return undefined
    const t = setInterval(() => { if (document.visibilityState !== 'hidden') refetch() }, 10000)
    return () => clearInterval(t)
  }, [unfinished, refetch])

  const dismiss = async (b) => {
    await acknowledge(b.id).unwrap().catch(() => null)
    dispatch(apiSlice.util.invalidateTags(['Chapters']))
    refetch()
  }

  const chosen = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!target || files.length === 0) return
    const rows = target.files.filter((f) => f.status !== 'done')
    const result = matchFilesStrong(rows, files, await fingerprintAll(files))
    setNotice(describeSelection(target.files, result))
    if (result.matches.size === 0) return
    await sender.resume(target, files)
    refetch()
  }

  if (batches.length === 0 && !sender.running) return null
  return (
    <div className="mx-1 mb-3">
      <input ref={input} type="file" multiple hidden onChange={chosen} />
      {batches.map((b) => {
        const left = b.total_files - b.done_files
        const pct = b.status === 'completed' ? 100 : Math.min(99, b.total_bytes ? Math.floor((b.done_bytes / b.total_bytes) * 100) : 0)
        const names = b.files.filter((f) => f.status !== 'done').slice(0, 3).map((f) => f.name).join(', ')
        const sending = sender.running && sender.batch?.id === b.id
        return (
          <Alert key={b.id} sx={{ mb: 1 }}
            severity={b.status === 'completed' ? 'success' : b.status === 'failed' ? 'error' : 'warning'}
            action={b.status === 'completed'
              ? <Button color="inherit" size="small" onClick={() => dismiss(b)}>Dismiss</Button>
              : (
                <>
                  {!sending && <Button color="inherit" size="small" onClick={() => { setTarget(b); input.current?.click() }}>Select files to continue</Button>}
                  {b.status !== 'in_progress' && !sending && <Button color="inherit" size="small" onClick={() => dismiss(b)}>Dismiss</Button>}
                </>
              )}>
            <div style={{ fontWeight: 600 }}>
              {b.status === 'completed' && `Unit #${b.chapter_id}: all ${b.total_files} files were uploaded.`}
              {b.status === 'in_progress' && `Unit #${b.chapter_id}: upload not finished - ${b.done_files} of ${b.total_files} files are saved.`}
              {b.status === 'partial' && `Unit #${b.chapter_id}: ${b.done_files} files uploaded, ${b.failed_files} failed.`}
              {b.status === 'failed' && `Unit #${b.chapter_id}: no file could be uploaded.`}
            </div>
            {b.status !== 'completed' && (
              <>
                <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, my: 0.5 }} />
                <div style={{ fontSize: 12 }}>
                  {formatBytes(b.done_bytes)} of {formatBytes(b.total_bytes)} saved. {left} file{left === 1 ? '' : 's'} still needed{names ? `: ${names}${left > 3 ? ' ...' : ''}` : ''}.
                  {' '}{RECOVERY_HINT}
                </div>
                {b.files.filter((f) => f.status === 'failed' && f.error).slice(0, 2).map((f) => <div key={f.id} style={{ fontSize: 12 }}>{f.name}: {f.error}</div>)}
              </>
            )}
            {sending && <div style={{ fontSize: 12 }}>Uploading {sender.summary.percent}% ({sender.summary.done} of {sender.summary.total})</div>}
          </Alert>
        )
      })}
      {notice && <Alert severity="info" onClose={() => setNotice('')}>{notice}</Alert>}
      {sender.stopped && <Alert severity="warning">{sender.stopped.reason}</Alert>}
    </div>
  )
}

export default UploadBatchRecovery
