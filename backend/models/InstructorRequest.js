const db = require('../database')
const Sequelize = require('sequelize')

/* A request for Instructor access, created when someone picks "Instructor" at sign-up (or asks later).
 * It grants nothing by itself: an administrator must approve it and assign courses (see InstructorController). */
const InstructorRequest = db.define('InstructorRequest', {
   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
   status: { type: Sequelize.ENUM('pending', 'approved', 'rejected', 'revoked'), allowNull: false, defaultValue: 'pending' },
   message: { type: Sequelize.TEXT, allowNull: true },
   review_note: { type: Sequelize.TEXT, allowNull: true },
   reviewed_at: { type: Sequelize.DATE, allowNull: true },
}, {
   indexes: [{ fields: ['user_id'] }, { fields: ['status'] }],
})

module.exports = InstructorRequest
