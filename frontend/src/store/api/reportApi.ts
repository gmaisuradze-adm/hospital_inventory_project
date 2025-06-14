import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

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

export const { useGetReportsQuery } = reportApi;
