/* Persistent upload tracking for units: two NEW tables (UploadBatches, UploadBatchFiles). Additive only: no existing
 * table or row is touched. `sync()` creates a table only if it does not exist, so running this twice is harmless. */
module.exports = {
  async up({ models }) {
    await models.UploadBatch.sync()
    await models.UploadBatchFile.sync()
  },
}
