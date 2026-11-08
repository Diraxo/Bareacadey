import { apiSlice } from "../../app/api/apiSlice";

export const employeeCategoriesApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getEmployeeCategories: builder.query({
            query: (id) => `/api/employeecategories${id ? '/parent/'+id : ''}`,
            providesTags: ["EmployeeCategories"]
        }),
        getEmployeeCategory: builder.query({
            query: (id) => `/api/employeecategories/${id}`,
            providesTags: ["EmployeeCategories"]
        }),
        addEmployeeCategory: builder.mutation({
            query: (data) => ({
                url: '/api/employeecategories',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["EmployeeCategories","Activities","Users","EmployeePositions"]
        }),
        updateEmployeeCategory: builder.mutation({
            query: (data) => ({
                url: '/api/employeecategories',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["EmployeeCategories","Activities","Users","EmployeePositions"]
        }),
        deleteEmployeeCategory: builder.mutation({
            query: (data) => ({
                url: '/api/employeecategories',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["EmployeeCategories","Activities","Users","EmployeePositions"]
        }),
        updateRouteStateEmployeeCategory: builder.mutation({
            query: (data) => ({
                url: '/api/employeecategories/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["EmployeeCategories","Activities","Users","EmployeePositions"]
        }),
        employeeCategoriesBulkImport: builder.mutation({
            query: (data) => ({
                url: '/api/employeecategories/bulk_import',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["EmployeeCategories","Activities","Users","EmployeePositions"]
        }),
        
    })
})

export const {
    useGetEmployeeCategoriesQuery,
    useAddEmployeeCategoryMutation,
    useUpdateEmployeeCategoryMutation,
    useDeleteEmployeeCategoryMutation,
    useGetEmployeeCategoryQuery,
    useUpdateRouteStateEmployeeCategoryMutation,
    useEmployeeCategoriesBulkImportMutation
} = employeeCategoriesApiSlice