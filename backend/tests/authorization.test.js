const { resetDb, makeUser, api, models, sequelize, MOBILE, ORIGIN, PASSWORD } = require('./helpers')

let http, admin, student, other, instructor

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  admin = await makeUser('admin@example.com', 'admin')
  student = await makeUser('student@example.com', 'viewer')
  other = await makeUser('other@example.com', 'viewer')
  instructor = await makeUser('teacher@example.com', 'instructor')
})

describe('the destructive /sync-database endpoint is gone (S1)', () => {
  test.each(['post', 'get', 'put', 'delete'])('%s /sync-database has no handler, for anonymous callers or administrators', async (method) => {
    const before = await models.User.count()
    const tables = (await sequelize.getQueryInterface().showAllTables()).length
    const anonymous = await http[method]('/sync-database').set(MOBILE).send({ type: 'force', model: '../server' })
    expect([401, 404]).toContain(anonymous.status) // stopped at the auth gate or the catch-all; never a handler
    const asAdmin = await http[method]('/sync-database').set(MOBILE).set(admin.auth).send({ type: 'force', model: '../server' })
    expect(asAdmin.status).toBe(404) // even an authenticated administrator reaches no handler
    expect(await models.User.count()).toBe(before)
    expect((await sequelize.getQueryInterface().showAllTables()).length).toBe(tables)
  })
})

describe('mobile/origin gate', () => {
  test('requests with neither an Origin nor the app header are refused', async () => {
    const res = await http.post('/api/auth/login').send({ userOrEmail: 'x', password: 'y' })
    expect(res.status).toBe(403)
  })
  test('wrong app key is refused', async () => {
    const res = await http.post('/api/auth/login').set({ 'x-react-native-app': 'nope', 'user-agent': 'rnafm' }).send({})
    expect(res.status).toBe(403)
  })
  test('a request without any User-Agent does not crash the server', async () => {
    const res = await http.post('/api/auth/login').set('x-react-native-app', process.env.MOBILE_APP_KEY).set('user-agent', '').send({})
    expect(res.status).toBe(403)
  })
})

describe('authentication is required for the protected API', () => {
  test.each([
    ['get', '/api/users'], ['get', '/api/roles'], ['get', '/api/system_config'], ['get', '/api/chats/1'],
    ['post', '/api/payments'], ['get', '/api/activities'], ['post', '/api/quizzes'],
  ])('%s %s -> 401 without a token', async (method, url) => {
    const res = await http[method](url).set(MOBILE)
    expect(res.status).toBe(401)
  })

  test('errors do not echo jwt internals', async () => {
    const res = await http.get('/api/users').set(MOBILE).set('Authorization', 'Bearer not.a.jwt')
    expect(res.status).toBe(403)
    expect(JSON.stringify(res.body)).not.toMatch(/jwt|malformed|signature/i)
  })
})

describe('a signed-in student cannot administer users or roles (privilege escalation fix)', () => {
  test('cannot list users', async () => {
    const res = await http.get('/api/users').set(MOBILE).set(student.auth)
    expect(res.status).toBe(401)
  })
  test('cannot create a user with chosen permissions', async () => {
    const before = await models.User.count()
    const res = await http.post('/api/users').set(MOBILE).set(student.auth)
      .send({ first_name: 'x', last_name: 'y', username: 'evil', email: 'evil@example.com', password: 'Str0ng!Passw0rd', permissions: '1,2,3,4,5,6,7,8,9' })
    expect(res.status).toBe(401)
    expect(await models.User.count()).toBe(before)
  })
  test('cannot edit another account or grant itself permissions', async () => {
    const res = await http.put('/api/users').set(MOBILE).set(student.auth).send({ id: student.user.id, permissions: '1,2,3,4,5,6,7,8,9' })
    expect(res.status).toBe(401)
    expect(await models.UserPermission.count({ where: { user_id: student.user.id } })).toBe(2)
  })
  test('cannot delete users', async () => {
    const res = await http.delete('/api/users').set(MOBILE).set(student.auth).send({ id: other.user.id })
    expect(res.status).toBe(401)
    expect(await models.User.findByPk(other.user.id)).not.toBeNull()
  })
  test('cannot create, edit or delete roles', async () => {
    for (const [method, body] of [['post', { role: 'Evil', plural: 'Evils' }], ['put', { id: 5, role: 'Hacked' }], ['delete', { id: 12 }]]) {
      const res = await http[method]('/api/roles').set(MOBILE).set(student.auth).send(body)
      expect(res.status).toBe(401)
    }
    expect((await models.Role.findByPk(5)).role).toBe('Viewer')
  })
  test('cannot read the activity log', async () => {
    expect((await http.get('/api/activities').set(MOBILE).set(student.auth)).status).toBe(401)
  })
  test('an administrator can still list users', async () => {
    const res = await http.get('/api/users').set(MOBILE).set(admin.auth)
    expect(res.status).toBe(200)
  })
  test('a user can read their own record but not someone else’s', async () => {
    expect((await http.get(`/api/users/${student.user.id}`).set(MOBILE).set(student.auth)).status).toBe(200)
    expect((await http.get(`/api/users/${other.user.id}`).set(MOBILE).set(student.auth)).status).toBe(401)
  })
  test('the Super Admin account cannot be deleted through the API', async () => {
    const res = await http.delete('/api/users').set(MOBILE).set(admin.auth).send({ id: 1 })
    expect(res.body.error).toBe(true)
    expect(await models.User.findByPk(1)).not.toBeNull()
  })
})

describe('profile update only ever acts on the caller (account-takeover fix)', () => {
  test('a student cannot change another user’s email or username', async () => {
    const res = await http.put('/api/users/profile/update').set(MOBILE).set(student.auth)
      .send({ id: other.user.id, email: 'attacker@evil.test', username: 'pwned' })
    expect(res.status).toBe(200)
    const victim = await models.User.findByPk(other.user.id)
    expect(victim.email).toBe('other@example.com')
    expect(victim.username).toBe('other')
    // the request was applied to the caller's own account instead
    expect((await models.User.findByPk(student.user.id)).email).toBe('attacker@evil.test')
    await models.User.update({ email: 'student@example.com', username: 'student' }, { where: { id: student.user.id } })
  })
  test('a student cannot change another user’s profile fields or role', async () => {
    await http.put('/api/users/profile/update').set(MOBILE).set(student.auth)
      .send({ id: other.user.id, full_name: 'Pwned', role: 1 })
    const victim = await models.User.findByPk(other.user.id)
    expect(victim.full_name).toBe('T')
    expect(victim.role_id).toBe(5)
    const self = await models.User.findByPk(student.user.id)
    expect(self.full_name).toBe('Pwned')
    expect(self.role_id).toBe(5) // role change ignored for non-admins
  })
  test('password change still requires the correct old password', async () => {
    const res = await http.put('/api/users/profile/update').set(MOBILE).set(student.auth)
      .send({ old_password: 'wrong', password: 'Another!Passw0rd' })
    expect(res.body.incorrectOldPassword).toBe(true)
  })
  test('an administrator may edit another user', async () => {
    await http.put('/api/users/profile/update').set(MOBILE).set(admin.auth).send({ id: other.user.id, full_name: 'ByAdmin' })
    expect((await models.User.findByPk(other.user.id)).full_name).toBe('ByAdmin')
  })
})

describe('system configuration holds credentials and is admin-only', () => {
  beforeAll(async () => {
    await models.Config.update({ config: JSON.stringify({ auth: { user: 'smtp-user', pass: 'smtp-pass' } }) }, { where: { id: 1 } })
  })
  test('students only receive the display settings row', async () => {
    const res = await http.get('/api/system_config').set(MOBILE).set(student.auth)
    expect(res.status).toBe(200)
    expect(res.body.map((r) => r.type)).toEqual(['settings'])
    expect(JSON.stringify(res.body)).not.toContain('smtp-pass')
  })
  test('administrators receive every row', async () => {
    const res = await http.get('/api/system_config').set(MOBILE).set(admin.auth)
    expect(res.body.length).toBeGreaterThanOrEqual(5)
  })
  test('students cannot overwrite configuration', async () => {
    const res = await http.put('/api/system_config').set(MOBILE).set(student.auth).send({ id: 1, config: '{"hacked":true}' })
    expect(res.status).toBe(401)
    expect((await models.Config.findByPk(1)).config).not.toContain('hacked')
  })
  test('administrators can update configuration (object or string payload)', async () => {
    const res = await http.put('/api/system_config').set(MOBILE).set(admin.auth).send({ id: 4, config: { usdToBirr: 150 } })
    expect(res.status).toBe(200)
    expect(JSON.parse((await models.Config.findByPk(4)).config).usdToBirr).toBe(150)
  })
})

describe('publish/unpublish endpoints require edit permission', () => {
  test('a student cannot change a course or chapter state', async () => {
    const course = await models.Course.create({ title: 'C', main_price: 100, type: 'course', routeState: 'draft' })
    const res = await http.put('/api/courses/routeState').set(MOBILE).set(student.auth).send({ id: course.id, routeState: 'published' })
    expect(res.status).toBe(401)
    expect((await models.Course.findByPk(course.id)).routeState).toBe('draft')
    const chapterRes = await http.put('/api/chapters/routeState').set(MOBILE).set(student.auth).send({ id: 1, routeState: 'published' })
    expect(chapterRes.status).toBe(401)
  })
  test('an instructor can for a course assigned to them, not for others (Phase 3)', async () => {
    const course = await models.Course.create({ title: 'C2', main_price: 100, type: 'course', routeState: 'draft' })
    const refused = await http.put('/api/courses/routeState').set(MOBILE).set(instructor.auth).send({ id: course.id, routeState: 'published' })
    expect(refused.status).toBe(401)
    expect((await models.Course.findByPk(course.id)).routeState).toBe('draft')
    await models.CourseInstructor.create({ course_id: course.id, user_id: instructor.user.id })
    const res = await http.put('/api/courses/routeState').set(MOBILE).set(instructor.auth).send({ id: course.id, routeState: 'published' })
    expect(res.status).toBe(200)
    expect((await models.Course.findByPk(course.id)).routeState).toBe('published')
  })
})

describe('contact form', () => {
  test('anonymous visitors can post a message through /api/contacts_public', async () => {
    const res = await http.post('/api/contacts_public').set(ORIGIN).send({ _full_name: 'Visitor', _email: 'v@example.com', _message: 'Hello' })
    expect(res.status).toBe(200)
    expect(await models.Contact.count({ where: { email: 'v@example.com' } })).toBe(1)
  })
  test('invalid input is rejected', async () => {
    expect((await http.post('/api/contacts_public').set(ORIGIN).send({ _email: 'nope', _message: 'x' })).status).toBe(400)
    expect((await http.post('/api/contacts_public').set(ORIGIN).send({ _email: 'v@example.com' })).status).toBe(400)
  })
  test('anonymous visitors can no longer read, edit or delete messages through the public mount', async () => {
    const contact = await models.Contact.findOne()
    for (const [method, url, body] of [['get', '/api/contacts_public', undefined], ['put', '/api/contacts_public', { id: contact.id, _message: 'defaced' }], ['delete', '/api/contacts_public', { id: contact.id }], ['put', '/api/contacts_public/routeState', { id: contact.id, routeState: 'x' }]]) {
      const res = await http[method](url).set(ORIGIN).send(body)
      expect([401, 404]).toContain(res.status)
    }
    expect((await models.Contact.findByPk(contact.id)).message).toBe('Hello')
  })
})

describe('chat messages belong to their author', () => {
  test('another user cannot edit or delete them', async () => {
    const chat = await models.Chat.create({ message: 'private', from: student.user.id, to: other.user.id, type: 'text' })
    const edit = await http.put('/api/chats').set(MOBILE).set(other.auth).send({ id: chat.id, _message: 'tampered' })
    expect(edit.body.error).toBe(true)
    const del = await http.delete('/api/chats').set(MOBILE).set(other.auth).send({ id: chat.id })
    expect(del.body.error).toBe(true)
    expect((await models.Chat.findByPk(chat.id)).message).toBe('private')
  })
  test('the author can', async () => {
    const chat = await models.Chat.create({ message: 'mine', from: student.user.id, to: other.user.id, type: 'text' })
    await http.put('/api/chats').set(MOBILE).set(student.auth).send({ id: chat.id, _message: 'edited' })
    expect((await models.Chat.findByPk(chat.id)).message).toBe('edited')
  })
  test('the conversation endpoint only returns the caller’s own conversation', async () => {
    await models.Chat.create({ message: 'secret between a and b', from: student.user.id, to: other.user.id, type: 'text' })
    const third = await makeUser('third@example.com', 'viewer')
    const res = await http.get(`/api/chats/${other.user.id}`).set(MOBILE).set(third.auth)
    expect(res.status).toBe(200)
    expect(JSON.stringify(res.body)).not.toContain('secret between a and b')
  })
})

describe('permissions referenced by the routes exist in the seed data', () => {
  test('every permission name used in roles.js is seeded (otherwise even the Super Admin is locked out)', () => {
    const Roles = require('../roles')
    const { PERMISSIONS } = require('../db/seeds/permissions')
    const seeded = new Set(PERMISSIONS.map((p) => p.permission))
    const used = new Set(Object.values(Roles).flat().filter((p) => p !== 'Public Access'))
    // legacy alias that is always paired with "View Users" in roles.js
    used.delete('User Detail')
    const missing = [...used].filter((p) => !seeded.has(p))
    expect(missing).toEqual([])
  })
})

afterAll(() => { void PASSWORD })
