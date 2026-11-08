/* Serves uploaded files. Replaces the old static serving of the whole files/ tree plus a Referer check,
 * which exposed everything under files/ (including the HLS key) to anyone who knew a URL. */
const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')
const config = require('../config')
const { corsOptions } = require('../middlewares/credentials')
const verifyJWT = require('../middlewares/verifyJWT')
const access = require('../services/mediaAccess')

const FILES_ROOT = path.resolve(__dirname, '..', 'files', 'uploads')

/* Resolves `segments` below `root`; returns null when a segment is unsafe or the result would escape the root. */
const safeJoin = (root, ...segments) => {
  for (const s of segments) {
    if (typeof s !== 'string' || s === '' || s.includes('\0') || s.includes('\\') || s.split('/').includes('..')) return null
  }
  const resolved = path.resolve(root, ...segments)
  return resolved.startsWith(root + path.sep) ? resolved : null
}

/* Videos are stored without an extension (legacy layout), so Express would label them application/octet-stream.
 * Read the first bytes and report real MP4/QuickTime files as video/mp4 so players pick the right reader. */
const sniffVideoType = (filePath) => {
  if (path.extname(filePath)) return null
  let fd
  try {
    fd = fs.openSync(filePath, 'r')
    const head = Buffer.alloc(12)
    fs.readSync(fd, head, 0, 12, 0)
    return head.toString('latin1', 4, 8) === 'ftyp' ? 'video/mp4' : null
  } catch (e) {
    return null
  } finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}

const sendIfFile = (res, filePath, next) => {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return res.status(404).send('File not found')
    const videoType = sniffVideoType(filePath)
    if (videoType) res.type(videoType)
    if (!res.get('Cache-Control')) res.set('Cache-Control', 'private, max-age=0, must-revalidate')
    res.set('X-Content-Type-Options', 'nosniff')
    res.sendFile(filePath, (e) => { if (e && !res.headersSent) next(e) })
  })
}

const router = express.Router()
router.use(cors({ ...corsOptions, credentials: true }))

// Short-lived token that lets <video>/<img>/<iframe> elements fetch protected media (append as ?st=...).
router.get('/api/media/token', verifyJWT, (req, res) => {
  res.json({ token: access.signMediaToken(req.user), expiresIn: config.tokens.mediaExpiresInSeconds })
})

// Blurred thumbnails and profile pictures are public by design.
router.get('/uploads/common/thumbnails/:filename', (req, res, next) => {
  const filePath = safeJoin(FILES_ROOT, 'common', 'thumbnails', req.params.filename)
  if (!filePath) return res.status(400).send('Bad request')
  sendIfFile(res, filePath, next)
})

router.get('/uploads/users/profile/:filename', (req, res, next) => {
  const name = req.params.filename
  if (!access.isImage(name)) return res.status(404).send('File not found')
  const filePath = safeJoin(FILES_ROOT, 'users', 'profile', name)
  if (!filePath) return res.status(400).send('Bad request')
  sendIfFile(res, filePath, next)
})

router.get('/uploads/common/:filename', async (req, res, next) => {
  try {
    const name = req.params.filename
    const filePath = safeJoin(FILES_ROOT, 'common', name)
    if (!filePath) return res.status(400).send('Bad request')
    const decision = await access.authorizeCommonFile(name, access.identify(req))
    if (!decision.allowed) return res.status(decision.status).json({ error: true, message: 'You are not authorized' })
    if (access.isImage(name)) res.set('Cache-Control', 'private, max-age=86400')
    sendIfFile(res, filePath, next)
  } catch (e) { next(e) }
})

// HLS output lives in videos/<source file name>/...; it follows the source file's entitlement.
router.get('/uploads/videos/:name/*', async (req, res, next) => {
  try {
    const name = req.params.name
    const filePath = safeJoin(FILES_ROOT, 'videos', name, req.params[0])
    if (!filePath) return res.status(400).send('Bad request')
    const decision = await access.authorizeCommonFile(name, access.identify(req))
    if (!decision.allowed) return res.status(decision.status).json({ error: true, message: 'You are not authorized' })
    sendIfFile(res, filePath, next)
  } catch (e) { next(e) }
})

// AES key for HLS: logged-in users only. (Per-video keys are recommended for re-encoded content; see migration-docs.)
router.get('/uploads/hls-key/:filename', (req, res, next) => {
  if (!access.identify(req)) return res.status(401).json({ error: true, message: 'You are not authorized' })
  const filePath = safeJoin(FILES_ROOT, 'hls-key', req.params.filename)
  if (!filePath || path.extname(filePath) === '.keyinfo') return res.status(404).send('File not found')
  res.set('Cache-Control', 'no-store')
  sendIfFile(res, filePath, next)
})

// Chat attachments: require login (the chat upload feature has no participant model to check against).
router.get('/uploads/chat/:filename', (req, res, next) => {
  if (!access.identify(req)) return res.status(401).json({ error: true, message: 'You are not authorized' })
  const filePath = safeJoin(FILES_ROOT, 'chat', req.params.filename)
  if (!filePath) return res.status(400).send('Bad request')
  sendIfFile(res, filePath, next)
})

module.exports = router
module.exports.safeJoin = safeJoin
module.exports.FILES_ROOT = FILES_ROOT
