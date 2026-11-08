import { apiSlice } from "../../app/api/apiSlice";

export const trendingsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getTrendings: builder.query({
            query: (id) => `/api/trendings${id ? '/parent/'+id : ''}`,
            providesTags: ["Trendings"]
        }),
        getTrending: builder.query({
            query: (id) => `/api/trendings/${id}`,
            providesTags: ["Trendings"]
        }),
        addTrending: builder.mutation({
            query: (data) => ({
                url: '/api/trendings',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Trendings","Activities",]
        }),
        updateTrending: builder.mutation({
            query: (data) => ({
                url: '/api/trendings',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Trendings","Activities",]
        }),
        deleteTrending: builder.mutation({
            query: (data) => ({
                url: '/api/trendings',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Trendings","Activities",]
        }),
        
    })
})

export const {
    useGetTrendingsQuery,
    useAddTrendingMutation,
    useUpdateTrendingMutation,
    useDeleteTrendingMutation,
    useGetTrendingQuery,
} = trendingsApiSlice