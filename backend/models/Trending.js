const db = require('../database')
const Sequelize = require('sequelize')

const Trending = db.define('Trending', {
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
   group_under: {
      type: Sequelize.STRING,
      allowNull: true,
   },
  }
)

module.exports = Trending