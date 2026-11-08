import { apiSlice } from "../../app/api/apiSlice";

export const userRatingsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getUserRatings: builder.query({
            query: (id) => `/api/userratings${id ? '/parent/'+id : ''}`,
            providesTags: ["UserRatings"]
        }),
        getUserRating: builder.query({
            query: (id) => `/api/userratings/${id}`,
            providesTags: ["UserRatings"]
        }),
        addUserRating: builder.mutation({
            query: (data) => ({
                url: '/api/userratings',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["UserRatings","Courses",]
        }),
        updateUserRating: builder.mutation({
            query: (data) => ({
                url: '/api/userratings',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["UserRatings","Courses",]
        }),
        deleteUserRating: builder.mutation({
            query: (data) => ({
                url: '/api/userratings',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["UserRatings","Courses",]
        }),
        
    })
})

export const {
    useGetUserRatingsQuery,
    useAddUserRatingMutation,
    useUpdateUserRatingMutation,
    useDeleteUserRatingMutation,
    useGetUserRatingQuery,
} = userRatingsApiSlice