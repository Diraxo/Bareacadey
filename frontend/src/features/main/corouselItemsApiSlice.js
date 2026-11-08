import { apiSlice } from "../../app/api/apiSlice";

export const corouselItemsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getCorouselItems: builder.query({
            query: (id) => `/api/corouselitems${id ? '/parent/'+id : ''}`,
            providesTags: ["CorouselItems"]
        }),
        getCorouselItem: builder.query({
            query: (id) => `/api/corouselitems/${id}`,
            providesTags: ["CorouselItems"]
        }),
        addCorouselItem: builder.mutation({
            query: (data) => ({
                url: '/api/corouselitems',
                method: 'POST',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["CorouselItems","Activities",]
        }),
        updateCorouselItem: builder.mutation({
            query: (data) => ({
                url: '/api/corouselitems',
                method: 'PUT',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["CorouselItems","Activities",]
        }),
        deleteCorouselItem: builder.mutation({
            query: (data) => ({
                url: '/api/corouselitems',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["CorouselItems","Activities",]
        }),
        
    })
})

export const {
    useGetCorouselItemsQuery,
    useAddCorouselItemMutation,
    useUpdateCorouselItemMutation,
    useDeleteCorouselItemMutation,
    useGetCorouselItemQuery,
} = corouselItemsApiSlice