import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
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

if (__DEV__) {
  console.log('Customer App preferred API URL:', preferredApiUrl);
}

let authToken: string | null = null;
let logoutCallback: (() => void) | null = null;
const AUTH_TOKEN_KEY = 'auth_token';

const loadAuthTokenFromStorage = async () => {
  const secureToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (secureToken) return secureToken;

  // Backward compatibility for existing installs that stored token in AsyncStorage.
  const legacyToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (legacyToken) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  return legacyToken;
};

const persistAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};

const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};

export const registerLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const getAuthToken = async () => {
  if (authToken) return authToken;
  try {
    authToken = await loadAuthTokenFromStorage();
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
    await persistAuthToken(data.access_token);
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const register = async (userData: {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  email: string;
  consentGiven?: boolean;
  termsOfServiceVersion?: string;
  privacyPolicyVersion?: string;
  consentAcceptedAt?: string;
  consentAppVersion?: string;
}) => {
  const buildPayload = (data: typeof userData) => ({
    ...data,
    role: 'CUSTOMER',
  });

  const buildLegacyPayload = (data: typeof userData) => ({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    password: data.password,
    email: data.email,
    role: 'CUSTOMER',
  });

  const shouldRetryLegacyRegister = (errorText: string) => {
    const normalized = errorText.toLowerCase();
    return normalized.includes('should not exist') &&
      (normalized.includes('consent') || normalized.includes('termsofserviceversion') || normalized.includes('privacypolicyversion'));
  };

  try {
    let response = await requestWithAutoFallback('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(userData)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (shouldRetryLegacyRegister(errorText)) {
        console.warn('Register endpoint is older than app payload. Retrying with legacy payload.');
        response = await requestWithAutoFallback('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildLegacyPayload(userData)),
        });
      } else {
        console.error('Failed to register', errorText);
        throw new Error(errorText || 'Registration failed');
      }
    }

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
  await clearAuthToken();
  if (logoutCallback) logoutCallback();
};

const FETCH_TIMEOUT_MS = 12000;

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// Helper for retry logic
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  try {
    const res = await fetchWithTimeout(url, options);
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
        if (__DEV__) {
            try {
                const text = await res.clone().text();
                console.error(`[API Error Body]`, text);
            } catch (e) {
                console.error('[API Error] Could not read error body');
            }
        }
    }

    if (res.status === 401) {
        if (__DEV__) {
            console.log('Received 401 Unauthorized. Logging out automatically...');
        }
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
        if (__DEV__) {
            try {
                const text = await res.clone().text();
                console.error(`[Public API Error Body]`, text);
            } catch (e) {
                console.error('[Public API Error] Could not read error body');
            }
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
