/* Pure helpers for unit (chapter) file uploads: formatting, and checking a selection against the server limits
 * BEFORE anything is sent. No React or network code here so it can be tested on its own. */

export const formatBytes = (bytes) => {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = n / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1 }
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`
}

const extensionOf = (name) => {
  const m = /\.[^.\/]+$/.exec(String(name || '').toLowerCase())
  return m ? m[0] : ''
}

export const isVideo = (file, limits) =>
  String(file?.type || '').startsWith('video/') || (limits?.videoExtensions || []).includes(extensionOf(file?.name))

const names = (list, max = 3) => list.slice(0, max).map((f) => f.name).join(', ') + (list.length > max ? ` and ${list.length - max} more` : '')

/* limits: the object from GET /api/chapters/upload-limits (or null while it loads).
 * existingCount: files the unit already holds. */
export const analyzeSelection = (files = [], limits = null, existingCount = 0) => {
  const list = Array.from(files || [])
  const videos = list.filter((f) => isVideo(f, limits))
  const totalBytes = list.reduce((sum, f) => sum + (f.size || 0), 0)
  const errors = []

  if (limits) {
    const room = limits.maxFilesPerUnit - existingCount
    if (list.length > room) {
      const over = list.length - Math.max(room, 0)
      errors.push(`You selected ${list.length} file${list.length === 1 ? '' : 's'}, but this server supports a maximum of ${limits.maxFilesPerUnit} files per unit`
        + (existingCount ? ` (this unit already has ${existingCount})` : '') + `. Remove ${over} file${over === 1 ? '' : 's'} or contact the administrator.`)
    }
    const tooBig = list.filter((f) => f.size > limits.maxFileBytes)
    if (tooBig.length) errors.push(`Larger than the ${formatBytes(limits.maxFileBytes)} limit per file: ${names(tooBig)}. Compress or split ${tooBig.length === 1 ? 'it' : 'them'}.`)
    if (limits.allowedExtensions?.length) {
      const bad = list.filter((f) => !limits.allowedExtensions.includes(extensionOf(f.name)))
      if (bad.length) errors.push(`File type not accepted: ${names(bad)}.`)
    }
  }

  const noun = videos.length === list.length ? (list.length === 1 ? 'video' : 'videos') : (list.length === 1 ? 'file' : 'files')
  const summary = list.length ? `${list.length} ${noun} selected · ${formatBytes(totalBytes)} total` : 'No files selected'
  return { count: list.length, videoCount: videos.length, totalBytes, errors, blocked: errors.length > 0, summary }
}

export const limitsText = (limits) => {
  if (!limits) return ''
  const formats = (limits.videoExtensions || []).map((e) => e.slice(1).toUpperCase()).join(', ')
  return [
    `Up to ${limits.maxFilesPerUnit} files per unit`,
    `${formatBytes(limits.maxFileBytes)} max per file`,
    limits.maxBatchBytes ? `${formatBytes(limits.maxBatchBytes)} max per batch` : 'no combined size limit (files are sent one after another)',
    formats ? `Video formats: ${formats}` : '',
  ].filter(Boolean).join(' · ')
}

/* Turns a failed request into a sentence the instructor can act on. */
export const describeUploadError = (err) => {
  const status = err?.status
  const message = err?.data?.message
  if (!status) return 'Connection lost or timed out. Check your internet connection, then press Retry.'
  if (status === 413) return message || 'The server refused this file because it is too large.'
  if (status === 401 || status === 403) return 'Your session expired or you no longer have access. Sign in again, then press Retry.'
  if (status >= 500) return message || 'The server could not save this file. Press Retry.'
  return message || `Upload failed (${status}).`
}

/* Files the person took out of the edit form on purpose: present when the form was opened, absent now. Only these are sent
 * for removal. A file that is missing from the form for any other reason (it was uploaded after the form was opened) is
 * never part of this list, so an old form cannot delete it. */
export const computeRemovedFiles = (openedWith = [], keptNow = []) => {
  const kept = new Set((keptNow || []).map((f) => f?.filepath))
  return (openedWith || []).map((f) => f?.filepath).filter((p) => typeof p === 'string' && p && !kept.has(p))
}
