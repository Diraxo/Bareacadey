/* Instructor access is granted by an administrator, never by the applicant.
 *
 *   POST /requests                  any signed-in user: ask for instructor access (also created by sign-up with role 12)
 *   GET  /requests                  admin: list requests (?status=pending|approved|rejected|revoked)
 *   POST /requests/:id/approve      admin: { course_ids: [..non-empty..], note? } -> role + permission + course assignments
 *   POST /requests/:id/reject       admin: { note? }
 *   GET  /                          admin: instructors with their assigned courses
 *   PUT  /:userId/courses           admin: { course_ids } replaces the instructor's assignments
 *   POST /:userId/revoke            admin: removes instructor access and assignments
 *
 * "admin" = the "Edit Users" permission, the same one that guards editing other accounts. */
const express = require('express')
const route = express.Router()
const db = require('../database')
const verifyRoles = require('../middlewares/verifyRoles')
const Roles = require('../roles')
const { User, Course, Activity, UserPermission, InstructorRequest, CourseInstructor } = require('../models')

const INSTRUCTOR_ROLE_ID = 12
const STUDENT_ROLE_ID = 5
const PERMISSION_INSTRUCTOR = 14
const STUDENT_PERMISSIONS = [12, 15]
const ADMIN = verifyRoles(Roles.user_saveRoles)

const fail = (res, status, message) => res.status(status).json({ error: true, message })
const serverError = (res, e) => { console.error('Instructor API error:', e?.message); return fail(res, 500, 'Something went wrong') }
const cleanNote = (v) => (typeof v === 'string' ? v.trim().slice(0, 1000) : null)

/* Validates a list of course ids and returns the unique integer ids, or null. */
const parseCourseIds = async (value) => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 500) return null
  const ids = [...new Set(value.map((v) => Number(v)))]
  if (ids.some((n) => !Number.isInteger(n) || n <= 0)) return null
  const found = await Course.count({ where: { id: ids } })
  return found === ids.length ? ids : null
}

const log = (text, userId) => Activity.create({ activity: text, type: 'updated', added_by: userId }).catch(() => {})

/* ---------- requests ---------- */
route.post('/requests', async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } })
    if (!user || user.active === false) return fail(res, 401, 'Account is not allowed')
    if (user.role_id === INSTRUCTOR_ROLE_ID) return fail(res, 409, 'You are already an instructor')
    const open = await InstructorRequest.findOne({ where: { user_id: user.id, status: 'pending' } })
    if (open) return fail(res, 409, 'You already have a pending request')
    const created = await InstructorRequest.create({ user_id: user.id, message: cleanNote(req.body?.message), status: 'pending' })
    res.status(201).json({ message: 'Request submitted. An administrator will review it.', id: created.id })
  } catch (e) { serverError(res, e) }
})

route.get('/requests', ADMIN, async (req, res) => {
  try {
    const where = {}
    if (req.query.status) {
      if (!['pending', 'approved', 'rejected', 'revoked'].includes(req.query.status)) return fail(res, 400, 'Invalid status')
      where.status = req.query.status
    }
    const rows = await InstructorRequest.findAll({
      where,
      order: [['id', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', "full_name", 'email', 'phone', 'role_id', 'active'] }],
    })
    res.json(rows)
  } catch (e) { serverError(res, e) }
})

route.post('/requests/:id/approve', ADMIN, async (req, res) => {
  const t = await db.transaction()
  try {
    const request = await InstructorRequest.findOne({ where: { id: parseInt(req.params.id, 10) || 0 }, transaction: t })
    if (!request) { await t.rollback(); return fail(res, 404, 'Request not found') }
    if (request.status !== 'pending') { await t.rollback(); return fail(res, 409, 'This request was already reviewed') }
    if (request.user_id === req.user.id) { await t.rollback(); return fail(res, 409, 'You cannot approve your own request') }
    const courseIds = await parseCourseIds(req.body?.course_ids)
    if (!courseIds) { await t.rollback(); return fail(res, 400, 'Assign at least one existing course (course_ids)') }
    const user = await User.findOne({ where: { id: request.user_id }, transaction: t })
    if (!user || user.active === false) { await t.rollback(); return fail(res, 409, 'The applicant account is not active') }

    await user.update({ role_id: INSTRUCTOR_ROLE_ID, updated_by: req.user.id }, { transaction: t })
    for (const permission_id of [...STUDENT_PERMISSIONS, PERMISSION_INSTRUCTOR]) {
      await UserPermission.findOrCreate({ where: { user_id: user.id, permission_id }, defaults: { added_by: req.user.id }, transaction: t })
    }
    for (const course_id of courseIds) {
      await CourseInstructor.findOrCreate({ where: { course_id, user_id: user.id }, defaults: { assigned_by: req.user.id }, transaction: t })
    }
    await request.update({ status: 'approved', reviewed_by: req.user.id, reviewed_at: new Date(), review_note: cleanNote(req.body?.note) }, { transaction: t })
    await t.commit()
    await log(`approved instructor "${user.full_name}" for ${courseIds.length} course(s)`, req.user.id)
    res.json({ message: 'Instructor approved', user_id: user.id, course_ids: courseIds })
  } catch (e) { await t.rollback(); serverError(res, e) }
})

route.post('/requests/:id/reject', ADMIN, async (req, res) => {
  try {
    const request = await InstructorRequest.findOne({ where: { id: parseInt(req.params.id, 10) || 0 } })
    if (!request) return fail(res, 404, 'Request not found')
    if (request.status !== 'pending') return fail(res, 409, 'This request was already reviewed')
    await request.update({ status: 'rejected', reviewed_by: req.user.id, reviewed_at: new Date(), review_note: cleanNote(req.body?.note) })
    await log(`rejected instructor request #${request.id}`, req.user.id)
    res.json({ message: 'Request rejected' })
  } catch (e) { serverError(res, e) }
})

/* ---------- instructors ---------- */
route.get('/', ADMIN, async (req, res) => {
  try {
    const instructors = await User.findAll({
      where: { role_id: INSTRUCTOR_ROLE_ID },
      attributes: ['id', "full_name", 'email', 'phone', 'active'],
      include: [{ model: Course, as: 'assignedCourses', attributes: ['id', 'title'], through: { attributes: [] } }],
      order: [['id', 'ASC']],
    })
    res.json(instructors)
  } catch (e) { serverError(res, e) }
})

const instructorTarget = async (req, res) => {
  const user = await User.findOne({ where: { id: parseInt(req.params.userId, 10) || 0 } })
  if (!user) { fail(res, 404, 'User not found'); return null }
  if (user.role_id !== INSTRUCTOR_ROLE_ID) { fail(res, 409, 'This user is not an instructor'); return null }
  return user
}

route.put('/:userId/courses', ADMIN, async (req, res) => {
  const t = await db.transaction()
  try {
    const user = await instructorTarget(req, res)
    if (!user) { await t.rollback(); return }
    const courseIds = await parseCourseIds(req.body?.course_ids)
    if (!courseIds) { await t.rollback(); return fail(res, 400, 'Assign at least one existing course (course_ids); use revoke to remove instructor access') }
    await CourseInstructor.destroy({ where: { user_id: user.id }, transaction: t })
    await CourseInstructor.bulkCreate(courseIds.map((course_id) => ({ course_id, user_id: user.id, assigned_by: req.user.id })), { transaction: t })
    await t.commit()
    await log(`set course assignments of instructor #${user.id}`, req.user.id)
    res.json({ message: 'Assignments updated', course_ids: courseIds })
  } catch (e) { await t.rollback(); serverError(res, e) }
})

route.post('/:userId/revoke', ADMIN, async (req, res) => {
  const t = await db.transaction()
  try {
    const user = await instructorTarget(req, res)
    if (!user) { await t.rollback(); return }
    if (user.id === req.user.id) { await t.rollback(); return fail(res, 409, 'You cannot revoke your own access') }
    await user.update({ role_id: STUDENT_ROLE_ID, updated_by: req.user.id }, { transaction: t })
    await UserPermission.destroy({ where: { user_id: user.id, permission_id: PERMISSION_INSTRUCTOR }, transaction: t })
    await CourseInstructor.destroy({ where: { user_id: user.id }, transaction: t })
    await InstructorRequest.update({ status: 'revoked', reviewed_by: req.user.id, reviewed_at: new Date(), review_note: cleanNote(req.body?.note) }, { where: { user_id: user.id, status: 'approved' }, transaction: t })
    await t.commit()
    await log(`revoked instructor access of #${user.id}`, req.user.id)
    res.json({ message: 'Instructor access revoked' })
  } catch (e) { await t.rollback(); serverError(res, e) }
})

module.exports = route
