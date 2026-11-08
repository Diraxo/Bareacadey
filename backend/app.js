/* Express application factory. server.js adds the HTTP listener and Socket.IO; tests use this directly.
 *
 * Differences from the previous monolithic server.js (security-relevant ones are marked SEC):
 *  - SEC  no HTTP endpoint can sync/alter/drop the schema (the old unauthenticated /sync-database is gone);
 *  - SEC  uploaded files are served by routes/media.js with authorisation, not as a public static tree;
 *  - SEC  JSON bodies are capped (was 200 MB), uploads have size/type limits (see middlewares/safeUpload.js) and are
 *         authenticated BEFORE their body is read (middlewares/uploadGuard.js);
 *  - SEC  cookies are Secure/SameSite per configuration; each sign-in is its own refresh session (services/sessions.js), stored hashed;
 *  - SEC  the dead /api/pay test endpoint (hard-coded buyer data) is removed;
 *  - the OAuth flow no longer uses an in-memory server session. */
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const fs = require('fs')
const path = require('path')

const config = require('./config')
require('./models') // registers every model + association
const User = require('./models/User')
const sessions = require('./services/sessions')
const uploadGuard = require('./middlewares/uploadGuard')
const { TEMP_DIR } = require('./services/tempCleanup')
const { corsOptions, credentials } = require('./middlewares/credentials')
const mobileCredentials = require('./middlewares/mobileCredentials')
const verifyJWT = require('./middlewares/verifyJWT')
const errorHandler = require('./middlewares/errorHandler')

const createApp = () => {
  if (process.env.APP_TIMEZONE) process.env.TZ = process.env.APP_TIMEZONE

  const app = express()
  app.set('trust proxy', parseInt(process.env.TRUST_PROXY_HOPS, 10) || 1)
  app.disable('x-powered-by')

  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('Referrer-Policy', 'same-origin')
    res.set('X-Frame-Options', 'DENY')
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
    res.set('Cross-Origin-Opener-Policy', 'same-origin')
    next()
  })

  app.get('/', (req, res) => res.send('Welcome to System'))
  /* /healthz         the process answers, and which release it is running (the RELEASE file shipped in the package);
   * /healthz?deep=1   also reads one row of the main tables through the models, so a database that no longer matches the
   *                   running code (a missing or removed column) answers 503 instead of failing later for a real user. */
  const RELEASE = (() => { try { return fs.readFileSync(path.join(__dirname, 'RELEASE'), 'utf8').trim() } catch (e) { return 'unknown' } })()
  app.get('/healthz', async (req, res) => {
    if (req.query.deep === undefined) return res.json({ status: 'ok', release: RELEASE })
    try {
      const m = require('./models')
      await Promise.all([m.User, m.RefreshSession, m.UploadBatchFile, m.Chapter, m.Course].map((M) => M.findOne()))
      res.json({ status: 'ok', release: RELEASE, schema: 'ok' })
    } catch (e) {
      console.error('healthz deep check failed:', e?.message)
      res.status(503).json({ status: 'schema_mismatch', release: RELEASE })
    }
  })

  app.use(cookieParser())
  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ limit: '5mb', extended: false }))

  /* Routes that must stay reachable without the browser Origin / mobile header gate. They authorise by themselves. */
  app.use(require('./routes/media'))
  app.use('/api/open_public', require('./controllers/common/OpenPublicController'))
  app.use(require('./routes/mobileCompat'))

  /* ---------------- Google sign-in ---------------- */
  const googleEnabled = !!(config.google.clientId && config.google.clientSecret)
  if (googleEnabled) {
    passport.use(new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: (config.urls.api || '') + '/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => done(null, profile)
    ))
  }
  app.use(passport.initialize())

  app.get('/auth/google', (req, res, next) => {
    if (!googleEnabled) return res.status(503).json({ error: true, message: 'Google sign-in is not configured' })
    return passport.authenticate('google', { scope: ['profile', 'email'], session: false, failureRedirect: config.urls.frontend + '/auth/login' })(req, res, next)
  })

  app.get('/auth/google/callback',
    (req, res, next) => {
      if (!googleEnabled) return res.status(503).json({ error: true, message: 'Google sign-in is not configured' })
      return passport.authenticate('google', { session: false, failureRedirect: config.urls.frontend + '/auth/login' })(req, res, next)
    },
    async (req, res) => {
      try {
        const email = req.user?.emails?.[0]?.value
        const user = email ? await User.findOne({ where: { email } }) : null
        if (!user || user.active === false) {
          return res.redirect(`${config.urls.frontend}/auth/login?e=1`)
        }
        const { token: refreshToken } = await sessions.createSession(user.id, { userAgent: req.headers['user-agent'] })
        sessions.setRefreshCookie(res, refreshToken)
        res.redirect(`${config.urls.frontend}/auth/login`)
      } catch (err) {
        console.error('Error during Google OAuth callback:', err?.message)
        res.redirect(`${config.urls.frontend}/auth/login`)
      }
    }
  )

  /* ---------------- gated API ---------------- */
  app.use(require('./realtime/socket').catalogBroadcaster(app))
  app.use(credentials)
  app.use(cors(corsOptions))
  app.use(mobileCredentials)
  app.use('/api', (req, res, next) => { res.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'"); res.set('Cache-Control', 'no-store'); next() })
  app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }))

  /* Multipart bodies are accepted only after CORS/Origin, rate limiting and (for protected routes) authentication, so a
   * rejected request never creates a temporary file. See middlewares/uploadGuard.js. */
  fs.mkdirSync(TEMP_DIR, { recursive: true })
  app.use('/api', ...uploadGuard)

  app.use('/api/auth', require('./controllers/auth/AuthController'))
  app.use('/api/user/token', require('./controllers/auth/RefreshTokenController'))
  app.use('/api/public', require('./controllers/common/PublicController'))
  app.use('/api/contacts_public', require('./controllers/ContactController').publicRoute)

  app.use(verifyJWT)
  app.use('/api/dashboards', require('./controllers/common/DashboardController'))
  app.use('/api/user', require('./controllers/auth/LogoutController'))
  app.use('/api/users', require('./controllers/UserController'))
  app.use('/api/roles', require('./controllers/RoleController'))
  app.use('/api/activities', require('./controllers/ActivityController'))
  app.use('/api/notifications', require('./controllers/NotificationController'))
  app.use('/api/system_config', require('./controllers/common/SystemConfigController'))
  app.use('/api/chats', require('./controllers/ChatController'))
  app.use('/api/chatuploads', require('./controllers/ChatUploadController'))

  app.use('/api/employeecategories', require('./controllers/EmployeeCategoryController'))
  app.use('/api/employeepositions', require('./controllers/EmployeePositionController'))
  app.use('/api/departments', require('./controllers/DepartmentController'))
  app.use('/api/landingpagecontents', require('./controllers/LandingPageContentController'))
  app.use('/api/services', require('./controllers/ServiceController'))
  app.use('/api/faqs', require('./controllers/FaqController'))
  app.use('/api/mytasks', require('./controllers/MyTaskController'))
  app.use('/api/contacts', require('./controllers/ContactController'))
  app.use('/api/quizzes', require('./controllers/QuizController'))
  app.use('/api/instructors', require('./controllers/InstructorController'))
  app.use('/api/devices', require('./controllers/DeviceController'))

  require('./modules/index')(app) // courses, chapters, categories, payments, ratings, carousel, trending

  app.all('*', (req, res) => res.status(404).send('Error 404'))
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
