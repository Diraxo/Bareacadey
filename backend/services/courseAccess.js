/* Who may change which course.
 *
 * Holding the "Instructor" permission is necessary but not sufficient: an instructor manages only courses that an
 * administrator assigned to them (CourseInstructor) or that they created themselves. "Manage All Courses" (held by
 * administrators) lifts the limit. Permission names come from the JWT; assignments are always read from the database
 * so revoking an assignment takes effect immediately instead of when the access token expires. */
const { Op } = require('sequelize')
const Course = require('../models/Course')
const Chapter = require('../models/Chapter')
const CourseInstructor = require('../models/CourseInstructor')

const MANAGE_ALL = 'Manage All Courses'

const canManageAll = (user) => Array.isArray(user?.permissions) && user.permissions.includes(MANAGE_ALL)

const canManageCourse = async (user, courseId) => {
  if (!user?.id || !courseId) return false
  if (canManageAll(user)) return true
  const course = await Course.findOne({ where: { id: courseId }, attributes: ['id', 'added_by'] })
  if (!course) return false
  if (course.added_by && course.added_by === user.id) return true
  return (await CourseInstructor.count({ where: { course_id: course.id, user_id: user.id } })) > 0
}

const canManageChapter = async (user, chapterId) => {
  if (!chapterId) return false
  const chapter = await Chapter.findOne({ where: { id: chapterId }, attributes: ['id', 'course_parent_id', 'added_by'] })
  if (!chapter) return false
  if (canManageAll(user)) return true
  if (chapter.added_by && chapter.added_by === user?.id) return true
  return canManageCourse(user, chapter.course_parent_id)
}

/* Which courses / chapters a user sees in the admin lists. Administrators ("Manage All Courses") see everything;
 * anyone else sees what they created plus what was assigned to them. A course never drops out of a list just because
 * somebody else edited or published it. Returns a Sequelize `where` fragment. */
const visibleCourseWhere = async (user) => {
  if (canManageAll(user)) return {}
  const userId = user?.id ?? 0
  const assigned = (await CourseInstructor.findAll({ where: { user_id: userId }, attributes: ['course_id'] })).map((r) => r.course_id)
  return { [Op.or]: [{ added_by: userId }, { id: { [Op.in]: assigned } }] }
}

const visibleChapterWhere = async (user) => {
  if (canManageAll(user)) return {}
  const courses = await Course.findAll({ where: await visibleCourseWhere(user), attributes: ['id'] })
  return { [Op.or]: [{ added_by: user?.id ?? 0 }, { course_parent_id: { [Op.in]: courses.map((c) => c.id) } }] }
}

/* Express guards. Responses keep the shape the existing endpoints use for refusals. */
// 401, not 403: the web and mobile apps treat 403 as "token expired" and would refresh the token or log the user out
const deny = (res) => res.status(401).json({ error: true, message: 'You are not assigned to this course' })

const requireCourseAccess = (getId) => async (req, res, next) => {
  try {
    if (await canManageCourse(req.user, getId(req))) return next()
    return deny(res)
  } catch (e) {
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
}

const requireChapterAccess = (getId) => async (req, res, next) => {
  try {
    if (await canManageChapter(req.user, getId(req))) return next()
    return deny(res)
  } catch (e) {
    return res.status(500).json({ error: true, message: 'Something went wrong' })
  }
}

/* Creating a chapter needs access to the course it is added to. */
const requireParentCourseAccess = requireCourseAccess((req) => req.body?._course_parent_id)

module.exports = { visibleCourseWhere, visibleChapterWhere, canManageAll, canManageCourse, canManageChapter, requireCourseAccess, requireChapterAccess, requireParentCourseAccess, MANAGE_ALL }
