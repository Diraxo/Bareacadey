# 13 — Final uploads + sessions release (2026-11-01c) — NOT DEPLOYED

Supersedes doc 12. Nothing in this document has been run against production, a live MySQL server, cPanel, or a real browser.

## 1. What this release is
| Package | Contents |
|---|---|
| `release/backend-update-2026-11-01c.tar.gz` | Every backend file that differs from the full release `johar-release-2026-10-30` (cumulative: includes the 10-30f/h, 10-31a/b, 11-01a/b changes and the new work). Extract over the existing `backend/`. No `.env`, no `node_modules`, no tests. |
| `release/web-only-2026-11-01c.tar.gz` | `dist/` built from `frontend/` at the same source state. |
| `release/manifest-2026-11-01c.txt` / `.json` | SHA-256 of both archives, of every file inside them, and of the source file each came from. |

Previous archives are untouched.

## 2. Migrations (run in order, `npm run db:migrate`, only after a backup)
| # | Effect | Reversible? |
|---|---|---|
| 0001, 0002 | unchanged | — |
| **0003** | `ALTER TABLE Chapters MODIFY chapter_files MEDIUMTEXT`. This **rewrites the column definition of an existing, live table**: MySQL may copy the table and block writes to `Chapters` while it runs (short for a small table, not instant). Widening keeps all values. | **Not safely reversible once new data exists.** Narrowing back to TEXT fails (strict mode) or silently truncates any value longer than 64 KB — i.e. any unit with roughly 150+ files. Rollback = restore the backup, or leave the wider column in place (the old code works with it). |
| 0004 | creates `UploadBatches`, `UploadBatchFiles` (new tables) | yes (drop the two tables; loses upload history) |
| **0005** | creates `RefreshSessions` (new table). Existing tables untouched. | yes (drop the table; everyone with a new-style session signs in again) |
| **0006** | `ALTER TABLE UploadBatchFiles` ADD COLUMN `chapter_id, position, fingerprint, last_modified, stored_path, content_sha256`, backfill `chapter_id`, ADD UNIQUE INDEX `(chapter_id, client_key)` and an index on `(status, updatedAt)`. It stops with a message (changing nothing further) if a unit already uses one key twice. | columns/indexes can be dropped; harmless to leave |

"Rerunnable" (each step checks the live schema first, so a run that stopped half-way continues) is **not** the same as "safe": 0003 and 0006 are `ALTER TABLE`s. Do not run them while staff are uploading.

**Backup first.** `mysqldump --single-transaction <db> > backup.sql` (or the host's backup) and confirm it can be restored. Also copy `backend/files/uploads` if disk allows.

## 3. Deployment order
1. Backup (above). Announce a short window; ask instructors to stop uploading.
2. Stop the Node app.
3. Extract `backend-update-2026-11-01c.tar.gz` over `backend/` (keep `.env`, `files/`, `node_modules`). `npm ci --omit=dev` only if `package.json` changed on your copy (it adds only an npm script).
4. `npm run db:migrate` (applies 0003–0006 as needed).
5. Start the app; check `/healthz`.
6. Extract `web-only-2026-11-01c.tar.gz` (replace `dist/` content of the web root; delete old hashed assets).
7. Smoke test (section 9).

**Backend before frontend, and within minutes of each other.** The new web app calls `DELETE /api/user/token/logout`, sends `_removed_files`, and posts fingerprints; the new backend does **not** break the old web app except that an old cached edit form can no longer delete files by omission (by design) and old logout calls keep working.

## 4. Sessions: what changes for users already signed in
* Before: one refresh token per user (hash in `Users.refresh_token`), so a new login signed the previous device out.
* Now: one row of `RefreshSessions` per login. New logins never touch other rows.
* **Existing sign-ins keep working.** A refresh token issued by the old release is a JWT whose hash is still in `Users.refresh_token`. `POST /api/user/token/reqtoken` still accepts it until the JWT's own expiry (`REFRESH_TOKEN_EXPIRES_IN`). The mobile app keeps using it unchanged; a browser trades it for a real session on first use. The column is no longer written (and is kept for rollback). Old tokens are still cleared by logout and by password reset.
* After the transition a session lives **30 days since last use** (`SESSION_IDLE_DAYS`), capped at 365 days from login (`SESSION_ABSOLUTE_DAYS`, never extended). Access tokens stay 15 minutes.
* Browsers (cookie + `Origin` header) get a **new refresh token on every refresh**. The previous token still works for `SESSION_ROTATION_GRACE_SECONDS` (default 120) to cover a lost response or a second tab; the server hands out the same current token again. An older token, or the previous one after the grace window, is treated as reuse and **revokes that one session** (other devices unaffected).
* The released mobile app ignores any replacement token, so requests with the token in the body and no `Origin` header are **not rotated**; their token stays valid and only slides the 30-day window. This is a deliberate limit: the mobile token is long-lived until it idles 30 days, is revoked, or hits the 365-day cap.
* Tokens are `rs1.<session id>.<generation>.<mac>`; the mac is HMAC-SHA256 of a per-session random seed under `REFRESH_TOKEN_SECRET`. The database holds the seed and the SHA-256 of the current token, never a usable token. **Changing `REFRESH_TOKEN_SECRET` signs out every session.**
* Access tokens carry `sid`; once a session is revoked, its access token is refused immediately (one primary-key lookup per request). Tokens without `sid` (issued before this release) live out their 15 minutes.
* A password reset (`set_new_password`, `forgot/reset`) revokes all of that user's sessions. Deactivating a user closes their session on its next refresh. At most 20 open sessions per user (`SESSION_MAX_PER_USER`); the least recently used is revoked beyond that.
* Housekeeping deletes rows revoked/expired more than 7 days ago (every 6 h).
* Unchanged: no "log out of all devices" button exists; none was added.

## 5. Upload pipeline (what is true now)
Order for every multipart request: security headers → cookies/JSON parsers → CORS/Origin → `/api` rate limit → **authentication** → per-user upload-start rate limit → `Content-Length` limit → body parsing into the request's own temp directory → file-count check → route authorization/ownership.
* Missing, malformed, expired, wrong-secret, single-purpose or revoked-session tokens get 401/403 before a byte of the body is read; the connection is closed. Only `POST /api/auth/create_account` is anonymous (own rate limit, image-size limit).
* A token valid when the request starts is honoured for that whole request even if it expires during a long upload.
* Browsers can report a **network error instead of the 403** when the server closes a connection while the browser is still sending a very large body. The web app therefore renews the token before starting any upload with less than 120 s left.
* Limits (env, see `.env.example`): files per request 50, request bytes = file limit + 64 MB, upload starts 600/min/user, anonymous 20/h/address, per-file `UPLOAD_MAX_FILE_BYTES` (1 GiB).
* Temp files live in `backend/files/uploads/temp/req-<random>/` (one directory per request, removed when the response ends; 10 minutes later if the client vanished). `tmp-*` files and `req-*` directories older than 6 h are swept hourly. **The directory must be writable by the Node user and have free space ≥ the largest file in flight × concurrent uploads, plus the same again in `files/uploads/common` (the temp file is renamed, which only avoids a copy if both are on the same filesystem).**

### What recovery does and does not do
1. **Batch recovery** (implemented): the server remembers every file of a batch; after a refresh or reopening Chrome the banner lists them.
2. **File retry** (implemented): select the original files again; finished files are skipped, failed/pending ones are sent **from byte zero**.
3. **Byte-offset resume** (NOT implemented): a transfer cut in the middle starts over. The UI says so. JavaScript cannot keep running after Chrome kills a page; switching tabs does not cancel an upload, but closing it does.
Re-selection is matched by name + size + a fingerprint (SHA-256 of size, first and last 64 KiB). The server checks the fingerprint of the bytes it receives. It is not a whole-file hash: a change only in the middle of a file is not detected by it (the full SHA-256 of what was received is journaled).

### Crash safety
See the header of `backend/services/uploadJournal.js` for the step list. Summary: journal row (`stored_path`, `content_sha256`) → rename into `uploads/common` → ONE transaction (chapter row locked, entry appended, row `done`). A crash after the rename leaves an orphan that the same file's retry **adopts** (no second copy) or that `npm run uploads:reconcile -- --apply` (and an hourly job, 6 h grace) deletes — only if a journal row names it, no chapter lists it, and no finished row uses it. Files nobody journaled are never deleted. Unavoidable windows: a crash between the rename and the journal write being durable; deletion of a removed file happens after the database commit, so a crash then leaves an unreferenced file (not a dangling reference).
Chapter file entries from batches carry `upload_key: "b:<server row id>"`; file keys are unique per unit (DB unique index), so a reused key can never complete another batch's row.

### Editing and deleting files
`PUT /api/chapters` never deletes a file because it is missing from the form. It keeps the server's list, applies the form's ordering, appends new uploads and removes only paths named in `_removed_files`. `DELETE /api/chapters/:id/files {filepath}` removes one file of that unit. Both require access to the unit and only touch paths in that unit's list.

## 6. Database requirements
MySQL 8 / MariaDB 10.6+, InnoDB, utf8mb4. Chapter-file changes use `SELECT … FOR UPDATE` on the chapter row inside a transaction (deadlock/lock-wait retried), so two Node workers cannot overwrite each other, and other units are not blocked. **This behaviour has been verified only by generating the SQL and by SQLite tests; it has not been run against MySQL.** `innodb_lock_wait_timeout` (default 50 s) must exceed the longest registration (they take milliseconds).

## 7. Proxy / LiteSpeed / cPanel settings to check (unverified)
Request body limit ≥ `UPLOAD_MAX_REQUEST_BYTES` (≈1.1 GB default); request/idle timeout ≥ 60 min (the app sets Node's `requestTimeout` to 60 min); no buffering that fills a small `/tmp` (some proxies spool uploads); WebSocket upgrade for Socket.IO; `LimitRequestBody`/`client_max_body_size`-equivalents. The app cannot see these; test with a real 1 GB file through the real domain.

## 8. Diagnosing a failed upload
1. The batch banner / panel shows the per-file error (server text). 2. `GET /api/chapters/batches/<id>` shows each row's `status`, `error`, `attempts`. 3. `npm run uploads:reconcile` (report only) lists interrupted rows and orphans. 4. 413 = a limit above; 429 = upload-start rate limit (the client waits and retries); 401 "not assigned" = unit permission; 403 = session. 5. Check free disk in `files/uploads`, the temp directory, and the proxy log.
**Mismatched frontend/backend:** (a) backend too old: the `rt` returned by `POST /api/auth/login` does not start with `rs1.`, `DELETE /api/user/token/logout` still signs out other devices' sessions, and no `req-*` directory appears in `files/uploads/temp` during an upload. (b) web too old: after a stale edit form the removed-files field `_removed_files` is absent from the PUT request in the browser's network tab, and the page shows a plain login screen instead of "We could not reach the server" when the API is down. (c) A web build calling `/api/chapters/<id>/batches` against a pre-11-01b backend gets 404.

## 9. Smoke test after deployment
Sign in on two browsers → both stay signed in; log out on one → the other still works; create a unit with 24 videos, Submit once, switch tabs, refresh mid-way and finish via the banner; edit the unit title while another tab uploads → no file lost; sign in as an instructor without the course → 401; mobile app login/refresh/logout.

## 10. Rollback
* App code: restore the previous backend files and `dist/`. Old code ignores `RefreshSessions`; browsers and apps holding new-style `rs1.` tokens **will be signed out** (the old code only understands the old JWT). That is safe but visible.
* 0005/0006 and the new columns can stay (unused). 0003 should stay (see above).
* **Unsafe after new data exists:** dropping `RefreshSessions` (signs out those users), narrowing `chapter_files` back to TEXT (truncation), restoring a database backup taken before the release (loses everything written since: uploads registered, payments, sign-ups), deleting `uploads/common` files listed by `chapter_files`.
