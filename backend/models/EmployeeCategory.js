const db = require('../database')
const Sequelize = require('sequelize')

const EmployeeCategory = db.define('EmployeeCategory', {
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
   prefix: {
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
module.exports = EmployeeCategory