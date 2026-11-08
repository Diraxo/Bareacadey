/* Single source of truth for environment-driven configuration.
 * Nothing in here has a production default for a secret: missing secrets make the
 * process refuse to start in production instead of silently using a known value. */
require('./loadEnv')

const env = process.env
const isProduction = env.NODE_ENV === 'production'
const isTest = env.NODE_ENV === 'test'

const stripSlash = (v) => (v ? String(v).trim().replace(/\/+$/, '') : '')
const list = (v) => String(v || '').split(',').map((s) => stripSlash(s)).filter(Boolean)

const { revokedProblems } = require('../services/revokedSecrets')

const PLACEHOLDER = /^(change[-_ ]?me|replace[-_ ]?me|your[-_ ]|<.*>|xxx+|todo)/i

const SECRET_KEYS = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'SESSION_SECRET', 'MEDIA_TOKEN_SECRET']

/* Returns a list of human readable problems; empty list means the config is usable. */
const validate = (e = env, production = isProduction) => {
  const problems = []
  const need = (key) => {
    if (!e[key] || !String(e[key]).trim()) problems.push(`${key} is not set`)
  }
  ;['DB_NAME', 'DB_USER', 'FRONTEND_URL', 'API_PUBLIC_URL', ...SECRET_KEYS].forEach(need)
  if (!e.ACCESS_TOKEN_EXPIRES_IN) problems.push('ACCESS_TOKEN_EXPIRES_IN is not set')
  if (!e.REFRESH_TOKEN_EXPIRES_IN) problems.push('REFRESH_TOKEN_EXPIRES_IN is not set')
  SECRET_KEYS.forEach((key) => {
    const v = e[key]
    if (!v) return
    if (production && String(v).length < 32) problems.push(`${key} must be at least 32 characters in production`)
    if (PLACEHOLDER.test(String(v))) problems.push(`${key} still contains a placeholder value`)
  })
  const secrets = SECRET_KEYS.map((k) => e[k]).filter(Boolean)
  if (new Set(secrets).size !== secrets.length) problems.push('ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, SESSION_SECRET and MEDIA_TOKEN_SECRET must all be different')
  if (production) {
    if (!e.DB_PASSWORD) problems.push('DB_PASSWORD is not set')
    if (e.API_PUBLIC_URL && !/^https:\/\//i.test(e.API_PUBLIC_URL)) problems.push('API_PUBLIC_URL must be https in production')
    if (e.FRONTEND_URL && !/^https:\/\//i.test(e.FRONTEND_URL)) problems.push('FRONTEND_URL must be https in production')
    // credentials that were exposed in the original deliverable must not be reused by a new installation
    problems.push(...revokedProblems(e, null))
  }
  return problems
}

const build = () => {
  const frontendUrl = stripSlash(env.FRONTEND_URL)
  const apiPublicUrl = stripSlash(env.API_PUBLIC_URL)
  const devOrigins = isProduction ? [] : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8081']
  const allowedOrigins = Array.from(new Set([frontendUrl, ...list(env.CORS_ALLOWED_ORIGINS), ...devOrigins].filter(Boolean)))

  return {
    env: env.NODE_ENV || 'development',
    isProduction,
    isTest,
    port: parseInt(env.PORT, 10) || 4000,
    // public URLs (never derived from request headers)
    urls: {
      frontend: frontendUrl,
      api: apiPublicUrl,
      // Socket.IO is served by the same process/origin as the API
      socket: stripSlash(env.SOCKET_PUBLIC_URL) || apiPublicUrl,
      media: stripSlash(env.MEDIA_PUBLIC_URL) || apiPublicUrl,
    },
    allowedOrigins,
    secrets: {
      accessToken: env.ACCESS_TOKEN_SECRET,
      refreshToken: env.REFRESH_TOKEN_SECRET,
      session: env.SESSION_SECRET,
      media: env.MEDIA_TOKEN_SECRET,
    },
    tokens: {
      accessExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
      refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
      mediaExpiresInSeconds: parseInt(env.MEDIA_TOKEN_TTL_SECONDS, 10) || 6 * 60 * 60,
    },
    cookies: {
      secure: isProduction,
      // Web app and API are on different sites in the planned layout, so production needs None+Secure.
      sameSite: env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax'),
    },
    mobile: {
      // Header value shipped inside already-released app builds. Obscurity only; never treat as authentication.
      appKey: env.MOBILE_APP_KEY || '',
      userAgentToken: env.MOBILE_UA_TOKEN || 'rnafm',
    },
    chapa: {
      secretKey: env.CHAPA_AUTH,
      initializeUrl: env.CHAPA_URL || 'https://api.chapa.co/v1/transaction/initialize',
      verifyUrl: env.CHAPA_VERIFY_URL || 'https://api.chapa.co/v1/transaction/verify/',
      // optional: secret configured in the Chapa dashboard for webhook signatures
      webhookSecret: env.CHAPA_WEBHOOK_SECRET || '',
    },
    google: {
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
    },
    hls: {
      // ffmpeg task server is internal only
      host: env.HLS_HOST || '127.0.0.1',
      port: parseInt(env.HLS_PORT, 10) || 5000,
    },
    upload: {
      maxFileBytes: parseInt(env.UPLOAD_MAX_FILE_BYTES, 10) || 1024 * 1024 * 1024, // course videos can be large
      maxImageBytes: parseInt(env.UPLOAD_MAX_IMAGE_BYTES, 10) || 10 * 1024 * 1024,
      // files a single unit (chapter) may hold; videos are sent one request per file, so this is the only count limit
      maxFilesPerUnit: parseInt(env.UPLOAD_MAX_FILES_PER_UNIT, 10) || 300,
      // multipart protection, applied after authentication and before anything is written to disk
      maxFilesPerRequest: parseInt(env.UPLOAD_MAX_FILES_PER_REQUEST, 10) || 50,
      // total body of one multipart request (one big video plus form fields); checked from Content-Length
      maxRequestBytes: parseInt(env.UPLOAD_MAX_REQUEST_BYTES, 10) || ((parseInt(env.UPLOAD_MAX_FILE_BYTES, 10) || 1024 * 1024 * 1024) + 64 * 1024 * 1024),
      // upload requests one signed-in user may start per minute
      initPerMinute: parseInt(env.UPLOAD_INIT_RATE_LIMIT_PER_MIN, 10) || 600,
      // anonymous multipart (sign-up photo) per address per hour
      publicPerHour: parseInt(env.UPLOAD_PUBLIC_RATE_LIMIT_PER_HOUR, 10) || 20,
      // abandoned temp files older than this are removed
      tempMaxAgeMs: (parseFloat(env.UPLOAD_TEMP_MAX_AGE_HOURS) || 6) * 60 * 60 * 1000,
    },
    // browser/device login sessions (table RefreshSessions)
    sessions: {
      idleDays: parseInt(env.SESSION_IDLE_DAYS, 10) || 30,          // sliding inactivity expiry
      absoluteDays: parseInt(env.SESSION_ABSOLUTE_DAYS, 10) || 365, // hard cap, never extended
      rotationGraceSeconds: parseInt(env.SESSION_ROTATION_GRACE_SECONDS, 10) || 120,
      maxPerUser: parseInt(env.SESSION_MAX_PER_USER, 10) || 20,     // oldest-used session is revoked beyond this
    },
    rateLimit: {
      loginWindowMs: 15 * 60 * 1000,
      loginMax: parseInt(env.LOGIN_RATE_LIMIT_MAX, 10) || 10,
      accountLoginMax: parseInt(env.ACCOUNT_LOGIN_RATE_LIMIT_MAX, 10) || 10,
      registerWindowMs: 60 * 60 * 1000,
      registerMax: parseInt(env.REGISTER_RATE_LIMIT_MAX, 10) || 10,
      forgotWindowMs: 60 * 60 * 1000,
      forgotMax: parseInt(env.FORGOT_RATE_LIMIT_MAX, 10) || 8,
      forgotResetMax: parseInt(env.FORGOT_RESET_RATE_LIMIT_MAX, 10) || 30,
      forgotAccountMax: parseInt(env.FORGOT_ACCOUNT_RATE_LIMIT_MAX, 10) || 4,
    },
    validate,
  }
}

const config = build()

/* Fail fast in production. In development/test problems are only logged so that tooling can still load the modules. */
const assertValid = () => {
  const problems = validate()
  // the old HLS key file is checked here (not in validate()) because it reads the file system
  if (isProduction) problems.push(...revokedProblems({}))
  if (problems.length === 0) return
  const message = `Invalid configuration:\n - ${problems.join('\n - ')}`
  if (isProduction) throw new Error(message)
  if (!isTest) console.warn(message)
}

module.exports = config
module.exports.assertValid = assertValid
module.exports.build = build
