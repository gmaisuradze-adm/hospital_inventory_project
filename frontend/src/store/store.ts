import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { inventoryApi } from './api/inventoryApi';
import { itRequestApi } from './api/itRequestApi';
import { procurementApi } from './api/procurementApi';
import { formApi } from './api/formApi';
import { reportApi } from './api/reportApi';
import { notificationApi } from './api/notificationApi';
import authSlice from './slices/authSlice';
import notificationSlice from './slices/notificationSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    // RTK Query APIs
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [itRequestApi.reducerPath]: itRequestApi.reducer,
    [procurementApi.reducerPath]: procurementApi.reducer,
    [formApi.reducerPath]: formApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    
    // Regular slices
    auth: authSlice,
    notifications: notificationSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(inventoryApi.middleware)
      .concat(itRequestApi.middleware)
      .concat(procurementApi.middleware)
      .concat(formApi.middleware)
      .concat(reportApi.middleware)
      .concat(notificationApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
