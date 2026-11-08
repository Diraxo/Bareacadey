/* Widens Chapters.chapter_files from TEXT (64 KB) to MEDIUMTEXT (16 MB) so a unit can list many videos.
 * Widening only: existing values are kept byte for byte. SQLite (tests) has no such limit, so it is a no-op there. */
module.exports = {
  async up({ sequelize, queryInterface }) {
    if (sequelize.getDialect() !== 'mysql') return
    const table = await queryInterface.describeTable('Chapters')
    if (!table.chapter_files) return
    if (/mediumtext|longtext/i.test(table.chapter_files.type)) return
    await sequelize.query('ALTER TABLE `Chapters` MODIFY `chapter_files` MEDIUMTEXT NULL')
  },
}
