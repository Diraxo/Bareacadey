const db = require('../database')
const Sequelize = require('sequelize')

const Chapter = db.define('Chapter', {
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
   description: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   price: {
      type: Sequelize.DOUBLE,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "Price must be a number!",
        },
      }
   },
   free_first_n_chapters: {
      type: Sequelize.DOUBLE,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "Free First n Chapters must be a number!",
        },
      }
   },
   chapter_files: {
      // MEDIUMTEXT (16 MB): one JSON entry per file, a TEXT column (64 KB) would cap a unit at a few hundred files
      type: db.getDialect() === 'mysql' ? Sequelize.TEXT('medium') : Sequelize.TEXT,
      allowNull: true,
   },
   routeState: {
      type: Sequelize.ENUM("draft", "published"),
      defaultValue: "draft",
   },
   routeState_reason: {
      type: Sequelize.TEXT,
      defaultValue: "{}",
   },
  }
)

module.exports = Chapter