const db = require('../database')
const Sequelize = require('sequelize')

const Quiz = db.define('Quiz', {
   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
   title: { type: Sequelize.STRING, allowNull: false },
   // academic year label as displayed/filtered by the app, e.g. "2013/2014"
   year: { type: Sequelize.STRING, allowNull: true },
   diff_level: { type: Sequelize.STRING, allowNull: true },
   quiz_description: { type: Sequelize.TEXT, allowNull: true },
   // total time in seconds; null lets the app fall back to 30 s per question
   time: { type: Sequelize.INTEGER, allowNull: true },
   // percentage needed to pass; null lets the app fall back to 50
   pass_mark: { type: Sequelize.INTEGER, allowNull: true },
   routeState: { type: Sequelize.ENUM("draft", "published"), defaultValue: "draft" },
}, {
   indexes: [{ fields: ['category_id'] }, { fields: ['routeState'] }, { fields: ['year'] }],
})

module.exports = Quiz
