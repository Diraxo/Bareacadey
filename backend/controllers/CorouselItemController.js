/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const CorouselItem = require('../models/CorouselItem')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const fs = require('fs');
const {uploadFiles, deleteFile} = require("../middlewares/commonFileUploader")


route.get(['/', '/parent/:id'], verifyRoles(Roles?.corouselitem_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await CorouselItem.findAll({
      where: where,
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByCorouselItem",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByCorouselItem",
        },
      ],
    }).then(async (corouselitemsList) => {
      let updatedCorouselItems = []
      let recordUsersPP = {}
      await Promise.all(
        corouselitemsList.map(async (corouselitem) => {
          const recordAddedByLabel = "user"+corouselitem?.AddedByCorouselItem?.upload_id
          const recordUpdatedByLabel = "user"+corouselitem?.UpdatedByCorouselItem?.upload_id
          
          const upload_added_by = corouselitem?.AddedByCorouselItem?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: corouselitem?.AddedByCorouselItem?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = corouselitem?.UpdatedByCorouselItem?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: corouselitem?.UpdatedByCorouselItem?.upload_id },
            attributes: ["filepath"],
          }))
          
          if(!recordUsersPP[recordAddedByLabel]) {
            recordUsersPP[recordAddedByLabel] = upload_added_by
          }
          
          if(!recordUsersPP[recordUpdatedByLabel]) {
            recordUsersPP[recordUpdatedByLabel] = upload_updated_by
          }
          
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedCorouselItems.push({
            ...corouselitem.toJSON(),
            added_user_name: corouselitem?.AddedByCorouselItem?.full_name,
            updated_user_name: corouselitem?.UpdatedByCorouselItem?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            image: corouselitem?.image ? JSON.parse(corouselitem?.image)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            AddedByCorouselItem: {
              name: corouselitem?.AddedByCorouselItem?.full_name,
              url: fullUrlAddedBy,
              id: corouselitem?.AddedByCorouselItem?.id
            },
            UpdatedByCorouselItem: {
              name: corouselitem?.UpdatedByCorouselItem?.full_name,
              url: fullUrlUpdatedBy,
              id: corouselitem?.UpdatedByCorouselItem?.id
            },
          });
        })
      );
      res.json(updatedCorouselItems.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.corouselitem_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await CorouselItem.findOne({
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
          as: "AddedByCorouselItem",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByCorouselItem",
        },
      ],
    }).then(async (corouselitem) => {
          if(!corouselitem) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = corouselitem?.AddedByCorouselItem?.upload_id && await UserUpload.findOne({
            where: { id: corouselitem?.AddedByCorouselItem?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = corouselitem?.UpdatedByCorouselItem?.upload_id && await UserUpload.findOne({
            where: { id: corouselitem?.UpdatedByCorouselItem?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedCorouselItem = {
        ...corouselitem.toJSON(),
            added_user_name: corouselitem?.AddedByCorouselItem?.full_name,
            updated_user_name: corouselitem?.UpdatedByCorouselItem?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            localStorage: req.protocol + "://" + req.get("host"),
            AddedByCorouselItem: {
              name: corouselitem?.AddedByCorouselItem?.full_name,
              url: fullUrlAddedBy,
              id: corouselitem?.AddedByCorouselItem?.id
            },
            UpdatedByCorouselItem: {
              name: corouselitem?.UpdatedByCorouselItem?.full_name,
              url: fullUrlUpdatedBy,
              id: corouselitem?.UpdatedByCorouselItem?.id
            },
      };
      res.json(updatedCorouselItem);
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

route.post("/", verifyRoles(Roles?.corouselitem_createRoles), async (req, res) => {
  try {
    const {
      _title,
      _subtitle,
      _enable_action_button,
      _action_button_type,
      _action_message,
    } = req.body;

    await uploadFiles('image', req, res)

    const corouselItem = await CorouselItem.create({
      title: _title,
      subtitle: _subtitle,
      enable_action_button: _enable_action_button,
      action_button_type: _action_button_type,
      action_message: _action_message,
      image: JSON.stringify((req['image']??[])),
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

route.put("/", verifyRoles(Roles?.corouselitem_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _title,
      _subtitle,
      _image,
      _enable_action_button,
      _action_button_type,
      _action_message,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const corouselitem = await CorouselItem.findOne({
      where: { id: id },
    })
    if(!corouselitem) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(corouselitem) {
      await uploadFiles('image', req, res)

      if(_title != null) {
        corouselitem.title = _title;
      }
      if(_subtitle != null) {
        corouselitem.subtitle = _subtitle;
      }
      if(_image != null) {
        const image = corouselitem?.image ? JSON.parse(corouselitem?.image) : [];
        const _imageArray = _image ?  JSON.parse(_image) : [];
        const _imageArrayCleaned = _imageArray?.map((item)=>item?.filepath);
        image?.map((item)=>{
          if(!_imageArrayCleaned?.includes(item?.filepath)) {
            deleteFile(item?.filepath);
          }
        })
        
        corouselitem.image = JSON.stringify([..._imageArray, ...(req['image']??[])]);
      }
      if(_enable_action_button != null) {
        corouselitem.enable_action_button = _enable_action_button;
      }
      if(_action_button_type != null) {
        corouselitem.action_button_type = _action_button_type;
      }
      if(_action_message != null) {
        corouselitem.action_message = _action_message;
      }
      corouselitem.updated_by = req.user.id;
      await corouselitem.save();
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

route.delete("/", verifyRoles(Roles?.corouselitem_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const corouselitem = await CorouselItem.findOne({
      where: { id: id },
    })
    if(!corouselitem) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const image = corouselitem?.image ? JSON.parse(corouselitem?.image) : [];
    image?.map((item)=>{
      deleteFile(item?.filepath)
    })
    
    CorouselItem.destroy({where: {id: id } });
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