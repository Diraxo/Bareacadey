const Role = require('../../models/Role')
const RolePermission = require('../../models/RolePermission')
const { PERMISSIONS } = require('./permissions')

// default permissions per role, taken from what AuthController.create_account grants at sign-up
const ROLES = [
  { id: 1, role: "Super Admin", plural: "Super Admins", system: 1, color: "#6366f1", permissions: PERMISSIONS.map((p) => p.id) },
  { id: 5, role: "Viewer", plural: "Viewers", system: 1, parent: 1, color: "#018184", permissions: [12, 15] },
  { id: 12, role: "Instructor", plural: "Instructors", system: 1, parent: 1, color: "#f88800", permissions: [12, 14, 15] },
]

/* Idempotent. Roles are created without an author because no user exists yet on a fresh database. */
const seedRoles = async () => {
  for (const { permissions, ...role } of ROLES) {
    await Role.upsert(role)
    for (const permission_id of permissions) {
      await RolePermission.findOrCreate({ where: { role_id: role.id, permission_id }, defaults: { system: 1 } })
    }
  }
}

module.exports = seedRoles
module.exports.ROLES = ROLES
