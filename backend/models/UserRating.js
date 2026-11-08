const db = require('../database')
const Sequelize = require('sequelize')

const UserRating = db.define('UserRating', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   rating: {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "Rating must be a number!",
        },
      }
   },
   comment: {
      type: Sequelize.STRING,
      allowNull: true,
   },
  }
)

module.exports = UserRating