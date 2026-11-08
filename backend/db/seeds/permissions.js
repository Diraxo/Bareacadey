const PermissionCategory = require('../../models/PermissionCategory')
const Permission = require('../../models/Permission')

const CATEGORIES = [
  { id: 1, name: "Basic Settings", system: 1 },
  { id: 2, name: "Main System", system: 1 },
  { id: 11, name: "States", system: 1 },
]

/* ids 1-17 are the original seeds (create_account relies on 12, 14 and 15).
 * ids 18+ are permission names that roles.js checks but that the old seed never created, so a fresh database
 * would otherwise have no way to grant them (even to the Super Admin). */
const PERMISSIONS = [
  { id: 1, permission: "Add Users", category_id: 1, grouped_under: "Manage Users" },
  { id: 2, permission: "Edit Users", category_id: 1, grouped_under: "Manage Users" },
  { id: 3, permission: "Delete Users", category_id: 1, grouped_under: "Manage Users" },
  { id: 4, permission: "View Users", category_id: 1, grouped_under: "Manage Users" },
  { id: 5, permission: "View Detail", category_id: 1, grouped_under: "Manage Users" },
  { id: 6, permission: "Add Role", category_id: 1, grouped_under: "Manage Roles" },
  { id: 7, permission: "Edit Role", category_id: 1, grouped_under: "Manage Roles" },
  { id: 8, permission: "Delete Role", category_id: 1, grouped_under: "Manage Roles" },
  { id: 9, permission: "View Role", category_id: 1, grouped_under: "Manage Roles" },
  { id: 10, permission: "Chat", category_id: 1 },
  { id: 11, permission: "Contact Us", category_id: 1 },
  { id: 12, permission: "My Tasks", category_id: 1 },
  { id: 13, permission: "Activities", category_id: 1 },
  { id: 14, permission: "Instructor", category_id: 2 },
  { id: 15, permission: "Viewer", category_id: 2 },
  { id: 16, permission: "Customize Homepage", category_id: 2 },
  { id: 17, permission: "Manage Categories", category_id: 2 },
  { id: 18, permission: "Customize Landing Page", category_id: 2 },
  { id: 19, permission: "Manage Employee Categories", category_id: 1 },
  { id: 20, permission: "Manage Employee Positions", category_id: 1 },
  { id: 21, permission: "Manage Employee Departments", category_id: 1 },
  // Instructors (permission 14) can only touch courses/quizzes assigned to or created by them; this lifts that limit.
  { id: 22, permission: "Manage All Courses", category_id: 2 },
]

const seedPermissions = async () => {
  for (const c of CATEGORIES) await PermissionCategory.upsert(c)
  for (const p of PERMISSIONS) await Permission.upsert({ system: 1, ...p })
}

module.exports = seedPermissions
module.exports.PERMISSIONS = PERMISSIONS
module.exports.CATEGORIES = CATEGORIES
