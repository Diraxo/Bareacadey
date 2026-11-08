import { apiSlice } from "../../app/api/apiSlice";

/* Instructor approval + course assignments (backend/controllers/InstructorController.js) and the support tool for
 * the registered-device rule (backend/controllers/DeviceController.js). */
export const instructorApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getInstructorRequests: builder.query({
            query: (status) => `/api/instructors/requests${status ? `?status=${status}` : ''}`,
            providesTags: ['InstructorRequests'],
        }),
        approveInstructorRequest: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/api/instructors/requests/${id}/approve`, method: 'POST', body }),
            invalidatesTags: ['InstructorRequests', 'Instructors', 'Users'],
        }),
        rejectInstructorRequest: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/api/instructors/requests/${id}/reject`, method: 'POST', body }),
            invalidatesTags: ['InstructorRequests'],
        }),
        getInstructors: builder.query({
            query: () => '/api/instructors',
            providesTags: ['Instructors'],
        }),
        setInstructorCourses: builder.mutation({
            query: ({ userId, course_ids }) => ({ url: `/api/instructors/${userId}/courses`, method: 'PUT', body: { course_ids } }),
            invalidatesTags: ['Instructors'],
        }),
        revokeInstructor: builder.mutation({
            query: ({ userId, ...body }) => ({ url: `/api/instructors/${userId}/revoke`, method: 'POST', body }),
            invalidatesTags: ['Instructors', 'InstructorRequests', 'Users'],
        }),
        getAllCourses: builder.query({
            query: () => '/api/courses',
        }),
        getUserDevices: builder.query({
            query: (userId) => `/api/devices/user/${userId}`,
            providesTags: ['Devices'],
        }),
        resetUserDevices: builder.mutation({
            query: (userId) => ({ url: `/api/devices/user/${userId}/reset`, method: 'POST' }),
            invalidatesTags: ['Devices'],
        }),
    }),
});

export const {
    useGetInstructorRequestsQuery,
    useApproveInstructorRequestMutation,
    useRejectInstructorRequestMutation,
    useGetInstructorsQuery,
    useSetInstructorCoursesMutation,
    useRevokeInstructorMutation,
    useGetAllCoursesQuery,
    useGetUserDevicesQuery,
    useResetUserDevicesMutation,
} = instructorApiSlice;
