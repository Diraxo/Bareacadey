const fs = require('fs')
const path = require('path')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')

/* Loads the browser-side import helpers (ES module) under CommonJS. */
const source = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'admin', 'Quizzes', 'quizImport.js'), 'utf8').replace(/^export (const|function)/gm, '$1')
// eslint-disable-next-line no-new-func
const lib = new Function(`${source}; return { parseCsv, csvToPayload, jsonToPayload, parseImportFile, summarize, SAMPLE_CSV, SAMPLE_JSON }`)()

let http, teacher
beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  teacher = await makeUser('teacher@example.com', 'instructor')
})

const HEADER = 'quiz_title,category,year,diff_level,description,time_minutes,pass_mark,question,explanation,answer_1,answer_2,answer_3,answer_4,correct'

describe('CSV parsing', () => {
  test('quoted commas, doubled quotes, line breaks inside quotes, CRLF and a BOM', () => {
    const rows = lib.parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n"two\nlines",z\r\n')
    expect(rows).toEqual([['a', 'b'], ['x, y', 'say "hi"'], ['two\nlines', 'z']])
  })
  test('blank lines are ignored', () => expect(lib.parseCsv('a,b\n\n,\nc,d\n')).toEqual([['a', 'b'], ['c', 'd']]))
})

describe('CSV -> import payload', () => {
  test('the downloadable template is valid and becomes one quiz with two questions', () => {
    const { payload, errors } = lib.csvToPayload(lib.SAMPLE_CSV)
    expect(errors).toEqual([])
    expect(lib.summarize(payload)).toEqual({ quizzes: 1, questions: 2 })
    const quiz = payload.quizzes[0]
    expect(quiz).toMatchObject({ title: 'Grade 12 Biology', category: 'Biology', year: '2013/2014', time: 600, pass_mark: 60, routeState: 'draft' })
    expect(quiz.questions[0].answers.map((a) => a.correct)).toEqual([false, true, false]) // letter B
    expect(quiz.questions[1].answers.map((a) => a.correct)).toEqual([false, true, false, false]) // number 2
  })

  test.each([
    ['missing column', 'quiz_title,question\nx,y', /Missing column/],
    ['no rows', HEADER, /no data rows/],
    ['empty question', `${HEADER}\nQ,,,,,,,,,a,b,,,A`, /Row 2: question is empty/],
    ['one answer', `${HEADER}\nQ,,,,,,,What?,,a,,,,A`, /Row 2: at least two answers/],
    ['correct points at an empty answer', `${HEADER}\nQ,,,,,,,What?,,a,b,,,C`, /Row 2: "correct" must be/],
    ['correct out of range', `${HEADER}\nQ,,,,,,,What?,,a,b,,,9`, /Row 2: "correct" must be/],
    ['bad pass mark', `${HEADER}\nQ,,,,,,150,What?,,a,b,,,A`, /pass_mark must be a whole number/],
  ])('%s is reported with its row number and nothing is produced', (_n, csv, message) => {
    const { payload, errors } = lib.csvToPayload(csv)
    expect(payload).toBeNull()
    expect(errors.join(' ')).toMatch(message)
  })

  test('rows of the same title+category+year are one quiz; different years are different quizzes', () => {
    const csv = [HEADER, 'Math,,2014,,,,,Q1,,a,b,,,A', 'Math,,2014,,,,,Q2,,a,b,,,B', 'Math,,2015,,,,,Q3,,a,b,,,A'].join('\n')
    expect(lib.summarize(lib.csvToPayload(csv).payload)).toEqual({ quizzes: 2, questions: 3 })
  })
})

describe('JSON files', () => {
  test('a bare list or the full object are accepted; junk is explained', () => {
    expect(lib.jsonToPayload('[{"title":"x","questions":[]}]').payload.quizzes).toHaveLength(1)
    expect(lib.jsonToPayload(lib.SAMPLE_JSON).errors).toEqual([])
    expect(lib.jsonToPayload('{nope').errors[0]).toMatch(/Not valid JSON/)
    expect(lib.jsonToPayload('{"quizzes":[]}').errors[0]).toMatch(/at least one quiz/)
    expect(lib.parseImportFile(lib.SAMPLE_CSV, 'quiz.CSV').errors).toEqual([])
    expect(lib.parseImportFile(lib.SAMPLE_JSON, 'quiz.json').errors).toEqual([])
  })
})

describe('what the screens produce is accepted by the server', () => {
  const post = (body) => http.post('/api/quizzes/import').set(MOBILE).set(teacher.auth).send(body)

  test.each([['CSV template', () => lib.csvToPayload(lib.SAMPLE_CSV).payload], ['JSON template', () => lib.jsonToPayload(lib.SAMPLE_JSON).payload]])('%s: dry run stores nothing, import stores everything', async (_n, make) => {
    const before = await models.Quiz.count()
    const dry = await post({ ...make(), dry_run: true })
    expect(dry.status).toBe(200)
    expect(await models.Quiz.count()).toBe(before)
    const real = await post(make())
    expect(real.status).toBe(201)
    expect(await models.Quiz.count()).toBe(before + 1)
  })

  test('a CSV with a UTF-8 (Amharic) quiz round-trips intact', async () => {
    const csv = `${HEADER}\nባዮሎጂ,,2016,,,,,የሴል ኃይል ማመንጫ ምንድን ነው?,,ኒውክሊየስ,ሚቶኮንድሪያ,,,B`
    const { payload } = lib.csvToPayload(csv)
    expect((await post(payload)).status).toBe(201)
    const stored = await models.QuizQuestion.findOne({ where: { title: 'የሴል ኃይል ማመንጫ ምንድን ነው?' }, include: [{ model: models.QuizAnswer, as: 'answers' }] })
    expect(stored.answers.find((a) => a.is_correct).title).toBe('ሚቶኮንድሪያ')
  })
})
