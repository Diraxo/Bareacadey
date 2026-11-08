/*** import common staffs ***/
const express = require('express')
const route = express.Router()
const Sequelize = require('sequelize')
const EmployeeCategory = require('../models/EmployeeCategory')
const User = require('../models/User.js')
const Activity = require('../models/Activity')
const UserUpload = require('../models/UserUpload')
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")

const EmployeePosition = require('../models/EmployeePosition')


route.get(['/', '/parent/:id'],  async (req, res) => {
  try {
    const id = req.params.id
    let where = {}
    await EmployeeCategory.findAll({
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
          as: "AddedByEmployeeCategory",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByEmployeeCategory",
        },
      ],
    }).then(async (employeecategoriesList) => {
      let updatedEmployeeCategories = []
      await Promise.all(
        employeecategoriesList.map(async (employeecategory) => {
          const upload_added_by = employeecategory?.AddedByEmployeeCategory?.upload_id && await UserUpload.findOne({
            where: { id: employeecategory?.AddedByEmployeeCategory?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = employeecategory?.UpdatedByEmployeeCategory?.upload_id && await UserUpload.findOne({
            where: { id: employeecategory?.UpdatedByEmployeeCategory?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
          updatedEmployeeCategories.push({
            ...employeecategory.toJSON(),
            added_user_name: employeecategory?.AddedByEmployeeCategory?.full_name,
            updated_user_name: employeecategory?.UpdatedByEmployeeCategory?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByEmployeeCategory: {
              name: employeecategory?.AddedByEmployeeCategory?.full_name,
              url: fullUrlAddedBy,
              id: employeecategory?.AddedByEmployeeCategory?.id
            },
            UpdatedByEmployeeCategory: {
              name: employeecategory?.UpdatedByEmployeeCategory?.full_name,
              url: fullUrlUpdatedBy,
              id: employeecategory?.UpdatedByEmployeeCategory?.id
            },
          });
        })
      );
      res.json(updatedEmployeeCategories.sort((a, b) => a.id - b.id));
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

route.get("/:id",  async (req, res) => {
  try {
    const id = req.params.id;
    await EmployeeCategory.findOne({
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
          as: "AddedByEmployeeCategory",
        },
        {
          model: User,
          attributes: [
            "id",
            "full_name",
            "role_id",
            "upload_id",
          ],
          as: "UpdatedByEmployeeCategory",
        },
      ],
    }).then(async (employeecategory) => {
          if(!employeecategory) {
            return res.json({error: true, message: 'You are not authorized!'})
          }
          const upload_added_by = employeecategory?.AddedByEmployeeCategory?.upload_id && await UserUpload.findOne({
            where: { id: employeecategory?.AddedByEmployeeCategory?.upload_id },
            attributes: ["filepath"],
          })
          const upload_updated_by = employeecategory?.UpdatedByEmployeeCategory?.upload_id && await UserUpload.findOne({
            where: { id: employeecategory?.UpdatedByEmployeeCategory?.upload_id },
            attributes: ["filepath"],
          })
          var fullUrlAddedBy = upload_added_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_added_by?.filepath
            : null;
          var fullUrlUpdatedBy = upload_updated_by?.filepath
            ? req.protocol + "://" + req.get("host") + upload_updated_by?.filepath
            : null;
      let updatedEmployeeCategory = {
        ...employeecategory.toJSON(),
            added_user_name: employeecategory?.AddedByEmployeeCategory?.full_name,
            updated_user_name: employeecategory?.UpdatedByEmployeeCategory?.full_name,
            added_user_url: fullUrlAddedBy,
            updated_user_url: fullUrlUpdatedBy,
            AddedByEmployeeCategory: {
              name: employeecategory?.AddedByEmployeeCategory?.full_name,
              url: fullUrlAddedBy,
              id: employeecategory?.AddedByEmployeeCategory?.id
            },
            UpdatedByEmployeeCategory: {
              name: employeecategory?.UpdatedByEmployeeCategory?.full_name,
              url: fullUrlUpdatedBy,
              id: employeecategory?.UpdatedByEmployeeCategory?.id
            },
      };
      res.json(updatedEmployeeCategory);
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

route.post("/",  async (req, res) => {
  try {
    const {
      _name,
      _prefix,
      _status,
    } = req.body;
    const employeeCategory = await EmployeeCategory.create({
      name: _name,
      prefix: _prefix,
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

route.put("/",  async (req, res) => {
  try {
    const {
      id,
      _name,
      _prefix,
      _status,
    } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const employeecategory = await EmployeeCategory.findOne({
      where: { id: id },
    })
    if(!employeecategory) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    if(employeecategory) {
      if(_name != null) {
        employeecategory.name = _name;
      }
      if(_prefix != null) {
        employeecategory.prefix = _prefix;
      }
      if(_status != null) {
        employeecategory.status = _status;
      }
      employeecategory.updated_by = req.user.id;
      await employeecategory.save();
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

route.delete("/",  async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ error: true, message: "Id is required" });
    }
    const employeecategory = await EmployeeCategory.findOne({
      where: { id: id },
    })
    if(!employeecategory) {
      return res.json({error: true, message: 'You are not authorized!'})
    }
    const users_name_80 = await User.count({ where: {employeecategory_id: id } });
    if(users_name_80 > 0) {
      return res.json({error: true, message: `Delete users related to this employeecategory first!`})
    }

    const employeePositions_name_411 = await EmployeePosition.count({ where: {employeecategory_id: id } });
    if(employeePositions_name_411 > 0) {
      return res.json({error: true, message: `Delete employeePositions related to this employeecategory first!`})
    }

    EmployeeCategory.destroy({where: {id: id } });
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

route.post("/bulk_import", verifyRoles(Roles?.employeecategory_createRoles), async (req, res) => {
  try {
    const data = req?.body
    let bulkData = data
    let employeeCategories = await EmployeeCategory.findAll()
    let newEmployeeCategories = []
    let totalEmployeeCategories = 0
    
    bulkData?.map(async (dt)=>{
      let existed = false
      employeeCategories?.map((employeeCategory)=>{
        if(employeeCategory["name"] == dt["_name"] && employeeCategory["prefix"] == dt["_prefix"] && employeeCategory["status"] == dt["_status"]) {
          existed = true
        }
      })
      newEmployeeCategories?.map((employeeCategory)=>{
        if(employeeCategory["name"] == dt["_name"] && employeeCategory["prefix"] == dt["_prefix"] && employeeCategory["status"] == dt["_status"]) {
          existed = true
        }
      })
      
      if(existed) return;
      
      const fd = {
        name: dt?._name,
        prefix: dt?._prefix,
        status: dt?._status,
        added_by: req.user.id,
        updated_by: req.user.id,
      }
      newEmployeeCategories.push(fd)
      totalEmployeeCategories++
      
      await EmployeeCategory.create(fd)
    })
    
    if(totalEmployeeCategories > 0 ) {
      await Activity.create({
        activity: `${totalEmployeeCategories} new ${totalEmployeeCategories == 1 ? "employee category" : "employee categories"} from file`,
        type: "created",
        added_by: req.user.id,
      })
      return res.json({ message: "Successfully Created", total: totalEmployeeCategories })
    } else {
      return res.json({ error: true, message: "All employee categories already existed" })
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