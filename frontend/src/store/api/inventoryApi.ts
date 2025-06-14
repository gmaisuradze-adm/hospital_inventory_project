import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: string;
  location: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  cost?: number;
  quantity: number;
  minQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

interface InventoryResponse {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CreateInventoryItemRequest {
  name: string;
  description?: string;
  category: string;
  location: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  cost?: number;
  quantity?: number;
  minQuantity?: number;
}

interface UpdateInventoryItemRequest {
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  location?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  cost?: number;
  quantity?: number;
  minQuantity?: number;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/inventory',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['InventoryItem'],
  endpoints: (builder) => ({
    getInventoryItems: builder.query<InventoryResponse, {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
      location?: string;
      search?: string;
    }>({
      query: (params) => ({
        url: '',
        params,
      }),
      providesTags: ['InventoryItem'],
    }),
    
    createInventoryItem: builder.mutation<InventoryItem, CreateInventoryItemRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['InventoryItem'],
    }),
    
    getInventoryItemById: builder.query<InventoryItem, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'InventoryItem', id }],
    }),
    
    updateInventoryItem: builder.mutation<InventoryItem, { id: string; data: UpdateInventoryItemRequest }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'InventoryItem', id }, 'InventoryItem'],
    }),
    
    deleteInventoryItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InventoryItem'],
    }),
    
    getInventoryStats: builder.query<{
      categories: Array<{ category: string; itemCount: number; totalQuantity: number; totalCost: number }>;
      statuses: Array<{ status: string; count: number }>;
      totalValue: { totalValue: number; totalItems: number };
    }, void>({
      query: () => '/stats',
      providesTags: ['InventoryItem'],
    }),
    
    getLowStockItems: builder.query<InventoryItem[], { threshold?: number }>({
      query: (params) => ({
        url: '/low-stock',
        params,
      }),
      providesTags: ['InventoryItem'],
    }),
    
    searchInventoryItems: builder.query<InventoryItem[], { q: string; limit?: number }>({
      query: (params) => ({
        url: '/search',
        params,
      }),
    }),
    
    bulkUpdateStatus: builder.mutation<{ message: string }, { itemIds: string[]; status: string }>({
      query: (data) => ({
        url: '/bulk-status',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['InventoryItem'],
    }),
  }),
});

export const {
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useGetInventoryItemByIdQuery,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetInventoryStatsQuery,
  useGetLowStockItemsQuery,
  useSearchInventoryItemsQuery,
  useBulkUpdateStatusMutation,
} = inventoryApi;
