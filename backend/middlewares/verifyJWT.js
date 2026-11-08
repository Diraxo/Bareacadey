const jwt = require('jsonwebtoken');
const config = require('../config');
const sessions = require('../services/sessions');

/* Outcome of looking at the Authorization header:
 *   { ok: true, decoded }                 a valid access token of a live session
 *   { ok: false, status, message }        what to answer. 401 = no token at all, 403 = token not acceptable
 * Single-purpose tokens (password reset, media, ...) are not API access tokens. A token issued for a session that was
 * signed out since (its `sid` claim) is refused at once, not only when it expires. */
const checkAuthorization = async (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return { ok: false, status: 401, message: "You are forbidden from accessing!" };
    let decoded;
    try {
        decoded = jwt.verify(authHeader.split(' ')[1], config.secrets.accessToken, { algorithms: ['HS256'] });
    } catch (e) {
        // do not echo the jwt library error to the client
        return { ok: false, status: 403, message: "Invalid or expired token" };
    }
    if (decoded?.typ) return { ok: false, status: 403, message: "Invalid or expired token" };
    if (decoded?.sid && !(await sessions.isSessionActive(decoded.sid))) return { ok: false, status: 403, message: "Invalid or expired token" };
    return { ok: true, decoded };
}

/* Runs BEFORE the multipart body parser (see app.js): a request with a missing, malformed, expired or revoked token is
 * answered right here, so no body is read and no temporary file is created for it. A token that is valid when the
 * request arrives stays valid for that one request: otherwise a 15 minute access token that expires while a large video
 * is still being received would make the server refuse the finished upload, and the client would have to send it all
 * again. Who may do what is decided afterwards by verifyJWT and the route's own role/ownership checks. The identity
 * comes only from the verified token claims. */
const authenticateBeforeBody = async (req, res, next) => {
    try {
        const result = await checkAuthorization(req);
        if (!result.ok) {
            res.set('Connection', 'close'); // the unread body is not worth draining
            return res.status(result.status).send({ error: true, message: result.message });
        }
        req.preAuthenticatedUser = result.decoded;
        next();
    } catch (e) {
        next(e);
    }
}

const verifyJWT = async (req, res, next) => {
    try {
        if (req.preAuthenticatedUser) {
            req.user = req.preAuthenticatedUser;
            return next();
        }
        const result = await checkAuthorization(req);
        if (!result.ok) return res.status(result.status).send({ error: true, message: result.message });
        req.user = result.decoded;
        next();
    } catch (e) {
        next(e);
    }
}

module.exports = verifyJWT
module.exports.authenticateBeforeBody = authenticateBeforeBody
module.exports.checkAuthorization = checkAuthorization
