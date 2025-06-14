import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

// Placeholder APIs for other modules
export const procurementApi = createApi({
  reducerPath: 'procurementApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/procurement',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ProcurementRequest'],
  endpoints: (builder) => ({
    getProcurementRequests: builder.query<any, any>({
      query: (params) => ({ url: '', params }),
      providesTags: ['ProcurementRequest'],
    }),
  }),
});

export const formApi = createApi({
  reducerPath: 'formApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/forms',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Form'],
  endpoints: (builder) => ({
    getForms: builder.query<any, any>({
      query: (params) => ({ url: '', params }),
      providesTags: ['Form'],
    }),
  }),
});

export const reportApi = createApi({
  reducerPath: 'reportApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/reports',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    getReports: builder.query<any, any>({
      query: (params) => ({ url: '', params }),
      providesTags: ['Report'],
    }),
  }),
});

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/notifications',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query<any, any>({
      query: (params) => ({ url: '', params }),
      providesTags: ['Notification'],
    }),
  }),
});

// Export hooks
export const { useGetProcurementRequestsQuery } = procurementApi;
export const { useGetFormsQuery } = formApi;
export const { useGetReportsQuery } = reportApi;
export const { useGetNotificationsQuery } = notificationApi;
