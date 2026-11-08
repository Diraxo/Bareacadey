import { apiSlice } from "../../app/api/apiSlice";

export const employeePositionsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getEmployeePositions: builder.query({
            query: (id) => `/api/employeepositions${id ? '/parent/'+id : ''}`,
            providesTags: ["EmployeePositions"]
        }),
        getEmployeePosition: builder.query({
            query: (id) => `/api/employeepositions/${id}`,
            providesTags: ["EmployeePositions"]
        }),
        addEmployeePosition: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        updateEmployeePosition: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        deleteEmployeePosition: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        updateRouteStateEmployeePosition: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        employeePositionsBulkImport: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions/bulk_import',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        employeePositionsBulkEdit: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions/bulk_edit',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        employeePositionsBulkDelete: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions/bulk_delete',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        employeePositionsReorderRows: builder.mutation({
            query: (data) => ({
                url: '/api/employeepositions/reorder_rows',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["EmployeePositions","Activities","Users"]
        }),
        
    })
})

export const {
    useGetEmployeePositionsQuery,
    useAddEmployeePositionMutation,
    useUpdateEmployeePositionMutation,
    useDeleteEmployeePositionMutation,
    useGetEmployeePositionQuery,
    useUpdateRouteStateEmployeePositionMutation,
    useEmployeePositionsBulkImportMutation,
    useEmployeePositionsBulkEditMutation,
    useEmployeePositionsBulkDeleteMutation,
    useEmployeePositionsReorderRowsMutation,
} = employeePositionsApiSlice