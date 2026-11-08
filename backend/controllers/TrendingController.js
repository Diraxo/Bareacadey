/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Trending = require('../models/Trending')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const Course = require('../models/Course')


route.get(['/', '/parent/:id'], verifyRoles(Roles?.trending_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await Trending.findAll({
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
          as: "AddedByTrending",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByTrending",
        },
        {
          model: Course,
          attributes: [
            "id",
            "title",
          ],
          through: { attributes: [] },
        },
      ],
    }).then(async (trendingsList) => {
      let updatedTrendings = []
      let recordUsersPP = {}
      await Promise.all(
        trendingsList.map(async (trending) => {
          const recordAddedByLabel = "user"+trending?.AddedByTrending?.upload_id
          const recordUpdatedByLabel = "user"+trending?.UpdatedByTrending?.upload_id
          
          const upload_added_by = trending?.AddedByTrending?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: trending?.AddedByTrending?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = trending?.UpdatedByTrending?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: trending?.UpdatedByTrending?.upload_id },
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
          updatedTrendings.push({
            ...trending.toJSON(),
            added_user_name: trending?.AddedByTrending?.full_name,
            updated_user_name: trending?.UpdatedByTrending?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            title_mtm_target_1: trending?.Courses?.map((item)=>item['title'])?.join(', '),
            AddedByTrending: {
              name: trending?.AddedByTrending?.full_name,
              url: fullUrlAddedBy,
              id: trending?.AddedByTrending?.id
            },
            UpdatedByTrending: {
              name: trending?.UpdatedByTrending?.full_name,
              url: fullUrlUpdatedBy,
              id: trending?.UpdatedByTrending?.id
            },
          });
        })
      );
      res.json(updatedTrendings.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.trending_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Trending.findOne({
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
          as: "AddedByTrending",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByTrending",
        },
        {
          model: Course,
          attributes: [
            "id",
            "title",
          ],
          through: { attributes: [] },
        },
      ],
    }).then(async (trending) => {
          if(!trending) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = trending?.AddedByTrending?.upload_id && await UserUpload.findOne({
            where: { id: trending?.AddedByTrending?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = trending?.UpdatedByTrending?.upload_id && await UserUpload.findOne({
            where: { id: trending?.UpdatedByTrending?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedTrending = {
        ...trending.toJSON(),
            added_user_name: trending?.AddedByTrending?.full_name,
            updated_user_name: trending?.UpdatedByTrending?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            title_mtm_target_1: trending?.Courses?.map((item)=>item['title'])?.join(', '),
            AddedByTrending: {
              name: trending?.AddedByTrending?.full_name,
              url: fullUrlAddedBy,
              id: trending?.AddedByTrending?.id
            },
            UpdatedByTrending: {
              name: trending?.UpdatedByTrending?.full_name,
              url: fullUrlUpdatedBy,
              id: trending?.UpdatedByTrending?.id
            },
      };
      res.json(updatedTrending);
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

route.post("/", verifyRoles(Roles?.trending_createRoles), async (req, res) => {
  try {
    const {
      _title,
      _group_under,
      _course_id,
    } = req.body;
    const trending = await Trending.create({
      title: _title,
      group_under: _group_under || null,
      added_by: req.user.id,
      updated_by: req.user.id,
    })
    if(_course_id) {
      let ids = _course_id?.split(",")
      await trending.setCourses(ids)
    }
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

route.put("/", verifyRoles(Roles?.trending_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _title,
      _course_id,
      _group_under,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const trending = await Trending.findOne({
      where: { id: id },
    })
    if(!trending) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(trending) {
      if(_title != null) {
        trending.title = _title;
      }
      if(_group_under != null) {
        trending.group_under = _group_under;
      }
      trending.updated_by = req.user.id;
      await trending.save();
      if(_course_id != null) {
        let ids = _course_id?.split(",")
        if(!_course_id) {
          trending.setCourses([])
        }
        else {
          trending.setCourses(ids)
        }
      }
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

route.delete("/", verifyRoles(Roles?.trending_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const trending = await Trending.findOne({
      where: { id: id },
    })
    if(!trending) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    Trending.destroy({where: {id: id } });
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