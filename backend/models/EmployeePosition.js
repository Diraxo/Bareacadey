const db = require('../database')
const Sequelize = require('sequelize')

const EmployeePosition = db.define('EmployeePosition', {
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
   status: {
      type: Sequelize.ENUM("Active", "Inactive"),
      validate: {
        isIn: {
          args: [["Active","Inactive"]],
          msg: "Status must be one of 'Active' or 'Inactive'",
        },
      }
   },
   rowDragIndex: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
   },
  }
)

EmployeePosition.addHook ('beforeCreate', async record => {
   const count = await EmployeePosition.count ();
   record.rowDragIndex = count + 1;
 })

module.exports = EmployeePosition