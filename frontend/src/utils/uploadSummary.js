/* Overall numbers for a batch, derived from the SERVER's snapshot plus what this page is sending right now.
 * 100% is only ever shown once the server says the batch is completed; a file that is mid-flight counts for at most 99% of
 * its size, and a failed file never counts as sent. */
export const summarizeBatch = ({ batch, items, live, running }) => {
  if (!batch) return { started: false }
  const inFlight = items.find((i) => i.uploading)
  const sent = batch.done_bytes + (inFlight ? Math.min(live.loaded, inFlight.size * 0.99) : 0)
  const completed = batch.status === 'completed' && !running
  return {
    started: true,
    status: batch.status,
    phase: running ? live.phase : batch.status,
    total: batch.total_files,
    done: batch.done_files,
    failed: batch.failed_files,
    uploading: inFlight ? 1 : 0,
    waiting: Math.max(batch.pending_files - (inFlight ? 1 : 0), 0),
    totalBytes: batch.total_bytes,
    sentBytes: Math.min(sent, batch.total_bytes),
    percent: completed ? 100 : Math.min(99, batch.total_bytes ? Math.floor((sent / batch.total_bytes) * 100) : 0),
    finished: completed,
    needFiles: items.filter((i) => i.needsFile).length,
  }
}
