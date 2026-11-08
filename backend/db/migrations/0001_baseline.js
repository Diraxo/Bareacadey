/* Baseline schema: creates every table for the models registered in models/index.js.
 * `sync()` without `alter`/`force` only creates tables that do not exist and never modifies or drops data. */
module.exports = {
  async up({ sequelize }) {
    await sequelize.sync()
  },
}
