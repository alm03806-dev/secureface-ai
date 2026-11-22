import { store } from '../lib/storage';
import axios from 'axios';
import { demoAdapter } from './demo';
import { IS_DEMO } from '../lib/asset';

const DEFAULT_PROD_API = 'https://secureface-api-tlwl.onrender.com';
const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? DEFAULT_PROD_API : '')).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 90000, // free backends sleep; the first request can take ~1 min
  headers: {
    'Content-Type': 'application/json',
  },
  ...(IS_DEMO ? { adapter: demoAdapter } : {}),
});

// Request interceptor to automatically attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = store.get('secureface_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid
      if (!window.location.pathname.includes('/login')) {
        store.remove('secureface_token');
        store.remove('secureface_user');
      }
    }
    return Promise.reject(error);
  }
);
