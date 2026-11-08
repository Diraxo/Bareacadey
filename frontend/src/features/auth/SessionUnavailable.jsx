import { useState } from "react"
import { useDispatch } from "react-redux"
import { Alert, Button, CircularProgress } from "@mui/material"
import { restoreSession } from "../../app/api/apiSlice"

/* Shown instead of the login page when the server could not be asked whether the session is still valid. */
const SessionUnavailable = () => {
  const dispatch = useDispatch()
  const [busy, setBusy] = useState(false)
  const retry = async () => { setBusy(true); try { await restoreSession(dispatch) } finally { setBusy(false) } }
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center gap-3 p-4">
      <Alert severity="warning" sx={{ maxWidth: 480 }}>
        We could not reach the server to check your sign-in. You are not signed out; this is usually a short connection problem.
      </Alert>
      <Button variant="contained" onClick={retry} disabled={busy}>{busy ? <CircularProgress size={20} /> : "Try again"}</Button>
    </div>
  )
}

export default SessionUnavailable
