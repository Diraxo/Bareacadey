const db = require('../database')
const Sequelize = require('sequelize')

/* Entries of the "All Grades" selector in the mobile Quiz screen; the chosen title is sent back as `search`. */
const QuizTitle = db.define('QuizTitle', {
   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
   title: { type: Sequelize.STRING, allowNull: false },
})

module.exports = QuizTitle
