const config = require('../../config')
const { hashToken } = require('../../middlewares/tokenHash')
const jwt = require('jsonwebtoken')
const User = require('../../models/User')
const Permission = require("../../models/Permission")
const Role = require("../../models/Role");
const UserUpload = require("../../models/UserUpload");
const { effectivePermissions } = require("../../services/rolePermissions");
const sessions = require('../../services/sessions')
const { legacyNameParts } = require('../../services/fullName')

const express = require('express')
const route = express.Router()

const usable = (t) => typeof t === 'string' && t.length > 0

/* Sign-out of ONE session, using the refresh token as the credential, so it still works after the access token expired
 * (DELETE /api/user/logout sits behind verifyJWT and cannot). Exactly one token is revoked per request:
 *   - a non-empty string body token is the credential, and the cookie never adds a second revocation: a delayed
 *     retry for an old session must not touch whatever session the cookie jar holds by now;
 *   - without a usable body token, the cookie token is the credential (cookie-based logout).
 * Other devices of the same user are never touched. A token that matches no live session is already signed out.
 * {loggedOut: true} is sent once the presented session is certain to be dead, which is what clients wait for before
 * they stop retrying. Tokens and hashes are never logged. The cookie is cleared for a cookie-based logout, and for a
 * body-token logout only when the cookie carries that same token (it is the session being ended).
 * Tokens issued before sessions existed (a JWT stored in Users.refresh_token) are still honoured until they expire. */
route.delete('/logout', async (req, res) => {
  try {
    const bodyToken = req?.body?.token
    const cookieToken = req?.cookies?.rt
    const viaBody = usable(bodyToken)
    const token = viaBody ? bodyToken : usable(cookieToken) ? cookieToken : null
    if (token) {
      const revoked = await sessions.revokeByToken(token)
      if (!revoked && !sessions.parseToken(token)) {
        await User.update({ refresh_token: "" }, { where: { refresh_token: hashToken(token) } }) // pre-session token
      }
    }
    if (!viaBody || cookieToken === bodyToken) sessions.clearRefreshCookie(res)
    return res.status(200).send({ loggedOut: true })
  } catch (e) {
    console.error("Token logout failed:", e?.message)
    return res.status(500).send({ error: true, message: "Something went wrong" })
  }
})

const REJECT = {
  invalid: { status: 403, code: 'session_invalid', message: 'You are forbidden' },
  revoked: { status: 403, code: 'session_revoked', message: 'This session was signed out' },
  expired: { status: 403, code: 'session_expired', message: 'This session expired; sign in again' },
  reuse: { status: 403, code: 'session_revoked', message: 'This session was signed out' },
}

const userInclude = [
  { model: Permission, attributes: ["permission"], through: { attributes: [] } },
  { model: Role, as: "roles", attributes: ["role"] },
  { model: UserUpload, as: "url", attributes: ["filepath"] },
]

/* A browser sends an Origin header and keeps the token in an httpOnly cookie, so it follows a new token automatically.
 * Clients without an Origin keep the token in their own storage and ignore a replacement, so they are never rotated. */
const wantsRotation = (req, fromCookie) => fromCookie && !!req.headers.origin

route.post('/reqtoken', async (req, res, next) => {
  try {
    const fromCookie = usable(req?.cookies?.rt)
    const refreshToken = fromCookie ? req.cookies.rt : req?.body?.token
    if(!usable(refreshToken)) {
        return res.status(401).send({message: "Unauthorized", code: 'session_missing'});
    }

    let sessionToken = null // set when this request ends up on a rotated/created session token
    let session = null
    if (sessions.parseToken(refreshToken)) {
      const outcome = await sessions.refreshSession(refreshToken, { rotate: wantsRotation(req, fromCookie) })
      if (outcome.status !== 'ok') {
        const reject = REJECT[outcome.status] || REJECT.invalid
        if (fromCookie) sessions.clearRefreshCookie(res)
        return res.status(reject.status).send({ error: true, code: reject.code, message: reject.message })
      }
      session = outcome.session
      if (outcome.token !== refreshToken || outcome.rotated) sessionToken = outcome.token
    }

    let user
    if (session) {
      user = await User.findOne({ where: { id: session.user_id }, include: userInclude })
    } else {
      // token from before sessions existed: the JWT is still honoured until it expires, and trades itself for a session
      user = await User.findOne({ where: { refresh_token: hashToken(refreshToken) }, include: userInclude })
      const legacyOk = user && await new Promise((resolve) =>
        jwt.verify(refreshToken, config.secrets.refreshToken, { algorithms: ['HS256'] }, (err, decoded) => resolve(!err && String(user.id) === String(decoded?.id))))
      if (!legacyOk) {
        return res.status(403).send({ error: true, code: 'session_invalid', message: 'You are forbidden' })
      }
      if (wantsRotation(req, fromCookie) && user.active !== false) {
        const created = await sessions.createSession(user.id, { userAgent: req.headers['user-agent'] })
        session = created.session
        sessionToken = created.token
      }
    }

    if(!user || user.active === false) {
        if (session) await sessions.revokeById(session.id, session.user_id, 'admin')
        if (fromCookie) sessions.clearRefreshCookie(res)
        return res.status(403).send({error: true, code: 'session_invalid', message: "You are forbidden"});
    }

    const permissions = await effectivePermissions(user)
    var fullUrl = user?.url?.filepath ? req.protocol + '://' + req.get('host')+user?.url?.filepath : null;
    const updatedUser =  {
      id: user.id,
      full_name: user.full_name,
      ...legacyNameParts(user.full_name),
      email: user.email,
      username: user.username,
      phone: user.phone,
      active: user.active,
      blocked: user.blocked,
      confirmed: user.confirmed,
      role: user.roles?.role,
      role_id: user.role_id,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      about_me: user.about_me,
      permissions: permissions,
      img_url: fullUrl,
    }
    const userData = { id: user.id, role: updatedUser.role, permissions: updatedUser.permissions }
    if (session) userData.sid = session.id

    const accessToken = jwt.sign(userData, config.secrets.accessToken, { expiresIn: config.tokens.accessExpiresIn, algorithm: 'HS256'})
    if (sessionToken && fromCookie) sessions.setRefreshCookie(res, sessionToken)
    res.json({accessToken: accessToken, user: updatedUser})
  } catch (e) { next(e) }
})


module.exports = route
