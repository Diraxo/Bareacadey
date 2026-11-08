const rateLimit = require('express-rate-limit')
const config = require('../config')

/* Every limiter answers with the same JSON shape so clients can show a friendly "try again in N minutes". */
const limited = (message) => (req, res) => {
    const resetTime = req.rateLimit?.resetTime
    const retryAfterSeconds = resetTime ? Math.max(1, Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000)) : undefined
    if (retryAfterSeconds) res.set('Retry-After', String(retryAfterSeconds))
    res.status(429).json({ error: true, code: 'rate_limited', message, retryAfterSeconds })
}

/* Stable key for "the account somebody is trying to get into", whatever way they typed it (+251-9.., 09.., e-mail). */
const identifierKey = (req) => {
    const raw = req.body?.userOrEmail ?? req.body?.identifier ?? req.body?.email ?? ''
    const text = String(typeof raw === 'string' ? raw : '').trim().toLowerCase()
    if (!text) return 'anonymous'
    if (text.includes('@')) return `id:${text}`
    return `id:${text.replace(/\D/g, '').replace(/^(251)?0*/, '')}`
}

/* Throttles credential guessing on the login-style endpoints, per client address. */
const loginLimiter = rateLimit({
    windowMs: config.rateLimit.loginWindowMs,
    max: config.rateLimit.loginMax,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: limited('Too many attempts, please try again later.'),
})

/* Same, per target account: guessing one account from many addresses is slowed down too. */
const accountLoginLimiter = rateLimit({
    windowMs: config.rateLimit.loginWindowMs,
    max: config.rateLimit.accountLoginMax,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `login:${identifierKey(req)}`,
    handler: limited('Too many attempts, please try again later.'),
})

/* Sign-up: stops scripted bulk account creation from one address. */
const registerLimiter = rateLimit({
    windowMs: config.rateLimit.registerWindowMs,
    max: config.rateLimit.registerMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limited('Too many sign-up attempts, please try again later.'),
})

/* Password recovery: a code request per address and per account (stops mailbox flooding), and a guess limit on the code itself. */
const forgotRequestLimiter = rateLimit({
    windowMs: config.rateLimit.forgotWindowMs,
    max: config.rateLimit.forgotMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limited('Too many reset requests, please try again later.'),
})
const forgotResetLimiter = rateLimit({
    windowMs: config.rateLimit.forgotWindowMs,
    max: config.rateLimit.forgotResetMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limited('Too many attempts, please try again later.'),
})
const forgotAccountLimiter = rateLimit({
    windowMs: config.rateLimit.forgotWindowMs,
    max: config.rateLimit.forgotAccountMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `forgot:${identifierKey(req)}`,
    handler: limited('Too many reset requests, please try again later.'),
})

module.exports = { loginLimiter, accountLoginLimiter, registerLimiter, forgotRequestLimiter, forgotResetLimiter, forgotAccountLimiter, identifierKey }
