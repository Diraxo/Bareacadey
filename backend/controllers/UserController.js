const User = require("../models/User");
const Permission = require("../models/Permission");
const UserPermission = require("../models/UserPermission");
const Role = require("../models/Role");
const RolePermission = require("../models/RolePermission");
const UserUpload = require("../models/UserUpload");
const Activity = require("../models/Activity");
const Sequelize = require("sequelize");
const express = require("express");
const route = express.Router();
const bcrypt = require("bcrypt");
const verifyRoles = require("../middlewares/verifyRoles");
let Roles = require("../roles");
const fs = require('fs');
const e = require("express");
const Device = require("../models/Device");
const db = require("../database");
const { effectivePermissions, SUPER_ADMIN_ROLE_ID } = require("../services/rolePermissions");
const { fullNameFrom } = require("../services/fullName");
const { deleteAccount } = require("../services/accountDeletion");


const { uploadFilesProfile, deleteStoredPhoto } = require("../middlewares/profileUpload");
const deleteFile = deleteStoredPhoto;

/* Only callers allowed to manage users may act on another user; everybody else is pinned to their own account. */
const canManageUsers = (req) => (req.user?.permissions || []).includes("Edit Users");
const forceSelf = (req, res, next) => {
  if (!canManageUsers(req) || !req.body.id) {
    req.body.id = req.user.id;
  }
  req.profileTargetId = req.body.id;
  next();
};
const selfOrRoles = (roles) => (req, res, next) => {
  if (String(req.params.id) === String(req.user?.id)) return next();
  return verifyRoles(roles)(req, res, next);
};

//delete route
route.delete("/", verifyRoles(Roles.user_destroyRoles), async (req,res)=>{
  try {
    const id = req.body.id;
    if(!id) {
      return res.json({error: true, message: "You have to pass id"})
    }
    if(id == 1) {
      return res.json({error: true, message: "Cannot delete super admin account!"})
    }
    const user = await User.findOne({
      where: {id: id}
    })
    if(!user) {
      return res.json({message: "User Doesn't Exist"})
    }
    if(user.active) {
      return res.json({error: true, message: "Deactivate User First!"})
    }

    if(user) {
      if(user.upload_id) {
        await deleteFile(user.upload_id)
      }
      await UserPermission.destroy({where: {user_id: id}})
      await Device.destroy({where: {user_id: id}})
      await Activity.create({
        activity: `user "${user?.full_name}"`,
        type: "deleted",
        added_by: req.user.id,
      });
      await User.destroy({where: {id: id}})
      return res.json({message: "Successfully Deleted"})
    } else {
      return res.json({message: "User Doesn't Exist"})
    }
  } catch(e) {
    return res.status(500).json({error: true, message: "Something went wrong"})
  }
})

/* Self-service account deletion. The caller must prove they know the password (a stolen access token alone cannot
 * delete an account). Personal data is removed or anonymised, every session is revoked and the account can never sign in
 * again; see services/accountDeletion.js for exactly what is deleted and what is retained. */
route.delete('/delete-user-account', async (req, res) => {
  try {
    const id = req?.user?.id;
    if(id == 1) {
      return res.json({error: true, message: "Cannot delete super admin account!"});
    }
    const user = await User.findOne({
      where: {id: id}
    })
    if(!user || user.active === false) {
      return res.json({error: true, message: "Account Doesn't Exist"})
    }
    const password = req.body?.password
    if(typeof password !== 'string' || !password) {
      return res.status(400).json({error: true, code: 'password_required', message: "Enter your password to delete your account"})
    }
    if(!user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(403).json({error: true, code: 'wrong_password', message: "The password is incorrect"})
    }
    await deleteAccount(user)
    return res.json({message: "Account Successfully Deleted"})
  } catch(e) {
    return res.status(500).json({error: true, message: "Something went wrong"})
  }
});

route.put("/profile/update", forceSelf, uploadFilesProfile(true), async (req, res) => {
  try {
    const {
      //basic
      id,
      username,
      email,
      phone,
      old_password,
      password,
      device,
      role,
      date_of_birth,
      gender,
      about_me,
      remove_photo,

      _signature,
      _seals,


     
    } = req.body;
    
    let passwordChanged = false
    let incorrectOldPassword = false
    if(!id) {
      return res.json({error: true, message: "You have to pass id"})
    }
    const user = await User.findOne({
      where: { id: id },
    });
    if(!user) return res.json({error: true, message: "User Doesn't Exist"});
    

    // same rules as sign-up, so a profile edit cannot store what registration would refuse
    if(email && email != user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email))) {
      return res.status(400).json({error: true, message: "Enter a valid email address"})
    }
    if(password && old_password && (typeof password !== 'string' || password.length < 8 || password.length > 72)) {
      return res.status(400).json({error: true, message: "Password must be 8 to 72 characters"})
    }

    // Editable here: full_name, gender, date_of_birth, about_me, email, avatar, password (with old_password),
    // and role for user managers. username and phone are login identifiers and are NOT changeable through this endpoint
    // (user managers use PUT /api/users); any other body field is ignored because nothing else is read from req.body.
    if(email) {
      let emailUpdated = false;
      let emailTaken = false;
      const usernameUpdated = false;
      const usernameTaken = false;
      if(email) {
        const findUsersEmail = await User.findAll({
          where: { email: email },
        });
        findUsersEmail?.map((us)=>{
           if(email == us.email && user.id != us.id) {
              emailTaken = true;
           }
        })
        if(!emailTaken && email != user.email) {
          await User.update(
            { email: email },
            {
              where: {
                id: user.id
              }
            }
          )
          emailUpdated = true;
        }
      }
      return res.json({message: "Successfully Updated", emailTaken: emailTaken, emailUpdated: emailUpdated, usernameTaken: usernameTaken, usernameUpdated: usernameUpdated})
    }

    let conflicts = { username: false, email: false };
    const newFullName = fullNameFrom(req.body);
    if (newFullName) {
      user.full_name = newFullName.slice(0, 160);
    }
    if (gender) {
      user.gender = gender;
    }
    if (date_of_birth) {
      user.date_of_birth = date_of_birth;
    }
    if (about_me != null) {
      user.about_me = about_me;
    }
   
    let oldPhoto = null
    if(req.userUpload) {
      user.upload_id = req.userUpload
    } else if(String(remove_photo) === 'true' && user.upload_id) {
      oldPhoto = user.upload_id
      user.upload_id = null
    }

    if (password && old_password) {
      const isValidUser = await bcrypt.compare(
        old_password,
        user.password
      );
      if(isValidUser) {
        user.password = bcrypt.hashSync(password ?? "", 10)
        passwordChanged = true
      } else {
        incorrectOldPassword = true
      }
    }

    user.updated_by = req.user.id;

    //basic
    if(role && canManageUsers(req)) {
      user.role_id = role
    }
   

    
    await user.save();
    if(oldPhoto) await deleteStoredPhoto(oldPhoto).catch(() => {})

    return res.json({ message: "Successfully Updated", passwordChanged: passwordChanged, incorrectOldPassword: incorrectOldPassword });
  } catch (err) {
    console.error('Profile update failed:', err?.message);
    return res.status(500).json({error: true, message: "Something went wrong"});
  }
});

/* ---- PUT /api/users: administrative user update -------------------------------------------------------------------
 * Every restriction is enforced here on the server, using the caller's CURRENT database state (not the permission
 * names carried in their JWT, which can be stale until the access token expires).
 *
 *  - Hierarchy: Role.parent forms a tree (Super Admin is the root). A caller may only edit users whose role is strictly
 *    below the caller's own role, and may only assign roles strictly below it. Account id 1 is never editable by anyone else.
 *  - Permissions: a caller may only add or remove permissions the caller currently holds (Super Admin holds all).
 *  - Self: this endpoint cannot change the caller's own role, permissions, status, password, email, username or phone
 *    (own profile editing stays on PUT /profile/update). Re-sending the current values is accepted, so existing clients keep working.
 *  - Role assignment additionally needs the existing "Edit Role" permission. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._+@-]{3,64}$/;
const GENDERS = ["Male", "Female", "Other"];

const toBoolean = (v) => {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
};

/* "1,2,3" or [1,2,3] -> unique integer ids; null when malformed; [] when empty (= leave permissions unchanged). */
const parsePermissionIds = (raw) => {
  const list = (Array.isArray(raw) ? raw : String(raw).split(",")).map((s) => String(s).trim()).filter((s) => s !== "");
  if (!list.every((s) => /^\d+$/.test(s))) return null;
  return [...new Set(list.map(Number))];
};

const blank = (v) => v === undefined || v === null || v === "";

/* ids of every role strictly below roleId in the Role.parent tree (cycle-safe). */
const rolesStrictlyBelow = (roles, roleId) => {
  const below = new Set();
  const queue = [roleId];
  while (queue.length) {
    const current = queue.shift();
    roles.forEach((r) => {
      if (r.parent === current && r.id !== roleId && !below.has(r.id)) {
        below.add(r.id);
        queue.push(r.id);
      }
    });
  }
  return below;
};

const authorizeUserUpdate = async (req, res, next) => {
  const fail = (status, message) => res.status(status).json({ error: true, message });
  try {
    const b = req.body || {};
    const targetId = Number(b.id);
    if (blank(b.id) || !Number.isInteger(targetId) || targetId < 1) return fail(400, "You have to pass id");

    const withPermissions = [{ model: Permission, attributes: ["id", "permission"], through: { attributes: [] } }];
    const caller = await User.findOne({ where: { id: req.user.id }, include: withPermissions });
    if (!caller || caller.active === false || caller.blocked) return fail(403, "You are not authorized!");
    const callerHeld = new Set(await effectivePermissions(caller));
    if (!callerHeld.has("Edit Users")) return fail(401, "You are not authorized!");

    const target = await User.findOne({ where: { id: targetId }, include: withPermissions });
    if (!target) return fail(404, "User Doesn't Exist");

    const isSelf = target.id === caller.id;
    if (target.id === SUPER_ADMIN_ROLE_ID && !isSelf) return fail(403, "The super admin account cannot be modified.");

    const roles = await Role.findAll();
    const below = rolesStrictlyBelow(roles, caller.role_id);
    if (!isSelf && !below.has(target.role_id)) return fail(403, "You cannot modify a user at or above your own role.");
    const selfDenied = "You cannot change your own role, permissions, status or login details here.";

    const changes = {};

    // role
    if (!blank(b.role) && Number(b.role) !== target.role_id) {
      const roleId = Number(b.role);
      if (!Number.isInteger(roleId) || !roles.some((r) => r.id === roleId)) return fail(400, "Role does not exist");
      if (isSelf) return fail(403, selfDenied);
      if (!callerHeld.has("Edit Role")) return fail(403, "You are not allowed to assign roles.");
      if (!below.has(roleId)) return fail(403, "You cannot assign a role at or above your own.");
      changes.role_id = roleId;
    }

    // permissions (full replacement list, as the admin screen sends it)
    let permissionIds = null;
    if (!blank(b.permissions)) {
      const requested = parsePermissionIds(b.permissions);
      if (requested === null) return fail(400, "Invalid permissions");
      if (requested.length > 0) {
        const found = await Permission.findAll({ where: { id: requested }, attributes: ["id", "permission"] });
        if (found.length !== requested.length) return fail(400, "One or more permissions do not exist");
        const current = new Map(target.Permissions.map((p) => [p.id, p.permission]));
        const wanted = new Map(found.map((p) => [p.id, p.permission]));
        const added = [...wanted].filter(([id]) => !current.has(id)).map(([, name]) => name);
        const removed = [...current].filter(([id]) => !wanted.has(id)).map(([, name]) => name);
        if (added.length || removed.length) {
          if (isSelf) return fail(403, selfDenied);
          if ([...added, ...removed].some((name) => !callerHeld.has(name))) {
            return fail(403, "You cannot grant or remove permissions you do not hold yourself.");
          }
          permissionIds = requested;
        }
      }
    }

    // account status
    for (const field of ["active", "confirmed"]) {
      if (blank(b[field])) continue;
      const value = toBoolean(b[field]);
      if (value === undefined) return fail(400, `Invalid value for ${field}`);
      if (value !== Boolean(target[field])) {
        if (isSelf) return fail(403, selfDenied);
        changes[field] = value;
      }
    }

    // password
    if (!blank(b.password)) {
      if (typeof b.password !== "string" || b.password.length < 8 || Buffer.byteLength(b.password, "utf8") > 72) {
        return fail(400, "Password must be 8 to 72 characters");
      }
      if (isSelf) return fail(403, selfDenied);
      changes.password = bcrypt.hashSync(b.password, 10);
    }

    // login identifiers
    const identifiers = [
      ["email", (v) => EMAIL_PATTERN.test(v), "Enter a valid email address", "Email Already Exist!"],
      ["username", (v) => USERNAME_PATTERN.test(v), "Username may contain letters, numbers and . _ + @ - (3 to 64 characters)", "Username Already Exist!"],
      ["phone", (v) => v.length <= 32 && /^[0-9+()\- ]+$/.test(v), "Enter a valid phone number", "Phone Number Already Exist!"],
    ];
    for (const [field, isValid, invalidMessage, takenMessage] of identifiers) {
      if (blank(b[field])) continue;
      const value = typeof b[field] === "string" ? b[field].trim() : "";
      if (value === (target[field] ?? "")) continue;
      if (!isValid(value)) return fail(400, invalidMessage);
      if (isSelf) return fail(403, selfDenied);
      const taken = await User.findOne({ where: { [field]: value, id: { [Sequelize.Op.ne]: target.id } }, attributes: ["id"] });
      if (taken) return fail(409, takenMessage);
      changes[field] = value;
    }

    // plain profile fields
    const newFullName = fullNameFrom(b);
    if (newFullName) changes.full_name = newFullName.slice(0, 160);
    if (b.about_me) changes.about_me = String(b.about_me);
    if (b.date_of_birth) changes.date_of_birth = b.date_of_birth;
    if (b.gender) {
      if (!GENDERS.includes(b.gender)) return fail(400, "Invalid gender");
      changes.gender = b.gender;
    }

    req.userUpdate = { target, changes, permissionIds, callerId: caller.id };
    next();
  } catch (err) {
    console.error("User update authorization failed:", err?.message);
    return fail(500, "Something went wrong");
  }
};

route.put("/", verifyRoles(Roles.user_saveRoles), authorizeUserUpdate, uploadFilesProfile(true), async (req, res) => {
  try {
    const { target, changes, permissionIds, callerId } = req.userUpdate;
    const fields = { ...changes, updated_by: callerId };
    if (req.userUpload) fields.upload_id = req.userUpload;

    await db.transaction(async (transaction) => {
      await target.update(fields, { transaction });
      if (permissionIds) {
        await UserPermission.destroy({ where: { user_id: target.id }, transaction });
        await UserPermission.bulkCreate(
          permissionIds.map((permission_id) => ({ user_id: target.id, permission_id, added_by: callerId })),
          { transaction }
        );
      }
      await Activity.create(
        { activity: `user "${target?.full_name}"`, type: "updated", added_by: callerId },
        { transaction }
      );
    });
    return res.status(200).send({ message: "Successfully Updated" });
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      return res.status(409).json({ error: true, message: "Username, email or phone number is already in use." });
    }
    console.error("User update failed:", err?.message);
    return res.status(500).json({ error: true, message: "Something went wrong" });
  }
});


/* ---- POST /api/users: administrative user creation ----------------------------------------------------------------
 * Enforced on the server from the caller's CURRENT database state (never from the JWT permission snapshot alone):
 *
 *  - The caller must hold both "Add Users" (the existing gate for this endpoint) and "Edit Users".
 *  - The new user's role must exist and be strictly below the caller's role in the Role.parent tree. Super Admin (role 1)
 *    can never be assigned here. If no role is sent the historical default (role 5) applies and is held to the same rule.
 *  - Every permission granted must be held by the caller (Super Admin holds all); unknown ids are rejected. When no
 *    permissions are sent the account gets none (it used to silently receive "Edit Users").
 *  - Only the fields below are accepted; any other field (role_id, blocked, added_by, id, tokens ...) is rejected.
 *  - User, device, permissions and activity entry are written in one transaction; an uploaded avatar is removed again if
 *    that transaction fails, and nothing is uploaded unless authorization and validation have passed. */
const CREATE_FIELDS = [
  "full_name", "first_name", "last_name" /* legacy clients: joined into full_name */, "username", "email", "phone", "password", "device",
  "role", "date_of_birth", "gender", "about_me", "active", "confirmed", "permissions",
];
const DEFAULT_NEW_USER_ROLE_ID = 5;
const isScalar = (v) => ["string", "number", "boolean"].includes(typeof v);

const authorizeUserCreate = async (req, res, next) => {
  const fail = (status, message) => {
    const file = req.files?.file;
    for (const f of Array.isArray(file) ? file : [file]) if (f?.tempFilePath) fs.unlink(f.tempFilePath, () => {});
    return res.status(status).json({ error: true, message });
  };
  try {
    const b = req.body || {};

    const withPermissions = [{ model: Permission, attributes: ["id", "permission"], through: { attributes: [] } }];
    const caller = await User.findOne({ where: { id: req.user.id }, include: withPermissions });
    if (!caller || caller.active === false || caller.blocked) return fail(403, "You are not authorized!");
    const callerHeld = new Set(await effectivePermissions(caller));
    if (!callerHeld.has("Add Users") || !callerHeld.has("Edit Users")) return fail(401, "You are not authorized!");

    const unexpected = Object.keys(b).filter((k) => !CREATE_FIELDS.includes(k));
    if (unexpected.length) return fail(400, `Unexpected field: ${unexpected[0]}`);
    for (const k of CREATE_FIELDS) {
      if (k !== "permissions" && b[k] !== undefined && !isScalar(b[k])) return fail(400, `Invalid ${k}`);
    }

    // role
    const roleRaw = blank(b.role) ? DEFAULT_NEW_USER_ROLE_ID : String(b.role).trim();
    if (!/^\d+$/.test(String(roleRaw))) return fail(400, "Role does not exist");
    const roleId = Number(roleRaw);
    const roles = await Role.findAll();
    if (!roles.some((r) => r.id === roleId)) return fail(400, "Role does not exist");
    const below = rolesStrictlyBelow(roles, caller.role_id);
    below.delete(SUPER_ADMIN_ROLE_ID);
    if (!below.has(roleId)) return fail(403, "You cannot assign a role at or above your own.");

    // permissions
    let permissionIds = [];
    if (!blank(b.permissions)) {
      const requested = parsePermissionIds(b.permissions);
      if (requested === null) return fail(400, "Invalid permissions");
      if (requested.length > 0) {
        const found = await Permission.findAll({ where: { id: requested }, attributes: ["id", "permission"] });
        if (found.length !== requested.length) return fail(400, "One or more permissions do not exist");
        if (found.some((p) => !callerHeld.has(p.permission))) {
          return fail(403, "You cannot grant permissions you do not hold yourself.");
        }
        permissionIds = requested;
      }
    }

    // names
    const full_name = fullNameFrom(b);
    if (!full_name) return fail(400, "Full name is required!");
    if (full_name.length > 160) return fail(400, "Name is too long");

    // credentials
    const password = b.password === undefined ? "" : String(b.password);
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) return fail(400, "Password must be 8 to 72 characters");

    const email = blank(b.email) ? "" : String(b.email).trim();
    if (!EMAIL_PATTERN.test(email) || email.length > 254) return fail(400, "Enter a valid email address");
    const username = blank(b.username) ? "" : String(b.username).trim();
    if (!USERNAME_PATTERN.test(username)) return fail(400, "Username may contain letters, numbers and . _ + @ - (3 to 64 characters)");
    const phone = blank(b.phone) ? "" : String(b.phone).trim();
    if (phone && !(phone.length <= 32 && /^[0-9+()\- ]+$/.test(phone))) return fail(400, "Enter a valid phone number");

    for (const [field, value, takenMessage] of [
      ["username", username, "Username Already Exist!"],
      ["email", email, "Email Already Exist!"],
      ["phone", phone, "Phone Number Already Exist!"],
    ]) {
      if (!value) continue;
      if (await User.findOne({ where: { [field]: value }, attributes: ["id"] })) return fail(409, takenMessage);
    }

    // profile fields and status
    const fields = {
      full_name, username, email, phone,
      password: bcrypt.hashSync(password, 10),
      role_id: roleId,
      added_by: caller.id,
      updated_by: caller.id,
      about_me: blank(b.about_me) ? "" : String(b.about_me).slice(0, 5000),
    };
    if (!blank(b.gender)) {
      if (!GENDERS.includes(b.gender)) return fail(400, "Invalid gender");
      fields.gender = b.gender;
    }
    if (!blank(b.date_of_birth)) {
      if (Number.isNaN(Date.parse(String(b.date_of_birth)))) return fail(400, "Invalid date of birth");
      fields.date_of_birth = b.date_of_birth;
    }
    for (const field of ["active", "confirmed"]) {
      if (blank(b[field])) continue;
      const value = toBoolean(b[field]);
      if (value === undefined) return fail(400, `Invalid value for ${field}`);
      fields[field] = value;
    }
    const device = blank(b.device) ? "" : String(b.device);
    if (device.length > 255) return fail(400, "Invalid device");

    req.userCreate = { fields, permissionIds, device, callerId: caller.id };
    next();
  } catch (err) {
    console.error("User creation authorization failed:", err?.message);
    return fail(500, "Something went wrong");
  }
};

route.post("/", verifyRoles(Roles.user_createRoles), authorizeUserCreate, uploadFilesProfile(false), async (req, res) => {
  try {
    const { fields, permissionIds, device, callerId } = req.userCreate;
    if (req.userUpload) fields.upload_id = req.userUpload;

    await db.transaction(async (transaction) => {
      const user = await User.create(fields, { transaction });
      await Device.create({ user_id: user.id, device }, { transaction });
      if (permissionIds.length) {
        await UserPermission.bulkCreate(
          permissionIds.map((permission_id) => ({ user_id: user.id, permission_id, added_by: callerId })),
          { transaction }
        );
      }
      await Activity.create(
        { activity: `new user "${user?.full_name}"`, type: "created", added_by: callerId },
        { transaction }
      );
    });
    return res.status(200).send({ message: "Successfully Registered" });
  } catch (err) {
    if (req.userUpload) await deleteStoredPhoto(req.userUpload).catch(() => {});
    if (err instanceof Sequelize.UniqueConstraintError) {
      return res.status(409).json({ error: true, message: "Username, email or phone number is already in use." });
    }
    console.error("User creation failed:", err?.message);
    return res.status(500).json({ error: true, message: "Something went wrong" });
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
  const parentRole = roles.find(role => role.id === parentId && role.parent==null);
  if(parentRole) {
    arr.push({...parentRole})
  }
  
  arr.push(...filterBelow(roles, parentId))
  return arr.sort((a,b)=>a.id-b.id);
}

route.get("/", verifyRoles(Roles.user_findAllRoles), async (req, res) => {
  try {
    const roles = await Role.findAll()
    const usr = await User.findOne({where: {id: req.user.id}})
    const userDepartment = usr?.department_id;
    const users = await User.findAll({
      attributes: [
        "id",
        "full_name",
        "username",
        "email",
        "phone",
        "gender",
        "about_me",
        "date_of_birth",
        "active",
        "blocked",
        "confirmed",
        "role_id",
      ],
      include: [
        {
          model: Permission,
          attributes: ["permission"],
          through: { attributes: [] },
        },
        {
          model: Role,
          as: "roles",
          attributes: ["role"],
        },
        {
          model: UserUpload,
          as: "url",
          attributes: ["filepath"],
        },
       
        
      ],
    }).then((users) => {
      const filteredRoles = filterRolesBelow(roles,usr.role_id).map((frb)=>frb?.dataValues?.id)
      let updatedUsers = [];
      users.map((user) => {
        if(filteredRoles.includes(user.role_id)) {
          const permissions = user.Permissions.map((role) => role.permission);
          var fullUrl = user?.url?.filepath
            ? req.protocol + "://" + req.get("host") + user?.url?.filepath
            : null;
            updatedUsers.push({
              id: user.id,
              full_name: user.full_name,
              username: user.username,
              email: user.email,
              phone: user.phone,
              active: user.active,
              blocked: user.blocked,
              confirmed: user.confirmed,
              role: user.roles?.role,
              permissions: permissions,
              img_url: fullUrl,
              gender: user.gender,
              date_of_birth: user.date_of_birth,
              about_me: user.about_me,
              role_id: user.role_id,
              employment_type: user.employment_type,
            
              user: {
                name: user?.full_name,
                url: fullUrl,
              },

            });
          }
      });

      res.json(updatedUsers.sort((a, b) => b.id - a.id));
    });
  } catch (error) {
    console.error(error?.message)
    res.send({ error: true, message: 'Something went wrong' });
  }
});

route.get("/:id", selfOrRoles(Roles.user_findOneRoles), async (req, res) => {
  try {
    const id = req.params.id;
    const users = await User.findOne({
      where: {id: id},
      include: [
        {
          model: Permission,
          attributes: ["permission"],
          through: { attributes: [] },
        },
        {
          model: Role,
          as: "roles",
          attributes: ["role"],
        },
        {
          model: UserUpload,
          as: "url",
          attributes: ["filepath"],
        },
        
      ],
    }).then((user) => {
      
        const permissions = user.Permissions.map((role) => role.permission);
        var fullUrl = user?.url?.filepath
          ? req.protocol + "://" + req.get("host") + user?.url?.filepath
          : null;
          
          const updatedUser = {
            ...user.toJSON(),
            img_url: fullUrl,
            permissions: permissions,
          }
      


      res.json(updatedUser);
    });
  } catch (error) {
    console.error(error?.message)
    res.send({ error: true, message: 'Something went wrong' });
  }
});

function convertPhoneNumber(inputPhoneNumber) {
  const cleanedNumber = inputPhoneNumber.replace(/\D/g, '');

  const countryCodeMatch = inputPhoneNumber.match(/^\+\d+/);

  if (countryCodeMatch) {
    const countryCode = countryCodeMatch[0];
    const phoneNumber = cleanedNumber.substring(countryCode.length - 1);

    const formattedNumber = countryCode + '-' + phoneNumber;

    return formattedNumber;
  } else {
    return inputPhoneNumber;
  }
}



module.exports = route;
