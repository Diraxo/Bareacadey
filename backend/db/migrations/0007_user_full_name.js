/* Replaces Users.first_name + Users.last_name with a single Users.full_name.
 *
 *   1. add full_name (if missing)
 *   2. backfill it from the old columns (trimmed, so an empty last_name leaves no trailing space)
 *   3. drop first_name and last_name
 *
 * Each step looks at the live schema first, so a rerun after a partial failure continues where it stopped. The old
 * columns are only dropped after the backfill has run, and the backfill only touches rows whose full_name is still
 * empty, so a rerun never overwrites a name that was edited in between. */
module.exports = {
  async up({ sequelize, queryInterface }) {
    const T = sequelize.constructor
    let table = await queryInterface.describeTable('Users')
    if (!table.full_name) {
      await queryInterface.addColumn('Users', 'full_name', { type: T.STRING, allowNull: true, defaultValue: '' })
      table = await queryInterface.describeTable('Users')
    }
    if (table.first_name || table.last_name) {
      const parts = [table.first_name && "COALESCE(first_name, '')", table.last_name && "COALESCE(last_name, '')"].filter(Boolean)
      const joined = parts.length === 2 ? `${parts[0]} || ' ' || ${parts[1]}` : parts[0]
      const expr = sequelize.getDialect() === 'sqlite' ? joined : `CONCAT_WS(' ', ${parts.join(', ')})`
      await sequelize.query(`UPDATE Users SET full_name = TRIM(${expr}) WHERE full_name IS NULL OR full_name = ''`)
    }
    if (table.first_name) await queryInterface.removeColumn('Users', 'first_name')
    if (table.last_name) await queryInterface.removeColumn('Users', 'last_name')
  },
}
