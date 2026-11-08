#!/usr/bin/env node
/* Adds fingerprints of exposed secrets to config/revoked-secrets.json (hashes only; values are never stored or printed).
 *
 *   npm run secrets:revoke -- path/to/old/.env [path/to/old/enc.key ...]
 *
 * `.env` files: every value of a secret-looking variable (name contains SECRET, PASSWORD, PASS, KEY, TOKEN, AUTH) is added.
 * Any other file is treated as a binary key and fingerprinted as a whole. */
const fs = require('fs')
const path = require('path')
const { fingerprint, load, FILE } = require('../services/revokedSecrets')

const SECRETISH = /(SECRET|PASSWORD|PASS|KEY|TOKEN|AUTH)/i
const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Usage: npm run secrets:revoke -- <old .env or key file> [...]')
  process.exit(1)
}

const list = load()
const known = new Set(list.map((e) => e.fp))
let added = 0
const add = (label, value) => {
  if (value === undefined || String(value).length < 8) return
  const fp = fingerprint(value)
  if (known.has(fp)) return
  known.add(fp)
  list.push({ label, fp })
  added += 1
}

for (const file of files) {
  const base = path.basename(file)
  if (/\.env/i.test(base)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
      if (!m || !SECRETISH.test(m[1])) continue
      add(`${m[1]} (old .env)`, m[2].replace(/^["']|["']$/g, ''))
    }
  } else {
    add(`${base} (old key file)`, fs.readFileSync(file))
  }
}

fs.writeFileSync(FILE, JSON.stringify({ note: 'Salted scrypt fingerprints of exposed credentials. Values are not recoverable from this file.', fingerprints: list }, null, 2) + '\n')
console.log(`Added ${added} fingerprint(s); ${list.length} in total.`)
