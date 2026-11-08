const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')

let http, alice, bob, course, carolId

const login = (email, password = PASSWORD) => http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: email, password, device: 'dev' })
const del = (user, body) => http.delete('/api/users/delete-user-account').set(MOBILE).set(user.auth).send(body)

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  await makeUser('root@example.com', 'admin') // takes id 1, the protected super admin
  alice = await makeUser('alice@example.com', 'viewer', { phone: '0911000001' })
  bob = await makeUser('bob@example.com', 'viewer')
  course = await models.Course.create({ title: 'Biology', main_price: 500, type: 'course', routeState: 'published' })
})

describe('self-service account deletion', () => {
  test('requires the password and deletes nothing without it', async () => {
    expect((await del(alice, {})).status).toBe(400)
    const wrong = await del(alice, { password: 'not-the-password' })
    expect(wrong.status).toBe(403)
    expect((await models.User.findByPk(alice.user.id)).active).toBe(true)
  })

  test('another user cannot be targeted through the body', async () => {
    const res = await del(alice, { password: PASSWORD, id: bob.user.id })
    expect(res.status).toBe(200)
    expect((await models.User.findByPk(bob.user.id)).email).toBe('bob@example.com')
  })

  test('anonymises the account, removes personal content and revokes sessions', async () => {
    const carol = await makeUser('carol@example.com', 'viewer', { phone: '0911000002', about_me: 'private' })
    const first = await login('carol@example.com')
    expect(first.status).toBe(200)
    await models.UserRating.create({ rating: 4, comment: 'good', added_by: carol.user.id, course_id: course.id })
    await models.Device.create({ device: 'dev', user_id: carol.user.id })
    await models.Payment.create({ amount: 500, currency: 'ETB', user_id: carol.user.id, course_id: course.id, paid: true, reference_no: 'keep-me' })
    await models.Chat.create({ message: 'hello', type: 'text', from: carol.user.id, to: bob.user.id })

    carolId = carol.user.id
    const res = await del(carol, { password: PASSWORD })
    expect(res.status).toBe(200)

    const row = await models.User.findByPk(carol.user.id)
    expect(row.email).not.toBe('carol@example.com')
    expect(row.phone).toBe('')
    expect(row.about_me).toBe('')
    expect(row.full_name).toBe('Deleted user')
    expect(row.active).toBe(false)
    expect(await models.UserRating.count({ where: { added_by: carol.user.id } })).toBe(0)
    expect(await models.Device.count({ where: { user_id: carol.user.id } })).toBe(0)
    expect(await models.UserPermission.count({ where: { user_id: carol.user.id } })).toBe(0)
    expect(await models.Chat.count({ where: { from: carol.user.id } })).toBe(0)
    expect(await models.Payment.count({ where: { reference_no: 'keep-me' } })).toBe(1) // retained record

    const open = await models.RefreshSession.count({ where: { user_id: carol.user.id, revoked_at: null } })
    expect(open).toBe(0)
    expect((await http.post('/api/user/token/reqtoken').set(MOBILE).send({ token: first.body.rt })).status).toBe(403)
  })

  test('the deleted account can no longer sign in, and its email and phone are free again', async () => {
    expect([401, 403]).toContain((await login('carol@example.com')).status)
    expect([401, 403]).toContain((await login(`deleted-${carolId}@deleted.invalid`)).status)
    expect((await login('bob@example.com')).status).toBe(200) // other accounts unaffected
  })

  test('the super admin account cannot be deleted this way', async () => {
    const res = await http.delete('/api/users/delete-user-account').set(MOBILE).set({ Authorization: `Bearer ${require('jsonwebtoken').sign({ id: 1, permissions: [] }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m', algorithm: 'HS256' })}` }).send({ password: PASSWORD })
    expect(res.body.error).toBe(true)
    expect((await models.User.findByPk(1)).email).toBe('root@example.com')
  })
})
