# 04 — Rebuilt PHP endpoints: contracts, evidence, open decisions (Phase 2)

> **Phase 3 update:** D1 (device rule) and D2 (`/block/`) were decided and extended in [doc 07](07-phase3-decisions-and-changes.md): the single-device rule is kept with an e-mail swap + support reset, and `/block/` stays disabled. The quiz admin screen mentioned at the end now exists, and `POST /quiz/score` was added.

All routes live in the Node backend (`backend/routes/mobileCompat.js`, `backend/controllers/QuizController.js`). Contracts were read from the mobile source; nothing was invented.

| Endpoint | Contract (source) | Implemented behaviour | Unknown / decision needed |
|---|---|---|---|
| `GET /version/` | `{app_version:int}`; the app shows an update popup if its build < value (`AllCourses.jsx`) | Reads Config row 5. Default `1` (never prompts). | Admin must raise it when a new build ships (`PUT /api/system_config`, id 5). Play Console's current versionCode is unverified (app.json says 6). |
| `GET /check/?device=&user_id=` | `{status:'success'\|'denied'}`; anything else logs the user out (`Drawer.jsx`, `LoginModal.jsx`) | **Now requires the JWT**; `user_id` must equal the caller. Blocked/inactive -> denied. Policy `single`: the first device seen is registered, a different device is denied (sign-up already stores the device in `create_account`). Policy `off` disables it (Config row 5). | **D1:** the original rule is unrecoverable. "Single registered device" is inferred from the app's "unregistered device, contact support" text. Confirm it, or switch to `off`. (Phase 3: the admin reset and the e-mail swap now exist.) |
| `POST /block/ {user_id}` | Fire-and-forget on logout | Requires the JWT, ignores the body id. **Does nothing by default.** `blockOnLogout:true` sets `blocked` on the caller. | **D2:** original semantics unknown; blocking on every logout would lock students out, so it is off. |
| `GET /quiz/get_quiz_categories.php` | `{status:true,data:[{id,category,image,total_quizzes}]}` | Same. | — |
| `GET /quiz/get_titles.php` | `{status:true,data:[{title}]}` ("All Grades" selector, sent back as `search`) | Same (+`id`). | That titles are grades is inferred. |
| `GET /quiz/get_quizzes.php?search&year&category_id` | `{status:true,data:[{id,title,year,diff_level,max_questions,quiz_description}]}`; year `all` = no filter | Same; `search` = title contains text; published quizzes only. | The original match rule (exact vs contains, which column) is unknown. |
| `GET /quiz/get_quiz_details.php?quiz_id=` | `{status,quiz:{title,year,diff_level,max_questions,time(s),pass_mark(%)},questions:[{id,title,explanation,answers:[{id,title}],correct_answer:<answer id>}]}` | Same. `correct_answer` is sent because the shipped app grades on the device. | — |

Facts established about quizzes: the app never posts results, so **there were no server-side historical results to recover**. Grading is client-side; defaults are 30 s/question and a 50 % pass mark.

Quiz content: tables `QuizCategories, QuizTitles, Quizzes, QuizQuestions, QuizAnswers` are created empty. Teachers (Instructor permission) manage them through `/api/quizzes` (single create/edit/delete) and `POST /api/quizzes/import` (all-or-nothing bulk JSON). (Phase 3: the web admin screen *Quizzes* now exists.) The original questions cannot be recovered from source; nothing was fabricated.

Legacy URLs: to keep already-installed app builds working, `api.joharacademy.com` would have to point at the new server (DNS control unverified), and those builds do not send the token `/check` and `/block` now need. In practice: ship an updated app.
