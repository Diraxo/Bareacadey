import test from 'node:test'
import assert from 'node:assert/strict'
import {
  requestNewAccessToken, createSingleFlight, refreshWithRetry, endsSession, sendWithRenewal, classifyLogoutAnswer, secondsLeft,
} from '../src/utils/authRefresh.js'
import { authReducers, initialAuthState } from '../src/features/auth/authState.js'
import { summarizeBatch } from '../src/utils/uploadSummary.js'
import { visibleRecoveryBatches, hasRunningBatch, describeSelection, RECOVERY_HINT } from '../src/utils/uploadRecovery.js'
import { computeRemovedFiles } from '../src/utils/chapterUpload.js'

const reply = (status, body) => async () => ({ status, ok: status >= 200 && status < 300, json: async () => body })
const jwtWithExp = (exp) => `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`
const noSleep = { sleep: async () => {} }

/* ---------- refresh outcomes ---------- */
test('only a refusal by the server ends the session; each temporary failure is named and keeps it', async () => {
  const kind = async (f) => requestNewAccessToken(f, 'u')
  assert.equal((await kind(reply(403, { code: 'session_revoked' }))).kind, 'invalid')
  assert.equal((await kind(reply(401, { code: 'session_missing' }))).kind, 'invalid')
  const expired = await kind(reply(403, { code: 'session_expired' }))
  assert.equal(expired.kind, 'expired')
  assert.ok(endsSession(expired))
  const reasons = {
    network: await kind(async () => { throw new TypeError('Failed to fetch') }),
    timeout: await kind(async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e }),
    rate_limited: await kind(reply(429, {})),
    server: await kind(reply(503, {})),
    unreadable: await kind(reply(200, { odd: true })),
  }
  for (const [reason, outcome] of Object.entries(reasons)) {
    assert.equal(outcome.kind, 'transient', reason)
    assert.equal(outcome.reason, reason)
    assert.equal(endsSession(outcome), false)
  }
})

test('simultaneous refresh calls share one request', async () => {
  let calls = 0
  const refresh = createSingleFlight(async () => { calls += 1; await new Promise((r) => setTimeout(r, 20)); return { kind: 'ok' } })
  await Promise.all([refresh(), refresh(), refresh(), refresh(), refresh()])
  assert.equal(calls, 1)
})

test('transient failures are retried a bounded number of times, then reported, never looped', async () => {
  let calls = 0
  const out = await refreshWithRetry(async () => { calls += 1; return { kind: 'transient', reason: 'server' } }, { delays: [1, 2, 3], ...noSleep })
  assert.equal(calls, 4) // first try + three retries, then it stops
  assert.equal(out.kind, 'transient')
})
test('a retry that succeeds ends the loop; an invalid answer is never retried', async () => {
  let calls = 0
  const ok = await refreshWithRetry(async () => (++calls < 3 ? { kind: 'transient' } : { kind: 'ok' }), { delays: [1, 1, 1, 1], ...noSleep })
  assert.equal(ok.kind, 'ok'); assert.equal(calls, 3)
  let again = 0
  const bad = await refreshWithRetry(async () => { again += 1; return { kind: 'invalid' } }, { ...noSleep })
  assert.equal(bad.kind, 'invalid'); assert.equal(again, 1)
})
test('while offline the retry waits for the connection instead of burning attempts', async () => {
  let online = false; let waited = 0; let calls = 0
  const out = await refreshWithRetry(async () => (++calls === 1 ? { kind: 'transient' } : { kind: 'ok' }), { delays: [1], isOnline: () => online, waitOnline: async () => { waited += 1; online = true } })
  assert.equal(waited, 1); assert.equal(out.kind, 'ok')
})

/* ---------- auth state ---------- */
const act = (name) => (payload) => ({ name, payload })
const setCredentials = act('setCredentials'), logOut = act('logOut'), setAuthChecked = act('setAuthChecked'), setAuthUnavailable = act('setAuthUnavailable')
const reducer = (s, a) => { const next = structuredClone(s); authReducers[a.name](next, { payload: a.payload }); return next }
const state = (...actions) => actions.reduce((s, a) => reducer(s, a), structuredClone(initialAuthState))
test('page load: a temporary failure is "unavailable", not "signed out"; a retry that works signs in', () => {
  const s1 = state(setAuthUnavailable())
  assert.equal(s1.status, 'unavailable'); assert.equal(s1.checked, false)
  const s2 = reducer(s1, setCredentials({ accessToken: 'tok', user: { id: 1 } }))
  assert.equal(s2.status, 'signedIn'); assert.equal(s2.token, 'tok'); assert.equal(s2.checked, true)
})
test('an invalid or expired session returns to the signed-out state with the reason', () => {
  const s = state(setCredentials({ accessToken: 't', user: { id: 1 } }), logOut({ reason: 'expired' }))
  assert.equal(s.status, 'signedOut'); assert.equal(s.token, null); assert.equal(s.user, null); assert.equal(s.endedReason, 'expired')
  assert.equal(state(setAuthChecked()).status, 'signedOut') // nothing was ever restored
})
test('a failed refresh never stores empty credentials or erases a working sign-in', () => {
  const signedIn = state(setCredentials({ accessToken: 't', user: { id: 7 } }))
  const after = reducer(signedIn, setCredentials({ accessToken: undefined, user: undefined }))
  assert.equal(after.token, 't'); assert.equal(after.user.id, 7)
  const stillIn = reducer(signedIn, setAuthUnavailable())
  assert.equal(stillIn.token, 't'); assert.equal(stillIn.status, 'signedIn')
})

/* ---------- logout ---------- */
test('logout is final only when the server answered; a network or server failure keeps the user signed in', () => {
  assert.equal(classifyLogoutAnswer(undefined), 'done')
  assert.equal(classifyLogoutAnswer({ status: 403 }), 'done') // the session was already gone
  assert.equal(classifyLogoutAnswer({ status: 401 }), 'done')
  assert.equal(classifyLogoutAnswer({ status: undefined }), 'transient')
  assert.equal(classifyLogoutAnswer({ status: 500 }), 'transient')
  assert.equal(classifyLogoutAnswer({ status: 429 }), 'transient')
})

/* ---------- request retry after renewal ---------- */
const farFuture = jwtWithExp(Date.now() / 1000 + 3600)
test('a 403 renews once and sends the very same request (same FormData object) again', async () => {
  const form = { sentinel: 'FormData' }
  const seen = []
  let n = 0
  const send = async (args) => { seen.push(args); return ++n === 1 ? { error: { status: 403 } } : { data: { ok: true } } }
  let renewals = 0
  const res = await sendWithRenewal({ args: { body: form, upload: true }, send, renew: async () => { renewals += 1; return { kind: 'ok' } }, getToken: () => farFuture })
  assert.deepEqual(res, { data: { ok: true } })
  assert.equal(renewals, 1)
  assert.equal(seen.length, 2)
  assert.equal(seen[0], seen[1]) // identical args object: the FormData and its progress callback are reused as they are
  assert.equal(seen[1].body, form)
})
test('a temporary renewal failure does not resend (no repeated big upload) and returns the original error', async () => {
  let sends = 0
  const send = async () => { sends += 1; return { error: { status: 403 } } }
  const res = await sendWithRenewal({ args: {}, send, renew: async () => ({ kind: 'transient', reason: 'network' }), getToken: () => farFuture })
  assert.equal(sends, 1)
  assert.equal(res.error.status, 403)
})
test('an invalid renewal does not resend either; only one renewal per request, never a loop', async () => {
  let sends = 0; let renewals = 0
  await sendWithRenewal({ args: {}, send: async () => { sends += 1; return { error: { status: 403 } } }, renew: async () => { renewals += 1; return { kind: 'invalid' } }, getToken: () => farFuture })
  assert.deepEqual([sends, renewals], [1, 1])
  // renewal succeeds but the server still says 403: exactly one retry
  sends = 0; renewals = 0
  await sendWithRenewal({ args: {}, send: async () => { sends += 1; return { error: { status: 403 } } }, renew: async () => { renewals += 1; return { kind: 'ok' } }, getToken: () => farFuture })
  assert.deepEqual([sends, renewals], [2, 1])
})
test('a token about to expire is renewed before a big upload starts, an ordinary request waits until it is really close', async () => {
  const soon = jwtWithExp(Date.now() / 1000 + 60)
  let renewals = 0
  const renew = async () => { renewals += 1; return { kind: 'ok' } }
  await sendWithRenewal({ args: {}, send: async () => ({ data: 1 }), renew, getToken: () => soon, needsFreshToken: true })
  assert.equal(renewals, 1)
  await sendWithRenewal({ args: {}, send: async () => ({ data: 1 }), renew, getToken: () => soon })
  assert.equal(renewals, 1)
  assert.ok(secondsLeft(soon) > 0)
})

/* ---------- progress ---------- */
const snap = (extra = {}) => ({ id: 'b', status: 'in_progress', total_files: 2, done_files: 1, failed_files: 0, pending_files: 1, total_bytes: 200, done_bytes: 100, ...extra })
test('progress never reaches 100% before the server says completed, and a failed file is not counted as sent', () => {
  const items = [{ id: 'a', size: 100, status: 'done' }, { id: 'b', size: 100, status: 'pending', uploading: true }]
  const during = summarizeBatch({ batch: snap(), items, live: { loaded: 100, phase: 'uploading' }, running: true })
  assert.equal(during.percent, 99)
  assert.equal(during.finished, false)
  const running = summarizeBatch({ batch: snap({ status: 'completed', done_files: 2, pending_files: 0, done_bytes: 200 }), items, live: { loaded: 0 }, running: true })
  assert.equal(running.percent, 99) // the page is still working: wait for the final server answer
  const done = summarizeBatch({ batch: snap({ status: 'completed', done_files: 2, pending_files: 0, done_bytes: 200 }), items: [], live: { loaded: 0 }, running: false })
  assert.equal(done.percent, 100); assert.equal(done.finished, true)
  const partial = summarizeBatch({ batch: snap({ status: 'partial', failed_files: 1, pending_files: 0 }), items: [{ id: 'a', size: 100, status: 'done' }, { id: 'b', size: 100, status: 'failed' }], live: { loaded: 0 }, running: false })
  assert.equal(partial.percent, 50); assert.equal(partial.finished, false)
})

/* ---------- recovery banner ---------- */
test('the recovery banner lists the right batches: unfinished and unacknowledged ones, not those this page is sending', () => {
  const batches = [{ id: 'x', status: 'in_progress' }, { id: 'y', status: 'completed' }, { id: 'z', status: 'partial' }]
  const mine = new Set(['x'])
  assert.deepEqual(visibleRecoveryBatches(batches, mine, null).map((b) => b.id), ['y', 'z'])
  assert.deepEqual(visibleRecoveryBatches(batches, mine, 'x').map((b) => b.id), ['x', 'y', 'z'])
  assert.deepEqual(visibleRecoveryBatches(undefined, mine), [])
  assert.equal(hasRunningBatch(batches), true)
  assert.equal(hasRunningBatch([{ status: 'completed' }]), false)
})
test('re-selection messages are honest: completed files are skipped, ambiguous ones are named, restart from zero is stated', () => {
  const rows = [{ id: 'a', status: 'done' }, { id: 'b', status: 'failed' }, { id: 'c', status: 'pending' }]
  assert.match(describeSelection(rows, { matches: new Map(), ambiguous: [] }), /None of the selected files match/)
  assert.match(describeSelection(rows, { matches: new Map([['b', {}]]), ambiguous: [] }), /1 of the remaining files were not selected/)
  assert.match(describeSelection(rows, { matches: new Map([['b', {}]]), ambiguous: ['c'] }), /could not be told apart/)
  assert.equal(describeSelection(rows, { matches: new Map([['b', {}], ['c', {}]]), ambiguous: [] }), '')
  assert.match(RECOVERY_HINT, /starts again from its beginning/)
  assert.doesNotMatch(RECOVERY_HINT, /resume|continue where/i)
})

/* ---------- stale forms ---------- */
test('an edit form can only remove files it showed and the person took out; files uploaded after it opened are never listed', () => {
  const opened = [{ filepath: '/uploads/common/a' }, { filepath: '/uploads/common/b' }]
  // nothing removed, even though a file arrived on the server meanwhile (the form simply does not know about it)
  assert.deepEqual(computeRemovedFiles(opened, opened), [])
  assert.deepEqual(computeRemovedFiles(opened, [opened[0]]), ['/uploads/common/b'])
  assert.deepEqual(computeRemovedFiles([], []), [])
  assert.deepEqual(computeRemovedFiles(opened, [{ filepath: '/uploads/common/a' }, { filepath: '/uploads/common/NEW' }]), ['/uploads/common/b'])
})
