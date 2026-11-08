/* Profile picture upload middleware (shared by UserController and AuthController).
 *
 * Sets req.userUpload to the new UserUpload id. For updates, the previous picture of the *target* user
 * (req.profileTargetId, else req.body.id) is removed after the new one has been stored. */
const fs = require('fs')
const path = require('path')
const User = require('../models/User')
const UserUpload = require('../models/UserUpload')
const { saveUpload } = require('./safeUpload')

const FILES_ROOT = path.resolve(__dirname, '..', 'files')

const deleteStoredPhoto = async (id) => {
  const oldFile = await UserUpload.findOne({ where: { id: id } })
  if (!oldFile) return
  const target = path.resolve(FILES_ROOT, '.' + String(oldFile.filepath))
  if (target.startsWith(path.join(FILES_ROOT, 'uploads', 'users') + path.sep) && fs.existsSync(target)) {
    fs.unlink(target, () => {})
  }
  await UserUpload.destroy({ where: { id: id } })
}

const uploadFilesProfile = (update = false) => {
  return async (req, res, next) => {
    try {
      if (!req.files || !req.files.file) return next()
      const file = req.files.file
      if (Array.isArray(file)) return res.status(400).json({ error: true, message: 'Upload a single file' })

      const { storedName } = await saveUpload(file, { subdir: 'users/profile', kind: 'image' })

      if (update) {
        const targetId = req.profileTargetId ?? req.body.id
        const user = targetId ? await User.findOne({ where: { id: targetId } }) : null
        if (user?.upload_id) await deleteStoredPhoto(user.upload_id)
      }

      const userUpload = await UserUpload.create({
        filename: file.name,
        mimetype: file.mimetype,
        size: file.size,
        filepath: '/uploads/users/profile/' + storedName,
        type: 'localStorage',
      })
      req.userUpload = userUpload.id
      next()
    } catch (err) {
      if (err?.status === 400) return res.status(400).json({ error: true, message: err.message })
      console.error('Profile upload failed:', err?.message)
      return res.status(500).json({ error: true, message: 'Something went wrong' })
    }
  }
}

module.exports = { uploadFilesProfile, deleteStoredPhoto }
