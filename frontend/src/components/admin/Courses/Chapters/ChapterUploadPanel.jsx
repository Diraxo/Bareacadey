import React from 'react'
import { Alert, Button, LinearProgress } from '@mui/material'
import { analyzeSelection, formatBytes, limitsText } from '../../../../utils/chapterUpload'

const STATUS_LABEL = { pending: 'Waiting', uploading: 'Uploading', done: 'Uploaded', failed: 'Failed' }
const STATUS_COLOR = { pending: '#888', uploading: '#1976d2', done: '#2e7d32', failed: '#d32f2f' }
const PHASE_LABEL = {
  uploading: 'Uploading', waiting: 'Waiting to retry', finalizing: 'Finalizing - confirming with the server',
  in_progress: 'Not finished', completed: 'Completed', partial: 'Partially completed', failed: 'Failed',
}

/* Before Submit: what the server accepts and what the current selection adds up to (with any problem).
 * After Submit: the server's own record of every file, overall progress and a "Retry failed" button. */
const ChapterUploadPanel = ({ files = [], existingCount = 0, limits, batch, onRetry, unitSaved = false }) => {
  const analysis = analyzeSelection(files, limits, existingCount)
  const { items, summary, running, live, error, stopped } = batch

  return (
    <div className="w-full mb-4" style={{ fontSize: 13 }}>
      {limits && <div style={{ opacity: 0.7, marginBottom: 6 }}>{limitsText(limits)}</div>}

      {!summary.started && (
        <>
          <div style={{ fontWeight: 600 }}>{analysis.summary}</div>
          {analysis.errors.map((m) => <Alert key={m} severity="error" sx={{ mt: 1 }}>{m}</Alert>)}
          {error && <Alert severity="error" sx={{ mt: 1 }}>{unitSaved ? 'The unit was saved. ' : ''}{error}</Alert>}
        </>
      )}

      {summary.started && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {PHASE_LABEL[summary.phase] || summary.phase}: {summary.total} selected · {summary.done} uploaded · {summary.uploading} uploading · {summary.waiting} waiting
            {summary.failed > 0 && <span style={{ color: STATUS_COLOR.failed }}> · {summary.failed} failed</span>}
          </div>
          <LinearProgress variant="determinate" value={summary.percent} sx={{ height: 8, borderRadius: 4 }} />
          <div style={{ marginTop: 2, opacity: 0.7 }}>
            {summary.percent}% · {formatBytes(summary.sentBytes)} of {formatBytes(summary.totalBytes)}
            {live.waiting ? ` · ${live.waiting}` : ''}
          </div>
          {running && <div style={{ opacity: 0.7 }}>You can switch to another tab. Closing the page or losing the connection stops the file being sent; files already saved are kept, and a file that was mid-transfer starts again from its beginning.</div>}

          {summary.finished && <Alert severity="success" sx={{ mt: 1 }}>All {summary.total} files were saved to the unit.</Alert>}
          {stopped && <Alert severity="warning" sx={{ mt: 1 }}>{stopped.reason}</Alert>}
          {batch.ambiguous?.length > 0 && <Alert severity="warning" sx={{ mt: 1 }}>{batch.ambiguous.length} selected file(s) share a name and size with another and could not be told apart, so they were not sent. Select them one at a time.</Alert>}
          {!running && !summary.finished && summary.failed + summary.waiting > 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}
              action={summary.needFiles === 0 ? <Button color="inherit" size="small" onClick={onRetry}>Retry failed</Button> : null}>
              {unitSaved ? 'The unit was saved. ' : ''}{summary.done} of {summary.total} files are saved; {summary.failed} failed
              {summary.waiting ? ` and ${summary.waiting} were not sent` : ''}. Retry sends only those; nothing is uploaded twice.
            </Alert>
          )}

          <div style={{ maxHeight: 240, overflowY: 'auto', marginTop: 8, border: '1px solid #ddd', borderRadius: 6 }}>
            {items.map((it) => {
              const status = it.uploading ? 'uploading' : it.status === 'uploading' ? 'pending' : it.status
              return (
                <div key={it.id} style={{ padding: '6px 10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span className="truncate" style={{ minWidth: 0 }}>{it.name} <span style={{ opacity: 0.6 }}>({formatBytes(it.size)})</span></span>
                    <span style={{ color: STATUS_COLOR[status], whiteSpace: 'nowrap' }}>{STATUS_LABEL[status]}{it.uploading ? ` ${it.progress}%` : ''}</span>
                  </div>
                  {it.uploading && <LinearProgress variant="determinate" value={it.progress} sx={{ height: 4, mt: 0.5 }} />}
                  {it.status === 'failed' && !it.uploading && <div style={{ color: STATUS_COLOR.failed }}>{it.error}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChapterUploadPanel
