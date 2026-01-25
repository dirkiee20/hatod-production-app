import { Platform } from 'react-native';

const API_URL = 'http://localhost:3000'; // Adjust if running on device

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
        email: 'merchant@hatod.com',
        password: 'password123',
      }),
    });

    if (!response.ok) {
      console.error('Failed to login', await response.text());
      return null;
    }

    const data = await response.json();
    authToken = data.accessToken;
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

export const API_BASE = API_URL;
