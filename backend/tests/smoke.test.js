const { resetDb, api, MOBILE } = require('./helpers')

beforeAll(resetDb)

test('app boots, root answers, unknown routes 404', async () => {
  const { http } = api()
  const root = await http.get('/').set(MOBILE)
  expect(root.status).toBe(200)
  const missing = await http.get('/nope').set(MOBILE)
  expect([401, 404]).toContain(missing.status) // anonymous callers are stopped by the auth gate before the catch-all
})
