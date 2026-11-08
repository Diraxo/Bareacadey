import { apiSlice } from "../../app/api/apiSlice";

export const departmentsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getDepartments: builder.query({
            query: (id) => `/api/departments${id ? '/parent/'+id : ''}`,
            providesTags: ["Departments"]
        }),
        getDepartment: builder.query({
            query: (id) => `/api/departments/${id}`,
            providesTags: ["Departments"]
        }),
        addDepartment: builder.mutation({
            query: (data) => ({
                url: '/api/departments',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Departments","Activities","Users"]
        }),
        updateDepartment: builder.mutation({
            query: (data) => ({
                url: '/api/departments',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Departments","Activities","Users"]
        }),
        deleteDepartment: builder.mutation({
            query: (data) => ({
                url: '/api/departments',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Departments","Activities","Users"]
        }),
        updateRouteStateDepartment: builder.mutation({
            query: (data) => ({
                url: '/api/departments/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Departments","Activities","Users"]
        }),
        departmentsBulkImport: builder.mutation({
            query: (data) => ({
                url: '/api/departments/bulk_import',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Departments","Activities","Users"]
        }),
        
    })
})

export const {
    useGetDepartmentsQuery,
    useAddDepartmentMutation,
    useUpdateDepartmentMutation,
    useDeleteDepartmentMutation,
    useGetDepartmentQuery,
    useUpdateRouteStateDepartmentMutation,
    useDepartmentsBulkImportMutation
} = departmentsApiSlice