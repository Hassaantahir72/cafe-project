import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cafe_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthRoute = window.location.pathname.startsWith('/auth');
      if (!isAuthRoute) {
        localStorage.removeItem('cafe_token');
        localStorage.removeItem('cafe_user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:          (data: any)    => api.post('/auth/register', data),
  verifyOTP:         (data: any)    => api.post('/auth/verify-otp', data),
  resendOTP:         (email: string)=> api.post('/auth/resend-otp', { email }),
  login:             (data: any)    => api.post('/auth/login', data),
  logout:            ()             => api.post('/auth/logout'),
  forgotPassword:    (email: string)=> api.post('/auth/forgot-password', { email }),
  resetPassword:     (data: any)    => api.post('/auth/reset-password', data),
  me:                ()             => api.get('/auth/me'),
  update:            (data: any)    => api.put('/auth/me', data),
  getSessions:       ()             => api.get('/auth/sessions'),
  revokeAllSessions: ()             => api.post('/auth/revoke-all-sessions'),
};

// ── Menu ──────────────────────────────────────────────────────────────────────
export const menuAPI = {
  getCategories: ()                         => api.get('/menu/categories'),
  getItems:      (params?: any)             => api.get('/menu/items', { params }),
  getItem:       (id: string)               => api.get(`/menu/items/${id}`),
  addReview:     (id: string, data: any)    => api.post(`/menu/items/${id}/reviews`, data),
  createItem:    (data: any)                => api.post('/menu/items', data),
  updateItem:    (id: string, data: any)    => api.put(`/menu/items/${id}`, data),
  deleteItem:    (id: string)               => api.delete(`/menu/items/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersAPI = {
  place:        (data: any)                    => api.post('/orders', data),
  track:        (orderNumber: string)          => api.get(`/orders/track/${orderNumber}`),
  myOrders:     ()                             => api.get('/orders/my'),
  getAll:       (params?: any)                 => api.get('/orders', { params }),
  updateStatus: (id: string, status: string)   => api.patch(`/orders/${id}/status`, { status }),
};

// ── Reservations ──────────────────────────────────────────────────────────────
export const reservationsAPI = {
  checkAvailability: (params: any)             => api.get('/reservations/availability', { params }),
  book:              (data: any)               => api.post('/reservations', data),
  lookup:            (code: string)            => api.get(`/reservations/lookup/${code}`),
  myReservations:    ()                        => api.get('/reservations/my'),
  cancel:            (id: string)              => api.patch(`/reservations/${id}/cancel`),
  getAll:            (params?: any)            => api.get('/reservations', { params }),
  updateStatus:      (id: string, status: string) => api.patch(`/reservations/${id}/status`, { status }),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (messages: any[], sessionId: string) => api.post('/chat', { messages, sessionId }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats:              ()                        => api.get('/admin/stats'),
  getAuditLogs:       (params?: any)            => api.get('/admin/audit-logs', { params }),
  getStaff:           ()                        => api.get('/admin/staff'),
  addStaff:           (data: any)               => api.post('/admin/staff', data),
  updateStaff:        (id: string, data: any)   => api.put(`/admin/staff/${id}`, data),
  deleteStaff:        (id: string)              => api.delete(`/admin/staff/${id}`),
  getCustomers:       (params?: any)            => api.get('/admin/customers', { params }),
  getTables:          ()                        => api.get('/admin/tables'),
  addTable:           (data: any)               => api.post('/admin/tables', data),
  updateTable:        (id: string, data: any)   => api.put(`/admin/tables/${id}`, data),
  deleteTable:        (id: string)              => api.delete(`/admin/tables/${id}`),
  getActiveSessions:  ()                        => api.get('/admin/active-sessions'),
  revokeSession:      (jti: string)             => api.delete(`/admin/sessions/${jti}`),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsAPI = {
  get:    ()           => api.get('/settings'),
  update: (data: any)  => api.put('/settings', data),
};
