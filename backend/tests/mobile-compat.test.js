const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')

// The legacy PHP endpoints were called by the app with a plain fetch(): no Origin, no app header.
let http, admin, instructor, student, other

const importPayload = () => ({
  categories: [{ category: 'Biology', image: 'https://img.example/bio.png' }],
  titles: ['Grade 12', 'Grade 11'],
  quizzes: [
    {
      category: 'Biology', title: 'Grade 12 Biology', year: '2013/2014', diff_level: 'Medium', quiz_description: 'Cells and genetics',
      time: 600, pass_mark: 60, routeState: 'published',
      questions: [
        { title: 'Powerhouse of the cell?', explanation: 'Mitochondria make ATP', answers: [{ title: 'Nucleus' }, { title: 'Mitochondria', correct: true }, { title: 'Ribosome' }] },
        { title: '2+2?', answers: [{ title: '3' }, { title: '4', correct: true }] },
      ],
    },
    {
      category: 'Physics', title: 'Grade 11 Physics', year: '2014/2015', routeState: 'draft',
      questions: [{ title: 'Unit of force?', answers: [{ title: 'Newton', correct: true }, { title: 'Joule' }] }],
    },
  ],
})

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  admin = await makeUser('admin@example.com', 'admin')
  instructor = await makeUser('teacher@example.com', 'instructor')
  student = await makeUser('student@example.com', 'viewer')
  other = await makeUser('other@example.com', 'viewer')
})

describe('quiz endpoints on an empty database (nothing is fabricated)', () => {
  test('categories, titles and quizzes are empty lists in the shape the app reads', async () => {
    for (const url of ['/quiz/get_quiz_categories.php', '/quiz/get_titles.php', '/quiz/get_quizzes.php']) {
      const res = await http.get(url)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: true, data: [] })
    }
  })
  test('details of an unknown quiz is a clean not-found', async () => {
    const res = await http.get('/quiz/get_quiz_details.php?quiz_id=1')
    expect(res.status).toBe(404)
    expect(res.body.status).toBe(false)
  })
})

describe('quiz administration', () => {
  test('students cannot import or edit quiz content', async () => {
    expect((await http.post('/api/quizzes/import').set(MOBILE).set(student.auth).send(importPayload())).status).toBe(401)
    expect((await http.post('/api/quizzes').set(MOBILE).set(student.auth).send({ title: 'x' })).status).toBe(401)
    expect((await http.delete('/api/quizzes').set(MOBILE).set(student.auth).send({ id: 1 })).status).toBe(401)
  })

  test.each([
    ['two correct answers', (p) => { p.quizzes[0].questions[1].answers[0].correct = true }, /exactly one answer/],
    ['no correct answer', (p) => { p.quizzes[0].questions[1].answers[1].correct = false }, /exactly one answer/],
    ['a single answer', (p) => { p.quizzes[0].questions[1].answers.pop() }, /at least two answers/],
    ['a blank question', (p) => { p.quizzes[0].questions[0].title = '  ' }, /title is required/],
    ['no title', (p) => { delete p.quizzes[0].title }, /title is required/],
    ['negative time', (p) => { p.quizzes[0].time = -5 }, /time must be/],
    ['pass mark above 100', (p) => { p.quizzes[0].pass_mark = 101 }, /pass_mark/],
  ])('import rejects %s and stores nothing', async (_n, mutate, message) => {
    const payload = importPayload()
    mutate(payload)
    const res = await http.post('/api/quizzes/import').set(MOBILE).set(instructor.auth).send(payload)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(message)
    expect(await models.Quiz.count()).toBe(0)
    expect(await models.QuizCategory.count()).toBe(0)
  })

  test('a failure half-way through rolls everything back', async () => {
    const payload = importPayload()
    payload.quizzes[1].questions[0].answers[0].title = 'x'.repeat(10) // valid
    payload.quizzes[1].title = 'T'.repeat(300) // varchar(255) overflow only fails on strict DBs; force failure another way
    const spy = jest.spyOn(models.QuizAnswer, 'bulkCreate').mockImplementationOnce(async () => { throw new Error('boom') })
    const res = await http.post('/api/quizzes/import').set(MOBILE).set(instructor.auth).send(importPayload())
    spy.mockRestore()
    expect(res.status).toBe(500)
    expect(await models.Quiz.count()).toBe(0)
    expect(await models.QuizCategory.count()).toBe(0)
  })

  test('an instructor can import content', async () => {
    const res = await http.post('/api/quizzes/import').set(MOBILE).set(instructor.auth).send(importPayload())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ quizzes: 2, questions: 3 })
  })
})

describe('quiz endpoints keep the contract the app expects', () => {
  test('get_quiz_categories.php: id, category, image and the number of published quizzes', async () => {
    const res = await http.get('/quiz/get_quiz_categories.php')
    expect(res.body.status).toBe(true)
    const bio = res.body.data.find((c) => c.category === 'Biology')
    expect(bio).toEqual({ id: expect.any(Number), category: 'Biology', image: 'https://img.example/bio.png', total_quizzes: 1 })
    // Physics only holds a draft quiz: listed, but counts none
    expect(res.body.data.find((c) => c.category === 'Physics').total_quizzes).toBe(0)
  })

  test('get_titles.php returns the grade titles', async () => {
    const res = await http.get('/quiz/get_titles.php')
    expect(res.body.data.map((t) => t.title)).toEqual(['Grade 11', 'Grade 12'])
  })

  test('get_quizzes.php lists only published quizzes with the fields the list screen shows', async () => {
    const res = await http.get('/quiz/get_quizzes.php')
    expect(res.body.status).toBe(true)
    expect(res.body.data).toEqual([{ id: expect.any(Number), title: 'Grade 12 Biology', year: '2013/2014', diff_level: 'Medium', max_questions: 2, quiz_description: 'Cells and genetics' }])
  })

  test('get_quizzes.php filters: search, year (all = no filter) and category_id', async () => {
    const category = (await http.get('/quiz/get_quiz_categories.php')).body.data.find((c) => c.category === 'Biology')
    const q = async (qs) => (await http.get('/quiz/get_quizzes.php' + qs)).body.data.length
    expect(await q('?search=Biology')).toBe(1)
    expect(await q('?search=Chemistry')).toBe(0)
    expect(await q('?year=2013/2014')).toBe(1)
    expect(await q('?year=1999/2000')).toBe(0)
    expect(await q('?year=all')).toBe(1)
    expect(await q(`?category_id=${category.id}`)).toBe(1)
    expect(await q('?category_id=9999')).toBe(0)
    expect((await http.get('/quiz/get_quizzes.php?category_id=abc')).status).toBe(400)
  })

  test('search treats LIKE wildcards literally', async () => {
    expect((await http.get('/quiz/get_quizzes.php?search=%25')).body.data.length).toBe(0)
    expect((await http.get('/quiz/get_quizzes.php?search=_')).body.data.length).toBe(0)
  })

  test('get_quiz_details.php: quiz info, questions in order, answers and correct_answer as an answer id', async () => {
    const id = (await http.get('/quiz/get_quizzes.php')).body.data[0].id
    const res = await http.get(`/quiz/get_quiz_details.php?quiz_id=${id}`)
    expect(res.body.status).toBe(true)
    expect(res.body.quiz).toMatchObject({ title: 'Grade 12 Biology', year: '2013/2014', diff_level: 'Medium', max_questions: 2, time: 600, pass_mark: 60 })
    expect(res.body.questions).toHaveLength(2)
    const [q1, q2] = res.body.questions
    expect(q1.title).toBe('Powerhouse of the cell?')
    expect(q1.explanation).toBe('Mitochondria make ATP')
    expect(q1.answers.map((a) => a.title)).toEqual(['Nucleus', 'Mitochondria', 'Ribosome'])
    expect(q1.answers[0]).toEqual({ id: expect.any(Number), title: 'Nucleus' }) // no is_correct leaked beside the id
    // the app compares userAnswers[q.id] === q.correct_answer with ===, so both must be numbers of the same kind
    expect(typeof q1.correct_answer).toBe('number')
    expect(q1.correct_answer).toBe(q1.answers.find((a) => a.title === 'Mitochondria').id)
    expect(q2.correct_answer).toBe(q2.answers.find((a) => a.title === '4').id)
  })

  test('draft quizzes are not reachable by id and bad ids are rejected', async () => {
    const draft = await models.Quiz.findOne({ where: { routeState: 'draft' } })
    expect((await http.get(`/quiz/get_quiz_details.php?quiz_id=${draft.id}`)).status).toBe(404)
    expect((await http.get('/quiz/get_quiz_details.php?quiz_id=abc')).status).toBe(400)
    expect((await http.get('/quiz/get_quiz_details.php')).status).toBe(400)
  })

  test('administrators see drafts and can read answers with their correctness flag', async () => {
    const list = await http.get('/api/quizzes').set(MOBILE).set(instructor.auth)
    expect(list.body).toHaveLength(2)
    const full = await http.get(`/api/quizzes/${list.body[0].id}`).set(MOBILE).set(instructor.auth)
    expect(full.body.questions[0].answers.some((a) => a.is_correct === true)).toBe(true)
  })

  test('updating replaces questions and deleting removes quiz, questions and answers', async () => {
    const quiz = await models.Quiz.findOne({ where: { routeState: 'draft' } })
    const upd = await http.put('/api/quizzes').set(MOBILE).set(instructor.auth).send({
      id: quiz.id, title: 'Grade 11 Physics', routeState: 'published',
      questions: [{ title: 'New?', answers: [{ title: 'Yes', correct: true }, { title: 'No' }] }],
    })
    expect(upd.status).toBe(200)
    const pub = await http.get(`/quiz/get_quiz_details.php?quiz_id=${quiz.id}`)
    expect(pub.body.questions).toHaveLength(1)
    const answersBefore = await models.QuizAnswer.count()
    await http.delete('/api/quizzes').set(MOBILE).set(instructor.auth).send({ id: quiz.id })
    expect(await models.Quiz.findByPk(quiz.id)).toBeNull()
    expect(await models.QuizQuestion.count({ where: { quiz_id: quiz.id } })).toBe(0)
    expect(await models.QuizAnswer.count()).toBe(answersBefore - 2)
  })
})

describe('/version/', () => {
  test('answers with the integer build number the app compares with its own', async () => {
    const res = await http.get('/version/')
    expect(res.status).toBe(200)
    expect(Number.isInteger(res.body.app_version)).toBe(true)
    expect(res.body.app_version).toBe(1)
  })
  test('is driven by the Config table and editable by an administrator', async () => {
    const config = JSON.parse((await models.Config.findByPk(5)).config)
    const res = await http.put('/api/system_config').set(MOBILE).set(admin.auth).send({ id: 5, config: { ...config, app_version: 7 } })
    expect(res.status).toBe(200)
    expect((await http.get('/version/')).body.app_version).toBe(7)
  })
  test('adds per-platform minimums without changing app_version: Android falls back to it, iOS is not enforced unless set', async () => {
    const base = (await http.get('/version/')).body
    expect(base).toEqual({ app_version: base.app_version, min_build_android: base.app_version, min_build_ios: null })
    const config = JSON.parse((await models.Config.findByPk(5)).config)
    await models.Config.update({ config: JSON.stringify({ ...config, app_version: 9, min_build_ios: 4 }) }, { where: { id: 5 } })
    expect((await http.get('/version/')).body).toEqual({ app_version: 9, min_build_android: 9, min_build_ios: 4 })
    await models.Config.update({ config: JSON.stringify({ ...config, app_version: 9, min_build_android: 12, min_build_ios: 'abc' }) }, { where: { id: 5 } })
    expect((await http.get('/version/')).body).toEqual({ app_version: 9, min_build_android: 12, min_build_ios: null })
    await models.Config.update({ config: JSON.stringify(config) }, { where: { id: 5 } })
  })
  test('falls back to the default for corrupted settings', async () => {
    await models.Config.update({ config: 'not json' }, { where: { id: 5 } })
    expect((await http.get('/version/')).body.app_version).toBe(1)
    await models.Config.update({ config: JSON.stringify({ app_version: 1, device_policy: { mode: 'single', blockOnLogout: false } }) }, { where: { id: 5 } })
  })
})

describe('/check/ (device registration)', () => {
  const check = (user, device, userId = user.user.id) => http.get(`/check/?device=${encodeURIComponent(device)}&user_id=${userId}`).set(user.auth)
  // new environments are seeded with the restriction off; these tests cover the optional "single" policy, so turn it on here
  beforeAll(() => models.Config.update({ config: JSON.stringify({ app_version: 1, device_policy: { mode: 'single', blockOnLogout: false } }) }, { where: { id: 5 } }))

  test('requires authentication (the legacy endpoint trusted a user id from the query)', async () => {
    expect((await http.get('/check/?device=d&user_id=1')).status).toBe(401)
  })
  test('the first device seen for an account is registered and accepted', async () => {
    const res = await check(student, 'Pixel-1')
    expect(res.body).toEqual({ status: 'success' })
    expect(await models.Device.count({ where: { user_id: student.user.id, device: 'Pixel-1' } })).toBe(1)
  })
  test('the registered device keeps working', async () => {
    expect((await check(student, 'Pixel-1')).body.status).toBe('success')
    expect(await models.Device.count({ where: { user_id: student.user.id } })).toBe(1)
  })
  test('a different device is denied (the app then asks the user to contact support)', async () => {
    const res = await check(student, 'iPhone-2')
    expect(res.body.status).toBe('denied')
    expect(await models.Device.count({ where: { user_id: student.user.id } })).toBe(1)
  })
  test('a device registered at sign-up (create_account) is the account’s device', async () => {
    await models.Device.create({ user_id: other.user.id, device: 'SignupPhone' })
    expect((await check(other, 'SignupPhone')).body.status).toBe('success')
    expect((await check(other, 'Another')).body.status).toBe('denied')
  })
  test('a caller cannot probe or register devices for someone else', async () => {
    const res = await check(student, 'x', other.user.id)
    expect(res.status).toBe(403)
    expect(res.body.status).toBe('denied')
  })
  test('device is required and bounded', async () => {
    expect((await http.get('/check/?user_id=' + student.user.id).set(MOBILE).set(student.auth)).status).toBe(400)
    expect((await check(student, 'x'.repeat(300))).status).toBe(400)
  })
  test('blocked and deactivated accounts are denied', async () => {
    const blocked = await makeUser('blocked@example.com', 'viewer', { blocked: true })
    expect((await check(blocked, 'd')).body).toMatchObject({ status: 'denied', code: 'account_not_allowed' })
    const inactive = await makeUser('inactive@example.com', 'viewer', { active: false })
    expect((await check(inactive, 'd')).body).toMatchObject({ status: 'denied', code: 'account_not_allowed' })
  })
  test('policy "off" lifts the device restriction', async () => {
    await models.Config.update({ config: JSON.stringify({ app_version: 1, device_policy: { mode: 'off' } }) }, { where: { id: 5 } })
    expect((await check(student, 'iPhone-2')).body.status).toBe('success')
    await models.Config.update({ config: JSON.stringify({ app_version: 1, device_policy: { mode: 'single', blockOnLogout: false } }) }, { where: { id: 5 } })
  })
})

describe('/block/ (original behaviour unknown)', () => {
  test('requires authentication', async () => {
    expect((await http.post('/block/').set(MOBILE).send({ user_id: 1 })).status).toBe(401)
  })
  test('is acknowledged but changes nothing by default', async () => {
    const res = await http.post('/block/').set(MOBILE).set(student.auth).send({ user_id: student.user.id })
    expect(res.body.status).toBe('ignored')
    expect((await models.User.findByPk(student.user.id)).blocked).toBe(false)
  })
  test('when enabled it can only ever act on the caller, never on a client-supplied user id', async () => {
    await models.Config.update({ config: JSON.stringify({ app_version: 1, device_policy: { mode: 'single', blockOnLogout: true } }) }, { where: { id: 5 } })
    const res = await http.post('/block/').set(MOBILE).set(other.auth).send({ user_id: student.user.id })
    expect(res.body.status).toBe('success')
    expect((await models.User.findByPk(student.user.id)).blocked).toBe(false)
    expect((await models.User.findByPk(other.user.id)).blocked).toBe(true)
  })
})
