#!/usr/bin/env node
/* Builds a clean deployment bundle without secrets:  <project>/release/johar-release-<date>/{backend,web}  + a .tar.gz
 *
 *   npm run release:make
 *
 *  - backend/  : source, package files, .env.example, migrations. No .env, no node_modules, no uploads, no logs,
 *                no HLS key, no keystores, no tests, no OS junk.
 *  - web/      : the built website (frontend/dist), if it exists. Build it first with `npm run build` in frontend/.
 * The bundle is checked with predeploy-check and the script fails if anything forbidden slipped in.
 * The mobile app is not bundled: build it with EAS / Gradle using the signing credentials kept outside the repository. */
const fs = require('fs')
const path = require('path')
const { execFileSync, spawnSync } = require('child_process')

const project = path.resolve(__dirname, '..', '..')
const backend = path.join(project, 'backend')
const stamp = new Date().toISOString().slice(0, 10)
const out = path.join(project, 'release', `johar-release-${stamp}`)

const SKIP_NAMES = new Set(['node_modules', '.git', 'logs', 'tests', 'release', '__MACOSX', 'coverage'])
const skipFile = (name) => /^\.env($|\.)/i.test(name) && !/\.example$/i.test(name)
  || /\.(keystore|jks|pem|p12|pfx)$/i.test(name) || /^(\.DS_Store|\._.*)$/.test(name) || /^credentials\.json$/i.test(name)
  || /^enc\.key(info)?$/i.test(name) || /^ebirr\.php$/i.test(name)

fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })

const copy = (from, to, extraSkipTop = []) => fs.cpSync(from, to, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(from, src)
    if (!rel) return true
    const parts = rel.split(path.sep)
    if (parts.some((p) => SKIP_NAMES.has(p))) return false
    if (extraSkipTop.includes(parts[0])) return false
    return !skipFile(path.basename(src))
  },
})

copy(backend, path.join(out, 'backend'), ['files'])
// empty upload folders so the server can start; content is uploaded on the server, never shipped
for (const dir of ['uploads/common', 'uploads/chat', 'uploads/users/profile', 'uploads/videos', 'uploads/hls-key', 'uploads/temp', 'uploads/richtext', 'uploads/signatures']) {
  fs.mkdirSync(path.join(out, 'backend', 'files', dir), { recursive: true })
}
const dist = path.join(project, 'frontend', 'dist')
if (fs.existsSync(dist)) copy(dist, path.join(out, 'web'))
else console.warn('frontend/dist not found: the bundle has no web part (run `npm run build` in frontend/ first).')

// the bundle itself must pass the same check the project is held to
const check = spawnSync(process.execPath, [path.join(__dirname, 'predeploy-check.js'), '--root', out], { encoding: 'utf8' })
process.stdout.write(check.stdout)
if (check.status !== 0) { console.error('Release aborted: forbidden files in the bundle.'); process.exit(1) }

const archive = `${out}.tar.gz`
// relative names + cwd: GNU tar on Windows treats `C:\...` as a remote host
execFileSync('tar', ['-czf', path.basename(archive), path.basename(out)], { cwd: path.dirname(out) })
console.log(`Bundle: ${out}\nArchive: ${archive}`)
