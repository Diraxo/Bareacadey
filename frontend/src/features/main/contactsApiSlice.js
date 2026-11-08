import { apiSlice } from "../../app/api/apiSlice";

export const contactsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getContacts: builder.query({
            query: (id) => `/api/contacts${id ? '/parent/'+id : ''}`,
            providesTags: ["Contacts"]
        }),
        getContact: builder.query({
            query: (id) => `/api/contacts/${id}`,
            providesTags: ["Contacts"]
        }),
        addContact: builder.mutation({
            query: (data) => ({
                url: '/api/contacts_public',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Contacts","Activities",]
        }),
        updateContact: builder.mutation({
            query: (data) => ({
                url: '/api/contacts_public',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Contacts","Activities",]
        }),
        deleteContact: builder.mutation({
            query: (data) => ({
                url: '/api/contacts_public',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Contacts","Activities",]
        }),
        updateRouteStateContact: builder.mutation({
            query: (data) => ({
                url: '/api/contacts/routeState',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Contacts","Activities",]
        }),
        
    })
})

export const {
    useGetContactsQuery,
    useAddContactMutation,
    useUpdateContactMutation,
    useDeleteContactMutation,
    useGetContactQuery,
    useUpdateRouteStateContactMutation,
} = contactsApiSlice