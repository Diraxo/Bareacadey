const { resetDb, makeUser, api, MOBILE } = require('./helpers')

beforeAll(async () => { await resetDb(); await makeUser('member@example.com', 'viewer') })

describe('login throttling (S9)', () => {
  test('repeated failures are rate limited', async () => {
    const { http: fresh } = api()
    const statuses = []
    for (let i = 0; i < 14; i++) {
      const res = await fresh.post('/api/auth/login').set(MOBILE).send({ userOrEmail: 'member@example.com', password: 'wrong' + i })
      statuses.push(res.status)
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true)
    expect(statuses.slice(10)).toContain(429)
  })
})
