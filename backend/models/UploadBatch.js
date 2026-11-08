const db = require('../database')
const Sequelize = require('sequelize')

/* One "Submit" of a unit form: the files the instructor chose, tracked by the server so the status survives a
 * refresh, a closed tab or a new sign-in. The server is the only authority on what has been stored; the browser
 * keeps nothing but the batch id. `batch_key` is made by the browser and kept on retries, so creating the batch
 * twice (lost response) returns the same batch. */
const UploadBatch = db.define('UploadBatch', {
   id: { type: Sequelize.STRING(36), primaryKey: true, allowNull: false },
   batch_key: { type: Sequelize.STRING(64), allowNull: false },
   chapter_id: { type: Sequelize.INTEGER, allowNull: false },
   user_id: { type: Sequelize.INTEGER, allowNull: false },
   total_files: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
   total_bytes: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
   // in_progress | completed | partial | failed (derived from the files, stored for listing)
   status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'in_progress' },
   // set when the user has seen the final result, so it is not announced again
   acknowledged_at: { type: Sequelize.DATE, allowNull: true },
}, {
   indexes: [{ unique: true, fields: ['user_id', 'batch_key'] }, { fields: ['chapter_id'] }, { fields: ['user_id', 'acknowledged_at'] }],
})

const UploadBatchFile = db.define('UploadBatchFile', {
   id: { type: Sequelize.STRING(36), primaryKey: true, allowNull: false },
   batch_id: { type: Sequelize.STRING(36), allowNull: false },
   // the unit the file is for. Together with client_key it is unique: a key can never be reused inside a unit, so a key
   // that happens to match a file of another batch can never mark this one complete.
   chapter_id: { type: Sequelize.INTEGER, allowNull: true },
   // place in the selection the instructor made (keeps the list in the order they chose)
   position: { type: Sequelize.INTEGER, allowNull: true },
   // key made by the browser; only an idempotency hint. The identity written to chapter_files is 'b:' + this row's id.
   client_key: { type: Sequelize.STRING(64), allowNull: false },
   original_name: { type: Sequelize.STRING(255), allowNull: false },
   expected_size: { type: Sequelize.BIGINT, allowNull: false },
   // stronger identity of the chosen file than name + size: sha256(size, first 64 KiB, last 64 KiB) made by the browser,
   // and the file's lastModified. Optional (older clients do not send them); verified by the server on upload.
   fingerprint: { type: Sequelize.STRING(64), allowNull: true },
   last_modified: { type: Sequelize.BIGINT, allowNull: true },
   // upload journal. stored_path is written BEFORE the file is moved to permanent storage, content_sha256 is the digest
   // of the bytes received. They let a retry adopt a file that was moved but never registered, and let the reconcile
   // job find and clean such orphans. See services/uploadJournal.js.
   stored_path: { type: Sequelize.STRING(255), allowNull: true },
   content_sha256: { type: Sequelize.STRING(64), allowNull: true },
   // pending | uploading | done | failed
   status: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'pending' },
   error: { type: Sequelize.STRING(255), allowNull: true },
   stored_size: { type: Sequelize.BIGINT, allowNull: true },
   attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
}, {
   indexes: [{ unique: true, fields: ['batch_id', 'client_key'] }, { unique: true, name: 'upload_batch_files_chapter_key', fields: ['chapter_id', 'client_key'] }, { name: 'upload_batch_files_status_updated_at', fields: ['status', 'updatedAt'] }],
})

UploadBatch.hasMany(UploadBatchFile, { foreignKey: 'batch_id', as: 'files', onDelete: 'CASCADE' })
UploadBatchFile.belongsTo(UploadBatch, { foreignKey: 'batch_id' })

module.exports = { UploadBatch, UploadBatchFile }
