/* Laptop sleep / screen off and the refresh cookie. These DOCUMENT how the server treats a browser whose refresh cookie is
 * behind the server's (a rotation whose answer never arrived). The policy is unchanged; the frontend is what avoids
 * landing here (see frontend/tests/background-resume.test.mjs). */
const { resetDb, makeUser, api, models, ORIGIN, PASSWORD } = require('./helpers')
const config = require('../config')
const sessions = require('../services/sessions')

let http
const cookieOf = (res) => {
  const c = (res.headers['set-cookie'] || []).find((x) => x.startsWith('rt='))
  return c ? decodeURIComponent(/^rt=([^;]*)/.exec(c)[1]) : null
}
const refresh = (token) => http.post('/api/user/token/reqtoken').set(ORIGIN).set('Cookie', `rt=${token}`).send({})
const rowOf = (token) => models.RefreshSession.findByPk(sessions.parseToken(token).id)
const newSession = async () => cookieOf(await http.post('/api/auth/login').set(ORIGIN).send({ userOrEmail: 'sleepy@example.com', password: PASSWORD, device: 'd' }))
const ago = (s) => new Date(Date.now() - s * 1000)

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  await makeUser('sleepy@example.com', 'viewer')
})

test('answer lost, retried within the grace window: the session survives and gets the current token', async () => {
  const t0 = await newSession()
  const t1 = cookieOf(await refresh(t0)) // the browser never saw this answer
  const retry = await refresh(t0)
  expect(retry.status).toBe(200)
  expect(cookieOf(retry)).toBe(t1)
})

test('answer lost, laptop asleep past the grace window: the retry is treated as token reuse and the session is revoked', async () => {
  const t0 = await newSession()
  const t1 = cookieOf(await refresh(t0))
  await (await rowOf(t1)).update({ rotated_at: ago(config.sessions.rotationGraceSeconds + 60) })
  const wake = await refresh(t0)
  expect(wake.status).toBe(403)
  expect(wake.body.code).toBe('session_revoked')
  expect((await rowOf(t1)).revoked_reason).toBe('reuse')
  // the frontend turns exactly this answer into "signed out"
})

test('three overlapping refreshes of one browser: a straggler that carries the oldest token revokes the session (why tabs must take turns)', async () => {
  const t0 = await newSession()
  const t1 = cookieOf(await refresh(t0)) // tab A
  const t2 = cookieOf(await refresh(t1)) // tab B read the new cookie and rotated again
  const straggler = await refresh(t0)    // tab C sent its request before either answer arrived
  expect(straggler.status).toBe(403)
  expect((await rowOf(t2)).revoked_reason).toBe('reuse')
})

test('refreshes that take turns (each reads the cookie the previous one set) never hit reuse detection', async () => {
  let t = await newSession()
  for (let i = 0; i < 6; i++) { const r = await refresh(t); expect(r.status).toBe(200); t = cookieOf(r) }
  expect((await rowOf(t)).revoked_at).toBeNull()
})
