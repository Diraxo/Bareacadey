const Notification = require("../models/Notification");
const User = require("../models/User");
const Sequelize = require("sequelize");
const express = require("express");
const route = express.Router();
const verifyRoles = require("../middlewares/verifyRoles");
let Roles = require("../roles");
const Activity = require("../models/Activity");
const Role = require("../models/Role");
const UserUpload = require("../models/UserUpload");

function filterBelow(roles, parentId) {
  const arr = [];
  const children = roles.filter((role) => role.parent === parentId);
  children.map((role) => {
    arr.push(...filterBelow(roles, role.id));
  });
  arr.push(...children);
  return arr;
}

function filterRolesBelow(roles, parentId) {
  const arr = [];
  const parentRole = roles.find(
    (role) => role.id === parentId && role.parent == null
  );
  if (parentRole) {
    arr.push({ ...parentRole });
  }

  arr.push(...filterBelow(roles, parentId));
  return arr.sort((a, b) => a.id - b.id);
}

route.get("/", verifyRoles(Roles.activity_findAllRoles), async (req, res) => {
  try {
    const roles = await Role.findAll();
    const usr = await User.findOne({ where: { id: req.user.id } });
    await Activity.findAll({
      order: [["id", "DESC"]],
      include: {
        model: User,
        attributes: ["id", "full_name", "role_id", "upload_id"],
      },
    }).then(async (activitieslist) => {
      const filteredRoles = filterRolesBelow(roles, usr.role_id).map(
        (frb) => frb?.dataValues?.id
      );
      let updatedActivities = [];
      const rl = await Promise.all(
        activitieslist.map(async (activity) => {
          if (filteredRoles.includes(activity?.User?.role_id)) {
            const upload = await UserUpload.findOne({
              where: { id: activity?.User.upload_id },
              attributes: ["filepath"],
            });
            const role = await Role.findOne({
              where: { id: activity?.User.role_id },
              attributes: ["role", "color"],
            });
            var fullUrl = upload?.filepath
              ? req.protocol + "://" + req.get("host") + upload?.filepath
              : null;
            updatedActivities.push({
              id: activity.id,
              full_name:
                activity?.User?.full_name,
              url: fullUrl,
              type: activity?.type,
              activity: activity?.activity,
              role: role?.role,
              color: role?.color,
              date: activity?.createdAt,
              user: {
                name:
                  activity?.User?.full_name,
                url: fullUrl,
                id: activity?.User.id,
              },
            });
          }
        })
      );

      res.json(updatedActivities.sort((a, b) => b.id - a.id));
    });
  } catch (error) {
    console.error(error?.message)
    res.send({ error: true, message: 'Something went wrong' });
  }
});

module.exports = route;
