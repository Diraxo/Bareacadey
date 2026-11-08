const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const { scoreQuiz } = require('../services/quizScoring')

let http, admin, teacherA, teacherB, student

const q = (title, correctIndex = 0, extra = {}) => ({
  title,
  answers: ['A', 'B', 'C'].map((t, i) => ({ title: `${title} ${t}`, correct: i === correctIndex })),
  ...extra,
})
const post = (url, who, body) => http.post(url).set(MOBILE).set(who.auth).send(body)
const put = (url, who, body) => http.put(url).set(MOBILE).set(who.auth).send(body)
const del = (url, who, body) => http.delete(url).set(MOBILE).set(who.auth).send(body)
const get = (url, who) => http.get(url).set(MOBILE).set(who.auth)

/* the scoring rules of bare/app/QuizDetails.jsx, copied verbatim, applied to what the public API returns */
const clientScore = (details, picked) => {
  const total = details.questions.length
  let correct = 0
  for (const question of details.questions) if (picked[question.id] && picked[question.id] === question.correct_answer) correct += 1
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  const passThreshold = details.quiz && details.quiz.pass_mark ? Number(details.quiz.pass_mark) : 50
  return { correct, wrong: total - correct, total, percentage, passed: percentage >= passThreshold }
}

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  admin = await makeUser('admin@example.com', 'admin')
  teacherA = await makeUser('a@example.com', 'instructor')
  teacherB = await makeUser('b@example.com', 'instructor')
  student = await makeUser('student@example.com', 'viewer')
})

describe('authorization', () => {
  let quizId
  beforeAll(async () => {
    const res = await post('/api/quizzes', teacherA, { title: 'Owned by A', year: '2016', questions: [q('One')] })
    quizId = res.body.id
  })

  test('students and anonymous callers reach no admin endpoint', async () => {
    const calls = [
      () => http.get('/api/quizzes').set(MOBILE),
      () => get('/api/quizzes', student),
      () => get(`/api/quizzes/${quizId}`, student),
      () => post('/api/quizzes', student, { title: 'x' }),
      () => put('/api/quizzes', student, { id: quizId, title: 'x' }),
      () => del('/api/quizzes', student, { id: quizId }),
      () => post(`/api/quizzes/${quizId}/questions`, student, q('x')),
      () => put('/api/quizzes/questions/1', student, q('x')),
      () => del('/api/quizzes/questions/1', student),
      () => post('/api/quizzes/import', student, { quizzes: [] }),
      () => post('/api/quizzes/categories', student, { category: 'x' }),
      () => put('/api/quizzes/categories', student, { id: 1, category: 'x' }),
      () => del('/api/quizzes/categories', student, { id: 1 }),
      () => post('/api/quizzes/titles', student, { title: 'x' }),
      () => del('/api/quizzes/titles', student, { id: 1 }),
    ]
    for (const call of calls) expect([401, 403]).toContain((await call()).status)
    expect(await models.Quiz.count()).toBe(1)
  })

  test('an instructor sees and changes only their own quizzes', async () => {
    expect((await get('/api/quizzes', teacherB)).body).toEqual([])
    expect((await get('/api/quizzes', teacherA)).body).toHaveLength(1)
    expect((await get(`/api/quizzes/${quizId}`, teacherB)).status).toBe(401)
    expect((await put('/api/quizzes', teacherB, { id: quizId, title: 'Hijacked' })).status).toBe(401)
    expect((await del('/api/quizzes', teacherB, { id: quizId })).status).toBe(401)
    expect((await post(`/api/quizzes/${quizId}/questions`, teacherB, q('Injected'))).status).toBe(401)
    const first = await models.QuizQuestion.findOne({ where: { quiz_id: quizId } })
    expect((await put(`/api/quizzes/questions/${first.id}`, teacherB, q('Hijacked'))).status).toBe(401)
    expect((await del(`/api/quizzes/questions/${first.id}`, teacherB)).status).toBe(401)
    const stored = await models.Quiz.findByPk(quizId)
    expect(stored.title).toBe('Owned by A')
    expect(await models.QuizQuestion.count({ where: { quiz_id: quizId } })).toBe(1)
  })

  test('an administrator can work on any quiz', async () => {
    expect((await get('/api/quizzes', admin)).body.length).toBeGreaterThanOrEqual(1)
    expect((await put('/api/quizzes', admin, { id: quizId, title: 'Owned by A (checked)' })).status).toBe(200)
    expect((await get(`/api/quizzes/${quizId}`, admin)).body.title).toBe('Owned by A (checked)')
  })

  test('shared categories and grade titles: instructors may add, only administrators may rename or delete', async () => {
    const category = await post('/api/quizzes/categories', teacherA, { category: 'Biology' })
    expect(category.status).toBe(201)
    const title = await post('/api/quizzes/titles', teacherA, { title: 'Grade 12' })
    expect(title.status).toBe(201)
    expect((await put('/api/quizzes/categories', teacherA, { id: category.body.id, category: 'Hacked' })).status).toBe(401)
    expect((await del('/api/quizzes/categories', teacherB, { id: category.body.id })).status).toBe(401)
    expect((await del('/api/quizzes/titles', teacherA, { id: title.body.id })).status).toBe(401)
    expect((await models.QuizCategory.findByPk(category.body.id)).category).toBe('Biology')
    expect((await put('/api/quizzes/categories', admin, { id: category.body.id, category: 'Biology (renamed)' })).status).toBe(200)
  })
})

describe('creating and editing a quiz, questions and answers', () => {
  let quizId, questionIds

  test('a new quiz is a draft: invisible to students until published', async () => {
    const res = await post('/api/quizzes', teacherA, { title: 'Grade 10 Chemistry', year: '2015', diff_level: 'Hard', time: 900, pass_mark: 70 })
    expect(res.status).toBe(201)
    quizId = res.body.id
    expect((await http.get('/quiz/get_quizzes.php?search=Chemistry')).body.data).toEqual([])
    expect((await http.get(`/quiz/get_quiz_details.php?quiz_id=${quizId}`)).status).toBe(404)
  })

  test('questions are added one at a time, in order, with exactly one correct answer', async () => {
    questionIds = []
    for (const [i, title] of ['Atom?', 'Molecule?', 'Ion?'].entries()) {
      const res = await post(`/api/quizzes/${quizId}/questions`, teacherA, q(title, i, { explanation: `why ${i}` }))
      expect(res.status).toBe(201)
      questionIds.push(res.body.id)
    }
    const stored = await models.QuizQuestion.findAll({ where: { quiz_id: quizId }, order: [['position', 'ASC']] })
    expect(stored.map((s) => s.id)).toEqual(questionIds)
    expect(stored.map((s) => s.position)).toEqual([0, 1, 2])
  })

  test.each([
    ['no correct answer', { title: 'x', answers: [{ title: 'a' }, { title: 'b' }] }, /exactly one answer/],
    ['two correct answers', { title: 'x', answers: [{ title: 'a', correct: true }, { title: 'b', correct: true }] }, /exactly one answer/],
    ['one answer only', { title: 'x', answers: [{ title: 'a', correct: true }] }, /at least two/],
    ['blank answer', { title: 'x', answers: [{ title: 'a', correct: true }, { title: ' ' }] }, /every answer needs a title/],
    ['blank question', { title: ' ', answers: [{ title: 'a', correct: true }, { title: 'b' }] }, /title is required/],
    ['too many answers', { title: 'x', answers: Array.from({ length: 11 }, (_, i) => ({ title: `a${i}`, correct: i === 0 })) }, /at most 10/],
  ])('invalid question (%s) is refused and nothing changes', async (_n, body, message) => {
    const before = await models.QuizQuestion.count({ where: { quiz_id: quizId } })
    const res = await post(`/api/quizzes/${quizId}/questions`, teacherA, body)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(message)
    expect(await models.QuizQuestion.count({ where: { quiz_id: quizId } })).toBe(before)
  })

  test('editing one question keeps every other question and answer id (students may be mid-quiz)', async () => {
    const before = await models.QuizAnswer.findAll({ where: { question_id: questionIds[0] }, order: [['position', 'ASC']] })
    const otherBefore = (await models.QuizAnswer.findAll({ where: { question_id: questionIds[1] } })).map((a) => a.id)
    const res = await put(`/api/quizzes/questions/${questionIds[0]}`, teacherA, {
      title: 'Atom? (reworded)',
      explanation: 'new explanation',
      answers: [
        { id: before[0].id, title: 'edited A', correct: false },
        { id: before[1].id, title: 'edited B', correct: true }, // the correct answer moves
        { title: 'brand new D', correct: false },              // added; before[2] is omitted, so removed
      ],
    })
    expect(res.status).toBe(200)
    const after = await models.QuizAnswer.findAll({ where: { question_id: questionIds[0] }, order: [['position', 'ASC']] })
    expect(after.map((a) => a.title)).toEqual(['edited A', 'edited B', 'brand new D'])
    expect(after[0].id).toBe(before[0].id)
    expect(after[1].id).toBe(before[1].id)
    expect(after.map((a) => a.id)).not.toContain(before[2].id)
    expect(after.filter((a) => a.is_correct).map((a) => a.title)).toEqual(['edited B'])
    expect((await models.QuizAnswer.findAll({ where: { question_id: questionIds[1] } })).map((a) => a.id)).toEqual(otherBefore)
    expect((await models.QuizQuestion.findByPk(questionIds[0])).title).toBe('Atom? (reworded)')
  })

  test('an answer id from another question cannot be smuggled in', async () => {
    const foreign = await models.QuizAnswer.findOne({ where: { question_id: questionIds[1] } })
    const res = await put(`/api/quizzes/questions/${questionIds[0]}`, teacherA, { title: 'x', answers: [{ id: foreign.id, title: 'stolen', correct: true }, { title: 'b' }] })
    expect(res.status).toBe(400)
    expect((await models.QuizAnswer.findByPk(foreign.id)).title).not.toBe('stolen')
  })

  test('publishing needs at least one question; then students see the quiz', async () => {
    const empty = await post('/api/quizzes', teacherA, { title: 'Empty', routeState: 'published' })
    expect(empty.status).toBe(400)
    const emptyDraft = await post('/api/quizzes', teacherA, { title: 'Empty draft' })
    expect((await put('/api/quizzes', teacherA, { id: emptyDraft.body.id, title: 'Empty draft', routeState: 'published' })).status).toBe(400)

    expect((await put('/api/quizzes', teacherA, { id: quizId, title: 'Grade 10 Chemistry', year: '2015', diff_level: 'Hard', time: 900, pass_mark: 70, routeState: 'published' })).status).toBe(200)
    const list = (await http.get('/quiz/get_quizzes.php?search=Chemistry')).body
    expect(list.data).toHaveLength(1)
    expect(list.data[0]).toMatchObject({ id: quizId, title: 'Grade 10 Chemistry', year: '2015', diff_level: 'Hard', max_questions: 3 })
  })

  test('editing the details of a published quiz does not unpublish it', async () => {
    expect((await put('/api/quizzes', teacherA, { id: quizId, title: 'Grade 10 Chemistry', year: '2015', time: 1200, pass_mark: 70 })).status).toBe(200)
    expect((await models.Quiz.findByPk(quizId)).routeState).toBe('published')
  })

  test('the student-facing contract is unchanged after all those edits', async () => {
    const res = await http.get(`/quiz/get_quiz_details.php?quiz_id=${quizId}`)
    expect(res.status).toBe(200)
    expect(Object.keys(res.body).sort()).toEqual(['questions', 'quiz', 'status'])
    expect(Object.keys(res.body.quiz).sort()).toEqual(['diff_level', 'id', 'max_questions', 'pass_mark', 'quiz_description', 'time', 'title', 'year'])
    expect(res.body.quiz).toMatchObject({ max_questions: 3, time: 1200, pass_mark: 70 })
    expect(res.body.questions.map((x) => x.id)).toEqual(questionIds)
    for (const question of res.body.questions) {
      expect(Object.keys(question).sort()).toEqual(['answers', 'correct_answer', 'explanation', 'id', 'title'])
      expect(question.answers.every((a) => Object.keys(a).sort().join() === 'id,title')).toBe(true)
      expect(question.answers.map((a) => a.id)).toContain(question.correct_answer)
    }
  })

  test('deleting questions: the last one of a published quiz is protected; others go with their answers', async () => {
    expect((await del(`/api/quizzes/questions/${questionIds[2]}`, teacherA)).status).toBe(200)
    expect(await models.QuizAnswer.count({ where: { question_id: questionIds[2] } })).toBe(0)
    expect((await del(`/api/quizzes/questions/${questionIds[1]}`, teacherA)).status).toBe(200)
    const last = await del(`/api/quizzes/questions/${questionIds[0]}`, teacherA)
    expect(last.status).toBe(400)
    expect(last.body.message).toMatch(/Unpublish/)
    expect(await models.QuizQuestion.count({ where: { quiz_id: quizId } })).toBe(1)
    expect((await del('/api/quizzes/questions/999999', teacherA)).status).toBe(404)
  })

  test('deleting a quiz removes its questions and answers', async () => {
    expect((await del('/api/quizzes', teacherA, { id: quizId })).status).toBe(200)
    expect(await models.Quiz.count({ where: { id: quizId } })).toBe(0)
    expect(await models.QuizQuestion.count({ where: { quiz_id: quizId } })).toBe(0)
    expect(await models.QuizAnswer.count({ where: { question_id: questionIds } })).toBe(0)
    expect((await del('/api/quizzes', teacherA, { id: 987654 })).status).toBe(404)
  })
})

describe('bulk import', () => {
  const payload = () => ({
    categories: [{ category: 'Physics' }],
    titles: ['Grade 9'],
    quizzes: [
      { category: 'Physics', title: 'Motion', year: '2014', routeState: 'published', questions: [q('Speed unit?', 1), q('Force unit?', 0)] },
      { category: 'Physics', title: 'Light', year: '2014', routeState: 'draft', questions: [q('Speed of light?', 2)] },
    ],
  })

  test('a dry run validates and reports counts without storing anything', async () => {
    const before = await models.Quiz.count()
    const res = await post('/api/quizzes/import', teacherA, { ...payload(), dry_run: true })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ dry_run: true, quizzes: 2, questions: 3 })
    expect(await models.Quiz.count()).toBe(before)
    expect(await models.QuizCategory.count({ where: { category: 'Physics' } })).toBe(0)
    const bad = payload(); bad.quizzes[1].questions[0].answers[0].correct = true
    expect((await post('/api/quizzes/import', teacherA, { ...bad, dry_run: true })).status).toBe(400)
  })

  test('the real import is attributed to the importer, and the published quiz is served to students', async () => {
    const res = await post('/api/quizzes/import', teacherA, payload())
    expect(res.status).toBe(201)
    const motion = await models.Quiz.findOne({ where: { title: 'Motion' } })
    expect(motion.added_by).toBe(teacherA.user.id)
    expect((await get(`/api/quizzes/${motion.id}`, teacherB)).status).toBe(401)
    const list = (await http.get('/quiz/get_quizzes.php?search=Motion')).body.data
    expect(list).toHaveLength(1)
    expect((await http.get('/quiz/get_quizzes.php?search=Light')).body.data).toEqual([]) // draft
  })
})

describe('scoring and results', () => {
  let quizId, details

  beforeAll(async () => {
    const res = await post('/api/quizzes', admin, {
      title: 'Scoring', routeState: 'published', pass_mark: 60,
      questions: [q('Q1', 0), q('Q2', 1), q('Q3', 2), q('Q4', 0), q('Q5', 1)],
    })
    quizId = res.body.id
    details = (await http.get(`/quiz/get_quiz_details.php?quiz_id=${quizId}`)).body
  })

  const pick = (indexes) => Object.fromEntries(details.questions.map((question, i) => [question.id, indexes[i] == null ? undefined : question.answers[indexes[i]].id]))
  const toAnswers = (picked) => Object.entries(picked).filter(([, a]) => a).map(([question_id, answer_id]) => ({ question_id: Number(question_id), answer_id }))
  const serverScore = async (answers, id = quizId) => (await http.post('/quiz/score').send({ quiz_id: id, answers })).body.result

  test.each([
    ['all correct', [0, 1, 2, 0, 1], 5, 100, true],
    ['exactly at the pass mark (3/5 = 60%)', [0, 1, 2, 2, 2], 3, 60, true],
    ['just below the pass mark (2/5 = 40%)', [0, 1, 1, 2, 2], 2, 40, false],
    ['nothing answered', [], 0, 0, false],
    ['all wrong', [1, 2, 0, 1, 0], 0, 0, false],
    ['partly answered (unanswered count as wrong)', [0, 1, null, null, null], 2, 40, false],
  ])('%s', async (_name, indexes, correct, percent, passed) => {
    const picked = pick(indexes)
    const onDevice = clientScore(details, picked)
    expect(onDevice).toMatchObject({ correct, percentage: percent, passed })
    const server = await serverScore(toAnswers(picked))
    expect(server).toMatchObject({ total: 5, correct, wrong: 5 - correct, percent, passed, pass_mark: 60 })
    // the server and the shipped app agree on every case
    expect(server).toMatchObject({ correct: onDevice.correct, percent: onDevice.percentage, passed: onDevice.passed })
  })

  test('without a pass mark the app default of 50% applies, on the device and on the server', async () => {
    const res = await post('/api/quizzes', admin, { title: 'No mark', routeState: 'published', questions: [q('A', 0), q('B', 0)] })
    const d = (await http.get(`/quiz/get_quiz_details.php?quiz_id=${res.body.id}`)).body
    const onlyFirst = { [d.questions[0].id]: d.questions[0].correct_answer }
    expect(clientScore(d, onlyFirst)).toMatchObject({ percentage: 50, passed: true })
    expect((await serverScore([{ question_id: d.questions[0].id, answer_id: d.questions[0].correct_answer }], res.body.id))).toMatchObject({ percent: 50, pass_mark: 50, passed: true })
  })

  test('the server ignores answers that do not belong to the question, duplicates and junk', async () => {
    const [q1, q2] = details.questions
    const result = await serverScore([
      { question_id: q1.id, answer_id: q2.correct_answer }, // an answer of another question
      { question_id: q2.id, answer_id: 'abc' },
      { question_id: 'x' }, null, 7,
      { question_id: q2.id, answer_id: q2.correct_answer }, // the last pick per question counts
    ])
    expect(result.correct).toBe(1)
    expect(result.details.find((d) => d.question_id === q1.id)).toMatchObject({ selected_answer_id: null, correct: false })
  })

  test('scoring a draft, unknown or missing quiz is refused; nothing is stored', async () => {
    const draft = await post('/api/quizzes', admin, { title: 'Draft', questions: [q('A')] })
    expect((await http.post('/quiz/score').send({ quiz_id: draft.body.id, answers: [] })).status).toBe(404)
    expect((await http.post('/quiz/score').send({ quiz_id: 424242, answers: [] })).status).toBe(404)
    expect((await http.post('/quiz/score').send({ answers: [] })).status).toBe(400)
  })

  test('scoreQuiz handles an empty quiz', () => {
    expect(scoreQuiz({ quiz: {}, questions: [], answers: [] })).toMatchObject({ total: 0, correct: 0, percent: 0, passed: false })
  })
})
