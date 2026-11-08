const Config = require('../../models/Config')

/* Default Config rows. They contain NO credentials: SMTP, Chapa and OAuth secrets come from the environment
 * (see .env.example). Existing rows are never overwritten, so settings changed in the admin UI survive re-runs. */
const DEFAULT_ROWS = [
  { id: 1, type: "email", config: { service: "", host: "", port: 465, secure: true, auth: { user: "", pass: "" }, additional: { email_friendly_name: "", expires_in: "1h" } } },
  { id: 2, type: "upload", config: { upload: "localStorage" } },
  { id: 3, type: "payment", config: [] },
  { id: 4, type: "settings", config: { font: "ubuntu", currency: "USD", date_separator: "/", usdToBirr: 125 } },
  { id: 5, type: "mobile", config: { app_version: 1, device_policy: { mode: "off", blockOnLogout: false } } },
]

const seedConfig = async () => {
  for (const row of DEFAULT_ROWS) {
    await Config.findOrCreate({ where: { id: row.id }, defaults: { type: row.type, config: JSON.stringify(row.config) } })
  }
}

module.exports = seedConfig
module.exports.DEFAULT_ROWS = DEFAULT_ROWS
