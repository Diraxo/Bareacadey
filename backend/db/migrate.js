/* Minimal forward-only migration runner.
 *
 * Migrations are the files in db/migrations/ named NNNN_description.js, each exporting
 * `async up({ sequelize, queryInterface, models })`. Applied names are recorded in the
 * `schema_migrations` table so each runs exactly once. There is deliberately no "down", no
 * `sync({ force })` and no `sync({ alter })`: destructive schema changes must be written as explicit,
 * reviewed migrations. */
const fs = require('fs')
const path = require('path')
const sequelize = require('../database')

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')
const TABLE = 'schema_migrations'

const ensureTable = async () => {
  await sequelize.getQueryInterface().createTable(TABLE, {
    name: { type: sequelize.constructor.STRING, primaryKey: true },
    applied_at: { type: sequelize.constructor.DATE, allowNull: false, defaultValue: sequelize.constructor.NOW },
  }).catch(async (e) => {
    const tables = await sequelize.getQueryInterface().showAllTables()
    if (!tables.map(String).includes(TABLE)) throw e
  })
}

const listMigrationFiles = () =>
  fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{4}_.+\.js$/.test(f)).sort()

const applied = async () => {
  const [rows] = await sequelize.query(`SELECT name FROM ${TABLE}`)
  return new Set(rows.map((r) => r.name))
}

/* Runs pending migrations in order; returns the names that were applied. */
const migrate = async ({ log = () => {} } = {}) => {
  await ensureTable()
  const models = require('../models')
  const done = await applied()
  const ran = []
  for (const file of listMigrationFiles()) {
    if (done.has(file)) continue
    log(`applying ${file}`)
    const migration = require(path.join(MIGRATIONS_DIR, file))
    await migration.up({ sequelize, queryInterface: sequelize.getQueryInterface(), models })
    await sequelize.query(`INSERT INTO ${TABLE} (name, applied_at) VALUES (?, ?)`, { replacements: [file, new Date()] })
    ran.push(file)
  }
  return ran
}

/* True when the database already holds any table (used to refuse accidental initialisation of a live database). */
const hasExistingTables = async () => {
  const tables = await sequelize.getQueryInterface().showAllTables()
  return tables.map((t) => String(t.tableName || t)).filter((t) => !t.startsWith('sqlite_')).length > 0
}

module.exports = { migrate, hasExistingTables, listMigrationFiles, TABLE }
