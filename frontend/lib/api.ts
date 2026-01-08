import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('access_token') 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authApi = {
  // Email/Password auth
  signup: (data: { email: string; password: string; name: string; device_id?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string; device_id?: string; remember_me?: boolean }) =>
    api.post('/auth/login', data),
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
  getAllowedDomains: () =>
    api.get<string[]>('/auth/allowed-domains'),
  
  // OAuth & common
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/users/me'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  checkIp: () => api.get('/auth/check-ip'),
};

export const videoApi = {
  create: (data: { source_url: string; voice_type?: string; output_language?: string }) =>
    api.post('/videos', data),
  list: (page: number = 1, pageSize: number = 10) =>
    api.get('/videos', { params: { page, page_size: pageSize } }),
  get: (id: string) => api.get(`/videos/${id}`),
  delete: (id: string) => api.delete(`/videos/${id}`),
};

export const creditApi = {
  balance: () => api.get('/credits/balance'),
  transactions: (page: number = 1) =>
    api.get('/credits/transactions', { params: { page } }),
  packages: () => api.get('/credits/packages'),
};

export const orderApi = {
  create: (data: { package_id: string; payment_method: string }) =>
    api.post('/orders', data),
  list: () => api.get('/orders'),
  uploadScreenshot: (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append('screenshot', file);
    return api.post(`/orders/${orderId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// API Key types
export interface APIKey {
  id: string;
  key_type: string;
  name: string;
  description?: string;
  masked_value: string;
  key_value?: string; // Only in reveal response
  config?: string;
  is_active: boolean;
  is_primary: boolean;
  last_used_at?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface APIKeyTypeInfo {
  key_type: string;
  name: string;
  description: string;
  required: boolean;
  has_key: boolean;
  is_active: boolean;
}

export interface APIKeyListResponse {
  keys: APIKey[];
  total: number;
}

// Admin API Key endpoints
export const adminApiKeysApi = {
  getTypes: () => api.get<APIKeyTypeInfo[]>('/admin/api-keys/types'),
  list: (params?: { key_type?: string; is_active?: boolean }) =>
    api.get<APIKeyListResponse>('/admin/api-keys', { params }),
  get: (id: string) => api.get<APIKey>(`/admin/api-keys/${id}`),
  reveal: (id: string) => api.get<APIKey>(`/admin/api-keys/${id}/reveal`),
  create: (data: {
    key_type: string;
    name: string;
    key_value: string;
    description?: string;
    config?: string;
    is_active?: boolean;
    is_primary?: boolean;
  }) => api.post<APIKey>('/admin/api-keys', data),
  update: (id: string, data: {
    name?: string;
    key_value?: string;
    description?: string;
    config?: string;
    is_active?: boolean;
    is_primary?: boolean;
  }) => api.patch<APIKey>(`/admin/api-keys/${id}`, data),
  delete: (id: string) => api.delete(`/admin/api-keys/${id}`),
  test: (id: string) => api.post<{ status: string; message: string }>(`/admin/api-keys/${id}/test`),
};
