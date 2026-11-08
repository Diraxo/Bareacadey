/* Multipart (file upload) protection. The order matters and is the point of this file:
 *
 *   security headers, cookies, JSON parsers, CORS / Origin gate, /api rate limit      (app.js, before this)
 *   1. gate      : is this a multipart write at all? who is sending it? may they send this much?
 *                  - protected routes: the access token must be valid NOW (missing/invalid/expired/revoked -> 401/403
 *                    and the body is never read), the user must be inside the upload-start rate limit, and the
 *                    announced Content-Length must fit the configured request limit;
 *                  - the one public multipart route (sign-up photo): anonymous rate limit and a small size limit.
 *   2. parser    : express-fileupload writes the body to temporary files. Nothing reaches this point unauthenticated
 *                  except the public route, so unauthenticated traffic cannot accumulate temporary files.
 *   3. afterParse: file count limit. The request's own temp directory is deleted when the response is finished, so
 *                  nothing the handler did not move away stays behind.
 * The token only has to be valid when the request STARTS; a 15 minute token that runs out while a large video is still
 * arriving does not make the finished upload fail (verifyJWT trusts the check done in step 1 for that one request).
 * The application authenticates with the Authorization: Bearer header. The refresh cookie is not an access credential
 * and is deliberately not accepted for uploads. */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const fileUpload = require('express-fileupload')
const rateLimit = require('express-rate-limit')
const config = require('../config')
const { authenticateBeforeBody } = require('./verifyJWT')
const { TEMP_DIR } = require('../services/tempCleanup')

/* Anonymous endpoints that accept a file. Everything else under /api needs a token before its body is read. */
const PUBLIC_MULTIPART = new Set(['/api/auth/create_account'])

const isMultipartWrite = (req) =>
  ['POST', 'PUT', 'PATCH'].includes(req.method) && /^multipart\/form-data/i.test(String(req.headers['content-type'] || ''))

const refuse = (res, status, message, extra = {}) => {
  res.set('Connection', 'close') // the unread body is not worth draining
  return res.status(status).json({ error: true, message, ...extra })
}

const perUser = rateLimit({
  windowMs: 60 * 1000,
  max: () => config.upload.initPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `upload:${req.preAuthenticatedUser?.id ?? 'anon'}`,
  handler: (req, res) => refuse(res, 429, 'Too many uploads started. Wait a moment and try again.', { code: 'rate_limited' }),
})

const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: () => config.upload.publicPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => refuse(res, 429, 'Too many attempts, please try again later.', { code: 'rate_limited' }),
})

const declaredLength = (req) => {
  const n = Number(req.headers['content-length'])
  return Number.isFinite(n) && n >= 0 ? n : null
}

const tooLarge = (req, res, limit) => {
  const n = declaredLength(req)
  if (n !== null && n > limit) {
    refuse(res, 413, 'The upload is larger than this server accepts.', { code: 'request_too_large' })
    return true
  }
  return false
}

const gate = (req, res, next) => {
  if (!isMultipartWrite(req)) return next()
  const pathOnly = req.originalUrl.split('?')[0].replace(/\/+$/, '')
  if (PUBLIC_MULTIPART.has(pathOnly)) {
    req.multipartKind = 'public'
    return publicLimiter(req, res, () => (tooLarge(req, res, config.upload.maxImageBytes + 1024 * 1024) ? undefined : next()))
  }
  req.multipartKind = 'protected'
  return authenticateBeforeBody(req, res, (err) => {
    if (err) return next(err)
    perUser(req, res, () => (tooLarge(req, res, config.upload.maxRequestBytes) ? undefined : next()))
  })
}

const limitReply = JSON.stringify({ error: true, message: 'File is too large' })

/* Every multipart request writes into its OWN directory below the temp directory: whatever it leaves behind (a file cut
 * off by a limit, a refused request, a handler that stored nothing) is removed by deleting that one directory, without
 * guessing which loose files belong to whom. Files a handler moved to permanent storage are no longer in it. */
const REQUEST_DIR = /^req-[0-9a-f]{16}$/
const discardLater = (dir, res) => {
  const remove = () => fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }, () => {})
  // a client that vanished mid-request does not stop the handler from finishing with the file; give it time to do so
  res.once('close', () => (res.writableFinished ? remove() : setTimeout(remove, 10 * 60 * 1000).unref()))
}

const parserFor = (dir, limits) => fileUpload({
  useTempFiles: true,
  tempFileDir: dir, // absolute: the working directory of the process is not trusted
  hashAlgorithm: 'sha256', // the digest lands in file.md5; the upload journal records it
  limits,
  abortOnLimit: true,
  responseOnLimit: limitReply,
  // inactivity before an unfinished transfer is dropped (and its temporary file removed)
  uploadTimeout: 60 * 1000,
})

const parse = (req, res, next) => {
  if (!req.multipartKind) return next()
  const dir = path.join(TEMP_DIR, `req-${crypto.randomBytes(8).toString('hex')}`)
  discardLater(dir, res)
  const limits = req.multipartKind === 'public'
    ? { fileSize: config.upload.maxImageBytes, files: 2, fields: 100 }
    : { fileSize: config.upload.maxFileBytes, files: config.upload.maxFilesPerRequest + 1, fields: 200 }
  return parserFor(dir, limits)(req, res, next)
}

const filesOf = (req) => Object.values(req.files || {}).flat()

const afterParse = (req, res, next) => {
  if (!req.multipartKind || !req.files) return next()
  const max = req.multipartKind === 'public' ? 1 : config.upload.maxFilesPerRequest
  if (filesOf(req).length > max) return refuse(res, 413, `At most ${max} file${max === 1 ? '' : 's'} per request.`, { code: 'too_many_files' })
  return next()
}

module.exports = [gate, parse, afterParse]
module.exports.gate = gate
module.exports.isMultipartWrite = isMultipartWrite
module.exports.PUBLIC_MULTIPART = PUBLIC_MULTIPART
module.exports.REQUEST_DIR = REQUEST_DIR
