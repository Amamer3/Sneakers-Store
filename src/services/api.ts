import axios from 'axios';
import { checkAdminAuth } from './auth-service';

// Create axios instance with custom config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sneaker-server-7gec.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const isAdminPath = config.url?.includes('/analytics') || 
                       config.url?.includes('/metrics') || 
                       config.url?.includes('/alerts');
    
    if (isAdminPath) {
      if (!checkAdminAuth()) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return Promise.reject(new Error('Not authenticated as admin'));
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
