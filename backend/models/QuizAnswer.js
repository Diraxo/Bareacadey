const db = require('../database')
const Sequelize = require('sequelize')

const QuizAnswer = db.define('QuizAnswer', {
   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
   title: { type: Sequelize.TEXT, allowNull: false },
   is_correct: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
   position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
}, {
   indexes: [{ fields: ['question_id'] }],
})

module.exports = QuizAnswer
