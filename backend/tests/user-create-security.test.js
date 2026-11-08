const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')

let http, root, manager, noAdd, junior
const post = (who, body) => http.post('/api/users').set(MOBILE).set(who.auth).send(body)
const valid = (n, extra = {}) => ({
  full_name: 'New Person', username: `new_${n}`, email: `new_${n}@example.com`,
  phone: '251-911223344'.replace('344', String(100 + n)), password: PASSWORD, role: 21, permissions: '12,15', ...extra,
})
const find = (username) => models.User.findOne({ where: { username } })
const permIds = async (u) => (await models.UserPermission.findAll({ where: { user_id: u.id } })).map((p) => p.permission_id).sort((a, b) => a - b)
const userCount = () => models.User.count()
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  await models.Role.create({ id: 20, role: 'Manager', plural: 'Managers', parent: 1 })
  await models.Role.create({ id: 21, role: 'Junior', plural: 'Juniors', parent: 20 })
  await models.Role.create({ id: 22, role: 'Other Manager', plural: 'Other Managers', parent: 1 })
  root = await makeUser('root@example.com', 'admin')
  // Manager holds: Add Users 1, Edit Users 2, View Users 4, Edit Role 7, Chat 10, My Tasks 12, Viewer 15
  manager = await makeUser('manager@example.com', [1, 2, 4, 7, 10, 12, 15], { role_id: 20 })
  noAdd = await makeUser('noadd@example.com', [2, 4, 12, 15], { role_id: 20 })
  junior = await makeUser('junior@example.com', [1, 2, 12, 15], { role_id: 21 })
})

afterEach(() => jest.restoreAllMocks())

describe('POST /api/users authorization', () => {
  test('caller without the permission is refused and nothing is created', async () => {
    const before = await userCount()
    expect((await post(noAdd, valid(1))).status).toBe(401)
    const viewer = await makeUser('viewer@example.com', [12, 15], { role_id: 5 })
    expect((await post(viewer, valid(1))).status).toBe(401)
    expect(await userCount()).toBe(before + 1) // only the viewer made by this test
  })
  test('"Add Users" alone is not enough: "Edit Users" is required as well', async () => {
    const addOnly = await makeUser('addonly@example.com', [1, 12, 15], { role_id: 20 })
    expect((await post(addOnly, valid(2))).status).toBe(401)
    expect(await find('new_2')).toBeNull()
  })
  test('forged JWT permission claims do not help: permissions come from the database', async () => {
    const forged = jwt.sign({ id: noAdd.user.id, permissions: ['Add Users', 'Edit Users'] }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m', algorithm: 'HS256' })
    const res = await post({ auth: { Authorization: `Bearer ${forged}` } }, valid(3))
    expect(res.status).toBe(401)
    expect(await find('new_3')).toBeNull()
  })
  test('a permission removed in the database takes effect before the JWT expires', async () => {
    const demoted = await makeUser('demoted@example.com', [1, 2, 12, 15], { role_id: 20 })
    await models.UserPermission.destroy({ where: { user_id: demoted.user.id, permission_id: 2 } })
    expect((await post(demoted, valid(4))).status).toBe(401)
    expect(await find('new_4')).toBeNull()
  })
  test('a deactivated or blocked caller is refused', async () => {
    const blocked = await makeUser('blocked@example.com', [1, 2, 12, 15], { role_id: 20, blocked: true })
    expect((await post(blocked, valid(5))).status).toBe(403)
  })

  test('cannot create a user with a higher, equal, sibling or Super Admin role', async () => {
    for (const role of [1, 20, 22]) {
      const res = await post(manager, valid(6, { role }))
      expect(res.status).toBe(403)
    }
    expect((await post(junior, valid(6, { role: 20 }))).status).toBe(403) // higher
    expect((await post(junior, valid(6, { role: 21 }))).status).toBe(403) // equal
    expect((await post(root, valid(6, { role: 1 }))).status).toBe(403) // even Super Admin cannot mint another one here
    expect(await find('new_6')).toBeNull()
  })
  test('a role outside the caller\'s branch is refused; an unrelated root-less role is refused', async () => {
    await models.Role.create({ id: 30, role: 'Orphan', plural: 'Orphans' }) // no parent
    expect((await post(manager, valid(7, { role: 30 }))).status).toBe(403)
    expect((await post(root, valid(7, { role: 30 }))).status).toBe(403)
  })
  test('invalid role ids', async () => {
    for (const role of [777, '-1', 'abc', '2.5', '1e1']) {
      expect((await post(manager, valid(8, { role }))).status).toBe(400)
    }
    expect(await find('new_8')).toBeNull()
  })
  test('the default role (5) is held to the same rule', async () => {
    const body = valid(9)
    delete body.role
    expect((await post(manager, body)).status).toBe(403) // 5 is not below Manager
    expect((await post(root, body)).status).toBe(200) // seeded role 5 (Viewer) sits directly under Super Admin
  })

  test('cannot grant a permission the caller does not hold', async () => {
    const res = await post(manager, valid(10, { permissions: '12,15,3' })) // 3 = Delete Users
    expect(res.status).toBe(403)
    expect(await find('new_10')).toBeNull()
  })
  test('unknown, malformed permission ids are rejected', async () => {
    expect((await post(manager, valid(11, { permissions: '12,9999' }))).status).toBe(400)
    expect((await post(manager, valid(11, { permissions: '12,abc' }))).status).toBe(400)
    expect((await post(manager, valid(11, { permissions: '12;DROP' }))).status).toBe(400)
    expect(await find('new_11')).toBeNull()
  })
})

describe('POST /api/users validation and mass assignment', () => {
  test.each([
    ['email', { email: 'not-an-email' }],
    ['email missing', { email: '' }],
    ['username', { username: 'a b' }],
    ['username short', { username: 'ab' }],
    ['phone', { phone: 'call me' }],
    ['password short', { password: 'short' }],
    ['password too long', { password: 'a'.repeat(73) }],
    ['password multibyte', { password: 'é'.repeat(37) }],
    ['full name', { full_name: '' }],
    ['full name (blank)', { full_name: '   ' }],
    ['gender', { gender: 'x' }],
    ['date of birth', { date_of_birth: 'yesterday-ish' }],
    ['active', { active: 'banana' }],
  ])('invalid %s -> 400 and nothing created', async (_, extra) => {
    const before = await userCount()
    const res = await post(manager, valid(12, extra))
    expect(res.status).toBe(400)
    expect(await userCount()).toBe(before)
  })
  test('non-scalar values (arrays, objects) are rejected', async () => {
    expect((await post(manager, valid(13, { email: ['a@b.co'] }))).status).toBe(400)
    expect((await post(manager, valid(13, { role: { $ne: 1 } }))).status).toBe(400)
  })
  test('duplicate username, email, phone -> 409', async () => {
    expect((await post(manager, valid(14))).status).toBe(200)
    expect((await post(manager, valid(15, { username: 'new_14' }))).status).toBe(409)
    expect((await post(manager, valid(15, { email: 'new_14@example.com' }))).status).toBe(409)
    expect((await post(manager, valid(15, { phone: (await find('new_14')).phone }))).status).toBe(409)
    expect(await find('new_15')).toBeNull()
  })
  test('unexpected fields are rejected, so role_id / blocked / added_by cannot be mass-assigned', async () => {
    for (const extra of [{ role_id: 1 }, { blocked: false }, { id: 1 }, { added_by: 1 }, { upload_id: 1 }, { refresh_token: 'x' }, { isAdmin: true }]) {
      const res = await post(manager, valid(16, extra))
      expect(res.status).toBe(400)
    }
    expect(await find('new_16')).toBeNull()
  })
  test('the password is stored hashed, and error bodies do not leak internals', async () => {
    expect((await post(manager, valid(17))).status).toBe(200)
    expect((await find('new_17')).password).not.toBe(PASSWORD)
    const res = await post(manager, valid(17, { username: 'new_17b', gender: 'x' }))
    expect(JSON.stringify(res.body)).not.toMatch(/sequelize|SQL|stack/i)
  })
})

describe('POST /api/users success and compatibility', () => {
  test('authorized manager creates a user: role, permissions, device, audit fields and activity', async () => {
    const activities = await models.Activity.count()
    const res = await post(manager, valid(20, { permissions: '12,15,10', device: 'dev-1', active: true, confirmed: false }))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Successfully Registered' })
    const user = await find('new_20')
    expect(user.role_id).toBe(21)
    expect(user.added_by).toBe(manager.user.id)
    expect(user.active).toBe(true)
    expect(await permIds(user)).toEqual([10, 12, 15])
    expect((await models.Device.findOne({ where: { user_id: user.id } })).device).toBe('dev-1')
    expect(await models.Activity.count()).toBe(activities + 1)
  })
  test('Super Admin can create a user below it holding any permissions, and the new user can log in', async () => {
    const res = await post(root, valid(21, { role: 20, permissions: '1,2,3,4' }))
    expect(res.status).toBe(200)
    const login = await http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: 'new_21@example.com', password: PASSWORD, device: 'dev' })
    expect(login.status).toBe(200)
    expect((await find('new_21')).role_id).toBe(20)
  })
  test('no permissions sent -> none granted (it used to grant "Edit Users")', async () => {
    const body = valid(22)
    delete body.permissions
    expect((await post(manager, body)).status).toBe(200)
    expect(await permIds(await find('new_22'))).toEqual([])
    expect((await post(manager, valid(23, { permissions: '' }))).status).toBe(200)
    expect(await permIds(await find('new_23'))).toEqual([])
  })
  test('web FormData request (array permissions sent as "12,15", booleans as strings) works with an avatar', async () => {
    const res = await http.post('/api/users').set(MOBILE).set(manager.auth)
      .field('full_name', 'Web Form').field('username', 'web_form').field('email', 'web_form@example.com')
      .field('phone', '251-911000111').field('about_me', 'hi').field('gender', 'Male')
      .field('date_of_birth', 'Sun Nov 01 2026 10:00:00 GMT+0300 (East Africa Time)')
      .field('password', PASSWORD).field('role', '21').field('active', 'false').field('confirmed', 'true').field('permissions', '12,15')
      .attach('file', PNG, 'me.png')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Successfully Registered' })
    const user = await find('web_form')
    expect([user.active, user.confirmed]).toEqual([false, true])
    expect(user.upload_id).toBeTruthy()
    expect(await permIds(user)).toEqual([12, 15])
  })
  test('JSON request with numeric ids and array permissions works', async () => {
    expect((await post(manager, valid(24, { role: 21, permissions: [12, 15] }))).status).toBe(200)
    expect(await permIds(await find('new_24'))).toEqual([12, 15])
  })
})

describe('POST /api/users atomicity', () => {
  const uploads = () => models.UserUpload.count()
  const avatarFiles = () => {
    const dir = path.resolve(__dirname, '..', 'files', 'uploads', 'users', 'profile')
    return fs.existsSync(dir) ? fs.readdirSync(dir).length : 0
  }
  const withAvatar = (body) => {
    let req = http.post('/api/users').set(MOBILE).set(manager.auth)
    for (const [k, v] of Object.entries(body)) req = req.field(k, String(v))
    return req.attach('file', PNG, 'a.png')
  }

  test('failure while inserting permissions rolls everything back, including the avatar', async () => {
    jest.spyOn(models.UserPermission, 'bulkCreate').mockRejectedValueOnce(new Error('boom'))
    const [users, devices, ups, files, acts] = [await userCount(), await models.Device.count(), await uploads(), avatarFiles(), await models.Activity.count()]
    const res = await withAvatar(valid(30))
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toMatch(/boom/)
    expect(await find('new_30')).toBeNull()
    expect(await userCount()).toBe(users)
    expect(await models.Device.count()).toBe(devices)
    expect(await models.Activity.count()).toBe(acts)
    expect(await uploads()).toBe(ups)
    expect(avatarFiles()).toBe(files)
  })
  test('failure while logging the activity rolls everything back, including the avatar', async () => {
    jest.spyOn(models.Activity, 'create').mockRejectedValueOnce(new Error('boom'))
    const [users, ups, files] = [await userCount(), await uploads(), avatarFiles()]
    const res = await withAvatar(valid(31))
    expect(res.status).toBe(500)
    expect(await find('new_31')).toBeNull()
    expect(await userCount()).toBe(users)
    expect(await models.UserPermission.count({ where: { user_id: null } })).toBe(0)
    expect(await uploads()).toBe(ups)
    expect(avatarFiles()).toBe(files)
  })
  test('an unauthorized or invalid request leaves no avatar or account behind', async () => {
    const [users, ups, files] = [await userCount(), await uploads(), avatarFiles()]
    let req = http.post('/api/users').set(MOBILE).set(manager.auth)
    for (const [k, v] of Object.entries(valid(32, { role: 1 }))) req = req.field(k, String(v))
    expect((await req.attach('file', PNG, 'a.png')).status).toBe(403)
    expect((await withAvatar(valid(32, { permissions: '3' }))).status).toBe(403)
    expect((await withAvatar(valid(32, { email: 'bad' }))).status).toBe(400)
    expect(await userCount()).toBe(users)
    expect(await uploads()).toBe(ups)
    expect(avatarFiles()).toBe(files)
  })
})
