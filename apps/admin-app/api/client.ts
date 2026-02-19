import { Platform } from 'react-native';

// Use environment variable for API URL, fallback to production
const API_URL = 'https://hatod-production-app-production.up.railway.app/api';

import AsyncStorage from '@react-native-async-storage/async-storage';

let logoutCallback: (() => void) | null = null;

let authToken: string | null = null;

export const registerLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Helper for retry logic
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Network Retry] ${url} failed. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};

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
    const response = await fetchWithRetry(`${API_URL}/auth/login`, {
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
  if (logoutCallback) logoutCallback();
};

export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;

  const url = `${API_URL}${endpoint}`;
  try {
    const res = await fetchWithRetry(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
        console.error(`[API Error] ${endpoint} failed with status ${res.status}`);
        try {
            const text = await res.clone().text();
            console.error(`[API Error Body]`, text);
        } catch (e) {
            console.error('[API Error] Could not read error body');
        }
    }

    if (res.status === 401) {
      console.log('Received 401, logging out...');
      await logout();
    }
    
    return res;
  } catch (error) {
    console.error(`[API Network Error] ${endpoint}`, error);
    throw error;
  }
};

export const publicFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as HeadersInit;

  const url = `${API_URL}${endpoint}`;
  try {
    const res = await fetchWithRetry(url, {
      ...options,
      headers,
    });
    
    if (!res.ok) {
        console.error(`[Public API Error] ${endpoint} failed with status ${res.status}`);
        try {
            const text = await res.clone().text();
            console.error(`[Public API Error Body]`, text);
        } catch (e) {
            console.error('[Public API Error] Could not read error body');
        }
    }

    return res;
  } catch (error) {
    console.error(`[Public API Network Error] ${endpoint}`, error);
    throw error;
  }
};

export const API_BASE = API_URL;

export const resolveImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;

  // Cloudinary and other absolute https:// URLs — return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Handle legacy relative paths (e.g. /uploads/filename.jpg stored in old records)
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/${url}`;
};

