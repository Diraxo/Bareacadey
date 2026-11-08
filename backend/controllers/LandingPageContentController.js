/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const LandingPageContent = require('../models/LandingPageContent')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const fs = require('fs');
const {uploadFiles, deleteFile} = require("../middlewares/commonFileUploader")


route.get(['/', '/parent/:id'], verifyRoles(Roles?.landingpagecontent_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await LandingPageContent.findAll({
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
          as: "AddedByLandingPageContent",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByLandingPageContent",
        },
      ],
    }).then(async (landingpagecontentsList) => {
      let updatedLandingPageContents = []
      await Promise.all(
        landingpagecontentsList.map(async (landingpagecontent) => {
          const upload_added_by = landingpagecontent?.AddedByLandingPageContent?.upload_id && await UserUpload.findOne({
            where: { id: landingpagecontent?.AddedByLandingPageContent?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = landingpagecontent?.UpdatedByLandingPageContent?.upload_id && await UserUpload.findOne({
            where: { id: landingpagecontent?.UpdatedByLandingPageContent?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedLandingPageContents.push({
            ...landingpagecontent.toJSON(),
            added_user_name: landingpagecontent?.AddedByLandingPageContent?.full_name,
            updated_user_name: landingpagecontent?.UpdatedByLandingPageContent?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            hero_image: landingpagecontent?.hero_image ? JSON.parse(landingpagecontent?.hero_image)?.map((item)=>({...item, filepath: (req.protocol + "://" + req.get("host") + item?.filepath) ?? null}) ) : [],
            AddedByLandingPageContent: {
              name: landingpagecontent?.AddedByLandingPageContent?.full_name,
              url: fullUrlAddedBy,
              id: landingpagecontent?.AddedByLandingPageContent?.id
            },
            UpdatedByLandingPageContent: {
              name: landingpagecontent?.UpdatedByLandingPageContent?.full_name,
              url: fullUrlUpdatedBy,
              id: landingpagecontent?.UpdatedByLandingPageContent?.id
            },
          });
        })
      );
      res.json(updatedLandingPageContents.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.landingpagecontent_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await LandingPageContent.findOne({
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
          as: "AddedByLandingPageContent",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByLandingPageContent",
        },
      ],
    }).then(async (landingpagecontent) => {
          if(!landingpagecontent) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = landingpagecontent?.AddedByLandingPageContent?.upload_id && await UserUpload.findOne({
            where: { id: landingpagecontent?.AddedByLandingPageContent?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = landingpagecontent?.UpdatedByLandingPageContent?.upload_id && await UserUpload.findOne({
            where: { id: landingpagecontent?.UpdatedByLandingPageContent?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedLandingPageContent = {
        ...landingpagecontent.toJSON(),
            added_user_name: landingpagecontent?.AddedByLandingPageContent?.full_name,
            updated_user_name: landingpagecontent?.UpdatedByLandingPageContent?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            localStorage: req.protocol + "://" + req.get("host"),
            AddedByLandingPageContent: {
              name: landingpagecontent?.AddedByLandingPageContent?.full_name,
              url: fullUrlAddedBy,
              id: landingpagecontent?.AddedByLandingPageContent?.id
            },
            UpdatedByLandingPageContent: {
              name: landingpagecontent?.UpdatedByLandingPageContent?.full_name,
              url: fullUrlUpdatedBy,
              id: landingpagecontent?.UpdatedByLandingPageContent?.id
            },
      };
      res.json(updatedLandingPageContent);
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

route.post("/", verifyRoles(Roles?.landingpagecontent_createRoles), async (req, res) => {
  try {
    const {
      _label_1,
      _label_title_colored,
      _title_color_label,
      _label_title,
      _label_2_description,
      _title,
      _title_colored,
      _title_color,
      _subtitle,
      _subtitle_short,
    } = req.body;

    await uploadFiles('hero_image', req, res)

    const landingPageContent = await LandingPageContent.create({
      label_1: _label_1,
      label_title_colored: _label_title_colored,
      title_color_label: _title_color_label,
      label_title: _label_title,
      label_2_description: _label_2_description,
      title: _title,
      title_colored: _title_colored,
      title_color: _title_color,
      subtitle: _subtitle,
      subtitle_short: _subtitle_short,
      hero_image: JSON.stringify(req['hero_image']),
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

route.put("/", verifyRoles(Roles?.landingpagecontent_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _label_1,
      _label_title_colored,
      _title_color_label,
      _label_title,
      _label_2_description,
      _title,
      _title_colored,
      _title_color,
      _subtitle,
      _subtitle_short,
      _hero_image,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const landingpagecontent = await LandingPageContent.findOne({
      where: { id: id },
    })
    if(!landingpagecontent) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(landingpagecontent) {
      await uploadFiles('hero_image', req, res)

      if(_label_1 != null) {
        landingpagecontent.label_1 = _label_1;
      }
      if(_label_title_colored != null) {
        landingpagecontent.label_title_colored = _label_title_colored;
      }
      if(_title_color_label != null) {
        landingpagecontent.title_color_label = _title_color_label;
      }
      if(_label_title != null) {
        landingpagecontent.label_title = _label_title;
      }
      if(_label_2_description != null) {
        landingpagecontent.label_2_description = _label_2_description;
      }
      if(_title != null) {
        landingpagecontent.title = _title;
      }
      if(_title_colored != null) {
        landingpagecontent.title_colored = _title_colored;
      }
      if(_title_color != null) {
        landingpagecontent.title_color = _title_color;
      }
      if(_subtitle != null) {
        landingpagecontent.subtitle = _subtitle;
      }
      if(_subtitle_short != null) {
        landingpagecontent.subtitle_short = _subtitle_short;
      }
      if(_hero_image != null) {
        const hero_image = landingpagecontent?.hero_image ? JSON.parse(landingpagecontent?.hero_image) : [];
        const _hero_imageArray = _hero_image ?  JSON.parse(_hero_image) : [];
        const _hero_imageArrayCleaned = _hero_imageArray?.map((item)=>item?.filepath);
        hero_image?.map((item)=>{
          if(!_hero_imageArrayCleaned?.includes(item?.filepath)) {
            deleteFile(item?.filepath);
          }
        })
        
        landingpagecontent.hero_image = JSON.stringify([..._hero_imageArray, ...(req['hero_image']??[])]);
      }
      landingpagecontent.updated_by = req.user.id;
      await landingpagecontent.save();
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

route.delete("/", verifyRoles(Roles?.landingpagecontent_destroyRoles), async (req, res) => {
  try {
    return res.json({message: "You can't delete this record!"})
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const landingpagecontent = await LandingPageContent.findOne({
      where: { id: id },
    })
    if(!landingpagecontent) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const hero_image = landingpagecontent?.hero_image ? JSON.parse(landingpagecontent?.hero_image) : [];
    hero_image?.map((item)=>{
      deleteFile(item?.filepath)
    })
    
    LandingPageContent.destroy({where: {id: id } });
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