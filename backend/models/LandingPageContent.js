const db = require('../database')
const Sequelize = require('sequelize')

const LandingPageContent = db.define('LandingPageContent', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   label_1: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   label_title_colored: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   title_color_label: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   label_title: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   label_2_description: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   title: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   title_colored: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   title_color: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   subtitle: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   subtitle_short: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   hero_image: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
  }
)
module.exports = LandingPageContent