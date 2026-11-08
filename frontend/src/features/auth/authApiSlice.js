import { apiSlice } from "../../app/api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation({
            query: crededentials => ({
                url: '/api/auth/login',
                method: 'POST',
                body: { ...crededentials }
            })
        }),
        resetPassword: builder.mutation({
            query: body => ({
                url: '/api/auth/reset_password',
                method: 'POST',
                body: body
            })
        }),
        setNewPassword: builder.mutation({
            query: body => ({
                url: '/api/auth/set_new_password',
                method: 'POST',
                body: body
            })
        }),
        verifyDevice: builder.mutation({
            query: body => ({
                url: '/api/auth/verify_new_device',
                method: 'POST',
                body: body
            })
        }),
        verifyEmail: builder.mutation({
            query: body => ({
                url: '/api/auth/verify_email',
                method: 'POST',
                body: body
            })
        }),
        createAccount: builder.mutation({
            query: body => ({
                url: '/api/auth/create_account',
                method: 'POST',
                body: body
            })
        })
    }) 
})

export const {
    useLoginMutation,
    useResetPasswordMutation,
    useSetNewPasswordMutation,
    useVerifyDeviceMutation,
    useVerifyEmailMutation,
    useCreateAccountMutation
} = authApiSlice