/* Token logout under the per-device session model (was: D1 conditional revocation of the single stored token, D2 body
 * token versus cookie). The guarantees are the same, now per session: a logout ends exactly the session it names and
 * never another one, of the same user or of someone else. */
const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')
const { hashToken } = require('../middlewares/tokenHash')

let http, alice, bob

const login = (email) => http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: email, password: PASSWORD, device: 'dev' })
const sessionOf = (rt) => models.RefreshSession.findOne({ where: { token_hash: hashToken(rt) } })
const revoked = async (rt) => !!(await sessionOf(rt)).revoked_at
const logout = (body, cookie) => {
  let r = http.delete('/api/user/token/logout').set(MOBILE)
  if (cookie) r = r.set('Cookie', `rt=${cookie}`)
  return r.send(body)
}
const refresh = (rt) => http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: rt })
const clearsCookie = (res) => (res.headers['set-cookie'] || []).some((c) => /^rt=;/.test(c))

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  alice = await makeUser('alice@example.com', 'viewer')
  bob = await makeUser('bob@example.com', 'viewer')
})

describe('D1: revocation names one session', () => {
  test('the presented session is revoked', async () => {
    const { body } = await login('alice@example.com')
    const out = await logout({ token: body.rt })
    expect(out.status).toBe(200)
    expect(out.body).toEqual({ loggedOut: true })
    expect(await revoked(body.rt)).toBe(true)
    expect((await refresh(body.rt)).status).toBe(403)
  })

  test('garbage and database values leave every session untouched', async () => {
    const live = await login('alice@example.com')
    const row = await sessionOf(live.body.rt)
    for (const token of ['garbage', row.token_hash, row.seed, `rs1.${row.id}.0.${'A'.repeat(43)}`, 'x'.repeat(5000)]) {
      const out = await logout({ token })
      expect(out.status).toBe(200)
      expect(out.body).toEqual({ loggedOut: true })
      expect(await revoked(live.body.rt)).toBe(false)
    }
    expect((await refresh(live.body.rt)).status).toBe(200)
  })

  test('two logouts racing for the same session are both answered, one session ends', async () => {
    const { body } = await login('alice@example.com')
    const other = await login('alice@example.com')
    const results = await Promise.all([logout({ token: body.rt }), logout({ token: body.rt })])
    expect(results.map((r) => r.status)).toEqual([200, 200])
    expect(await revoked(body.rt)).toBe(true)
    expect(await revoked(other.body.rt)).toBe(false) // the second device is still signed in
  })

  test('repeated revocation is harmless', async () => {
    const { body } = await login('alice@example.com')
    for (let i = 0; i < 3; i++) {
      const out = await logout({ token: body.rt })
      expect(out.status).toBe(200)
      expect(out.body).toEqual({ loggedOut: true })
    }
  })

  test('another user keeps their session', async () => {
    const a = await login('alice@example.com')
    const b = await login('bob@example.com')
    await logout({ token: a.body.rt })
    expect(await revoked(b.body.rt)).toBe(false)
    expect((await refresh(b.body.rt)).status).toBe(200)
  })
})

describe('D2: body token versus cookie', () => {
  test('body token A plus cookie token B revokes only A, and does not clear cookie B', async () => {
    const a = await login('alice@example.com')
    const b = await login('bob@example.com')
    const out = await logout({ token: a.body.rt }, b.body.rt)
    expect(out.status).toBe(200)
    expect(out.body).toEqual({ loggedOut: true })
    expect(clearsCookie(out)).toBe(false)
    expect(await revoked(a.body.rt)).toBe(true)
    expect(await revoked(b.body.rt)).toBe(false)
  })

  test('a body token equal to the cookie token revokes it and clears the cookie', async () => {
    const a = await login('alice@example.com')
    const out = await logout({ token: a.body.rt }, a.body.rt)
    expect(clearsCookie(out)).toBe(true)
    expect(await revoked(a.body.rt)).toBe(true)
  })

  test('cookie-only logout revokes the cookie token and clears it', async () => {
    const b = await login('bob@example.com')
    const out = await logout({}, b.body.rt)
    expect(out.status).toBe(200)
    expect(clearsCookie(out)).toBe(true)
    expect(await revoked(b.body.rt)).toBe(true)
  })

  test('an empty or invalid body token falls back to the cookie only', async () => {
    for (const token of ['', null, 123, { a: 1 }, ['x']]) {
      const b = await login('bob@example.com')
      const out = await logout({ token }, b.body.rt)
      expect(out.status).toBe(200)
      expect(clearsCookie(out)).toBe(true)
      expect(await revoked(b.body.rt)).toBe(true)
    }
  })

  test('a stale body token does not revoke a newer cookie session', async () => {
    const old = await login('alice@example.com')
    const fresh = await login('alice@example.com')
    const out = await logout({ token: old.body.rt }, fresh.body.rt)
    expect(out.status).toBe(200)
    expect(out.body).toEqual({ loggedOut: true })
    expect(clearsCookie(out)).toBe(false)
    expect(await revoked(fresh.body.rt)).toBe(false)
  })

  test('no credentials at all still answers generically', async () => {
    const out = await logout({})
    expect(out.status).toBe(200)
    expect(out.body).toEqual({ loggedOut: true })
  })

  test('the mobile headers are still required, and nothing is revoked without them', async () => {
    const { body } = await login('alice@example.com')
    const blocked = await http.delete('/api/user/token/logout').send({ token: body.rt })
    expect(blocked.status).toBe(403)
    expect(await revoked(body.rt)).toBe(false)
  })
})
