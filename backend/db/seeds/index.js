const seedPermissions = require('./permissions')
const seedRoles = require('./roles')
const seedConfig = require('./config')

/* Reference data required by a working system. Safe to run repeatedly. Creates no users and no content. */
const runSeeds = async () => {
  await seedPermissions()
  await seedRoles()
  await seedConfig()
}

module.exports = runSeeds
