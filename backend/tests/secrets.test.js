const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const revoked = require('../services/revokedSecrets')
const config = require('../config')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'johar-secrets-'))
const OLD_SECRET = 'an-old-leaked-secret-value-0123456789abcdef'
const listFile = path.join(tmp, 'revoked.json')
const list = [
  { label: 'ACCESS_TOKEN_SECRET (old .env)', fp: revoked.fingerprint(OLD_SECRET) },
  { label: 'old key', fp: revoked.fingerprint(Buffer.from('0123456789abcdef')) },
]
fs.writeFileSync(listFile, JSON.stringify({ fingerprints: list }))

afterAll(() => { delete process.env.REVOKED_SECRETS_FILE; fs.rmSync(tmp, { recursive: true, force: true }) })

describe('revoked credentials', () => {
  test('fingerprints are stable, salted and do not contain the value', () => {
    expect(revoked.fingerprint(OLD_SECRET)).toBe(revoked.fingerprint(OLD_SECRET))
    expect(revoked.fingerprint(OLD_SECRET)).toMatch(/^[0-9a-f]{64}$/)
    expect(revoked.fingerprint(OLD_SECRET)).not.toBe(require('crypto').createHash('sha256').update(OLD_SECRET).digest('hex'))
    expect(revoked.fingerprint(OLD_SECRET)).not.toContain(OLD_SECRET)
  })

  test('an old value is found under any variable name; new and short values are not', () => {
    expect(revoked.findRevoked({ SESSION_SECRET: OLD_SECRET }, list)).toEqual([{ name: 'SESSION_SECRET', label: 'ACCESS_TOKEN_SECRET (old .env)' }])
    expect(revoked.findRevoked({ ACCESS_TOKEN_SECRET: 'a-brand-new-secret-never-used-before-1234567' }, list)).toEqual([])
    expect(revoked.findRevoked({ X: 'short' }, list)).toEqual([])
  })

  test('the old HLS key file is recognised, a new key is not', () => {
    const oldKey = path.join(tmp, 'old.key'); fs.writeFileSync(oldKey, Buffer.from('0123456789abcdef'))
    const newKey = path.join(tmp, 'new.key'); fs.writeFileSync(newKey, require('crypto').randomBytes(16))
    expect(revoked.revokedProblems({}, oldKey, list).join()).toMatch(/old, exposed HLS key/)
    expect(revoked.revokedProblems({}, newKey, list)).toEqual([])
    expect(revoked.revokedProblems({}, path.join(tmp, 'missing.key'), list)).toEqual([])
  })

  test('production configuration refuses an old secret and accepts fresh ones', () => {
    process.env.REVOKED_SECRETS_FILE = listFile
    const good = {
      NODE_ENV: 'production', API_PUBLIC_URL: 'https://api.example.org', FRONTEND_URL: 'https://www.example.org', DB_NAME: 'd', DB_USER: 'u', DB_PASSWORD: 'p',
      ACCESS_TOKEN_SECRET: 'a'.repeat(40), REFRESH_TOKEN_SECRET: 'b'.repeat(40), SESSION_SECRET: 'c'.repeat(40), MEDIA_TOKEN_SECRET: 'd'.repeat(40),
      ACCESS_TOKEN_EXPIRES_IN: '15m', REFRESH_TOKEN_EXPIRES_IN: '30d',
    }
    expect(config.validate(good, true)).toEqual([])
    const reused = config.validate({ ...good, REFRESH_TOKEN_SECRET: OLD_SECRET }, true).join(' ')
    expect(reused).toMatch(/REFRESH_TOKEN_SECRET is a credential from the old installation/)
    // outside production the check does not get in the way of development
    expect(config.validate({ ...good, REFRESH_TOKEN_SECRET: OLD_SECRET }, false).join(' ')).not.toMatch(/old installation/)
  })

  test('the shipped list holds fingerprints only: no plaintext, and it covers the old JWT secrets, SMTP/Chapa keys and HLS key', () => {
    delete process.env.REVOKED_SECRETS_FILE
    const text = fs.readFileSync(revoked.FILE, 'utf8')
    const entries = JSON.parse(text).fingerprints
    expect(entries.length).toBeGreaterThanOrEqual(9)
    for (const e of entries) expect(e.fp).toMatch(/^[0-9a-f]{64}$/)
    const labels = entries.map((e) => e.label).join(' | ')
    for (const needle of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SMTP_PASSWORD', 'CHAPA_AUTH', 'enc.key', 'ebirr.php']) expect(labels).toContain(needle)
  })
})

describe('predeploy:check', () => {
  const run = (root) => spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'predeploy-check.js'), '--root', root], {
    encoding: 'utf8', env: { ...process.env, REVOKED_SECRETS_FILE: listFile },
  })

  test('passes on a clean tree (templates and source files are fine)', () => {
    const dir = path.join(tmp, 'clean'); fs.mkdirSync(path.join(dir, 'backend'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'backend', '.env.example'), 'ACCESS_TOKEN_SECRET=\n')
    fs.writeFileSync(path.join(dir, 'backend', 'app.js'), '//')
    const r = run(dir)
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/^OK/)
  })

  test('fails on env files, keystores, credentials, HLS keys, junk and an env that reuses an old secret', () => {
    const dir = path.join(tmp, 'dirty'); fs.mkdirSync(path.join(dir, 'app', 'hls-key'), { recursive: true }); fs.mkdirSync(path.join(dir, '__MACOSX'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'app', '.env'), `ACCESS_TOKEN_SECRET=${OLD_SECRET}\n`)
    fs.writeFileSync(path.join(dir, 'app', 'release.keystore'), 'x')
    fs.writeFileSync(path.join(dir, 'app', 'credentials.json'), '{}')
    fs.writeFileSync(path.join(dir, 'app', 'hls-key', 'enc.key'), 'x')
    fs.writeFileSync(path.join(dir, 'app', '.DS_Store'), 'x')
    const r = run(dir)
    expect(r.status).toBe(1)
    for (const needle of ['.env', 'release.keystore', 'credentials.json', 'enc.key', '.DS_Store', '__MACOSX', 'old installation']) expect(r.stdout).toContain(needle)
    expect(r.stdout).not.toContain(OLD_SECRET) // values are never printed
  })
})
