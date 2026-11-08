/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Contact = require('../models/Contact')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")



route.get(['/', '/parent/:id'], verifyRoles(Roles?.contact_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await Contact.findAll().then(async (contactsList) => {
      let updatedContacts = []
      await Promise.all(
        contactsList.map(async (contact) => {
          updatedContacts.push({
            ...contact.toJSON(),
          });
        })
      );
      res.json(updatedContacts.sort((a, b) => b.id - a.id));
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

route.get("/:id", verifyRoles(Roles?.contact_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Contact.findOne({
      where: { id: id },
    }).then(async (contact) => {
          if(!contact) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
        
      let updatedContact = {
        ...contact.toJSON(),
      };
      res.json(updatedContact);
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

route.post("/", verifyRoles(Roles?.contact_createRoles), async (req, res) => {
  try {
    const {
      _full_name,
      _email,
      _phone,
      _company_name,
      _message,
    } = req.body;
    const contact = await Contact.create({
      full_name: _full_name,
      email: _email,
      phone: _phone,
      company_name: _company_name,
      message: _message,
    })
    return res.json({ message: "Successfully Created" });
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

route.put("/", verifyRoles(Roles?.contact_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _full_name,
      _email,
      _phone,
      _company_name,
      _message,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const contact = await Contact.findOne({
      where: { id: id },
    })
    if(!contact) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(contact) {
      if(_full_name != null) {
        contact.full_name = _full_name;
      }
      if(_email != null) {
        contact.email = _email;
      }
      if(_phone != null) {
        contact.phone = _phone;
      }
      if(_company_name != null) {
        contact.company_name = _company_name;
      }
      if(_message != null) {
        contact.message = _message;
      }
      await contact.save();
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

route.delete("/", verifyRoles(Roles?.contact_destroyRoles), async (req, res) => {
  try {
    return;
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const contact = await Contact.findOne({
      where: { id: id },
    })
    if(!contact) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    Contact.destroy({where: {id: id } });
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

route.put("/routeState", verifyRoles(Roles?.contact_saveRoles), async (req, res) => {
  try {
    const {
      id,
      routeState
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const contact = await Contact.findOne({
      where: { id: id },
    })
    if(!contact) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(contact) {
      
      if(routeState != null) {
        contact.routeState = routeState;
      }
      
      contact.updated_by = req.user.id;
      await contact.save();
    }
    return res.json({ message: "Successfully Updated" });
  } catch (e) {
     return res.json({error: true, message: "Something went wrong"})
   }
});


/* Mounted at /api/contacts_public (no login). Only creating a message is public; everything else stays on the
 * authenticated router above. Previously the whole router was mounted publicly, including edit-by-id. */
const rateLimit = require('express-rate-limit')
const publicRoute = express.Router()
const publicLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })
const bounded = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

publicRoute.post("/", publicLimiter, async (req, res) => {
  try {
    const message = bounded(req.body._message, 5000)
    const email = bounded(req.body._email, 255)
    if (!message) return res.status(400).json({ error: true, message: "Message is required" })
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: true, message: "A valid email is required" })
    await Contact.create({
      full_name: bounded(req.body._full_name, 255),
      email: email,
      phone: bounded(req.body._phone, 50),
      company_name: bounded(req.body._company_name, 255),
      message: message,
    })
    return res.json({ message: "Successfully Created" })
  } catch (e) {
    console.error('Public contact failed:', e?.message)
    return res.status(500).json({ error: true, message: "Something went wrong" })
  }
})

module.exports = route
module.exports.publicRoute = publicRoute
