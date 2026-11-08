import { apiSlice } from "../../app/api/apiSlice";

export const paymentsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getPayments: builder.query({
            query: (id) => `/api/payments${id ? '/parent/'+id : ''}`,
            providesTags: ["Payments"]
        }),
        getPayment: builder.query({
            query: (id) => `/api/payments/${id}`,
            providesTags: ["Payments"]
        }),
        addPayment: builder.mutation({
            query: (data) => ({
                url: '/api/payments',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Payments","Courses","Chapters"]
        }),
        checkPayment: builder.mutation({
            query: (data) => ({
                url: '/api/payments/check_payment',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Payments","Courses","Chapters"]
        }),
        updatePayment: builder.mutation({
            query: (data) => ({
                url: '/api/payments',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Payments","Activities",]
        }),
        deletePayment: builder.mutation({
            query: (data) => ({
                url: '/api/payments',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Payments","Activities",]
        }),
        
    })
})

export const {
    useGetPaymentsQuery,
    useAddPaymentMutation,
    useUpdatePaymentMutation,
    useDeletePaymentMutation,
    useGetPaymentQuery,
    useCheckPaymentMutation
} = paymentsApiSlice