/* Mobile-app runtime settings, stored in the Config table (row id 5, type "mobile") so that the academy can change
 * them without a deployment. Only the shape below is read; unknown keys are ignored. */
const Config = require('../models/Config')

const MOBILE_CONFIG_ID = 5

const DEFAULTS = Object.freeze({
  // MINIMUM supported build number (Android versionCode / iOS build number). An installed build below it must update.
  // It is the Android minimum, as it always was; 1 means "nobody has to update" until the academy raises it.
  app_version: 1,
  // Optional per-platform minimums. Android falls back to app_version, so existing settings keep their meaning.
  // iOS has no fallback: its build numbers are not the Android versionCodes, so iOS is only enforced when
  // min_build_ios is set explicitly (null = not enforced).
  device_policy: Object.freeze({
    // 'single': a user may only use the device registered for the account (inferred from the app's
    //           "unregistered device, contact support" flow; see migration-docs/04).
    // 'off':    no device restriction.
    mode: 'single',
    // Original behaviour of POST /block/ on logout could not be recovered from the source; off unless enabled.
    blockOnLogout: false,
    // how long after a (re)registration the user may replace the device again without support
    replaceCooldownDays: 7,
  }),
})

const buildOrNull = (v) => {
  const n = Number(v)
  return v !== null && v !== '' && v !== undefined && Number.isInteger(n) && n >= 0 ? n : null
}

const getMobileConfig = async () => {
  const row = await Config.findOne({ where: { id: MOBILE_CONFIG_ID } })
  let stored = {}
  try { stored = JSON.parse(row?.config || '{}') } catch (e) { stored = {} }
  const appVersion = parseInt(stored.app_version, 10)
  const app_version = Number.isFinite(appVersion) && appVersion >= 0 ? appVersion : DEFAULTS.app_version
  return {
    app_version,
    min_build_android: buildOrNull(stored.min_build_android) ?? app_version,
    min_build_ios: buildOrNull(stored.min_build_ios),
    device_policy: {
      mode: stored.device_policy?.mode === 'off' ? 'off' : DEFAULTS.device_policy.mode,
      blockOnLogout: stored.device_policy?.blockOnLogout === true,
      replaceCooldownDays: Number.isFinite(Number(stored.device_policy?.replaceCooldownDays)) && Number(stored.device_policy.replaceCooldownDays) >= 0
        ? Number(stored.device_policy.replaceCooldownDays)
        : DEFAULTS.device_policy.replaceCooldownDays,
    },
  }
}

module.exports = { getMobileConfig, MOBILE_CONFIG_ID, DEFAULTS }
