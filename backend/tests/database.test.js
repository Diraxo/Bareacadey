const { sequelize, models, wipeDb } = require('./helpers')

// on MySQL/MariaDB the database is shared by all test files, so this file starts from nothing
beforeAll(wipeDb)
const { migrate, hasExistingTables, listMigrationFiles, TABLE } = require('../db/migrate')
const runSeeds = require('../db/seeds')
const { PERMISSIONS } = require('../db/seeds/permissions')
const { createFirstAdmin, validatePassword, AdminSetupError } = require('../services/adminSetup')

describe('fresh database initialisation', () => {
  test('an empty database is detected as empty, and a populated one is not', async () => {
    expect(await hasExistingTables()).toBe(false)
  })

  test('migrations create the whole schema and are recorded', async () => {
    const ran = await migrate()
    expect(ran).toEqual(listMigrationFiles())
    // MySQL on Windows/macOS folds table names to lower case, Linux keeps them: compare without case
    const tables = (await sequelize.getQueryInterface().showAllTables()).map((t) => String(t).toLowerCase())
    for (const t of ['Users', 'Roles', 'Permissions', 'Courses', 'Chapters', 'Payments', 'Configs', 'Quizzes', 'QuizQuestions', 'QuizAnswers', 'QuizCategories', 'QuizTitles', TABLE]) {
      expect(tables).toContain(t.toLowerCase())
    }
    expect(await hasExistingTables()).toBe(true)
  })

  test('migrations are idempotent', async () => {
    expect(await migrate()).toEqual([])
  })

  test('every model has a table (nothing is only created by a hidden side route)', async () => {
    const tables = (await sequelize.getQueryInterface().showAllTables()).map((t) => String(t).toLowerCase())
    const missing = Object.values(sequelize.models).map((m) => m.getTableName()).filter((t) => !tables.includes(String(t).toLowerCase()))
    expect(missing).toEqual([])
  })

  test('seeds create reference data only and can be re-run safely', async () => {
    await runSeeds()
    const counts = async () => ({
      permissions: await models.Permission.count(), roles: await models.Role.count(), rolePermissions: await models.RolePermission.count(),
      config: await models.Config.count(), users: await models.User.count(), quizzes: await models.Quiz.count(), courses: await models.Course.count(),
    })
    const first = await counts()
    await runSeeds()
    expect(await counts()).toEqual(first)
    expect(first.permissions).toBe(PERMISSIONS.length)
    expect(first.users).toBe(0) // no default administrator
    expect(first.quizzes).toBe(0) // no fabricated quiz content
    expect(first.courses).toBe(0)
  })

  test('default configuration contains no credentials', async () => {
    const rows = await models.Config.findAll()
    const text = rows.map((r) => r.config).join(' ')
    expect(text).not.toMatch(/doheexpress|pg\.tjawmd|YOUR_ACCESS_KEY|PRIVATE KEY/i)
    const email = JSON.parse(rows.find((r) => r.type === 'email').config)
    expect(email.auth.pass).toBe('')
    expect(JSON.parse(rows.find((r) => r.type === 'settings').config).usdToBirr).toBeGreaterThan(0)
  })

  test('the seed does not overwrite settings changed by the academy', async () => {
    await models.Config.update({ config: JSON.stringify({ usdToBirr: 200 }) }, { where: { id: 4 } })
    await runSeeds()
    expect(JSON.parse((await models.Config.findByPk(4)).config).usdToBirr).toBe(200)
  })

  test('there is no HTTP-reachable schema sync anywhere in the application sources', () => {
    const fs = require('fs')
    const path = require('path')
    const root = path.join(__dirname, '..')
    const offenders = []
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'tests', 'scripts', 'files', 'logs', 'db'].includes(e.name)) continue
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walk(p)
        else if (p.endsWith('.js')) {
          const text = fs.readFileSync(p, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n')
          if (/sync-database|\.sync\(\s*\{[^}]*(force|alter)/.test(text)) offenders.push(path.relative(root, p))
        }
      }
    }
    walk(root)
    expect(offenders).toEqual([])
  })
})

describe('first administrator', () => {
  test.each(['short', 'alllowercase12', 'NoDigitsOrSymbols', '12345678901234'])('rejects weak password %s', (pw) => {
    expect(validatePassword(pw)).not.toBeNull()
  })
  test('accepts a strong password', () => { expect(validatePassword('Str0ng!Passw0rd')).toBeNull() })

  test('fails without reference data', async () => {
    await models.Permission.destroy({ where: {} })
    await expect(createFirstAdmin({ email: 'admin@example.org', password: 'Str0ng!Passw0rd' })).rejects.toThrow(/db:init/)
    await runSeeds()
  })

  test('requires a valid email and a strong password; there is no default', async () => {
    await expect(createFirstAdmin({ email: 'nope', password: 'Str0ng!Passw0rd' })).rejects.toThrow(AdminSetupError)
    await expect(createFirstAdmin({ email: 'admin@example.org' })).rejects.toThrow(AdminSetupError)
    await expect(createFirstAdmin({ email: 'admin@example.org', password: 'password' })).rejects.toThrow(AdminSetupError)
    expect(await models.User.count()).toBe(0)
  })

  test('creates user 1 as Super Admin with every permission and a hashed password', async () => {
    const admin = await createFirstAdmin({ email: 'admin@example.org', password: 'Str0ng!Passw0rd', full_name: 'Ada' })
    expect(admin.id).toBe(1)
    const user = await models.User.findByPk(1)
    expect(user.role_id).toBe(1)
    expect(user.password).not.toContain('Str0ng')
    expect(await require('bcrypt').compare('Str0ng!Passw0rd', user.password)).toBe(true)
    expect(await models.UserPermission.count({ where: { user_id: 1 } })).toBe(PERMISSIONS.length)
  })

  test('refuses to run once any user exists', async () => {
    await expect(createFirstAdmin({ email: 'second@example.org', password: 'Str0ng!Passw0rd' })).rejects.toThrow(/already exist/)
    expect(await models.User.count()).toBe(1)
  })

  test('the created admin can sign in and holds the permissions the routes require', async () => {
    const { createApp } = require('../app')
    const request = require('supertest')
    const res = await request(createApp()).post('/api/auth/login').set({ 'x-react-native-app': process.env.MOBILE_APP_KEY, 'user-agent': 'rnafm' })
      .send({ userOrEmail: 'admin@example.org', password: 'Str0ng!Passw0rd', device: 'test' })
    expect(res.status).toBe(200)
    expect(res.body.user.permissions).toEqual(expect.arrayContaining(['Add Users', 'Customize Landing Page', 'Manage Employee Categories', 'Instructor']))
  })
})

// last, because it creates (and removes) a user: the first-administrator tests above need user id 1
describe('upgrading an existing database', () => {
  test('migration 0002 upgrades a database created before Phase 3 without touching its data', async () => {
    // simulate the pre-Phase-3 schema: no approval tables, no device timestamps, no "Manage All Courses" permission
    const q = (sql, replacements) => sequelize.query(sql, { replacements })
    await q('DROP TABLE InstructorRequests')
    await q('DROP TABLE CourseInstructors')
    await q('ALTER TABLE Devices DROP COLUMN registered_at')
    await q('ALTER TABLE Devices DROP COLUMN last_seen_at')
    await q('DELETE FROM Permissions WHERE id = 22')
    await q('DELETE FROM schema_migrations WHERE name = ?', ['0002_instructor_approval_and_device_recovery.js'])
    await runSeeds() // re-create what the baseline had, then add real data that must survive
    await q('DELETE FROM Permissions WHERE id = 22')
    const admin = await models.User.create({ full_name: 'A B', username: 'old', email: 'old@example.com', password: 'x', role_id: 1, active: true })
    await q('INSERT INTO Devices (device, user_id) VALUES (?, ?)', ['OldPhone', admin.id])

    expect(await migrate()).toEqual(['0002_instructor_approval_and_device_recovery.js'])

    const columns = Object.keys(await sequelize.getQueryInterface().describeTable('Devices'))
    expect(columns).toEqual(expect.arrayContaining(['registered_at', 'last_seen_at']))
    expect(await models.InstructorRequest.count()).toBe(0)
    expect(await models.CourseInstructor.count()).toBe(0)
    expect((await models.Permission.findByPk(22)).permission).toBe('Manage All Courses')
    // existing data survives; administrators keep managing every course
    const device = await models.Device.findOne({ where: { user_id: admin.id } })
    expect(device.device).toBe('OldPhone')
    expect(device.registered_at).not.toBeNull()
    expect(await models.UserPermission.count({ where: { user_id: admin.id, permission_id: 22 } })).toBe(1)
    expect(await models.User.count({ where: { email: 'old@example.com' } })).toBe(1)
    expect(await migrate()).toEqual([])
    await admin.destroy()
    await models.Device.destroy({ where: { user_id: admin.id } })
  })
})

describe('migration 0007 (single full_name column)', () => {
  test('merges first_name + last_name into full_name and drops the old columns', async () => {
    const q = (sql, replacements) => sequelize.query(sql, { replacements })
    const qi = sequelize.getQueryInterface()
    // simulate the previous schema: two name columns, no full_name
    await qi.addColumn('Users', 'first_name', { type: sequelize.constructor.STRING, allowNull: true })
    await qi.addColumn('Users', 'last_name', { type: sequelize.constructor.STRING, allowNull: true })
    const a = await models.User.create({ username: 'mig_a', email: 'mig_a@example.com', password: 'x', role_id: 5 })
    const b = await models.User.create({ username: 'mig_b', email: 'mig_b@example.com', password: 'x', role_id: 5 })
    const c = await models.User.create({ username: 'mig_c', email: 'mig_c@example.com', password: 'x', role_id: 5 })
    await q('UPDATE Users SET full_name = ?, first_name = ?, last_name = ? WHERE id = ?', ['', 'Ada', 'Lovelace', a.id])
    await q('UPDATE Users SET full_name = ?, first_name = ?, last_name = ? WHERE id = ?', ['', 'Madonna', '', b.id])
    await q('UPDATE Users SET full_name = ?, first_name = ?, last_name = ? WHERE id = ?', ['Kept Name', 'Old', 'Value', c.id])
    await qi.removeColumn('Users', 'full_name')
    await q('DELETE FROM schema_migrations WHERE name = ?', ['0007_user_full_name.js'])

    expect(await migrate()).toEqual(['0007_user_full_name.js'])

    const columns = Object.keys(await qi.describeTable('Users'))
    expect(columns).toContain('full_name')
    expect(columns).not.toContain('first_name')
    expect(columns).not.toContain('last_name')
    expect((await models.User.findByPk(a.id)).full_name).toBe('Ada Lovelace')
    expect((await models.User.findByPk(b.id)).full_name).toBe('Madonna')
    expect(await migrate()).toEqual([])
    await models.User.destroy({ where: { id: [a.id, b.id, c.id] } })
  })
})
