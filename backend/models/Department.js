const db = require('../database')
const Sequelize = require('sequelize')

const Department = db.define('Department', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   department_code: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   status: {
      type: Sequelize.ENUM("Active", "Inactive"),
      validate: {
        isIn: {
          args: [["Active","Inactive"]],
          msg: "Status must be one of 'Active' or 'Inactive'",
        },
      }
   },
  }
)
module.exports = Department