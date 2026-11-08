import {createSlice} from "@reduxjs/toolkit";
import { authReducers, initialAuthState } from "./authState";

const authSlice = createSlice({
    name: 'auth',
    initialState: initialAuthState,
    reducers: authReducers,
})

export const {setCredentials, logOut, setAuthChecked, setAuthUnavailable} = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectCurrentToken = (state) => state.auth.token
export const selectAuthChecked = (state) => state.auth.checked
export const selectAuthStatus = (state) => state.auth.status
export const selectCurrentPermissions = (state) => state?.auth?.user?.permissions
