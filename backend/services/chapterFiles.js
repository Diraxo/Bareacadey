/* Every change to a chapter's `chapter_files` JSON list goes through withChapter(): one database transaction that
 * holds a row lock on the chapter for the whole read-modify-write.
 *
 *   MySQL / MariaDB (InnoDB)  `SELECT ... FOR UPDATE` on the chapter row. A second request for the SAME chapter waits
 *                             for the first to commit, in any Node worker or process; requests for other chapters do
 *                             not wait (row lock, not table lock). A deadlock or lock-wait timeout is retried.
 *   SQLite (tests/dev only)   transactions of one process are queued; `BEGIN IMMEDIATE` takes the write lock for other
 *                             processes, and a busy database is retried.
 *
 * Callers must keep slow work (moving a multi-hundred-megabyte file) OUTSIDE this function; inside it there should only
 * be database reads/writes and cheap filesystem checks. Always lock the chapter FIRST and other rows after, so two
 * requests cannot lock in opposite order. */
const sequelize = require('../database')
const Chapter = require('../models/Chapter')

const parseFiles = (raw) => { try { const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v : [] } catch (e) { return [] } }

const dialect = () => sequelize.getDialect()
// SQLite has a single write lock for the whole database and node-sqlite3 waits for it on a shared thread pool, so
// concurrent transactions of ONE process are queued here (many connections fighting for the lock can stall the pool).
// Other processes on the same file still meet BEGIN IMMEDIATE and the retry loop below. MySQL never takes this branch.
const sharedConnection = () => dialect() === 'sqlite'

const isRetryable = (e) => {
  const code = e?.parent?.code || e?.original?.code || e?.code
  const errno = e?.parent?.errno || e?.original?.errno
  return code === 'ER_LOCK_DEADLOCK' || errno === 1213 || code === 'ER_LOCK_WAIT_TIMEOUT' || errno === 1205
    || code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED' || /SQLITE_BUSY|database is locked/i.test(String(e?.message))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let memoryQueue = Promise.resolve()
const queueInMemory = (task) => {
  const run = memoryQueue.then(task, task)
  memoryQueue = run.catch(() => {})
  return run
}

const attemptOnce = async (work) => {
  const t = await sequelize.transaction(dialect() === 'sqlite' ? { type: 'IMMEDIATE' } : {})
  try {
    const result = await work(t)
    await t.commit()
    return result
  } catch (e) {
    try { await t.rollback() } catch (_) { /* already finished */ }
    throw e
  }
}

/* One transaction with the retry/queue rules above. work(transaction) may run again after a deadlock or busy-database
 * error, so it must not have effects outside the transaction that are unsafe to repeat. */
const inTransaction = async (work, { attempts = dialect() === 'sqlite' ? 120 : 8 } = {}) => {
  const run = async () => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await attemptOnce(work)
      } catch (e) {
        if (attempt >= attempts || !isRetryable(e)) throw e
        await sleep(10 + Math.floor(Math.random() * Math.min(attempt, 10) * 15))
      }
    }
  }
  return sharedConnection() ? queueInMemory(run) : run()
}

/* work({ chapter, files, transaction }) runs with the chapter row locked; `chapter` is null when it does not exist.
 * To change the list, set chapter.chapter_files and save with { transaction }. */
const withChapter = (chapterId, work, options) => inTransaction(async (transaction) => {
  const chapter = await Chapter.findOne({ where: { id: chapterId }, transaction, lock: transaction.LOCK.UPDATE })
  return work({ chapter, transaction, files: chapter ? parseFiles(chapter.chapter_files) : [] })
}, options)

module.exports = { withChapter, inTransaction, parseFiles, isRetryable }
