import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const PRODUCTION_API_URL = 'https://hatod-production-app-production.up.railway.app/api';
const currentApiUrl = PRODUCTION_API_URL;
export const API_BASE = PRODUCTION_API_URL;
export const NETWORK_UNAVAILABLE_MESSAGE = 'No internet connection. Please turn on mobile data or Wi-Fi and try again.';

let authToken: string | null = null;
let logoutCallback: (() => void) | null = null;
const AUTH_TOKEN_KEY = 'auth_token';
const REQUEST_TIMEOUT_MESSAGE = 'Request timed out. Please check your internet connection and try again.';
const DEFAULT_REQUEST_ERROR_MESSAGE = 'Something went wrong. Please try again.';

class ClientError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ClientError';
    this.status = status;
  }
}

const getErrorText = async (response: Response): Promise<string> => {
  try {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const payload = await response.clone().json();
      const message = payload?.message;

      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
      if (typeof payload?.error === 'string') return payload.error;
    }

    return await response.clone().text();
  } catch {
    return '';
  }
};

const includesAny = (message: string, needles: string[]) =>
  needles.some((needle) => message.includes(needle));

const isTimeoutError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return error.name === 'AbortError' || includesAny(msg, ['timeout', 'timed out', 'aborted']);
};

const isNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return includesAny(msg, [
    'network request failed',
    'failed to fetch',
    'fetch failed',
    'network error',
    'socket hang up',
    'enotfound',
    'econnrefused',
    'econnreset',
  ]);
};

const normalizeClientError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof ClientError) return error;
  if (isTimeoutError(error)) return new ClientError(REQUEST_TIMEOUT_MESSAGE);
  if (isNetworkError(error)) return new ClientError(NETWORK_UNAVAILABLE_MESSAGE);
  return new ClientError(fallbackMessage || DEFAULT_REQUEST_ERROR_MESSAGE);
};

const mapLoginErrorMessage = (status: number, rawError: string): string => {
  const msg = rawError.toLowerCase();

  if (status === 400 || status === 401 || msg.includes('invalid credentials')) {
    return 'Invalid phone number or password.';
  }
  if (status === 403 || msg.includes('deactivated')) {
    return 'Your account is deactivated. Please contact support.';
  }
  if (status === 429) {
    return 'Too many login attempts. Please try again later.';
  }
  if (status >= 500) {
    return 'Server is currently unavailable. Please try again later.';
  }
  return 'Unable to log in right now. Please try again.';
};

const mapRegisterErrorMessage = (status: number, rawError: string): string => {
  const msg = rawError.toLowerCase();

  if (status === 409 || msg.includes('already exists')) {
    return 'This phone number is already registered.';
  }
  if (status === 400) {
    if (msg.includes('consent') || msg.includes('terms') || msg.includes('privacy')) {
      return 'Please agree to Terms of Service and Privacy Policy to continue.';
    }
    if (msg.includes('phone')) {
      return 'Please enter a valid phone number.';
    }
    if (msg.includes('password')) {
      return 'Please enter a valid password.';
    }
    return 'Please check your details and try again.';
  }
  if (status === 429) {
    return 'Too many signup attempts. Please try again later.';
  }
  if (status >= 500) {
    return 'Server is currently unavailable. Please try again later.';
  }
  return 'Unable to sign up right now. Please try again.';
};

export const getFriendlyErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_REQUEST_ERROR_MESSAGE,
): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
};

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

export const login = async (
  phone: string,
  password: string,
  options?: { rememberMe?: boolean },
) => {
  const rememberMe = options?.rememberMe ?? true;

  try {
    const response = await requestApi('/auth/login', {
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
      const errorText = await getErrorText(response);
      console.error('Failed to login', errorText);
      throw new ClientError(mapLoginErrorMessage(response.status, errorText), response.status);
    }

    const data = await response.json();
    authToken = data.access_token;
    if (rememberMe) {
      await persistAuthToken(data.access_token);
    } else {
      // Session-only sign in: keep token in memory but clear persisted storage.
      await clearAuthToken();
    }
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw normalizeClientError(error, 'Unable to log in right now. Please try again.');
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
    let response = await requestApi('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(userData)),
    });

    if (!response.ok) {
      const errorText = await getErrorText(response);
      if (shouldRetryLegacyRegister(errorText)) {
        console.warn('Register endpoint is older than app payload. Retrying with legacy payload.');
        response = await requestApi('/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildLegacyPayload(userData)),
        });
      } else {
        console.error('Failed to register', errorText);
        throw new ClientError(
          mapRegisterErrorMessage(response.status, errorText),
          response.status,
        );
      }
    }

    if (!response.ok) {
      const errorText = await getErrorText(response);
      console.error('Failed to register', errorText);
      throw new ClientError(
        mapRegisterErrorMessage(response.status, errorText),
        response.status,
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering:', error);
    throw normalizeClientError(error, 'Unable to sign up right now. Please try again.');
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

const requestApi = async (endpoint: string, options: RequestInit): Promise<Response> => {
  return fetchFromCurrentApi(endpoint, options);
};

export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;

  try {
    const res = await requestApi(endpoint, {
      ...options,
      headers,
    });
    
    if (!res.ok) {
        console.error(`[API Error] ${endpoint} failed with status ${res.status}`);
        if (__DEV__) {
            try {
                const text = await res.clone().text();
                console.error(`[API Error Body]`, text);
            } catch {
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
    throw normalizeClientError(error, DEFAULT_REQUEST_ERROR_MESSAGE);
  }
};

// Public API calls (no auth required)
export const publicFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  } as HeadersInit;

  try {
    const res = await requestApi(endpoint, {
        ...options,
        headers,
    });
      
    if (!res.ok) {
        console.error(`[Public API Error] ${endpoint} failed with status ${res.status}`);
        if (__DEV__) {
            try {
                const text = await res.clone().text();
                console.error(`[Public API Error Body]`, text);
            } catch {
                console.error('[Public API Error] Could not read error body');
            }
        }
    }
    
    return res;
  } catch (error) {
    console.error(`[Public API Network Error] ${endpoint}`, error);
    throw normalizeClientError(error, DEFAULT_REQUEST_ERROR_MESSAGE);
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
