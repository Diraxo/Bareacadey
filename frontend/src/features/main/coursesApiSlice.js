import { apiSlice } from "../../app/api/apiSlice";

export const coursesApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getCourses: builder.query({
            query: (id) => `/api/courses${id ? '/parent/'+id : ''}`,
            providesTags: ["Courses"]
        }),
        getCourse: builder.query({
            query: (id) => `/api/courses/${id}`,
            providesTags: ["Courses"]
        }),
        addCourse: builder.mutation({
            query: (data) => ({
                url: '/api/courses',
                method: 'POST',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["Courses","Activities","UserRatings","Payments","Trendings"]
        }),
        updateCourse: builder.mutation({
            query: (data) => ({
                url: '/api/courses',
                method: 'PUT',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["Courses","Activities","UserRatings","Payments","Trendings"]
        }),
        deleteCourse: builder.mutation({
            query: (data) => ({
                url: '/api/courses',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Courses","Activities","UserRatings","Payments","Trendings"]
        }),
        updateRouteStateCourse: builder.mutation({
            query: (data) => ({
                url: '/api/courses/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Courses","Activities","UserRatings","Payments","Trendings"]
        }),
        getConvertedCourses: builder.query({
            query: () => `/api/courses/converted_courses/list`,
            providesTags: ["Converted Courses"]
        }),
        convertCourse: builder.mutation({
            query: (data) => ({
                url: '/api/courses/convert_course/convert',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Converted Courses"]
        }),
        
    })
})

export const {
    useGetCoursesQuery,
    useAddCourseMutation,
    useUpdateCourseMutation,
    useDeleteCourseMutation,
    useGetCourseQuery,
    useUpdateRouteStateCourseMutation,
    useGetConvertedCoursesQuery,
    useConvertCourseMutation
} = coursesApiSlice