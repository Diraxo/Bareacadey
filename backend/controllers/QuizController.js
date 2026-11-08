/* Administration API for quiz content (categories, grade titles, quizzes with questions and answers).
 * Quiz content could not be recovered from the old system, so this is how the academy (re)creates it:
 * either one quiz at a time or in bulk through POST /import. Nothing here ever fabricates data. */
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const db = require('../database')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")
const { QuizCategory, QuizTitle, Quiz, QuizQuestion, QuizAnswer } = require('../models')
const { canManageAll } = require('../services/courseAccess')

const MAX_QUESTIONS = 500
const MAX_ANSWERS = 10
const clean = (v, max = 255) => (typeof v === 'string' ? v.trim().slice(0, max) : v)

/* One question with its answers: at least two answers, every answer titled, exactly one marked correct. */
const validateQuestion = (question, label = 'Question') => {
  if (typeof question?.title !== 'string' || !question.title.trim()) return `${label}: title is required`
  if (!Array.isArray(question.answers) || question.answers.length < 2) return `${label}: at least two answers are required`
  if (question.answers.length > MAX_ANSWERS) return `${label}: at most ${MAX_ANSWERS} answers are allowed`
  if (question.answers.some((a) => typeof a?.title !== 'string' || !a.title.trim())) return `${label}: every answer needs a title`
  if (question.answers.filter((a) => a.correct === true).length !== 1) return `${label}: exactly one answer must have "correct": true`
  return null
}

/* Returns an error message, or null when the quiz payload is acceptable. */
const validateQuiz = (q, { requireQuestions }) => {
  if (!q || typeof q !== 'object') return 'Invalid quiz'
  if (typeof q.title !== 'string' || !q.title.trim()) return 'Quiz title is required'
  if (q.time != null && !(Number.isInteger(q.time) && q.time > 0)) return 'time must be a positive number of seconds'
  if (q.pass_mark != null && !(Number.isInteger(q.pass_mark) && q.pass_mark >= 0 && q.pass_mark <= 100)) return 'pass_mark must be between 0 and 100'
  if (q.questions === undefined) return requireQuestions ? 'questions are required' : null
  if (!Array.isArray(q.questions) || q.questions.length > MAX_QUESTIONS) return 'questions must be a list of at most ' + MAX_QUESTIONS
  for (const [i, question] of q.questions.entries()) {
    const problem = validateQuestion(question, `Question ${i + 1}`)
    if (problem) return problem
  }
  return null
}

const writeQuestions = async (quizId, questions, transaction) => {
  for (const [qi, question] of questions.entries()) {
    const created = await QuizQuestion.create(
      { quiz_id: quizId, title: question.title.trim(), explanation: question.explanation ?? null, position: qi },
      { transaction }
    )
    await QuizAnswer.bulkCreate(
      question.answers.map((a, ai) => ({ question_id: created.id, title: a.title.trim(), is_correct: a.correct === true, position: ai })),
      { transaction }
    )
  }
}

const quizFields = (q, userId) => ({
  title: clean(q.title),
  year: q.year != null ? clean(q.year, 50) : null,
  diff_level: q.diff_level != null ? clean(q.diff_level, 50) : null,
  quiz_description: q.quiz_description ?? null,
  time: q.time ?? null,
  pass_mark: q.pass_mark ?? null,
  category_id: q.category_id ?? null,
  routeState: q.routeState === 'published' ? 'published' : 'draft',
  added_by: userId,
})

const respondError = (res, e) => {
  console.error('Quiz API error:', e?.message)
  return res.status(500).json({ error: true, message: 'Something went wrong' })
}

// 401 rather than 403: the apps treat 403 as an expired token
const forbidden = (res) => res.status(401).json({ error: true, message: 'You can only change quizzes you created' })
/* Instructors work on their own quizzes; "Manage All Courses" (administrators) works on all of them. */
const mayEdit = (req, quiz) => canManageAll(req.user) || (quiz.added_by != null && quiz.added_by === req.user.id)
const adminOnly = (req, res, next) => (canManageAll(req.user) ? next() : res.status(401).json({ error: true, message: 'Only administrators can change shared categories and grade titles' }))

/* ---------- categories ---------- */
route.get('/categories', verifyRoles(Roles.quiz_findAllRoles), async (req, res) => {
  try { res.json(await QuizCategory.findAll({ order: [['category', 'ASC']] })) } catch (e) { respondError(res, e) }
})
route.post('/categories', verifyRoles(Roles.quiz_createRoles), async (req, res) => {
  try {
    if (!clean(req.body.category)) return res.status(400).json({ error: true, message: 'category is required' })
    const created = await QuizCategory.create({ category: clean(req.body.category), image: req.body.image ?? null })
    res.status(201).json(created)
  } catch (e) { respondError(res, e) }
})
route.put('/categories', verifyRoles(Roles.quiz_saveRoles), adminOnly, async (req, res) => {
  try {
    const item = await QuizCategory.findOne({ where: { id: req.body.id } })
    if (!item) return res.status(404).json({ error: true, message: 'Not found' })
    if (req.body.category != null) item.category = clean(req.body.category)
    if (req.body.image !== undefined) item.image = req.body.image
    await item.save()
    res.json({ message: 'Successfully Updated' })
  } catch (e) { respondError(res, e) }
})
route.delete('/categories', verifyRoles(Roles.quiz_destroyRoles), adminOnly, async (req, res) => {
  try {
    await QuizCategory.destroy({ where: { id: req.body.id } })
    res.json({ message: 'Successfully Deleted' })
  } catch (e) { respondError(res, e) }
})

/* ---------- grade titles ---------- */
route.get('/titles', verifyRoles(Roles.quiz_findAllRoles), async (req, res) => {
  try { res.json(await QuizTitle.findAll({ order: [['title', 'ASC']] })) } catch (e) { respondError(res, e) }
})
route.post('/titles', verifyRoles(Roles.quiz_createRoles), async (req, res) => {
  try {
    if (!clean(req.body.title)) return res.status(400).json({ error: true, message: 'title is required' })
    res.status(201).json(await QuizTitle.create({ title: clean(req.body.title) }))
  } catch (e) { respondError(res, e) }
})
route.delete('/titles', verifyRoles(Roles.quiz_destroyRoles), adminOnly, async (req, res) => {
  try {
    await QuizTitle.destroy({ where: { id: req.body.id } })
    res.json({ message: 'Successfully Deleted' })
  } catch (e) { respondError(res, e) }
})

/* ---------- bulk import ----------
 * { categories?: [{category, image?}], titles?: [string], quizzes: [{ category?: name, title, year, ..., questions:[...] }] }
 * All-or-nothing: either everything is stored or nothing is. */
route.post('/import', verifyRoles(Roles.quiz_createRoles), async (req, res) => {
  const { categories = [], titles = [], quizzes } = req.body || {}
  if (!Array.isArray(quizzes) || quizzes.length === 0) return res.status(400).json({ error: true, message: 'quizzes must be a non-empty list' })
  for (const [i, q] of quizzes.entries()) {
    const problem = validateQuiz(q, { requireQuestions: true })
    if (problem) return res.status(400).json({ error: true, message: `Quiz ${i + 1}: ${problem}` })
  }
  if (req.body.dry_run === true) {
    const questions = quizzes.reduce((n, q) => n + q.questions.length, 0)
    return res.json({ message: 'Valid. Nothing was stored (dry run).', dry_run: true, quizzes: quizzes.length, questions })
  }
  const t = await db.transaction()
  try {
    const categoryIds = new Map()
    const ensureCategory = async (name, image) => {
      const key = clean(name)
      if (!key) return null
      if (categoryIds.has(key)) return categoryIds.get(key)
      const [row] = await QuizCategory.findOrCreate({ where: { category: key }, defaults: { image: image ?? null }, transaction: t })
      categoryIds.set(key, row.id)
      return row.id
    }
    for (const c of categories) await ensureCategory(c?.category, c?.image)
    for (const title of titles) {
      if (clean(title)) await QuizTitle.findOrCreate({ where: { title: clean(title) }, transaction: t })
    }
    let questionCount = 0
    for (const q of quizzes) {
      const category_id = q.category ? await ensureCategory(q.category) : null
      const quiz = await Quiz.create({ ...quizFields({ ...q, category_id }, req.user.id), routeState: q.routeState === 'draft' ? 'draft' : 'published' }, { transaction: t })
      await writeQuestions(quiz.id, q.questions, t)
      questionCount += q.questions.length
    }
    await t.commit()
    res.status(201).json({ message: 'Imported', quizzes: quizzes.length, questions: questionCount })
  } catch (e) {
    await t.rollback()
    respondError(res, e)
  }
})

/* ---------- quizzes ---------- */
route.get('/', verifyRoles(Roles.quiz_findAllRoles), async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      where: canManageAll(req.user) ? {} : { added_by: req.user.id },
      order: [['id', 'DESC']],
      attributes: { include: [[Sequelize.literal('(SELECT COUNT(*) FROM QuizQuestions WHERE QuizQuestions.quiz_id = Quiz.id)'), 'question_count']] },
    })
    res.json(quizzes)
  } catch (e) { respondError(res, e) }
})

route.get('/:id', verifyRoles(Roles.quiz_findOneRoles), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isInteger(id)) return res.status(400).json({ error: true, message: 'Invalid id' })
    const quiz = await Quiz.findOne({
      where: { id },
      include: [{ model: QuizQuestion, as: 'questions', include: [{ model: QuizAnswer, as: 'answers' }] }],
      order: [[{ model: QuizQuestion, as: 'questions' }, 'position', 'ASC'], [{ model: QuizQuestion, as: 'questions' }, { model: QuizAnswer, as: 'answers' }, 'position', 'ASC']],
    })
    if (!quiz) return res.status(404).json({ error: true, message: 'Not found' })
    if (!mayEdit(req, quiz)) return forbidden(res)
    res.json(quiz)
  } catch (e) { respondError(res, e) }
})

route.post('/', verifyRoles(Roles.quiz_createRoles), async (req, res) => {
  const problem = validateQuiz(req.body, { requireQuestions: false })
  if (problem) return res.status(400).json({ error: true, message: problem })
  if (req.body.routeState === 'published' && !(req.body.questions?.length > 0)) {
    return res.status(400).json({ error: true, message: 'A quiz needs at least one question before it can be published' })
  }
  const t = await db.transaction()
  try {
    const quiz = await Quiz.create(quizFields(req.body, req.user.id), { transaction: t })
    if (req.body.questions) await writeQuestions(quiz.id, req.body.questions, t)
    await t.commit()
    res.status(201).json({ message: 'Successfully Created', id: quiz.id })
  } catch (e) {
    await t.rollback()
    respondError(res, e)
  }
})

route.put('/', verifyRoles(Roles.quiz_saveRoles), async (req, res) => {
  const problem = validateQuiz(req.body, { requireQuestions: false })
  if (problem) return res.status(400).json({ error: true, message: problem })
  const t = await db.transaction()
  try {
    const quiz = await Quiz.findOne({ where: { id: req.body.id }, transaction: t })
    if (!quiz) { await t.rollback(); return res.status(404).json({ error: true, message: 'Not found' }) }
    if (!mayEdit(req, quiz)) { await t.rollback(); return forbidden(res) }
    const { added_by, ...fields } = quizFields(req.body, req.user.id)
    if (!req.body.routeState) delete fields.routeState // editing details must not silently unpublish
    if ((fields.routeState ?? quiz.routeState) === 'published') {
      const count = req.body.questions ? req.body.questions.length : await QuizQuestion.count({ where: { quiz_id: quiz.id }, transaction: t })
      if (count === 0) { await t.rollback(); return res.status(400).json({ error: true, message: 'A quiz needs at least one question before it can be published' }) }
    }
    await quiz.update(fields, { transaction: t })
    if (req.body.questions) {
      // replace the whole question list (answers cascade)
      const old = await QuizQuestion.findAll({ where: { quiz_id: quiz.id }, attributes: ['id'], transaction: t })
      await QuizAnswer.destroy({ where: { question_id: old.map((o) => o.id) }, transaction: t })
      await QuizQuestion.destroy({ where: { quiz_id: quiz.id }, transaction: t })
      await writeQuestions(quiz.id, req.body.questions, t)
    }
    await t.commit()
    res.json({ message: 'Successfully Updated' })
  } catch (e) {
    await t.rollback()
    respondError(res, e)
  }
})

route.delete('/', verifyRoles(Roles.quiz_destroyRoles), async (req, res) => {
  const t = await db.transaction()
  try {
    const target = await Quiz.findOne({ where: { id: req.body.id }, transaction: t })
    if (!target) { await t.rollback(); return res.status(404).json({ error: true, message: 'Not found' }) }
    if (!mayEdit(req, target)) { await t.rollback(); return forbidden(res) }
    const old = await QuizQuestion.findAll({ where: { quiz_id: req.body.id }, attributes: ['id'], transaction: t })
    await QuizAnswer.destroy({ where: { question_id: old.map((o) => o.id) }, transaction: t })
    await QuizQuestion.destroy({ where: { quiz_id: req.body.id }, transaction: t })
    await Quiz.destroy({ where: { id: req.body.id }, transaction: t })
    await t.commit()
    res.json({ message: 'Successfully Deleted' })
  } catch (e) {
    await t.rollback()
    respondError(res, e)
  }
})

/* ---------- single questions (ids stay stable, so editing one question never disturbs the others) ---------- */
const loadQuestion = async (req, res) => {
  const id = parseInt(req.params.qid, 10)
  const question = Number.isInteger(id) ? await QuizQuestion.findOne({ where: { id }, include: [{ model: QuizAnswer, as: 'answers' }] }) : null
  if (!question) { res.status(404).json({ error: true, message: 'Not found' }); return null }
  const quiz = await Quiz.findOne({ where: { id: question.quiz_id } })
  if (!quiz || !mayEdit(req, quiz)) { forbidden(res); return null }
  return { question, quiz }
}

route.post('/:id/questions', verifyRoles(Roles.quiz_saveRoles), async (req, res) => {
  const t = await db.transaction()
  try {
    const quiz = await Quiz.findOne({ where: { id: parseInt(req.params.id, 10) || 0 }, transaction: t })
    if (!quiz) { await t.rollback(); return res.status(404).json({ error: true, message: 'Not found' }) }
    if (!mayEdit(req, quiz)) { await t.rollback(); return forbidden(res) }
    const problem = validateQuestion(req.body)
    if (problem) { await t.rollback(); return res.status(400).json({ error: true, message: problem }) }
    const count = await QuizQuestion.count({ where: { quiz_id: quiz.id }, transaction: t })
    if (count >= MAX_QUESTIONS) { await t.rollback(); return res.status(400).json({ error: true, message: `A quiz can have at most ${MAX_QUESTIONS} questions` }) }
    const last = await QuizQuestion.max('position', { where: { quiz_id: quiz.id }, transaction: t })
    const created = await QuizQuestion.create({ quiz_id: quiz.id, title: req.body.title.trim(), explanation: req.body.explanation ?? null, position: (last ?? -1) + 1 }, { transaction: t })
    await QuizAnswer.bulkCreate(req.body.answers.map((a, i) => ({ question_id: created.id, title: a.title.trim(), is_correct: a.correct === true, position: i })), { transaction: t })
    await t.commit()
    res.status(201).json({ message: 'Question added', id: created.id })
  } catch (e) { await t.rollback(); respondError(res, e) }
})

/* Answers carrying an `id` of this question are updated in place, answers without one are added, the rest are removed. */
route.put('/questions/:qid', verifyRoles(Roles.quiz_saveRoles), async (req, res) => {
  const t = await db.transaction()
  try {
    const found = await loadQuestion(req, res)
    if (!found) { await t.rollback(); return }
    const { question } = found
    const problem = validateQuestion(req.body)
    if (problem) { await t.rollback(); return res.status(400).json({ error: true, message: problem }) }
    const own = new Map(question.answers.map((a) => [a.id, a]))
    if (req.body.answers.some((a) => a.id != null && !own.has(Number(a.id)))) {
      await t.rollback(); return res.status(400).json({ error: true, message: 'An answer does not belong to this question' })
    }
    await question.update({ title: req.body.title.trim(), explanation: req.body.explanation ?? null, ...(Number.isInteger(req.body.position) ? { position: req.body.position } : {}) }, { transaction: t })
    const keep = new Set(req.body.answers.filter((a) => a.id != null).map((a) => Number(a.id)))
    await QuizAnswer.destroy({ where: { question_id: question.id, id: question.answers.map((a) => a.id).filter((id) => !keep.has(id)) }, transaction: t })
    for (const [i, a] of req.body.answers.entries()) {
      const values = { title: a.title.trim(), is_correct: a.correct === true, position: i }
      if (a.id != null) await own.get(Number(a.id)).update(values, { transaction: t })
      else await QuizAnswer.create({ ...values, question_id: question.id }, { transaction: t })
    }
    await t.commit()
    res.json({ message: 'Question updated' })
  } catch (e) { await t.rollback(); respondError(res, e) }
})

route.delete('/questions/:qid', verifyRoles(Roles.quiz_destroyRoles), async (req, res) => {
  const t = await db.transaction()
  try {
    const found = await loadQuestion(req, res)
    if (!found) { await t.rollback(); return }
    const { question, quiz } = found
    const remaining = await QuizQuestion.count({ where: { quiz_id: quiz.id }, transaction: t })
    if (remaining <= 1 && quiz.routeState === 'published') {
      await t.rollback(); return res.status(400).json({ error: true, message: 'Unpublish the quiz before removing its last question' })
    }
    await QuizAnswer.destroy({ where: { question_id: question.id }, transaction: t })
    await question.destroy({ transaction: t })
    await t.commit()
    res.json({ message: 'Question deleted' })
  } catch (e) { await t.rollback(); respondError(res, e) }
})

module.exports = route
module.exports.validateQuestion = validateQuestion
module.exports.validateQuiz = validateQuiz
