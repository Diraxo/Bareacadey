/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Chat = require('../models/Chat')
const User = require('../models/User')
const Role = require('../models/Role')
const Permission = require('../models/Permission')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const ChatUpload = require('../models/ChatUpload')


route.get("/userslist", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "full_name",
        "role_id"
      ],
      include: [
        {
          model: Permission,
          attributes: ["permission"],
          through: { attributes: [] },
        },
        {
          model: Role,
          as: "roles",
          attributes: ["role"],
        },
        {
          model: UserUpload,
          as: "url",
          attributes: ["filepath"],
        },
      ],
    });
    const roles = await Role.findAll();

    const result = [];

    roles.forEach(role => {
      let usersWithRole = users.filter(user => user.role_id == role.id && user.id != req.user.id);
      usersWithRole = usersWithRole.filter((user)=>{
        let result = false;
        user?.Permissions?.map((permission)=>{
          if(permission?.permission == "Chat") {
            result = true;
          }
        })
        return result;
      })
      if (usersWithRole.length > 0) {
        result.push({
          id: role?.id,
          role: role?.role,
          plural: role?.plural,
          users: usersWithRole?.map((user)=>{
            var fullUrl = user?.url?.filepath
            ? req.protocol + "://" + req.get("host") + user?.url?.filepath
            : null;

            return {id: user.id, name: user?.full_name, url: fullUrl, role: role?.role}
          })
        });
      }
    });
    return res.json(result)
  } catch (e) {}
});

route.get("/:id",  async (req, res) => {
  try {
    const from = req?.user?.id
    const to = req?.params?.id
    await Chat.findAll({
      where: Sequelize.or(Sequelize.and({from: from, to: to}), Sequelize.and({to: from, from: to})),
      include: [
        {
          model: ChatUpload,
          attributes: [
            "filepath",
            "type",
          ],
        },
      ],
    }).then(async (chatsList) => {
      let updatedChats = []
      await Promise.all(
        chatsList.map(async (chat) => {
          const chat_upload = chat?.ChatUpload

          const fullUrlChatUpload = chat_upload?.filepath
            ? req.protocol + "://" + req.get("host") + chat_upload?.filepath
            : null;
          const type = chat_upload?.type;

          updatedChats.push({
            ...chat.toJSON(),
            upload_url: fullUrlChatUpload,
            upload_type: type,
          });
        })
      );
      res.json(updatedChats.sort((a, b) => a.id - b.id));
    });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       res.send({ error: true, message: e?.message });
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.post("/",  async (req, res) => {
  try {
    const {
      _message,
      _type,
      _private,
      _to,
      _chatupload_id,
    } = req.body;
    const chat = await Chat.create({
      message: _message,
      type: _type??"text",
      private: _private??false,
      from: req?.user?.id,
      to: _to,
      chatupload_id: _chatupload_id ? _chatupload_id : null,
    })
    return res.json({ message: "Successfully Created" });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       if(e?.message?.startsWith("Incorrect integer value:")) {
         return res.json({ error: true, message: "Chat sending error!" })
       } else {
         res.send({ error: true, message: e?.message });
       }
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.put("/",  async (req, res) => {
  try {
    const {
      id,
      _message,
      _type,
      _seen,
      _private,
      _chatupload_id,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const chat = await Chat.findOne({
      where: { id: id },
    })
    if(!chat || String(chat.from) !== String(req.user.id)) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(chat) {
      if(_message != null) {
        chat.message = _message;
      }
      if(_type != null) {
        chat.type = _type;
      }
      if(_seen != null) {
        chat.seen = _seen;
      }
      if(_private != null) {
        chat.private = _private;
      }
      
      if(_chatupload_id != null) {
        chat.chatupload_id = _chatupload_id;
      }
      await chat.save();
    }
    return res.json({ message: "Successfully Updated" });
   } catch (e) {
     if(e?.errors?.length > 0 && e?.errors[0]?.message) {
       return res.json({ error: true, message: e?.errors[0]?.message })
     }
     else if(e?.message) {
       if(e?.message?.startsWith("Incorrect integer value:")) {
         return res.json({ error: true, message: "Select all fields first!" })
       } else {
         res.send({ error: true, message: e?.message });
       }
     }
     else {
       return res.json({error: true, message: "Something went wrong"})
     }
   }
});

route.delete("/",  async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const chat = await Chat.findOne({
      where: { id: id },
    })
    if(!chat || String(chat.from) !== String(req.user.id)) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    await Chat.destroy({where: {id: id } });
    return res.json({ message: "Successfully Deleted" });
  } catch (e) {
    if(e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
    }
    else if(e?.message) {
      res.send({ error: true, message: e?.message });
    }
    else {
      return res.json({error: true, message: "Something went wrong"})
    }
  }
});

module.exports = route