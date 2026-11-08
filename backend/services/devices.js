/* Device registration policy for the mobile app (policy "single", see migration-docs/04 and 07).
 *
 * Rule: an account is bound to the device it first used. Another device is "denied" until the registration is replaced.
 * Nobody may be locked out for good, so there are two recovery routes:
 *   1. self-service: a signed-in user asks for a link by email; opening it replaces the registered device with the one
 *      that asked. Allowed again only after `replaceCooldownDays`, so a shared password alone cannot rotate devices
 *      (the person also needs the account's mailbox).
 *   2. support: an administrator with "Edit Users" clears the registrations; the next device that checks in is registered.
 * `device_policy.mode = 'off'` (Config row 5) disables the rule entirely. */
const jwt = require('jsonwebtoken')
const config = require('../config')
const Device = require('../models/Device')

const DAY = 24 * 60 * 60 * 1000
const TOKEN_TYPE = 'device_replace'

const registeredDevices = async (userId, options = {}) =>
  (await Device.findAll({ where: { user_id: userId }, ...options })).filter((d) => d.device && d.device.trim())

/* Newest registration time (ms) of an account, 0 when none. Rows that pre-date the timestamp column count as "long ago". */
const latestRegistration = (devices) => devices.reduce((max, d) => Math.max(max, d.registered_at ? new Date(d.registered_at).getTime() : 0), 0)

/* When may this account replace its device by itself? Returns { allowed, retryAt }. */
const replacementWindow = (devices, cooldownDays, now = Date.now()) => {
  const last = latestRegistration(devices)
  const retryAt = last + cooldownDays * DAY
  return { allowed: now >= retryAt, retryAt: new Date(retryAt) }
}

/* Applies the rule for one /check call. Returns { status: 'success' } or { status: 'denied', code, ... }. */
const checkDevice = async ({ userId, device, policy }) => {
  if (policy.mode === 'off') return { status: 'success' }
  const registered = await registeredDevices(userId)
  const match = registered.find((d) => d.device === device)
  if (match) {
    await match.update({ last_seen_at: new Date() })
    return { status: 'success' }
  }
  if (registered.length === 0) {
    const now = new Date()
    await Device.create({ device, user_id: userId, registered_at: now, last_seen_at: now })
    return { status: 'success' }
  }
  const { allowed, retryAt } = replacementWindow(registered, policy.replaceCooldownDays)
  return {
    status: 'denied',
    code: 'device_not_registered',
    message: 'Unregistered device',
    can_self_replace: allowed,
    // when self-service becomes available again (never a permanent lock: support can always reset)
    self_replace_available_at: allowed ? null : retryAt.toISOString(),
  }
}

const issueReplacementToken = ({ userId, device, devices }) =>
  jwt.sign(
    // `v` ties the link to the registration state at request time, so an old link cannot undo a later change
    { typ: TOKEN_TYPE, id: userId, device, v: latestRegistration(devices) },
    config.secrets.accessToken,
    { expiresIn: process.env.EMAIL_TOKEN_EXPIRES_IN || '1h', algorithm: 'HS256' }
  )

/* Verifies the emailed link and replaces the registered device(s). Throws an Error with a safe `.publicMessage`. */
const redeemReplacementToken = async (token) => {
  let claims
  try {
    claims = jwt.verify(token, config.secrets.accessToken, { algorithms: ['HS256'] })
  } catch (e) {
    const err = new Error('invalid'); err.publicMessage = 'This link is invalid or has expired'; throw err
  }
  if (claims.typ !== TOKEN_TYPE || !claims.id || !claims.device) {
    const err = new Error('invalid'); err.publicMessage = 'This link is invalid or has expired'; throw err
  }
  const current = await registeredDevices(claims.id)
  if (latestRegistration(current) !== Number(claims.v)) {
    const err = new Error('stale'); err.publicMessage = 'This link was already used or is out of date. Request a new one.'; throw err
  }
  await replaceRegistration(claims.id, claims.device)
}

/* Replaces every registration of the user with `device` (admin and self-service share this). */
const replaceRegistration = async (userId, device) => {
  await Device.destroy({ where: { user_id: userId } })
  const now = new Date()
  await Device.create({ device, user_id: userId, registered_at: now, last_seen_at: now })
}

/* Support reset: the next device that checks in becomes the registered one. */
const clearRegistrations = (userId) => Device.destroy({ where: { user_id: userId } })

module.exports = {
  checkDevice, replacementWindow, issueReplacementToken, redeemReplacementToken, replaceRegistration, clearRegistrations,
  registeredDevices, latestRegistration, TOKEN_TYPE,
}
