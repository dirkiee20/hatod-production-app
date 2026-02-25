// API client for gov merchant web
const API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.REACT_APP_API_URL ||
  'http://localhost:3000/api';

let authToken: string | null = localStorage.getItem('gov_merchant_token');

export const getApiUrl = () => API_URL;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('gov_merchant_token', token);
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('gov_merchant_token');
};

export const register = async (email: string, password: string, firstName: string, lastName: string, phone: string, merchantName?: string) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      phone,
      merchantName,
      role: 'MERCHANT',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  const data = await response.json();
  return data;
};

export const login = async (phone: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  return data;
};

export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  } as HeadersInit;

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    window.location.href = '/login';
  }

  return response;
};

export const getProfile = async () => {
  const response = await authenticatedFetch('/users/me');
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
};

export const updateMerchant = async (merchantId: string, data: any) => {
  const response = await authenticatedFetch(`/merchants/${merchantId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update merchant');
  }
  return response.json();
};
