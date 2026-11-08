/* Upload hardening on the two tables created by 0004. ALTER TABLE ... ADD COLUMN plus one UNIQUE INDEX; nothing is
 * dropped or rewritten, but the ALTERs lock UploadBatchFiles briefly on MySQL (the table is new and small).
 *
 *   position        order of the file in the selection
 *   chapter_id      the unit of the file, backfilled from UploadBatches (portable correlated UPDATE)
 *   fingerprint, last_modified     stronger file identity than name + size
 *   stored_path, content_sha256    the upload journal (see services/uploadJournal.js)
 *   unique (chapter_id, client_key)   a file key can only be used once inside a unit
 *
 * Each step first looks at the live schema, so a rerun after a partial failure continues where it stopped. If the unique
 * index cannot be created because two rows of the same unit share a key, the migration stops with a clear message and
 * changes nothing further; fix or remove the duplicate batch rows by hand and run it again. */
module.exports = {
  async up({ sequelize, queryInterface, models }) {
    // 0004 creates both tables from the current models, so on a fresh database there is nothing left to add. sync() is
    // NOT called on an existing table: it would try to index columns that are not there yet.
    const tables = (await queryInterface.showAllTables()).map((t) => String(t.tableName || t))
    if (!tables.includes('UploadBatchFiles')) await models.UploadBatchFile.sync()
    const table = await queryInterface.describeTable('UploadBatchFiles')
    const T = sequelize.constructor
    const add = async (name, type) => { if (!table[name]) await queryInterface.addColumn('UploadBatchFiles', name, { type, allowNull: true }) }
    await add('chapter_id', T.INTEGER)
    await add('position', T.INTEGER)
    await add('fingerprint', T.STRING(64))
    await add('last_modified', T.BIGINT)
    await add('stored_path', T.STRING(255))
    await add('content_sha256', T.STRING(64))

    await sequelize.query(
      'UPDATE UploadBatchFiles SET chapter_id = (SELECT chapter_id FROM UploadBatches WHERE UploadBatches.id = UploadBatchFiles.batch_id) WHERE chapter_id IS NULL'
    )

    const [dups] = await sequelize.query(
      'SELECT chapter_id, client_key, COUNT(*) AS n FROM UploadBatchFiles WHERE chapter_id IS NOT NULL GROUP BY chapter_id, client_key HAVING COUNT(*) > 1'
    )
    if (dups.length) {
      throw new Error(`0006: ${dups.length} file key(s) are used twice inside one unit (first: chapter ${dups[0].chapter_id}, key ${dups[0].client_key}). Resolve them, then run the migration again.`)
    }
    const indexes = await queryInterface.showIndex('UploadBatchFiles')
    if (!indexes.some((i) => i.name === 'upload_batch_files_chapter_key')) {
      await queryInterface.addIndex('UploadBatchFiles', ['chapter_id', 'client_key'], { unique: true, name: 'upload_batch_files_chapter_key' })
    }
    if (!indexes.some((i) => i.name === 'upload_batch_files_status_updated_at')) {
      await queryInterface.addIndex('UploadBatchFiles', ['status', 'updatedAt'], { name: 'upload_batch_files_status_updated_at' })
    }
  },
}
