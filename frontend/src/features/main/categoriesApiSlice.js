import { apiSlice } from "../../app/api/apiSlice";

export const categoriesApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getCategories: builder.query({
            query: (id) => `/api/categories${id ? '/parent/'+id : ''}`,
            providesTags: ["Categories"]
        }),
        getCategory: builder.query({
            query: (id) => `/api/categories/${id}`,
            providesTags: ["Categories"]
        }),
        addCategory: builder.mutation({
            query: (data) => ({
                url: '/api/categories',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Categories","Activities","Courses"]
        }),
        updateCategory: builder.mutation({
            query: (data) => ({
                url: '/api/categories',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Categories","Activities","Courses"]
        }),
        deleteCategory: builder.mutation({
            query: (data) => ({
                url: '/api/categories',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Categories","Activities","Courses"]
        }),
        categoriesReorderRows: builder.mutation({
            query: (data) => ({
                url: '/api/categories/reorder_rows',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Categories","Activities","Courses"]
        }),
        
    })
})

export const {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useGetCategoryQuery,
    useCategoriesReorderRowsMutation,
} = categoriesApiSlice