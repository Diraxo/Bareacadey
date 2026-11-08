jest.mock('axios')
const axios = require('axios')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const { coursePrice, validPercentage } = require('../services/pricing')
const chapa = require('../services/chapa')

const now = new Date('2026-06-15T12:00:00Z')
const base = { main_price: 1000, enable_discount: true, discount_start_date: '2026-06-01T00:00:00Z', discount_end_date: '2026-06-30T00:00:00Z' }

describe('coursePrice (percentage discount reduces the price by that percentage)', () => {
  test('20% off 1000 Birr is 800 Birr (was 200)', () => {
    expect(coursePrice({ ...base, discount_percentage: 20 }, now)).toBe(800)
  })
  test.each([[10, 900], [50, 500], [99, 10], [33.33, 666.7], [0.5, 995]])('%s%% off 1000 is %s', (pct, expected) => {
    expect(coursePrice({ ...base, discount_percentage: pct }, now)).toBe(expected)
  })
  test('no discount outside the window, when disabled, or with an incomplete window', () => {
    expect(coursePrice({ ...base, discount_percentage: 20 }, new Date('2026-07-01T00:00:00Z'))).toBe(1000)
    expect(coursePrice({ ...base, discount_percentage: 20 }, new Date('2026-05-31T00:00:00Z'))).toBe(1000)
    expect(coursePrice({ ...base, enable_discount: false, discount_percentage: 20 }, now)).toBe(1000)
    expect(coursePrice({ ...base, discount_end_date: null, discount_percentage: 20 }, now)).toBe(1000)
  })
  test('invalid percentages never produce a negative or inflated price', () => {
    for (const bad of [-10, 100, 150, 'abc', null, 0]) expect(coursePrice({ ...base, discount_percentage: bad }, now)).toBe(1000)
    expect(validPercentage(99.99)).toBe(99.99)
    expect(validPercentage(100)).toBeNull()
  })
  test('a percentage wins over a fixed discounted price; the fixed price is used when no percentage is set (unchanged)', () => {
    expect(coursePrice({ ...base, discount_percentage: 20, discounted_price: 300 }, now)).toBe(800)
    expect(coursePrice({ ...base, discount_percentage: 0, discounted_price: 700 }, now)).toBe(700)
  })
  test('server-side and client-side formulas agree (client helper copies)', () => {
    const { clientPrice } = require('./pricingClientCopies')
    for (const c of [{ ...base, discount_percentage: 20 }, { ...base, discounted_price: 700 }, { ...base, discount_percentage: 150 }, { ...base, discount_percentage: 100 }, { ...base, enable_discount: false }, { ...base, discount_percentage: 20, discount_end_date: null }]) {
      for (const copy of clientPrice) expect(copy.fn(c, now)).toBe(coursePrice(c, now))
    }
  })
})

describe('checkout charges the corrected price; history is untouched', () => {
  let http, student, course
  beforeAll(async () => {
    await resetDb()
    ;({ http } = api())
    student = await makeUser('shopper@example.com', 'viewer')
    const start = new Date(Date.now() - 86400000), end = new Date(Date.now() + 86400000)
    course = await models.Course.create({ title: 'Math', main_price: 1000, type: 'course', routeState: 'published', enable_discount: true, discount_percentage: 20, discount_start_date: start, discount_end_date: end })
  })
  beforeEach(() => { axios.get.mockReset(); axios.post.mockReset() })

  test('a 20% discount on 1000 Birr starts a payment of 800 Birr', async () => {
    axios.post.mockResolvedValue({ data: { status: 'success', data: { checkout_url: 'https://checkout.example/x' } } })
    const res = await http.post('/api/payments').set(MOBILE).set(student.auth).send({ _course_id: course.id, _currency: 'ETB' })
    expect(res.status).toBe(200)
    const sent = JSON.parse(JSON.stringify(axios.post.mock.calls[0][1]))
    expect(sent.amount).toBe(800)
    const row = await models.Payment.findOne({ where: { user_id: student.user.id, course_id: course.id, paid: false } })
    expect(row.amount).toBe(800)
  })

  test('a transaction recorded under the old (wrong) formula still verifies for its recorded amount', async () => {
    const old = await models.Payment.create({ amount: 200, currency: 'ETB', user_id: student.user.id, course_id: course.id, paid: false, reference_no: `tx_ja_course_1700000000000-${student.user.id}.${course.id}` })
    axios.get.mockResolvedValue({ data: { status: 'success', data: { status: 'success', tx_ref: old.reference_no, currency: 'ETB', amount: 200 } } })
    expect((await chapa.settlePayment(old.reference_no)).status).toBe('paid')
    expect((await old.reload()).amount).toBe(200)
  })

  test('the course model rejects percentages outside 0-99.99', async () => {
    await expect(models.Course.create({ title: 'Bad', main_price: 10, type: 'course', discount_percentage: 150 })).rejects.toThrow()
    await expect(models.Course.create({ title: 'Bad2', main_price: 10, type: 'course', discount_percentage: -5 })).rejects.toThrow()
  })
})

describe('client helpers', () => {
  const { identical, clientPrice } = require('./pricingClientCopies')
  test('web and mobile helpers are the same file', () => expect(identical).toBe(true))
  test('list view: shows the discounted amount only while a real reduction applies', () => {
    for (const { discounted } of clientPrice) {
      expect(discounted({ ...base, discount_percentage: 20 }, now)).toBe(800)
      expect(discounted({ ...base, enable_discount: false, discount_percentage: 20 }, now)).toBe(0)
      expect(discounted({ ...base, discount_percentage: 100 }, now)).toBe(0)
    }
  })
})
