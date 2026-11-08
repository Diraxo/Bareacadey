const db = require('../database')
const Sequelize = require('sequelize')

const CorouselItem = db.define('CorouselItem', {
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
   subtitle: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   image: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   enable_action_button: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
   },
   action_button_type: {
      type: Sequelize.ENUM("Contact Us", "Register"),
      validate: {
        isIn: {
          args: [["Contact Us","Register"]],
          msg: "Action Button Type must be one of 'Contact Us' or 'Register'",
        },
      }
   },
   action_message: {
      type: Sequelize.STRING,
      allowNull: true,
   },
  }
)

module.exports = CorouselItem