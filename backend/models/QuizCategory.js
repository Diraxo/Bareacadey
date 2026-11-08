const db = require('../database')
const Sequelize = require('sequelize')

/* Quiz category card shown in the mobile app's Quiz screen (field names follow the app's expectations). */
const QuizCategory = db.define('QuizCategory', {
   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
   category: { type: Sequelize.STRING, allowNull: false },
   image: { type: Sequelize.TEXT, allowNull: true },
})

module.exports = QuizCategory
