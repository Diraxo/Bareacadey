process.env.FORGOT_RATE_LIMIT_MAX = '60'
process.env.FORGOT_ACCOUNT_RATE_LIMIT_MAX = '5'
const mockSent = []
jest.mock('../middlewares/emailController', () => ({
  sendEmailLink: jest.fn(async () => true),
  sendResetCode: jest.fn(async (args) => { mockSent.push(args); return true }),
}))
const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')

let http, user, phoneUser
const login = (userOrEmail, password) => http.post('/api/auth/login').set(MOBILE).send({ userOrEmail, password, device: 'dev' })

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  user = await makeUser('reset@example.com', 'viewer', { username: '+251-911000333', phone: '+251-911000333' })
  phoneUser = await makeUser('temp@example.com', 'viewer', { username: '+251-922000444', email: '+251-922000444@temp.com' })
})

describe('phone sign-in', () => {
  test('the same number written with or without the local zero signs in', async () => {
    for (const typed of ['+251-911000333', '+251-0911000333', '+251911000333']) {
      expect((await login(typed, PASSWORD)).status).toBe(200)
    }
  })
})

describe('forgot password by code', () => {
  const request = (identifier) => http.post('/api/auth/forgot/request').set(MOBILE).send({ identifier })
  const reset = (body) => http.post('/api/auth/forgot/reset').set(MOBILE).send({ identifier: '+251-911000333', ...body })

  test('emails a 6-digit code, stores only its hash, and the code resets the password', async () => {
    const res = await request('+251-911000333')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('sent')
    expect(res.body.email).toMatch(/^re\*+@example\.com$/)
    const { code } = mockSent[mockSent.length - 1]
    expect(code).toMatch(/^\d{6}$/)
    expect((await models.User.findByPk(user.user.id)).reset_password_token).not.toContain(code)

    expect((await reset({ code: '000000', newPassword: 'Brand!New1Password' })).body.code).toBe('invalid_code')
    const ok = await reset({ code, newPassword: 'Brand!New1Password' })
    expect(ok.body.message).toBe('Successfully Updated')
    expect((await login('+251-911000333', 'Brand!New1Password')).status).toBe(200)
    expect((await login('+251-911000333', PASSWORD)).status).toBe(401)
    // a used code cannot be replayed
    expect((await reset({ code, newPassword: 'Another!Pass123' })).status).toBe(400)
  })

  test('resetting by code signs out every session of that account and nobody else', async () => {
    const refresh = (token) => http.post('/api/user/token/reqtoken').set(MOBILE).send({ token })
    const other = await makeUser('bystander@example.com', 'viewer')
    const s1 = await login('+251-911000333', 'Brand!New1Password')
    const s2 = await login('+251-911000333', 'Brand!New1Password')
    const o = await login('bystander@example.com', PASSWORD)
    expect((await refresh(s1.body.rt)).status).toBe(200)
    await request('+251-911000333')
    const { code } = mockSent[mockSent.length - 1]
    expect((await reset({ code, newPassword: 'Brand!New1Password' })).body.message).toBe('Successfully Updated')
    expect((await refresh(s1.body.rt)).status).toBe(403)
    expect((await refresh(s2.body.rt)).status).toBe(403)
    expect((await refresh(o.body.rt)).status).toBe(200)
    expect(other.user.id).not.toBe(user.user.id)
  })

  test('works with the email address too', async () => {
    const res = await request('reset@example.com')
    expect(res.body.status).toBe('sent')
  })

  test('five wrong guesses burn the code', async () => {
    await request('+251-911000333')
    const { code } = mockSent[mockSent.length - 1]
    const wrong = code === '123456' ? '654321' : '123456'
    for (let i = 0; i < 5; i++) expect((await reset({ code: wrong, newPassword: 'Brand!New1Password' })).status).toBe(400)
    expect((await reset({ code, newPassword: 'Brand!New1Password' })).body.code).toBe('expired_code')
  })

  test('an expired code is refused', async () => {
    await request('+251-911000333')
    const { code } = mockSent[mockSent.length - 1]
    const row = await models.User.findByPk(user.user.id)
    await row.update({ reset_password_token: row.reset_password_token.replace(/:(\d+):(\d+)$/, `:${Date.now() - 1000}:0`) })
    expect((await reset({ code, newPassword: 'Brand!New1Password' })).body.code).toBe('expired_code')
  })

  test('short passwords are refused', async () => {
    const res = await reset({ code: '123456', newPassword: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('weak_password')
  })

  test('accounts without a real email are told so instead of a promise that never arrives', async () => {
    const before = mockSent.length
    const res = await request('+251-922000444')
    expect(res.body.status).toBe('no_email')
    expect(mockSent.length).toBe(before)
  })

  test('unknown accounts get the same neutral answer and nothing is sent', async () => {
    const before = mockSent.length
    const res = await request('+251-900000000')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('sent')
    expect(res.body.email).toBeUndefined()
    expect(mockSent.length).toBe(before)
  })

  test('requests are limited per account and report when to retry', async () => {
    await makeUser('limit@example.com', 'viewer')
    let last
    for (let i = 0; i < 6; i++) last = await request('limit@example.com')
    expect(last.status).toBe(429)
    expect(last.body.code).toBe('rate_limited')
    expect(last.body.retryAfterSeconds).toBeGreaterThan(0)
  })
})

describe('sign-up limits', () => {
  test('bulk sign-up from one address is limited', async () => {
    const statuses = []
    for (let i = 0; i < 13; i++) {
      const res = await http.post('/api/auth/create_account').set(MOBILE).send({ first_name: 'A', last_name: 'B', username: `+251-93000${1000 + i}`, email: `bulk${i}@example.com`, password: 'Str0ng!Passw0rd', device: 'd' })
      statuses.push(res.status)
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true)
    expect(statuses.slice(10)).toContain(429)
  })
})
