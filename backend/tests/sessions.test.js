/* Independent login sessions: several devices at once, rotation for browsers, reuse detection, sliding expiry,
 * per-device logout, and the transition from tokens issued before sessions existed. */
const jwt = require('jsonwebtoken')
const { resetDb, makeUser, api, models, MOBILE, ORIGIN, PASSWORD } = require('./helpers')
const { hashToken } = require('../middlewares/tokenHash')
const config = require('../config')
const sessions = require('../services/sessions')

let http, alice, bob
const DAY = 24 * 60 * 60 * 1000

const login = (email = 'alice@example.com', headers = MOBILE) =>
  http.post('/api/auth/login').set(headers).send({ userOrEmail: email, password: PASSWORD, device: 'dev' })
const cookieOf = (res) => {
  const c = (res.headers['set-cookie'] || []).find((x) => x.startsWith('rt='))
  return c ? decodeURIComponent(/^rt=([^;]*)/.exec(c)[1]) : null
}
/* a browser: Origin header + cookie */
const browserRefresh = (token) => http.post('/api/user/token/reqtoken').set(ORIGIN).set('Cookie', `rt=${token}`).send({})
/* the mobile app: no Origin, token in the body */
const mobileRefresh = (token) => http.post('/api/user/token/reqtoken').set(MOBILE).send({ token })
const rowOf = (token) => models.RefreshSession.findByPk(sessions.parseToken(token).id)

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  alice = await makeUser('alice@example.com', 'viewer')
  bob = await makeUser('bob@example.com', 'viewer')
})

describe('creation and storage', () => {
  test('login creates a session with bounded expiries and an access token bound to it', async () => {
    const res = await login()
    expect(res.status).toBe(200)
    const row = await rowOf(res.body.rt)
    expect(row.user_id).toBe(alice.user.id)
    expect(row.generation).toBe(0)
    expect(row.revoked_at).toBeNull()
    const idle = row.expires_at.getTime() - Date.now()
    expect(idle).toBeGreaterThan(config.sessions.idleDays * DAY - 60000)
    expect(idle).toBeLessThanOrEqual(config.sessions.idleDays * DAY)
    expect(row.absolute_expires_at.getTime()).toBeGreaterThan(row.expires_at.getTime())
    expect(jwt.decode(res.body.accessToken).sid).toBe(row.id)
    // only the hash is stored, and the cookie carries the same token as the body
    expect(row.token_hash).toBe(hashToken(res.body.rt))
    expect(JSON.stringify(row.toJSON())).not.toContain(res.body.rt)
    expect(cookieOf(res)).toBe(res.body.rt)
  })

  test('the cookie is httpOnly with the configured SameSite and a 30 day maximum age', async () => {
    const res = await login()
    const c = res.headers['set-cookie'].find((x) => x.startsWith('rt='))
    expect(c).toMatch(/HttpOnly/i)
    expect(c).toMatch(/SameSite=/i)
    expect(Number(/Max-Age=(\d+)/i.exec(c)[1])).toBe(config.sessions.idleDays * 24 * 3600)
  })
})

describe('several devices at once', () => {
  test('a new login never invalidates the others, each refreshes on its own, logout ends only one', async () => {
    const a = await login(); const b = await login(); const c = await login()
    const tokens = [a.body.rt, b.body.rt, c.body.rt]
    expect(new Set(tokens).size).toBe(3)
    for (const t of tokens) expect((await mobileRefresh(t)).status).toBe(200)

    const out = await http.delete('/api/user/token/logout').set(MOBILE).send({ token: b.body.rt })
    expect(out.status).toBe(200)
    expect((await mobileRefresh(a.body.rt)).status).toBe(200)
    expect((await mobileRefresh(c.body.rt)).status).toBe(200)
    expect((await mobileRefresh(b.body.rt)).status).toBe(403)
  })

  test('logging in as another user does not touch this user, and users cannot use each other\'s tokens', async () => {
    const a = await login()
    const b = await login('bob@example.com')
    expect((await mobileRefresh(a.body.rt)).body.user.id).toBe(alice.user.id)
    expect((await mobileRefresh(b.body.rt)).body.user.id).toBe(bob.user.id)
  })

  test('website logout (access token, no refresh token sent) revokes the session of that access token only', async () => {
    const a = await login(); const b = await login()
    const out = await http.delete('/api/user/logout').set(MOBILE).set({ Authorization: `Bearer ${a.body.accessToken}` })
    expect(out.status).toBe(200)
    expect(out.body.message).toBe('Successfully Logged Out')
    expect((await mobileRefresh(a.body.rt)).status).toBe(403)
    expect((await mobileRefresh(b.body.rt)).status).toBe(200)
  })

  test('an access token of a signed-out session stops working at once, other sessions keep theirs', async () => {
    const a = await login(); const b = await login()
    const ask = (t) => http.get('/api/roles/mine').set(MOBILE).set({ Authorization: `Bearer ${t}` })
    expect((await ask(a.body.accessToken)).status).toBe(200)
    await http.delete('/api/user/token/logout').set(MOBILE).send({ token: a.body.rt })
    expect((await ask(a.body.accessToken)).status).toBe(403)
    expect((await ask(b.body.accessToken)).status).toBe(200)
  })

  test('the number of open sessions per user is bounded; the least recently used one is revoked', async () => {
    const limit = config.sessions.maxPerUser
    config.sessions.maxPerUser = 3
    try {
      const carol = await makeUser('carol@example.com', 'viewer')
      const made = []
      // MySQL DATETIME has one-second precision, so "least recently used" is only defined between logins a second apart
      const apart = process.env.TEST_DB_DIALECT === 'mysql' ? 1100 : 0
      for (let i = 0; i < 5; i++) { if (i && apart) await new Promise((r) => setTimeout(r, apart)); made.push(await login('carol@example.com')) }
      const open = await models.RefreshSession.count({ where: { user_id: carol.user.id, revoked_at: null } })
      expect(open).toBe(3)
      expect((await rowOf(made[0].body.rt)).revoked_reason).toBe('limit')
      expect((await mobileRefresh(made[4].body.rt)).status).toBe(200)
    } finally { config.sessions.maxPerUser = limit }
  })
})

describe('sliding expiry', () => {
  test('every refresh moves the inactivity expiry forward, never past the absolute cap', async () => {
    const { body } = await login()
    const row = await rowOf(body.rt)
    await row.update({ expires_at: new Date(Date.now() + 2 * DAY) })
    expect((await mobileRefresh(body.rt)).status).toBe(200)
    const after = await rowOf(body.rt)
    expect(after.expires_at.getTime() - Date.now()).toBeGreaterThan(config.sessions.idleDays * DAY - 60000)

    await after.update({ absolute_expires_at: new Date(Date.now() + 3 * DAY) })
    expect((await mobileRefresh(body.rt)).status).toBe(200)
    const capped = await rowOf(body.rt)
    expect(capped.expires_at.getTime()).toBeLessThanOrEqual(capped.absolute_expires_at.getTime())
  })

  test('a session idle for longer than the window cannot refresh, and says why', async () => {
    const { body } = await login()
    await (await rowOf(body.rt)).update({ expires_at: new Date(Date.now() - 1000) })
    const res = await mobileRefresh(body.rt)
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('session_expired')
  })

  test('the absolute cap ends a session even if it is used every day', async () => {
    const { body } = await login()
    await (await rowOf(body.rt)).update({ absolute_expires_at: new Date(Date.now() - 1000) })
    expect((await mobileRefresh(body.rt)).body.code).toBe('session_expired')
  })

  test('a revoked session says so; garbage and missing tokens are distinguished', async () => {
    const { body } = await login()
    await http.delete('/api/user/token/logout').set(MOBILE).send({ token: body.rt })
    expect((await mobileRefresh(body.rt)).body.code).toBe('session_revoked')
    expect((await mobileRefresh('garbage')).body.code).toBe('session_invalid')
    const none = await http.post('/api/user/token/reqtoken').set(MOBILE).send({})
    expect(none.status).toBe(401)
    expect(none.body.code).toBe('session_missing')
  })

  test('housekeeping removes only long-expired or long-revoked rows', async () => {
    const live = await login()
    const gone = await login()
    await http.delete('/api/user/token/logout').set(MOBILE).send({ token: gone.body.rt })
    const goneRow = await rowOf(gone.body.rt)
    expect(await sessions.cleanupSessions({ now: new Date() })).toBeGreaterThanOrEqual(0)
    expect(await rowOf(gone.body.rt)).toBeTruthy() // revoked a moment ago: kept for 7 days
    await models.RefreshSession.update({ revoked_at: new Date(Date.now() - 8 * DAY) }, { where: { id: goneRow.id } })
    await sessions.cleanupSessions()
    expect(await models.RefreshSession.findByPk(goneRow.id)).toBeNull()
    expect(await rowOf(live.body.rt)).toBeTruthy()
  })
})

describe('rotation for browsers', () => {
  test('a browser gets a new token on every refresh; the old one still works for a short while (lost response / second tab)', async () => {
    const first = await login('alice@example.com', ORIGIN)
    const t0 = cookieOf(first)
    const r1 = await browserRefresh(t0)
    expect(r1.status).toBe(200)
    const t1 = cookieOf(r1)
    expect(t1).toBeTruthy()
    expect(t1).not.toBe(t0)
    expect((await rowOf(t1)).generation).toBe(1)
    // the response with t1 was lost: the browser asks again with t0 and is handed the same t1, not a revocation
    const again = await browserRefresh(t0)
    expect(again.status).toBe(200)
    expect(cookieOf(again)).toBe(t1)
    expect((await rowOf(t1)).generation).toBe(1)
    // and t1 keeps working
    const t2 = cookieOf(await browserRefresh(t1))
    expect(t2).not.toBe(t1)
  })

  test('two simultaneous refreshes with the same cookie rotate exactly once and agree on the new token', async () => {
    const t0 = cookieOf(await login('alice@example.com', ORIGIN))
    const results = await Promise.all([browserRefresh(t0), browserRefresh(t0), browserRefresh(t0)])
    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
    const cookies = new Set(results.map(cookieOf))
    expect(cookies.size).toBe(1)
    expect((await rowOf(t0)).generation).toBe(1)
  })

  test('reuse of an old token (two generations back) revokes that session only', async () => {
    const other = await login('alice@example.com', ORIGIN) // another device of the same user
    const t0 = cookieOf(await login('alice@example.com', ORIGIN))
    const t1 = cookieOf(await browserRefresh(t0))
    const t2 = cookieOf(await browserRefresh(t1))
    const stolen = await browserRefresh(t0) // t0 is two generations old
    expect(stolen.status).toBe(403)
    expect(stolen.body.code).toBe('session_revoked')
    expect((await rowOf(t2)).revoked_reason).toBe('reuse')
    expect((await browserRefresh(t2)).status).toBe(403) // the legitimate holder is cut off too: that is the policy
    expect((await browserRefresh(cookieOf(other))).status).toBe(200) // the other device is not affected
  })

  test('the previous token after the grace window counts as reuse', async () => {
    const t0 = cookieOf(await login('alice@example.com', ORIGIN))
    const t1 = cookieOf(await browserRefresh(t0))
    await (await rowOf(t1)).update({ rotated_at: new Date(Date.now() - (config.sessions.rotationGraceSeconds + 5) * 1000) })
    const res = await browserRefresh(t0)
    expect(res.status).toBe(403)
    expect((await rowOf(t1)).revoked_reason).toBe('reuse')
  })

  test('a failed browser refresh clears the cookie; a successful one never sends an empty cookie', async () => {
    const t0 = cookieOf(await login('alice@example.com', ORIGIN))
    const ok = await browserRefresh(t0)
    expect(cookieOf(ok)).toMatch(/^rs1\./)
    await http.delete('/api/user/token/logout').set(ORIGIN).set('Cookie', `rt=${cookieOf(ok)}`).send({})
    const bad = await browserRefresh(cookieOf(ok))
    expect(bad.status).toBe(403)
    expect((bad.headers['set-cookie'] || []).some((c) => /^rt=;/.test(c))).toBe(true)
  })

  test('the mobile app (no Origin, token in the body) is never rotated: its stored token keeps working', async () => {
    const { body } = await login()
    for (let i = 0; i < 3; i++) {
      const res = await mobileRefresh(body.rt)
      expect(res.status).toBe(200)
      expect(res.body.rt).toBeUndefined()
      expect(cookieOf(res)).toBeNull()
    }
    expect((await rowOf(body.rt)).generation).toBe(0)
  })
})

describe('sign-in state changes', () => {
  test('a password change signs out every session of that user and nobody else', async () => {
    const dave = await makeUser('dave@example.com', 'viewer')
    const d1 = await login('dave@example.com'); const d2 = await login('dave@example.com')
    const b1 = await login('bob@example.com')
    const token = jwt.sign({ id: dave.user.id, typ: 'reset' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h', algorithm: 'HS256' })
    await dave.user.update({ reset_password_token: token })
    const res = await http.post('/api/auth/set_new_password').set(MOBILE).send({ newPassword: 'AnotherStr0ng!Pass', resetToken: token })
    expect(res.body.message).toBe('Successfully Updated')
    expect((await mobileRefresh(d1.body.rt)).status).toBe(403)
    expect((await mobileRefresh(d2.body.rt)).status).toBe(403)
    expect((await mobileRefresh(b1.body.rt)).status).toBe(200)
  })

  test('a deactivated account cannot refresh and its session is closed', async () => {
    const erin = await makeUser('erin@example.com', 'viewer')
    const e = await login('erin@example.com')
    await erin.user.update({ active: false })
    expect((await mobileRefresh(e.body.rt)).status).toBe(403)
    expect((await rowOf(e.body.rt)).revoked_at).toBeTruthy()
  })
})

describe('tokens issued before sessions existed', () => {
  const legacyFor = async (user) => {
    const token = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d', algorithm: 'HS256' })
    await models.User.update({ refresh_token: hashToken(token) }, { where: { id: user.id } })
    return token
  }

  test('the mobile app keeps working with its old token and is not logged out by the upgrade', async () => {
    const old = await legacyFor(alice.user)
    const before = await models.RefreshSession.count()
    const res = await mobileRefresh(old)
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(alice.user.id)
    expect(await models.RefreshSession.count()).toBe(before) // no session invented for a client that cannot hold a new token
    expect((await mobileRefresh(old)).status).toBe(200)
  })

  test('a browser trades the old cookie for a session on first use', async () => {
    const old = await legacyFor(alice.user)
    const res = await browserRefresh(old)
    expect(res.status).toBe(200)
    const fresh = cookieOf(res)
    expect(fresh).toMatch(/^rs1\./)
    expect((await browserRefresh(fresh)).status).toBe(200)
  })

  test('old tokens that are expired, signed with another secret, or no longer stored are refused', async () => {
    const expired = jwt.sign({ id: alice.user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: -10, algorithm: 'HS256' })
    await models.User.update({ refresh_token: hashToken(expired) }, { where: { id: alice.user.id } })
    expect((await mobileRefresh(expired)).status).toBe(403)
    const forged = jwt.sign({ id: alice.user.id }, 'some-other-secret-0000000000000000000000', { expiresIn: '1d', algorithm: 'HS256' })
    await models.User.update({ refresh_token: hashToken(forged) }, { where: { id: alice.user.id } })
    expect((await mobileRefresh(forged)).status).toBe(403)
    const notStored = jwt.sign({ id: alice.user.id, n: 1 }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d', algorithm: 'HS256' })
    expect((await mobileRefresh(notStored)).status).toBe(403)
  })

  test('logging out with an old token clears it', async () => {
    const old = await legacyFor(alice.user)
    expect((await http.delete('/api/user/token/logout').set(MOBILE).send({ token: old })).status).toBe(200)
    expect((await mobileRefresh(old)).status).toBe(403)
  })
})

describe('session token properties', () => {
  test('a token with a forged MAC, wrong generation or foreign session id is rejected', async () => {
    const { body } = await login()
    const [prefix, id, gen, mac] = body.rt.split('.')
    expect((await mobileRefresh([prefix, id, gen, mac.slice(0, -1) + (mac.endsWith('A') ? 'B' : 'A')].join('.'))).status).toBe(403)
    expect((await mobileRefresh([prefix, id, '7', mac].join('.'))).status).toBe(403)
    expect((await mobileRefresh([prefix, '00000000-0000-0000-0000-000000000000', gen, mac].join('.'))).status).toBe(403)
  })
})
