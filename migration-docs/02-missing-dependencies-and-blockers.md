# 02 — Missing Dependencies & Blockers

## A. The legacy PHP service (`api.joharacademy.com`)

**Result of searching the whole supplied project:** exactly one PHP file exists — `bare/app/ebirr.php` (64 lines). It is the handler for the eBirr mobile payment (`/mob/request/`). Every other PHP endpoint is **absent**.

### Endpoints the mobile app calls, and what is known

| # | Endpoint (old host) | Called from | Request | Response the app expects | Source present? | Confidence in recreating |
|---|---|---|---|---|---|---|
| 1 | `GET /version/` | `AllCourses.jsx:41` | none | JSON `{ "app_version": <int build number> }`; app compares to its native build number and shows an update popup if lower | **No** | High (contract is fully visible; storage location of the number is a product decision) |
| 2 | `GET /check/?device=&user_id=` | `authApiSlice.js:50`, `Drawer.jsx:47,86`, `LoginModal.jsx:134` | device string, user id | Result consumed as `checkResult` — **exact fields not yet traced** (see TODO) | **No** | Medium — needs reading the 3 call sites |
| 3 | `POST /block/` `{user_id}` JSON | `Logout.jsx:22` | user id | Ignored (fire-and-forget). Semantics from the code comment in `authLogOutApiSlice.js`: sets `blocked=1` on logout so the account can only be used on one device until the academy re-activates it (support via WhatsApp) | **No** | Medium — data model (`User.blocked`) exists in Node; rule for who may unblock is unknown |
| 4 | `GET /quiz/get_quiz_categories.php` | `Quiz.jsx:17`, `Quiz copy*.jsx` | none | `{status?, data: [{id|category_id, category, quiz count…}]}` | **No** | Medium — shape partly visible, **no quiz tables exist in the Sequelize models**; schema is unknown |
| 5 | `GET /quiz/get_titles.php` | `Quiz.jsx:18` | none | `{data:[{title}]}` (grade titles) | **No** | Medium |
| 6 | `GET /quiz/get_quizzes.php?search=&category_id=` | `FilteredQuiz.jsx:13` | search, category_id | `{status:true, data:[{id|quiz_id, title, quiz_description}]}` | **No** | Medium |
| 7 | `GET /quiz/get_quiz_details.php?quiz_id=` | `QuizDetails.jsx:16,109` | quiz_id | `{status, quiz:{title, time…}, questions:[{id, title, correct_answer, answers:[{id,title}]}]}`. **Correct answers are sent to the client** | **No** | Medium |
| 8 | `GET /mob/request/?id=&phone=&amount=&course_id=` (eBirr) | `PaymentModal.jsx:234` | user id, phone (`0`+9 digits), amount, course id | JSON `{msg, desc}`; success iff `msg === "PAYMENT_SUCCESS"` | **Yes — `ebirr.php`** | See below |
| 9 | `GET /mob/requests/?id=&phone=&amount=&course_id=` (Kaafi) | `PaymentModal.jsx:285` | phone is `231438251`+9 digits | same `{msg, desc}` | **No** (presumed sibling of ebirr.php) | Low-Medium |
| 10 | `/v1/?token=…&phone=&amount=` | called *by* `ebirr.php` | — | `{msg, desc}` | **No** — this is the actual wallet-gateway wrapper | **Low — a blocker** |
| 11 | `/success/`, `/error/?msg=` | redirect targets in `ebirr.php` | — | browser landing pages | No | Trivial (not used by the app UI, which uses in-app modals) |

### What `ebirr.php` does (V, read in full)
1. Reads `phone`, `amount`, `id`, `course_id` from the query string (no authentication of any kind).
2. Calls the internal gateway wrapper `/v1/` with a static token to charge the phone.
3. If `msg == PAYMENT_SUCCESS`: inserts a row into a **`transactions`** table (`phoneNumber, amountPaid, paymentStatus, apiResponseMessage`) and into the **`Payments`** table (`amount, currency='ETB', phone_number, reference_no='txt_jx_course_<time><phone>', paid=1, sentToInstructor=0, added_by, updated_by, user_id, course_id, chapter_id=NULL`), connecting **directly to the Node app's MySQL database** with a hard-coded credential (S2).
4. Returns `{msg, desc}` JSON (after attempting a redirect header).

Consequences for migration:
- The `transactions` table is **not defined in any Sequelize model**, so a fresh DB built from Sequelize alone will lack it.
- The Node `Payment` model must remain column-compatible (`Payments` table) or the mobile payment grants will silently break.
- The real wallet integrations (eBirr, Kaafi) are behind `/v1/`, whose code, credentials, base URLs, and signing/auth scheme are **not in the project**.

### Blockers (cannot be resolved from the supplied files)
| ID | Blocker | Needed from academy |
|---|---|---|
| B1 | Source of `/v1/` gateway wrapper and Kaafi handler (`/mob/requests/`) | The PHP source from the old cPanel account (`public_html` of `api.` subdomain), **or** the official eBirr and Kaafi merchant API documentation + new merchant credentials |
| B2 | Quiz database schema and data (tables, content) | cPanel MySQL dump of the quiz tables, or confirmation that quizzes will be re-authored in the admin panel (academy said old DB contents are not needed — **confirm quizzes are included in that**) |
| B3 | Response of `/check/` and rules of `/block/` | Either old PHP source, or product confirmation of desired single-device rule |
| B4 | eBirr/Kaafi merchant credentials for the new domain / whether the merchant must whitelist the new server IP | Academy's merchant accounts |
| B5 | The numeric value for `/version/` and how it should be managed | Decision (recommend `Config` row editable by Super Admin) |

### Plan (after academy confirms B1–B5; **no mock responses**)
- Recreate #1, #3, #4-7, #11 as authenticated/validated Node routes under the new API, preserving the JSON shapes above so the **already-installed app keeps working** while an updated app moves to the new base URL.
- Recreate payments (#8/#9) **only** against real gateway documentation; amount must be taken from the course price server-side, never from the query string (S3), and writes must go through Sequelize (parameterised).
- Until B1/B4 are resolved, mobile eBirr/Kaafi payments are **BLOCKED**, not mocked. Chapa (web and in-app) is independent and unaffected.

### TODO (still to read before implementing)
- Trace `checkResult` consumers in `Drawer.jsx` and `LoginModal.jsx` to fix the `/check/` contract.
- Confirm whether `bare/app/request/` and `bare/app/tools/` directories contain more server-ish code.

## B. Other missing / external items

| Item | Status |
|---|---|
| New domain names | Placeholders: `<NEW_WEB_DOMAIN>` (the "bare…" domain), `<NEW_API_DOMAIN>`. Not invented. |
| Production credentials (DB, SMTP, Chapa, Google OAuth, JWT secrets) | Must be newly generated by the academy/ops. Existing ones are exposed (S2) and must be treated as compromised. |
| Google OAuth client | Redirect URI must be re-registered for the new API domain in Google Cloud Console. |
| Hosting provider + its documented capabilities | **Not named.** Deployment doc will be written to a requirements checklist (persistent Node, WebSocket, MySQL 8, native modules, ffmpeg, ≥ storage for video) and will not assume shared hosting. |
| Android keystore | Present in repo (`android_release.keystore` = `android_releases.keystore`, identical hashes). Its fingerprint must be compared with Play Console "App signing / Upload key" — **needs Play Console access (not available)**. |
| iOS signing | No Apple credentials in project. iOS bundle ID `com.joharacademy.lms` differs from Android package `com.johar_academy.lms`; whether iOS is published is unknown. |
| Existing app build number | `versionCode: 6`; Play Console current value unverified. |
