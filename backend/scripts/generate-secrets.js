#!/usr/bin/env node
/* Prints fresh random values for the secrets of a new installation. Nothing is written to disk.
 *
 *   npm run secrets:generate
 *
 * Paste the output into the server's .env (never into the repository). Because the values are new, every token issued by
 * the old installation (access, refresh, media) stops working on the new one. */
const crypto = require('crypto')

for (const name of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SESSION_SECRET', 'MEDIA_TOKEN_SECRET']) {
  console.log(`${name}=${crypto.randomBytes(48).toString('hex')}`)
}
console.log('\n# Also create NEW values at the providers (this tool cannot do that for you):')
console.log('# DB_PASSWORD (new database user), SMTP_PASSWORD, CHAPA_AUTH (secret key), CLIENT_SECRET (Google), BACKUP_PASSWORD.')
