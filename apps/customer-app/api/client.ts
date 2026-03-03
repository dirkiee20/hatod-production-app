import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://hatod-production-app-production.up.railway.app/api';

const normalizeApiUrl = (url: string) => {
  const normalised = url.replace(/\/+$/, '');
  return normalised.endsWith('/api') ? normalised : `${normalised}/api`;
};

const getLocalDevApiUrl = () => {
  if (!__DEV__) return null;

  // Android emulator loopback to host machine
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:3000/api';
  }

  // Expo host IP on LAN (physical device / iOS simulator)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api`;
  }

  if (Platform.OS === 'ios') {
    return 'http://localhost:3000/api';
  }

  return null;
};

const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const preferredApiUrl = envUrl
  ? normalizeApiUrl(envUrl)
  : getLocalDevApiUrl() ?? PRODUCTION_API_URL;

let currentApiUrl = preferredApiUrl;
export let API_BASE = currentApiUrl;

console.log('Customer App preferred API URL:', preferredApiUrl);

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
    const response = await requestWithAutoFallback('/auth/login', {
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
    const response = await requestWithAutoFallback('/auth/register', {
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

const fetchFromCurrentApi = async (endpoint: string, options: RequestInit): Promise<Response> => {
  return fetchWithRetry(`${currentApiUrl}${endpoint}`, options);
};

const switchToProductionApi = () => {
  if (currentApiUrl === PRODUCTION_API_URL) return;
  currentApiUrl = PRODUCTION_API_URL;
  API_BASE = currentApiUrl;
  console.warn(`[API Fallback] Switched to production API: ${currentApiUrl}`);
};

const requestWithAutoFallback = async (endpoint: string, options: RequestInit): Promise<Response> => {
  try {
    return await fetchFromCurrentApi(endpoint, options);
  } catch (error) {
    // If local dev endpoint is down/unreachable, fail over to production automatically.
    if (currentApiUrl !== PRODUCTION_API_URL) {
      switchToProductionApi();
      return fetchFromCurrentApi(endpoint, options);
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

  try {
    const res = await requestWithAutoFallback(endpoint, {
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

  try {
    const res = await requestWithAutoFallback(endpoint, {
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
