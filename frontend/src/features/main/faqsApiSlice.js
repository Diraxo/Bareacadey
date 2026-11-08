import { apiSlice } from "../../app/api/apiSlice";

export const faqsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getFaqs: builder.query({
            query: () => '/api/faqs',
            providesTags: ["Faqs"]
        }),
        getFaq: builder.query({
            query: (id) => `/api/faqs/${id}`,
            providesTags: ["Faqs"]
        }),
        addFaq: builder.mutation({
            query: (data) => ({
                url: '/api/faqs',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Faqs","Activities",]
        }),
        updateFaq: builder.mutation({
            query: (data) => ({
                url: '/api/faqs',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Faqs","Activities",]
        }),
        deleteFaq: builder.mutation({
            query: (data) => ({
                url: '/api/faqs',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Faqs","Activities",]
        }),
    })
})

export const {
    useGetFaqsQuery,
    useAddFaqMutation,
    useUpdateFaqMutation,
    useDeleteFaqMutation,
    useGetFaqQuery,
} = faqsApiSlice