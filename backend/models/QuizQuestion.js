const db = require('../database')
const Sequelize = require('sequelize')

const QuizQuestion = db.define('QuizQuestion', {
   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
   title: { type: Sequelize.TEXT, allowNull: false },
   explanation: { type: Sequelize.TEXT, allowNull: true },
   position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
}, {
   indexes: [{ fields: ['quiz_id'] }],
})

module.exports = QuizQuestion
