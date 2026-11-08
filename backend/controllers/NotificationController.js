const Notification = require("../models/Notification")
const User = require("../models/User")
const Sequelize = require("sequelize")
const express = require("express")
const route = express.Router()
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")
const Activity = require("../models/Activity")

route.get("/", verifyRoles(Roles.notification_findAllRoles), async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['seen','DESC'],['createdAt', 'DESC']],
      limit: 50,
      include: [
        {
          model: User,
          as: "from",
          attributes: ['id', "full_name"],
        },
        
      ],
    });
    res.json(notifications);
      } catch (err) {
    return res.status(500).send({ error: true, message: "Something went wrong" });
  }
});

route.post("/", verifyRoles(Roles.notification_createRoles), async (req, res) => {
  try {
      const io = req.app.locals.io;
      const { message } = req.body;
      const notification = await Notification.create({ message });
      io.to('chat-users').emit('newNotification', notification);
      res.status(201).json(notification);
  } catch (err) {
    return res.status(500).send({ error: true, message: "Something went wrong" });
  }
});

route.put("/", verifyRoles(Roles.notification_saveRoles), async (req, res) => {
   try {
     
   } catch (err) {
    return res.status(500).send({ error: true, message: "Something went wrong" });
   }
 });

module.exports = route;
