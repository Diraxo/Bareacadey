/* Migrations 0005 (RefreshSessions) and 0006 (upload journal columns): registered in order, rerunnable, and 0006 upgrades
 * a table that has the shape 0004 created in the earlier release. SQLite only (no MySQL server was available). */
const { resetDb, models, sequelize } = require('./helpers')
const { listMigrationFiles } = require('../db/migrate')

const qi = () => sequelize.getQueryInterface()

beforeAll(resetDb)

test('registered in order after 0004', () => {
  const files = listMigrationFiles()
  expect(files.indexOf('0004_upload_batches.js')).toBeLessThan(files.indexOf('0005_refresh_sessions.js'))
  expect(files.indexOf('0005_refresh_sessions.js')).toBeLessThan(files.indexOf('0006_upload_journal.js'))
})

test('0005 creates RefreshSessions, can run twice, and touches no other table', async () => {
  await qi().dropTable('RefreshSessions')
  const before = (await qi().showAllTables()).length
  const up = require('../db/migrations/0005_refresh_sessions').up
  await up({ models }); await up({ models })
  const tables = (await qi().showAllTables()).map(String)
  expect(tables).toContain('RefreshSessions')
  expect(tables.length).toBe(before + 1)
  const cols = Object.keys(await qi().describeTable('RefreshSessions'))
  for (const c of ['id', 'user_id', 'seed', 'generation', 'token_hash', 'rotated_at', 'last_used_at', 'expires_at', 'absolute_expires_at', 'revoked_at', 'revoked_reason', 'user_agent']) expect(cols).toContain(c)
  const idx = (await qi().showIndex('RefreshSessions')).map((i) => i.name)
  expect(idx.length).toBeGreaterThanOrEqual(4) // primary key + user/revoked, token_hash, expires_at
})

describe('0006 on the table as the earlier release created it', () => {
  const oldShape = async () => {
    await sequelize.query('DROP TABLE IF EXISTS UploadBatchFiles')
    await sequelize.query('CREATE TABLE UploadBatchFiles (id VARCHAR(36) PRIMARY KEY, batch_id VARCHAR(36) NOT NULL, client_key VARCHAR(64) NOT NULL, original_name VARCHAR(255) NOT NULL, expected_size BIGINT NOT NULL, status VARCHAR(12) NOT NULL DEFAULT \'pending\', error VARCHAR(255), stored_size BIGINT, attempts INTEGER NOT NULL DEFAULT 0, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL)')
    await sequelize.query('CREATE UNIQUE INDEX upload_batch_files_batch_id_client_key ON UploadBatchFiles (batch_id, client_key)')
  }
  const row = (id, batch, key) => sequelize.query('INSERT INTO UploadBatchFiles (id, batch_id, client_key, original_name, expected_size, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?)', { replacements: [id, batch, key, 'v.mp4', new Date(), new Date()] })
  const up = () => require('../db/migrations/0006_upload_journal').up({ sequelize, queryInterface: qi(), models })

  test('adds the columns, backfills chapter_id from the batch, adds the unique key per unit, and keeps every row', async () => {
    await models.UploadBatch.destroy({ where: {} })
    await models.UploadBatch.create({ id: 'b-1', batch_key: 'bk-aaaaaaaa', chapter_id: 41, user_id: 1 })
    await models.UploadBatch.create({ id: 'b-2', batch_key: 'bk-bbbbbbbb', chapter_id: 42, user_id: 1 })
    await oldShape()
    await row('r1', 'b-1', 'key-aaaaaaaa'); await row('r2', 'b-2', 'key-aaaaaaaa') // same key, different units: allowed
    await up()
    const cols = Object.keys(await qi().describeTable('UploadBatchFiles'))
    for (const c of ['chapter_id', 'position', 'fingerprint', 'last_modified', 'stored_path', 'content_sha256']) expect(cols).toContain(c)
    const [rows] = await sequelize.query('SELECT id, chapter_id FROM UploadBatchFiles ORDER BY id')
    expect(rows).toEqual([{ id: 'r1', chapter_id: 41 }, { id: 'r2', chapter_id: 42 }])
    expect((await qi().showIndex('UploadBatchFiles')).some((i) => i.name === 'upload_batch_files_chapter_key' && i.unique)).toBe(true)
    await expect(row('r3', 'b-1', 'key-aaaaaaaa').then(() => sequelize.query("UPDATE UploadBatchFiles SET chapter_id = 41 WHERE id = 'r3'"))).rejects.toThrow()
  })

  test('is safe to run again, including after a half-finished earlier run', async () => {
    await up(); await up()
    // a run that stopped before its last step (MySQL needs the table name; SQLite does not accept it)
    await sequelize.query(sequelize.getDialect() === 'mysql' ? 'DROP INDEX upload_batch_files_chapter_key ON UploadBatchFiles' : 'DROP INDEX upload_batch_files_chapter_key')
    await up()
    expect((await qi().showIndex('UploadBatchFiles')).some((i) => i.name === 'upload_batch_files_chapter_key')).toBe(true)
    expect((await sequelize.query('SELECT COUNT(*) AS n FROM UploadBatchFiles'))[0][0].n).toBe(2)
  })

  test('stops with a clear message, changing nothing more, when one unit already uses a key twice', async () => {
    await oldShape()
    // (the old unique index on batch_id + client_key forbids a repeat inside one batch, so use two batches of one unit)
    await models.UploadBatch.create({ id: 'b-3', batch_key: 'bk-cccccccc', chapter_id: 41, user_id: 2 })
    await row('e1', 'b-1', 'same-key-aaaa'); await row('e2', 'b-3', 'same-key-aaaa')
    await expect(up()).rejects.toThrow(/used twice inside one unit/)
    expect((await sequelize.query('SELECT COUNT(*) AS n FROM UploadBatchFiles'))[0][0].n).toBe(2)
  })
})
