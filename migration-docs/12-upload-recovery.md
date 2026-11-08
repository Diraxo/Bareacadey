> **Superseded by `13-final-uploads-and-sessions-2026-11-01c.md`.** Migration 0003 is described there correctly: it is an `ALTER TABLE`, not a harmless addition, and the statement "everything is additive" below is wrong for it.

# 12 — Unit upload recovery (2026-11-01b) — NOT DEPLOYED

## Package (built, not deployed)
- `release/backend-update-2026-11-01b.tar.gz` — cumulative (includes everything in `backend-update-2026-11-01a`): app.js, server.js, config/index.js, controllers/ChapterController.js, controllers/ChapterUploadBatches.js (new), middlewares/commonFileUploader.js, middlewares/verifyJWT.js, models/Chapter.js, models/UploadBatch.js (new), models/index.js, routes/mobileCompat.js, services/chapterFiles.js (new), services/tempCleanup.js, db/migrations/0003_*.js, db/migrations/0004_upload_batches.js (new).
- `release/web-only-2026-11-01b.tar.gz` — `dist/` built from `frontend/`.
- The web build and the backend update MUST go live together (the new web app calls `/api/chapters/:id/batches`).

## Migration 0004
Creates two NEW tables, `UploadBatches` and `UploadBatchFiles`. Nothing existing is altered or rewritten. Re-running is harmless (`CREATE TABLE IF NOT EXISTS`). 0003 (Chapters.chapter_files -> MEDIUMTEXT, widening only) is still required. Not run against production.

## Rollback
Everything is additive. Restore the previous backend files and previous `dist/`; the two new tables can stay (unused). The `Chapters` data is never rewritten by the new code except the same `chapter_files` appends the old code did. A database backup before running migrations is still the safe precaution.

## Not verified (needs the real host)
LiteSpeed/proxy request timeout and body limit, free disk in `files/uploads/temp`, process restarts, MySQL connection limits.
