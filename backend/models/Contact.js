const db = require('../database')
const Sequelize = require('sequelize')

const Contact = db.define('Contact', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   full_name: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Email already exists!",
      },
      validate: {
        notNull: {
          msg: "Email can't be empty!",
        },
        isEmail: {
          msg: "Email must be a valid email address!",
        },
      }
   },
   phone: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   company_name: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   message: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   routeState: {
      type: Sequelize.ENUM("pending", "reached", "archived"),
      defaultValue: "pending",
   },
  }
)
module.exports = Contact