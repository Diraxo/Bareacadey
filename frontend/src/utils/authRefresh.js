/* Pure helpers for keeping a sign-in alive. No React, Redux or network library imports, so they can be tested alone.
 *
 * What a refresh attempt can come to:
 *   ok         a new access token arrived
 *   invalid    the server refused the refresh token (401/403, revoked/unknown/forged): the session is over
 *   expired    the server says the session was idle too long (403 session_expired): the session is over
 *   transient  no network, timeout, 429, 5xx or an unreadable answer: the session may be perfectly fine, so NOBODY is
 *              signed out because of it. `reason` says which: network | timeout | rate_limited | server | unreadable */

export const secondsLeft = (token, now = Date.now()) => {
  try {
    const part = String(token).split('.')[1]
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const exp = JSON.parse(json)?.exp
    return typeof exp === 'number' ? exp - now / 1000 : null
  } catch (e) {
    return null
  }
}

/* True for the outcomes that really end a session. */
export const endsSession = (outcome) => outcome?.kind === 'invalid' || outcome?.kind === 'expired'

const SESSION_CODES = new Set(['session_invalid', 'session_revoked', 'session_expired', 'session_missing'])
/* The API answers a refused refresh with JSON: a `code` (current servers) or `error: true` / a `message` (servers from before
 * the codes existed). An empty object, an empty body or an HTML page is not that. */
const isOurRefusal = (data) => !!data && typeof data === 'object' && (SESSION_CODES.has(data.code) || data.error === true || typeof data.message === 'string')

export const requestNewAccessToken = async (fetchImpl, url, { timeoutMs = 15000 } = {}) => {
  let response
  const controller = typeof AbortController === 'undefined' ? null : new AbortController()
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...(controller ? { signal: controller.signal } : {}) })
  } catch (e) {
    return { kind: 'transient', reason: e?.name === 'AbortError' ? 'timeout' : 'network' }
  } finally {
    if (timer) clearTimeout(timer)
  }
  let data = null
  try { data = await response.json() } catch (e) { /* not JSON */ }
  if (response.ok && data?.accessToken) return { kind: 'ok', data }
  if (response.status === 401 || response.status === 403) {
    // only OUR server's refusal ends a session. A 401/403 page from a proxy, firewall or host limit is not JSON from this
    // API and says nothing about the session
    if (!isOurRefusal(data)) return { kind: 'transient', reason: 'unreadable', status: response.status }
    return { kind: data.code === 'session_expired' ? 'expired' : 'invalid', code: data.code || null, status: response.status }
  }
  if (response.status === 429) return { kind: 'transient', reason: 'rate_limited', status: 429 }
  if (response.status >= 500) return { kind: 'transient', reason: 'server', status: response.status }
  return { kind: 'transient', reason: 'unreadable', status: response.status }
}

/* Every caller that needs a refresh while one is already running shares that one request. */
export const createSingleFlight = (task) => {
  let running = null
  return () => {
    if (!running) running = Promise.resolve().then(task).finally(() => { running = null })
    return running
  }
}

/* Refreshes from different tabs of the same browser take turns (Web Locks). The refresh cookie is shared by all tabs and the
 * server replaces it on every refresh, so refreshes that overlap in time can leave one of them holding a token that is
 * already two replacements old, which the server must treat as a stolen one. Without Web Locks, or if taking the lock fails,
 * the refresh just runs (as before). The lock is released when the refresh settles; the refresh itself is time-limited. */
export const createAcrossTabs = (task, { locks = typeof navigator === 'undefined' ? null : navigator.locks } = {}) => {
  if (!locks?.request) return task
  return async () => {
    let started = false
    try {
      return await locks.request('johar-auth-refresh', () => { started = true; return task() })
    } catch (e) {
      if (started) throw e
      return task()
    }
  }
}

/* A refresh answer may be applied only if nothing else changed the sign-in while it was on its way (a sign-out, a new
 * sign-in, or another refresh that landed first). */
export const tokenUnchanged = (tokenAtStart, tokenNow) => (tokenAtStart || null) === (tokenNow || null)

/* Runs `attempt` (a refresh) again after a pause while it only comes back transient. Bounded: at most delays.length + 1
 * attempts, then the last outcome is returned and the caller keeps the session as it is. Never loops forever. */
export const refreshWithRetry = async (attempt, { delays = [1000, 3000, 8000], sleep = (ms) => new Promise((r) => setTimeout(r, ms)), isOnline = () => true, waitOnline = null } = {}) => {
  let outcome = await attempt()
  for (let i = 0; outcome.kind === 'transient' && i < delays.length; i++) {
    if (!isOnline() && waitOnline) await waitOnline()
    else await sleep(delays[i])
    outcome = await attempt()
  }
  return outcome
}

/* The same decision for one API request: send it, and if the server says the access token is no good (403) renew the
 * session ONCE and send the very same request again (same `args`, so a FormData body and its progress callback are reused
 * as they are). A renewal that only failed transiently does not retry and does not change the answer the caller gets.
 *   send(args) -> { data } | { error: { status } }      renew() -> outcome as above (and stores the new credentials) */
export const sendWithRenewal = async ({ args, send, renew, getToken, needsFreshToken = false, expiringSeconds = 20 }) => {
  const left = secondsLeft(getToken())
  const threshold = needsFreshToken ? 120 : expiringSeconds
  if (left !== null && left < threshold) await renew()
  let result = await send(args)
  if (result?.error?.status === 403) {
    const outcome = await renew()
    if (outcome?.kind === 'ok') result = await send(args)
    // the 403 only means "token expired" and the renewal could not be reached (network not back yet): say so, so the caller
    // retries later instead of treating it as a refusal
    else if (outcome?.kind === 'transient') result = { ...result, error: { ...result.error, renewalFailed: 'transient' } }
  }
  return result
}

/* Sign-out answers: what the page may do after DELETE /api/user/logout.
 *   done       the server confirmed (or said the session was already gone): clear local state and leave
 *   transient  could not be confirmed: stay signed in and offer Retry */
export const classifyLogoutAnswer = (error) => {
  if (!error) return 'done'
  const status = error.status
  if (status === 401 || status === 403 || status === 404) return 'done'
  return 'transient'
}
