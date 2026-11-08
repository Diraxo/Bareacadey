import { apiSlice } from "../../app/api/apiSlice";

export const configApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getconfig: builder.query({
            query: () => '/api/system_config',
            providesTags: ["config"]
        }),
        updateConfig: builder.mutation({
            query: data => ({
                url: '/api/system_config',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['config']
        }),
        

    })
})


export const {
    useGetconfigQuery,
    useUpdateConfigMutation
} = configApiSlice