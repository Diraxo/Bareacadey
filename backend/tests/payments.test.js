jest.mock('axios')
const axios = require('axios')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const chapa = require('../services/chapa')

let http, student, other, course, chapter

const chapaOk = (ref, overrides = {}) => ({
  data: { message: 'Payment details fetched successfully', status: 'success', data: { status: 'success', tx_ref: ref, currency: 'ETB', amount: 500, ...overrides } },
})

const makePayment = async (user, extra = {}) => {
  const ref = `tx_ja_course_${Date.now()}${Math.floor(Math.random() * 90 + 10)}-${user.id}.${course.id}`
  return models.Payment.create({ amount: 500, currency: 'ETB', user_id: user.id, course_id: course.id, paid: false, reference_no: ref, ...extra })
}

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  student = await makeUser('student@example.com', 'viewer')
  other = await makeUser('other@example.com', 'viewer')
  course = await models.Course.create({ title: 'Biology', main_price: 500, type: 'course', routeState: 'published' })
  chapter = await models.Chapter.create({ title: 'Ch1', price: 100, course_parent_id: course.id, routeState: 'published' })
})

beforeEach(() => { axios.get.mockReset(); axios.post.mockReset() })

describe('settlePayment (verification before granting access)', () => {
  test('marks the payment paid only when Chapa confirms success, tx_ref, currency and amount', async () => {
    const p = await makePayment(student.user)
    axios.get.mockResolvedValue(chapaOk(p.reference_no))
    const result = await chapa.settlePayment(p.reference_no)
    expect(result.status).toBe('paid')
    expect((await p.reload()).paid).toBe(true)
    // the verify call was made against the provider with our own tx_ref
    expect(axios.get.mock.calls[0][0]).toContain(encodeURIComponent(p.reference_no))
  })

  test.each([
    ['pending transaction', { status: 'pending' }, 'pending'],
    ['failed transaction', { status: 'failed' }, 'pending'],
    ['amount lower than the price', { amount: 1 }, 'rejected'],
    ['wrong currency', { currency: 'USD' }, 'rejected'],
    ['tx_ref of a different payment', { tx_ref: 'tx_ja_course_1700000000000-999.999' }, 'rejected'],
  ])('%s does not grant access', async (_name, override, expected) => {
    const p = await makePayment(student.user)
    axios.get.mockResolvedValue(chapaOk(p.reference_no, override))
    const result = await chapa.settlePayment(p.reference_no)
    expect(result.status).toBe(expected)
    expect((await p.reload()).paid).toBe(false)
  })

  test('an HTTP-success reply whose body says failure does not grant access (the old bug)', async () => {
    const p = await makePayment(student.user)
    axios.get.mockResolvedValue({ status: 200, data: { message: 'Transaction not found', status: 'failed', data: null } })
    expect((await chapa.settlePayment(p.reference_no)).status).toBe('rejected')
    expect((await p.reload()).paid).toBe(false)
  })

  test('unknown or malformed references are refused without calling the provider', async () => {
    expect((await chapa.settlePayment('tx_ja_course_1700000000000-1.1')).status).toBe('not_found')
    for (const bad of ['../../etc/passwd', 'x', '', undefined, 'tx_ja_course_1-1.1;DROP', 'a'.repeat(300)]) {
      expect((await chapa.settlePayment(bad)).status).toBe('invalid_reference')
    }
    expect(axios.get).not.toHaveBeenCalled()
  })

  test('a row whose tx_ref disagrees with its owner/target is rejected', async () => {
    const p = await makePayment(student.user, { user_id: other.user.id })
    axios.get.mockResolvedValue(chapaOk(p.reference_no))
    expect((await chapa.settlePayment(p.reference_no)).status).toBe('rejected')
    expect((await p.reload()).paid).toBe(false)
  })

  test('is idempotent and does not call the provider for an already-paid payment', async () => {
    const p = await makePayment(student.user, { paid: true })
    expect((await chapa.settlePayment(p.reference_no)).status).toBe('already_paid')
    expect(axios.get).not.toHaveBeenCalled()
  })

  test('provider outage leaves the payment unpaid', async () => {
    const p = await makePayment(student.user)
    axios.get.mockRejectedValue(new Error('network'))
    expect((await chapa.settlePayment(p.reference_no)).status).toBe('unavailable')
    expect((await p.reload()).paid).toBe(false)
  })

  test('removes the same user’s other unpaid attempts for the item', async () => {
    const stale = await makePayment(student.user)
    const winner = await makePayment(student.user)
    axios.get.mockResolvedValue(chapaOk(winner.reference_no))
    await chapa.settlePayment(winner.reference_no)
    expect(await models.Payment.findByPk(stale.id)).toBeNull()
  })
})

describe('public callback endpoint', () => {
  test('cannot be used to mark an arbitrary or forged reference as paid', async () => {
    const res = await http.get('/api/open_public/verify-payment/' + encodeURIComponent('tx_ja_course_1700000000000-1.1'))
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Payment Was Not Successful')
    const bad = await http.get('/api/open_public/verify-payment/not-a-reference')
    expect(bad.status).toBe(400)
  })

  test('a real pending payment is only completed if the provider confirms it', async () => {
    const p = await makePayment(student.user)
    axios.get.mockResolvedValue(chapaOk(p.reference_no, { status: 'pending' }))
    let res = await http.get('/api/open_public/verify-payment/' + p.reference_no)
    expect(res.body.message).toBe('Payment Was Not Successful')
    expect((await p.reload()).paid).toBe(false)

    axios.get.mockResolvedValue(chapaOk(p.reference_no))
    res = await http.get('/api/open_public/verify-payment/' + p.reference_no)
    expect(res.body.message).toBe('Payment Successful')
    expect((await p.reload()).paid).toBe(true)
  })

  test('the legacy /api/public duplicate uses the same verification', async () => {
    const p = await makePayment(student.user)
    axios.get.mockResolvedValue(chapaOk(p.reference_no, { amount: 1 }))
    const res = await http.get('/api/public/verify-payment/' + p.reference_no).set(MOBILE)
    expect(res.body.message).toBe('Payment Was Not Successful')
    expect((await p.reload()).paid).toBe(false)
  })
})

describe('payment initialisation', () => {
  let shopper
  beforeAll(async () => { shopper = await makeUser('shopper@example.com', 'viewer') })

  test('price and currency are computed on the server; client-supplied amounts are ignored', async () => {
    axios.post.mockResolvedValue({ data: { status: 'success', data: { checkout_url: 'https://checkout.example/abc' } } })
    const res = await http.post('/api/payments').set(MOBILE).set(shopper.auth).send({ _course_id: course.id, _currency: 'ETB', _amount: 1, _user_id: other.user.id })
    expect(res.status).toBe(200)
    expect(res.body.data.checkout_url).toBe('https://checkout.example/abc')
    const sent = axios.post.mock.calls[0][1]
    expect(sent.amount).toBe(500)
    expect(sent.email).toBe('shopper@example.com')
    expect(sent.callback_url).toMatch(/^https:\/\/api\.test\.example\/api\/open_public\/verify-payment\/tx_ja_course_/)
    const row = await models.Payment.findOne({ where: { reference_no: sent.tx_ref } })
    expect(row.user_id).toBe(shopper.user.id)
    expect(row.amount).toBe(500)
    expect(row.paid).toBe(false)
  })

  test('USD amounts are converted with the configured rate', async () => {
    axios.post.mockResolvedValue({ data: { status: 'success', data: { checkout_url: 'u' } } })
    await http.post('/api/payments').set(MOBILE).set(shopper.auth).send({ _chapter_id: chapter.id, _currency: 'USD' })
    const sent = axios.post.mock.calls[0][1]
    expect(sent.currency).toBe('USD')
    expect(sent.amount).toBe(1) // 100 ETB / 125 = 0.8 -> provider minimum of 1 USD (existing behaviour)
  })

  test('unknown items, free items and bad currencies are rejected without contacting the provider', async () => {
    const free = await models.Course.create({ title: 'Free', main_price: 0, type: 'course', routeState: 'published' })
    for (const body of [{ _course_id: 99999 }, { _course_id: free.id }, { _course_id: course.id, _currency: 'EUR' }, {}]) {
      const res = await http.post('/api/payments').set(MOBILE).set(shopper.auth).send(body)
      expect(res.status).toBeGreaterThanOrEqual(400)
    }
    expect(axios.post).not.toHaveBeenCalled()
  })

  test('a provider failure does not create a payment row', async () => {
    const before = await models.Payment.count()
    axios.post.mockResolvedValue({ data: { status: 'failed', message: 'bad key' } })
    const res = await http.post('/api/payments').set(MOBILE).set(shopper.auth).send({ _course_id: course.id, _currency: 'ETB' })
    expect(res.status).toBe(502)
    expect(await models.Payment.count()).toBe(before)
  })

  test('an item that is already bought cannot be bought twice', async () => {
    const buyer = await makeUser('buyer@example.com', 'viewer')
    await models.Payment.create({ amount: 500, currency: 'ETB', user_id: buyer.user.id, course_id: course.id, paid: true, reference_no: 'x' })
    const res = await http.post('/api/payments').set(MOBILE).set(buyer.auth).send({ _course_id: course.id, _currency: 'ETB' })
    expect(res.status).toBe(409)
  })

  test('eBirr/Kaafi style paid-on-request is impossible: only the provider-verified path sets paid', async () => {
    const res = await http.post('/api/payments').set(MOBILE).set(shopper.auth).send({ _course_id: course.id, _currency: 'ETB', paid: true, _paid: true })
    const rows = await models.Payment.findAll({ where: { user_id: shopper.user.id, paid: true } })
    expect(rows.length).toBe(0)
    void res
  })
})

describe('check_payment', () => {
  test('re-verifies an open attempt when the callback never arrived', async () => {
    const user = await makeUser('late@example.com', 'viewer')
    const p = await makePayment(user.user)
    axios.get.mockResolvedValue(chapaOk(p.reference_no))
    const res = await http.post('/api/payments/check_payment').set(MOBILE).set(user.auth).send({ course_id: course.id })
    expect(res.body.message).toBe('Payment Was Successful')
    expect((await p.reload()).paid).toBe(true)
  })

  test('reports not paid when the provider has no successful payment', async () => {
    const user = await makeUser('unpaid@example.com', 'viewer')
    await makePayment(user.user)
    axios.get.mockResolvedValue(chapaOk('x', { status: 'pending' }))
    const res = await http.post('/api/payments/check_payment').set(MOBILE).set(user.auth).send({ course_id: course.id })
    expect(res.body.error).toBe(true)
  })

  test('a missing item id is a client error instead of matching any paid item', async () => {
    const res = await http.post('/api/payments/check_payment').set(MOBILE).set(student.auth).send({})
    expect(res.status).toBe(400)
  })
})
