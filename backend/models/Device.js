const db = require('../database')
const Sequelize = require('sequelize')

const Device = db.define('Device', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   device: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
      defaultValue: '',
      autoIncrement: false,
   },
   // when this device became the registered one (cooldown for self-service replacement) and when it last passed a check
   registered_at: { type: Sequelize.DATE, allowNull: true },
   last_seen_at: { type: Sequelize.DATE, allowNull: true },
}, { timestamps: false })
module.exports = Device