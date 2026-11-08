/* Refuses credentials and keys that were exposed in the original deliverable.
 *
 * config/revoked-secrets.json holds only salted scrypt fingerprints (never the values) of secrets that must not be
 * used by a new installation: the JWT secrets, database / SMTP / Chapa / Google / backup passwords from the old .env
 * files and the old HLS key. A production start-up that finds one of them in its environment (or the old
 * files/uploads/hls-key/enc.key) stops with a clear message, so a forgotten, un-rotated value cannot silently go live.
 *
 * Add more with:  npm run secrets:revoke -- path/to/old.env [path/to/old/enc.key ...] */
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', 'config', 'revoked-secrets.json')
const SALT = 'johar-academy/revoked-secrets/v1'

const fingerprint = (value) => crypto.scryptSync(Buffer.isBuffer(value) ? value : String(value), SALT, 32).toString('hex')

const load = (file = process.env.REVOKED_SECRETS_FILE || FILE) => { // the override exists for tests
  try { return JSON.parse(fs.readFileSync(file, 'utf8')).fingerprints || [] } catch (e) { return [] }
}

/* Returns the labels of every value (`{ NAME: value }` map or key buffer) that matches a revoked fingerprint. */
const findRevoked = (values, list = load()) => {
  const known = new Map(list.map((e) => [e.fp, e.label]))
  const hits = []
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined || value === null || String(value).length < 8) continue // too short to be a real secret
    const label = known.get(fingerprint(value))
    if (label) hits.push({ name, label })
  }
  return hits
}

const CHECKED_ENV = ['DB_PASSWORD', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SESSION_SECRET', 'MEDIA_TOKEN_SECRET', 'BACKUP_PASSWORD', 'SMTP_PASSWORD', 'CHAPA_AUTH', 'CLIENT_SECRET']

/* Problems (human readable) for the given environment and HLS key file (pass `null` to skip the key file). */
const revokedProblems = (env = process.env, keyFile = path.join(__dirname, '..', 'files', 'uploads', 'hls-key', 'enc.key'), list = load()) => {
  const values = {}
  for (const name of CHECKED_ENV) if (env[name]) values[name] = env[name]
  const problems = findRevoked(values, list).map((h) => `${h.name} is a credential from the old installation (${h.label}) and must be replaced`)
  if (keyFile === null) return problems
  try {
    const key = fs.readFileSync(keyFile)
    problems.push(...findRevoked({ 'hls-key/enc.key': key }, list).map(() => 'files/uploads/hls-key/enc.key is the old, exposed HLS key: delete it and run `npm run media:keyinfo`'))
  } catch (e) { /* no key yet is fine */ }
  return problems
}

module.exports = { fingerprint, findRevoked, revokedProblems, load, FILE, SALT }
