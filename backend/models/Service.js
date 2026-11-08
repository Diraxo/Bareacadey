const db = require('../database')
const Sequelize = require('sequelize')

const Service = db.define('Service', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   images: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   title: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   subtitle: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   features: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
  }
)
module.exports = Service