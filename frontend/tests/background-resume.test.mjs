import test from 'node:test'
import assert from 'node:assert/strict'
import { requestNewAccessToken, endsSession, sendWithRenewal, createAcrossTabs, tokenUnchanged } from '../src/utils/authRefresh.js'
import { runBatch, classifyUploadError, describeError } from '../src/utils/batchUploadRunner.js'

/* Background tab / screen off / sleep-wake. These pin the behaviour after the laptop comes back: a gap in the network
 * (or an answer that did not come from our own server) must not end the sign-in or stop an upload for good. */

const reply = (status, body, { json = true } = {}) => async () => ({
  status, ok: status >= 200 && status < 300,
  json: async () => { if (!json) throw new SyntaxError('Unexpected token < in JSON'); return body },
})
const farFuture = `h.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString('base64url')}.s`

/* ---------- a refusal that did not come from our server is not "the session is over" ---------- */
test('a 403/401 page from a proxy or firewall (no application code) keeps the session; our own refusals still end it', async () => {
  const kind = (f) => requestNewAccessToken(f, 'u')
  for (const status of [401, 403]) {
    const html = await kind(reply(status, null, { json: false }))
    assert.equal(html.kind, 'transient', `${status} HTML`)
    assert.equal(endsSession(html), false)
    const empty = await kind(reply(status, {}))
    assert.equal(empty.kind, 'transient', `${status} empty object`)
    assert.equal((await kind(reply(status, null))).kind, 'transient', `${status} empty body`)
  }
  // servers from before the codes existed answered with a message / error flag: still a refusal of the session
  assert.equal((await kind(reply(403, { error: true, message: 'You are forbidden' }))).kind, 'invalid')
  assert.equal((await kind(reply(401, { message: 'Unauthorized' }))).kind, 'invalid')
  for (const code of ['session_invalid', 'session_revoked', 'session_missing']) {
    assert.equal((await kind(reply(403, { code }))).kind, 'invalid', code)
  }
  assert.equal((await kind(reply(403, { code: 'session_expired' }))).kind, 'expired')
})

/* ---------- renewal that only failed because the network was not back yet ---------- */
test('403 + renewal failed only transiently: the same request is not resent, and the answer says the renewal is what failed', async () => {
  let sends = 0
  const res = await sendWithRenewal({ args: {}, send: async () => { sends += 1; return { error: { status: 403 } } }, renew: async () => ({ kind: 'transient', reason: 'network' }), getToken: () => farFuture })
  assert.equal(sends, 1)
  assert.equal(res.error.status, 403)
  assert.equal(res.error.renewalFailed, 'transient')
})
test('a genuine 403 (renewal ok, still refused) or an invalid renewal is NOT marked transient', async () => {
  const still = await sendWithRenewal({ args: {}, send: async () => ({ error: { status: 403 } }), renew: async () => ({ kind: 'ok' }), getToken: () => farFuture })
  assert.equal(still.error.renewalFailed, undefined)
  const dead = await sendWithRenewal({ args: {}, send: async () => ({ error: { status: 403 } }), renew: async () => ({ kind: 'invalid' }), getToken: () => farFuture })
  assert.equal(dead.error.renewalFailed, undefined)
})
test('upload classification: transient renewal failure is retried, a real 401/403 still stops', () => {
  assert.equal(classifyUploadError({ status: 403, renewalFailed: 'transient' }), 'retry')
  assert.equal(classifyUploadError({ status: 403 }), 'stop')
  assert.equal(classifyUploadError({ status: 401 }), 'stop')
  assert.match(describeError({ status: 403, renewalFailed: 'transient' }), /connection/i)
})

/* ---------- the network comes back some seconds after the laptop wakes ---------- */
const mkBatch = (n) => ({
  id: 'b1', status: 'in_progress', total_files: n, done_files: 0, failed_files: 0, pending_files: n, total_bytes: n * 10, done_bytes: 0,
  files: Array.from({ length: n }, (_, i) => ({ id: `f${i}`, name: `v${i}.mp4`, size: 10, status: 'pending' })),
})
const fakeFiles = (n) => Array.from({ length: n }, (_, i) => ({ name: `v${i}.mp4`, size: 10 }))
const store = (batch) => {
  const b = JSON.parse(JSON.stringify(batch))
  const snap = () => { b.done_files = b.files.filter((f) => f.status === 'done').length; b.pending_files = b.files.filter((f) => f.status !== 'done').length; b.status = b.done_files === b.total_files ? 'completed' : 'in_progress'; return JSON.parse(JSON.stringify(b)) }
  return { save: (id) => { b.files.find((f) => f.id === id).status = 'done'; return { batch: snap() } }, get: async () => ({ batch: snap() }) }
}
const virtualClock = () => { let t = 0; return { now: () => t, sleep: async (ms) => { t += ms } } }

for (const [outageMs, label] of [[5000, '5 s'], [20000, '20 s'], [60000, '60 s']]) {
  test(`network back ${label} after the laptop woke: the upload continues instead of stopping, nothing is stored twice`, async () => {
    const clock = virtualClock(); const srv = store(mkBatch(2)); const calls = []
    const res = await runBatch({
      batch: mkBatch(2), files: fakeFiles(2), isOnline: () => true, sleep: clock.sleep, getBatch: srv.get,
      uploadFile: async (b, row) => {
        calls.push([clock.now(), row.id])
        if (clock.now() < outageMs) throw { status: undefined }
        return srv.save(row.id)
      },
    })
    assert.equal(res.stopped, null, 'run was not stopped')
    assert.equal(res.batch.status, 'completed')
    assert.equal(res.batch.done_files, 2)
    assert.equal(calls.filter(([, id]) => id === 'f0').length >= 1, true)
  })
}
test('a connection that stays down is still reported, not retried forever, and no file is marked done', async () => {
  const clock = virtualClock(); const srv = store(mkBatch(2)); let attempts = 0
  const res = await runBatch({ batch: mkBatch(2), files: fakeFiles(2), isOnline: () => true, sleep: clock.sleep, getBatch: srv.get,
    uploadFile: async () => { attempts += 1; throw { status: undefined } } })
  assert.ok(res.stopped)
  assert.equal(res.batch.done_files, 0)
  assert.ok(attempts <= 10, `bounded: ${attempts} attempts`)
  assert.ok(clock.now() <= 5 * 60 * 1000, `bounded wait: ${clock.now()} ms`)
})
test('server errors keep the short retry schedule (only connection loss gets the longer one)', async () => {
  const clock = virtualClock(); const srv = store(mkBatch(1)); let attempts = 0
  await runBatch({ batch: mkBatch(1), files: fakeFiles(1), isOnline: () => true, sleep: clock.sleep, getBatch: srv.get,
    uploadFile: async () => { attempts += 1; throw { status: 503 } } })
  assert.equal(attempts, 4)
  assert.equal(clock.now(), 12000)
})

/* ---------- refreshes from several tabs ---------- */
test('refreshes from different tabs run one after another, never overlapping (Web Locks)', async () => {
  // a minimal lock manager: exclusive, FIFO, like navigator.locks
  let tail = Promise.resolve()
  const locks = { request: (name, fn) => { const run = tail.then(() => fn()); tail = run.catch(() => {}); return run } }
  let active = 0; let maxActive = 0
  const task = async () => { active += 1; maxActive = Math.max(maxActive, active); await new Promise((r) => setTimeout(r, 5)); active -= 1; return { kind: 'ok' } }
  const tabA = createAcrossTabs(task, { locks })
  const tabB = createAcrossTabs(task, { locks })
  const tabC = createAcrossTabs(task, { locks })
  const results = await Promise.all([tabA(), tabB(), tabC(), tabA()])
  assert.equal(maxActive, 1)
  assert.ok(results.every((r) => r.kind === 'ok'))
})
test('without Web Locks the refresh still runs (older browsers)', async () => {
  const run = createAcrossTabs(async () => ({ kind: 'ok' }), { locks: null })
  assert.equal((await run()).kind, 'ok')
})
test('a lock that cannot be taken does not block the refresh', async () => {
  const run = createAcrossTabs(async () => ({ kind: 'ok' }), { locks: { request: async () => { throw new Error('SecurityError') } } })
  assert.equal((await run()).kind, 'ok')
})

/* ---------- a late answer must not replace what happened meanwhile ---------- */
test('a refresh answer is applied only if the signed-in token is still the one the refresh started from', () => {
  assert.equal(tokenUnchanged('T1', 'T1'), true)
  assert.equal(tokenUnchanged(null, null), true)       // page load, nothing changed
  assert.equal(tokenUnchanged('T1', null), false)      // signed out while the refresh was running
  assert.equal(tokenUnchanged('T1', 'T2'), false)      // another sign-in / another refresh landed first
  assert.equal(tokenUnchanged(null, 'T2'), false)      // signed in while the page-load restore was still running
})
