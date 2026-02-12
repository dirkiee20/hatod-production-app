import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

// Intelligent API URL resolution
const getApiUrl = () => {
    // 1. If explicit env var is set, use it
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // 2. If running on Android during development, try to use the packager IP
    if (Platform.OS === 'android' && __DEV__) {
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
             const ip = hostUri.split(':')[0];
             // Assuming backend runs on port 3000 on the same machine
             return `http://${ip}:3000`;
        }
        // Fallback for emulator if no hostUri
        return 'http://10.0.2.2:3000';
    }

    // 3. Default fallback
    return 'http://localhost:3000';
};

const API_URL = getApiUrl();
console.log('Customer App API URL:', API_URL);

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

export const login = async (phone: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
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

export const register = async (userData: { firstName: string; lastName: string; phone: string; password: string; email: string }) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        role: 'CUSTOMER',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to register', errorText);
      throw new Error(errorText || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering:', error);
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

// Public API calls (no auth required)
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

export const resolveImageUrl = (url?: string | null) => {
    if (!url) return null;
    
    let finalUrl = url;

    // Handle relative paths
    if (!finalUrl.startsWith('http')) {
        const baseUrl = API_BASE.replace(/\/api\/?$/, '');
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

    // Fix: Android Emulator/Device cannot access 'localhost'
    if (Platform.OS === 'android') {
        // Extract host from API_BASE
        const match = API_BASE.match(/http:\/\/([^:]+):/);
        const currentHost = match ? match[1] : '10.0.2.2';

        // Replace localhost, 127.0.0.1, AND any old IP addresses with the current correct host
        finalUrl = finalUrl
            .replace('localhost', currentHost)
            .replace('127.0.0.1', currentHost)
            // Regex to catch old 10.x.x.x IPs if they differ from currentHost (simpler regex)
            .replace(/http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:/, `http://${currentHost}:`);
    }
    
    // Debug URL resolution
    console.log(`[Image] Original: ${url}, Final: ${finalUrl}`);
    
    return finalUrl;
};
