const db = require('../database')
const Sequelize = require('sequelize')

const Notification = db.define('Notification', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   type: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "general"
    },
    message: {
      type: Sequelize.STRING,
      allowNull: false,
   },
})



module.exports = Notification