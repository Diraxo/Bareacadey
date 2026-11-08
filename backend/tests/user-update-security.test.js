const jwt = require('jsonwebtoken')
const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')

let http, root, manager, peerManager, junior, viewer, noRolePerm
const put = (who, body) => http.put('/api/users').set(MOBILE).set(who.auth).send(body)
const permIds = async (u) => (await models.UserPermission.findAll({ where: { user_id: u.user.id } })).map((p) => p.permission_id).sort((a, b) => a - b)
const reload = (u) => models.User.findOne({ where: { id: u.user.id } })

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  await models.Role.create({ id: 20, role: 'Manager', plural: 'Managers', parent: 1 })
  await models.Role.create({ id: 21, role: 'Junior', plural: 'Juniors', parent: 20 })
  await models.Role.create({ id: 23, role: "Trainee", plural: "Trainees", parent: 20 })
  await models.Role.create({ id: 22, role: 'Other Manager', plural: 'Other Managers', parent: 1 })
  root = await makeUser('root@example.com', 'admin')
  // Manager holds: Edit Users 2, View Users 4, Edit Role 7, Chat 10, My Tasks 12, Viewer 15
  manager = await makeUser('manager@example.com', [2, 4, 7, 10, 12, 15], { role_id: 20 })
  peerManager = await makeUser('peer@example.com', [2, 4, 7, 12, 15], { role_id: 22 })
  junior = await makeUser('junior@example.com', [12, 15], { role_id: 21 })
  viewer = await makeUser('viewer@example.com', [12, 15], { role_id: 5 })
  noRolePerm = await makeUser('norole@example.com', [2, 4, 12, 15], { role_id: 20 })
})

describe('PUT /api/users privilege escalation (A1-A4)', () => {
  test('A1: cannot grant a permission the caller does not hold', async () => {
    const res = await put(manager, { id: junior.user.id, permissions: '12,15,3' }) // 3 = Delete Users, not held
    expect(res.status).toBe(403)
    expect(await permIds(junior)).toEqual([12, 15])
  })
  test('A1: nonexistent permission ids are rejected and nothing changes', async () => {
    const res = await put(manager, { id: junior.user.id, permissions: '12,15,9999' })
    expect(res.status).toBe(400)
    expect(await permIds(junior)).toEqual([12, 15])
  })
  test('A1: granting a permission the caller holds works, and the replacement is applied', async () => {
    const res = await put(manager, { id: junior.user.id, permissions: '12,15,10' })
    expect(res.status).toBe(200)
    expect(await permIds(junior)).toEqual([10, 12, 15])
  })
  test('A1: cannot remove a permission the caller does not hold', async () => {
    await models.UserPermission.create({ user_id: junior.user.id, permission_id: 3 })
    const res = await put(manager, { id: junior.user.id, permissions: '10,12,15' })
    expect(res.status).toBe(403)
    expect(await permIds(junior)).toEqual([3, 10, 12, 15])
    await models.UserPermission.destroy({ where: { user_id: junior.user.id, permission_id: 3 } })
  })
  test('A1: a forged/stale JWT permission list does not help: permissions are read from the database', async () => {
    const stale = await makeUser('stale@example.com', [2, 4, 12, 15], { role_id: 20 })
    const token = jwt.sign({ id: stale.user.id, permissions: ['Edit Users', 'Delete Users'] }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m', algorithm: 'HS256' })
    stale.auth = { Authorization: `Bearer ${token}` }
    const res = await put(stale, { id: junior.user.id, permissions: '12,15,3' })
    expect(res.status).toBe(403)
  })
  test('A1: losing "Edit Users" in the database takes effect before the JWT expires', async () => {
    const demoted = await makeUser('demoted@example.com', [2, 4, 12, 15], { role_id: 20 })
    await models.UserPermission.destroy({ where: { user_id: demoted.user.id, permission_id: 2 } })
    expect((await put(demoted, { id: junior.user.id, full_name: 'X' })).status).toBe(401)
  })

  test('A2: cannot assign a role equal to or above own (Super Admin, own role, sibling)', async () => {
    for (const role of [1, 20, 22]) {
      const res = await put(manager, { id: junior.user.id, role })
      expect(res.status).toBe(403)
    }
    expect((await reload(junior)).role_id).toBe(21)
  })
  test('A2: nonexistent role rejected', async () => {
    expect((await put(manager, { id: junior.user.id, role: 777 })).status).toBe(400)
  })
  test('A2: assigning a role strictly below works; requires "Edit Role"', async () => {
    expect((await put(manager, { id: junior.user.id, role: 23 })).status).toBe(200)
    expect((await reload(junior)).role_id).toBe(23)
    expect((await put(noRolePerm, { id: junior.user.id, role: 21 })).status).toBe(403)
    expect((await reload(junior)).role_id).toBe(23)
    expect((await put(manager, { id: viewer.user.id, role: 21 })).status).toBe(403) // sibling branch user
  })

  test('A3: cannot edit Super Admin id 1, nor a peer branch, nor a higher user', async () => {
    expect((await put(manager, { id: 1, full_name: 'Hacked' })).status).toBe(403)
    expect((await put(manager, { id: peerManager.user.id, full_name: 'Hacked' })).status).toBe(403)
    expect((await put(junior, { id: manager.user.id, full_name: 'Hacked' })).status).toBe(401) // junior lacks Edit Users
    expect((await reload(manager)).full_name).toBe('T')
    expect((await reload(root)).full_name).toBe('T')
  })
  test('A3: unknown user -> 404, not a crash', async () => {
    expect((await put(manager, { id: 987654, full_name: 'x' })).status).toBe(404)
  })
  test('A3: Super Admin can edit users below', async () => {
    expect((await put(root, { id: manager.user.id, about_me: 'ok' })).status).toBe(200)
  })

  test('A4: cannot change own role / permissions / status / password / email', async () => {
    for (const body of [{ role: 5 }, { role: 1 }, { permissions: '2,4,7,10,12,15,3' }, { permissions: '12' }, { active: 'false' }, { password: 'NewPassw0rd!' }, { email: 'new@example.com' }]) {
      const res = await put(manager, { id: manager.user.id, ...body })
      expect(res.status).toBe(403)
    }
    expect((await reload(manager)).role_id).toBe(20)
    expect(await permIds(manager)).toEqual([2, 4, 7, 10, 12, 15])
  })
  test('A4: re-sending unchanged values for self is accepted (client compatibility)', async () => {
    const res = await put(manager, { id: manager.user.id, role: 20, permissions: '2,4,7,10,12,15', active: 'true', full_name: 'Mgr' })
    expect(res.status).toBe(200)
    expect((await reload(manager)).full_name).toBe('Mgr')
  })
  test('A4: Super Admin cannot demote or deactivate self through this endpoint', async () => {
    expect((await put(root, { id: root.user.id, role: 20 })).status).toBe(403)
    expect((await put(root, { id: root.user.id, active: 'false' })).status).toBe(403)
  })
})

describe('validation, booleans and conflicts', () => {
  test('password length: min 8, max 72 bytes', async () => {
    expect((await put(manager, { id: junior.user.id, password: 'short' })).status).toBe(400)
    expect((await put(manager, { id: junior.user.id, password: 'a'.repeat(73) })).status).toBe(400)
    expect((await put(manager, { id: junior.user.id, password: 'é'.repeat(37) })).status).toBe(400) // 74 bytes
    expect((await put(manager, { id: junior.user.id, password: PASSWORD })).status).toBe(200)
  })
  test('email/username/phone conflicts are reported, not ignored', async () => {
    expect((await put(manager, { id: junior.user.id, email: viewer.user.email })).status).toBe(409)
    expect((await put(manager, { id: junior.user.id, username: viewer.user.username })).status).toBe(409)
    await viewer.user.update({ phone: '0911223344' })
    expect((await put(manager, { id: junior.user.id, phone: '0911223344' })).status).toBe(409)
    expect((await put(manager, { id: junior.user.id, email: 'not-an-email' })).status).toBe(400)
    expect((await put(manager, { id: junior.user.id, username: 'a b' })).status).toBe(400)
  })
  test('active/confirmed accept true and false, including FormData strings', async () => {
    expect((await put(manager, { id: junior.user.id, active: 'false', confirmed: 'false' })).status).toBe(200)
    let u = await reload(junior)
    expect([u.active, u.confirmed]).toEqual([false, false])
    expect((await put(manager, { id: junior.user.id, active: 'true', confirmed: '1' })).status).toBe(200)
    u = await reload(junior)
    expect([u.active, u.confirmed]).toEqual([true, true])
    expect((await put(manager, { id: junior.user.id, active: 'banana' })).status).toBe(400)
  })
  test('errors never leak internals', async () => {
    const res = await put(manager, { id: junior.user.id, gender: 'x' })
    expect(res.status).toBe(400)
    expect(JSON.stringify(res.body)).not.toMatch(/sequelize|SQL|stack/i)
  })
})

describe('atomic permission replacement', () => {
  test('a failure while writing permissions leaves the original set intact', async () => {
    const before = await permIds(junior)
    const spy = jest.spyOn(models.UserPermission, 'bulkCreate').mockRejectedValueOnce(new Error('boom'))
    const res = await put(manager, { id: junior.user.id, permissions: '12' })
    spy.mockRestore()
    expect(res.status).toBe(500)
    expect(await permIds(junior)).toEqual(before)
  })
})
