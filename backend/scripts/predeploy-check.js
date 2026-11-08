#!/usr/bin/env node
/* Looks for things that must never be part of a deployment artifact.
 *
 *   npm run predeploy:check [-- --root <folder>]        (default: the whole project, one level above backend/)
 *
 * Reports: real .env files, signing keystores and credential files, private keys, the HLS key, log files, OS junk and
 * the retired ebirr.php; and any .env file whose values match the exposed credentials of the original deliverable
 * (config/revoked-secrets.json). Exit code 1 when something is found. It reads files but changes nothing. */
const fs = require('fs')
const path = require('path')
const { revokedProblems } = require('../services/revokedSecrets')

const argRoot = process.argv.indexOf('--root')
const root = path.resolve(argRoot > -1 ? process.argv[argRoot + 1] : path.join(__dirname, '..', '..'))

const SKIP_DIRS = new Set(['node_modules', '.git', '.expo', 'dist', 'build', '_archive_unused', 'release'])
const RULES = [
  [/^\.env(\.[^.]+)?$/i, (name) => !/\.(example|sample|template)$/i.test(name), 'environment file with real values'],
  [/\.(keystore|jks|p12|pfx|pem|key)$/i, () => true, 'key or certificate file'],
  [/^credentials\.json$/i, () => true, 'signing credentials'],
  [/^enc\.key(info)?$/i, () => true, 'HLS encryption key material'],
  [/^ebirr\.php$/i, () => true, 'retired payment script that contained credentials'],
  [/^(errLog|reqLog)\.txt$/i, () => true, 'log file'],
  [/^(\.DS_Store|\._.*)$/, () => true, 'macOS metadata'],
]

const findings = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__MACOSX') findings.push({ file: full, why: 'macOS metadata folder' })
      else if (!SKIP_DIRS.has(entry.name)) walk(full)
      continue
    }
    for (const [pattern, applies, why] of RULES) {
      if (pattern.test(entry.name) && applies(entry.name)) { findings.push({ file: full, why }); break }
    }
    if (/^\.env/i.test(entry.name) && !/\.(example|sample|template)$/i.test(entry.name)) {
      const values = {}
      for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/)
        if (m) values[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
      for (const problem of revokedProblems(values, null)) findings.push({ file: full, why: problem })
    }
  }
}

walk(root)
if (findings.length === 0) {
  console.log(`OK: nothing that must not be deployed was found under ${root}`)
} else {
  console.log(`Found ${findings.length} item(s) under ${root} that must not be shipped:\n`)
  for (const f of findings) console.log(` - ${path.relative(root, f.file)}  (${f.why})`)
  console.log('\nKeep them out of any archive, repository or server upload (see migration-docs/08).')
  process.exitCode = 1
}
