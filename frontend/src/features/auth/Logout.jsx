import { useLocation, Navigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { useRequestLogOutMutation } from "./authLogOutApiSlice"
import { logOut } from "./authSlice"
import { useDispatch, useSelector } from "react-redux"
import { Alert, Button, CircularProgress } from "@mui/material"
import { classifyLogoutAnswer } from "../../utils/authRefresh"

/* Signs out THIS device. The local state is cleared only after the server answered (it ended this one session, or said
 * the session was already gone). If the server cannot be reached the user stays signed in and is told so, with a retry;
 * "sign out here only" is offered as a clearly labelled fallback because the session then stays valid on the server until
 * it is ended or expires. Other devices are never affected. */
const Logout = ({socket}) => {
  const location = useLocation()
  const dispatch = useDispatch()
  const userId = useSelector(state=>state?.auth?.user?.id)
  const [LogOutFunction] = useRequestLogOutMutation()
  const [phase, setPhase] = useState('working') // working | failed | done
  const started = useRef(false)

  useEffect(() => {
    if(userId > 0) {
      socket.emit('logout', userId);
      return () => {
        socket.off('onlineUsers');
        socket.off('logout');
      };
    }
  }, [userId]);

  const attempt = async () => {
    setPhase('working')
    const result = await LogOutFunction()
    if (classifyLogoutAnswer(result?.error) === 'done') {
      dispatch(logOut())
      setPhase('done')
    } else {
      setPhase('failed')
    }
  }
  const signOutHereOnly = () => { dispatch(logOut()); setPhase('done') }

  useEffect(()=>{
    if (started.current) return
    started.current = true
    attempt()
  },[])

  if (phase === 'done') return <Navigate to="/" state={{from: location}} replace />
  if (phase === 'failed') {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-3 p-4">
        <Alert severity="warning" sx={{ maxWidth: 520 }}>
          We could not reach the server to finish signing you out, so you are still signed in on this device.
        </Alert>
        <div className="flex gap-2">
          <Button variant="contained" onClick={attempt}>Try again</Button>
          <Button variant="outlined" onClick={signOutHereOnly}>Sign out on this device only</Button>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, maxWidth: 520, textAlign: 'center' }}>
          "This device only" removes your sign-in from this browser window, but the server is not told, so the session stays valid there until you sign out again online or it expires.
        </div>
      </div>
    )
  }
  return <div className="w-full h-screen flex justify-center items-center"><CircularProgress/></div>
}

export default Logout
