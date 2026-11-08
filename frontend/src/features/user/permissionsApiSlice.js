import { apiSlice } from "../../app/api/apiSlice";

export const permissionsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getPermissions: builder.query({
            query: () => '/api/roles/permissions',
            keepUnusedDataFor: 5,
        }),
        getPermissionsGrouped: builder.query({
            query: () => '/api/roles/permissions_grouped',
            keepUnusedDataFor: 5,
        })
    })
})

export const {
    useGetPermissionsQuery,
    useGetPermissionsGroupedQuery
} = permissionsApiSlice