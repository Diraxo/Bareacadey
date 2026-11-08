import { apiSlice } from "../../app/api/apiSlice";

export const chatsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getChats: builder.query({
            query: (id) => `/api/chats/${id}`,
            providesTags: ["Chats"],
        }),
        getChatUsers: builder.query({
            query: () => '/api/chats/userslist',
            providesTags: ["ChatUsers"]
        }),
        getChat: builder.query({
            query: (id) => `/api/chats/${id}`,
            providesTags: ["Chats"]
        }),
        addChat: builder.mutation({
            query: (data) => ({
                url: '/api/chats',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ["Chats",]
        }),
        updateChat: builder.mutation({
            query: (data) => ({
                url: '/api/chats',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ["Chats",]
        }),
        deleteChat: builder.mutation({
            query: (data) => ({
                url: '/api/chats',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ["Chats",]
        }),
    })
})

export const {
    useGetChatsQuery,
    useAddChatMutation,
    useUpdateChatMutation,
    useDeleteChatMutation,
    useGetChatQuery,
    useGetChatUsersQuery
} = chatsApiSlice