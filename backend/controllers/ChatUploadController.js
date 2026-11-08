const ChatUpload = require("../models/ChatUpload");
const Sequelize = require("sequelize");
const express = require("express");
const route = express.Router();
const Chat = require('../models/Chat')

const fs = require('fs');

const deleteFile = async (id) => {
    try {
      const oldFile = await ChatUpload.findOne({where: {id: id}})
      if(oldFile) {
        const fPath = `files${oldFile.filepath}`
        if (fs.existsSync(fPath)) {
          fs.unlink(fPath, (err) => {})
        }
        await ChatUpload.destroy({where: {id: id}})
      }
      return
    } catch(e) { console.error('Chat upload delete failed:', e?.message) }
}

//delete route
route.delete("/",  async (req,res)=>{
  try {
    const id = req.body.id;
    if(!id) {
      return res.json({error: true, message: "You have to pass id"})
    }
    // only the sender of a message that carries this attachment may remove it
    const owned = await Chat.findOne({where: {chatupload_id: id, from: req.user.id}})
    if(!owned) {
      return res.status(403).json({error: true, message: "You are not authorized!"})
    }
    await deleteFile(id)
    return res.json({message: "Successfully Deleted"})
  } catch(e) {
    return res.status(500).json({error: true, message: "Something went wrong"})
  }
})



module.exports = route;
