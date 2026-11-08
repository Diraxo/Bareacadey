/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Service = require('../models/Service')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const fs = require('fs');
const {uploadFiles, deleteFile} = require("../middlewares/commonFileUploader")

route.get("/", verifyRoles(Roles?.service_findAllRoles), async (req, res) => {
  try {
    await Service.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByService",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByService",
        },
      ],
    }).then(async (servicesList) => {
      let updatedServices = []
      await Promise.all(
        servicesList.map(async (service) => {
          const upload_added_by = service?.AddedByService?.upload_id && await UserUpload.findOne({
            where: { id: service?.AddedByService?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = service?.UpdatedByService?.upload_id && await UserUpload.findOne({
            where: { id: service?.UpdatedByService?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedServices.push({
            ...service.toJSON(),
            added_user_name: service?.AddedByService?.full_name,
            updated_user_name: service?.UpdatedByService?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            images: service?.images ? JSON.parse(service?.images)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            AddedByService: {
              name: service?.AddedByService?.full_name,
              url: fullUrlAddedBy,
              id: service?.AddedByService?.id
            },
            UpdatedByService: {
              name: service?.UpdatedByService?.full_name,
              url: fullUrlUpdatedBy,
              id: service?.UpdatedByService?.id
            },
          });
        })
      );
      res.json(updatedServices.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.service_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Service.findOne({
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
          as: "AddedByService",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByService",
        },
      ],
    }).then(async (service) => {
          if(!service) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = service?.AddedByService?.upload_id && await UserUpload.findOne({
            where: { id: service?.AddedByService?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = service?.UpdatedByService?.upload_id && await UserUpload.findOne({
            where: { id: service?.UpdatedByService?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedService = {
        ...service.toJSON(),
            added_user_name: service?.AddedByService?.full_name,
            updated_user_name: service?.UpdatedByService?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            localStorage: req.protocol + "://" + req.get("host"),
            AddedByService: {
              name: service?.AddedByService?.full_name,
              url: fullUrlAddedBy,
              id: service?.AddedByService?.id
            },
            UpdatedByService: {
              name: service?.UpdatedByService?.full_name,
              url: fullUrlUpdatedBy,
              id: service?.UpdatedByService?.id
            },
      };
      res.json(updatedService);
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

route.post("/", verifyRoles(Roles?.service_createRoles), async (req, res) => {
  try {
    const {
      _title,
      _subtitle,
      _features,
    } = req.body;

    await uploadFiles('images', req, res)

    const service = await Service.create({
      title: _title,
      subtitle: _subtitle,
      features: _features,
      images: JSON.stringify(req['images']),
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

route.put("/", verifyRoles(Roles?.service_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _images,
      _title,
      _subtitle,
      _features,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const service = await Service.findOne({
      where: { id: id },
    })
    if(!service) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(service) {
      await uploadFiles('images', req, res)

      if(_images != null) {
        const images = service?.images ? JSON.parse(service?.images) : [];
        const _imagesArray = _images ?  JSON.parse(_images) : [];
        const _imagesArrayCleaned = _imagesArray?.map((item)=>item?.filepath);
        images?.map((item)=>{
          if(!_imagesArrayCleaned?.includes(item?.filepath)) {
            deleteFile(item?.filepath);
          }
        })
        
        service.images = JSON.stringify([..._imagesArray, ...(req['images']??[])]);
      }
      if(_title != null) {
        service.title = _title;
      }
      if(_subtitle != null) {
        service.subtitle = _subtitle;
      }
      if(_features != null) {
        service.features = _features;
      }
      service.updated_by = req.user.id;
      await service.save();
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

route.delete("/", verifyRoles(Roles?.service_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const service = await Service.findOne({
      where: { id: id },
    })
    if(!service) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const images = service?.images ? JSON.parse(service?.images) : [];
    images?.map((item)=>{
      deleteFile(item?.filepath)
    })
    
    Service.destroy({where: {id: id } });
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