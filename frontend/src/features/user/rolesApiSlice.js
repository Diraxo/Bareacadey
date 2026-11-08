import { apiSlice } from "../../app/api/apiSlice";

export const rolesApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getRoles: builder.query({
            query: () => '/api/roles',
            providesTags: ['Roles']
            // keepUnusedDataFor: 5,
        }),
        getMyRole: builder.query({
            query: () => '/api/roles/mine',
            providesTags: ['Roles']
        }),
        getUserRoles: builder.query({
            query: () => "/api/roles/user",
            providesTags: ["Users","Roles","Activities"]
        }),
        addRole: builder.mutation({
            query: (data) => ({
                url: '/api/roles',
                method: "POST",
                body: data
            }),
            invalidatesTags: ["Roles","Activities","Users"]
        }),
        updateRoles: builder.mutation({
            query: (data) => ({
                url: '/api/roles',
                method: "PUT",
                body: data
            }),
            invalidatesTags: ["Roles","Activities","Users"]
        }),
        deleteRole: builder.mutation({
            query: data => ({
                url: '/api/roles',
                method: "DELETE",
                body: data
            }),
            invalidatesTags: ["Users","Roles","Activities"]
        })
    })
})

export const {
    useGetRolesQuery,
    useAddRoleMutation,
    useUpdateRolesMutation,
    useGetUserRolesQuery,
    useDeleteRoleMutation,
    useGetMyRoleQuery
} = rolesApiSlice