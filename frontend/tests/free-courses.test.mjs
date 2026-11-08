/* Every course is free: the admin course/chapter forms and tables carry no money, and the student pages show no price. */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const admin = 'src/components/admin/Courses/'
const student = 'src/components/landing_page/templates/ecommerce/'

const MONEY = /price|discount|currency|\bmain_price\b/i
const withoutComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

test('course and chapter create/edit forms have no monetary fields', () => {
  for (const f of ['Courses/AddCourse.jsx', 'Courses/EditCourse.jsx', 'Chapters/AddChapter.jsx', 'Chapters/EditChapter.jsx']) {
    const src = withoutComments(read(admin + f))
    assert.equal(MONEY.test(src), false, `${f} still mentions ${src.match(MONEY)?.[0]}`)
  }
})

test('the forms keep every non-financial field', () => {
  const add = read(admin + 'Courses/AddCourse.jsx')
  for (const key of ['title:', 'category_id:', 'description:', 'thumbnail:', 'introduction_video:', 'type:', 'pdf_files:', 'submit:']) assert.match(add, new RegExp(key))
  const edit = read(admin + 'Courses/EditCourse.jsx')
  for (const key of ['title:', 'category_id:', 'description:', 'thumbnail', 'routeState', 'submit:']) assert.match(edit, new RegExp(key))
  const chapter = read(admin + 'Chapters/AddChapter.jsx')
  for (const key of ['title:', 'description:', 'free_first_n_chapters:', 'chapter_files:']) assert.match(chapter, new RegExp(key))
})

test('the forms never send money to the server', () => {
  for (const f of ['Courses/AddCourse.jsx', 'Courses/EditCourse.jsx', 'Chapters/AddChapter.jsx', 'Chapters/EditChapter.jsx']) {
    assert.equal(/_(main_price|price|discount\w*|enable_discount)\b/.test(read(admin + f)), false, f)
  }
})

test('admin course and chapter tables and detail pages show no price or discount column', () => {
  for (const f of ['Courses/Courses.jsx', 'Chapters/Chapters.jsx', 'Courses/CourseDetail.jsx']) {
    const src = read(admin + f)
    assert.equal(/field:\s*"(main_price|price|enable_discount|discounted_price|discount_percentage|discount_start_date|discount_end_date)"/.test(src), false, f)
    assert.equal(/Timely Discount/.test(src), false, f)
  }
  assert.equal(/"main_price"/.test(read(admin + 'Courses/Courses.jsx').match(/colsArray = [^\n]*/)[0]), false)
  assert.equal(/"price"/.test(read(admin + 'Chapters/Chapters.jsx').match(/colsArray = [^\n]*/)[0]), false)
})

test('the card view in admin has no price badge', () => {
  const grid = read(admin + 'Courses/Courses.jsx').split('const gridComponent')[1].split('return (')[1].slice(0, 600)
  assert.equal(/Intl|main_price|selectedCurrency/.test(grid), false)
})

test('student-facing course pages show no money and never open a payment dialog', () => {
  for (const f of ['CoursesFrontend.jsx', 'ChapterItems.jsx', 'BookItems.jsx', 'ChaptersList.jsx', 'ELearning.jsx', 'AboutUs.jsx']) {
    const src = read(student + f)
    for (const re of [/\bPurchase[ds]?\b/i, /\bBuy\b/, /Intl\.NumberFormat/, /main_price/, /discount/i, /getCoursePrice|getDiscountedAmount/, /PaymentModal/, /\bETB\b|\bUSD\b/, /<s>/])
      assert.equal(re.test(src), false, `${f} matches ${re}`)
  }
})

test('the course card says Free and the course page offers Enroll Now / Enrolled', () => {
  assert.match(read(student + 'CoursesFrontend.jsx'), /\bFree\b/)
  assert.match(read(student + 'ChaptersList.jsx'), /Enroll Now/)
  assert.match(read(student + 'ChaptersList.jsx'), /Enrolled/)
})

test('lessons are not locked behind a payment on the web', () => {
  for (const f of ['ChapterItems.jsx', 'BookItems.jsx']) {
    const src = read(student + f)
    assert.equal(/MdLockOutline\s*\/>/.test(src), false, f)
    assert.equal(/chapter_pd\s*==|course_pd\s*==/.test(src), false, f)
  }
})

test('progress and review behaviour is still wired to the enrollment flag', () => {
  const src = read(student + 'ChaptersList.jsx')
  assert.match(src, /markFinished/)
  assert.match(src, /isCourseFinished/)
  assert.match(src, /course_pd/)
})
