const db = require('../database')
const Sequelize = require('sequelize')

const Category = db.define('Category', {
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
   rowDragIndex: {
     type: Sequelize.INTEGER,
     defaultValue: 0,
   },
  }
)

Category.addHook ('beforeCreate', async record => {
  const count = await Category.count()
  record.rowDragIndex = count + 1
})

module.exports = Category