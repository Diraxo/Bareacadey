#!/usr/bin/env node
/* Looks for unit uploads that were interrupted between "file moved to permanent storage" and "file registered".
 *
 *   npm run uploads:reconcile                 report only (nothing is changed)
 *   npm run uploads:reconcile -- --apply      finish rows whose file is already listed, delete journaled orphan files
 *   npm run uploads:reconcile -- --grace-hours=1
 *
 * Only files named by an unfinished upload-journal row, listed by no chapter and no finished row, with a generated name
 * under uploads/common, are ever deleted. See services/uploadJournal.js. */
const sequelize = require('../database')
const { reconcileUploads } = require('../services/uploadJournal')

const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1]

const main = async () => {
  await sequelize.authenticate()
  const apply = process.argv.includes('--apply')
  const graceHours = parseFloat(arg('grace-hours'))
  const report = await reconcileUploads({ apply, graceMs: (Number.isFinite(graceHours) ? graceHours : 6) * 3600 * 1000 })
  console.log(apply ? 'APPLIED' : 'REPORT ONLY (use --apply to change anything)')
  console.log(JSON.stringify({ ...report, details: undefined }, null, 2))
  for (const d of report.details) console.log(` - row ${d.row} unit ${d.chapter} ${d.path} -> ${d.action}`)
}

main()
  .catch((e) => { console.error('uploads:reconcile failed:', e.message); process.exitCode = 1 })
  .finally(() => sequelize.close())
