const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')

let http, viewer, instructor, admin, other, stranger, chapterOnly, course, draftCourse, otherCourse

const pay = (user, extra = {}) =>
  models.Payment.create({ amount: 500, currency: 'ETB', user_id: user.id, course_id: course.id, paid: true, reference_no: `ref-${user.id}-${Math.random()}`, ...extra })
const post = (user, body) => {
  const req = http.post('/api/userratings').set(MOBILE)
  return (user ? req.set(user.auth) : req).send(body)
}
const ratingsOf = (user, courseId = course.id) => models.UserRating.findAll({ where: { added_by: user.user.id, course_id: courseId } })

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  viewer = await makeUser('viewer@example.com', 'viewer')
  instructor = await makeUser('teacher@example.com', 'instructor')
  admin = await makeUser('admin@example.com', 'admin')
  other = await makeUser('other@example.com', 'viewer')
  stranger = await makeUser('stranger@example.com', 'viewer')
  chapterOnly = await makeUser('chapter@example.com', 'viewer')
  course = await models.Course.create({ title: 'Biology', main_price: 500, type: 'course', routeState: 'published' })
  otherCourse = await models.Course.create({ title: 'Chemistry', main_price: 500, type: 'course', routeState: 'published' })
  draftCourse = await models.Course.create({ title: 'Draft', main_price: 500, type: 'course', routeState: 'draft' })
  const chapter = await models.Chapter.create({ title: 'Ch1', price: 100, course_parent_id: course.id, routeState: 'published' })
  await pay(viewer.user)
  await pay(instructor.user)
  await pay(admin.user)
  await pay(other.user)
  await models.Payment.create({ amount: 100, currency: 'ETB', user_id: chapterOnly.user.id, chapter_id: chapter.id, paid: true, reference_no: 'chapter-ref' })
})

describe('authentication and identity', () => {
  test('an unauthenticated request is refused and stores nothing', async () => {
    const before = await models.UserRating.count()
    const res = await post(null, { _rating: 5, _course_id: course.id })
    expect(res.status).toBe(401)
    expect(await models.UserRating.count()).toBe(before)
  })

  test('a forged _user_id is ignored: the review belongs to the token owner', async () => {
    const res = await post(other, { _rating: 4, _comment: 'nice', _course_id: course.id, _user_id: viewer.user.id })
    expect(res.status).toBe(200)
    const [row] = await ratingsOf(other)
    expect(row.user_id).toBe(other.user.id)
    expect(row.added_by).toBe(other.user.id)
    expect(row.updated_by).toBe(other.user.id)
    expect(await ratingsOf(viewer)).toHaveLength(0)
  })

  test('a user cannot submit on behalf of another (even a purchaser) by sending that user_id', async () => {
    const res = await post(stranger, { _rating: 5, _course_id: course.id, _user_id: admin.user.id })
    expect(res.status).toBe(403) // the stranger did not buy the course, whatever id they claim
    expect(await ratingsOf(admin)).toHaveLength(0)
    expect(await ratingsOf(stranger)).toHaveLength(0)
  })
})

describe('purchase verification', () => {
  test('a non-purchaser is refused', async () => {
    const res = await post(stranger, { _rating: 5, _course_id: course.id })
    expect(res.status).toBe(403)
    expect(await ratingsOf(stranger)).toHaveLength(0)
  })

  test('an unpaid (pending) payment does not count', async () => {
    const pending = await makeUser('pending@example.com', 'viewer')
    await pay(pending.user, { paid: false })
    expect((await post(pending, { _rating: 5, _course_id: course.id })).status).toBe(403)
  })

  test('a purchase of a different course does not count', async () => {
    expect((await post(viewer, { _rating: 5, _course_id: otherCourse.id })).status).toBe(403)
  })

  test("another learner's payment does not count", async () => {
    const thief = await makeUser('thief@example.com', 'viewer')
    expect((await post(thief, { _rating: 5, _course_id: course.id, _user_id: viewer.user.id })).status).toBe(403)
  })

  test('a chapter-only purchaser cannot review the whole course', async () => {
    const res = await post(chapterOnly, { _rating: 5, _course_id: course.id })
    expect(res.status).toBe(403)
    expect(await ratingsOf(chapterOnly)).toHaveLength(0)
  })

  test.each([['Viewer', () => viewer], ['Instructor', () => instructor], ['Admin', () => admin]])('a %s purchaser can review', async (_n, who) => {
    const u = who()
    const res = await post(u, { _rating: 5, _comment: 'Great', _course_id: course.id })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Successfully Created' })
    const rows = await ratingsOf(u)
    expect(rows).toHaveLength(1)
    expect(rows[0].rating).toBe(5)
    expect(rows[0].comment).toBe('Great')
  })

  test('a purchaser whose account has no role permission can still review (role no longer gates it)', async () => {
    const noRole = await makeUser('norole@example.com', [])
    await pay(noRole.user)
    expect((await post(noRole, { _rating: 3, _course_id: course.id })).status).toBe(200)
  })

  test('an unpublished course is not open for reviews even with a payment', async () => {
    const buyer = await makeUser('draftbuyer@example.com', 'viewer')
    await pay(buyer.user, { course_id: draftCourse.id })
    expect((await post(buyer, { _rating: 5, _course_id: draftCourse.id })).status).toBe(403)
  })
})

describe('validation', () => {
  let buyer
  beforeAll(async () => { buyer = await makeUser('validbuyer@example.com', 'viewer'); await pay(buyer.user) })

  test.each([[0], [6], [-1], [3.5], ['5'], ['abc'], [null], [undefined], [true], [[5]], [{}]])('rating %p is rejected with 400', async (rating) => {
    const res = await post(buyer, { _rating: rating, _course_id: course.id })
    expect(res.status).toBe(400)
    expect(await ratingsOf(buyer)).toHaveLength(0)
  })

  test.each([[undefined], [null], [0], [-3], [1.5], ['abc'], ['1; DROP TABLE'], [[1]], [{}], [99999999999]])('course id %p is rejected with 400', async (id) => {
    expect((await post(buyer, { _rating: 5, _course_id: id })).status).toBe(400)
  })

  test('a course that does not exist is a 404', async () => {
    expect((await post(buyer, { _rating: 5, _course_id: 987654 })).status).toBe(404)
  })

  test.each([[123], [true], [['a']], [{ a: 1 }]])('comment %p (not text) is rejected with 400', async (comment) => {
    expect((await post(buyer, { _rating: 5, _comment: comment, _course_id: course.id })).status).toBe(400)
    expect(await ratingsOf(buyer)).toHaveLength(0)
  })

  test('a comment over 250 characters is rejected, 250 is accepted', async () => {
    expect((await post(buyer, { _rating: 5, _comment: 'x'.repeat(251), _course_id: course.id })).status).toBe(400)
    expect(await ratingsOf(buyer)).toHaveLength(0)
    expect((await post(buyer, { _rating: 5, _comment: 'x'.repeat(250), _course_id: course.id })).status).toBe(200)
  })

  test('a missing or empty comment is allowed and stored as null', async () => {
    for (const [i, body] of [{}, { _comment: '' }, { _comment: '   ' }, { _comment: null }].entries()) {
      const u = await makeUser(`nocomment${i}@example.com`, 'viewer')
      await pay(u.user)
      expect((await post(u, { _rating: 4, _course_id: course.id, ...body })).status).toBe(200)
      expect((await ratingsOf(u))[0].comment).toBeNull()
    }
  })

  test('a numeric-string course id from an older client is accepted', async () => {
    const u = await makeUser('stringid@example.com', 'viewer')
    await pay(u.user)
    expect((await post(u, { _rating: 5, _course_id: String(course.id) })).status).toBe(200)
  })

  test('a missing body is a 400, not a crash', async () => {
    const res = await http.post('/api/userratings').set(MOBILE).set(viewer.auth)
    expect(res.status).toBe(400)
  })
})

describe('duplicates', () => {
  test('a second review of the same course by the same user is a 409 and changes nothing', async () => {
    const u = await makeUser('dup@example.com', 'viewer')
    await pay(u.user)
    expect((await post(u, { _rating: 5, _comment: 'first', _course_id: course.id })).status).toBe(200)
    const again = await post(u, { _rating: 1, _comment: 'second', _course_id: course.id })
    expect(again.status).toBe(409)
    const rows = await ratingsOf(u)
    expect(rows).toHaveLength(1)
    expect(rows[0].comment).toBe('first')
  })

  test('a review of a different course is a separate review', async () => {
    const u = await makeUser('twocourses@example.com', 'viewer')
    await pay(u.user)
    await pay(u.user, { course_id: otherCourse.id })
    expect((await post(u, { _rating: 5, _course_id: course.id })).status).toBe(200)
    expect((await post(u, { _rating: 4, _course_id: otherCourse.id })).status).toBe(200)
  })

  test('a legacy rating whose user_id was forged to this user does not block their real review', async () => {
    const u = await makeUser('legacy@example.com', 'viewer')
    await pay(u.user)
    await models.UserRating.create({ rating: 1, user_id: u.user.id, course_id: course.id, added_by: stranger.user.id, updated_by: stranger.user.id })
    expect((await post(u, { _rating: 5, _course_id: course.id })).status).toBe(200)
  })

  test('simultaneous duplicate submissions create exactly one review', async () => {
    const u = await makeUser('race@example.com', 'viewer')
    await pay(u.user)
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => post(u, { _rating: 5, _comment: `r${i}`, _course_id: course.id })))
    const statuses = results.map((r) => r.status)
    expect(statuses.filter((s) => s === 200)).toHaveLength(1)
    expect(statuses.filter((s) => s === 409)).toHaveLength(9)
    expect(await ratingsOf(u)).toHaveLength(1)
  })

  test('simultaneous submissions from different users do not block each other', async () => {
    const users = await Promise.all([1, 2, 3].map((i) => makeUser(`par${i}@example.com`, 'viewer')))
    for (const u of users) await pay(u.user)
    const results = await Promise.all(users.map((u) => post(u, { _rating: 5, _course_id: course.id })))
    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
  })
})

describe('database failures', () => {
  test('a failing insert returns 500, stores nothing and does not lock the user out', async () => {
    const u = await makeUser('dbfail@example.com', 'viewer')
    await pay(u.user)
    const spy = jest.spyOn(models.UserRating, 'create').mockRejectedValueOnce(new Error('connection lost'))
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post(u, { _rating: 5, _course_id: course.id })
    spy.mockRestore(); errSpy.mockRestore()
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: true, message: 'Something went wrong' }) // internals are not leaked
    expect(await ratingsOf(u)).toHaveLength(0)
    // the failure did not poison the per-user queue or leave a transaction open
    expect((await post(u, { _rating: 5, _course_id: course.id })).status).toBe(200)
  })

  test('a unique-constraint style error from the database is a 500, not a duplicate row', async () => {
    const u = await makeUser('constraint@example.com', 'viewer')
    await pay(u.user)
    const err = Object.assign(new Error('Duplicate entry'), { name: 'SequelizeUniqueConstraintError' })
    const spy = jest.spyOn(models.UserRating, 'create').mockRejectedValueOnce(err)
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post(u, { _rating: 5, _course_id: course.id })
    spy.mockRestore(); errSpy.mockRestore()
    expect(res.status).toBe(500)
    expect(await ratingsOf(u)).toHaveLength(0)
  })

  test('a failing payment lookup fails closed (500, nothing stored)', async () => {
    const u = await makeUser('payfail@example.com', 'viewer')
    await pay(u.user)
    const spy = jest.spyOn(models.Payment, 'findOne').mockRejectedValueOnce(new Error('db down'))
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await post(u, { _rating: 5, _course_id: course.id })
    spy.mockRestore(); errSpy.mockRestore()
    expect(res.status).toBe(500)
    expect(await ratingsOf(u)).toHaveLength(0)
  })
})

describe('free courses (no purchase exists to verify)', () => {
  let free, unpriced
  beforeAll(async () => {
    free = await models.Course.create({ title: 'Free intro', main_price: 0, type: 'course', routeState: 'published' })
    unpriced = await models.Course.create({ title: 'No price set', main_price: null, type: 'course', routeState: 'published' })
  })

  test.each([['Viewer', 'viewer'], ['Instructor', 'instructor'], ['Admin', 'admin'], ['no-role', []]])('a signed-in %s can review a free course without any payment', async (_n, kind) => {
    const u = await makeUser(`free-${_n}@example.com`, kind)
    const res = await post(u, { _rating: 5, _comment: 'Nice', _course_id: free.id, _user_id: stranger.user.id })
    expect(res.status).toBe(200)
    const [row] = await ratingsOf(u, free.id)
    expect(row.user_id).toBe(u.user.id) // identity still comes from the token
  })

  test('a course with no price set is treated as free', async () => {
    const u = await makeUser('unpriced@example.com', 'viewer')
    expect((await post(u, { _rating: 4, _course_id: unpriced.id })).status).toBe(200)
  })

  test('an unauthenticated request is still refused', async () => {
    expect((await post(null, { _rating: 5, _course_id: free.id })).status).toBe(401)
  })

  test('one review per user and course still holds, including under concurrency', async () => {
    const u = await makeUser('free-race@example.com', 'viewer')
    const results = await Promise.all(Array.from({ length: 8 }, () => post(u, { _rating: 5, _course_id: free.id })))
    expect(results.filter((r) => r.status === 200)).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(7)
    expect(await ratingsOf(u, free.id)).toHaveLength(1)
  })

  test('validation and unpublished checks still apply', async () => {
    const u = await makeUser('free-valid@example.com', 'viewer')
    expect((await post(u, { _rating: 6, _course_id: free.id })).status).toBe(400)
    const draftFree = await models.Course.create({ title: 'Draft free', main_price: 0, type: 'course', routeState: 'draft' })
    expect((await post(u, { _rating: 5, _course_id: draftFree.id })).status).toBe(403)
  })

  test('a paid course still requires a purchase', async () => {
    const u = await makeUser('free-vs-paid@example.com', 'viewer')
    expect((await post(u, { _rating: 5, _course_id: course.id })).status).toBe(403)
  })
})
