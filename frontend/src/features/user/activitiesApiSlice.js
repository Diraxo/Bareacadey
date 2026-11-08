import { apiSlice } from "../../app/api/apiSlice";

export const activitiesApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getActivities: builder.query({
            query: () => '/api/activities',
            providesTags: ['Activities']
        }),
       

    })
})

export const {
    useGetActivitiesQuery,
} = activitiesApiSlice