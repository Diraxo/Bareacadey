# 10 — Remaining checks and safe cutover

Goal: confirm the new hosting before paying, and move students without interrupting the current service.

## A. Hosting: prove it before paying
The tool is `backend/scripts/host-probe.js` (no dependencies; changes nothing; its own self-test passes on this PC).

**Step 1 — ask the provider (in writing).** Questions are in doc 06. If the plan is cPanel *shared* hosting, a "no" or no answer to any of these means it cannot run this app: persistent Node ≥ 18 process, WebSocket proxying, long-running ffmpeg, MySQL 8 / MariaDB 10.6+, enough disk and inodes for video.

**Step 2 — test on the real plan.** Ask for a trial, a refund window, or a monthly (not yearly) first payment. Then:

| Where | Command | What it proves |
|---|---|---|
| On the host (SSH or cPanel terminal) | `cd backend && npm ci --omit=dev` | native modules `bcrypt` and `sharp` compile or install |
| On the host | `DB_HOST=… DB_USER=… DB_PASSWORD=… DB_NAME=… node scripts/host-probe.js local` | Node version, RAM, disk, ffmpeg encrypted-HLS encode speed, MySQL version, utf8mb4, Amharic text round trip |
| On the host | `node scripts/host-probe.js serve <the port the host assigns>` (leave it running) | starts the test endpoints behind the host's real proxy |
| Any other computer | `node scripts/host-probe.js client https://<the real domain> --idle 90` | HTTPS, HTTP Range (video seeking), WebSocket upgrade, WebSocket idle for 90 s, a 70 s response not cut by a proxy timeout |

Decision rule: every `FAIL` is a blocker; `WARN` lines are for you to judge (e.g. disk quota). The ffmpeg line gives an estimate of encoding time for a one-hour lesson; if it is many times the lesson length, processing needs a stronger plan or must happen on another machine.

Also confirm with the provider (the probe cannot see these): daily backups and how to restore, whether a process manager keeps Node running after reboot or crash, and the cost of the plan *that passed* (not the shared one).

## B. Android native build
Status and evidence: see the section "Result" at the end of this file. Release build still needs your own machine/EAS with your existing keystore (never in a shared folder).

Still needs a person with a phone:
1. Install the APK on a real Android phone pointed at a **test** API (`API_URL`), log in, buy one course with Chapa **sandbox**, play an encrypted lesson (HLS in `expo-video`), try the "Email me a link" button.
2. Click through the admin screens Quizzes and Instructors & Devices in a browser.

## C. Items that need your accounts (cannot be done from here)
New database user; new SMTP password (and replace the "Cellubooks" e-mail template text); new Chapa secret + public key; new Google OAuth secret and the new callback URI; new `BACKUP_PASSWORD`. Then Chapa sandbox purchase including the discount case, and a real e-mail to confirm SMTP.

## D. Cutover without disrupting the existing service
1. Keep the old system untouched and running. Do not change its DNS yet.
2. Deploy the new system on a **separate address** (e.g. `new-api.…`/`staging.…`), with its own empty database. Run the runbook in doc 08 and the smoke test there.
3. Migrate data **only if** students/payments from the old system must carry over: doc 04 describes contracts; export a copy of the old database and rehearse the import on staging — never against the old database.
4. Pilot: build the Android app with the new `API_URL` as an internal test (EAS `internal` distribution) and give it to 3–5 staff/students for a week; compare against the old service.
5. Lower the DNS TTL a day before the switch. Announce a maintenance window outside class hours. Switch, run the smoke test (`/healthz`, login, purchase, video, chat), watch logs.
6. Rollback: point DNS back to the old host; keep the old system running and paid until the new one has run a full billing/class cycle. Publish the mobile update (raise `app_version`) only after the web side is stable, since installed apps keep the old API URL until updated.
7. Take a database backup and a copy of the HLS key file (`media:keyinfo`) before the first real video upload; losing that key makes every encoded video unplayable.

## Not covered here
Load testing (how many students watch at once), restore drills, TLS renewal. Run a short load test on the chosen plan before the first live exam day.

## Result of the Android native build attempt (2026-10-29)
- `expo prebuild --platform android` on a sanitized copy (no keystores, no `credentials.json`): **succeeded**.
- `gradlew assembleDebug`, attempt 1: failed after 3m43s, "Could not parse module metadata ... kotlinx-coroutines-android-1.6.1.module: Unterminated string" — a truncated download from Maven Central (a fresh copy of the file is valid JSON). Not a code error.
- Attempt 2: went silent for 10+ minutes at "Configure project :react-native-reanimated" (the same stall as the earlier 30-minute failure). Treated as an unreliable connection from this PC to the Maven repositories, **not** proven to be a code error. **The native build is still unverified.**
- Next: run `eas build -p android --profile preview` (cloud, uses your Expo account and the local credentials you choose to upload), or retry Gradle from a different network (`gradlew assembleDebug --no-daemon`) with the SDK in `ANDROID_HOME`.
