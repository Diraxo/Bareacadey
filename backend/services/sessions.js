/* Independent login sessions (one row of RefreshSessions per browser/device).
 *
 * Token format   rs1.<session id>.<generation>.<mac>
 *   mac = base64url(HMAC-SHA256(REFRESH_TOKEN_SECRET, seed ":" generation)); `seed` is 32 random bytes kept per session.
 *   The token proves itself (a forged one fails the MAC) and the database never holds a usable token, only its SHA-256.
 *
 * Lifecycle
 *   - login creates a session (generation 0). Other sessions of the user are untouched.
 *   - every refresh slides the inactivity expiry to now + idleDays (never past the absolute cap).
 *   - browsers (cookie + Origin header) get a NEW token on each refresh ("rotation"). Clients that keep their token in
 *     their own storage and ignore a new one (the released mobile builds) are not rotated; their token stays valid and
 *     only slides the expiry.
 *   - presenting the token of the previous generation within `rotationGraceSeconds` is a lost response or a second tab:
 *     the CURRENT token is handed out again (it is derived, not remembered), nothing is revoked.
 *   - presenting an older token, or the previous one after the grace window, is reuse of a rotated token: the whole
 *     session is revoked. Other sessions of the same user are left alone.
 *   - logout revokes one session; a password reset revokes all sessions of that user. */
const crypto = require('crypto')
const { Op } = require('sequelize')
const config = require('../config')
const RefreshSession = require('../models/RefreshSession')
const { hashToken } = require('../middlewares/tokenHash')

const DAY = 24 * 60 * 60 * 1000
const PREFIX = 'rs1'
const MAX_TOKEN_LENGTH = 200

const mac = (seed, generation) =>
  crypto.createHmac('sha256', String(config.secrets.refreshToken)).update(`${seed}:${generation}`).digest('base64url')

const tokenFor = (session, generation = session.generation) => `${PREFIX}.${session.id}.${generation}.${mac(session.seed, generation)}`

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

/* Splits a presented token; null when it does not even look like one of ours (legacy JWTs land here). */
const parseToken = (token) => {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null
  const m = /^rs1\.([0-9a-f-]{36})\.(\d{1,9})\.([A-Za-z0-9_-]{43})$/.exec(token)
  return m ? { id: m[1], generation: Number(m[2]), mac: m[3] } : null
}

const slideTo = (session, now = new Date()) => {
  const next = new Date(now.getTime() + config.sessions.idleDays * DAY)
  return next < session.absolute_expires_at ? next : session.absolute_expires_at
}

const describeClient = (userAgent) => (userAgent ? String(userAgent).slice(0, 255) : null)

/* Keeps one user's open sessions bounded: the least recently used ones beyond the limit are revoked.
 * `keepId` is the session being created right now: DATETIME columns have one-second precision on MySQL, so sessions made
 * in the same second tie on the ordering below and the new one must never be the one that loses the tie. */
const enforceLimit = async (userId, keepId = null) => {
  const open = await RefreshSession.findAll({
    where: { user_id: userId, revoked_at: null, expires_at: { [Op.gt]: new Date() } },
    order: [['last_used_at', 'DESC'], ['createdAt', 'DESC']],
    attributes: ['id'],
  })
  const ranked = keepId ? [...open.filter((s) => s.id === keepId), ...open.filter((s) => s.id !== keepId)] : open
  const extra = ranked.slice(config.sessions.maxPerUser).map((s) => s.id)
  if (extra.length) await RefreshSession.update({ revoked_at: new Date(), revoked_reason: 'limit' }, { where: { id: extra, revoked_at: null } })
}

/* Creates a session for `userId`. Returns { session, token }. */
const createSession = async (userId, { userAgent } = {}) => {
  const now = new Date()
  const session = RefreshSession.build({
    id: crypto.randomUUID(),
    user_id: userId,
    seed: crypto.randomBytes(32).toString('hex'),
    generation: 0,
    rotated_at: now,
    last_used_at: now,
    absolute_expires_at: new Date(now.getTime() + config.sessions.absoluteDays * DAY),
    user_agent: describeClient(userAgent),
  })
  session.expires_at = slideTo(session, now)
  const token = tokenFor(session)
  session.token_hash = hashToken(token)
  await session.save()
  await enforceLimit(userId, session.id)
  return { session, token }
}

/* Milliseconds a cookie for this session should live (sliding window length). */
const cookieMaxAgeMs = () => config.sessions.idleDays * DAY

const cookieOptions = () => ({ httpOnly: true, secure: config.cookies.secure, sameSite: config.cookies.sameSite })
const setRefreshCookie = (res, token) => res.cookie('rt', token, { ...cookieOptions(), maxAge: cookieMaxAgeMs() })
const clearRefreshCookie = (res) => res.clearCookie('rt', cookieOptions())

/* Exchanges a presented token for the session's current token.
 *   { status: 'ok', session, token, rotated, replay }   token = the token the client should keep using
 *   { status: 'invalid' | 'revoked' | 'expired' | 'reuse' }
 * `rotate`: issue a new generation (browsers). Without it the presented token stays valid (see header comment). */
const refreshSession = async (presented, { rotate = false } = {}, depth = 0) => {
  const parsed = parseToken(presented)
  if (!parsed) return { status: 'invalid' }
  const session = await RefreshSession.findByPk(parsed.id)
  if (!session) return { status: 'invalid' }
  if (!safeEqual(parsed.mac, mac(session.seed, parsed.generation))) return { status: 'invalid' }
  if (session.revoked_at) return { status: 'revoked', session }
  const now = new Date()
  if (session.expires_at <= now || session.absolute_expires_at <= now) return { status: 'expired', session }
  if (parsed.generation > session.generation) return { status: 'invalid' }

  if (parsed.generation < session.generation) {
    const withinGrace = parsed.generation === session.generation - 1 && session.rotated_at
      && now.getTime() - new Date(session.rotated_at).getTime() <= config.sessions.rotationGraceSeconds * 1000
    if (!withinGrace) {
      await RefreshSession.update({ revoked_at: now, revoked_reason: 'reuse' }, { where: { id: session.id, revoked_at: null } })
      return { status: 'reuse', session }
    }
    // a lost response or a second tab: same answer as the first time, nothing changes except activity
    await RefreshSession.update({ last_used_at: now, expires_at: slideTo(session, now) }, { where: { id: session.id, revoked_at: null } })
    return { status: 'ok', session, token: tokenFor(session), rotated: false, replay: true }
  }

  if (!safeEqual(hashToken(presented), session.token_hash)) return { status: 'invalid' }

  if (!rotate) {
    await RefreshSession.update({ last_used_at: now, expires_at: slideTo(session, now) }, { where: { id: session.id, revoked_at: null } })
    return { status: 'ok', session, token: presented, rotated: false, replay: false }
  }

  const nextGeneration = session.generation + 1
  const nextToken = tokenFor(session, nextGeneration)
  // conditional on the generation we read: two parallel refreshes cannot both rotate
  const [changed] = await RefreshSession.update(
    { generation: nextGeneration, token_hash: hashToken(nextToken), rotated_at: now, last_used_at: now, expires_at: slideTo(session, now) },
    { where: { id: session.id, generation: session.generation, revoked_at: null } },
  )
  if (!changed) {
    // lost the race: the winner already rotated, so this request is the "previous generation" replay
    if (depth >= 2) return { status: 'invalid' }
    return refreshSession(presented, { rotate }, depth + 1)
  }
  session.generation = nextGeneration
  return { status: 'ok', session, token: nextToken, rotated: true, replay: false }
}

/* Ends the session a (genuine) token belongs to, whatever its generation. Returns true when a session was revoked now. */
const revokeByToken = async (presented, reason = 'logout') => {
  const parsed = parseToken(presented)
  if (!parsed) return false
  const session = await RefreshSession.findByPk(parsed.id, { attributes: ['id', 'seed'] })
  if (!session || !safeEqual(parsed.mac, mac(session.seed, parsed.generation))) return false
  const [count] = await RefreshSession.update({ revoked_at: new Date(), revoked_reason: reason }, { where: { id: session.id, revoked_at: null } })
  return count > 0
}

const revokeById = async (id, userId, reason = 'logout') => {
  if (!id) return false
  const [count] = await RefreshSession.update({ revoked_at: new Date(), revoked_reason: reason }, { where: { id: String(id), user_id: userId, revoked_at: null } })
  return count > 0
}

const revokeAllForUser = async (userId, reason = 'password_change') => {
  const [count] = await RefreshSession.update({ revoked_at: new Date(), revoked_reason: reason }, { where: { user_id: userId, revoked_at: null } })
  return count
}

/* True when an access token issued for session `id` may still be used. Tokens without a session id (issued before this
 * release) are not affected. */
const isSessionActive = async (id) => {
  if (!id) return true
  const row = await RefreshSession.findByPk(String(id), { attributes: ['id', 'revoked_at', 'absolute_expires_at'] })
  return !!row && !row.revoked_at && row.absolute_expires_at > new Date()
}

/* Housekeeping: expired and revoked rows are kept for `retainDays` (for support questions) and then deleted. */
const cleanupSessions = async ({ retainDays = 7, now = new Date() } = {}) => {
  const cutoff = new Date(now.getTime() - retainDays * DAY)
  return RefreshSession.destroy({
    where: { [Op.or]: [{ revoked_at: { [Op.lt]: cutoff } }, { expires_at: { [Op.lt]: cutoff } }, { absolute_expires_at: { [Op.lt]: cutoff } }] },
  })
}

const scheduleSessionCleanup = () => {
  const run = () => cleanupSessions().then((n) => { if (n) console.log(`removed ${n} expired login session(s)`) }).catch(() => {})
  setTimeout(run, 60 * 1000).unref()
  setInterval(run, 6 * 60 * 60 * 1000).unref()
}

module.exports = {
  createSession, refreshSession, revokeByToken, revokeById, revokeAllForUser, isSessionActive,
  cleanupSessions, scheduleSessionCleanup, parseToken, cookieMaxAgeMs, tokenFor, setRefreshCookie, clearRefreshCookie,
}
