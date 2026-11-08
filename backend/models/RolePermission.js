const db = require('../database')
const Sequelize = require('sequelize')
const Role = require('./Role')
const Permission = require('./Permission')

const RolePermission = db.define('RolePermission', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   system: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      unique: false,
      defaultValue: 0,
      autoIncrement: false,
   },
}, { timestamps: false })
module.exports = RolePermission