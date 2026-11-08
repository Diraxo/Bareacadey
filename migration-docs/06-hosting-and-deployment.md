# 06 — Hosting assessment and deployment outline

## Yegara Premium (ETB 6,800/yr): NOT verified suitable
Public pages ([yegara.com](https://yegara.com), [whtop listing](https://www.whtop.com/plans/yegara.com/84628)) show cPanel shared hosting with SSH, "unlimited" NVMe/bandwidth, LiteSpeed and PHP. They say **nothing** about Node.js, persistent processes, WebSockets, MySQL limits, ffmpeg/native modules, or CPU/RAM/process/inode limits. VPS plans are linked but not priced. Do not buy on the assumption it works.

What this app needs: a persistent Node >= 18 process; WebSocket upgrade through the web server; MySQL 8 / MariaDB 10.6+; native modules (`bcrypt`, `sharp`) and ffmpeg if videos are transcoded; HTTPS for API and site; large video storage with HTTP Range support; the ability to run `npm run db:init`.

Ask Yegara (0960 17 17 17 / Telegram), in writing:
1. cPanel "Setup Node.js App" with Node 18/20+?
2. Are WebSockets proxied?
3. Process/memory limits, and is long-running ffmpeg allowed?
4. MySQL version and CLI access?
5. Can native npm modules compile?
6. Real disk and inode quota for video?
7. VPS plan specs and ETB price.

If 1–3 is "no", a VPS is required. The extra cost is unknown until Yegara quotes it.

## Deploy outline (after hosting is confirmed)
1. Provision the DB; fill `backend/.env` from `.env.example` with NEW secrets.
2. `npm ci --omit=dev`, then `npm run db:init`, then `ADMIN_PASSWORD=... npm run admin:create -- --email you@example.org`.
3. `npm run media:keyinfo` (only if using HLS). Run `node server` under a supervisor (pm2/systemd) behind an HTTPS reverse proxy with WebSocket upgrade.
4. Build the web app with `VITE_API_URL` set; build the mobile app with `API_URL` set (EAS, after your approval).
5. Register the new `.../auth/google/callback` URI in Google Cloud.
6. Smoke test: `/healthz`, login, a Chapa sandbox purchase, a paid video, chat between two staff accounts.
