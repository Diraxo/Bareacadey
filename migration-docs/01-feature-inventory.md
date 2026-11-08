# 01 — Feature Inventory (Phase 1, read-only inspection)

Legend: **V** = verified by reading the source in this pass · **I** = inferred from file/route names, not yet read in depth · **M** = missing/not in the supplied project.
Nothing here has been *executed* yet; "V" means the code was read, not that the feature was run.

## 0. Project layout

| Area | Stack | Notes |
|---|---|---|
| `backend/` | Node/Express 4, Sequelize 6, MySQL (`mysql2`), Socket.IO 4, passport-google-oauth20, sharp, fluent-ffmpeg | Entry `server.js` (1221 lines). Separate `hls-server.js` (port 5000) for video transcoding. |
| `frontend/` | React 18 + Vite 5, Redux Toolkit/RTK Query, react-router 6, hls.js/video.js/plyr, socket.io-client | Only backend URL source is `VITE_API_URL`. |
| `bare/` | Expo 52 / React Native 0.76, expo-router, RTK Query, nativewind, expo-video | Display name "Bare Academy". Has its own `.git` (1 commit). |
| `__MACOSX/` | macOS zip artifacts | Ignore; do not deploy. |

## 1. Backend API surface

Mount order in `server.js` matters: everything above `app.use(verifyJWT)` is **unauthenticated**.

### Unauthenticated (before `verifyJWT`) — V
| Route | Purpose |
|---|---|
| `POST /sync-database` | Runs `sequelize.sync({alter\|force})` for all or one model. **No auth.** (Security report S1) |
| `GET /auth/google`, `/auth/google/callback` | Google OAuth sign-in; issues refresh cookie `rt`, redirects to `FRONTEND_URL/auth/login` |
| `GET /uploads/hls-key/:filename` | HLS AES key delivery, CORS `*`, no auth |
| `GET /uploads/common/:filename`, `/uploads/common/thumbnails/:filename` | Media, gated only by `Referer` allow-list |
| `GET /api/open_public/verify-payment/:id` | Chapa payment callback → marks Payment paid |
| `/api/auth/*` | `login`, `verify_email`, `verify_new_device`, `reset_password`, `set_new_password`, `create_account` (mobile calls it; defined in AuthController) |
| `POST /api/user/token/reqtoken` | Refresh-token → new access token (cookie `rt` or body `token`) |
| `/api/public/*` | `services`, `faqs`, `landing_page_contents`, `dashboard`, `categories`, `courses/:id`, chapters, `trendings`, `corouselitems`, `verify-payment/:id` (duplicate of open_public), `get-currency`, `update-currency` (JWT, user id 1 only) |
| `/api/contacts_public` | **Same ContactController router** as the authenticated `/api/contacts` — needs per-route review (to verify) |
| `/` | "Welcome to System" |

### Authenticated (after `verifyJWT`; role checks via `verifyRoles(Roles.*)`) — V for mounting, I for per-route behaviour
`/api/dashboards`, `/api/user` (logout), `/api/users` (CRUD, `profile/update`, `delete-user-account`), `/api/roles`, `/api/activities`, `/api/notifications`, `/api/system_config`, `/api/chats`, `/api/chatuploads`, `/api/employeecategories`, `/api/employeepositions`, `/api/departments`, `/api/landingpagecontents`, `/api/services`, `/api/faqs`, `/api/mytasks`, `/api/contacts`, plus module routes from `modules/courses.js` (courses, chapters, categories, trendings, carousel items, user ratings, payments incl. `POST /` Chapa init and `POST /check_payment`, vehicles). `POST /api/pay` is an unfinished test endpoint (hard-coded buyer data; `axios` not imported there) — dead/broken.

### Socket.IO events — V (`server.js` 547-643)
`join`, `new_message`, `video-call`, `join room`, `offer`, `answer`, `ice-candidate`, `disconnect`, outbound `onlineUsers`, `other user`, `user joined`. **No authentication; `new_message` and `video-call` are broadcast to every connected socket.** Frontend connects with `transports:['websocket']` (needs WebSocket-capable hosting). Mobile app does not use Socket.IO (V: only a notifications slice references the word).

### Video pipeline — V
Upload → `files/uploads/common/` → `POST :5000/convert_to_hls` (hls-server) → worker (ffmpeg, AES-128) writes `files/uploads/videos/<name>/` with `successfully_converted` marker. Key at `files/uploads/hls-key/enc.key`; `enc.keyinfo` hard-codes `http://localhost:4000/uploads/hls-key/enc.key` (**must change for new domain**, and existing HLS output embeds that URL).

## 2. Data model (Sequelize) — V (file list), I (columns)
Models: Activity, Category, Chapter, Chat, ChatUpload, CommonUpload, Config, Contact, CorouselItem, Course, CustomField, Department, Device, EmployeeCategory, EmployeePosition, Faq, LandingPageContent, MyTask, Notification, Payment, Permission, PermissionCategory, Role, RolePermission, Service, Trending, User, UserPermission, UserRating, UserUpload, plus implicit join table `UserVisibleDepartments`.
Associations are declared in `server.js` and `modules/courses.js`. **Nothing calls `db.sync` or `runMigrations()` today** (both only inside commented-out blocks), so the schema is currently created only via the unauthenticated `/sync-database`. A fresh-DB bootstrap does not exist yet (Phase 3).

Seeds that exist (`backend/migrations/`): permission categories 1/2/11, permissions 1–17 (+ state permissions), roles Super Admin(1) / Viewer(5) / Instructor(12), device row. **The super-admin user row is only created in commented code with a hard-coded password** — a new admin-creation script is required.
`Config` rows 1–4 (email, upload, payment, settings incl. `usdToBirr`) are created by `MigrateConfigurations()` which is defined but never called; it contains a hard-coded SMTP host/user/password (S2).

## 3. Website (`frontend/`) — I (routes read, pages not yet opened)
Public: landing page (carousel, trending, categories, courses, FAQs, services), `courses`, course/chapter detail with HLS player, `contact-us`, `auth/login|register|reset|verify_email|device_verified` (+ "Sign in with Google").
Admin (`/admin/main/*`): users, roles/permissions, courses, chapters, categories, carousel/trending, landing-page customization, FAQs/services, departments/employee categories/positions, contacts, my tasks, activities, chat (Socket.IO + WebRTC video-call), cloud/files, settings (currency `usdToBirr`), email settings, profile update.
Payments on web: Chapa checkout (`POST /api/payments` → `checkout_url`; callback → `/api/open_public/verify-payment/`). Frontend env: `VITE_API_URL`, `VITE_FRONTEND_URL`, `VITE_PAYMENT_PUBLIC_KEY`.

## 4. Mobile app (`bare/`) — V where marked
| Feature | Source | Backend it talks to |
|---|---|---|
| Login / register / reset password / verify | `components/LoginModal.jsx`, `Register.jsx`, `redux/auth/authApiSlice.js` | Node `/api/auth/*` (V) |
| Token refresh, logout | `redux/app/api/apiSlice`, `authLogOutApiSlice.js` | Node `/api/user/token/reqtoken`, `/api/user/logout` (I) |
| Courses, chapters, books, downloads, ratings, categories, carousel, trending | `app/*.jsx`, `redux/main/*` | Node `/api/public/*`, `/api/courses` … (I) |
| Video playback / screen-capture protection | expo-video, expo-screen-capture | Node HLS/media (I) |
| Profile, delete account | `Profile.jsx` | `DELETE /api/users/delete-user-account` (V) |
| **Forced-update check** | `AllCourses.jsx:41` | **PHP** `GET api.joharacademy.com/version/` → `{app_version}` (V) |
| **Single-device enforcement** | `Drawer.jsx`, `LoginModal.jsx`, `authApiSlice.js:50` | **PHP** `GET /check/?device=&user_id=` (V call; response contract: see doc 02) |
| **Block-on-logout** | `components/Logout.jsx:22` | **PHP** `POST /block/` `{user_id}` (V) |
| **Quizzes** | `Quiz.jsx`, `FilteredQuiz.jsx`, `QuizDetails.jsx` | **PHP** `/quiz/*.php` (V) |
| **eBirr / Kaafi mobile payments** | `PaymentModal.jsx:234,285` | **PHP** `/mob/request/`, `/mob/requests/` (V) |
| Chapa/web-style payment in app | `PaymentModal.jsx`, `redux/main/paymentsApiSlice.js` | Node `/api/payments` (I) |

Mobile access gate: requests without an `Origin` must send header `x-react-native-app: <static UUID>` and a UA containing `rnafm` (`backend/middlewares/mobileCredentials.js`, V). Mobile `.env`: `API_URL`, `FRONTEND_URL`.

Stale duplicates in `bare/app/` (`* copy*.jsx`, `AllCourses_bak.jsx`, `Profile1.jsx`, `FlashlistTest.jsx`) still contain old URLs; they are not routes' targets but expo-router treats every file in `app/` as a route — **they are shipped as routes**. Also `app/ebirr.php` sits inside the app bundle directory (server code in client source).

## 5. Roles & permissions — V (seeds), I (enforcement)
Permission strings (e.g. "Add Users", "Instructor", "Viewer", "Customize Homepage", "Manage Categories", state permissions 300–321) are embedded in the JWT at login and checked by `verifyRoles(Roles.<x>)` (`backend/roles.js`). Super Admin = user id 1 in several places (hard-coded id checks).

## 6. Not yet inspected (to be done before Phase 3)
Per-controller business rules (Course/Chapter/Chat/Contact), `commonFileUploader` remaining 170 lines, `emailController`, frontend page-by-page behaviour, mobile `components/views`, `redux/app/api/apiSlice` (header injection), `bare/.git` history for committed secrets.
