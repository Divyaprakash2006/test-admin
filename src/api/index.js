import axios from 'axios';

// Detect if running as a Capacitor native app
const isNative = window.location.protocol === 'capacitor:';

// Final Production URL for Render
const RENDER_API_URL = 'https://test-backend-8l27.onrender.com/api';

const API_BASE_URL = isNative
  ? RENDER_API_URL
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api' : RENDER_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
