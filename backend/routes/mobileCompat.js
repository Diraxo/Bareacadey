/* Node replacements for the legacy PHP service that the mobile app called (api.joharacademy.com).
 *
 * Request/response shapes are taken from the app's own call sites (see migration-docs/04). Where the
 * original server-side rule could not be recovered, the behaviour is configurable and documented rather than guessed:
 *   /version/                     -> { app_version, min_build_android, min_build_ios }  (Config row 5; app_version = minimum Android build)
 *   /check/?device=&user_id=      -> { status: 'success' | 'denied' }     (now requires the caller's JWT)
 *   /block/  {user_id}            -> acknowledged; only acts when device_policy.blockOnLogout is enabled
 *   /quiz/get_quiz_categories.php -> { status:true, data:[{ id, category, image, total_quizzes }] }
 *   /quiz/get_titles.php          -> { status:true, data:[{ id, title }] }
 *   /quiz/get_quizzes.php         -> { status:true, data:[{ id, title, year, diff_level, max_questions, quiz_description }] }
 *   /quiz/get_quiz_details.php    -> { status:true, quiz:{...}, questions:[{ id, title, explanation, answers:[{id,title}], correct_answer }] } */
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const Sequelize = require('sequelize')
const { corsOptions } = require('../middlewares/credentials')
const verifyJWT = require('../middlewares/verifyJWT')
const { getMobileConfig } = require('../services/appConfig')
const { containsText } = require('../services/sqlLike')
const User = require('../models/User')
const devices = require('../services/devices')
const { scoreQuiz } = require('../services/quizScoring')
const { sendEmailLink } = require('../middlewares/emailController')
const { QuizCategory, QuizTitle, Quiz, QuizQuestion, QuizAnswer } = require('../models')

const router = express.Router()
router.use(cors(corsOptions))

/* This router is mounted at the app root, so without `skip` the limiter also counted every /api/* request
 * (admin uploads, dashboards, ...) against 120 requests per minute. /api has its own limiter in app.js. */
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false, skip: (req) => req.path.startsWith('/api/') })
router.use(limiter)

const fail = (res, status, message) => res.status(status).json({ status: false, message })

/* ---------------- app version ---------------- */
router.get('/version/', async (req, res) => {
  try {
    const { app_version, min_build_android, min_build_ios } = await getMobileConfig()
    res.json({ app_version, min_build_android, min_build_ios })
  } catch (e) {
    console.error('version lookup failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

/* ---------------- device check ---------------- */
router.get('/check/', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id
    // the legacy contract carried the user id in the query; it must match the authenticated caller
    if (req.query.user_id != null && String(req.query.user_id) !== String(userId)) {
      return res.status(403).json({ status: 'denied', message: 'User mismatch' })
    }
    const device = typeof req.query.device === 'string' ? req.query.device.trim() : ''
    if (!device || device.length > 255) return res.status(400).json({ status: 'denied', message: 'Device is required' })

    const user = await User.findOne({ where: { id: userId } })
    if (!user || user.active === false || user.blocked === true) {
      // `code` lets a client tell an account refusal from the optional "not the registered device" answer
      return res.json({ status: 'denied', code: 'account_not_allowed', message: 'Account is not allowed to sign in' })
    }

    const { device_policy } = await getMobileConfig()
    if (device_policy.mode === 'off') return res.json({ status: 'success' })

    return res.json(await devices.checkDevice({ userId, device, policy: device_policy }))
  } catch (e) {
    console.error('device check failed:', e?.message)
    res.status(500).json({ status: 'error', message: 'Something went wrong' })
  }
})

/* ---------------- device replacement by email ----------------
 * Signed-in user (password already proven) asks to make THIS device the registered one. The link goes to the account's
 * own mailbox; opening it (POST /api/auth/verify_new_device) performs the swap. */
const replaceLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => `device-replace:${req.user?.id || req.ip}` })
router.post('/device/replace/request', verifyJWT, replaceLimiter, async (req, res) => {
  try {
    const device = typeof req.body?.device === 'string' ? req.body.device.trim() : ''
    if (!device || device.length > 255) return res.status(400).json({ status: false, message: 'Device is required' })
    const user = await User.findOne({ where: { id: req.user.id } })
    if (!user || user.active === false || user.blocked === true) return res.status(401).json({ status: false, message: 'Account is not allowed to sign in' })
    const { device_policy } = await getMobileConfig()
    if (device_policy.mode === 'off') return res.json({ status: true, message: 'No device restriction is active' })
    const registered = await devices.registeredDevices(user.id)
    if (registered.some((d) => d.device === device)) return res.json({ status: true, message: 'This device is already registered' })
    const { allowed, retryAt } = devices.replacementWindow(registered, device_policy.replaceCooldownDays)
    if (!allowed) {
      return res.status(429).json({ status: false, code: 'cooldown', message: 'You changed device recently. Try again later or contact support.', self_replace_available_at: retryAt.toISOString() })
    }
    const token = devices.issueReplacementToken({ userId: user.id, device, devices: registered })
    const sent = await sendEmailLink({ send_to: user.email, token, type: 'new-device', username: user.full_name })
    if (!sent) return res.status(502).json({ status: false, message: 'The email could not be sent. Please contact support.' })
    res.json({ status: true, message: 'We emailed you a confirmation link. Open it, then sign in again on this device.' })
  } catch (e) {
    console.error('device replace request failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

/* ---------------- block on logout ---------------- */
router.post('/block/', verifyJWT, async (req, res) => {
  try {
    const { device_policy } = await getMobileConfig()
    if (!device_policy.blockOnLogout) return res.json({ status: 'ignored' })
    // only ever the caller's own account, never an id supplied by the client
    await User.update({ blocked: true }, { where: { id: req.user.id } })
    res.json({ status: 'success' })
  } catch (e) {
    console.error('block failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

/* ---------------- quizzes (public read, like the PHP originals) ---------------- */
const published = { routeState: 'published' }

router.get('/quiz/get_quiz_categories.php', async (req, res) => {
  try {
    const categories = await QuizCategory.findAll({ order: [['category', 'ASC']] })
    const counts = await Quiz.findAll({
      where: published,
      attributes: ['category_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']],
      group: ['category_id'],
      raw: true,
    })
    const totals = new Map(counts.map((c) => [c.category_id, Number(c.total)]))
    res.json({
      status: true,
      data: categories.map((c) => ({ id: c.id, category: c.category, image: c.image, total_quizzes: totals.get(c.id) || 0 })),
    })
  } catch (e) {
    console.error('quiz categories failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

router.get('/quiz/get_titles.php', async (req, res) => {
  try {
    const titles = await QuizTitle.findAll({ order: [['title', 'ASC']] })
    res.json({ status: true, data: titles.map((t) => ({ id: t.id, title: t.title })) })
  } catch (e) {
    console.error('quiz titles failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

router.get('/quiz/get_quizzes.php', async (req, res) => {
  try {
    const where = { ...published }
    const { search, year, category_id } = req.query
    if (typeof search === 'string' && search.trim()) {
      where[Sequelize.Op.and] = [containsText('`Quiz`.`title`', search.trim())]
    }
    if (typeof year === 'string' && year.trim() && year.toLowerCase() !== 'all') where.year = year.trim()
    if (category_id !== undefined && category_id !== '') {
      const id = parseInt(category_id, 10)
      if (!Number.isInteger(id)) return fail(res, 400, 'Invalid category_id')
      where.category_id = id
    }
    const quizzes = await Quiz.findAll({
      where,
      order: [['year', 'DESC'], ['title', 'ASC']],
      attributes: {
        include: [[Sequelize.literal('(SELECT COUNT(*) FROM QuizQuestions WHERE QuizQuestions.quiz_id = Quiz.id)'), 'max_questions']],
      },
    })
    res.json({
      status: true,
      data: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        year: q.year,
        diff_level: q.diff_level,
        max_questions: Number(q.get('max_questions')) || 0,
        quiz_description: q.quiz_description,
      })),
    })
  } catch (e) {
    console.error('quiz list failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

router.get('/quiz/get_quiz_details.php', async (req, res) => {
  try {
    const id = parseInt(req.query.quiz_id, 10)
    if (!Number.isInteger(id)) return fail(res, 400, 'quiz_id is required')
    const quiz = await Quiz.findOne({
      where: { id, ...published },
      include: [{ model: QuizQuestion, as: 'questions', include: [{ model: QuizAnswer, as: 'answers' }] }],
      order: [[{ model: QuizQuestion, as: 'questions' }, 'position', 'ASC'], [{ model: QuizQuestion, as: 'questions' }, 'id', 'ASC'], [{ model: QuizQuestion, as: 'questions' }, { model: QuizAnswer, as: 'answers' }, 'position', 'ASC'], [{ model: QuizQuestion, as: 'questions' }, { model: QuizAnswer, as: 'answers' }, 'id', 'ASC']],
    })
    if (!quiz) return fail(res, 404, 'Quiz not found')

    // The shipped app grades on the device and shows correct/incorrect after each answer,
    // so the correct answer id is part of the response contract.
    res.json({
      status: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        year: quiz.year,
        diff_level: quiz.diff_level,
        quiz_description: quiz.quiz_description,
        max_questions: quiz.questions.length,
        time: quiz.time,
        pass_mark: quiz.pass_mark,
      },
      questions: quiz.questions.map((q) => ({
        id: q.id,
        title: q.title,
        explanation: q.explanation,
        answers: q.answers.map((a) => ({ id: a.id, title: a.title })),
        correct_answer: q.answers.find((a) => a.is_correct)?.id ?? null,
      })),
    })
  } catch (e) {
    console.error('quiz details failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

/* New in Phase 3, not used by the shipped app (which scores on the device): server-side scoring with the same rules.
 * POST { quiz_id, answers: [{ question_id, answer_id }] } -> { status, result }. Stateless: no result is stored. */
router.post('/quiz/score', express.json({ limit: '100kb' }), async (req, res) => {
  try {
    const id = parseInt(req.body?.quiz_id, 10)
    if (!Number.isInteger(id)) return fail(res, 400, 'quiz_id is required')
    const quiz = await Quiz.findOne({
      where: { id, ...published },
      include: [{ model: QuizQuestion, as: 'questions', include: [{ model: QuizAnswer, as: 'answers' }] }],
    })
    if (!quiz) return fail(res, 404, 'Quiz not found')
    res.json({ status: true, result: scoreQuiz({ quiz, questions: quiz.questions, answers: req.body?.answers }) })
  } catch (e) {
    console.error('quiz scoring failed:', e?.message)
    fail(res, 500, 'Something went wrong')
  }
})

module.exports = router
