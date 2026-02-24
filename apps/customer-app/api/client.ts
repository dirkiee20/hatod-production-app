import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

// Intelligent API URL resolution
const getApiUrl = () => {
    // 1. If explicit env var is set, use it
    /*
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    */

    // 2. If running on Android during development, try to use the packager IP
    /*
    if (Platform.OS === 'android' && __DEV__) {
        // Use 10.0.2.2 for Android Emulator standard loopback
        if (!Constants.isDevice) {
            return 'http://10.0.2.2:3000';
        }

        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
             const ip = hostUri.split(':')[0];
             // Assuming backend runs on port 3000 on the same machine
             return `http://${ip}:3000`;
        }
        return 'http://10.0.2.2:3000';
    }
    */

    // 3. Default fallback (Production / iOS simulator / Web)
    return 'https://hatod-production-app-production.up.railway.app/api';
};

const API_URL = getApiUrl();
console.log('Customer App API URL:', API_URL);

let authToken: string | null = null;
let logoutCallback: (() => void) | null = null;

export const registerLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
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

export const login = async (phone: string, password: string) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/auth/login`, {
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
    const response = await fetchWithRetry(`${API_URL}/auth/register`, {
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
  if (logoutCallback) logoutCallback();
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
        console.log('Received 401 Unauthorized. Logging out automatically...');
        await logout();
    }
    
    return res;
  } catch (error) {
    console.error(`[API Network Error] ${endpoint}`, error);
    throw error;
  }
};

// Public API calls (no auth required)
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
  const baseUrl = API_BASE.replace(/\/api\/?$/, '');
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/${url}`;
};
