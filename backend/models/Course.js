const db = require('../database')
const Sequelize = require('sequelize')

const Course = db.define('Course', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   enable_discount: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
   },
   discounted_price: {
      type: Sequelize.DOUBLE,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "Discounted Price must be a number!",
        },
      }
   },
   discount_percentage: {
      type: Sequelize.DOUBLE,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "Discount Percentage must be a number!",
        },
        min: { args: [0], msg: "Discount Percentage cannot be negative!" },
        max: { args: [99.99], msg: "Discount Percentage must be less than 100!" },
      }
   },
   discount_start_date: {
      type: Sequelize.DATE,
      allowNull: true,
      // validate: {
      //   isDate: {
      //     msg: "Discount Start Date must be a valid date or time!",
      //   },
      // }
   },
   title: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   description: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   main_price: {
      type: Sequelize.DOUBLE,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "Main Price must be a number!",
        },
      }
   },
   thumbnail: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   introduction_video: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   tags: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   discount_end_date: {
      type: Sequelize.DATE,
      allowNull: true,
      // validate: {
      //   isDate: {
      //     msg: "Discount End Date must be a valid date or time!",
      //   },
      // }
   },
   type: {
      type: Sequelize.ENUM("course", "book"),
      validate: {
        isIn: {
          args: [["course","book"]],
          msg: "Type must be one of 'course' or 'book'",
        },
      }
   },
   pdf_files: {
      type: Sequelize.TEXT,
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

module.exports = Course