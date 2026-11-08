#!/usr/bin/env node
/* Apply pending schema migrations (db/migrations). Pass --seed to also re-run the idempotent reference-data seeds. */
const sequelize = require('../database')
const { migrate } = require('../db/migrate')
const runSeeds = require('../db/seeds')

const main = async () => {
  await sequelize.authenticate()
  const ran = await migrate({ log: (m) => console.log(' -', m) })
  console.log(ran.length ? `Applied ${ran.length} migration(s).` : 'No pending migrations.')
  if (process.argv.includes('--seed')) {
    await runSeeds()
    console.log('Seeds applied.')
  }
}

main()
  .catch((e) => { console.error('db:migrate failed:', e.message); process.exitCode = 1 })
  .finally(() => sequelize.close())
