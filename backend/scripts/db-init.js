#!/usr/bin/env node
/* Initialise a FRESH database: create the schema (migrations) and load reference data (seeds).
 *
 *   npm run db:init
 *
 * Safety:
 *  - refuses to run when the database already contains tables, unless --allow-existing is passed
 *    (even then it only applies pending migrations and idempotent seeds - nothing is dropped or altered);
 *  - never uses sync({ force }) or sync({ alter });
 *  - creates no users and no content: run `npm run admin:create` next. */
const config = require('../config')
const sequelize = require('../database')
const { migrate, hasExistingTables } = require('../db/migrate')
const runSeeds = require('../db/seeds')

const main = async () => {
  const allowExisting = process.argv.includes('--allow-existing')
  await sequelize.authenticate()
  console.log(`Connected to database "${sequelize.config.database}" on ${sequelize.config.host}.`)

  if (await hasExistingTables()) {
    if (!allowExisting) {
      console.error('The database is not empty. Refusing to initialise it. Use `npm run db:migrate` to apply schema changes,')
      console.error('or pass --allow-existing to apply pending migrations and idempotent seeds only.')
      process.exitCode = 2
      return
    }
    console.log('Database is not empty: applying pending migrations and idempotent seeds only.')
  }

  const ran = await migrate({ log: (m) => console.log(' -', m) })
  console.log(ran.length ? `Applied ${ran.length} migration(s).` : 'No pending migrations.')
  await runSeeds()
  console.log('Reference data (permissions, roles, default settings) is in place.')
  console.log('Next: npm run admin:create')
}

main()
  .catch((e) => { console.error('db:init failed:', e.message); process.exitCode = 1 })
  .finally(() => sequelize.close())
