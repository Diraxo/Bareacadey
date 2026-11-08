const db = require('../database')
const Sequelize = require('sequelize')

/* One signed-in browser or device. Several rows per user are normal and independent: signing in elsewhere never touches
 * another row, signing out revokes exactly one row.
 *
 * The refresh token itself is never stored. `seed` (random, per session) and the server's refresh secret together derive
 * the token of each `generation`; `token_hash` is the SHA-256 of the CURRENT generation's token, kept so the stored value
 * can be compared without keeping the secret itself. A database copy alone therefore does not yield usable tokens.
 * See services/sessions.js for the lifecycle (sliding expiry, rotation, reuse detection). */
const RefreshSession = db.define('RefreshSession', {
   id: { type: Sequelize.STRING(36), primaryKey: true, allowNull: false },
   user_id: { type: Sequelize.INTEGER, allowNull: false },
   seed: { type: Sequelize.STRING(64), allowNull: false },
   generation: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
   token_hash: { type: Sequelize.STRING(64), allowNull: false },
   // when the current generation was issued (anchor of the replay grace window)
   rotated_at: { type: Sequelize.DATE, allowNull: true },
   last_used_at: { type: Sequelize.DATE, allowNull: true },
   // sliding inactivity expiry; never later than absolute_expires_at
   expires_at: { type: Sequelize.DATE, allowNull: false },
   absolute_expires_at: { type: Sequelize.DATE, allowNull: false },
   revoked_at: { type: Sequelize.DATE, allowNull: true },
   // logout | reuse | password_change | limit | admin
   revoked_reason: { type: Sequelize.STRING(24), allowNull: true },
   // short description of the client, for a future "your devices" list. Never used for security decisions.
   user_agent: { type: Sequelize.STRING(255), allowNull: true },
}, {
   indexes: [
      { fields: ['user_id', 'revoked_at'] },
      { fields: ['token_hash'] },
      { fields: ['expires_at'] },
   ],
})

module.exports = RefreshSession
