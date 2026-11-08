/* One account on several phones and tablets: no registered-device restriction, independent sessions, and unrestricted
 * simultaneous video access. Everything goes through the real HTTP routes (login, refresh, logout, /check/, protected
 * media) of an in-memory database; nothing here is mocked.
 *
 * Not covered here (cannot be): a real phone/tablet, a real player, the real app. */
const fs = require('fs')
const path = require('path')
const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')
const { FILES_ROOT } = require('../routes/media')
const { getMobileConfig } = require('../services/appConfig')
const config = require('../config')

const commonDir = path.join(FILES_ROOT, 'common')
const created = []
const writeFile = (name) => {
  fs.mkdirSync(commonDir, { recursive: true })
  const p = path.join(commonDir, name)
  fs.writeFileSync(p, 'DATA')
  created.push(p)
}
const ref = (name) => JSON.stringify([{ filename: name, filepath: `/uploads/common/${name}` }])
const names = { free1: 'jest_md_free1--a', free2: 'jest_md_free2--b', paid: 'jest_md_paid--c' }

let http, owner, stranger
const setPolicy = (device_policy) =>
  models.Config.update({ config: JSON.stringify({ app_version: 1, device_policy }) }, { where: { id: 5 } })

const login = (email, device) => http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: email, password: PASSWORD, device })
const bearer = (t) => ({ Authorization: `Bearer ${t}` })
/* what the app does after sign-in, at start-up and on returning to the foreground */
const check = (accessToken, userId, device) => http.get(`/check/?device=${encodeURIComponent(device)}&user_id=${userId}`).set(MOBILE).set(bearer(accessToken))
const refresh = (rt) => http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: rt })
const logout = (rt) => http.delete('/api/user/token/logout').set(MOBILE).send({ token: rt })
const media = (name, accessToken) => http.get(`/uploads/common/${encodeURIComponent(name)}`).set(accessToken ? bearer(accessToken) : {})

const DEVICES = ['Pixel 8-AP1A-android-2023-Google-google', 'SM-X710-UP1A-android-2022-samsung-samsung', 'iPhone15,2-21A-ios-2022-Apple-Apple', 'iPad13,1-21A-ios-2020-Apple-Apple']

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  owner = await makeUser('owner@example.com', 'viewer')
  stranger = await makeUser('stranger@example.com', 'viewer')
  Object.values(names).forEach(writeFile)
  const free = await models.Course.create({ title: 'Free', main_price: 0, type: 'course', routeState: 'published' })
  await models.Chapter.create({ title: 'F1', course_parent_id: free.id, routeState: 'published', chapter_files: ref(names.free1) })
  await models.Chapter.create({ title: 'F2', course_parent_id: free.id, routeState: 'published', chapter_files: ref(names.free2) })
  const premium = await models.Course.create({ title: 'Premium', main_price: 900, type: 'course', routeState: 'published' })
  await models.Chapter.create({ title: 'P1', course_parent_id: premium.id, routeState: 'published', price: 50, chapter_files: ref(names.paid) })
})

afterAll(() => { created.forEach((p) => { try { fs.rmSync(p, { force: true }) } catch (e) { /* ignore */ } }) })

describe('the device restriction is off in a fresh environment', () => {
  test('the seeded mobile configuration has device_policy.mode "off"', async () => {
    expect((await getMobileConfig()).device_policy.mode).toBe('off')
  })
})

describe('sign in on phones and tablets (policy off)', () => {
  test('first, second, third and fourth device (phone + tablet, Android + iOS) are all accepted and independent', async () => {
    const sessions = []
    for (const device of DEVICES) {
      const res = await login('owner@example.com', device)
      expect(res.status).toBe(200)
      expect(res.body.user.id).toBe(owner.user.id)
      const verdict = await check(res.body.accessToken, owner.user.id, device)
      expect(verdict.status).toBe(200)
      expect(verdict.body).toEqual({ status: 'success' })
      sessions.push({ device, ...res.body })
    }
    expect(new Set(sessions.map((s) => s.rt)).size).toBe(DEVICES.length)
    // signing in on the later devices ended none of the earlier sessions
    for (const s of sessions) {
      expect((await refresh(s.rt)).status).toBe(200)
      expect((await check(s.accessToken, owner.user.id, s.device)).body.status).toBe('success')
    }
    expect(await models.RefreshSession.count({ where: { user_id: owner.user.id, revoked_at: null } })).toBeGreaterThanOrEqual(DEVICES.length)
  })

  test('the device check does not create, change or remove any device registration', async () => {
    const before = await models.Device.count()
    await check((await login('owner@example.com', 'brand-new-tablet')).body.accessToken, owner.user.id, 'brand-new-tablet')
    expect(await models.Device.count()).toBe(before)
  })

  test('app start-up on another device: the stored refresh token restores the session and the check passes', async () => {
    const phone = await login('owner@example.com', DEVICES[0])
    const tablet = await login('owner@example.com', DEVICES[1])
    const restored = await refresh(tablet.body.rt) // start-up refresh
    expect(restored.status).toBe(200)
    expect((await check(restored.body.accessToken, owner.user.id, DEVICES[1])).body).toEqual({ status: 'success' })
    expect((await refresh(phone.body.rt)).status).toBe(200) // the phone is untouched
  })

  test('returning to the foreground on another device: the check passes again and repeatedly', async () => {
    const tablet = await login('owner@example.com', DEVICES[1])
    for (let i = 0; i < 3; i++) expect((await check(tablet.body.accessToken, owner.user.id, DEVICES[1])).body).toEqual({ status: 'success' })
  })

  test('logging out on one device leaves every other session signed in', async () => {
    const a = await login('owner@example.com', DEVICES[0])
    const b = await login('owner@example.com', DEVICES[1])
    const c = await login('owner@example.com', DEVICES[2])
    expect((await logout(b.body.rt)).status).toBe(200)
    expect((await refresh(b.body.rt)).status).toBe(403)
    expect((await check(b.body.accessToken, owner.user.id, DEVICES[1])).status).toBe(403) // a revoked session is rejected
    for (const s of [a, c]) {
      expect((await refresh(s.body.rt)).status).toBe(200)
      expect((await check(s.body.accessToken, owner.user.id, 'x')).body.status).toBe('success')
    }
  })
})

describe('account protection is unchanged', () => {
  test('a deactivated account cannot sign in', async () => {
    await makeUser('inactive@example.com', 'viewer', { active: false })
    const res = await login('inactive@example.com', DEVICES[0])
    expect(res.status).toBe(403)
    expect(res.body.accessToken).toBeUndefined()
  })

  test('a blocked account is refused by the check, with a code that tells it apart from a device refusal', async () => {
    const blocked = await makeUser('blocked@example.com', 'viewer', { blocked: true })
    const res = await check(blocked.token, blocked.user.id, DEVICES[0])
    expect(res.body).toMatchObject({ status: 'denied', code: 'account_not_allowed' })
  })

  test('an account deactivated after signing in is refused by the check on every device', async () => {
    const late = await makeUser('late@example.com', 'viewer')
    const s = await login('late@example.com', DEVICES[0])
    await models.User.update({ active: false }, { where: { id: late.user.id } })
    expect((await check(s.body.accessToken, late.user.id, DEVICES[0])).body).toMatchObject({ status: 'denied', code: 'account_not_allowed' })
  })

  test('a wrong password is still refused', async () => {
    const res = await http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: 'owner@example.com', password: 'wrong-password', device: DEVICES[0] })
    expect(res.status).toBe(401)
  })

  test('the per-user session limit still applies (the least recently used session is revoked)', async () => {
    expect(config.sessions.maxPerUser).toBe(20)
    const limit = config.sessions.maxPerUser
    config.sessions.maxPerUser = 3
    try {
      const u = await makeUser('limited@example.com', 'viewer')
      const apart = process.env.TEST_DB_DIALECT === 'mysql' ? 1100 : 0
      const made = []
      for (let i = 0; i < 5; i++) { if (i && apart) await new Promise((r) => setTimeout(r, apart)); made.push(await login('limited@example.com', `dev-${i}`)) }
      expect(await models.RefreshSession.count({ where: { user_id: u.user.id, revoked_at: null } })).toBe(3)
      expect((await refresh(made[0].body.rt)).status).toBe(403)
      expect((await refresh(made[4].body.rt)).status).toBe(200)
    } finally { config.sessions.maxPerUser = limit }
  })
})

describe('older clients (they call /check/ and treat "denied" as a refusal)', () => {
  test('with the policy off they are always answered "success", whatever the device string', async () => {
    const s = await login('owner@example.com', 'some-old-phone')
    for (const device of ['some-old-phone', 'another-phone', 'x'.repeat(255)]) {
      expect((await check(s.body.accessToken, owner.user.id, device)).body).toEqual({ status: 'success' })
    }
  })

  test('with the policy still "single" (production configuration not yet changed) a second device IS refused, with the device code the new app ignores', async () => {
    await setPolicy({ mode: 'single', blockOnLogout: false })
    try {
      const sole = await makeUser('sole@example.com', 'viewer')
      const first = await login('sole@example.com', 'first-phone')
      expect((await check(first.body.accessToken, sole.user.id, 'first-phone')).body.status).toBe('success')
      const second = await login('sole@example.com', 'second-phone')
      const verdict = (await check(second.body.accessToken, sole.user.id, 'second-phone')).body
      expect(verdict).toMatchObject({ status: 'denied', code: 'device_not_registered' })
      // the new app (redux/auth/session.js classifyDeviceCheck) treats exactly this code as "no device restriction"
    } finally { await setPolicy({ mode: 'off', blockOnLogout: false }) }
  })
})

describe('video access from several devices', () => {
  const sessionsOf = async (email, n) => {
    const out = []
    for (let i = 0; i < n; i++) out.push((await login(email, DEVICES[i % DEVICES.length])).body)
    return out
  }

  test('one account streams the same free video on a phone and a tablet at once', async () => {
    const [phone, tablet] = await sessionsOf('owner@example.com', 2)
    const both = await Promise.all([media(names.free1, phone.accessToken), media(names.free1, tablet.accessToken)])
    expect(both.map((r) => r.status)).toEqual([200, 200])
  })

  test('one account plays different videos on different devices at once, many requests in parallel', async () => {
    const devices = await sessionsOf('owner@example.com', 4)
    const requests = devices.flatMap((d, i) => [media(i % 2 ? names.free1 : names.free2, d.accessToken), media(names.free1, d.accessToken)])
    expect((await Promise.all(requests)).map((r) => r.status)).toEqual(requests.map(() => 200))
  })

  test('two different accounts watch the same free video', async () => {
    const a = (await sessionsOf('owner@example.com', 1))[0]
    const b = (await login('stranger@example.com', DEVICES[0])).body
    expect((await media(names.free1, a.accessToken)).status).toBe(200)
    expect((await media(names.free1, b.accessToken)).status).toBe(200)
  })

  test('there is no playback counter: many simultaneous requests from one account all succeed', async () => {
    const devices = await sessionsOf('owner@example.com', 6)
    const results = await Promise.all(devices.flatMap((d) => [1, 2, 3].map(() => media(names.free2, d.accessToken))))
    expect(results.every((r) => r.status === 200)).toBe(true)
  })

  test('logging out on one device does not stop the other device from fetching media', async () => {
    const [phone, tablet] = await sessionsOf('owner@example.com', 2)
    expect((await logout(phone.rt)).status).toBe(200)
    expect((await media(names.free1, tablet.accessToken)).status).toBe(200)
    expect((await refresh(tablet.rt)).status).toBe(200)
  })

  test('paid media: only an authorised account gets it, on any of its devices; others are refused', async () => {
    await models.Payment.create({ amount: 900, currency: 'ETB', user_id: owner.user.id, course_id: (await models.Course.findOne({ where: { title: 'Premium' } })).id, paid: true, reference_no: 'md-1' })
    const mine = await sessionsOf('owner@example.com', 2)
    for (const d of mine) expect((await media(names.paid, d.accessToken)).status).toBe(200)
    const theirs = (await login('stranger@example.com', DEVICES[3])).body
    expect((await media(names.paid, theirs.accessToken)).status).toBe(403)
    expect((await media(names.paid)).status).toBe(401)
  })
})
