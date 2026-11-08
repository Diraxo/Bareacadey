const jwt = require('jsonwebtoken')
const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')
const { hashToken } = require('../middlewares/tokenHash')

let http, user

const login = (body = {}, headers = MOBILE) =>
  http.post('/api/auth/login').set(headers).send({ userOrEmail: 'member@example.com', password: PASSWORD, device: 'dev', ...body })

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  user = await makeUser('member@example.com', 'viewer')
})

describe('sessions', () => {
  test('login returns tokens and sets a hardened refresh cookie', async () => {
    const res = await login()
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('rt='))
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=/i)
  })

  test('the refresh token is stored hashed, never in clear text (S7)', async () => {
    const res = await login()
    const row = await models.RefreshSession.findOne({ where: { token_hash: hashToken(res.body.rt) } })
    expect(row).toBeTruthy()
    expect(row.user_id).toBe(user.user.id)
    // the token itself appears nowhere in the stored row
    expect(JSON.stringify(row.toJSON())).not.toContain(res.body.rt)
    expect(res.body.rt.startsWith('rs1.')).toBe(true)
  })

  test('refresh works with the cookie and with the body token (mobile) and issues a new access token', async () => {
    const { body } = await login()
    const viaBody = await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: body.rt })
    expect(viaBody.status).toBe(200)
    expect(viaBody.body.accessToken).toBeTruthy()
    const viaCookie = await http.post('/api/user/token/reqtoken').set(MOBILE).set('Cookie', `rt=${body.rt}`).send({})
    expect(viaCookie.status).toBe(200)
  })

  test('a stolen database value cannot be replayed as a refresh token', async () => {
    const { body } = await login()
    const row = await models.RefreshSession.findOne({ where: { token_hash: hashToken(body.rt) } })
    for (const stolen of [row.token_hash, row.seed, `rs1.${row.id}.0.${row.token_hash.slice(0, 43)}`]) {
      const res = await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: stolen })
      expect(res.status).toBe(403)
    }
  })

  test('logout invalidates the refresh token', async () => {
    const { body } = await login()
    const out = await http.delete('/api/user/logout').set(MOBILE).set('Cookie', `rt=${body.rt}`).set({ Authorization: `Bearer ${body.accessToken}` })
    expect(out.status).toBe(200)
    expect((await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: body.rt })).status).toBe(403)
  })

  test('token logout revokes the session with no access token at all (expired-token case)', async () => {
    const { body } = await login()
    const out = await http.delete('/api/user/token/logout').set(MOBILE).send({ token: body.rt })
    expect(out.status).toBe(200)
    expect(out.body.loggedOut).toBe(true)
    expect((await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: body.rt })).status).toBe(403)
    expect((await models.RefreshSession.findOne({ where: { token_hash: hashToken(body.rt) } })).revoked_at).toBeTruthy()
  })

  test('token logout works with only the cookie, and clears it', async () => {
    const { body } = await login()
    const out = await http.delete('/api/user/token/logout').set(MOBILE).set('Cookie', `rt=${body.rt}`).send({})
    expect(out.status).toBe(200)
    expect(out.headers['set-cookie'].join(';')).toMatch(/rt=;/)
    expect((await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: body.rt })).status).toBe(403)
  })

  test('token logout with a stale token does not end the current session, and is idempotent', async () => {
    const first = await login()
    const second = await login()
    expect(second.body.rt).not.toBe(first.body.rt)
    const out = await http.delete('/api/user/token/logout').set(MOBILE).send({ token: first.body.rt })
    expect(out.status).toBe(200)
    expect((await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: second.body.rt })).status).toBe(200)
    const again = await http.delete('/api/user/token/logout').set(MOBILE).send({ token: second.body.rt })
    expect(again.body.loggedOut).toBe(true)
    expect((await http.delete('/api/user/token/logout').set(MOBILE).send({ token: second.body.rt })).status).toBe(200)
  })

  test('token logout still requires the mobile headers and never echoes the token', async () => {
    const { body } = await login()
    const blocked = await http.delete('/api/user/token/logout').send({ token: body.rt })
    expect(blocked.status).toBe(403)
    expect((await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: body.rt })).status).toBe(200)
    const out = await http.delete('/api/user/token/logout').set(MOBILE).send({ token: body.rt })
    expect(JSON.stringify(out.body)).not.toContain(body.rt)
  })

  test('wrong credentials give a generic 401 and unknown users look the same', async () => {
    const wrong = await login({ password: 'nope' })
    const unknown = await login({ userOrEmail: 'ghost@example.com' })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body).toEqual(unknown.body)
  })

  test('deactivated accounts cannot sign in or refresh', async () => {
    const inactive = await makeUser('gone@example.com', 'viewer')
    const ok = await login({ userOrEmail: 'gone@example.com' })
    expect(ok.status).toBe(200)
    await inactive.user.update({ active: false })
    expect((await login({ userOrEmail: 'gone@example.com' })).status).toBe(403)
    expect((await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: ok.body.rt })).status).toBe(403)
  })

  test('internal errors do not leak details', async () => {
    const res = await http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: { $ne: 1 }, password: 'x' })
    expect(JSON.stringify(res.body)).not.toMatch(/sequelize|sql|stack|at \w+/i)
  })
})

describe('single-purpose tokens', () => {
  test('a password-reset token is not accepted as an API access token', async () => {
    const reset = jwt.sign({ id: user.user.id, typ: 'reset' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h', algorithm: 'HS256' })
    const res = await http.get('/api/roles/mine').set(MOBILE).set({ Authorization: `Bearer ${reset}` })
    expect(res.status).toBe(403)
  })

  test('set_new_password requires a reset-type token that belongs to the account', async () => {
    const victim = await makeUser('victim@example.com', 'viewer')
    // an ordinary access token for the victim, stored as the "reset token" by a hypothetical attacker flow
    const access = jwt.sign({ id: victim.user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h', algorithm: 'HS256' })
    await victim.user.update({ reset_password_token: access })
    let res = await http.post('/api/auth/set_new_password').set(MOBILE).send({ resetToken: access, newPassword: 'Brand!New1Password' })
    expect(res.body.error).toBe(true)

    const mine = jwt.sign({ id: victim.user.id, typ: 'reset' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h', algorithm: 'HS256' })
    await victim.user.update({ reset_password_token: mine })
    res = await http.post('/api/auth/set_new_password').set(MOBILE).send({ resetToken: mine, newPassword: 'short' })
    expect(res.body.error).toBe(true) // password policy
    res = await http.post('/api/auth/set_new_password').set(MOBILE).send({ resetToken: mine, newPassword: 'Brand!New1Password' })
    expect(res.body.message).toBe('Successfully Updated')
    expect((await login({ userOrEmail: 'victim@example.com', password: 'Brand!New1Password' })).status).toBe(200)
  })

  test('a reset token for user A cannot reset user B even if stored on B', async () => {
    const a = await makeUser('a@example.com', 'viewer')
    const b = await makeUser('b@example.com', 'viewer')
    const tokenA = jwt.sign({ id: a.user.id, typ: 'reset' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h', algorithm: 'HS256' })
    await b.user.update({ reset_password_token: tokenA })
    const res = await http.post('/api/auth/set_new_password').set(MOBILE).send({ resetToken: tokenA, newPassword: 'Brand!New1Password' })
    expect(res.body.error).toBe(true)
    expect((await login({ userOrEmail: 'b@example.com', password: PASSWORD })).status).toBe(200)
  })

  test('missing or empty reset tokens answer instead of hanging', async () => {
    for (const body of [{}, { resetToken: '' }, { resetToken: 123 }]) {
      const res = await http.post('/api/auth/set_new_password').set(MOBILE).send({ ...body, newPassword: 'Brand!New1Password' })
      expect(res.body.error).toBe(true)
    }
  })
})

describe('registration', () => {
  const register = (over = {}) => http.post('/api/auth/create_account').set(MOBILE)
    .send({ first_name: 'New', last_name: 'Student', username: 'new1', email: 'new1@example.com', password: 'Str0ng!Passw0rd', role: 5, device: 'Phone', ...over })

  test('creates a student, registers the sign-up device and hashes the password', async () => {
    const res = await register()
    expect(res.status).toBe(200)
    const created = await models.User.findOne({ where: { email: 'new1@example.com' } })
    expect(created.password).not.toContain('Str0ng')
    expect(created.role_id).toBe(5)
    expect(await models.Device.count({ where: { user_id: created.id, device: 'Phone' } })).toBe(1)
  })
  test('rejects short passwords', async () => {
    const res = await register({ username: 'new2', email: 'new2@example.com', password: 'short' })
    expect(res.body.error).toBe(true)
    expect(await models.User.count({ where: { email: 'new2@example.com' } })).toBe(0)
  })
  test('cannot self-assign administrator roles', async () => {
    await register({ username: 'new3', email: 'new3@example.com', role: 1 })
    const created = await models.User.findOne({ where: { email: 'new3@example.com' } })
    expect(created.role_id).toBe(5)
    expect(await models.UserPermission.count({ where: { user_id: created.id, permission_id: 1 } })).toBe(0)
  })
})

