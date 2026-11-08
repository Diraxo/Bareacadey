/* Process entry point: configuration check, HTTP server and Socket.IO.
 * Database schema creation is NOT done here (and cannot be triggered remotely): run `npm run db:init`
 * on an empty database or `npm run db:migrate` for later schema changes. */
const http = require('http')
const config = require('./config')

config.assertValid()

const { createApp } = require('./app')
const { createSocketServer } = require('./realtime/socket')

const app = createApp()
const server = http.createServer(app)
app.locals.io = createSocketServer(server)

/* Node cuts any request whose body takes longer than requestTimeout (default 5 minutes) to arrive: a large video on a
 * slow connection was dropped mid-upload. Allow one file to take up to UPLOAD_REQUEST_TIMEOUT_MS (default 60 min). */
server.requestTimeout = parseInt(process.env.UPLOAD_REQUEST_TIMEOUT_MS, 10) || 60 * 60 * 1000
require('./services/tempCleanup').scheduleTempCleanup()
require('./services/sessions').scheduleSessionCleanup()
require('./services/uploadJournal').scheduleUploadReconcile()

server.listen(config.port, "0.0.0.0", () => { console.log(`app running in ${config.port}`) })

process.on("unhandledRejection", (reason, p) => {
  console.error(reason, "Unhandled Rejection at Promise", p)
}).on("uncaughtException", (err) => {
  console.error(err, "Uncaught Exception thrown")
})
