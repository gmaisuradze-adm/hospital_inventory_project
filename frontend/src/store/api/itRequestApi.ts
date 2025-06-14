import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

interface ITRequest {
  id: string;
  title: string;
  description: string;
  requestType: string;
  priority: string;
  status: string;
  requesterId: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  requester: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  assignee?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ITRequestsResponse {
  requests: ITRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CreateITRequestRequest {
  title: string;
  description: string;
  requestType: string;
  priority?: string;
}

interface UpdateITRequestRequest {
  title?: string;
  description?: string;
  status?: string;
  assignedTo?: string;
  priority?: string;
}

export const itRequestApi = createApi({
  reducerPath: 'itRequestApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/it-requests',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ITRequest'],
  endpoints: (builder) => ({
    getITRequests: builder.query<ITRequestsResponse, {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      requestType?: string;
      assignedTo?: string;
    }>({
      query: (params) => ({
        url: '',
        params,
      }),
      providesTags: ['ITRequest'],
    }),
    
    createITRequest: builder.mutation<ITRequest, CreateITRequestRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ITRequest'],
    }),
    
    getITRequestById: builder.query<ITRequest, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'ITRequest', id }],
    }),
    
    updateITRequest: builder.mutation<ITRequest, { id: string; data: UpdateITRequestRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ITRequest', id }, 'ITRequest'],
    }),
    
    deleteITRequest: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ITRequest'],
    }),
    
    assignITRequest: builder.mutation<ITRequest, { id: string; assignedTo: string }>({
      query: ({ id, assignedTo }) => ({
        url: `/${id}/assign`,
        method: 'POST',
        body: { assignedTo },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ITRequest', id }, 'ITRequest'],
    }),
  }),
});

export const {
  useGetITRequestsQuery,
  useCreateITRequestMutation,
  useGetITRequestByIdQuery,
  useUpdateITRequestMutation,
  useDeleteITRequestMutation,
  useAssignITRequestMutation,
} = itRequestApi;
