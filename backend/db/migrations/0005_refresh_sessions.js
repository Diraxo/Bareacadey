/* Independent login sessions: ONE new table, RefreshSessions (see models/RefreshSession.js). Nothing existing is altered.
 *
 * Existing sign-ins keep working: a refresh token issued before this release is a JWT whose hash is stored in
 * Users.refresh_token. The refresh endpoint still accepts it until it expires (its own expiry) and, for browsers, trades
 * it for a session on first use. Users.refresh_token is no longer written; the column stays (rollback target).
 *
 * `sync()` creates the table and its indexes only where they are missing, so running this again after a partial failure
 * is safe. Reversible: dropping the table signs everybody out of the new-style sessions (they sign in again). */
module.exports = {
  async up({ models }) {
    await models.RefreshSession.sync()
  },
}
