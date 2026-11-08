/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Faq = require('../models/Faq')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")



route.get("/", verifyRoles(Roles?.faq_findAllRoles), async (req, res) => {
  try {
    await Faq.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByFaq",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByFaq",
        },
      ],
    }).then(async (faqsList) => {
      let updatedFaqs = []
      await Promise.all(
        faqsList.map(async (faq) => {
          const upload_added_by = faq?.AddedByFaq?.upload_id && await UserUpload.findOne({
            where: { id: faq?.AddedByFaq?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = faq?.UpdatedByFaq?.upload_id && await UserUpload.findOne({
            where: { id: faq?.UpdatedByFaq?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedFaqs.push({
            ...faq.toJSON(),
            added_user_name: faq?.AddedByFaq?.full_name,
            updated_user_name: faq?.UpdatedByFaq?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByFaq: {
              name: faq?.AddedByFaq?.full_name,
              url: fullUrlAddedBy,
              id: faq?.AddedByFaq?.id
            },
            UpdatedByFaq: {
              name: faq?.UpdatedByFaq?.full_name,
              url: fullUrlUpdatedBy,
              id: faq?.UpdatedByFaq?.id
            },
          });
        })
      );
      res.json(updatedFaqs.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.faq_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Faq.findOne({
      where: { id: id },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByFaq",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByFaq",
        },
      ],
    }).then(async (faq) => {
          if(!faq) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = faq?.AddedByFaq?.upload_id && await UserUpload.findOne({
            where: { id: faq?.AddedByFaq?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = faq?.UpdatedByFaq?.upload_id && await UserUpload.findOne({
            where: { id: faq?.UpdatedByFaq?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedFaq = {
        ...faq.toJSON(),
            added_user_name: faq?.AddedByFaq?.full_name,
            updated_user_name: faq?.UpdatedByFaq?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByFaq: {
              name: faq?.AddedByFaq?.full_name,
              url: fullUrlAddedBy,
              id: faq?.AddedByFaq?.id
            },
            UpdatedByFaq: {
              name: faq?.UpdatedByFaq?.full_name,
              url: fullUrlUpdatedBy,
              id: faq?.UpdatedByFaq?.id
            },
      };
      res.json(updatedFaq);
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

route.post("/", verifyRoles(Roles?.faq_createRoles), async (req, res) => {
  try {
    const {
      _question,
      _answer,
    } = req.body;
    const faq = await Faq.create({
      question: _question,
      answer: _answer,
      added_by: req.user.id,
      updated_by: req.user.id,
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

route.put("/", verifyRoles(Roles?.faq_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _question,
      _answer,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const faq = await Faq.findOne({
      where: { id: id },
    })
    if(!faq) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(faq) {
      if(_question != null) {
        faq.question = _question;
      }
      if(_answer != null) {
        faq.answer = _answer;
      }
      faq.updated_by = req.user.id;
      await faq.save();
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

route.delete("/", verifyRoles(Roles?.faq_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const faq = await Faq.findOne({
      where: { id: id },
    })
    if(!faq) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    Faq.destroy({where: {id: id } });
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