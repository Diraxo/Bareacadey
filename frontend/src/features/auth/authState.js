/* The sign-in state machine, free of Redux imports so it can be tested alone (authSlice.js wraps it with createSlice).
 *
 * status:  checking     first attempt to restore a session after a page load is running
 *          signedIn     there is an access token and a user
 *          signedOut    there is no session (never had one, signed out, or the server ended it)
 *          unavailable  the server could not be asked (offline, timeout, 429, 5xx): the session may still be valid, so
 *                       guards show a retry screen instead of the login page
 * `checked` stays for the existing guards: true once the answer is known, i.e. not while checking or unavailable. */
export const initialAuthState = { user: null, token: null, checked: false, status: 'checking', endedReason: null }

export const authReducers = {
  setCredentials: (state, action) => {
    const { user, accessToken } = action.payload || {}
    // a refresh answer without a token must never replace working credentials with empty ones
    if (!accessToken || !user) return
    state.user = user
    state.token = accessToken
    state.status = 'signedIn'
    state.checked = true
    state.endedReason = null
  },
  setAuthChecked: (state) => {
    state.checked = true
    if (state.status === 'checking' || state.status === 'unavailable') state.status = state.token ? 'signedIn' : 'signedOut'
  },
  setAuthUnavailable: (state) => {
    if (state.token) { state.checked = true; return } // already signed in: keep working, just could not renew yet
    state.status = 'unavailable'
    state.checked = false
  },
  logOut: (state, action) => {
    state.user = null
    state.token = null
    state.checked = true
    state.status = 'signedOut'
    state.endedReason = action?.payload?.reason ?? null
  },
}
