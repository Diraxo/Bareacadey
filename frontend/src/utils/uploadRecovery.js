/* Pure helpers for the "unfinished upload" banner. */

/* Batches worth showing: the ones the server lists as not yet acknowledged, minus those this very page is sending right
 * now (it shows its own progress), but including the one the sender currently holds so its result stays visible. */
export const visibleRecoveryBatches = (batches, activeIds, senderBatchId = null) =>
  (batches || []).filter((b) => !activeIds.has(b.id) || senderBatchId === b.id)

/* True while some batch may still be changing on the server (another tab, or an upload still running). */
export const hasRunningBatch = (batches) => (batches || []).some((b) => b.status === 'in_progress')

/* What the person is told after choosing files for an unfinished batch. `result` is the object matchFilesStrong returns. */
export const describeSelection = (rows, result) => {
  const waiting = rows.filter((r) => r.status !== 'done')
  if (result.matches.size === 0 && result.ambiguous.length === 0) {
    return 'None of the selected files match the files still waiting. Choose the original files again.'
  }
  const parts = []
  if (result.ambiguous.length) {
    parts.push(`${result.ambiguous.length} file${result.ambiguous.length === 1 ? '' : 's'} could not be told apart because several have the same name and size. Select only the right ones, or start the upload again from the unit.`)
  }
  const missing = waiting.length - result.matches.size - result.ambiguous.length
  if (missing > 0) parts.push(`${missing} of the remaining files were not selected; they stay waiting.`)
  return parts.join(' ')
}

/* Honest wording for the banner. Nothing here promises that a half-sent file continues where it stopped. */
export const RECOVERY_HINT = 'Files marked saved are kept and are never sent again. A file that was still being sent when the connection or page was lost starts again from its beginning: choose the original files again and only the missing ones are sent.'
