const db = require('../database')
const Sequelize = require('sequelize')
const User = require('./User')
const Permission = require('./Permission')

const UserPermission = db.define('UserPermission', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
}, { timestamps: false })
module.exports = UserPermission