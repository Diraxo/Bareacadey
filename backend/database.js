const Sequelize = require("sequelize")
require('./config/loadEnv')

// Tests run against an in-memory SQLite database so that no MySQL server (or live data) is ever touched.
const isTest = process.env.NODE_ENV === 'test'

// `TEST_DB_DIALECT=mysql` runs the same test suite against a real MySQL/MariaDB server (see tests/helpers.js for the
// safety rules: the database name must end in `_test`, so a live database can never be wiped by a test run).
const testOnMysql = isTest && process.env.TEST_DB_DIALECT === 'mysql'

const sequelize = testOnMysql
    ? new Sequelize(process.env.TEST_DB_NAME, process.env.TEST_DB_USER, process.env.TEST_DB_PASSWORD, {
        dialect: 'mysql',
        host: process.env.TEST_DB_HOST || '127.0.0.1',
        port: parseInt(process.env.TEST_DB_PORT, 10) || 3306,
        logging: false,
    })
    : isTest
    ? new Sequelize({
        dialect: 'sqlite', storage: process.env.SQLITE_STORAGE || ':memory:', logging: false,
        // a file database used by the concurrency tests: wait briefly for a lock and let readers work while a writer is
        // active. The wait is kept short on purpose: node-sqlite3 waits on a libuv thread (4 by default), so a long wait
        // by many contenders would starve the very statement (COMMIT) that releases the lock; services/chapterFiles.js
        // retries a busy transaction with an asynchronous pause instead. (The in-memory database needs neither.)
        hooks: process.env.SQLITE_STORAGE ? {
            afterConnect: (connection) => { connection.configure('busyTimeout', 60); connection.run('PRAGMA journal_mode=WAL') },
        } : {},
    })
    : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        dialect: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        // logging: false,
        logging: (msg, query) => {
            if (query && query.exception) {
                console.error(msg);
            }
        }
    })

if (!isTest) {
    sequelize.authenticate().then(() => {
        console.log('DB connection Successful');
    }).catch((err) => {
        console.error('DB connection failed:', err.message);
    })
}

module.exports = sequelize
