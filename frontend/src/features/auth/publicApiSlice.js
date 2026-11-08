import { apiSlice } from "../../app/api/apiSlice";

export const publicApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        
        getServicesPublic: builder.query({
            query: () => '/api/public/services',
            providesTags: ["Services"]
        }),
        getServicePublic: builder.query({
            query: (id) => `/api/public/services/${id}`,
            providesTags: ["Services"]
        }),
        getFaqsPublic: builder.query({
            query: () => '/api/public/faqs',
            providesTags: ["Faqs"]
        }),
        getLandingPageContents: builder.query({
            query: () => '/api/public/landing_page_contents',
            providesTags: ["LandingPageContents"]
        }),
        getDashboardDatas: builder.query({
            query: () => '/api/public/dashboard',
            providesTags: ["Dashboards"]
        }),
        getPublicCourses: builder.query({
            query: (id) => `/api/public/courses/${id}`,
            providesTags: ["Courses"]
        }),
        getPublicCategories: builder.query({
            query: () => '/api/public/categories',
            providesTags: ["Categories"]
        }),
        getPublicTrendings: builder.query({
            query: () => '/api/public/trendings',
            providesTags: ["Trendings"]
        }),
        getPublicCorouselItems: builder.query({
            query: () => '/api/public/corouselitems',
            providesTags: ["CorouselItems"]
        }),
        getPublicCourse: builder.query({
            query: ({id, userId}) => `/api/public/course/${id}${userId ? ("/user/"+userId) : ""}`,
            providesTags: ["Courses"]
        }),
        getCurrency: builder.query({
            query: () => `/api/public/get-currency`,
            providesTags: ["Currencies"]
        }),
        updateCurrency: builder.mutation({
            query: (data) => ({
                url: '/api/public/update-currency',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Currencies"]
        }),
    })
})

export const {
    useGetServicesPublicQuery,
    useGetServicePublicQuery,
    useGetFaqsPublicQuery,
    useGetLandingPageContentsQuery,
    useGetDashboardDatasQuery,
    useGetPublicCorouselItemsQuery,
    useGetPublicCourseQuery,
    useGetPublicCoursesQuery,
    useGetPublicTrendingsQuery,
    useGetPublicCategoriesQuery,
    useGetCurrencyQuery,
    useUpdateCurrencyMutation
} = publicApiSlice