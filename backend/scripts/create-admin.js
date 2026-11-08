#!/usr/bin/env node
/* Create the first Super Admin on a freshly initialised database.
 *
 *   npm run admin:create -- --email you@example.com [--full-name "Ada Lovelace"] [--username ada] [--phone +2519...]
 *
 * The password is read from the ADMIN_PASSWORD environment variable or, when that is not set, typed at a hidden prompt.
 * It is never accepted as a command-line argument (those end up in shell history and process listings) and never printed. */
const readline = require('readline')
const sequelize = require('../database')
require('../models')
const { createFirstAdmin, AdminSetupError } = require('../services/adminSetup')

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

const promptHidden = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  const write = rl._writeToOutput
  rl._writeToOutput = function (s) { if (s.startsWith(question)) write.call(rl, s); else if (s === '\r\n' || s === '\n') write.call(rl, s) }
  rl.question(question, (answer) => { rl.close(); resolve(answer) })
})

const main = async () => {
  const email = arg('email') || process.env.ADMIN_EMAIL
  if (!email) throw new AdminSetupError('Pass --email (or set ADMIN_EMAIL)')

  let password = process.env.ADMIN_PASSWORD
  if (!password) {
    if (!process.stdin.isTTY) throw new AdminSetupError('No ADMIN_PASSWORD set and no terminal available for a prompt')
    password = await promptHidden('Password: ')
    const again = await promptHidden('Repeat password: ')
    if (password !== again) throw new AdminSetupError('Passwords do not match')
  }

  await sequelize.authenticate()
  const admin = await createFirstAdmin({
    email,
    password,
    full_name: arg('full-name'),
    username: arg('username'),
    phone: arg('phone'),
  })
  console.log(`Super Admin created: id ${admin.id}, ${admin.email}`)
}

main()
  .catch((e) => {
    console.error(e instanceof AdminSetupError ? e.message : `admin:create failed: ${e.message}`)
    process.exitCode = 1
  })
  .finally(() => sequelize.close())
