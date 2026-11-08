const { logEvents } = require('./logEvents');

const errorHandler = (err, req, res, next) => {
    // details go to the server log only
    logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
    console.error(err.stack)
    if (res.headersSent) return next(err)
    const status = err.status || err.statusCode
    if (err.message === 'Rejected by CORS') return res.status(403).json({error: true, message: "Origin not allowed"});
    if (status && status >= 400 && status < 500) return res.status(status).json({error: true, message: "Bad request"});
    res.status(500).json({error: true, message: "Something went wrong"});
}

module.exports = errorHandler;
