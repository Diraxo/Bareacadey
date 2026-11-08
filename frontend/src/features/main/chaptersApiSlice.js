import { apiSlice } from "../../app/api/apiSlice";

export const chaptersApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getChapters: builder.query({
            query: (id) => `/api/chapters${id ? '/parent/'+id : ''}`,
            providesTags: ["Chapters"]
        }),
        getChapter: builder.query({
            query: (id) => `/api/chapters/${id}`,
            providesTags: ["Chapters"]
        }),
        addChapter: builder.mutation({
            query: (data) => ({
                url: '/api/chapters',
                method: 'POST',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["Chapters","Activities","Payments"]
        }),
        updateChapter: builder.mutation({
            query: (data) => ({
                url: '/api/chapters',
                method: 'PUT',
                body: data,
                upload: true,
            }),
            invalidatesTags: ["Chapters","Activities","Payments"]
        }),
        deleteChapter: builder.mutation({
            query: (data) => ({
                url: '/api/chapters',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Chapters","Activities","Payments"]
        }),
        getChapterUploadLimits: builder.query({
            query: () => '/api/chapters/upload-limits',
        }),
        // persistent batches: the server keeps the status of every file, one request per file
        createUploadBatch: builder.mutation({
            query: ({ chapterId, batch_key, files }) => ({
                url: `/api/chapters/${chapterId}/batches`,
                method: 'POST',
                body: { batch_key, files },
                freshToken: true,
            }),
        }),
        getUploadBatch: builder.query({
            query: (batchId) => `/api/chapters/batches/${batchId}`,
        }),
        getActiveUploadBatches: builder.query({
            query: () => '/api/chapters/batches/active',
        }),
        acknowledgeUploadBatch: builder.mutation({
            query: (batchId) => ({ url: `/api/chapters/batches/${batchId}/acknowledge`, method: 'POST', body: {} }),
        }),
        uploadBatchFile: builder.mutation({
            query: ({ batchId, fileId, formData, onUploadProgress }) => ({
                url: `/api/chapters/batches/${batchId}/files/${fileId}`,
                method: 'POST',
                body: formData,
                onUploadProgress,
                freshToken: true,
            }),
        }),
        updateRouteStateChapter: builder.mutation({
            query: (data) => ({
                url: '/api/chapters/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Chapters","Activities","Payments"]
        }),
        
    })
})

export const {
    useGetChaptersQuery,
    useAddChapterMutation,
    useUpdateChapterMutation,
    useDeleteChapterMutation,
    useGetChapterQuery,
    useGetChapterUploadLimitsQuery,
    useCreateUploadBatchMutation,
    useLazyGetUploadBatchQuery,
    useGetActiveUploadBatchesQuery,
    useAcknowledgeUploadBatchMutation,
    useUploadBatchFileMutation,
    useUpdateRouteStateChapterMutation,
} = chaptersApiSlice