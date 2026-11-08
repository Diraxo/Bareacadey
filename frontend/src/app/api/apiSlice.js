import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
import { setCredentials, logOut, setAuthUnavailable } from '../../features/auth/authSlice'

import axios from 'axios';
import { setUploadProgress } from '../slices/commonSlice';
import { createSingleFlight, createAcrossTabs, tokenUnchanged, requestNewAccessToken, refreshWithRetry, endsSession, sendWithRenewal } from '../../utils/authRefresh';

const axiosBaseQuery = async (args, api, extraOptions) => {
  try {
    const accessToken = api.getState().auth.token;
    const prepareHeaders = (headers) => {
        if(accessToken) {
            headers.set('authorization', `Bearer ${accessToken}`);
        }
        return headers;
    };
    let url = "";
    let params = {};
    if (typeof args === 'string') {
        url = import.meta.env.VITE_API_URL+args
    }
    else {
        url = import.meta.env.VITE_API_URL+args?.url;
        params = {data: args?.body, method: args?.method}
    }
    const result = await axios({
        ...params,
        url: url,
        headers: { authorization: `Bearer ${accessToken}`},
        withCredentials: true,
        // onUploadProgress: args?.onUploadProgress,
        onUploadProgress: (progressEvent) => {
            const upload = args?.upload;
            if(upload) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                api.dispatch(setUploadProgress(percentCompleted))
            }
            args?.onUploadProgress?.(progressEvent)
        },
        onDownloadProgress: args?.onDownloadProgress,
    })
    return { 
        data: result.data,
     };
  } catch (error) {
    return {
         error: {
            status: error?.response?.status,
            data: error?.response?.data || { error: true, message: 'Something went wrong. Please try again.' },
        }
    };
  }
};

const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include',
    prepareHeaders: (headers, {getState}) => {
        const token = getState().auth.token
        if(token) {
            headers.set("authorization", `Bearer ${token}`)
        }
        return headers
    }
})

/* One refresh at a time in this tab, shared by every request that needs it, and one at a time across the tabs of this
 * browser (they share the refresh cookie, which the server replaces on every refresh). */
const refreshAccessToken = createSingleFlight(createAcrossTabs(() => requestNewAccessToken(fetch, import.meta.env.VITE_API_URL + "/api/user/token/reqtoken")))
const online = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false)

/* Refreshes (once, shared; a few bounded retries when the problem is only temporary) and stores the new credentials.
 * Returns the outcome. The session is ended ONLY when the server says the session itself is over (invalid / revoked /
 * expired); a network failure, timeout, 429 or 5xx leaves everything as it is. */
const renewSession = async (api, delays) => {
    const tokenAtStart = api.getState().auth.token
    const outcome = await refreshWithRetry(refreshAccessToken, { delays, isOnline: online })
    // an answer that arrives after a sign-out, a new sign-in or a newer refresh must not overwrite or erase that
    if (!tokenUnchanged(tokenAtStart, api.getState().auth.token)) return outcome
    if (outcome.kind === 'ok') api.dispatch(setCredentials({ ...outcome.data }))
    else if (endsSession(outcome)) api.dispatch(logOut({ reason: outcome.kind }))
    return outcome
}

/* Page load: try to restore the session. Signed out only when the server really says there is no valid session; when the
 * server cannot be reached the state becomes "unavailable" (a retry screen) instead of "logged out". */
export const restoreSession = async (dispatch) => {
    const getToken = () => dispatch((_, getState) => getState().auth.token) // thunk: read the current token
    const tokenAtStart = getToken()
    const outcome = await refreshWithRetry(refreshAccessToken, { isOnline: online })
    if (!tokenUnchanged(tokenAtStart, getToken())) return outcome // the person signed in meanwhile: keep that
    if (outcome.kind === 'ok') dispatch(setCredentials({ ...outcome.data }))
    else if (endsSession(outcome)) dispatch(logOut({ reason: outcome.kind === 'expired' ? 'expired' : null }))
    else dispatch(setAuthUnavailable())
    return outcome
}

const baseQueryWithReauth = async (args, api, extraOptions) => {
    // a big upload is sent with a token that stays valid for the whole request; do not start one on a token about to expire
    return sendWithRenewal({
        args,
        send: (a) => axiosBaseQuery(a, api, extraOptions),
        // renewal inside a request: short, bounded retries; a transient failure keeps the user signed in and returns the
        // original error. The retry reuses the same args, so FormData bodies and progress callbacks are unchanged.
        renew: () => renewSession(api, [1000, 3000]),
        getToken: () => api.getState().auth.token,
        needsFreshToken: typeof args === 'object' && !!(args?.upload || args?.freshToken),
    })
}

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    //keepUnusedDataFor: 60*60*24,
    //keepUnusedDataFor: 10,
    tagTypes: [
        'Users',
        'Roles',
        'Activities',
        'Vehicles',
        'VehicleTypes',
        'Classifications',
        'Ownerships',
        "Trips",
        "SubTrips",
        "Quizzes",
        "QuizCategories",
        "Instructors",
        "InstructorRequests"
    ],
    endpoints: builder => ({})
})