import axios from 'axios';

/**
 * Axios instance with default configuration
 * يتم إعداد Axios للتواصل مع الـ Backend
 */
const api = axios.create({
  baseURL: '/api', // Vite proxy سيحول هذا إلى http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add auth token
 * يضيف الـ token تلقائياً لكل طلب
 */
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

/**
 * Response interceptor to handle errors
 * يتعامل مع الأخطاء بشكل موحد
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
