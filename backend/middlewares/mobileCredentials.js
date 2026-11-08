const crypto = require('crypto')
const config = require('../config')

const safeEqual = (a, b) => {
    const ab = Buffer.from(String(a ?? ''))
    const bb = Buffer.from(String(b ?? ''))
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

/* Compatibility gate for already-released mobile builds (browser requests carry an Origin header and skip it).
 * The expected values ship inside the app binary, so this only filters casual traffic; real access control is the JWT. */
const mobileCredentials = (req, res, next) => {
    if (req.headers.origin) return next()

    const key = config.mobile.appKey
    const isReactNativeApp = !!key && safeEqual(req.headers['x-react-native-app'], key)
    const isExpectedUserAgent = String(req.headers['user-agent'] || '').includes(config.mobile.userAgentToken)

    if (isReactNativeApp && isExpectedUserAgent) return next()
    return res.status(403).json({error: true, message: "You are not authorized to access the server"});
}

module.exports = mobileCredentials
