/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Activity = require('../../models/Activity')
const verifyRoles = require("../../middlewares/verifyRoles")
let Roles = require("../../roles")

const Config = require('../../models/Config')

route.get("/", verifyRoles(Roles?.system_config_findAllRoles), async (req, res) => {
  try {
    const isAdmin = (req.user?.permissions || []).includes("Edit Users");
    // email/upload/payment rows hold credentials; everyone else only gets the display settings row
    const rows = await Config.findAll(isAdmin ? {} : { where: { type: "settings" } });
    return res.json(rows);
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





route.put("/", verifyRoles(Roles?.system_config_saveRoles), async (req, res) => {
  try {
    const {
      id,
      config,
      type,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const conf = await Config.findOne({
      where: { id: id },
    })
    if(!conf) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(conf) {
      if(config != null) {
        conf.config = typeof config === "string" ? config : JSON.stringify(config);
      }
      // if(type) {
      //   conf.type = type;
      // }
      await conf.save();
      await Activity.create({
        activity: `configuration "${conf?.type}"`,
        type: "updated",
        added_by: req.user.id,
      });
    }
    return res.json({ message: "Successfully Updated" });
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