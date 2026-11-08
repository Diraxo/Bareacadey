import { apiSlice } from "../../app/api/apiSlice";

export const servicesApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getServices: builder.query({
            query: () => '/api/services',
            providesTags: ["Services"]
        }),
        getService: builder.query({
            query: (id) => `/api/services/${id}`,
            providesTags: ["Services"]
        }),
        addService: builder.mutation({
            query: (data) => ({
                url: '/api/services',
                method: 'POST',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["Services","Activities",]
        }),
        updateService: builder.mutation({
            query: (data) => ({
                url: '/api/services',
                method: 'PUT',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["Services","Activities",]
        }),
        deleteService: builder.mutation({
            query: (data) => ({
                url: '/api/services',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Services","Activities",]
        }),
    })
})

export const {
    useGetServicesQuery,
    useAddServiceMutation,
    useUpdateServiceMutation,
    useDeleteServiceMutation,
    useGetServiceQuery,
} = servicesApiSlice