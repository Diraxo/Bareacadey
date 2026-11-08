# 05 — Phase 2 report (security fixes + migration foundations)

> Superseded in part by Phase 3: see [07](07-phase3-decisions-and-changes.md) (decisions), [08](08-predeploy-status-and-runbook.md) (what was actually tested/built and the deployment runbook) and [09](09-modified-files.md) (file list). In particular the discount rule (S16) is now corrected and instructor self-registration no longer grants permissions.

Tests: `cd backend && npm test` -> 12 suites, SQLite only (never MySQL, never real credentials: `.env` loading is disabled under test).

## Phase 1 findings re-validated against source
Confirmed: S1–S8, S10, S12–S15, S18–S20. Corrected: the mobile `.git` tracks only 10 files and no secrets.

**New findings (not in Phase 1), all fixed:**
- N1 any signed-in student could create/edit/delete users and roles and grant themselves permissions (`roles.js` "Public Access").
- N2 `PUT /users/profile/update` trusted `body.id`, so any user could edit another's email/role, which chains into password-reset account takeover.
- N3 `GET/PUT /api/system_config` exposed, and let anyone overwrite, the SMTP credentials row.
- N4 `routeState` endpoints (course/chapter/contact/task) had no role check; `contacts_public` allowed anonymous edit/delete of contacts.
- N5 reset-email tokens were valid API access tokens; deactivated users could log in; refresh tokens were stored in plaintext.
- N6 upload helpers used client file names as paths; a `findOne({id})` bug deleted the *first* upload row/file; chat messages were editable by anyone.
- N7 seeds lacked permissions that routes require, so a fresh DB would lock even the Super Admin out of landing-page and employee screens.
- N8 `hls-server` listened on all interfaces, unauthenticated.
- Still open (low): `/api/public/course/:id/user/:userId` tells anonymous callers whether a given user bought a course.

## Fixed (decision 4)
`/sync-database` and `/api/pay` removed; eBirr/Kaafi handler deleted and its UI removed; Chapa verified server-side (status, tx_ref, currency, amount, owner; idempotent; the callback is only a trigger); Socket.IO handshake auth, addressed delivery and call-room checks; paid media and HLS key behind per-file authorization (no Referer logic); upload allow-list, size, magic bytes and generated names; `.env.example`; hard-coded secrets removed from code; first admin via `npm run admin:create` (no default password, at least 12 chars, empty user table only).

## Migration foundations
`config/` (all URLs and secrets from env, fail-fast in production), `db/migrate.js` + `db/migrations`, `db/seeds` (idempotent, no credentials), `npm run db:init` (refuses a non-empty DB; never force/alter), quiz schema, `app.js`/`server.js` split.

## Behaviour changes to be aware of
- Paid files need login + purchase (web and mobile were updated to send a media token); sockets need login.
- Passwords must be at least 8 characters (admin: 12); deactivated accounts cannot sign in; login/reset are rate-limited.
- Students get only the settings row from `GET /api/system_config`.
- Discount math (S16: charges `percent x price / 100`) is **unchanged; confirm with the academy**.
- Self-registration as Instructor (`role 12`) still grants course-management rights: a product decision, flagged.

## Not verified / blockers
- **MySQL:** none was available here; everything ran on SQLite. Rehearse `npm run db:init` on a staging MariaDB/MySQL first.
- Web (Vite) and mobile (Expo) changes were only syntax-checked with esbuild, not built or run on a device. HLS playback and live Chapa calls are untested.
- Hosting (decision 7): see doc 06.
- **Rotate before go-live (treat all as compromised):** DB credentials (one was embedded in the deleted `ebirr.php`), JWT secrets, SMTP, Chapa key, Google OAuth secret, wallet-gateway token, `BACKUP_PASSWORD`. The `.env` files, `bare/credentials.json` and the keystores are still in the folders you supplied; keep them out of anything shared. `files/uploads/hls-key/enc.key` is a leaked key: run `npm run media:keyinfo -- --rotate`.
- Package IDs, signing keys and `app.json` are untouched; no app was built or published.
- There is no git history here: the original `server.js`, `PaymentController.js` etc. were rewritten in place, so keep your original archive. Stale app copies were moved to `bare/_archive_unused/`.
- The mobile app needs an update for: the new API URL, the media token, the device-check token, and the eBirr/Kaafi removal.
