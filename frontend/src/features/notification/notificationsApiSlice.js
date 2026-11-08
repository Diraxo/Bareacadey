import { apiSlice } from "../../app/api/apiSlice";
// import socketIOClient from 'socket.io-client';

// const socket = socketIOClient(import.meta.env.VITE_API_URL);
export const notificationsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        //get notifications query
        getNotifications: builder.query({
            query: () => '/api/notifications',
            //keepUnusedDataFor: 5
        }),

        //update user mutation
        updateNotification: builder.mutation({
            query: data => ({
                url: '/api/notifications',
                method: 'PUT',
                body: data,
            })
        }),

        // Use a mutation to update the notifications list when a new notification is received
        // subscribeToNotifications: builder.mutation({
        //     query: () => {},
        //     async onQueryStarted({ dispatch }) {
        //     // Listen for the 'notification' event
        //     socket.on('notification', (notification) => {
        //         // Dispatch an action to update the notifications list
        //         dispatch(apiSlice.util.updateQueryData('getNotifications', (notifications = []) => [...notifications, notification]));
        //     });
        //     },
        //     async onQueryStopped() {
        //     // Clean up the socket.io listener
        //     socket.off('notification');
        //     },
        // }),

    })
})


export const {
    useGetNotificationsQuery,
    useUpdateNotificationMutation,
    useSubscribeToNotificationsMutation
} = notificationsApiSlice