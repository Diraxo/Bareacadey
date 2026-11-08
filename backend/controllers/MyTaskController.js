/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const MyTask = require('../models/MyTask')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")



route.get(['/', '/parent/:id'], verifyRoles(Roles?.mytask_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
      where.updated_by = req?.user?.id??0;
    await MyTask.findAll({
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
          as: "AddedByMyTask",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByMyTask",
        },
      ],
    }).then(async (mytasksList) => {
      let updatedMyTasks = []
      await Promise.all(
        mytasksList.map(async (mytask) => {
          const upload_added_by = mytask?.AddedByMyTask?.upload_id && await UserUpload.findOne({
            where: { id: mytask?.AddedByMyTask?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = mytask?.UpdatedByMyTask?.upload_id && await UserUpload.findOne({
            where: { id: mytask?.UpdatedByMyTask?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedMyTasks.push({
            ...mytask.toJSON(),
            added_user_name: mytask?.AddedByMyTask?.full_name,
            updated_user_name: mytask?.UpdatedByMyTask?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByMyTask: {
              name: mytask?.AddedByMyTask?.full_name,
              url: fullUrlAddedBy,
              id: mytask?.AddedByMyTask?.id
            },
            UpdatedByMyTask: {
              name: mytask?.UpdatedByMyTask?.full_name,
              url: fullUrlUpdatedBy,
              id: mytask?.UpdatedByMyTask?.id
            },
          });
        })
      );
      res.json(updatedMyTasks.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.mytask_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await MyTask.findOne({
      where: { id: id, updated_by: req?.user?.id??0 },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "AddedByMyTask",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByMyTask",
        },
      ],
    }).then(async (mytask) => {
          if(!mytask) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = mytask?.AddedByMyTask?.upload_id && await UserUpload.findOne({
            where: { id: mytask?.AddedByMyTask?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = mytask?.UpdatedByMyTask?.upload_id && await UserUpload.findOne({
            where: { id: mytask?.UpdatedByMyTask?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedMyTask = {
        ...mytask.toJSON(),
            added_user_name: mytask?.AddedByMyTask?.full_name,
            updated_user_name: mytask?.UpdatedByMyTask?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByMyTask: {
              name: mytask?.AddedByMyTask?.full_name,
              url: fullUrlAddedBy,
              id: mytask?.AddedByMyTask?.id
            },
            UpdatedByMyTask: {
              name: mytask?.UpdatedByMyTask?.full_name,
              url: fullUrlUpdatedBy,
              id: mytask?.UpdatedByMyTask?.id
            },
      };
      res.json(updatedMyTask);
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

route.post("/", verifyRoles(Roles?.mytask_createRoles), async (req, res) => {
  try {
    const {
      _title,
      _start,
      _end,
      _allDay,
      _description,
    } = req.body;
    const myTask = await MyTask.create({
      title: _title,
      start: _start,
      end: _end,
      allDay: _allDay,
      description: _description,
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

route.put("/", verifyRoles(Roles?.mytask_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _title,
      _start,
      _end,
      _allDay,
      _description,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const mytask = await MyTask.findOne({
      where: { id: id, updated_by: req?.user?.id??0 },
    })
    if(!mytask) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(mytask) {
      if(_title != null) {
        mytask.title = _title;
      }
      if(_start != null) {
        mytask.start = _start;
      }
      if(_end != null) {
        mytask.end = _end;
      }
      if(_allDay != null) {
        mytask.allDay = _allDay;
      }
      if(_description != null) {
        mytask.description = _description;
      }
      mytask.updated_by = req.user.id;
      await mytask.save();
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

route.delete("/", verifyRoles(Roles?.mytask_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const mytask = await MyTask.findOne({
      where: { id: id, updated_by: req?.user?.id??0 },
    })
    if(!mytask) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    MyTask.destroy({where: {id: id } });
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

route.put("/routeState", verifyRoles(Roles?.mytask_saveRoles), async (req, res) => {
  try {
    const {
      id,
      routeState
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const mytask = await MyTask.findOne({
      where: { id: id },
    })
    if(!mytask) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(mytask) {
      
      if(routeState != null) {
        mytask.routeState = routeState;
      }
      
      mytask.updated_by = req.user.id;
      await mytask.save();
    }
    return res.json({ message: "Successfully Updated" });
  } catch (e) {
     return res.json({error: true, message: "Something went wrong"})
   }
});

module.exports = route