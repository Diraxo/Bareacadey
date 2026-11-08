#!/usr/bin/env node
/* Checks whether a hosting plan can run this application, BEFORE paying for it or moving students.
 * It needs nothing but Node itself (optional modules are used only if installed) and changes nothing except a
 * throw-away table that it drops again. Works on a trial account, a VPS, or a laptop.
 *
 *   On the host:   node scripts/host-probe.js local            capability checks (Node, memory, disk, ffmpeg, native modules, MySQL)
 *                  node scripts/host-probe.js serve [port]     starts the test endpoints (default port: PORT or 4000)
 *   From anywhere: node scripts/host-probe.js client https://api.example.org [--idle 90]
 *                                                              tests /healthz, HTTP Range, WebSocket upgrade, idle WebSocket,
 *                                                              and a 70 s streaming response through the host's public proxy
 *
 * MySQL for `local` is read from DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME (use the database you were given).
 * Exit code 1 if any required check fails. */
const os = require('os')
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const { spawnSync } = require('child_process')

const results = []
const record = (name, ok, detail, required = true) => {
  results.push({ name, ok, required })
  console.log(`${ok ? 'PASS' : required ? 'FAIL' : 'WARN'}  ${name}${detail ? ' - ' + detail : ''}`)
}
const finish = () => {
  const failed = results.filter((r) => !r.ok && r.required)
  console.log(`\n${results.length - failed.length}/${results.length} passed; ${failed.length} required check(s) failed.`)
  process.exit(failed.length ? 1 : 0)
}

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const RANGE_SIZE = 5 * 1024 * 1024
const SLOW_SECONDS = 70
const textFrame = (s) => Buffer.concat([Buffer.from([0x81, Buffer.byteLength(s)]), Buffer.from(s)])

// ---------------------------------------------------------------- local
const local = async () => {
  const major = Number(process.versions.node.split('.')[0])
  record('Node >= 18', major >= 18, process.version)
  record('64-bit platform', os.arch() === 'x64' || os.arch() === 'arm64', `${os.platform()} ${os.arch()}`)
  const memGb = os.totalmem() / 2 ** 30
  record('RAM >= 1 GB visible', memGb >= 1, `${memGb.toFixed(1)} GB total, ${(os.freemem() / 2 ** 30).toFixed(1)} GB free (a shared host may cap the process lower than this)`, false)
  record('CPU cores', os.cpus().length >= 1, `${os.cpus().length}`, false)
  try {
    const s = fs.statfsSync(process.cwd())
    const freeGb = (s.bavail * s.bsize) / 2 ** 30
    record('Free disk >= 20 GB (videos)', freeGb >= 20, `${freeGb.toFixed(1)} GB free here; ask the host for the account quota and inode limit`, false)
  } catch (e) { record('Free disk', false, `cannot read: ${e.message}`, false) }

  for (const mod of ['bcrypt', 'sharp', 'mysql2', 'sequelize']) {
    try { require(path.join(__dirname, '..', 'node_modules', mod)); record(`module ${mod} loads`, true) }
    catch (e) { record(`module ${mod} loads`, false, e.code === 'MODULE_NOT_FOUND' ? 'not installed - run npm ci --omit=dev here first' : e.message.split('\n')[0]) }
  }

  // ffmpeg: system binary or the bundled one; encode 3 s of test video into AES-128 HLS and time it
  let ffmpeg = 'ffmpeg'
  for (const mod of ['@ffmpeg-installer/ffmpeg', 'ffmpeg-static']) {
    try { const m = require(path.join(__dirname, '..', 'node_modules', mod)); ffmpeg = m.path || m; break } catch (e) { /* try next */ }
  }
  const version = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8' })
  if (version.status !== 0) record('ffmpeg runs', false, 'not found or not executable (needed to process videos)')
  else {
    record('ffmpeg runs', true, version.stdout.split('\n')[0])
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'))
    fs.writeFileSync(path.join(dir, 'enc.key'), crypto.randomBytes(16))
    fs.writeFileSync(path.join(dir, 'enc.keyinfo'), `http://localhost/key\n${path.join(dir, 'enc.key')}\n`)
    const t0 = Date.now()
    const enc = spawnSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'testsrc=duration=10:size=1280x720:rate=25', '-f', 'lavfi', '-i', 'sine=duration=10',
      '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-hls_time', '4', '-hls_key_info_file', path.join(dir, 'enc.keyinfo'),
      '-hls_playlist_type', 'vod', path.join(dir, 'out.m3u8')], { encoding: 'utf8', timeout: 120000 })
    const secs = (Date.now() - t0) / 1000
    record('ffmpeg encodes 10 s of 720p to encrypted HLS', enc.status === 0 && fs.existsSync(path.join(dir, 'out.m3u8')),
      enc.status === 0 ? `${secs.toFixed(1)} s (a 1-hour lesson takes roughly ${(secs * 360 / 10).toFixed(0)} s at this speed if the encoder scales linearly)` : (enc.stderr || '').split('\n').slice(-3).join(' '))
    fs.rmSync(dir, { recursive: true, force: true })
  }

  // MySQL
  if (!process.env.DB_USER || !process.env.DB_NAME) return record('MySQL checks', false, 'set DB_HOST DB_USER DB_PASSWORD DB_NAME to test the database', false)
  try {
    const mysql = require(path.join(__dirname, '..', 'node_modules', 'mysql2', 'promise'))
    const c = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: 'utf8mb4' })
    const [[v]] = await c.query('SELECT VERSION() AS v, @@character_set_database AS cs, @@lower_case_table_names AS lc')
    record('MySQL reachable', true, `version ${v.v}`)
    record('MySQL 8 or MariaDB 10.6+', /mariadb/i.test(v.v) ? parseFloat(v.v) >= 10.6 : parseInt(v.v, 10) >= 8, v.v)
    record('Database charset is utf8mb4 (Amharic text)', /utf8mb4/.test(v.cs), v.cs + (/utf8mb4/.test(v.cs) ? '' : ' - recreate the database with CHARACTER SET utf8mb4'))
    try {
      await c.query('CREATE TABLE host_probe_tmp (id INT PRIMARY KEY, t VARCHAR(50)) CHARACTER SET utf8mb4')
      await c.query('INSERT INTO host_probe_tmp VALUES (1, ?)', ['ሰላም ዓለም'])
      const [[row]] = await c.query('SELECT t FROM host_probe_tmp WHERE id = 1')
      record('Can create tables and store Amharic text', row.t === 'ሰላም ዓለም', row.t)
    } catch (e) { record('Can create tables and store Amharic text', false, e.message) }
    finally { await c.query('DROP TABLE IF EXISTS host_probe_tmp').catch(() => {}); await c.end() }
  } catch (e) { record('MySQL reachable', false, e.message) }
}

// ---------------------------------------------------------------- serve
const serve = (port) => {
  const server = http.createServer((req, res) => {
    if (req.url === '/healthz') return res.end(JSON.stringify({ status: 'ok', node: process.version, pid: process.pid, uptime: process.uptime() }))
    if (req.url === '/range') {
      const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '')
      const start = m ? Number(m[1]) : 0
      const end = m && m[2] ? Math.min(Number(m[2]), RANGE_SIZE - 1) : RANGE_SIZE - 1
      res.writeHead(m ? 206 : 200, { 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, ...(m && { 'Content-Range': `bytes ${start}-${end}/${RANGE_SIZE}` }) })
      return res.end(Buffer.alloc(end - start + 1, 7))
    }
    if (req.url === '/slow') { // a chunk every 5 s: proxies with a 60 s read timeout cut this off
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' })
      let n = 0
      const t = setInterval(() => { res.write(`tick ${++n}\n`); if (n * 5 >= SLOW_SECONDS) { clearInterval(t); res.end('done\n') } }, 5000)
      return res.on('close', () => clearInterval(t))
    }
    res.statusCode = 404; res.end()
  })
  server.on('upgrade', (req, socket) => {
    if (!req.url.startsWith('/ws') ||!req.headers['sec-websocket-key']) return socket.destroy()
    const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + WS_GUID).digest('base64')
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
    socket.write(textFrame('hello'))
    const wait = Number(new URL(req.url, 'http://x').searchParams.get('idle') || 0)
    if (wait)setTimeout(() => socket.writable && socket.write(textFrame('after-idle')), wait * 1000)
    socket.on('error', () => {})
  })
  server.listen(port, '0.0.0.0', () => console.log(`probe endpoints listening on ${port}: /healthz /range /slow /ws. Put your host's real public URL in front and run the client from another machine.`))
}

// ---------------------------------------------------------------- client
const get = (url, options = {}) => new Promise((resolve, reject) => {
  const u = new URL(url)
  const lib = u.protocol === 'https:' ? https : http
  const req = lib.request(u, { method: 'GET', timeout: 30000, ...options }, (res) => resolve(res))
  req.on('error', reject).on('timeout', () => req.destroy(new Error('timeout'))).end()
})
const body = (res) => new Promise((resolve) => { const parts = []; res.on('data', (d) => parts.push(d)); res.on('end', () => resolve(Buffer.concat(parts))); res.on('error', () => resolve(Buffer.concat(parts))) })

const client = async (base, idleSeconds) => {
  base = base.replace(/\/$/, '')
  try {
    const res = await get(`${base}/healthz`)
    record('HTTP(S) reaches the Node process', res.statusCode === 200, `status ${res.statusCode}${base.startsWith('https') ? ', TLS ok' : ' (no TLS - the app needs https in production)'}`)
    if (!base.startsWith('https')) record('HTTPS in use', false, 'use the https:// address', !/\/\/(localhost|127\.)/.test(base))
    await body(res)
  } catch (e) { return record('HTTP(S) reaches the Node process', false, e.message) }

  try {
    const res = await get(`${base}/range`, { headers: { Range: 'bytes=1000-1999' } })
    const data = await body(res)
    record('HTTP Range requests (video seeking)', res.statusCode === 206 && data.length === 1000, `status ${res.statusCode}, ${data.length} bytes, Content-Range ${res.headers['content-range']}`)
  } catch (e) { record('HTTP Range requests (video seeking)', false, e.message) }

  // WebSocket upgrade, then stay idle to see whether the proxy drops quiet connections
  await new Promise((resolve) => {
    const key = crypto.randomBytes(16).toString('base64')
    const u = new URL(`${base}/ws?idle=${idleSeconds}`)
    const lib = u.protocol === 'https:' ? https : http
    let settled = false
    const req = lib.request(u, { headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': key } })
    const timer = setTimeout(() => { record(`WebSocket stays open ${idleSeconds} s idle`, false, 'no message after the idle period'); req.destroy(); resolve() }, (idleSeconds + 15) * 1000)
    req.on('upgrade', (res, socket) => {
      const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64')
      record('WebSocket upgrade (101) through the proxy', res.statusCode === 101 && res.headers['sec-websocket-accept'] === accept, `status ${res.statusCode}`)
      socket.on('data', (d) => {
        if (d.toString().includes('after-idle') && !settled) { settled = true; clearTimeout(timer); record(`WebSocket stays open ${idleSeconds} s idle`, true); socket.destroy(); resolve() }
      })
      socket.on('close', () => { if (!settled) { settled = true; clearTimeout(timer); record(`WebSocket stays open ${idleSeconds} s idle`, false, 'connection closed by the proxy/host'); resolve() } })
    })
    req.on('response', (res) => { clearTimeout(timer); record('WebSocket upgrade (101) through the proxy', false, `got ${res.statusCode} instead of 101 - the proxy does not forward upgrades`); resolve() })
    req.on('error', (e) => { clearTimeout(timer); record('WebSocket upgrade (101) through the proxy', false, e.message); resolve() })
    req.end()
  })

  try {
    const t0 = Date.now()
    const res = await get(`${base}/slow`, { timeout: (SLOW_SECONDS + 30) * 1000 })
    const data = (await body(res)).toString()
    record(`Long response (${SLOW_SECONDS} s) is not cut by a proxy timeout`, data.includes('done'), `${((Date.now() - t0) / 1000).toFixed(0)} s, ended ${data.includes('done') ? 'normally' : 'early'}`)
  } catch (e) { record(`Long response (${SLOW_SECONDS} s) is not cut by a proxy timeout`, false, e.message) }
}

// ---------------------------------------------------------------- main
const [mode, arg] = process.argv.slice(2)
if (mode === 'local') local().then(finish)
else if (mode === 'serve') serve(Number(arg || process.env.PORT || 4000))
else if (mode === 'client' && arg) {
  const i = process.argv.indexOf('--idle')
  client(arg, i > -1 ? Number(process.argv[i + 1]) : 90).then(finish)
} else { console.log('usage: host-probe.js local | serve [port] | client <https://url> [--idle seconds]'); process.exit(2) }
