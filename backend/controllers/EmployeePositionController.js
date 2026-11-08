/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const EmployeePosition = require('../models/EmployeePosition')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const EmployeeCategory = require('../models/EmployeeCategory')


route.get(['/', '/parent/:id'], verifyRoles(Roles?.employeeposition_findAllRoles), async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await EmployeePosition.findAll({
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
          as: "AddedByEmployeePosition",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByEmployeePosition",
        },
        {
          model: EmployeeCategory,
          attributes: [
            "name",
            "prefix",
            "status",
          ],
        },
      ],
    }).then(async (employeepositionsList) => {
      let updatedEmployeePositions = []
      let recordUsersPP = {}
      await Promise.all(
        employeepositionsList.map(async (employeeposition) => {
          const recordAddedByLabel = "user"+employeeposition?.AddedByEmployeePosition?.upload_id
          const recordUpdatedByLabel = "user"+employeeposition?.UpdatedByEmployeePosition?.upload_id
          
          const upload_added_by = employeeposition?.AddedByEmployeePosition?.upload_id && (recordUsersPP[recordAddedByLabel] ? recordUsersPP[recordAddedByLabel] : await UserUpload.findOne({
            where: { id: employeeposition?.AddedByEmployeePosition?.upload_id },
            attributes: ["filepath"],
          }))
          const upload_updated_by = employeeposition?.UpdatedByEmployeePosition?.upload_id && (recordUsersPP[recordUpdatedByLabel] ? recordUsersPP[recordUpdatedByLabel] : await UserUpload.findOne({
            where: { id: employeeposition?.UpdatedByEmployeePosition?.upload_id },
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
          updatedEmployeePositions.push({
            ...employeeposition.toJSON(),
            added_user_name: employeeposition?.AddedByEmployeePosition?.full_name,
            updated_user_name: employeeposition?.UpdatedByEmployeePosition?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            name_target_1: employeeposition?.EmployeeCategory ? employeeposition?.EmployeeCategory?.name + " (" + employeeposition?.EmployeeCategory?.prefix + ")" : "-",
            AddedByEmployeePosition: {
              name: employeeposition?.AddedByEmployeePosition?.full_name,
              url: fullUrlAddedBy,
              id: employeeposition?.AddedByEmployeePosition?.id
            },
            UpdatedByEmployeePosition: {
              name: employeeposition?.UpdatedByEmployeePosition?.full_name,
              url: fullUrlUpdatedBy,
              id: employeeposition?.UpdatedByEmployeePosition?.id
            },
          });
        })
      );
      res.json(updatedEmployeePositions.sort((a, b) => a.rowDragIndex - b.rowDragIndex));
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

route.get("/:id", verifyRoles(Roles?.employeeposition_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    await EmployeePosition.findOne({
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
          as: "AddedByEmployeePosition",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByEmployeePosition",
        },
        {
          model: EmployeeCategory,
          attributes: [
            "name",
            "prefix",
            "status",
          ],
        },
      ],
    }).then(async (employeeposition) => {
          if(!employeeposition) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = employeeposition?.AddedByEmployeePosition?.upload_id && await UserUpload.findOne({
            where: { id: employeeposition?.AddedByEmployeePosition?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = employeeposition?.UpdatedByEmployeePosition?.upload_id && await UserUpload.findOne({
            where: { id: employeeposition?.UpdatedByEmployeePosition?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedEmployeePosition = {
        ...employeeposition.toJSON(),
            added_user_name: employeeposition?.AddedByEmployeePosition?.full_name,
            updated_user_name: employeeposition?.UpdatedByEmployeePosition?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            name_target_1: employeeposition?.EmployeeCategory?.name + " (" + employeeposition?.EmployeeCategory?.prefix + ")"??"",
            AddedByEmployeePosition: {
              name: employeeposition?.AddedByEmployeePosition?.full_name,
              url: fullUrlAddedBy,
              id: employeeposition?.AddedByEmployeePosition?.id
            },
            UpdatedByEmployeePosition: {
              name: employeeposition?.UpdatedByEmployeePosition?.full_name,
              url: fullUrlUpdatedBy,
              id: employeeposition?.UpdatedByEmployeePosition?.id
            },
      };
      res.json(updatedEmployeePosition);
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

route.post("/", verifyRoles(Roles?.employeeposition_createRoles), async (req, res) => {
  try {
    const {
      _name,
      _status,
      _employeecategory_id,
    } = req.body;
    const employeePosition = await EmployeePosition.create({
      name: _name,
      status: _status,
      employeecategory_id: _employeecategory_id,
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

route.put("/", verifyRoles(Roles?.employeeposition_saveRoles), async (req, res) => {
  try {
    const {
      id,
      _name,
      _status,
      _employeecategory_id,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const employeeposition = await EmployeePosition.findOne({
      where: { id: id },
    })
    if(!employeeposition) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(employeeposition) {
      if(_name != null) {
        employeeposition.name = _name;
      }
      if(_status != null) {
        employeeposition.status = _status;
      }
      if(_employeecategory_id) {
        employeeposition.employeecategory_id = _employeecategory_id;
      }
      employeeposition.updated_by = req.user.id;
      await employeeposition.save();
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

route.delete("/", verifyRoles(Roles?.employeeposition_destroyRoles), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const employeeposition = await EmployeePosition.findOne({
      where: { id: id },
    })
    if(!employeeposition) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const users_name_81 = await User.count({ where: {employeeposition_id: id } });
    if(users_name_81 > 0) {
      return res.json({error: true, message: `Delete users related to this employeeposition first!`})
    }

    EmployeePosition.destroy({where: {id: id } });
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

route.post("/bulk_import", verifyRoles(Roles?.employeeposition_createRoles), async (req, res) => {
  try {
    const bulkData = req?.body
    let employeePositions = await EmployeePosition.findAll()
    let newEmployeePositions = []
    let totalEmployeePositions = 0
    
    bulkData?.map(async (dt)=>{
      let existed = false
      employeePositions?.map((employeePosition)=>{
        if(employeePosition["name"] == dt["_name"] && employeePosition["status"] == dt["_status"] && employeePosition["employeecategory_id"] == dt["_employeecategory_id"]) {
          existed = true
        }
      })
      newEmployeePositions?.map((employeePosition)=>{
        if(employeePosition["name"] == dt["_name"] && employeePosition["status"] == dt["_status"] && employeePosition["employeecategory_id"] == dt["_employeecategory_id"]) {
          existed = true
        }
      })
      
      if(existed) return;
      
      const fd = {
        name: dt?._name,
        status: dt?._status,
        employeecategory_id: dt?._employeecategory_id,
        added_by: req.user.id,
        updated_by: req.user.id,
      }
      newEmployeePositions.push(fd)
      totalEmployeePositions++
      await EmployeePosition.create(fd)
    })
    
    if(totalEmployeePositions > 0 ) {
      await Activity.create({
        activity: `${totalEmployeePositions} new ${totalEmployeePositions == 1 ? "employee position" : "employee positions"} from file`,
        type: "created",
        added_by: req.user.id,
      })
      return res.json({ message: "Successfully Created", total: totalEmployeePositions })
    } else {
      return res.json({ error: true, message: "All employee positions already existed" })
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

route.put("/bulk_edit", verifyRoles(Roles?.employeeposition_saveRoles), async (req, res) => {
  try {
    const ids = req?.body?.ids?.split(",")
    const {
      _name,
      _status,
      _employeecategory_id,
    } = req.body;

    if (!ids) {
      return res.json({ error: true, message: "Select atleast 1 record" })
    }
    let totalUpdated = 0
    await Promise.all(
      ids?.map(async (id)=>{
        const employeeposition = await EmployeePosition.findOne({
          where: { id: id },
        })
        if(!employeeposition) {
          return
        }
        let updatedFieldsCount = 0

        if(_name != null) {
          employeeposition.name = _name;
          updatedFieldsCount++
        }
        if(_status != null) {
          employeeposition.status = _status;
          updatedFieldsCount++
        }
        if(_employeecategory_id) {
          employeeposition.employeecategory_id = _employeecategory_id;
          updatedFieldsCount++
        }

        if(updatedFieldsCount > 0) {
          employeeposition.updated_by = req.user.id;
          await employeeposition.save();
          totalUpdated++
        }
        
      })
    )
    
    if(totalUpdated > 0 ) {
      await Activity.create({
        activity: `${totalUpdated} ${totalUpdated == 1 ? "employee position" : "employee positions"}`,
        type: "updated",
        added_by: req.user.id
      })
      return res.json({ message: "Successfully Updated", total: totalUpdated })
    } else {
      return res.json({ error: true, message: "No employee positions were updated" })
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

route.delete("/bulk_delete", verifyRoles(Roles?.employeeposition_destroyRoles), async (req, res) => {
  try {
    const ids = req?.body?.ids?.split(",")
    if (!ids) {
      return res.json({ error: true, message: "Select atleast 1 record" })
    }
    let totalDeleted = 0
    await Promise.all(
      ids?.map(async (id)=>{
        const employeeposition = await EmployeePosition.findOne({
          where: { id: id },
        })
        if(!employeeposition) {
          return
        }
        
        const users_name_81 = await User.count({ where: {employeeposition_id: id } })
        if(users_name_81 > 0) {
          return
        }
        totalDeleted++
        EmployeePosition.destroy({where: {id: id } });
        
      })
    )
    
    if(totalDeleted > 0 ) {
      await Activity.create({
        activity: `${totalDeleted} ${totalDeleted == 1 ? "employee position" : "employee positions"}`,
        type: "deleted",
        added_by: req.user.id
      })
      return res.json({ message: "Successfully Deleted", total: totalDeleted })
    } else {
      return res.json({ error: true, message: "No employee positions were deleted" })
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

route.put("/reorder_rows", verifyRoles(Roles?.employeeposition_saveRoles), async (req, res) => {
  try {
    const ids = req?.body
    let totalUpdated = 0
    await Promise.all(
      Object.keys(ids)?.map(async (id)=>{
        const employeeposition = await EmployeePosition.findOne({
          where: { id: id },
        })
        if(!employeeposition) {
          return
        }
        totalUpdated++;
        employeeposition.rowDragIndex = ids[id]
        // employeeposition.updated_by = req.user.id;
        await employeeposition.save()
      })
    )

    if(totalUpdated > 0) {
      return res.json({message: "Saved"})
    }
    else {
      return res.json({error: true, message: "Reorder Was Not Successful"})
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