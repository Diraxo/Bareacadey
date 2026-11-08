const fs = require('fs')
const path = require('path')
const { resetDb, makeUser, api, models } = require('./helpers')
const { safeJoin, FILES_ROOT } = require('../routes/media')

const commonDir = path.join(FILES_ROOT, 'common')
const keyDir = path.join(FILES_ROOT, 'hls-key')
const created = []
const writeFile = (dir, name, content = 'DATA') => {
  fs.mkdirSync(dir, { recursive: true })
  const p = path.join(dir, name)
  fs.writeFileSync(p, content)
  created.push(p)
  return p
}
const ref = (name) => JSON.stringify([{ filename: name, filepath: `/uploads/common/${name}` }])

let http, paid, unpaid, staff, otherTeacher, admin, chapterPaid, chapterOnly

const names = {
  paidVideo: 'jest_paid_video--a', freeVideo: 'jest_free_video--b', previewVideo1: 'jest_preview1--c', previewVideo2: 'jest_preview2--d',
  draftVideo: 'jest_draft_video--e', book: 'jest_book--f.pdf', freeCourseVideo: 'jest_freecourse--g', intro: 'jest_intro--h',
  orphan: 'jest_orphan--i.pdf', image: 'jest_image--j.png', chapterOnlyVideo: 'jest_chapteronly--k',
}

beforeAll(async () => {
  await resetDb()
  ;({ http } = api())
  paid = await makeUser('paid@example.com', 'viewer')
  unpaid = await makeUser('unpaid@example.com', 'viewer')
  staff = await makeUser('teacher@example.com', 'instructor')
  otherTeacher = await makeUser('other-teacher@example.com', 'instructor')
  admin = await makeUser('admin@example.com', 'admin')
  Object.values(names).forEach((n) => writeFile(commonDir, n))

  const premium = await models.Course.create({
    title: 'Premium', main_price: 900, type: 'course', routeState: 'published',
    introduction_video: ref(names.intro), pdf_files: ref(names.book),
  })
  const free = await models.Course.create({ title: 'Free', main_price: 0, type: 'course', routeState: 'published' })
  chapterPaid = await models.Chapter.create({ title: 'Paid chapter', course_parent_id: premium.id, routeState: 'published', price: 50, chapter_files: ref(names.paidVideo) })
  await models.Chapter.create({
    title: 'With preview', course_parent_id: premium.id, routeState: 'published', free_first_n_chapters: 1,
    chapter_files: JSON.stringify([{ filepath: `/uploads/common/${names.previewVideo1}` }, { filepath: `/uploads/common/${names.previewVideo2}` }]),
  })
  await models.Chapter.create({ title: 'Draft', course_parent_id: premium.id, routeState: 'draft', chapter_files: ref(names.draftVideo) })
  await models.Chapter.create({ title: 'Free chapter', course_parent_id: free.id, routeState: 'published', chapter_files: ref(names.freeCourseVideo) })
  chapterOnly = await models.Chapter.create({ title: 'Sold alone', course_parent_id: premium.id, routeState: 'published', price: 30, chapter_files: ref(names.chapterOnlyVideo) })

  await models.CourseInstructor.create({ course_id: premium.id, user_id: staff.user.id }) // staff teaches Premium
  await models.Payment.create({ amount: 900, currency: 'ETB', user_id: paid.user.id, course_id: premium.id, paid: true, reference_no: 'r1' })
  // the "unpaid" student has an attempt that was never confirmed
  await models.Payment.create({ amount: 900, currency: 'ETB', user_id: unpaid.user.id, course_id: premium.id, paid: false, reference_no: 'r2' })
  await models.Payment.create({ amount: 30, currency: 'ETB', user_id: unpaid.user.id, chapter_id: chapterOnly.id, paid: true, reference_no: 'r3' })

  writeFile(keyDir, 'jest_enc.key', '0123456789abcdef')
  writeFile(keyDir, 'jest_enc.keyinfo', 'http://x\n/path')
  writeFile(path.join(FILES_ROOT, 'videos', names.paidVideo), 'index.m3u8', '#EXTM3U')
})

afterAll(() => { created.forEach((p) => { try { fs.rmSync(p, { force: true }) } catch (e) { /* ignore */ } }); fs.rmSync(path.join(FILES_ROOT, 'videos', names.paidVideo), { recursive: true, force: true }) })

const get = (name, headers = {}, query = '') => http.get(`/uploads/common/${encodeURIComponent(name)}${query}`).set(headers)

describe('paid course media (S6)', () => {
  test('anonymous visitors cannot fetch a paid video, even with a spoofed Referer', async () => {
    expect((await get(names.paidVideo)).status).toBe(401)
    expect((await get(names.paidVideo, { Referer: process.env.FRONTEND_URL, Origin: process.env.FRONTEND_URL })).status).toBe(401)
  })
  test('a signed-in student who has not paid is refused (an unconfirmed attempt does not count)', async () => {
    expect((await get(names.paidVideo, unpaid.auth)).status).toBe(403)
    expect((await get(names.book, unpaid.auth)).status).toBe(403)
  })
  test('a student who paid for the course gets the video and the book', async () => {
    const res = await get(names.paidVideo, paid.auth)
    expect(res.status).toBe(200)
    expect((await get(names.book, paid.auth)).status).toBe(200)
  })
  test('buying a single chapter unlocks only that chapter', async () => {
    expect((await get(names.chapterOnlyVideo, unpaid.auth)).status).toBe(200)
    expect((await get(names.paidVideo, unpaid.auth)).status).toBe(403)
  })
  test('an instructor assigned to the course can fetch everything in it, including drafts', async () => {
    expect((await get(names.paidVideo, staff.auth)).status).toBe(200)
    expect((await get(names.draftVideo, staff.auth)).status).toBe(200)
    expect((await get(names.book, staff.auth)).status).toBe(200)
  })
  test('an instructor who is NOT assigned to the course gets no free access to its paid content', async () => {
    expect((await get(names.paidVideo, otherTeacher.auth)).status).toBe(403)
    expect((await get(names.draftVideo, otherTeacher.auth)).status).toBe(403)
    expect((await get(names.book, otherTeacher.auth)).status).toBe(403)
    expect((await get(names.freeCourseVideo, otherTeacher.auth)).status).toBe(200) // free content stays free
  })
  test('administrators can fetch everything', async () => {
    expect((await get(names.paidVideo, admin.auth)).status).toBe(200)
    expect((await get(names.draftVideo, admin.auth)).status).toBe(200)
  })
  test('draft chapters are not available to students, even paying ones', async () => {
    expect((await get(names.draftVideo, paid.auth)).status).toBe(403)
  })
  test('free-preview files and free courses are open to anyone', async () => {
    expect((await get(names.previewVideo1)).status).toBe(200) // first file of a chapter with free_first_n_chapters=1
    expect((await get(names.previewVideo2)).status).toBe(401)
    expect((await get(names.freeCourseVideo)).status).toBe(200)
  })
  test('marketing assets (course intro video) and images are public', async () => {
    expect((await get(names.intro)).status).toBe(200)
    expect((await get(names.image)).status).toBe(200)
  })
  test('unreferenced non-image files need a login', async () => {
    expect((await get(names.orphan)).status).toBe(401)
    expect((await get(names.orphan, unpaid.auth)).status).toBe(200)
  })
  test('missing files are 404 for authorised callers', async () => {
    expect((await get('jest_does_not_exist--z.png')).status).toBe(404)
    expect((await get('jest_does_not_exist--z', staff.auth)).status).toBe(404)
  })
  test('files are served with nosniff and a private cache policy', async () => {
    const res = await get(names.paidVideo, paid.auth)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['cache-control']).toMatch(/private/)
  })
})

describe('media token for <video>/<img> elements', () => {
  test('requires a login to obtain', async () => {
    expect((await http.get('/api/media/token')).status).toBe(401)
  })
  test('works as ?st= and carries the user’s entitlements', async () => {
    const { body } = await http.get('/api/media/token').set(paid.auth)
    expect(body.token).toBeTruthy()
    expect((await get(names.paidVideo, {}, `?st=${body.token}`)).status).toBe(200)
    const other = await http.get('/api/media/token').set(unpaid.auth)
    expect((await get(names.paidVideo, {}, `?st=${other.body.token}`)).status).toBe(403)
  })
  test('also accepted as a Bearer header (what the mobile players send)', async () => {
    const { body } = await http.get('/api/media/token').set(paid.auth)
    expect((await get(names.paidVideo, { Authorization: `Bearer ${body.token}` })).status).toBe(200)
    expect((await get(names.paidVideo, { Authorization: 'Bearer garbage' })).status).toBe(401)
  })
  test('forged, tampered or wrong-type tokens are rejected', async () => {
    const { body } = await http.get('/api/media/token').set(paid.auth)
    expect((await get(names.paidVideo, {}, `?st=${body.token}x`)).status).toBe(401)
    expect((await get(names.paidVideo, {}, '?st=abc')).status).toBe(401)
    // an access token is not accepted in the query string
    expect((await get(names.paidVideo, {}, `?st=${paid.token}`)).status).toBe(401)
  })
  test('a media token cannot be used as an API access token', async () => {
    const { body } = await http.get('/api/media/token').set(paid.auth)
    const res = await http.get('/api/roles/mine').set({ Authorization: `Bearer ${body.token}` })
    expect(res.status).toBe(403)
  })
})

describe('path traversal', () => {
  test.each([
    '..%2F..%2Fserver.js', '..%2f..%2f..%2fpackage.json', '%2e%2e%2f%2e%2e%2fserver.js', '....//....//server.js', 'a%5C..%5C..%5Cserver.js', '%00', '.',
  ])('GET /uploads/common/%s never reads outside the upload folder', async (evil) => {
    const res = await http.get(`/uploads/common/${evil}`).set(staff.auth)
    expect([400, 403, 404]).toContain(res.status) // 403: stopped by the origin gate
    expect(res.text || '').not.toContain('require(')
  })
  test('HLS and key routes are guarded too', async () => {
    for (const url of ['/uploads/videos/..%2F..%2F/server.js', '/uploads/videos/jest_paid_video--a/..%2F..%2F..%2Fserver.js', '/uploads/hls-key/..%2F..%2Fserver.js']) {
      const res = await http.get(url).set(staff.auth)
      expect([400, 404]).toContain(res.status)
    }
  })
  test('safeJoin rejects escapes and accepts plain names', () => {
    expect(safeJoin(FILES_ROOT, 'common', '..')).toBeNull()
    expect(safeJoin(FILES_ROOT, 'common', 'a/../../b')).toBeNull()
    expect(safeJoin(FILES_ROOT, 'common', 'a\\b')).toBeNull()
    expect(safeJoin(FILES_ROOT, 'common', '')).toBeNull()
    expect(safeJoin(FILES_ROOT, 'common', 'ok.png')).toBe(path.join(FILES_ROOT, 'common', 'ok.png'))
  })
})

describe('HLS key and playlists (S6)', () => {
  test('the AES key is never served anonymously', async () => {
    expect((await http.get('/uploads/hls-key/jest_enc.key')).status).toBe(401)
    expect((await http.get('/uploads/hls-key/jest_enc.key').set({ Referer: process.env.FRONTEND_URL })).status).toBe(401)
  })
  test('a signed-in user gets the key, with no-store', async () => {
    const res = await http.get('/uploads/hls-key/jest_enc.key').set(paid.auth)
    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
  })
  test('the keyinfo file (contains a server path) is never served', async () => {
    expect((await http.get('/uploads/hls-key/jest_enc.keyinfo').set(staff.auth)).status).toBe(404)
  })
  test('playlists follow the entitlement of the source video', async () => {
    const url = `/uploads/videos/${names.paidVideo}/index.m3u8`
    expect((await http.get(url)).status).toBe(401)
    expect((await http.get(url).set(unpaid.auth)).status).toBe(403)
    expect((await http.get(url).set(paid.auth)).status).toBe(200)
  })
})

describe('the rest of the files tree is no longer public', () => {
  test('there is no static handler for files/ (temp, chat, signatures, richtext, ...)', async () => {
    for (const url of ['/uploads/temp/anything', '/uploads/signatures/x.png', '/uploads/richtext/x.png', '/uploads/hls-key/enc.keyinfo', '/package.json', '/.env']) {
      const anonymous = await http.get(url)
      expect([401, 403, 404]).toContain(anonymous.status)
      // even a fully authenticated staff member from the app finds nothing there: no static handler exists
      const authed = await http.get(url).set({ 'x-react-native-app': process.env.MOBILE_APP_KEY, 'user-agent': 'rnafm' }).set(staff.auth)
      expect(authed.status).toBe(404)
    }
  })
  test('chat attachments need a login', async () => {
    expect((await http.get('/uploads/chat/x.png')).status).toBe(401)
  })
  test('profile pictures are served only as images', async () => {
    writeFile(path.join(FILES_ROOT, 'users', 'profile'), 'jest_avatar.png', 'PNG')
    writeFile(path.join(FILES_ROOT, 'users', 'profile'), 'jest_note.html', '<script>1</script>')
    expect((await http.get('/uploads/users/profile/jest_avatar.png')).status).toBe(200)
    expect((await http.get('/uploads/users/profile/jest_note.html')).status).toBe(404)
  })
})
