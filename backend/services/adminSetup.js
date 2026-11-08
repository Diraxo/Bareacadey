/* First-administrator creation. There is no default account and no default password: the caller must supply one,
 * it must be reasonably strong, and the operation is refused once any user exists. */
const bcrypt = require('bcrypt')
const User = require('../models/User')
const Role = require('../models/Role')
const UserPermission = require('../models/UserPermission')
const Permission = require('../models/Permission')

const SUPER_ADMIN_ROLE_ID = 1
const MIN_PASSWORD_LENGTH = 12

class AdminSetupError extends Error {}

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length
  if (classes < 3) return 'Password must mix at least three of: lowercase, uppercase, digits, symbols'
  return null
}

const createFirstAdmin = async ({ email, password, full_name, username, phone }) => {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AdminSetupError('A valid email address is required')
  const problem = validatePassword(password)
  if (problem) throw new AdminSetupError(problem)

  if ((await User.count()) > 0) {
    throw new AdminSetupError('Users already exist. The first administrator can only be created on an empty user table.')
  }
  const role = await Role.findOne({ where: { id: SUPER_ADMIN_ROLE_ID } })
  const permissions = await Permission.findAll({ attributes: ['id'] })
  if (!role || permissions.length === 0) {
    throw new AdminSetupError('Reference data is missing. Run `npm run db:init` first.')
  }

  // The codebase treats user id 1 as the Super Admin in several places, and the table is empty here, so this becomes id 1.
  const user = await User.create({
    full_name: full_name || 'Admin',
    username: username || email.split('@')[0],
    email,
    phone: phone || '',
    password: await bcrypt.hash(password, 12),
    role_id: SUPER_ADMIN_ROLE_ID,
    active: true,
    confirmed: true,
  })
  for (const permission of permissions) {
    await UserPermission.create({ user_id: user.id, permission_id: permission.id, added_by: user.id })
  }
  return { id: user.id, email: user.email }
}

module.exports = { createFirstAdmin, validatePassword, AdminSetupError, MIN_PASSWORD_LENGTH }
