import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '@/api/client';

const PRODUCTION_API_URL = 'https://hatod-production-app-production.up.railway.app/api';
const API_URL = PRODUCTION_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors (e.g. 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await logout();
    }
    return Promise.reject(error);
  }
);

export default api;
