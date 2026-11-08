const db = require('../database')
const Sequelize = require('sequelize')

const Role = db.define('Role', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   role: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      defaultValue: '',
   },
   plural: {
      type: Sequelize.STRING,
      defaultValue: '',
   },
   color: {
      type: Sequelize.STRING(10),
      defaultValue: '#00000000'
   },
   system: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: 0
   },
}, { timestamps: false })
module.exports = Role