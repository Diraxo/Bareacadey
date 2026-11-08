const db = require('../database')
const Sequelize = require('sequelize')

const Chat = db.define('Chat', {
   id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
   },
   message: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   type: {
      type: Sequelize.ENUM("text", "image", "video", "audio", "file"),
      validate: {
        isIn: {
          args: [["text","image","video","audio","file"]],
          msg: "Type must be one of 'text', 'image', 'video', 'audio' or 'file'",
        },
      }
   },
   seen: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
   },
   private: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
   },
  }
)
module.exports = Chat