const jwt = require('jsonwebtoken');
const config = require('../config');

/* Optional authentication: sets req.user when a valid access token is present, otherwise continues anonymously. */
const verifyJWTPublic = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        config.secrets.accessToken,
        { algorithms: ['HS256'] },
        (err, decoded) => {
            if (!err) {
                req.user = decoded;
            }
            next();
        }
    );
}

module.exports = verifyJWTPublic
