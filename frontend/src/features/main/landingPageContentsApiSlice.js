import { apiSlice } from "../../app/api/apiSlice";

export const landingPageContentsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getLandingPageContents: builder.query({
            query: (id) => `/api/landingpagecontents${id ? '/parent/'+id : ''}`,
            providesTags: ["LandingPageContents"]
        }),
        getLandingPageContent: builder.query({
            query: (id) => `/api/landingpagecontents/${id}`,
            providesTags: ["LandingPageContents"]
        }),
        addLandingPageContent: builder.mutation({
            query: (data) => ({
                url: '/api/landingpagecontents',
                method: 'POST',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["LandingPageContents","Activities",]
        }),
        updateLandingPageContent: builder.mutation({
            query: (data) => ({
                url: '/api/landingpagecontents',
                method: 'PUT',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["LandingPageContents","Activities",]
        }),
        deleteLandingPageContent: builder.mutation({
            query: (data) => ({
                url: '/api/landingpagecontents',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["LandingPageContents","Activities",]
        }),
        updateRouteStateLandingPageContent: builder.mutation({
            query: (data) => ({
                url: '/api/landingpagecontents/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["LandingPageContents","Activities",]
        }),
        
    })
})

export const {
    useGetLandingPageContentsQuery,
    useAddLandingPageContentMutation,
    useUpdateLandingPageContentMutation,
    useDeleteLandingPageContentMutation,
    useGetLandingPageContentQuery,
    useUpdateRouteStateLandingPageContentMutation,
} = landingPageContentsApiSlice