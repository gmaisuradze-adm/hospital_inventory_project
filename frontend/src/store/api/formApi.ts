import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

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

export const { useGetFormsQuery } = formApi;
