/* Validated storage of uploaded files.
 *
 * Client-controlled file names are never used as paths: the stored name is generated here, only a
 * sanitised display suffix is kept, the extension must be on an allow-list for the upload kind, the
 * size is capped, and (for images/PDF) the leading bytes must match the claimed extension. */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')

const UPLOAD_ROOT = path.resolve(__dirname, '..', 'files', 'uploads')

const IMAGE = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
const DOCUMENT = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.csv', '.zip']
const VIDEO = ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.wmv', '.flv']
const AUDIO = ['.mp3', '.m4a', '.wav', '.ogg']

const KINDS = {
  image: { extensions: IMAGE, maxBytes: () => config.upload.maxImageBytes },
  media: { extensions: [...IMAGE, ...DOCUMENT, ...VIDEO, ...AUDIO], maxBytes: () => config.upload.maxFileBytes },
  attachment: { extensions: [...IMAGE, ...DOCUMENT, ...VIDEO, ...AUDIO], maxBytes: () => config.upload.maxImageBytes * 5 },
}

// first bytes that must be present for the formats we can cheaply verify
const SIGNATURES = {
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.png': [[0x89, 0x50, 0x4e, 0x47]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]],
  '.bmp': [[0x42, 0x4d]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]],
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],
}

class UploadError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UploadError'
    this.status = 400
  }
}

const readHead = (file, n = 16) => {
  if (file.tempFilePath) {
    const fd = fs.openSync(file.tempFilePath, 'r')
    try {
      const buf = Buffer.alloc(n)
      const read = fs.readSync(fd, buf, 0, n, 0)
      return buf.subarray(0, read)
    } finally {
      fs.closeSync(fd)
    }
  }
  return Buffer.from(file.data || []).subarray(0, n)
}

const sanitizeDisplayName = (name) =>
  path.basename(String(name || 'file').replace(/\\/g, '/'))
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^\.+/, '')
    .slice(-80) || 'file'

/* Throws UploadError when the file is not acceptable. Returns the lower-cased extension. */
const validateFile = (file, kind) => {
  const rule = KINDS[kind]
  if (!rule) throw new Error(`Unknown upload kind: ${kind}`)
  if (!file || typeof file.name !== 'string') throw new UploadError('No file was uploaded')
  if (file.truncated) throw new UploadError('File is too large')
  const ext = path.extname(file.name).toLowerCase()
  if (!rule.extensions.includes(ext)) throw new UploadError('This file type is not allowed')
  if (file.size > rule.maxBytes()) throw new UploadError('File is too large')
  const signatures = SIGNATURES[ext]
  if (signatures) {
    const head = readHead(file)
    const ok = signatures.some((sig) => sig.every((b, i) => head[i] === b))
    if (!ok) throw new UploadError('File content does not match its extension')
  }
  return ext
}

const STORED_NAME = /^file_[0-9a-f]{8,}_\d+--[A-Za-z0-9._-]*$/

/* The generated name a file will be stored under. Computing it separately lets a caller write it into a journal BEFORE
 * the file is moved, so a crash after the move leaves a record of where the file went. */
const planStoredName = (file, { kind, keepExtension = true, index = 0 }) => {
  const ext = path.extname(String(file?.name || '')).toLowerCase()
  const display = sanitizeDisplayName(file?.name).replace(/\.[^.]*$/, '')
  const stem = `file_${crypto.randomBytes(4).toString('hex')}${index}_${Date.now()}--${display}`
  return keepExtension ? stem + ext : stem
}

/* Moves `file` into files/uploads/<subdir>/ under a generated name (or the `storedName` planned earlier).
 * `keepExtension:false` stores video files without extension (legacy layout the clients and HLS pipeline rely on). */
const saveUpload = async (file, { subdir, kind, keepExtension = true, index = 0, storedName: planned }) => {
  const ext = validateFile(file, kind)
  const dir = path.resolve(UPLOAD_ROOT, subdir)
  if (dir !== UPLOAD_ROOT && !dir.startsWith(UPLOAD_ROOT + path.sep)) throw new Error('Invalid upload directory')
  await fs.promises.mkdir(dir, { recursive: true })

  if (planned !== undefined && !STORED_NAME.test(String(planned).replace(/\.[A-Za-z0-9]{1,5}$/, ''))) throw new Error('Invalid planned file name')
  const storedName = planned !== undefined ? planned : planStoredName(file, { kind, keepExtension, index })
  const destination = path.join(dir, storedName)
  if (path.dirname(destination) !== dir) throw new Error('Invalid upload directory')
  await file.mv(destination)
  return { storedName, extension: ext, destination }
}

module.exports = { saveUpload, planStoredName, validateFile, sanitizeDisplayName, UploadError, UPLOAD_ROOT, KINDS }
