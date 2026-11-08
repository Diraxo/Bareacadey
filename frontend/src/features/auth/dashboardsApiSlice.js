import { apiSlice } from "../../app/api/apiSlice";

export const publicApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getMainDashboardData: builder.query({
            query: () => '/api/dashboards/main',
            providesTags: ["MainDashboards"]
        }),
    })
})

export const {
  useGetMainDashboardDataQuery
} = publicApiSlice