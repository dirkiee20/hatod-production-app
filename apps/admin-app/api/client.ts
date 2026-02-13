import { Platform } from 'react-native';

// Use environment variable for API URL, fallback to production
const API_URL = 'https://hatod-production-app-production.up.railway.app/api';

import AsyncStorage from '@react-native-async-storage/async-storage';

let authToken: string | null = null;

export const getAuthToken = async () => {
  if (authToken) return authToken;
  try {
    authToken = await AsyncStorage.getItem('auth_token');
  } catch (e) {
    console.error('Failed to load auth token', e);
  }
  return authToken;
};

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to login', errorText);
      throw new Error(errorText || 'Login failed');
    }

    const data = await response.json();
    authToken = data.access_token;
    await AsyncStorage.setItem('auth_token', data.access_token);
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logout = async () => {
  authToken = null;
  await AsyncStorage.removeItem('auth_token');
};

export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  return res;
};

export const publicFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as HeadersInit;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  return res;
};

export const API_BASE = API_URL;

export const resolveImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  let finalUrl = url;

  // Handle relative paths
  if (!finalUrl.startsWith('http')) {
      const baseUrl = API_URL.replace(/\/api\/?$/, ''); // Remove /api suffix
      if (finalUrl.startsWith('/')) {
          finalUrl = `${baseUrl}${finalUrl}`;
      } else {
          finalUrl = `${baseUrl}/${finalUrl}`;
      }
  }

  // Fix: Backend serves static files at /uploads, but API might be at /api
  // If URL was constructed with API_BASE containing /api, strip it for uploads
  if (finalUrl.includes('/api/uploads/')) {
    finalUrl = finalUrl.replace(/\/api\/uploads\//, '/uploads/');
  }

  // Fix: Android Emulator cannot access 'localhost'
  if (Platform.OS === 'android' && finalUrl.includes('localhost')) {
    finalUrl = finalUrl.replace('localhost', '10.0.2.2');
  }
  return finalUrl;
};
