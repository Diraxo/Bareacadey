/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const Department = require('../models/Department')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")



route.get(['/', '/parent/:id'], verifyRoles(Roles?.department_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await Department.findAll({
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
          as: "AddedByDepartment",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByDepartment",
        },
      ],
    }).then(async (departmentsList) => {
      let updatedDepartments = []
      let recordUsersPP = {}
      await Promise.all(
        departmentsList.map(async (department) => {
          const recordAddedByLabel = "user"+department?.AddedByDepartment?.upload_id
          const recordUpdatedByLabel = "user"+department?.UpdatedByDepartment?.upload_id
          
          const upload_added_by = department?.AddedByDepartment?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: department?.AddedByDepartment?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = department?.UpdatedByDepartment?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: department?.UpdatedByDepartment?.upload_id },
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
          updatedDepartments.push({
            ...department.toJSON(),
            added_user_name: department?.AddedByDepartment?.full_name,
            updated_user_name: department?.UpdatedByDepartment?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByDepartment: {
              name: department?.AddedByDepartment?.full_name,
              url: fullUrlAddedBy,
              id: department?.AddedByDepartment?.id
            },
            UpdatedByDepartment: {
              name: department?.UpdatedByDepartment?.full_name,
              url: fullUrlUpdatedBy,
              id: department?.UpdatedByDepartment?.id
            },
          });
        })
      );
      res.json(updatedDepartments.sort((a, b) => a.id - b.id));
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

route.get("/:id", verifyRoles(Roles?.department_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await Department.findOne({
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
          as: "AddedByDepartment",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByDepartment",
        },
      ],
    }).then(async (department) => {
          if(!department) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = department?.AddedByDepartment?.upload_id && await UserUpload.findOne({
            where: { id: department?.AddedByDepartment?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = department?.UpdatedByDepartment?.upload_id && await UserUpload.findOne({
            where: { id: department?.UpdatedByDepartment?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedDepartment = {
        ...department.toJSON(),
            added_user_name: department?.AddedByDepartment?.full_name,
            updated_user_name: department?.UpdatedByDepartment?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByDepartment: {
              name: department?.AddedByDepartment?.full_name,
              url: fullUrlAddedBy,
              id: department?.AddedByDepartment?.id
            },
            UpdatedByDepartment: {
              name: department?.UpdatedByDepartment?.full_name,
              url: fullUrlUpdatedBy,
              id: department?.UpdatedByDepartment?.id
            },
      };
      res.json(updatedDepartment);
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

route.post("/", verifyRoles(Roles?.department_createRoles), async (req, res) => {
  try {
    const {
      _name,
      _department_code,
      _status,
    } = req.body;
    const department = await Department.create({
      name: _name,
      department_code: _department_code,
      status: _status,
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

route.put("/", verifyRoles(Roles?.department_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _name,
      _department_code,
      _status,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const department = await Department.findOne({
      where: { id: id },
    })
    if(!department) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(department) {
      if(_name != null) {
        department.name = _name;
      }
      if(_department_code != null) {
        department.department_code = _department_code;
      }
      if(_status != null) {
        department.status = _status;
      }
      department.updated_by = req.user.id;
      await department.save();
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

route.delete("/", verifyRoles(Roles?.department_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const department = await Department.findOne({
      where: { id: id },
    })
    if(!department) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const users_name_82 = await User.count({ where: {department_id: id } });
    if(users_name_82 > 0) {
      return res.json({error: true, message: `Delete users related to this department first!`})
    }

    Department.destroy({where: {id: id } });
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

route.post("/bulk_import", verifyRoles(Roles?.department_createRoles), async (req, res) => {
  try {
    const bulkData = req?.body
    let departments = await Department.findAll()
    let newDepartments = []
    let totalDepartments = 0
    
    bulkData?.map(async (dt)=>{
      let existed = false
      departments?.map((department)=>{
        if(department["name"] == dt["_name"] && department["department_code"] == dt["_department_code"] && department["status"] == dt["_status"]) {
          existed = true
        }
      })
      newDepartments?.map((department)=>{
        if(department["name"] == dt["_name"] && department["department_code"] == dt["_department_code"] && department["status"] == dt["_status"]) {
          existed = true
        }
      })
      
      if(existed) return;
      
      const fd = {
        name: dt?._name,
        department_code: dt?._department_code,
        status: dt?._status,
        added_by: req.user.id,
        updated_by: req.user.id,
      }
      newDepartments.push(fd)
      totalDepartments++
      
      await Department.create(fd)
    })
    
    if(totalDepartments > 0 ) {
      await Activity.create({
        activity: `${totalDepartments} new ${totalDepartments == 1 ? "department" : "departments"} from file`,
        type: "created",
        added_by: req.user.id,
      })
      return res.json({ message: "Successfully Created", total: totalDepartments })
    } else {
      return res.json({ error: true, message: "All departments already existed" })
    }
    
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