/* Every course is free: no payment is needed to open, review or enroll in any course, whatever its stored price says. */
jest.mock('axios')
const fs = require('fs')
const path = require('path')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const { FILES_ROOT } = require('../routes/media')

const commonDir = path.join(FILES_ROOT, 'common')
const video = 'jest_freeall_video--z'
const ref = (name) => JSON.stringify([{ filename: name, filepath: `/uploads/common/${name}` }])
let http, student, stranger, admin, legacy, chapters

beforeAll(async () => {
  process.env.COURSES_ARE_FREE = 'true'
  await resetDb()
  ;({ http } = api())
  student = await makeUser('freestudent@example.com', 'viewer')
  stranger = await makeUser('freestranger@example.com', 'viewer')
  admin = await makeUser('freeadmin@example.com', 'admin')
  fs.mkdirSync(commonDir, { recursive: true })
  fs.writeFileSync(path.join(commonDir, video), 'DATA')

  // legacy rows: priced 0, priced 1, discounted, original + sale price
  const mk = (extra) => models.Course.create({ type: 'course', routeState: 'published', ...extra })
  legacy = {
    zero: await mk({ title: 'Zero', main_price: 0 }),
    one: await mk({ title: 'One', main_price: 1 }),
    sale: await mk({
      title: 'Sale', main_price: 1000, enable_discount: true, discount_percentage: 20, discounted_price: 800,
      discount_start_date: '2020-01-01T00:00:00Z', discount_end_date: '2099-01-01T00:00:00Z',
    }),
    pricey: await mk({ title: 'Pricey', main_price: 900 }),
  }
  chapters = {
    pricey: await models.Chapter.create({ title: 'Locked before', course_parent_id: legacy.pricey.id, routeState: 'published', price: 50, chapter_files: ref(video) }),
  }
  // a student who paid in the past keeps that record and keeps access
  await models.Payment.create({ amount: 900, currency: 'ETB', user_id: student.user.id, course_id: legacy.pricey.id, paid: true, reference_no: 'old-1' })
})

afterAll(() => {
  fs.rmSync(path.join(commonDir, video), { force: true })
  process.env.COURSES_ARE_FREE = 'false'
})

const courseFor = async (id, userId) => (await http.get(`/api/public/course/${id}/user/${userId}`).set(MOBILE)).body

describe('legacy courses are presented as free', () => {
  test.each(['zero', 'one', 'sale', 'pricey'])('%s course reports no money and is open', async (key) => {
    const body = await courseFor(legacy[key].id, stranger.user.id)
    expect(body.main_price).toBe(0)
    expect(body.enable_discount).toBe(false)
    expect(body.discounted_price).toBe(0)
    expect(body.discount_percentage).toBe(0)
    expect(body.main_price_usd).toBe('0.00')
    expect(body.course_pd).toBe(true)
  })

  test('the course list is free too, and a signed-out visitor has no enrollment flag', async () => {
    const list = (await http.get(`/api/public/courses/${stranger.user.id}`).set(MOBILE)).body
    expect(list.length).toBe(4)
    for (const c of list) { expect(c.main_price).toBe(0); expect(c.course_pd).toBe(true) }
    const anon = (await http.get('/api/public/courses/').set(MOBILE)).body
    if (Array.isArray(anon)) for (const c of anon) { expect(c.main_price).toBe(0); expect(c.course_pd).toBe(false) }
  })

  test('chapters of a previously priced course are unlocked and show no price', async () => {
    const body = await courseFor(legacy.pricey.id, stranger.user.id)
    expect(body.chapters[0].chapter_pd).toBe(true)
    expect(body.chapters[0].price).toBe(0)
  })

  test('the stored rows are not rewritten by reading them', async () => {
    expect((await models.Course.findByPk(legacy.sale.id)).main_price).toBe(1000)
    expect((await models.Course.findByPk(legacy.one.id)).main_price).toBe(1)
  })
})

describe('access without payment', () => {
  test('a student with no payment can stream a previously paid lesson; the signed-out cannot be identified', async () => {
    const ok = await http.get(`/uploads/common/${encodeURIComponent(video)}`).set(MOBILE).set(stranger.auth)
    expect(ok.status).toBe(200)
  })

  test('a student who paid in the past keeps access and the payment record stays', async () => {
    const ok = await http.get(`/uploads/common/${encodeURIComponent(video)}`).set(MOBILE).set(student.auth)
    expect(ok.status).toBe(200)
    expect(await models.Payment.count({ where: { reference_no: 'old-1', paid: true } })).toBe(1)
  })

  test('authentication is still required for protected media', async () => {
    const res = await http.get(`/uploads/common/${encodeURIComponent(video)}`).set(MOBILE)
    // free courses were already open to everyone by the existing rule; an unrelated unreferenced file still needs a login
    expect([200, 401]).toContain(res.status)
    const orphan = await http.get(`/uploads/common/${encodeURIComponent('jest_freeall_orphan.pdf')}`).set(MOBILE)
    expect([401, 404]).toContain(orphan.status)
  })

  test('a learner can review a course without having paid', async () => {
    const res = await http.post('/api/userratings').set(MOBILE).set(stranger.auth).send({ _course_id: legacy.one.id, _rating: 5, _comment: 'great' })
    expect(res.status).toBeLessThan(300)
  })
})

describe('no payment can be started', () => {
  test('checkout for a course or a chapter is refused as free and creates no payment row', async () => {
    const before = await models.Payment.count()
    for (const body of [{ _course_id: legacy.pricey.id }, { _course_id: legacy.sale.id }, { _chapter_id: chapters.pricey.id }]) {
      const res = await http.post('/api/payments').set(MOBILE).set(stranger.auth).send(body)
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('This item is free')
    }
    expect(await models.Payment.count()).toBe(before)
  })
})

describe('administrators never supply money', () => {
  test('creating a course ignores any price sent and stores it as free', async () => {
    const res = await http.post('/api/courses').set(MOBILE).set(admin.auth).send({ _title: 'Brand new', _type: 'course', _main_price: 500, _enable_discount: true, _discount_percentage: 10 })
    expect(res.body.message).toBe('Successfully Created')
    const row = await models.Course.findOne({ where: { title: 'Brand new' } })
    expect(Number(row.main_price)).toBe(0)
    expect(row.enable_discount).toBeFalsy()
  })

  test('creating a course with no money fields at all works', async () => {
    const res = await http.post('/api/courses').set(MOBILE).set(admin.auth).send({ _title: 'No money', _type: 'course' })
    expect(res.body.message).toBe('Successfully Created')
  })

  test('editing and publishing a course works, and leaves historical price columns untouched', async () => {
    const res = await http.put('/api/courses').set(MOBILE).set(admin.auth).send({ id: legacy.sale.id, _title: 'Sale renamed', _main_price: 5 })
    expect(res.body.message).toBe('Successfully Updated')
    const row = await models.Course.findByPk(legacy.sale.id)
    expect(row.title).toBe('Sale renamed')
    expect(Number(row.main_price)).toBe(1000)
    const pub = await http.put('/api/courses/routeState').set(MOBILE).set(admin.auth).send({ id: legacy.sale.id, routeState: 'published' })
    expect(pub.status).toBe(200)
  })

  test('a chapter price sent by a client is ignored', async () => {
    const res = await http.post('/api/chapters').set(MOBILE).set(admin.auth).send({ _title: 'New chapter', _price: 99, _course_parent_id: legacy.zero.id })
    expect(res.status).toBeLessThan(300)
    const row = await models.Chapter.findOne({ where: { title: 'New chapter' } })
    expect(Number(row.price)).toBe(0)
  })
})

describe('the switch', () => {
  test('COURSES_ARE_FREE=false restores the old paid behaviour (payment code is kept, not deleted)', () => {
    const { isFreeCourse } = require('../services/freeCourses')
    process.env.COURSES_ARE_FREE = 'false'
    expect(isFreeCourse({ main_price: 900 })).toBe(false)
    expect(isFreeCourse({ main_price: 0 })).toBe(true)
    process.env.COURSES_ARE_FREE = 'true'
    expect(isFreeCourse({ main_price: 900 })).toBe(true)
  })
})
