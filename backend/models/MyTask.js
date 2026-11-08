const db = require('../database')
const Sequelize = require('sequelize')

const MyTask = db.define('MyTask', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   title: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   start: {
      type: Sequelize.DATE,
      // defaultValue: Sequelize.NOW,
      validate: {
        isDate: {
          msg: "Start Date must be a valid date or time!",
        },
      }
   },
   end: {
      type: Sequelize.DATE,
      // defaultValue: Sequelize.NOW,
      validate: {
        isDate: {
          msg: "End Date must be a valid date or time!",
        },
      }
   },
   allDay: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
   },
   description: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   routeState: {
      type: Sequelize.ENUM("not_started", "in_progress", "paused", "completed", "canceled"),
      defaultValue: "not_started",
   },
  }
)
module.exports = MyTask