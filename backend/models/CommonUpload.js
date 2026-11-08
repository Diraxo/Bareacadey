const db = require('../database')
const Sequelize = require('sequelize')

const CommonUpload = db.define('CommonUpload', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   filepath: {
      type: Sequelize.STRING(350),
   },
   filename: {
      type: Sequelize.STRING(300),
    },
    mimetype: {
      type: Sequelize.STRING,
    },
    size: {
      type: Sequelize.INTEGER,
    },
    type: {
      type: Sequelize.STRING(25),
      defaultValue: "localStorage",
    }
}, { timestamps: false })
module.exports = CommonUpload