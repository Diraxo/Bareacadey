const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const request = require('supertest')
const sequelize = require('../database')
const models = require('../models')
const runSeeds = require('../db/seeds')
const { PERMISSIONS } = require('../db/seeds/permissions')
const { createApp } = require('../app')

// dropping and re-creating every table on a real MySQL server takes 15-25 s; the default 30 s hook limit is too tight there
if (process.env.TEST_DB_DIALECT === 'mysql' && typeof jest !== 'undefined') jest.setTimeout(180000)

const MOBILE = { 'x-react-native-app': process.env.MOBILE_APP_KEY, 'user-agent': 'rnafm' }
const ORIGIN = { Origin: process.env.FRONTEND_URL }
const PASSWORD = 'Str0ng!Passw0rd'

/* Test-only: the throw-away test database is recreated from the models.
 * SQLite runs in memory. MySQL/MariaDB (TEST_DB_DIALECT=mysql) is only touched when its name ends in `_test`
 * and the host is local, so this can never wipe a live database. */
const guardMysql = () => {
  const { database, host } = sequelize.config
  if (!/_test$/.test(database) || !['127.0.0.1', 'localhost'].includes(host)) {
    throw new Error(`refusing to wipe "${database}" on ${host}: need a local database whose name ends in _test`)
  }
}

/* Empties the test database completely (every table, including schema_migrations). No-op for in-memory SQLite,
 * which every test file already starts empty. */
const wipeDb = async () => {
  if (sequelize.getDialect() !== 'mysql') return
  guardMysql()
  const [rows] = await sequelize.query('SHOW TABLES')
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const row of rows) await sequelize.query(`DROP TABLE IF EXISTS \`${Object.values(row)[0]}\``)
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
}

const resetDb = async () => {
  const dialect = sequelize.getDialect()
  if (dialect !== 'sqlite' && dialect !== 'mysql') throw new Error('resetDb is only allowed on the test database')
  await wipeDb()
  await sequelize.sync({ force: dialect === 'sqlite' })
  await runSeeds()
}

const permissionNames = (ids) => PERMISSIONS.filter((p) => ids.includes(p.id)).map((p) => p.permission)

/* kind: 'admin' (all permissions), 'viewer' (12,15), 'instructor' (12,14,15), or explicit permission ids */
const makeUser = async (email, kind = 'viewer', extra = {}) => {
  const ids = Array.isArray(kind) ? kind : kind === 'admin' ? PERMISSIONS.map((p) => p.id) : kind === 'instructor' ? [12, 14, 15] : [12, 15]
  const user = await models.User.create({
    full_name: 'T', username: email.split('@')[0], email,
    password: await bcrypt.hash(PASSWORD, 4),
    role_id: kind === 'admin' ? 1 : kind === 'instructor' ? 12 : 5,
    active: true, confirmed: true, ...extra,
  })
  for (const permission_id of ids) await models.UserPermission.create({ user_id: user.id, permission_id })
  const permissions = permissionNames(ids)
  const token = jwt.sign({ id: user.id, role: 'x', permissions }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m', algorithm: 'HS256' })
  return { user, token, permissions, auth: { Authorization: `Bearer ${token}` } }
}

const api = () => {
  const app = createApp()
  return { app, http: request(app) }
}

module.exports = { resetDb, wipeDb, makeUser, api, models, sequelize, MOBILE, ORIGIN, PASSWORD, request, createApp }
