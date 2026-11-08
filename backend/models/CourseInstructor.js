const db = require('../database')
const Sequelize = require('sequelize')

/* Explicit assignment of an instructor to a course. An instructor may manage a course (and its chapters) only if
 * they are assigned here, or they created it, or they hold the "Manage All Courses" permission. */
const CourseInstructor = db.define('CourseInstructor', {
   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
}, {
   indexes: [{ unique: true, fields: ['course_id', 'user_id'] }, { fields: ['user_id'] }],
})

module.exports = CourseInstructor
