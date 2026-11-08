import { useLocation, Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectCurrentToken, selectAuthChecked, selectAuthStatus } from "./authSlice"
import SessionUnavailable from "./SessionUnavailable"
import Loader from "../../components/utils/Loader"
import { useEffect } from "react"

const RequireLogOut = () => {
  const token = useSelector(selectCurrentToken)
  const checked = useSelector(selectAuthChecked)
  const authStatus = useSelector(selectAuthStatus)
  const location = useLocation()
  const startingLocation = useSelector(state=>state?.common?.startingLocation);

  if (!checked) return authStatus === 'unavailable' ? <SessionUnavailable /> : <Loader />
  return (
    !token ? <Outlet /> 
    : startingLocation 
    ? <Navigate to={startingLocation} state={{from: location}} replace />
    : <Navigate to="/admin" state={{from: location}} replace />
  )
}

export default RequireLogOut