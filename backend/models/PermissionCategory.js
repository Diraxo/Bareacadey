const db = require('../database')
const Sequelize = require('sequelize')

const PermissionCategory = db.define('PermissionCategory', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      defaultValue: '',
      autoIncrement: false,
   },
   system: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: 0
   }
}, { timestamps: false })
module.exports = PermissionCategory