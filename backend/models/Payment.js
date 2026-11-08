const db = require('../database')
const Sequelize = require('sequelize')

const Payment = db.define('Payment', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   amount: {
      type: Sequelize.DOUBLE,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "Amount must be a number!",
        },
      }
   },
   currency: {
      type: Sequelize.ENUM("ETB", "USD"),
      validate: {
        isIn: {
          args: [["ETB","USD"]],
          msg: "Currency must be one of 'ETB' or 'USD'",
        },
      }
   },
   phone_number: {
    type: Sequelize.STRING,
    allowNull: true,
   },
   reference_no: {
    type: Sequelize.STRING,
    allowNull: true
   },
   paid: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
   },
   sentToInstructor: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
   }
  }
)

module.exports = Payment