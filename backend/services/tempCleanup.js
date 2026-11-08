/* Removes abandoned upload temp files (a browser closed mid-upload leaves its partial copy behind).
 * Only entries directly inside files/uploads/temp that have the upload parser's own names (`tmp-<n>-<n>` files, and the
 * `req-<hex>` directory of one request) and are older than `maxAgeMs` are touched. A transfer that is still running keeps updating its file, so it is never old enough. */
const fs = require('fs')
const path = require('path')
const config = require('../config')

const TEMP_DIR = path.resolve(__dirname, '..', 'files', 'uploads', 'temp')
const TEMP_NAME = /^tmp-\d+-\d+$/
const REQUEST_DIR = /^req-[0-9a-f]{16}$/ // one directory per multipart request (middlewares/uploadGuard.js)

const cleanTempUploads = async ({ dir = TEMP_DIR, maxAgeMs = config.upload.tempMaxAgeMs, now = Date.now() } = {}) => {
  let removed = 0
  let names
  try { names = await fs.promises.readdir(dir) } catch (e) { return removed }
  for (const name of names) {
    const isFile = TEMP_NAME.test(name)
    if (!isFile && !REQUEST_DIR.test(name)) continue
    const full = path.join(dir, name)
    try {
      const stat = await fs.promises.lstat(full)
      if (stat.isSymbolicLink() || now - stat.mtimeMs < maxAgeMs) continue
      if (isFile && stat.isFile()) await fs.promises.unlink(full)
      else if (!isFile && stat.isDirectory()) await fs.promises.rm(full, { recursive: true, force: true })
      else continue
      removed += 1
    } catch (e) { /* in use or already gone: leave it */ }
  }
  return removed
}

/* Runs once now and then hourly; the timer never keeps the process alive. */
const scheduleTempCleanup = () => {
  const run = () => cleanTempUploads().then((n) => { if (n) console.log(`removed ${n} abandoned upload temp file(s)`) }).catch(() => {})
  run()
  setInterval(run, 60 * 60 * 1000).unref()
}

module.exports = { cleanTempUploads, scheduleTempCleanup, TEMP_DIR }
