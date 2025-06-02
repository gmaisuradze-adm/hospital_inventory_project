import axios from 'axios';
import config from '../config';

// Create an axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not already retrying
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post('/auth/refresh-token', { refreshToken });
          localStorage.setItem('token', data.token);
          
          // Update the Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          // Retry original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (error) {
        // If refresh token fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API module for each section
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  checkAuth: () => api.get('/auth/check')
};

export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  search: (query) => api.get(`/inventory/search?q=${query}`)
};

export const warehouseAPI = {
  getAll: (params) => api.get('/warehouse', { params }),
  getById: (id) => api.get(`/warehouse/${id}`),
  create: (data) => api.post('/warehouse', data),
  update: (id, data) => api.put(`/warehouse/${id}`, data),
  delete: (id) => api.delete(`/warehouse/${id}`)
};

export const requestsAPI = {
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  delete: (id) => api.delete(`/requests/${id}`),
  approve: (id) => api.post(`/requests/${id}/approve`),
  reject: (id) => api.post(`/requests/${id}/reject`)
};

export const serviceAPI = {
  getIncidents: (params) => api.get('/service-management/incidents', { params }),
  getIncidentById: (id) => api.get(`/service-management/incidents/${id}`),
  createIncident: (data) => api.post('/service-management/incidents', data),
  updateIncident: (id, data) => api.put(`/service-management/incidents/${id}`, data),
  
  getMaintenance: (params) => api.get('/service-management/maintenance', { params }),
  getMaintenanceById: (id) => api.get(`/service-management/maintenance/${id}`),
  createMaintenance: (data) => api.post('/service-management/maintenance', data),
  updateMaintenance: (id, data) => api.put(`/service-management/maintenance/${id}`, data),
  
  getKnowledgeBase: (params) => api.get('/service-management/knowledge', { params }),
  getKnowledgeArticle: (id) => api.get(`/service-management/knowledge/${id}`),
  createKnowledgeArticle: (data) => api.post('/service-management/knowledge', data),
  updateKnowledgeArticle: (id, data) => api.put(`/service-management/knowledge/${id}`, data)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getInventoryStats: (params) => api.get('/analytics/inventory', { params }),
  getServiceStats: (params) => api.get('/analytics/service', { params }),
  getWarehouseStats: (params) => api.get('/analytics/warehouse', { params }),
  getReports: (params) => api.get('/analytics/reports', { params }),
  generateReport: (reportType, params) => api.post(`/analytics/reports/${reportType}`, params)
};

export default api;
