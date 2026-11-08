const db = require('../database')
const Sequelize = require('sequelize')

const CustomField = db.define('CustomField', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   config: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: "[]"
   },
   model: {
      type: Sequelize.STRING,
      allowNull: false,
   }
}, { timestamps: false })
module.exports = CustomField