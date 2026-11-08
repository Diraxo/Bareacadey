const Role = require("../models/Role")
const Permission = require("../models/Permission")
const PermissionCategory = require("../models/PermissionCategory")
const RolePermission = require("../models/RolePermission")
const User = require("../models/User")
const Sequelize = require("sequelize")
const express = require("express")
const route = express.Router()
const verifyRoles = require("../middlewares/verifyRoles")
let Roles = require("../roles")
const Activity = require("../models/Activity")
const UserUpload = require("../models/UserUpload");

//get roles route
route.get("/", verifyRoles(Roles.role_findAllRoles), async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          attributes: ["id", "permission", "category_id"],
          through: { attributes: [] },
        }
      ]
    });
    const perCategories = await PermissionCategory.findAll()

    const rl = await Promise.all(
      roles.map(async (role) => {
        const users = await User.findAll({
          where: { role_id: role.id },
          attributes: ["id", "full_name"],
          include: [
            {
              model: UserUpload,
              as: "url",
              attributes: ["filepath"],
            },
          ] 
        });

        const usersUpdated = users.map(user=>{
          var fullUrl = user?.url?.filepath ? req.protocol + '://' + req.get('host')+user?.url?.filepath : null;
          return {id: user.id, name: user?.full_name, img_url: fullUrl}
        })

        let pc = []
        perCategories.map((pCat)=>{
          let pcObject = {category: pCat.name, permissions: []}
          role.Permissions.map((rl) => {
             if(rl.category_id === pCat.id) {
               pcObject.permissions.push({id: rl.id, permission: rl.permission})
             }
          })
          if(pcObject.permissions.length > 0) {
            pc.push(pcObject)
          }
        })
        
        let rol = {id: role.id, role: role.role, plural: role?.plural, parent: role.parent, color: role.color, system: role.system, permissions: pc};
        rol = { ...rol, users: usersUpdated };
        return rol;
      })
    );

    return res.json(rl);
  } catch (err) {
    return res.json({ error: true, message: "Something went wrong" });
  }
});

function filterBelow(roles, parentId) {
  const arr = []
  const children = roles.filter(role => role.parent === parentId);
  children.map(role=>{
       arr.push(...filterBelow(roles, role.id))
  })
  arr.push(...children)
  return arr
}

function filterRolesBelow(roles, parentId) {
  const arr = []
  // const parentRole = roles.find(role => role.id === parentId && role.parent==null);
  const parentRole = roles.find(role => role.id === parentId);
  if(parentRole) {
    arr.push({...parentRole})
  }
  arr.push(...filterBelow(roles, parentId))
  return arr.sort((a,b)=>a.id-b.id);
}

//get user roles route
route.get("/user", verifyRoles(Roles.role_findAllRoles), async (req, res) => {
 
  try {
   
    const roles = await Role.findAll({
      where: {},
      include: [
        {
          model: Permission,
          attributes: ["id", "permission", "category_id"],
          through: { attributes: [] },
        }
      ]
    });
    const perCategories = await PermissionCategory.findAll()

    const rl = await Promise.all(
      roles.map(async (role) => {
        const users = await User.findAll({
          where: { role_id: role.id },
          attributes: ["id", "full_name"],
          include: [
            {
              model: UserUpload,
              as: "url",
              attributes: ["filepath"],
            },
          ] 
        });

        const usersUpdated = users.map(user=>{
          var fullUrl = user?.url?.filepath ? req.protocol + '://' + req.get('host')+user?.url?.filepath : null;
          return {id: user.id, name: user?.full_name, img_url: fullUrl}
        })

        let pc = []
        perCategories.map((pCat)=>{
          let pcObject = {category: pCat.name, permissions: []}
          role.Permissions.map((rl) => {
             if(rl.category_id === pCat.id) {
               pcObject.permissions.push({id: rl.id, permission: rl.permission})
             }
          })
          if(pcObject.permissions.length > 0) {
            pc.push(pcObject)
          }
        })
        
        let rol = {id: role.id, role: role.role, plural: role?.plural, parent: role.parent, color: role.color, system: role.system, permissions: pc};
        rol = { ...rol, users: usersUpdated };
        return rol;
      })
    );
    
    const usr = await User.findOne({where: {id: req.user.id},attributes:["role_id"]})
    return res.json(filterRolesBelow(rl, usr.role_id));
  } catch (err) {
    return res.json({ error: true, message: "Something went wrong" });
  }
});

//get my role 
route.get("/mine", async (req, res) => {
 
  try {
    const user = await User.findOne({
      where: {id: req.user.id}
    })
    if(!user) return res.json({error: true, message: "No User Found!"})
    const role = await Role.findOne({
      where: {id: user.role_id},
    });
    
    return res.json(role);
  } catch (err) {
    return res.json({ error: true, message: "Something went wrong" });
  }
});

//get permission route
route.get("/permissions", async (req, res) => {
  try { 
    const perCategories = await PermissionCategory.findAll()
    const permissions = await Permission.findAll({
      attributes: ["id","permission", "category_id"]
    })
    const categories = perCategories.map((cat)=>{
       let category = {...cat.dataValues, permissions: []};
       permissions.map((permission)=>{
         if(permission.category_id === category.id) {
            category.permissions.push({id: permission.id, permission: permission.permission})
         }
       })
       return category
    })
    return res.json(categories)
  } catch(err) {}
});

//get permission grouped
route.get("/permissions_grouped", async (req, res) => {
  try { 
    const perCategories = await PermissionCategory.findAll()
    const permissions = await Permission.findAll({
      attributes: ["id","permission", "category_id", "grouped_under", "subgroup_string"]
    })

    let permissionsGroupsExisted = []
    const categories = perCategories.map((cat)=>{
       let category = {...cat.dataValues, permissions: []};
       permissions.map((permission)=>{
         if(permission.category_id === category.id) {
            if(permission?.grouped_under) {
              if (permissionsGroupsExisted?.includes(permission?.grouped_under)) return;
              let perms = []
              let permName = permission?.grouped_under
              let permId = 0

              permissions.map((p)=>{
                if(p?.grouped_under == permName) {
                  perms.push({id: p?.id, permission: p?.permission, subgroup_string: p?.subgroup_string})
                  if(permId == 0) {
                    permId = p?.id
                  }
                }
              })
              permissionsGroupsExisted.push(permName)
              category.permissions.push({id: permId, permission: permName, permissions: perms, single: false})

            }
            else {
              category.permissions.push({id: permission?.id, permission: permission?.permission, single: true})
            }
         }
       })
       return category
    })
    return res.json(categories)
  } catch(err) {}
});

//create route
route.post("/", verifyRoles(Roles.role_createRoles), async (req, res) => {
  try {
   const {role, plural, color, parent} = req.body
    let createdRole = await Role.create({role: role, plural: plural, color: color, parent: parent, added_by: req.user.id, updated_by:req.user.id});
    // if(parent) {
    //   createdRole.parent = parent
    //   await createdRole.save()
    // }
    await Activity.create({
      activity: `role "${createdRole.role}"`,
      type: "created",
      added_by: req.user.id 
    })
    return res.status(200).send({message: "Successfully Created"});
  } catch (err) {
    console.log(err)
    return res.json({ error: true, message: "Something went wrong" });
  }
});

//update route
route.put("/", verifyRoles(Roles.role_saveRoles), async (req, res) => {
   try {
     const {role, id, parent, plural, color, permissions} = req.body
     const foundRole = await Role.findOne({
       where: {id: id} 
      });
      if(!foundRole) return res.json({error: true, message: "Role doesn't exist"})
     if(role) {
       foundRole.role = role
     }
     if(color) {
      foundRole.color = color
     }
     if(plural) {
      foundRole.plural = plural
     }
     foundRole.updated_by = req.user.id
     if(parent || parent === null) {
        foundRole.parent = parent
     }
     
     await foundRole.save()

     if(permissions) {
       await RolePermission.destroy({
        where: {
          role_id: id, system: 0
        }
      })
      for(let i = 0; i < permissions.length; i++) {
         await RolePermission.upsert({
            role_id: id,
            permission_id: permissions[i],
            added_by: req.user.id 
         })
      }
     }
 
    //  await Activity.create({
    //    activity: `role "${foundRole.role}"`,
    //    type: "updated",
    //    added_by: req.user.id 
    //  })
    //  return res.json(foundRole)

     return res.json({message: "Successfully Updated"});
   } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const errorMessage = error.errors[0].message;
      res.status(200).json({ error: true, message: errorMessage });
    } else {
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
   }
 });

 //delete route
route.delete("/", verifyRoles(Roles.role_destroyRoles), async (req,res)=>{
  try {
    const id = req.body.id;
    if(!id) {
      res.json({error: true, message: "You have to pass id"})
    }
    const role = await Role.findOne({
      where: {id: id}
    })
    const users = await User.findAll({
      where: {role_id: id}
    })
    if(users.length > 0) {
      return res.json({error: true, message: `Delete All "${role.role}" Users First!`})
    }

    if(role) {
      await RolePermission.destroy({where: {role_id: id}})
      await Activity.create({
        activity: `role "${role?.role}"`,
        type: "deleted",
        added_by: req.user.id,
      });
      await Role.destroy({where: {id: id}})
      return res.json({message: "Successfully Deleted"})
    } else {
      return res.json({message: "Role Doesn't Exist"})
    }
  } catch(e) {}
})

module.exports = route;
