import { apiSlice } from "../../app/api/apiSlice";

export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        //get user query
        getUsers: builder.query({
            query: () => '/api/users',
            // transformResponse: (response) => {
            //     // Convert all date strings in the response to `Date` objects
            //     const updatedData = response.map((user) => ({
            //       ...user,
            //       date_of_birth: new Date(user.date_of_birth)
            //     }));
        
            //     return updatedData; 
            //   },
            //   serializeDate: (date) => date.toISOString(), 
              providesTags: ["Users"]
            //keepUnusedDataFor: 5
        }),
        getUser: builder.query({
            query: (id)=> `/api/users/${id}`,
            providesTags: ['Users']
        }),
        //get access token mutation
        getAccessToken: builder.mutation({
            query: ()=>({
                url: '/api/user/token/reqtoken',
                method: 'POST'
            })
        }),
        //update user mutation
        updateUser: builder.mutation({
            query: data => ({
                url: '/api/users',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Users',"Roles","Activities"]
        }),
        updateUserProfile: builder.mutation({
            query: data => ({
                url: '/api/users/profile/update',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Users',"Roles","Activities"]
        }),
        updateDrivers: builder.mutation({
            query: data => ({
                url: '/api/users/bulk_edit/excel',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Users',"Roles","Activities","EmployeeDocuments"]
        }),
        addUser: builder.mutation({
            query: data => ({
                url: '/api/users',
                method: "POST",
                body: data
            }),
            invalidatesTags: ["Users","Roles","Activities"]
        }),
        deleteUser: builder.mutation({
            query: data => ({
                url: '/api/users',
                method: "DELETE",
                body: data
            }),
            invalidatesTags: ["Users","Roles","Activities"]
        }),
        deleteUserAccount: builder.mutation({
            query: data => ({
                url: '/api/users/delete-user-account',
                method: "DELETE",
                body: data
            }),
            invalidatesTags: ["Users","Roles","Activities"]
        })

    })
})


export const {
    useGetUsersQuery,
    useUpdateUserMutation,
    useUpdateUserProfileMutation,
    useGetAccessTokenMutation,
    useAddUserMutation,
    useGetUserQuery,
    useDeleteUserMutation,
    useUpdateDriversMutation,
    useDeleteUserAccountMutation
} = usersApiSlice