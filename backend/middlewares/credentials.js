const config = require('../config')

const allowedOrigins = config.allowedOrigins

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Rejected by CORS'));
        }
    },
    optionsSuccessStatus: 200
}

const credentials = (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Credentials', true);
    }
    next();
}

module.exports = {corsOptions, credentials, allowedOrigins}
