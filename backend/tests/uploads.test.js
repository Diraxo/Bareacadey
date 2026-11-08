const fs = require('fs')
const path = require('path')
const os = require('os')
const { resetDb, makeUser, api, models, MOBILE } = require('./helpers')
const { validateFile, sanitizeDisplayName, saveUpload, UploadError, UPLOAD_ROOT } = require('../middlewares/safeUpload')

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])
const tmpFiles = []
const fakeFile = (name, bytes = PNG, extra = {}) => {
  const p = path.join(os.tmpdir(), `jest-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  fs.writeFileSync(p, bytes)
  tmpFiles.push(p)
  return { name, size: bytes.length, tempFilePath: p, mimetype: 'x', mv: async (dest) => fs.promises.copyFile(p, dest), ...extra }
}
const stored = []

afterAll(() => { [...tmpFiles, ...stored].forEach((p) => { try { fs.rmSync(p, { force: true }) } catch (e) { /* ignore */ } }) })

describe('validateFile', () => {
  test.each(['shell.php', 'page.html', 'icon.svg', 'run.exe', 'script.js', 'x.php.png.sh', 'noextension', '.htaccess', 'a.phtml'])(
    'rejects %s', (name) => {
      expect(() => validateFile(fakeFile(name), 'media')).toThrow(UploadError)
    })
  test.each(['photo.PNG', 'video.mp4', 'notes.pdf', 'sheet.xlsx'])('accepts %s for course media', (name) => {
    const bytes = name.toLowerCase().endsWith('.png') ? PNG : name.endsWith('.pdf') ? Buffer.from('%PDF-1.4 ......') : Buffer.from('data............')
    expect(validateFile(fakeFile(name, bytes), 'media')).toBe(path.extname(name).toLowerCase())
  })
  test('profile pictures must be images', () => {
    expect(() => validateFile(fakeFile('cv.pdf', Buffer.from('%PDF-1.4 ......')), 'image')).toThrow(UploadError)
  })
  test('content must match the claimed image type', () => {
    expect(() => validateFile(fakeFile('evil.png', Buffer.from('<?php echo 1; ?>......')), 'image')).toThrow(/does not match/)
    expect(() => validateFile(fakeFile('evil.pdf', Buffer.from('MZ.exe.........')), 'media')).toThrow(/does not match/)
  })
  test('oversized and truncated uploads are rejected', () => {
    expect(() => validateFile(fakeFile('big.png', PNG, { size: 11 * 1024 * 1024 }), 'image')).toThrow(/too large/)
    expect(() => validateFile(fakeFile('cut.png', PNG, { truncated: true }), 'image')).toThrow(/too large/)
  })
})

describe('stored names never come from the client', () => {
  test('sanitizeDisplayName removes paths and unsafe characters', () => {
    for (const evil of ['../../../etc/passwd', '..\\..\\windows\\system32\\x.png', 'a/b/c.png', 'na\0me.png', '%2e%2e%2fx.png', '<script>.png']) {
      const clean = sanitizeDisplayName(evil)
      expect(clean).not.toMatch(/[\\/\0<>%]/)
      expect(clean).not.toMatch(/^\./)
    }
  })
  test('saveUpload writes inside the chosen folder with a generated name', async () => {
    const { storedName, destination } = await saveUpload(fakeFile('../../../../evil/../x.png'), { subdir: 'common', kind: 'media' })
    stored.push(destination)
    expect(path.dirname(destination)).toBe(path.join(UPLOAD_ROOT, 'common'))
    expect(storedName).not.toMatch(/[\\/]/)
    expect(fs.existsSync(destination)).toBe(true)
  })
  test('video files keep the legacy extension-less layout when requested', async () => {
    const { storedName, destination } = await saveUpload(fakeFile('lesson.mp4', Buffer.from('....ftyp........')), { subdir: 'common', kind: 'media', keepExtension: false })
    stored.push(destination)
    expect(path.extname(storedName)).toBe('')
  })
  test('a directory outside uploads cannot be targeted', async () => {
    await expect(saveUpload(fakeFile('x.png'), { subdir: '../..', kind: 'image' })).rejects.toThrow(/Invalid upload directory/)
  })
})

describe('profile upload through the API', () => {
  let http, student
  beforeAll(async () => { await resetDb(); ;({ http } = api()); student = await makeUser('student@example.com', 'viewer') })

  test('a non-image is rejected with 400 and nothing is stored', async () => {
    const before = await models.UserUpload.count()
    const res = await http.put('/api/users/profile/update').set(MOBILE).set(student.auth)
      .field('full_name', 'X').attach('file', Buffer.from('<?php system($_GET[1]); ?>'), 'shell.php')
    expect(res.status).toBe(400)
    expect(await models.UserUpload.count()).toBe(before)
  })
  test('content that is not really an image is rejected', async () => {
    const res = await http.put('/api/users/profile/update').set(MOBILE).set(student.auth)
      .attach('file', Buffer.from('not a png at all......'), 'me.png')
    expect(res.status).toBe(400)
  })
  test('a valid image is stored under a generated name and linked to the caller only', async () => {
    const other = await makeUser('other@example.com', 'viewer')
    const res = await http.put('/api/users/profile/update').set(MOBILE).set(student.auth)
      .field('id', String(other.user.id)).attach('file', PNG, '../../../me.png')
    expect(res.status).toBe(200)
    const upload = await models.UserUpload.findOne({ order: [['id', 'DESC']] })
    stored.push(path.join(UPLOAD_ROOT, '..', upload.filepath))
    expect(upload.filepath).toMatch(/^\/uploads\/users\/profile\/file_[0-9a-f]+0_\d+--me\.png$/)
    expect((await models.User.findByPk(student.user.id)).upload_id).toBe(upload.id)
    expect((await models.User.findByPk(other.user.id)).upload_id).toBeNull()
  })
  test('replacing a picture removes only the caller’s previous one', async () => {
    const bystander = await makeUser('bystander@example.com', 'viewer')
    const bysUpload = await models.UserUpload.create({ filename: 'b.png', filepath: '/uploads/users/profile/keep-me.png', type: 'localStorage' })
    await bystander.user.update({ upload_id: bysUpload.id })
    const mine = student.user
    const before = (await models.User.findByPk(mine.id)).upload_id
    const res = await http.put('/api/users/profile/update').set(MOBILE).set(student.auth).attach('file', PNG, 'new.png')
    expect(res.status).toBe(200)
    expect(await models.UserUpload.findByPk(before)).toBeNull()
    expect(await models.UserUpload.findByPk(bysUpload.id)).not.toBeNull()
    const upload = await models.UserUpload.findOne({ order: [['id', 'DESC']] })
    stored.push(path.join(UPLOAD_ROOT, '..', upload.filepath))
  })
  test('registration without a photo and with a duplicate username answers instead of hanging', async () => {
    const res = await http.post('/api/auth/create_account').set(MOBILE)
      .send({ full_name: 'A B', username: 'student', email: 'new@example.com', password: 'Str0ng!Passw0rd', role: 5 })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/Username Already Exist/)
  })
})
