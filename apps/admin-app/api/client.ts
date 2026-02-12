import { Platform } from 'react-native';

// Use environment variable for API URL, fallback to localhost
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let authToken: string | null = null;

export const getAuthToken = async () => {
  if (authToken) return authToken;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@hatod.com',
        password: 'password123',
      }),
    });

    if (!response.ok) {
      console.error('Failed to login', await response.text());
      return null;
    }

    const data = await response.json();
    authToken = data.access_token;
    return authToken;
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
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
