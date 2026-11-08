const db = require('../database')
const Sequelize = require('sequelize')

const Faq = db.define('Faq', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   question: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   answer: {
      type: Sequelize.STRING,
      allowNull: true,
   },
  }
)
module.exports = Faq