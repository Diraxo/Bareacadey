/* The website slider's background retry: every 15 s while nothing loaded, one request at a time, none offline. */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRetryLoop } from '../src/utils/sliderRetry.js'

const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }

const setup = (results, extra = {}) => {
  const calls = []
  let online = true
  const loop = createRetryLoop({
    delayMs: 15000,
    isOnline: () => online,
    check: async () => { calls.push(Date.now()); return results.length ? results.shift() : false },
    ...extra,
  })
  return { loop, calls, setOnline: (v) => { online = v } }
}

test('first request fails -> retry after 15 s -> second failure schedules another -> success stops retrying', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  const { loop, calls } = setup([false, false, true])
  loop.start()
  t.mock.timers.tick(14999); await flush()
  assert.equal(calls.length, 0)
  t.mock.timers.tick(1); await flush()
  assert.equal(calls.length, 1) // retry 1 (fails)
  t.mock.timers.tick(15000); await flush()
  assert.equal(calls.length, 2) // retry 2 (fails again, so another is scheduled)
  t.mock.timers.tick(15000); await flush()
  assert.equal(calls.length, 3) // retry 3 succeeds
  t.mock.timers.tick(120000); await flush()
  assert.equal(calls.length, 3) // nothing more
})

test('starting twice keeps a single timer', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { loop, calls } = setup([true])
  loop.start(); loop.start(); loop.start()
  t.mock.timers.tick(15000); await flush()
  assert.equal(calls.length, 1)
})

test('a slow request is never overlapped by the timer or by online()', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let release
  let started = 0
  const loop = createRetryLoop({ delayMs: 15000, check: () => { started++; return new Promise((r) => { release = r }) } })
  loop.start()
  t.mock.timers.tick(15000); await flush()
  assert.equal(started, 1)
  loop.online(); loop.online(); t.mock.timers.tick(60000); await flush()
  assert.equal(started, 1)
  release(true); await flush()
  t.mock.timers.tick(60000); await flush()
  assert.equal(started, 1) // success: done
})

test('offline: no request and no timer is kept; online resumes at once, once, and the 15 s cycle goes on', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { loop, calls, setOnline } = setup([false, true])
  setOnline(false)
  loop.start()
  t.mock.timers.tick(15000); await flush()
  t.mock.timers.tick(120000); await flush()
  assert.equal(calls.length, 0)
  setOnline(true)
  loop.online(); loop.online(); await flush() // a burst of events is one request
  assert.equal(calls.length, 1) // fails -> re-armed
  t.mock.timers.tick(15000); await flush()
  assert.equal(calls.length, 2) // succeeds
  t.mock.timers.tick(120000); await flush()
  assert.equal(calls.length, 2)
})

test('going offline then online right after a pending timer does not duplicate the request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { loop, calls, setOnline } = setup([false, false, false])
  loop.start()
  setOnline(false); setOnline(true)
  loop.online(); await flush() // takes over the pending timer
  assert.equal(calls.length, 1)
  t.mock.timers.tick(14999); await flush()
  assert.equal(calls.length, 1)
  t.mock.timers.tick(1); await flush()
  assert.equal(calls.length, 2)
})

test('stop() (unmount) cancels the pending timer, and an answer still on its way arms nothing', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const a = setup([false])
  a.loop.start(); a.loop.stop()
  t.mock.timers.tick(60000); await flush()
  assert.equal(a.calls.length, 0)
  a.loop.online(); await flush()
  assert.equal(a.calls.length, 0)

  let release
  let started = 0
  const loop = createRetryLoop({ delayMs: 15000, check: () => { started++; return new Promise((r) => { release = r }) } })
  loop.start()
  t.mock.timers.tick(15000); await flush()
  loop.stop()
  release(false); await flush()
  t.mock.timers.tick(60000); await flush()
  assert.equal(started, 1)
})

test('a check that throws counts as a failure and is retried', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let n = 0
  const loop = createRetryLoop({ delayMs: 15000, check: async () => { n++; throw new Error('x') } })
  loop.start()
  t.mock.timers.tick(15000); await flush()
  t.mock.timers.tick(15000); await flush()
  assert.equal(n, 2)
})
