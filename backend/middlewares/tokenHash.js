const crypto = require('crypto')

/* Refresh tokens are stored hashed so a database leak does not yield usable sessions. */
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex')

module.exports = { hashToken }
