import { apiSlice } from "../../app/api/apiSlice";

export const authLogOutApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        requestLogOut: builder.mutation({
            // credential = this browser's refresh cookie, so signing out works even after the access token expired, and it
            // ends exactly this device's session
            query: () => ({
                url: '/api/user/token/logout',
                method: 'DELETE',
            })
        }),
    }) 
})

export const {
    useRequestLogOutMutation
} = authLogOutApiSlice