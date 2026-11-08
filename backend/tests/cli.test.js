/* Runs the real operator scripts as child processes against a throw-away SQLite file (never a MySQL server). */
const { spawnSync, spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')

const root = path.join(__dirname, '..')
const dbFile = path.join(os.tmpdir(), `johar-cli-${Date.now()}.sqlite`)
const env = { ...process.env, NODE_ENV: 'test', SQLITE_STORAGE: dbFile, TEST_DB_DIALECT: '' } // the CLI checks always use their own SQLite file
const run = (script, args = [], extraEnv = {}) =>
  spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { env: { ...env, ...extraEnv }, encoding: 'utf8', cwd: root })

afterAll(() => { try { fs.rmSync(dbFile, { force: true }) } catch (e) { /* ignore */ } })

describe('operator scripts', () => {
  test('db:init creates the schema and reference data on an empty database', () => {
    const r = run('db-init.js')
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/Applied \d+ migration/)
    expect(r.stdout).toMatch(/Reference data/)
  })

  test('db:init refuses to touch a database that already has tables', () => {
    const r = run('db-init.js')
    expect(r.status).toBe(2)
    expect(r.stderr).toMatch(/not empty/)
  })

  test('db:init --allow-existing only applies pending work and keeps data', () => {
    const r = run('db-init.js', ['--allow-existing'])
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/No pending migrations/)
  })

  test('admin:create needs a password; it is never taken from argv', () => {
    const r = run('create-admin.js', ['--email', 'admin@example.org', '--password', 'Str0ng!Passw0rd'], { ADMIN_PASSWORD: '' })
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/No ADMIN_PASSWORD/)
  })

  test('admin:create rejects a weak password and prints nothing secret', () => {
    const r = run('create-admin.js', ['--email', 'admin@example.org'], { ADMIN_PASSWORD: 'weak' })
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/at least 12/)
    expect(r.stdout + r.stderr).not.toContain('weak')
  })

  test('admin:create makes the first Super Admin, then refuses a second one', () => {
    const pw = 'Str0ng!Passw0rd'
    const ok = run('create-admin.js', ['--email', 'admin@example.org', '--first-name', 'Ada'], { ADMIN_PASSWORD: pw })
    expect(ok.status).toBe(0)
    expect(ok.stdout).toMatch(/id 1/)
    expect(ok.stdout + ok.stderr).not.toContain(pw)
    const again = run('create-admin.js', ['--email', 'second@example.org'], { ADMIN_PASSWORD: pw })
    expect(again.status).toBe(1)
    expect(again.stderr).toMatch(/already exist/)
  })

  test('db:migrate is a no-op on an up-to-date database', () => {
    const r = run('db-migrate.js', ['--seed'])
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/No pending migrations/)
  })
})

describe('server process', () => {
  test('server.js starts, serves /healthz and cannot be used to sync the schema', async () => {
    const port = 4590
    const child = spawn(process.execPath, [path.join(root, 'server.js')], { env: { ...env, PORT: String(port) }, cwd: root, stdio: 'pipe' })
    try {
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('server did not start')), 15000)
        child.stdout.on('data', (d) => { if (String(d).includes('app running')) { clearTimeout(t); resolve() } })
        child.on('exit', (code) => reject(new Error('server exited ' + code)))
      })
      const get = (p, method = 'GET') => new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port, path: p, method }, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, body: b })) })
        req.on('error', reject); req.end()
      })
      expect((await get('/healthz')).status).toBe(200)
      expect([401, 403, 404]).toContain((await get('/sync-database', 'POST')).status) // never a 2xx/handler
    } finally {
      child.kill()
    }
  })
})
