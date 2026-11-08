/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Category = require('../models/Category')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const Course = require('../models/Course')


route.get(['/', '/parent/:id'], verifyRoles(Roles?.category_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await Category.findAll({
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
          as: "AddedByCategory",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByCategory",
        },
      ],
    }).then(async (categoriesList) => {
      let updatedCategories = []
      let recordUsersPP = {}
      await Promise.all(
        categoriesList.map(async (category) => {
          const recordAddedByLabel = "user"+category?.AddedByCategory?.upload_id
          const recordUpdatedByLabel = "user"+category?.UpdatedByCategory?.upload_id
          
          const upload_added_by = category?.AddedByCategory?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: category?.AddedByCategory?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = category?.UpdatedByCategory?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: category?.UpdatedByCategory?.upload_id },
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
          updatedCategories.push({
            ...category.toJSON(),
            added_user_name: category?.AddedByCategory?.full_name,
            updated_user_name: category?.UpdatedByCategory?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByCategory: {
              name: category?.AddedByCategory?.full_name,
              url: fullUrlAddedBy,
              id: category?.AddedByCategory?.id
            },
            UpdatedByCategory: {
              name: category?.UpdatedByCategory?.full_name,
              url: fullUrlUpdatedBy,
              id: category?.UpdatedByCategory?.id
            },
          });
        })
      );
      res.json(updatedCategories.sort((a, b) => a?.rowDragIndex - b?.rowDragIndex));
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

route.get("/:id", verifyRoles(Roles?.category_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Category.findOne({
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
          as: "AddedByCategory",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByCategory",
        },
      ],
    }).then(async (category) => {
          if(!category) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = category?.AddedByCategory?.upload_id && await UserUpload.findOne({
            where: { id: category?.AddedByCategory?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = category?.UpdatedByCategory?.upload_id && await UserUpload.findOne({
            where: { id: category?.UpdatedByCategory?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedCategory = {
        ...category.toJSON(),
            added_user_name: category?.AddedByCategory?.full_name,
            updated_user_name: category?.UpdatedByCategory?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByCategory: {
              name: category?.AddedByCategory?.full_name,
              url: fullUrlAddedBy,
              id: category?.AddedByCategory?.id
            },
            UpdatedByCategory: {
              name: category?.UpdatedByCategory?.full_name,
              url: fullUrlUpdatedBy,
              id: category?.UpdatedByCategory?.id
            },
      };
      res.json(updatedCategory);
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

route.post("/", verifyRoles(Roles?.category_createRoles), async (req, res) => {
  try {
    const {
      _name,
    } = req.body;
    const category = await Category.create({
      name: _name,
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

route.put("/", verifyRoles(Roles?.category_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _name,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const category = await Category.findOne({
      where: { id: id },
    })
    if(!category) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(category) {
      if(_name != null) {
        category.name = _name;
      }
      category.updated_by = req.user.id;
      await category.save();
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

route.delete("/", verifyRoles(Roles?.category_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const category = await Category.findOne({
      where: { id: id },
    })
    if(!category) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const courses_name_25 = await Course.count({ where: {category_id: id } });
    if(courses_name_25 > 0) {
      return res.json({error: true, message: `Delete courses related to this category first!`})
    }

    Category.destroy({where: {id: id } });
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

route.put("/reorder_rows", verifyRoles(Roles?.category_saveRoles), async (req, res) => {
  try {
    const ids = req?.body
    let totalUpdated = 0
    await Promise.all(
      Object.keys(ids)?.map(async (id)=>{
        const category = await Category.findOne({
          where: { id: id },
        })
        if(!category) {
          return
        }
        totalUpdated++
        category.rowDragIndex = ids[id]
        await category.save()
      })
    )
    
    return res.json({message: "Saved"})
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

module.exports = route