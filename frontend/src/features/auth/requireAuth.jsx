import { useLocation, Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectCurrentToken, selectCurrentPermissions, selectAuthChecked, selectAuthStatus } from "./authSlice"
import SessionUnavailable from "./SessionUnavailable"
import Loader from "../../components/utils/Loader"

const RequireAuth = () => {
  const token = useSelector(selectCurrentToken)
  const permissions = useSelector(selectCurrentPermissions)
  const checked = useSelector(selectAuthChecked)
  const authStatus = useSelector(selectAuthStatus)
  const location = useLocation()
  const user = useSelector(state=>state?.auth?.user)
  if (!checked) return authStatus === 'unavailable' ? <SessionUnavailable /> : <Loader />
  return (
    (token && user && user?.role_id != 5) 
    ? <Outlet /> 
    : token && user && user?.role_id == 5 
    ? <Navigate to="/" state={{from: location}} replace /> 
    : <Navigate to="/auth/login" state={{from: location}} replace />
  )
}

export default RequireAuth