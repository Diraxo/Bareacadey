/* Decides who may fetch an uploaded file.
 *
 * The entitlement rules mirror what the clients already enforce in their UI (and what the public course API
 * reports as `chapter_pd`), but are now enforced on the server:
 *   - images and thumbnails are public (landing page, avatars, covers);
 *   - a course introduction video is public (marketing);
 *   - a chapter file is available when the course is free, when it is one of the chapter's free-preview files
 *     (`free_first_n_chapters`), when the user bought the course or the chapter, or to course staff;
 *   - a course PDF/book is available when the course is free, bought, or to course staff;
 *   - draft chapters are staff-only;
 *   - any other non-image file needs a logged-in user. */
const path = require('path')
const jwt = require('jsonwebtoken')
const Sequelize = require('sequelize')
const config = require('../config')
const Course = require('../models/Course')
const Chapter = require('../models/Chapter')
const Payment = require('../models/Payment')
const { isFreeCourse } = require('./freeCourses')
const { containsText } = require('./sqlLike')
const { canManageCourse, canManageAll } = require('./courseAccess')

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
// administrators see everything; an instructor sees the courses they are assigned to (Phase 3), not every paid course
const ADMIN_PERMISSIONS = ['Edit Users']

const isImage = (name) => IMAGE_EXTENSIONS.includes(path.extname(String(name)).toLowerCase())
const isAdmin = (user) => canManageAll(user) || (Array.isArray(user?.permissions) && user.permissions.some((p) => ADMIN_PERMISSIONS.includes(p)))
/* Course staff = administrators, or an instructor assigned to (or the creator of) that course. */
const isStaff = async (user, courseId) => !!user && (isAdmin(user) || (user.permissions?.includes('Instructor') && courseId ? await canManageCourse(user, courseId) : false))

const parseFiles = (text) => {
  try {
    const parsed = JSON.parse(text || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}


/* ---- media tokens (for <video src>/<img src> which cannot send an Authorization header) ---- */

const signMediaToken = (user) =>
  jwt.sign({ typ: 'media', id: user.id, permissions: user.permissions || [] }, config.secrets.media, {
    algorithm: 'HS256',
    expiresIn: config.tokens.mediaExpiresInSeconds,
  })

const verifyMediaToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.secrets.media, { algorithms: ['HS256'] })
    return decoded.typ === 'media' ? { id: decoded.id, permissions: decoded.permissions || [] } : null
  } catch (e) {
    return null
  }
}

/* Resolves the caller from `Authorization: Bearer <access jwt>` or `?st=<media token>`. */
const identify = (req) => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    const bearer = header.split(' ')[1]
    try {
      const decoded = jwt.verify(bearer, config.secrets.accessToken, { algorithms: ['HS256'] })
      return { id: decoded.id, permissions: decoded.permissions || [] }
    } catch (e) {
      // the mobile app sends the long-lived media token this way (players keep their initial headers for hours)
      return verifyMediaToken(bearer)
    }
  }
  if (typeof req.query.st === 'string') return verifyMediaToken(req.query.st)
  return null
}

/* ---- ownership lookup ---- */

const hasPaid = async (user, where) => {
  if (!user) return false
  return !!(await Payment.findOne({ where: { user_id: user.id, paid: true, ...where } }))
}

/* name = stored file name as it appears after /uploads/common/ */
const findOwners = async (name) => {
  const needle = `/uploads/common/${name}`
  // the substring match only narrows the candidates; exact matching happens on the parsed JSON below
  const [chapters, courses] = await Promise.all([
    Chapter.findAll({ where: containsText('chapter_files', needle) }),
    Course.findAll({ where: { [Sequelize.Op.or]: [containsText('pdf_files', needle), containsText('introduction_video', needle), containsText('thumbnail', needle)] } }),
  ])
  return { needle, chapters, courses }
}

/* returns { allowed: true } or { allowed: false, status: 401 | 403 } */
const authorizeCommonFile = async (name, user) => {
  if (isImage(name)) return { allowed: true }

  const { needle, chapters, courses } = await findOwners(name)
  let referenced = false
  let denial = null

  const deny = () => ({ allowed: false, status: user ? 403 : 401 })

  for (const chapter of chapters) {
    const files = parseFiles(chapter.chapter_files)
    const index = files.findIndex((f) => f?.filepath === needle)
    if (index === -1) continue
    referenced = true
    if (await isStaff(user, chapter.course_parent_id)) return { allowed: true }
    if (chapter.routeState !== 'published') { denial = denial || deny(); continue }
    const course = await Course.findOne({ where: { id: chapter.course_parent_id } })
    if (course && isFreeCourse(course)) return { allowed: true }
    if (index + 1 <= (chapter.free_first_n_chapters || 0)) return { allowed: true }
    if (await hasPaid(user, { course_id: chapter.course_parent_id })) return { allowed: true }
    if (await hasPaid(user, { chapter_id: chapter.id })) return { allowed: true }
    denial = denial || deny()
  }

  for (const course of courses) {
    if (parseFiles(course.introduction_video).some((f) => f?.filepath === needle)) return { allowed: true }
    if (parseFiles(course.thumbnail).some((f) => f?.filepath === needle)) return { allowed: true }
    if (parseFiles(course.pdf_files).some((f) => f?.filepath === needle)) {
      referenced = true
      if (isFreeCourse(course) || (await isStaff(user, course.id))) return { allowed: true }
      if (await hasPaid(user, { course_id: course.id })) return { allowed: true }
      denial = denial || deny()
    }
  }

  if (denial) return denial
  if (!referenced) return user ? { allowed: true } : { allowed: false, status: 401 }
  return deny()
}

module.exports = {
  isImage,
  isStaff,
  signMediaToken,
  verifyMediaToken,
  identify,
  authorizeCommonFile,
}
