# 07 — Phase 3: decisions implemented, evidence, and what is still unverified

Test evidence for every claim below is in `backend/tests/` (`phase3-access`, `pricing`, `quiz-admin`, `secrets`, `media`, `database`). Numbers are in doc 08.

## 1. Device rule ("one registered device")

**What the existing app proves**
- On every login the mobile app calls `GET /check/?device=&user_id=`; any answer other than `success` stops the login (`LoginModal.jsx`, `Drawer.jsx`).
- The "denied" screen says *"You are logging in from an unregistered device. Contact support via WhatsApp"* and pre-fills a WhatsApp message to support.
- Sign-up stores the phone's device string for the account (`create_account` → `Device` row); the web login contains an e-mail "new device" confirmation flow that was already commented out.

**What cannot be proven:** the original PHP `/check/` is not in the source, so its exact rules (how many devices, any expiry) are unknown. "One registered device per account" is the intent the app's behaviour supports; it is an inference, kept configurable (`Config` row 5 → `device_policy.mode`: `single` | `off`).

**Implemented (safe replacement + recovery, nobody locked out for good)**
| Situation | What happens |
|---|---|
| First phone seen | Registered automatically. |
| Another phone | `/check/` answers `denied` with `code`, `can_self_replace` and, if waiting, `self_replace_available_at`. |
| Self-service | Signed-in user taps *Email me a link* (new button in the mobile login dialog) → `POST /device/replace/request` mails a single-purpose, 1-hour link to **the account's own address**; opening it (`/auth/device_verified`) replaces the registration. The link is bound to the registration state, so an old link cannot undo a later change. Rate-limited (5/hour). |
| Cooldown | After a (re)registration the next self-service swap is possible after `replaceCooldownDays` (default **7**). Phones registered at sign-up carry no cooldown. |
| Support | Admin page *Instructors & Devices → Reset device* (needs "Edit Users") clears the registration; recorded in Activities. |
| Kill switch | `device_policy.mode = "off"`. |

**Known risk to decide on:** the device string is `model-osBuildId-os-yearClass-manufacturer-brand`. `osBuildId` changes with some OS updates, so a legitimate student can suddenly look like a new phone. The recovery routes above cover it, but dropping `osBuildId` from the string in the app (a client change, not done) would remove the cause.

## 2. `POST /block/` on logout — stays disabled

**Evidence:** `Logout.jsx` fires `/block/` (fire-and-forget) on every logout, and the support message pre-written in `LoginModal.jsx` reads *"my user is blocked due to logout and login with another device please re activate it"*. So the original most likely blocked the account at logout until support reactivated it (an anti-sharing design). Not confirmed by server source.

**Why it stays off:** enabling it would lock every student out after every logout, and there is no reactivation tool for it. Current behaviour: requires a valid JWT, ignores any user id in the body, answers `ignored`, changes nothing (`device_policy.blockOnLogout` defaults to `false`; if ever enabled it can only act on the caller). Tested for every kind of caller. The app still calls it on logout; that is harmless.

## 3. Percentage discount

**Evidence:** the admin form field is "Discount Percentage"; web and mobile show a struck-through price next to the discounted price; the code charged `percentage × price / 100` (20 % of 1,000 → 200 Birr).

**Rule implemented:** `price − price × percentage / 100` (20 % off 1,000 → **800**), in one place on the server (`services/pricing.js`) and one shared file per client (`frontend/src/components/utils/coursePrice.js`, byte-identical to `bare/components/utils/coursePrice.js`; a test fails if they differ or disagree with the server). The server always recomputes the price at checkout.
- A percentage counts only if it is above 0 and below 100; otherwise the fixed `discounted_price` (unchanged behaviour) or the main price applies. Saving a course with a percentage outside 0–99.99 is rejected. A 100 % discount is not supported (use a free course).
- **Historical transactions:** a `Payment` stores the amount charged when it was created; verification compares Chapa's answer with that stored amount, never with a recomputed price (test: a payment recorded under the old formula still verifies for its recorded amount).
- **Data caution:** if you import old course rows, a `discount_percentage` that someone entered to mean "charge this percent" would now charge the opposite. The new database starts empty; review imported courses.
- Pending business confirmation: the instruction was to apply the conventional rule "if confirmed"; the label and UI are the confirmation I could find in the code. Please confirm with the academy before launch.

## 4. Instructor registration

| Before | Now |
|---|---|
| Choosing "Instructor" at public sign-up immediately granted permissions 12, 14, 15 (create/edit/delete **any** course, chapter, quiz; view all paid media). | Sign-up with role 12 creates a **student** plus a *pending request*. The sign-up message text is unchanged (the screens match it literally); a `note` field explains the pending state. |
| Any instructor could change any course. | An instructor manages only courses **assigned to them** (`CourseInstructor`), courses they created, or all courses with the new permission **"Manage All Courses"** (id 22, held by administrators). Applies to course edit/delete/publish, chapter create/edit/delete/publish/move, and paid-media access. Checked in the database on every call, so removing an assignment works at once. |
| — | Admin page *Instructors & Devices*: approve a request (**at least one existing course is required**), edit assignments, remove access. Admins cannot approve their own request. Every action is logged in Activities. |
| — | Quizzes: an instructor sees/edits only quizzes they created; shared categories/grade titles can be added by instructors but renamed/deleted only by administrators. |

Notes: the mobile app already hard-codes role 5 at registration. After approval the person must sign in again to receive the new permission; after removal the old token still says "Instructor" for up to 15 minutes, but every course/chapter/quiz action is refused immediately.

## 5. Quiz administration (web, "Quizzes" in the admin menu)

Create/edit/delete quizzes; add, edit, delete questions and answers individually (answer and question ids stay stable when editing, so a student mid-quiz is not disturbed); exactly one correct answer, 2–10 answers; categories; time and pass mark; publish/unpublish (a quiz needs at least one question to be published and cannot lose its last one while published); **bulk import** from JSON or CSV with a template download, a *Check file* dry-run (server validates, stores nothing) and all-or-nothing import (CSV imports arrive as drafts).
- Student-facing API (`/quiz/get_*.php`) is untouched; a test asserts its exact field names after a full edit cycle.
- **Scoring:** the shipped app scores on the device and never uploads results, so no historical or new results are stored. I added `POST /quiz/score` (same rules as `QuizDetails.jsx`: percent = round(correct/total×100), pass at `pass_mark` or 50 %) — stateless, not used by the current app. A test runs the app's own scoring logic against the API output and checks the server agrees in six scenarios.
- **Original quiz content is unavailable.** No quiz data, questions or answers exist anywhere in the supplied source or archives, and nothing was invented. The quiz tables start empty; content must be re-entered or imported from the academy's own backup if one exists.

## Behaviour changes to be aware of
- Authorization refusals added in this phase answer **401**, not 403 — both apps interpret 403 as "token expired" and would refresh the token or log the user out.
- Unassigned instructors no longer see other instructors' paid videos/PDFs (previously any holder of the Instructor permission did).
- Seed data gained permission id 22. Migration `0002` adds it, the approval tables and two device timestamp columns to an existing database without touching existing rows (tested on SQLite and MariaDB).
- Email template `new_device.html` still carries another product's name/logo ("Cellubooks"); the device e-mail will show it until the template is edited. SMTP delivery itself is unverified (no credentials).
