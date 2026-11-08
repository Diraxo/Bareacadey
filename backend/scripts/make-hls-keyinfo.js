#!/usr/bin/env node
/* Writes files/uploads/hls-key/enc.keyinfo for the video encoder, using the PUBLIC URL from configuration instead of a
 * hard-coded localhost address, and creates a NEW random AES-128 key when none exists.
 *
 *   npm run media:keyinfo [-- --rotate]
 *
 * Videos encoded with an older key keep that key's URL embedded in their playlists and must be re-encoded after a rotation. */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')
const { findRevoked } = require('../services/revokedSecrets')

const dir = path.join(__dirname, '..', 'files', 'uploads', 'hls-key')
const keyPath = path.join(dir, 'enc.key')
const infoPath = path.join(dir, 'enc.keyinfo')

fs.mkdirSync(dir, { recursive: true })
if (!config.urls.media) {
  console.error('API_PUBLIC_URL (or MEDIA_PUBLIC_URL) must be set')
  process.exit(1)
}
// a key that was exposed in the original deliverable is never kept, even without --rotate
const exposed = fs.existsSync(keyPath) && findRevoked({ key: fs.readFileSync(keyPath) }).length > 0
if (!fs.existsSync(keyPath) || exposed || process.argv.includes('--rotate')) {
  fs.writeFileSync(keyPath, crypto.randomBytes(16), { mode: 0o600 })
  console.log(exposed ? 'The existing key was exposed in the old deliverable: generated a NEW AES-128 key.' : 'Generated a new AES-128 key.')
}
// ffmpeg keyinfo format: key URI, path to key file, (optional IV)
fs.writeFileSync(infoPath, `${config.urls.media}/uploads/hls-key/enc.key\n${keyPath}\n`)
console.log(`Wrote ${infoPath}`)
