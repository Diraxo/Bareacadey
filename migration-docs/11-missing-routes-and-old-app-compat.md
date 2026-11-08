# 11 — Missing routes audit and old-app compatibility

Audit date: 2026-10-29. Searched `bare/` (mobile), `frontend/src/` (web) and `backend/`.

## 1. The three routes the backend does not implement

| Route | Defined in | Invoked by a screen? | Verdict |
|---|---|---|---|
| `/api/drivervideos` (+ `/parent/:id`, `/:id`) | `bare/redux/main/driverVideosApiSlice.js` | Only `bare/app/Learn.jsx` (`useGetDriverVideosQuery`). Nothing links to it: not in `Drawer.jsx`, `_layout.jsx` or any `router.navigate`. It exists as an Expo Router file route (`/Learn`), so only a deep link or manual URL reaches it. The add/update/delete/single hooks are never used. | Leftover from the fleet-driver app. Unreachable from the UI. Safe to delete `Learn.jsx` and the slice. Not yet removed. |
| `/api/users/import_payments/excel` | `bare/redux/user/usersApiSlice.js` (`importDriverPayments`); `frontend/src/features/user/usersApiSlice.js` | No. The hook is never imported or exported from either slice. | Dead code. Safe to remove. |
| `/api/users/load_drivers/geotab` | same two slices (`loadDriversFromGeotab`) | Web: `users.jsx` imports the hook and defines `loadDriversFromGeotab()`, but the only button that calls it is commented out (around line 708). Mobile: exported, never used. | Dead code (fleet/Geotab feature). Safe to remove. |

Related: `backend/controllers/VehicleController.js` still holds Geotab code but is not mounted in `app.js`, so it is inactive.

Nothing found that needs a new backend feature. Open question for the academy: does anyone still expect a "Learn" video list in the app? If yes, it is better served by the existing course/chapter videos than by recreating `drivervideos`.

Suggested cleanup (not done; say the word): delete `bare/app/Learn.jsx`, `bare/redux/main/driverVideosApiSlice.js`, the `DriverVideos` tag, and the two unused mutations in both `usersApiSlice.js` files.

## 2. Old installed apps vs. the new backend

Facts from the code:
- The **updated** app in `bare/` already sends the bearer token on `/check/` (`authApiSlice.js` passes `token`; `apiSlice.js` adds the `Authorization` header).
- The **new** backend requires a JWT on `/check/` (`mobileCompat.js`). Already-installed old builds send none, so `/check` returns 401 for them.
- Which way the old app fails (log out, block the user, or ignore the 401) depends on its `/check` handling and has not been tested.

Options, safest first:
1. **Keep the old backend serving the old app** and give the new app a new `API_URL`. Old installs never talk to the new backend. Retire the old backend only after the `/version/` prompt has moved users. No code change. Requires keeping the old service running.
2. **Time-limited legacy mode** on the new backend: allow unauthenticated `/check/` only when a `LEGACY_CHECK_UNTIL=<date>` env var is set, returning only `success`/`denied` for the given `user_id` and device. Weakens security for that window (user-id enumeration of device status) and is not implemented. I would only add it with your approval.
3. **Hard cutover:** force-update. Only acceptable if old builds fail closed with a clear message, which is untested.

Required test before any cutover: install the **old APK** on a phone, point it at staging, and record what happens on login, `/check` and `/block`. That result decides between options 1–3.

## 3. Not done (needs you or a device)
Items 01–05 of the release sequence (APK on a real phone, host probe on the real plan, credential rotation, staging deploy, rollback rehearsal), recovery of the original quiz backup, and written confirmation of the discount rule. See doc 10 for the procedures.
