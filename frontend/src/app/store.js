import { configureStore } from "@reduxjs/toolkit"
import { apiSlice } from "./api/apiSlice"
import authReducer from '../features/auth/authSlice'
import { combineReducers } from 'redux';
import commonSlice from './slices/commonSlice';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'settings',
    storage,
   // whitelist: ['settings']
};

// const persistedReducer = persistReducer(persistConfig, settingSlice);

const rootReducer = combineReducers({
    // settings: persistedReducer,
    auth: authReducer,
    common: commonSlice,
    [apiSlice.reducerPath]: apiSlice.reducer,
});
export const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => 
       getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: true
})

// export const persistor = persistStore(store);