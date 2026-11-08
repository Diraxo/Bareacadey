/* Permission names a user holds when they sign in or refresh a token.
 *
 * A Super Admin (role 1) always holds every permission: a second Super Admin created through the admin screens can do
 * everything the first one can, including managing all courses, even if nobody ticked each permission for them.
 * Everyone else keeps exactly the permissions stored for them. */
const Permission = require('../models/Permission')

const SUPER_ADMIN_ROLE_ID = 1

const effectivePermissions = async (user) => {
  const own = (user?.Permissions || []).map((p) => p.permission)
  if (user?.role_id !== SUPER_ADMIN_ROLE_ID) return own
  const all = (await Permission.findAll({ attributes: ['permission'] })).map((p) => p.permission)
  return [...new Set([...own, ...all])]
}

module.exports = { effectivePermissions, SUPER_ADMIN_ROLE_ID }
