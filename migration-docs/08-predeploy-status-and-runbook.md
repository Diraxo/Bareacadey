# 08 — Pre-deployment status and runbook

**Verdict: not ready to deploy yet.** The code paths below were exercised and pass, but production hosting, live payment, e-mail delivery, Google sign-in and a real phone have not been verified (see "Not verified"). Nothing was deployed, published, or sent to any external service.

## What was actually run, and the result

| Check | Result |
|---|---|
| Full test suite, SQLite (in-memory) | **17 suites, 327 tests, all passed** |
| Full test suite, **real MariaDB 10.11.9** (`TEST_DB_DIALECT=mysql`, throw-away database `johar_test`, local only) | **17 suites, 327 tests, all passed** (the same suites, including upgrade, uploads, sockets and Amharic-text round trip) |
| Fresh database: `npm run db:init` on empty MariaDB, second run refused, `npm run admin:create` makes user 1 (Super Admin, all 22 permissions), a second admin is refused | passed (manual run + `cli`/`database` tests) |
| Upgrade of an existing database (migration `0002`) on SQLite **and** MariaDB, existing rows kept | passed (`database.test.js`) |
| **Live end-to-end run** — real `node server.js` in `NODE_ENV=production` against MariaDB: health check, sign-up + login, admin login, quiz create/publish/fetch/score, device rule (register, deny, cooldown, admin reset, e-mail route says "try later"), `/block/` inert | 24 of 24 checks passed (the script writes test users and a test course into the database it runs against, so it is deliberately not shipped in the project) |
| **Real encrypted video**: ffmpeg produced an AES-128 HLS stream; server refused anonymous and non-paying users for playlist and every segment, gave them to the buyer and the administrator, handed the key only to signed-in users, never served `enc.keyinfo`; the segments fetched through the server decrypted and decoded with zero errors using the served key, and failed with a different key | passed (part of the 24) |
| Web build: `vite build` of `frontend/` | succeeded (new chunks `Quizzes`, `Instructors` present). Warnings only about chunk sizes. |
| Mobile: `expo export --platform android` (Metro bundles and compiles the whole app to Hermes bytecode, 6.5 MB) | succeeded |
| Mobile native debug build (`expo prebuild` + `gradlew assembleDebug` in a **copy** of the app that excludes the keystores and `credentials.json`) | **NOT completed.** `expo prebuild` worked. `gradlew assembleDebug` failed after 30 min because Gradle could not download Maven dependencies (a network error on this machine, not a code error). A second attempt was cut off when the session ended. The Android native build therefore remains **unverified**; only the JS bundle above is proven. Run `eas build` or Gradle on your own machine before release. |
| Secrets: old credentials and old HLS key refused at start-up (checked against the real old `.env` and the real old `enc.key`) | passed |
| `npm run predeploy:check` on the release bundle | passed (`OK`); on the working folders it correctly lists the `.env` files, keystores, `credentials.json` and macOS junk that must not ship |

## Covered by automated tests (all green on both databases)
Authentication and refresh; payment initialisation and Chapa verification (status, tx_ref, currency, amount, owner, idempotence — with Chapa **mocked**); discount maths and historical payments; chat/Socket.IO handshake and room permissions; media and HLS key authorisation; upload allow-list/size/magic bytes; device policy; instructor approval and privilege-escalation attempts; quiz authorisation, editing, import and scoring; configuration, rate limits, CLI tools.

## Not verified (do not claim these work)
- **Hosting.** Whether the planned plan can run a persistent Node ≥ 18 process, WebSockets, ffmpeg and MySQL — see doc 06. Not tested on any host.
- **Real Chapa** (sandbox or live), **SMTP** (device/verify/reset e-mails; the template still says "Cellubooks"), **Google sign-in** — no credentials were used. Only mocks.
- **Linux MySQL.** The tests ran on MariaDB for Windows, which folds table names to lower case. The code uses model-defined names consistently (including the two raw SQL fragments), so case-sensitive Linux should behave the same, but it was not run there. Also create the database with `utf8mb4` (Amharic text was verified round-tripping only on a utf8mb4 database).
- **MySQL 8 itself** (only MariaDB 10.11 was available). The Sequelize/mysql2 stack is the same.
- **A real phone**: no APK was installed or run; HLS playback inside `expo-video` and the "Email me a link" button were not exercised on a device. The full Android native build status is in the table above.
- **Browser behaviour** of the new admin screens (Quizzes, Instructors & Devices) — they compile and call tested endpoints, but nobody clicked through them in a browser.
- Load, backups/restore, TLS/reverse proxy, WebSocket upgrade through the host's proxy.

## Credentials: what was done and what only you can do
Done in code/tools:
- `config/revoked-secrets.json` holds salted fingerprints (hashes, not values) of every credential found in the old files: JWT access/refresh secrets, SMTP password, Chapa key, the database password and gateway token hard-coded in `ebirr.php`, the password hard-coded in the old mailer, and the old HLS key. In production the server **refuses to start** if any of them is used (or if the old `enc.key` is present). Add more with `npm run secrets:revoke -- <old .env>`.
- New JWT/session/media secrets: `npm run secrets:generate` (prints, writes nothing). A fresh database has no sessions, and tokens signed with the old secrets are rejected because the secrets differ, so **old credentials cannot be used against the new installation**.
- The old `enc.key` / `enc.keyinfo` were deleted from the working folder (the original archive still has them). `npm run media:keyinfo` creates a new key on the server and replaces any exposed one automatically. **No encoded videos existed**, so nothing is lost.
- `npm run release:make` builds a bundle without `.env`, keystores, credentials, keys, logs, tests, uploads, `node_modules`; and fails if the check finds anything forbidden.

Only you can do (these live in third-party accounts):
1. New database user/password (do not reuse the one from `ebirr.php`).
2. New SMTP password, new Chapa **secret** key (and update the public key in `frontend/.env`), new Google OAuth client secret, new `BACKUP_PASSWORD` (the old one was 4 characters, too short for the fingerprint list, so it is not checked: simply do not reuse it).
3. Treat the old values as compromised until rotated — they were in files and archives that were shared.

## Android signing — untouched on purpose
`app.json` (package `com.johar_academy.lms`, versionCode 6), `eas.json`, both keystores and `credentials.json` are byte-identical to the originals. Do not replace the key or the application id unless the Play Console confirms the upload key is lost. `credentials.json` contains the key passwords in clear text next to the keystores: move both out of any folder you zip, share or commit (store them offline/in a password manager), and use EAS credentials or a local, git-ignored file. Because the signing passwords were shared, consider asking Google Play to reset the upload key (Play Console → App signing) — that is your decision. Release builds must be made from your own machine/EAS with those credentials; the debug build above used a throw-away debug key.

## Runbook (after hosting is confirmed)
1. **Database:** `CREATE DATABASE johar CHARACTER SET utf8mb4;` plus a dedicated user with rights on it only.
2. **Server:** unpack the `release:make` bundle; `cd backend && npm ci --omit=dev`; create `.env` from `.env.example` with values from `npm run secrets:generate` and the new third-party credentials (`NODE_ENV=production`, https URLs).
3. `npm run db:init` (creates schema, permissions, roles, settings; refuses a non-empty database) → `ADMIN_PASSWORD='…' npm run admin:create -- --email you@…` (≥ 12 chars; only works while no user exists).
4. `npm run media:keyinfo` (new HLS key + key-info file). Only now upload/process videos. Back the key file up privately: losing it makes every encoded video unplayable.
5. Run under pm2/systemd behind HTTPS with WebSocket upgrade. `npm run predeploy:check` must say `OK` on the server directory (it will list `.env` and the key, which is expected there — check that nothing else shows).
6. Web: build with `VITE_API_URL` of the new API; deploy `web/` from the bundle.
7. Mobile: set `API_URL` to the new API and build with EAS/Gradle using your existing signing credentials; raise `app_version` (Config row 5) after publishing.
8. Settings an administrator must make in the app: USD rate (`usdToBirr`), SMTP row, optionally `device_policy`.
9. Smoke test on the real host: `/healthz`, login, one Chapa **sandbox** purchase (including the discount case), a paid video on a phone, chat between two staff accounts, an instructor approval, a quiz import.
