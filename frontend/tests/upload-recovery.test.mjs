import test from 'node:test'
import assert from 'node:assert/strict'
import { secondsLeft, requestNewAccessToken, createSingleFlight } from '../src/utils/authRefresh.js'
import { runBatch, classifyUploadError, matchFiles, matchFilesStrong } from '../src/utils/batchUploadRunner.js'
import { createHash } from 'node:crypto'
import { fingerprintFile } from '../src/utils/fileFingerprint.js'

const jwtWithExp = (exp) => `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`
const reply = (status, body) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => body })

/* ---------- authentication ---------- */
test('refresh succeeds -> ok with the new token', async () => {
  const r = await requestNewAccessToken(reply(200, { accessToken: 'a', user: {} }), 'u')
  assert.equal(r.kind, 'ok')
})
test('refresh token genuinely invalid (401/403) -> invalid, the only case that ends the session', async () => {
  assert.equal((await requestNewAccessToken(reply(403, { error: true }), 'u')).kind, 'invalid')
  assert.equal((await requestNewAccessToken(reply(401, { message: 'Unauthorized' }), 'u')).kind, 'invalid') // an empty {} is not our server's answer
})
test('network failure, 500, 429 and a body without a token are transient, never a logout', async () => {
  assert.equal((await requestNewAccessToken(async () => { throw new TypeError('Failed to fetch') }, 'u')).kind, 'transient')
  assert.equal((await requestNewAccessToken(reply(500, {}), 'u')).kind, 'transient')
  assert.equal((await requestNewAccessToken(reply(429, {}), 'u')).kind, 'transient')
  assert.equal((await requestNewAccessToken(reply(200, { message: 'odd' }), 'u')).kind, 'transient')
})
test('simultaneous refreshes share one request', async () => {
  let calls = 0
  const refresh = createSingleFlight(async () => { calls += 1; await new Promise((r) => setTimeout(r, 20)); return { kind: 'ok' } })
  const all = await Promise.all([refresh(), refresh(), refresh(), refresh()])
  assert.equal(calls, 1)
  assert.ok(all.every((x) => x.kind === 'ok'))
  await refresh()
  assert.equal(calls, 2) // a later expiry may refresh again
})
test('token expiry is read from the payload only', () => {
  const now = 1_000_000_000_000
  assert.equal(Math.round(secondsLeft(jwtWithExp(now / 1000 + 90), now)), 90)
  assert.ok(secondsLeft(jwtWithExp(now / 1000 - 5), now) < 0)
  assert.equal(secondsLeft('garbage'), null)
  assert.equal(secondsLeft(null), null)
})

/* ---------- upload runner ---------- */
const mkBatch = (n) => ({
  id: 'b1', status: 'in_progress', total_files: n, done_files: 0, failed_files: 0, pending_files: n, total_bytes: n * 10, done_bytes: 0,
  files: Array.from({ length: n }, (_, i) => ({ id: `f${i}`, name: `v${i}.mp4`, size: 10, status: 'pending', error: null })),
})
const localFiles = (n) => Array.from({ length: n }, (_, i) => ({ name: `v${i}.mp4`, size: 10 }))
/* a tiny fake server that behaves like the real one */
const fakeServer = (batch, { failOnce = new Set(), loseAnswerOnce = new Set(), reject = new Set() } = {}) => {
  const state = JSON.parse(JSON.stringify(batch))
  const stored = []
  const snapshot = () => {
    const done = state.files.filter((f) => f.status === 'done')
    const failed = state.files.filter((f) => f.status === 'failed')
    const total = state.files.length
    return { ...state, done_files: done.length, failed_files: failed.length, pending_files: total - done.length - failed.length, done_bytes: done.length * 10,
      status: done.length === total ? 'completed' : done.length + failed.length < total ? 'in_progress' : done.length ? 'partial' : 'failed', files: state.files.map((f) => ({ ...f })) }
  }
  return {
    stored, snapshot,
    uploadFile: async (batchId, row) => {
      const f = state.files.find((x) => x.id === row.id)
      if (reject.has(row.id)) { f.status = 'failed'; f.error = 'File is too large'; throw { status: 400, data: { message: 'File is too large', batch: snapshot() } } }
      if (failOnce.has(row.id)) { failOnce.delete(row.id); throw { status: 503, data: {} } }
      if (f.status === 'done') return { duplicate: true, batch: snapshot() }
      f.status = 'done'; stored.push(row.id)
      if (loseAnswerOnce.has(row.id)) { loseAnswerOnce.delete(row.id); throw { status: undefined } } // stored, but the answer never arrived
      return { batch: snapshot() }
    },
    getBatch: async () => ({ batch: snapshot() }),
  }
}
const noWait = { sleep: async () => {}, isOnline: () => true }

test('50 files: every file is stored exactly once and the server says completed', async () => {
  const srv = fakeServer(mkBatch(50))
  const res = await runBatch({ batch: mkBatch(50), files: localFiles(50), ...srv, ...noWait })
  assert.equal(res.batch.status, 'completed')
  assert.equal(srv.stored.length, 50)
  assert.equal(new Set(srv.stored).size, 50)
})
test('progress is "in_progress" until the server confirms the last file', async () => {
  const srv = fakeServer(mkBatch(5))
  const seen = []
  await runBatch({ batch: mkBatch(5), files: localFiles(5), ...srv, ...noWait, onUpdate: (u) => seen.push(u.batch.status) })
  assert.equal(seen[0], 'in_progress')
  assert.equal(seen[seen.length - 1], 'completed')
  assert.equal(seen.indexOf('completed') >= seen.length - 2, true)
})
test('response lost after the server stored the file -> retry is answered "already saved", nothing is stored twice', async () => {
  const srv = fakeServer(mkBatch(3), { loseAnswerOnce: new Set(['f1']) })
  const res = await runBatch({ batch: mkBatch(3), files: localFiles(3), ...srv, ...noWait })
  assert.equal(res.batch.status, 'completed')
  assert.deepEqual(srv.stored.sort(), ['f0', 'f1', 'f2'])
})
test('temporary server error is retried and the run goes on', async () => {
  const srv = fakeServer(mkBatch(3), { failOnce: new Set(['f0']) })
  const res = await runBatch({ batch: mkBatch(3), files: localFiles(3), ...srv, ...noWait })
  assert.equal(res.batch.status, 'completed')
  assert.equal(res.stopped, null)
})
test('47 of 50 succeed; only the 3 failed files are sent again, the 47 are never re-sent', async () => {
  const bad = new Set(['f5', 'f20', 'f33'])
  const srv = fakeServer(mkBatch(50), { reject: bad })
  const first = await runBatch({ batch: mkBatch(50), files: localFiles(50), ...srv, ...noWait })
  assert.equal(first.batch.status, 'partial')
  assert.equal(first.batch.done_files, 47)
  const sent = []
  bad.clear()
  const second = await runBatch({ batch: first.batch, files: localFiles(50), ...srv, ...noWait, uploadFile: (b, row, f, p) => { sent.push(row.id); return srv.uploadFile(b, row, f, p) } })
  assert.deepEqual(sent.sort(), ['f20', 'f33', 'f5'])
  assert.equal(second.batch.status, 'completed')
  assert.equal(srv.stored.length, 50)
})
test('all files fail -> failed, nothing is reported as success', async () => {
  const srv = fakeServer(mkBatch(2), { reject: new Set(['f0', 'f1']) })
  const res = await runBatch({ batch: mkBatch(2), files: localFiles(2), ...srv, ...noWait })
  assert.equal(res.batch.status, 'failed')
})
test('resume after a refresh: only the files chosen again are sent, the rest stay pending', async () => {
  const srv = fakeServer(mkBatch(4))
  await runBatch({ batch: mkBatch(4), files: localFiles(4).slice(0, 2), ...srv, ...noWait })
  const snap = srv.snapshot()
  assert.equal(snap.status, 'in_progress')
  assert.equal(snap.done_files, 2)
  const sent = []
  const res = await runBatch({ batch: snap, files: localFiles(4).slice(2), ...srv, ...noWait, uploadFile: (b, row, f, p) => { sent.push(row.id); return srv.uploadFile(b, row, f, p) } })
  assert.deepEqual(sent, ['f2', 'f3'])
  assert.equal(res.batch.status, 'completed')
})
test('network down: the run stops without losing the files already stored', async () => {
  const srv = fakeServer(mkBatch(3))
  let n = 0
  const res = await runBatch({ batch: mkBatch(3), files: localFiles(3), ...srv, ...noWait,
    uploadFile: (b, row, f, p) => (n++ === 0 ? srv.uploadFile(b, row, f, p) : Promise.reject({ status: undefined })) })
  assert.ok(res.stopped)
  assert.equal(res.batch.done_files, 1)
})
test('error classes: 401/403 stop (nothing cleared), 413 is per file, 5xx/timeouts are retried', () => {
  assert.equal(classifyUploadError({ status: 403 }), 'stop')
  assert.equal(classifyUploadError({ status: 401 }), 'stop')
  assert.equal(classifyUploadError({ status: 413 }), 'file')
  assert.equal(classifyUploadError({ status: 500 }), 'retry')
  assert.equal(classifyUploadError({ status: undefined }), 'retry')
  assert.equal(classifyUploadError({ status: 408 }), 'retry')
})
test('a hidden tab is not an input: the runner never looks at visibility and finishes anyway', async () => {
  const saved = globalThis.document
  globalThis.document = { visibilityState: 'hidden', addEventListener() { throw new Error('must not listen') } }
  try {
    const srv = fakeServer(mkBatch(3))
    const res = await runBatch({ batch: mkBatch(3), files: localFiles(3), ...srv, ...noWait })
    assert.equal(res.batch.status, 'completed')
  } finally { globalThis.document = saved }
})
test('waits while offline and continues when the connection returns', async () => {
  const srv = fakeServer(mkBatch(2))
  let online = false
  const phases = []
  const res = await runBatch({ batch: mkBatch(2), files: localFiles(2), ...srv, sleep: async () => {}, isOnline: () => online,
    waitOnline: async () => { online = true }, onUpdate: (u) => phases.push(u.phase) })
  assert.ok(phases.includes('waiting'))
  assert.equal(res.batch.status, 'completed')
})
test('name + size alone never silently pairs two look-alike files: identical pairs are ambiguous', () => {
  const rows = [{ id: 'a', name: 'x.mp4', size: 1 }, { id: 'b', name: 'x.mp4', size: 1 }, { id: 'c', name: 'y.mp4', size: 2 }]
  const m = matchFiles(rows, [{ name: 'x.mp4', size: 1 }, { name: 'y.mp4', size: 3 }])
  assert.equal(m.size, 0) // x.mp4 could be row a or b; y.mp4 has the wrong size
  const r = matchFilesStrong(rows, [{ name: 'x.mp4', size: 1 }], new Map())
  assert.deepEqual(r.ambiguous.sort(), ['a', 'b'])
  assert.equal(r.matches.size, 0)
  // a single, unmistakable pair still matches
  assert.equal(matchFiles([{ id: 'z', name: 'one.mp4', size: 5 }], [{ name: 'one.mp4', size: 5 }]).size, 1)
})
test('fingerprints tell apart two files with the same name and size, and each file is used once', () => {
  const f1 = { name: 'same.mp4', size: 9 }; const f2 = { name: 'same.mp4', size: 9 }
  const prints = new Map([[f1, 'aaa'], [f2, 'bbb']])
  const rows = [{ id: 'r1', name: 'same.mp4', size: 9, fingerprint: 'bbb' }, { id: 'r2', name: 'same.mp4', size: 9, fingerprint: 'aaa' }]
  const r = matchFilesStrong(rows, [f1, f2], prints)
  assert.equal(r.matches.get('r1'), f2)
  assert.equal(r.matches.get('r2'), f1)
  assert.equal(r.ambiguous.length, 0)
  // the wrong file (other fingerprint) is not accepted for a row that has one
  assert.equal(matchFilesStrong([rows[0]], [f1], prints).matches.size, 0)
})
test('the browser fingerprint equals the server algorithm (size, first 64 KiB, last 64 KiB)', async () => {
  const bytes = new Uint8Array(200 * 1024).map((_, i) => i % 251)
  const file = new File([bytes], 'a.mp4')
  const expected = createHash('sha256').update(`${bytes.length}:`).update(bytes.subarray(0, 65536)).update(bytes.subarray(bytes.length - 65536)).digest('hex')
  assert.equal(await fingerprintFile(file), expected)
  const small = new File([new Uint8Array([1, 2, 3])], 'b.mp4')
  assert.equal(await fingerprintFile(small), createHash('sha256').update('3:').update(Buffer.from([1, 2, 3])).update(Buffer.from([1, 2, 3])).digest('hex'))
  assert.notEqual(await fingerprintFile(new File([new Uint8Array(bytes).fill(7)], 'a.mp4')), expected)
})
test('retrying single files: only the chosen failed rows are sent', async () => {
  const srv = fakeServer(mkBatch(4), { reject: new Set(['f1', 'f2']) })
  const first = await runBatch({ batch: mkBatch(4), files: localFiles(4), ...srv, ...noWait })
  assert.equal(first.batch.status, 'partial')
  const sent = []
  await runBatch({ batch: first.batch, files: localFiles(4), only: new Set(['f2']), ...srv, ...noWait, uploadFile: (b, row, f, p) => { sent.push(row.id); return srv.uploadFile(b, row, f, p) } })
  assert.deepEqual(sent, ['f2'])
})
