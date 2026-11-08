const db = require('../database')
const Sequelize = require('sequelize')

const Permission = db.define('Permission', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   permission: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      defaultValue: '',
   },
   grouped_under: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   subgroup_string: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   system: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: 0
   }
}, { timestamps: false })
module.exports = Permission