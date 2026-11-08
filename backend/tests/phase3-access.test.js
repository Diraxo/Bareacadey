jest.mock('../middlewares/emailController', () => ({ sendEmailLink: jest.fn() }))
const jwt = require('jsonwebtoken')
const { sendEmailLink } = require('../middlewares/emailController')
const { resetDb, makeUser, api, models, MOBILE, PASSWORD } = require('./helpers')

let http, admin, student, other, instructor

const setPolicy = (device_policy) =>
  models.Config.update({ config: JSON.stringify({ app_version: 1, device_policy }) }, { where: { id: 5 } })
const check = (u, device) => http.get(`/check/?device=${encodeURIComponent(device)}&user_id=${u.user.id}`).set(u.auth)
const DAY = 24 * 60 * 60 * 1000

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  admin = await makeUser('admin@example.com', 'admin')
  student = await makeUser('student@example.com', 'viewer')
  other = await makeUser('other@example.com', 'viewer')
  instructor = await makeUser('teacher@example.com', 'instructor')
  // new environments are seeded with the restriction off; these tests cover the optional "single" policy, so turn it on here
  await setPolicy({ mode: 'single', blockOnLogout: false })
})
beforeEach(() => sendEmailLink.mockReset())

describe('device replacement and recovery', () => {
  test('the denied answer says when self-service is possible and never reports a permanent lock', async () => {
    expect((await check(student, 'Pixel-1')).body.status).toBe('success')
    const denied = (await check(student, 'iPhone-2')).body
    expect(denied).toMatchObject({ status: 'denied', code: 'device_not_registered', can_self_replace: false })
    expect(new Date(denied.self_replace_available_at).getTime()).toBeGreaterThan(Date.now() + 6 * DAY)
  })

  test('inside the cooldown the email route is refused (support can still reset)', async () => {
    const res = await http.post('/device/replace/request').set(MOBILE).set(student.auth).send({ device: 'iPhone-2' })
    expect(res.status).toBe(429)
    expect(res.body.code).toBe('cooldown')
    expect(sendEmailLink).not.toHaveBeenCalled()
  })

  test('after the cooldown: request -> emailed link -> the new device replaces the old one', async () => {
    await models.Device.update({ registered_at: new Date(Date.now() - 8 * DAY) }, { where: { user_id: student.user.id } })
    expect((await check(student, 'iPhone-2')).body.can_self_replace).toBe(true)
    sendEmailLink.mockResolvedValue(true)
    const res = await http.post('/device/replace/request').set(MOBILE).set(student.auth).send({ device: 'iPhone-2' })
    expect(res.status).toBe(200)
    expect(sendEmailLink).toHaveBeenCalledTimes(1)
    const mail = sendEmailLink.mock.calls[0][0]
    expect(mail.send_to).toBe('student@example.com') // the account's own mailbox, not a client-supplied address
    // nothing changes until the link is opened
    expect((await check(student, 'iPhone-2')).body.status).toBe('denied')

    const redeem = await http.post('/api/auth/verify_new_device').set(MOBILE).send({ token: mail.token })
    expect(redeem.status).toBe(200)
    expect((await check(student, 'iPhone-2')).body.status).toBe('success')
    expect((await check(student, 'Pixel-1')).body.status).toBe('denied')
    expect(await models.Device.count({ where: { user_id: student.user.id } })).toBe(1)
    student.lastToken = mail.token
  })

  test('the same link cannot be replayed to switch back', async () => {
    const res = await http.post('/api/auth/verify_new_device').set(MOBILE).send({ token: student.lastToken })
    expect(res.status).toBe(400)
    expect((await check(student, 'Pixel-1')).body.status).toBe('denied')
  })

  test('only the dedicated link works: an access token, a forged token or garbage is refused', async () => {
    const forged = jwt.sign({ typ: 'device_replace', id: other.user.id, device: 'Evil', v: 0 }, 'not-the-secret', { expiresIn: '1h' })
    const access = jwt.sign({ id: other.user.id, device: 'Evil' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h', algorithm: 'HS256' })
    for (const token of [forged, access, 'garbage', undefined]) {
      const res = await http.post('/api/auth/verify_new_device').set(MOBILE).send({ token })
      expect(res.status).toBe(400)
    }
    expect(await models.Device.count({ where: { user_id: other.user.id, device: 'Evil' } })).toBe(0)
  })

  test('the request needs a login and the email must actually go out', async () => {
    expect((await http.post('/device/replace/request').set(MOBILE).send({ device: 'x' })).status).toBe(401)
    await models.Device.update({ registered_at: new Date(Date.now() - 30 * DAY) }, { where: { user_id: student.user.id } })
    sendEmailLink.mockResolvedValue(false)
    const res = await http.post('/device/replace/request').set(MOBILE).set(student.auth).send({ device: 'Third' })
    expect(res.status).toBe(502)
    expect((await check(student, 'Third')).body.status).toBe('denied')
  })

  test('support reset: only administrators with Edit Users, and the next device is registered', async () => {
    expect((await http.post(`/api/devices/user/${student.user.id}/reset`).set(MOBILE).set(student.auth)).status).toBe(401)
    expect((await http.post(`/api/devices/user/${student.user.id}/reset`).set(MOBILE).set(instructor.auth)).status).toBe(401)
    expect((await http.get(`/api/devices/user/${student.user.id}`).set(MOBILE).set(student.auth)).status).toBe(401)
    const list = await http.get(`/api/devices/user/${student.user.id}`).set(MOBILE).set(admin.auth)
    expect(list.body.map((d) => d.device)).toEqual(['iPhone-2'])
    const res = await http.post(`/api/devices/user/${student.user.id}/reset`).set(MOBILE).set(admin.auth)
    expect(res.status).toBe(200)
    expect((await check(student, 'Brand-New')).body.status).toBe('success')
    expect(await models.Activity.count({ where: { added_by: admin.user.id } })).toBeGreaterThan(0)
  })

  test('a user is never locked out when the rule is switched off', async () => {
    await setPolicy({ mode: 'off' })
    expect((await check(student, 'Whatever')).body.status).toBe('success')
    await setPolicy({ mode: 'single', blockOnLogout: false })
  })

  test('devices recorded before the timestamp column existed can still be replaced (cooldown treats them as old)', async () => {
    const legacy = await makeUser('legacy@example.com', 'viewer')
    await models.Device.create({ user_id: legacy.user.id, device: 'OldPhone', registered_at: null })
    expect((await check(legacy, 'NewPhone')).body.can_self_replace).toBe(true)
  })
})

describe('/block/ stays inert', () => {
  test('by default a logout does not block anybody, whoever calls it and whatever id it carries', async () => {
    const victim = await makeUser('victim@example.com', 'viewer')
    for (const caller of [student, other, instructor, admin]) {
      const res = await http.post('/block/').set(MOBILE).set(caller.auth).send({ user_id: victim.user.id })
      expect(res.body.status).toBe('ignored')
    }
    expect((await models.User.findByPk(victim.user.id)).blocked).toBe(false)
    expect((await models.User.findByPk(student.user.id)).blocked).toBe(false)
  })
})

describe('instructor registration cannot escalate privileges', () => {
  let applicant, course1, course2

  beforeAll(async () => {
    course1 = await models.Course.create({ title: 'Algebra', main_price: 100, type: 'course', routeState: 'draft', added_by: admin.user.id, updated_by: admin.user.id })
    course2 = await models.Course.create({ title: 'Geometry', main_price: 100, type: 'course', routeState: 'draft', added_by: admin.user.id, updated_by: admin.user.id })
  })

  const login = async (email, password) => {
    const res = await http.post('/api/auth/login').set(MOBILE).send({ userOrEmail: email, password })
    return { res, auth: { Authorization: `Bearer ${res.body.accessToken}` }, permissions: res.body.user?.permissions }
  }

  test('public sign-up as Instructor (role 12) creates a student plus a pending request', async () => {
    const res = await http.post('/api/auth/create_account').set(MOBILE).send({
      first_name: 'Ada', last_name: 'Teacher', username: 'ada', email: 'ada@example.com', phone: '+251911000111', password: PASSWORD, role: 12, device: 'AdaPhone',
    })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Successfully Registered') // the sign-up screens match this text literally
    expect(res.body.instructor_request).toBe('pending')
    expect(res.body.note).toMatch(/waiting for administrator approval/)
    applicant = await models.User.findOne({ where: { email: 'ada@example.com' } })
    expect(applicant.role_id).toBe(5)
    const perms = (await models.UserPermission.findAll({ where: { user_id: applicant.id } })).map((p) => p.permission_id).sort((a, b) => a - b)
    expect(perms).toEqual([12, 15])
    expect(await models.InstructorRequest.count({ where: { user_id: applicant.id, status: 'pending' } })).toBe(1)
  })

  test('a plain student sign-up creates no request', async () => {
    await http.post('/api/auth/create_account').set(MOBILE).send({ first_name: 'Sam', last_name: 'S', username: 'sam', email: 'sam@example.com', phone: '+251911000222', password: PASSWORD, role: 5 })
    const sam = await models.User.findOne({ where: { email: 'sam@example.com' } })
    expect(await models.InstructorRequest.count({ where: { user_id: sam.id } })).toBe(0)
  })

  test('the pending applicant has no instructor permission and cannot manage any course or chapter', async () => {
    const { res, auth, permissions } = await login('ada@example.com', PASSWORD)
    expect(res.status).toBe(200)
    expect(permissions).not.toContain('Instructor')
    expect((await http.post('/api/courses').set(MOBILE).set(auth).send({ _title: 'Mine', _main_price: 1, _type: 'course' })).status).toBe(401)
    expect((await http.put('/api/courses').set(MOBILE).set(auth).send({ id: course1.id, _title: 'Hacked' })).status).toBe(401)
    expect((await http.delete('/api/courses').set(MOBILE).set(auth).send({ id: course1.id })).status).toBe(401)
    expect((await http.post('/api/chapters').set(MOBILE).set(auth).send({ _title: 'x', _course_parent_id: course1.id })).status).toBe(401)
    expect((await http.post('/api/quizzes').set(MOBILE).set(auth).send({ title: 'q' })).status).toBe(401)
  })

  test('only administrators can list, approve or reject; students and instructors cannot', async () => {
    const request = await models.InstructorRequest.findOne({ where: { user_id: applicant.id } })
    for (const who of [student, instructor]) {
      expect((await http.get('/api/instructors/requests').set(MOBILE).set(who.auth)).status).toBe(401)
      expect((await http.post(`/api/instructors/requests/${request.id}/approve`).set(MOBILE).set(who.auth).send({ course_ids: [course1.id] })).status).toBe(401)
      expect((await http.post(`/api/instructors/requests/${request.id}/reject`).set(MOBILE).set(who.auth)).status).toBe(401)
      expect((await http.put(`/api/instructors/${instructor.user.id}/courses`).set(MOBILE).set(who.auth).send({ course_ids: [course2.id] })).status).toBe(401)
      expect((await http.post(`/api/instructors/${instructor.user.id}/revoke`).set(MOBILE).set(who.auth)).status).toBe(401)
    }
    expect((await models.InstructorRequest.findByPk(request.id)).status).toBe('pending')
  })

  test('a signed-in student may file a request; a second pending one is refused', async () => {
    const first = await http.post('/api/instructors/requests').set(MOBILE).set(student.auth).send({ message: 'I teach maths' })
    expect(first.status).toBe(201)
    expect((await http.post('/api/instructors/requests').set(MOBILE).set(student.auth).send({})).status).toBe(409)
    expect((await http.post('/api/instructors/requests').set(MOBILE).send({})).status).toBe(401)
  })

  test('approval needs explicit, existing course assignments', async () => {
    const request = await models.InstructorRequest.findOne({ where: { user_id: applicant.id } })
    const url = `/api/instructors/requests/${request.id}/approve`
    for (const body of [{}, { course_ids: [] }, { course_ids: [99999] }, { course_ids: ['abc'] }, { course_ids: [course1.id, 99999] }]) {
      expect((await http.post(url).set(MOBILE).set(admin.auth).send(body)).status).toBe(400)
    }
    expect((await models.User.findByPk(applicant.id)).role_id).toBe(5)
  })

  test('an administrator cannot approve their own request', async () => {
    const mine = await models.InstructorRequest.create({ user_id: admin.user.id, status: 'pending' })
    expect((await http.post(`/api/instructors/requests/${mine.id}/approve`).set(MOBILE).set(admin.auth).send({ course_ids: [course1.id] })).status).toBe(409)
  })

  test('approval grants the role, the permission and only the assigned course', async () => {
    const request = await models.InstructorRequest.findOne({ where: { user_id: applicant.id } })
    const res = await http.post(`/api/instructors/requests/${request.id}/approve`).set(MOBILE).set(admin.auth).send({ course_ids: [course1.id], note: 'verified by phone' })
    expect(res.status).toBe(200)
    expect((await models.User.findByPk(applicant.id)).role_id).toBe(12)
    expect((await models.InstructorRequest.findByPk(request.id)).status).toBe('approved')
    expect((await http.post(`/api/instructors/requests/${request.id}/approve`).set(MOBILE).set(admin.auth).send({ course_ids: [course1.id] })).status).toBe(409)

    const { permissions, auth } = await login('ada@example.com', PASSWORD)
    expect(permissions).toContain('Instructor')
    expect(permissions).not.toContain('Manage All Courses')
    expect(permissions).not.toContain('Edit Users')
    applicant.auth = auth

    // assigned course: allowed
    expect((await http.put('/api/courses').set(MOBILE).set(auth).send({ id: course1.id, _title: 'Algebra II' })).body.message).toBe('Successfully Updated')
    expect((await models.Course.findByPk(course1.id)).title).toBe('Algebra II')
    expect((await http.put('/api/courses/routeState').set(MOBILE).set(auth).send({ id: course1.id, routeState: 'published' })).status).toBe(200)
    const chapter = await http.post('/api/chapters').set(MOBILE).set(auth).send({ _title: 'Intro', _course_parent_id: course1.id, _price: 0 })
    expect(chapter.body.message).toBe('Successfully Created')

    // not assigned: refused everywhere
    expect((await http.put('/api/courses').set(MOBILE).set(auth).send({ id: course2.id, _title: 'Hacked' })).status).toBe(401)
    expect((await http.delete('/api/courses').set(MOBILE).set(auth).send({ id: course2.id })).status).toBe(401)
    expect((await http.put('/api/courses/routeState').set(MOBILE).set(auth).send({ id: course2.id, routeState: 'published' })).status).toBe(401)
    expect((await http.post('/api/chapters').set(MOBILE).set(auth).send({ _title: 'x', _course_parent_id: course2.id })).status).toBe(401)
    expect((await models.Course.findByPk(course2.id)).title).toBe('Geometry')
  })

  test('admin lists show every course to an administrator and only own/assigned ones to an instructor, whoever edited them last', async () => {
    const ids = (res) => res.body.map((c) => c.id).sort()
    const asAdmin = await http.get('/api/courses').set(MOBILE).set(admin.auth)
    expect(asAdmin.status).toBe(200)
    expect(ids(asAdmin)).toEqual(expect.arrayContaining([course1.id, course2.id]))

    const asInstructor = await http.get('/api/courses').set(MOBILE).set(applicant.auth)
    expect(ids(asInstructor)).toContain(course1.id)
    expect(ids(asInstructor)).not.toContain(course2.id)

    // a different person edits/publishes it: it must still be listed for both
    await models.Course.update({ updated_by: admin.user.id }, { where: { id: course1.id } })
    expect(ids(await http.get('/api/courses').set(MOBILE).set(applicant.auth))).toContain(course1.id)
    expect(ids(await http.get('/api/courses').set(MOBILE).set(admin.auth))).toContain(course1.id)
    expect((await http.get(`/api/courses/${course1.id}`).set(MOBILE).set(applicant.auth)).body.id).toBe(course1.id)
    expect((await http.get(`/api/courses/${course2.id}`).set(MOBILE).set(applicant.auth)).body.error).toBe(true)
  })

  test('a second Super Admin holds every permission and manages courses created by the first, with no ticking needed', async () => {
    const second = await makeUser('second-admin@example.com', 'viewer')
    await models.User.update({ role_id: 1 }, { where: { id: second.user.id } })
    const { permissions, auth, res } = await login('second-admin@example.com', PASSWORD)
    expect(res.status).toBe(200)
    expect(permissions).toEqual(expect.arrayContaining(['Manage All Courses', 'Instructor']))
    const list = await http.get('/api/courses').set(MOBILE).set(auth)
    expect(list.body.map((c) => c.id)).toEqual(expect.arrayContaining([course1.id, course2.id]))
    expect((await http.put('/api/courses').set(MOBILE).set(auth).send({ id: course2.id, _title: 'Geometry II' })).body.message).toBe('Successfully Updated')
    // a refreshed token keeps the same permissions
    const refreshed = await http.post('/api/user/token/reqtoken').set(MOBILE).set('Cookie', res.headers['set-cookie'] || []).send({})
    if (refreshed.status === 200) expect(refreshed.body.user.permissions).toEqual(expect.arrayContaining(['Manage All Courses']))
  })

  test('chapters follow their course: edit/delete/publish/move only inside assigned courses', async () => {
    const mine = await models.Chapter.findOne({ where: { course_parent_id: course1.id } })
    const foreign = await models.Chapter.create({ title: 'Theirs', price: 0, course_parent_id: course2.id, added_by: admin.user.id, updated_by: admin.user.id })
    const auth = applicant.auth
    expect((await http.put('/api/chapters').set(MOBILE).set(auth).send({ id: foreign.id, _title: 'Hacked' })).status).toBe(401)
    expect((await http.delete('/api/chapters').set(MOBILE).set(auth).send({ id: foreign.id })).status).toBe(401)
    expect((await http.put('/api/chapters/routeState').set(MOBILE).set(auth).send({ id: foreign.id, routeState: 'published' })).status).toBe(401)
    // cannot move own chapter into a foreign course
    expect((await http.put('/api/chapters').set(MOBILE).set(auth).send({ id: mine.id, _course_parent_id: course2.id })).status).toBe(401)
    expect((await models.Chapter.findByPk(mine.id)).course_parent_id).toBe(course1.id)
    expect((await http.put('/api/chapters').set(MOBILE).set(auth).send({ id: mine.id, _title: 'Intro 2' })).body.message).toBe('Successfully Updated')
    expect((await models.Chapter.findByPk(foreign.id)).title).toBe('Theirs')
  })

  test('a course an instructor creates is theirs to manage, and only theirs', async () => {
    const res = await http.post('/api/courses').set(MOBILE).set(applicant.auth).send({ _title: 'My Own', _main_price: 50, _type: 'course' })
    expect(res.body.message).toBe('Successfully Created')
    const created = await models.Course.findOne({ where: { title: 'My Own' } })
    expect(await models.CourseInstructor.count({ where: { course_id: created.id, user_id: applicant.id } })).toBe(1)
    expect((await http.put('/api/courses').set(MOBILE).set(applicant.auth).send({ id: created.id, _title: 'My Own 2' })).body.message).toBe('Successfully Updated')
  })

  test('an administrator can still manage every course, including ones others created', async () => {
    const mineByApplicant = await models.Course.findOne({ where: { title: 'My Own 2' } })
    expect((await http.put('/api/courses').set(MOBILE).set(admin.auth).send({ id: mineByApplicant.id, _title: 'Edited by admin' })).body.message).toBe('Successfully Updated')
    expect((await http.put('/api/courses').set(MOBILE).set(admin.auth).send({ id: course2.id, _title: 'Geometry II' })).body.message).toBe('Successfully Updated')
  })

  test('assignments can be changed and take effect immediately, without a new login', async () => {
    const res = await http.put(`/api/instructors/${applicant.id}/courses`).set(MOBILE).set(admin.auth).send({ course_ids: [course2.id] })
    expect(res.status).toBe(200)
    expect((await http.put('/api/courses').set(MOBILE).set(applicant.auth).send({ id: course2.id, _title: 'Geometry III' })).body.message).toBe('Successfully Updated')
    expect((await http.put('/api/courses').set(MOBILE).set(applicant.auth).send({ id: course1.id, _title: 'Nope' })).status).toBe(401)
    expect((await http.put(`/api/instructors/${applicant.id}/courses`).set(MOBILE).set(admin.auth).send({ course_ids: [] })).status).toBe(400)
    expect((await http.put(`/api/instructors/${student.user.id}/courses`).set(MOBILE).set(admin.auth).send({ course_ids: [course1.id] })).status).toBe(409)
  })

  test('self-service paths cannot add roles or permissions', async () => {
    const before = await models.User.findByPk(other.user.id)
    const res = await http.put('/api/users/profile/update').set(MOBILE).set(other.auth)
      .send({ id: other.user.id, role: 12, role_id: 12, permissions: '14', full_name: 'Other' })
    expect(res.status).toBeLessThan(500)
    expect((await models.User.findByPk(other.user.id)).role_id).toBe(before.role_id)
    expect(await models.UserPermission.count({ where: { user_id: other.user.id, permission_id: 14 } })).toBe(0)
    expect((await http.put('/api/users').set(MOBILE).set(other.auth).send({ id: other.user.id, role: 12, permissions: '14' })).status).toBe(401)
    expect((await http.post('/api/users').set(MOBILE).set(other.auth).send({ full_name: 'x', email: 'x@example.com', password: PASSWORD, role: 1 })).status).toBe(401)
  })

  test('revoking removes access and assignments at once', async () => {
    expect((await http.post(`/api/instructors/${applicant.id}/revoke`).set(MOBILE).set(admin.auth)).status).toBe(200)
    expect((await models.User.findByPk(applicant.id)).role_id).toBe(5)
    expect(await models.UserPermission.count({ where: { user_id: applicant.id, permission_id: 14 } })).toBe(0)
    expect(await models.CourseInstructor.count({ where: { user_id: applicant.id } })).toBe(0)
    // the old token still carries the permission for a few minutes, but the database no longer authorises any course
    expect((await http.put('/api/courses').set(MOBILE).set(applicant.auth).send({ id: course2.id, _title: 'Late' })).status).toBe(401)
    const { permissions } = await login('ada@example.com', PASSWORD)
    expect(permissions).not.toContain('Instructor')
    expect((await http.post(`/api/instructors/${admin.user.id}/revoke`).set(MOBILE).set(admin.auth)).status).toBe(409)
  })
})
