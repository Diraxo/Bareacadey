import { apiSlice } from "../../app/api/apiSlice";

export const myTasksApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getMyTasks: builder.query({
            query: (id) => `/api/mytasks${id ? '/parent/'+id : ''}`,
            providesTags: ["MyTasks"]
        }),
        getMyTask: builder.query({
            query: (id) => `/api/mytasks/${id}`,
            providesTags: ["MyTasks"]
        }),
        addMyTask: builder.mutation({
            query: (data) => ({
                url: '/api/mytasks',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["MyTasks","Activities",]
        }),
        updateMyTask: builder.mutation({
            query: (data) => ({
                url: '/api/mytasks',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["MyTasks","Activities",]
        }),
        deleteMyTask: builder.mutation({
            query: (data) => ({
                url: '/api/mytasks',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["MyTasks","Activities",]
        }),
        updateRouteStateMyTask: builder.mutation({
            query: (data) => ({
                url: '/api/mytasks/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["MyTasks","Activities",]
        }),
        
    })
})

export const {
    useGetMyTasksQuery,
    useAddMyTaskMutation,
    useUpdateMyTaskMutation,
    useDeleteMyTaskMutation,
    useGetMyTaskQuery,
    useUpdateRouteStateMyTaskMutation,
} = myTasksApiSlice