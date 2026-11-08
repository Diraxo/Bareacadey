/* A stronger identity for a chosen file than its name and size: sha256 of  "<size>:" + first 64 KiB + last 64 KiB.
 * The server computes the same value from the bytes it receives (backend/services/uploadJournal.js fingerprintFile), so a
 * different file with the same name and size is recognised without reading a multi-gigabyte video twice.
 * It is NOT a full-content hash: a change in the middle of a file is not detected by it.
 * Returns null where the browser cannot compute it (no Web Crypto in an insecure context); callers then fall back to
 * name + size and treat identical name+size pairs as ambiguous. */
const CHUNK = 64 * 1024

export const fingerprintFile = async (file) => {
  try {
    const subtle = globalThis.crypto?.subtle
    if (!subtle || !file || typeof file.slice !== 'function') return null
    const size = Number(file.size)
    const head = file.slice(0, Math.min(CHUNK, size))
    const tail = file.slice(Math.max(0, size - CHUNK), size)
    const bytes = await new Blob([`${size}:`, head, tail]).arrayBuffer()
    const digest = await subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    return null
  }
}

/* Map<File, fingerprint|null> for a selection. */
export const fingerprintAll = async (files) => {
  const out = new Map()
  for (const f of Array.from(files || [])) out.set(f, await fingerprintFile(f))
  return out
}
