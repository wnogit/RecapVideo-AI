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

export interface VideoOptions {
  aspect_ratio?: string;
  copyright?: {
    color_adjust?: boolean;
    horizontal_flip?: boolean;
    slight_zoom?: boolean;
    audio_pitch_shift?: boolean;
  };
  subtitles?: {
    enabled?: boolean;
    size?: string;
    position?: string;
    background?: string;
    color?: string;
    word_highlight?: boolean;
  };
  logo?: {
    enabled?: boolean;
    image_path?: string;
    position?: string;
    size?: string;
    opacity?: number;
  };
  outro?: {
    enabled?: boolean;
    platform?: string;
    channel_name?: string;
    logo_path?: string;
    duration?: number;
  };
}

export const videoApi = {
  create: (data: { 
    source_url: string; 
    voice_type?: string; 
    output_language?: string;
    options?: VideoOptions;
  }) => api.post('/videos', data),
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

// Credit Package types
export interface CreditPackage {
  id: string;
  name: string;
  description?: string;
  credits: number;
  price_usd: number;
  price_mmk?: number;
  is_popular: boolean;
  discount_percent: number;
  display_order: number;
  is_active: boolean;
}

export const creditPackagesApi = {
  // Public endpoint
  getPublic: () => api.get<CreditPackage[]>('/credit-packages/public'),
  
  // Admin endpoints
  list: (includeInactive: boolean = true) =>
    api.get<{ packages: CreditPackage[]; total: number }>('/credit-packages', {
      params: { include_inactive: includeInactive },
    }),
  get: (id: string) => api.get<CreditPackage>(`/credit-packages/${id}`),
  create: (data: {
    name: string;
    description?: string;
    credits: number;
    price_usd: number;
    price_mmk?: number;
    is_popular?: boolean;
    discount_percent?: number;
    display_order?: number;
    is_active?: boolean;
  }) => api.post<CreditPackage>('/credit-packages', data),
  update: (id: string, data: Partial<{
    name: string;
    description: string;
    credits: number;
    price_usd: number;
    price_mmk: number;
    is_popular: boolean;
    discount_percent: number;
    display_order: number;
    is_active: boolean;
  }>) => api.patch<CreditPackage>(`/credit-packages/${id}`, data),
  delete: (id: string) => api.delete(`/credit-packages/${id}`),
  toggle: (id: string) => api.post<CreditPackage>(`/credit-packages/${id}/toggle`),
};

// Payment Method types
export interface PaymentType {
  id: string;
  name: string;
  color: string;
}

export interface PaymentMethod {
  id: string;
  phone: string;
  account_name: string;
  payment_types: string[];
  qr_code_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Order types
export interface OrderData {
  id: string;
  user_id: string;
  credits_amount: number;
  price_usd: number;
  price_mmk?: number;
  payment_method: string;
  payment_id?: string;
  payment_status?: string;
  status: string;
  promo_code?: string;
  discount_percent: number;
  screenshot_url?: string;
  notes?: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export const paymentMethodsApi = {
  // Public endpoints
  getActive: () => api.get<PaymentMethod[]>('/payment-methods/active'),
  getTypes: () => api.get<PaymentType[]>('/payment-methods/types'),
  
  // Admin endpoints
  list: (includeInactive: boolean = true) =>
    api.get<{ payment_methods: PaymentMethod[]; total: number }>('/payment-methods', {
      params: { include_inactive: includeInactive },
    }),
  create: (data: {
    phone: string;
    account_name: string;
    payment_types: string[];
    qr_code_url?: string;
    is_active?: boolean;
    display_order?: number;
  }) => api.post<PaymentMethod>('/payment-methods', data),
  update: (id: string, data: Partial<{
    phone: string;
    account_name: string;
    payment_types: string[];
    qr_code_url: string;
    is_active: boolean;
    display_order: number;
  }>) => api.patch<PaymentMethod>(`/payment-methods/${id}`, data),
  delete: (id: string) => api.delete(`/payment-methods/${id}`),
  uploadQrCode: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('qr_code', file);
    return api.post<PaymentMethod>(`/payment-methods/${id}/qr-code`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const orderApi = {
  create: (data: { 
    package_id: string; 
    payment_method: string;
    payment_method_id?: string;
    promo_code?: string;
  }) => api.post<OrderData>('/orders', data),
  list: (page: number = 1, pageSize: number = 10) => 
    api.get<{ orders: OrderData[]; total: number; page: number; page_size: number; total_pages: number }>(
      '/orders', 
      { params: { page, page_size: pageSize } }
    ),
  get: (orderId: string) => api.get<OrderData>(`/orders/${orderId}`),
  uploadScreenshot: (orderId: string, file: File) => {
    const formData = new FormData();
    formData.append('screenshot', file);
    return api.post<OrderData>(`/orders/${orderId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  cancel: (orderId: string) => api.post<OrderData>(`/orders/${orderId}/cancel`),
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

// Admin Order types
export interface AdminOrder {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  credits_amount: number;
  price_usd: number;
  price_mmk?: number;
  payment_method: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'rejected';
  screenshot_url?: string;
  promo_code?: string;
  discount_percent: number;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AdminOrderListResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OrderStats {
  status_counts: Record<string, number>;
  total_revenue_usd: number;
  total_credits_sold: number;
  total_orders: number;
}

// Admin Orders API
export const adminOrdersApi = {
  list: (params?: { 
    page?: number; 
    page_size?: number; 
    status?: string;
    search?: string;
  }) => api.get<AdminOrderListResponse>('/admin/orders', { params }),
  get: (id: string) => api.get<AdminOrder>(`/admin/orders/${id}`),
  approve: (id: string) => api.post<AdminOrder>(`/admin/orders/${id}/approve`),
  reject: (id: string, reason?: string) => 
    api.post<AdminOrder>(`/admin/orders/${id}/reject`, null, { params: { reason } }),
  stats: () => api.get<OrderStats>('/admin/orders/stats/summary'),
};

// Site Settings Types
export interface MaintenanceStatus {
  maintenance_mode: boolean;
  is_allowed: boolean;
  message?: string;
  estimated_end?: string;
}

export interface AllowedIP {
  ip: string;
  label?: string;
}

export interface SiteSettingsValue {
  value?: string;
  value_json?: any;
  description?: string;
  updated_at?: string;
}

export interface AllSettings {
  settings: Record<string, SiteSettingsValue>;
}

export interface SettingUpdate {
  key: string;
  value?: string;
  value_json?: any;
}

// Site Settings API (Public)
export const siteSettingsPublicApi = {
  getMaintenanceStatus: () => api.get<MaintenanceStatus>('/site-settings/maintenance-status'),
  getPublicSettings: () => api.get<{ settings: Record<string, string> }>('/site-settings/public'),
  getMyIP: () => api.get<{ ip: string }>('/site-settings/my-ip'),
};

// Site Settings API (Admin)
export const siteSettingsApi = {
  getAll: () => api.get<AllSettings>('/site-settings'),
  updateMultiple: (updates: SettingUpdate[]) => api.put('/site-settings', updates),
  updateSingle: (key: string, update: SettingUpdate) => api.put(`/site-settings/${key}`, update),
  // Maintenance mode allowed IPs
  addAllowedIP: (ip: string, label?: string) => 
    api.post('/site-settings/maintenance/allowed-ips', { ip, label }),
  removeAllowedIP: (ip: string) => 
    api.delete(`/site-settings/maintenance/allowed-ips/${encodeURIComponent(ip)}`),
  // Login whitelist (bypass VPN/Datacenter check)
  addLoginAllowedIP: (ip: string, label?: string) => 
    api.post('/site-settings/login/allowed-ips', { ip, label }),
  removeLoginAllowedIP: (ip: string) => 
    api.delete(`/site-settings/login/allowed-ips/${encodeURIComponent(ip)}`),
  getLoginAllowedIPs: () => 
    api.get<{ allowed_ips: Array<{ ip: string; label: string; added_by: string }> }>('/site-settings/login/allowed-ips'),
};

// Telegram Settings API (Admin)
export interface TelegramStatus {
  bot_token_configured: boolean;
  admin_chat_id: string;
  enabled: boolean;
  bot_info: { name: string; username: string } | null;
  webhook_info: { configured: boolean; url: string; pending_update_count: number; last_error?: string } | null;
}

export const telegramApi = {
  getStatus: () => api.get<TelegramStatus>('/site-settings/telegram/status'),
  updateConfig: (config: { bot_token?: string; admin_chat_id?: string; enabled?: boolean }) => 
    api.put('/site-settings/telegram/config', config),
  setWebhook: (webhookUrl: string) => 
    api.post('/site-settings/telegram/set-webhook', { webhook_url: webhookUrl }),
  deleteWebhook: () => api.delete('/site-settings/telegram/webhook'),
  testConnection: () => api.post<{ success: boolean; message: string; bot_name?: string; bot_username?: string }>('/site-settings/telegram/test'),
  sendTestMessage: () => api.post<{ success: boolean; message: string }>('/site-settings/telegram/send-test-message'),
};

// Admin Dashboard API
export interface DashboardStats {
  total_users: number;
  total_videos: number;
  total_orders: number;
  total_revenue: number;
  new_users_today: number;
  videos_today: number;
  pending_orders: number;
  users_growth: number;
  videos_growth: number;
  orders_growth: number;
  revenue_growth: number;
}

export interface RecentUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface RecentVideo {
  id: string;
  title?: string;
  source_url: string;
  user_email: string;
  status: string;
  created_at: string;
}

export const adminDashboardApi = {
  getStats: () => api.get<DashboardStats>('/admin/dashboard/stats'),
  getRecentUsers: (limit: number = 5) => api.get<RecentUser[]>('/admin/dashboard/recent-users', { params: { limit } }),
  getRecentVideos: (limit: number = 5) => api.get<RecentVideo[]>('/admin/dashboard/recent-videos', { params: { limit } }),
};

// Admin Videos API
export interface AdminVideo {
  id: string;
  title?: string;
  source_url: string;
  youtube_id?: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  status: string;
  progress_percent: number;
  output_language: string;
  voice_type: string;
  credits_used: number;
  duration_seconds?: number;
  video_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminVideoListResponse {
  videos: AdminVideo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminVideoParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  user_id?: string;
  sort_by?: string;
  sort_order?: string;
}

export const adminVideosApi = {
  list: (params?: AdminVideoParams) => api.get<AdminVideoListResponse>('/admin/videos', { params }),
  get: (id: string) => api.get<AdminVideo>(`/admin/videos/${id}`),
  update: (id: string, data: { status?: string; error_message?: string }) => api.patch<AdminVideo>(`/admin/videos/${id}`, data),
  delete: (id: string) => api.delete(`/admin/videos/${id}`),
};

// Admin Prompts API
export interface Prompt {
  id: string;
  name: string;
  key: string;
  description?: string;
  content: string;
  category: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PromptParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  is_active?: boolean;
}

export interface PromptCreate {
  name: string;
  key: string;
  description?: string;
  content: string;
  category?: string;
  is_active?: boolean;
}

export interface PromptUpdate {
  name?: string;
  description?: string;
  content?: string;
  category?: string;
  is_active?: boolean;
}

export interface PromptCategory {
  value: string;
  label: string;
}

export const adminPromptsApi = {
  getCategories: () => api.get<PromptCategory[]>('/admin/prompts/categories'),
  list: (params?: PromptParams) => api.get<PromptListResponse>('/admin/prompts', { params }),
  get: (id: string) => api.get<Prompt>(`/admin/prompts/${id}`),
  getByKey: (key: string) => api.get<Prompt>(`/admin/prompts/by-key/${key}`),
  create: (data: PromptCreate) => api.post<Prompt>('/admin/prompts', data),
  update: (id: string, data: PromptUpdate) => api.patch<Prompt>(`/admin/prompts/${id}`, data),
  toggle: (id: string) => api.post<Prompt>(`/admin/prompts/${id}/toggle`),
  delete: (id: string) => api.delete(`/admin/prompts/${id}`),
};
