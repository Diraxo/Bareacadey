/* Background retry for a slider that could not be loaded. Plain functions (no React), so the timing is testable.
 *
 * - at most one timer and one request at a time: arming twice, or `online()` while a request runs, adds nothing;
 * - after a failed request the next attempt is armed again, every `delayMs`, until `stop()` or a success;
 * - while the browser reports it is offline no request is made and no timer is kept; `online()` resumes at once;
 * - `stop()` (unmount, or the slider got a decision) clears the timer and ignores any answer still on its way.
 *
 * `check()` resolves true when the server answered with a usable list (that ends the retrying). */
export const createRetryLoop = ({ check, isOnline = () => true, delayMs = 15000 }) => {
  let timer = null
  let running = false
  let stopped = false

  const arm = () => {
    if (stopped || timer !== null || running) return
    timer = setTimeout(() => { timer = null; attempt() }, delayMs)
  }

  const attempt = async () => {
    if (stopped || running) return
    if (!isOnline()) return // resumes from online()
    running = true
    let done = false
    try { done = (await check()) === true } catch (e) { done = false }
    running = false
    if (!done) arm()
  }

  return {
    start: arm,
    online: () => {
      if (stopped) return
      clearTimeout(timer)
      timer = null
      attempt()
    },
    stop: () => { stopped = true; clearTimeout(timer); timer = null },
  }
}
