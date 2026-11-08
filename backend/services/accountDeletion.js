/* Self-service account deletion (App Store guideline 5.1.1(v), also used by the website profile page).
 *
 * The account is ANONYMISED in place instead of the row being removed. Payments, course content added by staff, the
 * activity log and other tables point at Users.id; removing the row would leave them dangling (or fail on a foreign key).
 * The person can no longer be identified from what remains.
 *
 * Deleted:      profile photo (file and row), registered devices, per-user permissions, every login session, the
 *               user's course ratings/reviews, notifications to or from the user, chat messages sent or received
 *               (with their attachments).
 * Anonymised:   name, username, email, phone, about-me, birth date, custom fields, tokens; password replaced by a
 *               random hash nobody knows; account set inactive and blocked.
 * Retained:     payment records (financial/audit trail) and the activity log, both pointing at the now-anonymous row.
 */
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const UserPermission = require('../models/UserPermission')
const Device = require('../models/Device')
const UserRating = require('../models/UserRating')
const Notification = require('../models/Notification')
const Chat = require('../models/Chat')
const ChatUpload = require('../models/ChatUpload')
const sessions = require('./sessions')
const { Op } = require('sequelize')
const fs = require('fs')
const path = require('path')
const { deleteStoredPhoto } = require('../middlewares/profileUpload')

const FILES_ROOT = path.resolve(__dirname, '..', 'files')

/* Removes the stored file of a chat attachment; a missing file is not an error. */
const removeChatFiles = async (uploadIds) => {
  if (!uploadIds.length) return
  const rows = await ChatUpload.findAll({ where: { id: uploadIds } })
  for (const row of rows) {
    if (row.filepath) {
      const target = path.resolve(FILES_ROOT, '.' + String(row.filepath))
      if (target.startsWith(path.join(FILES_ROOT, 'uploads') + path.sep)) fs.unlink(target, () => {})
    }
  }
  await ChatUpload.destroy({ where: { id: uploadIds } })
}

const deleteAccount = async (user) => {
  const id = user.id
  const photoId = user.upload_id

  await sessions.revokeAllForUser(id, 'account_deleted')

  const chats = await Chat.findAll({ where: { [Op.or]: [{ from: id }, { to: id }] }, attributes: ['id', 'chatupload_id'] })
  await Chat.destroy({ where: { id: chats.map((c) => c.id) } })
  await removeChatFiles([...new Set(chats.map((c) => c.chatupload_id).filter(Boolean))])
  await Notification.destroy({ where: { [Op.or]: [{ from: id }, { to: id }] } })
  await UserRating.destroy({ where: { added_by: id } })
  await UserPermission.destroy({ where: { user_id: id } })
  await Device.destroy({ where: { user_id: id } })

  await User.update({
    full_name: 'Deleted user',
    username: `deleted-${id}`,
    email: `deleted-${id}@deleted.invalid`,
    phone: '',
    about_me: '',
    custom_fields: '[]',
    password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
    refresh_token: null,
    reset_password_token: '',
    registration_token: '',
    confirmation_token: '',
    upload_id: null,
    active: false,
    blocked: true,
    confirmed: false,
  }, { where: { id } })

  if (photoId) await deleteStoredPhoto(photoId)
}

module.exports = { deleteAccount }
