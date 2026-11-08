/* Phase 3 schema: instructor approval + explicit course assignments, device registration timestamps and the
 * "Manage All Courses" permission. Additive only: nothing is dropped, renamed or rewritten, and it is a no-op on a
 * database that the baseline already created from the current models. */
const seedPermissions = require('../seeds/permissions')

module.exports = {
  async up({ sequelize, queryInterface, models }) {
    await models.InstructorRequest.sync()
    await models.CourseInstructor.sync()

    const device = await queryInterface.describeTable('Devices')
    if (!device.registered_at) await queryInterface.addColumn('Devices', 'registered_at', { type: sequelize.constructor.DATE, allowNull: true })
    if (!device.last_seen_at) await queryInterface.addColumn('Devices', 'last_seen_at', { type: sequelize.constructor.DATE, allowNull: true })

    // existing registrations count as registered "now" so the self-service cooldown starts from the upgrade
    await sequelize.query('UPDATE Devices SET registered_at = ? WHERE registered_at IS NULL', { replacements: [new Date()] })

    await seedPermissions()
    // administrators (role 1) keep managing every course; instructors do not get this
    const [admins] = await sequelize.query('SELECT id FROM Users WHERE role_id = 1')
    for (const { id } of admins) {
      await models.UserPermission.findOrCreate({ where: { user_id: id, permission_id: 22 }, defaults: { added_by: id } })
    }
  },
}
