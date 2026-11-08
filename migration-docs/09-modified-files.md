# 09 — Files changed compared with the original archives

Baselines (untouched, read-only, checksums in `SHA256SUMS.txt`): `Downloads/Johar-Academy-ORIGINAL-untouched/` → `Johar Academy (frontend + backend.zip` (backend + frontend, 15 Sep) and `bare.zip` (mobile app).
Listing produced by hashing every file against those archives (excluding `node_modules`, build output, `.DS_Store`/`._*`). **Phase** is inferred from file timestamps: **3** = touched in this phase, **2** = changed in the earlier phase and not since. Paths are relative to the project folder.

Deliberately **unchanged** (verified byte-for-byte against the original): `bare/app.json` (package id `com.johar_academy.lms`, versionCode 6), `bare/eas.json`, `bare/package.json`, `bare/yarn.lock`, `bare/credentials.json`, `bare/android_release.keystore`, `bare/android_releases.keystore`.

Not source, produced while verifying (safe to delete, never ship): `frontend/dist/` (web build), `bare/node_modules/` (installed to build the app), `release/` (output of `npm run release:make`).

## Modified (64)

| Phase | File |
|---|---|
| 2 | `backend/.gitignore` |
| 3 | `backend/controllers/ChapterController.js` |
| 2 | `backend/controllers/ChatController.js` |
| 2 | `backend/controllers/ChatUploadController.js` |
| 2 | `backend/controllers/ContactController.js` |
| 3 | `backend/controllers/CourseController.js` |
| 2 | `backend/controllers/MyTaskController.js` |
| 2 | `backend/controllers/NotificationController.js` |
| 2 | `backend/controllers/PaymentController.js` |
| 2 | `backend/controllers/UserController.js` |
| 3 | `backend/controllers/auth/AuthController.js` |
| 2 | `backend/controllers/auth/LogoutController.js` |
| 2 | `backend/controllers/auth/RefreshTokenController.js` |
| 2 | `backend/controllers/common/DashboardController.js` |
| 2 | `backend/controllers/common/OpenPublicController.js` |
| 2 | `backend/controllers/common/PublicController.js` |
| 2 | `backend/controllers/common/SystemConfigController.js` |
| 3 | `backend/database.js` |
| 2 | `backend/hls-server.js` |
| 2 | `backend/middlewares/commonFileUploader.js` |
| 2 | `backend/middlewares/credentials.js` |
| 2 | `backend/middlewares/emailController.js` |
| 2 | `backend/middlewares/errorHandler.js` |
| 2 | `backend/middlewares/mobileCredentials.js` |
| 2 | `backend/middlewares/verifyJWT.js` |
| 2 | `backend/middlewares/verifyJWTPublic.js` |
| 3 | `backend/models/Course.js` |
| 3 | `backend/models/Device.js` |
| 3 | `backend/package.json` |
| 2 | `backend/roles.js` |
| 2 | `backend/server.js` |
| 2 | `frontend/.gitignore` |
| 3 | `frontend/src/app/api/apiSlice.js` |
| 3 | `frontend/src/components/landing_page/templates/ecommerce/CoursesFrontend.jsx` |
| 3 | `frontend/src/components/landing_page/templates/ecommerce/PaymentModal.jsx` |
| 2 | `frontend/src/components/landing_page/templates/ecommerce/VideoPlayer.jsx` |
| 3 | `frontend/src/components/login/Register.jsx` |
| 2 | `frontend/src/components/utils/CrudComponents/FilePreview.jsx` |
| 2 | `frontend/src/components/utils/CrudComponents/FilePreview1.jsx` |
| 2 | `frontend/src/components/utils/DocumentViewer.jsx` |
| 3 | `frontend/src/main.jsx` |
| 3 | `frontend/src/navigation/vertical/index.js` |
| 2 | `bare/.gitignore` |
| 3 | `bare/app/AllBooks.jsx` |
| 3 | `bare/app/AllCourses.jsx` |
| 2 | `bare/app/CourseDetail.jsx` |
| 3 | `bare/app/CoursesFrontend.jsx` |
| 2 | `bare/app/FilteredQuiz.jsx` |
| 2 | `bare/app/HomeCorousel.jsx` |
| 3 | `bare/app/PaymentModal.jsx` |
| 2 | `bare/app/Quiz.jsx` |
| 2 | `bare/app/QuizDetails.jsx` |
| 2 | `bare/app/_layout.jsx` |
| 3 | `bare/components/LoginModal.jsx` |
| 2 | `bare/components/Logout.jsx` |
| 2 | `bare/components/utils/DocumentViewer.jsx` |
| 2 | `bare/components/utils/DownloadManager.jsx` |
| 2 | `bare/components/utils/Inputs/AvatarImagePicker.jsx` |
| 2 | `bare/components/utils/RecordLogs/RecordRatings.jsx` |
| 2 | `bare/components/utils/overlays/Image.jsx` |
| 2 | `bare/components/utils/video/VideoPlayer.jsx` |
| 2 | `bare/components/utils/video/VideoPlayerUpdated.jsx` |
| 2 | `bare/redux/app/api/apiSlice.js` |
| 3 | `bare/redux/auth/authApiSlice.js` |

## Added (95)

| Phase | File |
|---|---|
| 2 | `backend/.env.example` |
| 3 | `backend/app.js` |
| 3 | `backend/config/index.js` |
| 2 | `backend/config/loadEnv.js` |
| 3 | `backend/config/revoked-secrets.json` |
| 3 | `backend/controllers/DeviceController.js` |
| 3 | `backend/controllers/InstructorController.js` |
| 3 | `backend/controllers/QuizController.js` |
| 2 | `backend/db/migrate.js` |
| 2 | `backend/db/migrations/0001_baseline.js` |
| 3 | `backend/db/migrations/0002_instructor_approval_and_device_recovery.js` |
| 2 | `backend/db/seeds/config.js` |
| 2 | `backend/db/seeds/index.js` |
| 3 | `backend/db/seeds/permissions.js` |
| 2 | `backend/db/seeds/roles.js` |
| 2 | `backend/middlewares/profileUpload.js` |
| 2 | `backend/middlewares/rateLimit.js` |
| 2 | `backend/middlewares/safeUpload.js` |
| 2 | `backend/middlewares/tokenHash.js` |
| 3 | `backend/models/CourseInstructor.js` |
| 3 | `backend/models/InstructorRequest.js` |
| 2 | `backend/models/Quiz.js` |
| 2 | `backend/models/QuizAnswer.js` |
| 2 | `backend/models/QuizCategory.js` |
| 2 | `backend/models/QuizQuestion.js` |
| 2 | `backend/models/QuizTitle.js` |
| 3 | `backend/models/index.js` |
| 2 | `backend/package-lock.json` |
| 2 | `backend/realtime/socket.js` |
| 2 | `backend/routes/media.js` |
| 3 | `backend/routes/mobileCompat.js` |
| 2 | `backend/scripts/create-admin.js` |
| 2 | `backend/scripts/db-init.js` |
| 2 | `backend/scripts/db-migrate.js` |
| 3 | `backend/scripts/generate-secrets.js` |
| 3 | `backend/scripts/make-hls-keyinfo.js` |
| 3 | `backend/scripts/make-release.js` |
| 3 | `backend/scripts/predeploy-check.js` |
| 3 | `backend/scripts/revoke-secrets.js` |
| 2 | `backend/services/adminSetup.js` |
| 3 | `backend/services/appConfig.js` |
| 2 | `backend/services/chapa.js` |
| 3 | `backend/services/courseAccess.js` |
| 3 | `backend/services/devices.js` |
| 3 | `backend/services/mediaAccess.js` |
| 3 | `backend/services/pricing.js` |
| 3 | `backend/services/quizScoring.js` |
| 3 | `backend/services/revokedSecrets.js` |
| 2 | `backend/services/sqlLike.js` |
| 2 | `backend/tests/auth.test.js` |
| 3 | `backend/tests/authorization.test.js` |
| 3 | `backend/tests/cli.test.js` |
| 2 | `backend/tests/config.test.js` |
| 3 | `backend/tests/database.test.js` |
| 3 | `backend/tests/globalTeardown.js` |
| 3 | `backend/tests/helpers.js` |
| 3 | `backend/tests/media.test.js` |
| 2 | `backend/tests/mobile-compat.test.js` |
| 2 | `backend/tests/payments.test.js` |
| 3 | `backend/tests/phase3-access.test.js` |
| 3 | `backend/tests/pricing.test.js` |
| 3 | `backend/tests/pricingClientCopies.js` |
| 3 | `backend/tests/quiz-admin.test.js` |
| 3 | `backend/tests/quiz-import-client.test.js` |
| 2 | `backend/tests/ratelimit.test.js` |
| 3 | `backend/tests/secrets.test.js` |
| 2 | `backend/tests/setup.js` |
| 2 | `backend/tests/smoke.test.js` |
| 2 | `backend/tests/socket.test.js` |
| 2 | `backend/tests/uploads.test.js` |
| 2 | `frontend/.env.example` |
| 2 | `frontend/package-lock.json` |
| 3 | `frontend/src/components/admin/Instructors/Instructors.jsx` |
| 3 | `frontend/src/components/admin/Quizzes/QuizEditor.jsx` |
| 3 | `frontend/src/components/admin/Quizzes/QuizImportDialog.jsx` |
| 3 | `frontend/src/components/admin/Quizzes/Quizzes.jsx` |
| 3 | `frontend/src/components/admin/Quizzes/quizImport.js` |
| 3 | `frontend/src/components/utils/coursePrice.js` |
| 3 | `frontend/src/features/instructors/instructorApiSlice.js` |
| 3 | `frontend/src/features/quizzes/quizApiSlice.js` |
| 2 | `frontend/src/utils/media.js` |
| 2 | `bare/.env.example` |
| 2 | `bare/_archive_unused/AllCourses copy.jsx` |
| 2 | `bare/_archive_unused/AllCourses_bak.jsx` |
| 2 | `bare/_archive_unused/FilteredQuiz copy.jsx` |
| 2 | `bare/_archive_unused/FlashlistTest.jsx` |
| 2 | `bare/_archive_unused/PaymentModal copy 2.jsx` |
| 2 | `bare/_archive_unused/PaymentModal copy.jsx` |
| 2 | `bare/_archive_unused/Profile copy.jsx` |
| 2 | `bare/_archive_unused/Profile1.jsx` |
| 2 | `bare/_archive_unused/Quiz copy 2.jsx` |
| 2 | `bare/_archive_unused/Quiz copy.jsx` |
| 2 | `bare/_archive_unused/QuizDetails copy.jsx` |
| 3 | `bare/components/utils/coursePrice.js` |
| 2 | `bare/constants/media.js` |

## Removed (present in the original, gone now) (18)

| Phase | File |
|---|---|
| 2 | `backend/files/uploads/hls-key/enc.key` |
| 2 | `backend/files/uploads/hls-key/enc.keyinfo` |
| 2 | `backend/migrations/index.js` |
| 2 | `backend/migrations/main-permissions.js` |
| 2 | `backend/migrations/state-permissions.js` |
| 2 | `backend/migrations/system-roles.js` |
| 2 | `bare/app/AllCourses copy.jsx` |
| 2 | `bare/app/AllCourses_bak.jsx` |
| 2 | `bare/app/FilteredQuiz copy.jsx` |
| 2 | `bare/app/FlashlistTest.jsx` |
| 2 | `bare/app/PaymentModal copy 2.jsx` |
| 2 | `bare/app/PaymentModal copy.jsx` |
| 2 | `bare/app/Profile copy.jsx` |
| 2 | `bare/app/Profile1.jsx` |
| 2 | `bare/app/Quiz copy 2.jsx` |
| 2 | `bare/app/Quiz copy.jsx` |
| 2 | `bare/app/QuizDetails copy.jsx` |
| 2 | `bare/app/ebirr.php` |

## Notes
- `backend/.env`, `frontend/.env`, `bare/.env` and the keystores are **still in your working folders** (they are your inputs) but are excluded from the release bundle by `npm run release:make`; see doc 08.
- `bare/.git` is a stale repository with one early commit; nothing was committed or changed in it.
- Removed mobile files are stale duplicates (`* copy.jsx`, `*_bak.jsx`, `Profile1.jsx`, ...) moved to `bare/_archive_unused/`, plus `app/ebirr.php`, the retired payment script that contained database credentials.
