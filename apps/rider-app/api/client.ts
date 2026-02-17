import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Intelligent API URL resolution
const getApiUrl = () => {
    // 3. Default fallback (Production / iOS simulator / Web)
    return 'https://hatod-production-app-production.up.railway.app/api';
};

const API_URL = getApiUrl();
console.log('Rider App API URL:', API_URL);

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
        role: 'RIDER',
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

export const getMe = async () => {
  try {
    const response = await authenticatedFetch('/users/me');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get profile', errorText);
      throw new Error(errorText || 'Failed to get profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
};

export const updateRiderStatus = async (status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
  try {
    const response = await authenticatedFetch('/riders/status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update status', errorText);
      throw new Error(errorText || 'Failed to update status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};

export const updateRiderLocation = async (latitude: number, longitude: number) => {
  try {
    const response = await authenticatedFetch('/riders/location', {
      method: 'PATCH',
      body: JSON.stringify({ lat: latitude, lng: longitude }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update location', errorText);
      throw new Error(errorText || 'Failed to update location');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

export const getRiderOrders = async () => {
  try {
    const response = await authenticatedFetch('/orders');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get orders', errorText);
      throw new Error(errorText || 'Failed to get orders');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting orders:', error);
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
