import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token from cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized (401) responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          Cookies.remove('token');
          Cookies.remove('role');
          Cookies.remove('user_name');
          Cookies.remove('user_email');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
