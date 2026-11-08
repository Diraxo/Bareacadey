/* Support tools for the single-registered-device rule (see services/devices.js).
 *   GET  /user/:userId        who is registered (admin: "View Users" or "Edit Users")
 *   POST /user/:userId/reset  clear the registration so the user's next device becomes the registered one ("Edit Users")
 * Every reset is written to the activity log. */
const express = require('express')
const route = express.Router()
const verifyRoles = require('../middlewares/verifyRoles')
const Roles = require('../roles')
const { User, Activity } = require('../models')
const devices = require('../services/devices')

const fail = (res, status, message) => res.status(status).json({ error: true, message })

route.get('/user/:userId', verifyRoles([...Roles.user_findOneRoles, ...Roles.user_saveRoles]), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10)
    if (!Number.isInteger(userId)) return fail(res, 400, 'Invalid user')
    const rows = await devices.registeredDevices(userId)
    res.json(rows.map((d) => ({ id: d.id, device: d.device, registered_at: d.registered_at, last_seen_at: d.last_seen_at })))
  } catch (e) { console.error('device list failed:', e?.message); fail(res, 500, 'Something went wrong') }
})

route.post('/user/:userId/reset', verifyRoles(Roles.user_saveRoles), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10)
    const user = Number.isInteger(userId) ? await User.findOne({ where: { id: userId } }) : null
    if (!user) return fail(res, 404, 'User not found')
    const removed = await devices.clearRegistrations(user.id)
    await Activity.create({ activity: `reset registered device of "${user.full_name}"`, type: 'updated', added_by: req.user.id }).catch(() => {})
    res.json({ message: 'Device registration cleared. The next device the user signs in with will be registered.', removed })
  } catch (e) { console.error('device reset failed:', e?.message); fail(res, 500, 'Something went wrong') }
})

module.exports = route
