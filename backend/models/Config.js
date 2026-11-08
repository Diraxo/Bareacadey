const db = require('../database')
const Sequelize = require('sequelize')

const Config = db.define('Config', {
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
   type: {
      type: Sequelize.STRING,
      allowNull: false,
   }
}, { timestamps: false })
module.exports = Config