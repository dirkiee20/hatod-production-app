import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_URL = 'https://hatod-production-app-production.up.railway.app/api';

console.log('[RiderService] Initialized with API URL:', API_URL);

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (e) {
    console.error('[RiderService] Failed to load auth token', e);
    return null;
  }
};

const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;

  const url = `${API_URL}${endpoint}`;
  console.log(`[RiderService] Fetching: ${url}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    return res;
  } catch (error) {
    console.error(`[RiderService] Fetch error for ${url}:`, error);
    throw error;
  }
};

export const updateRiderStatus = async (status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
  try {
    console.log(`[RiderService] Updating status to ${status}`);
    const response = await authenticatedFetch('/riders/status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RiderService] Failed to update status:', response.status, errorText);
      throw new Error(errorText || 'Failed to update status');
    }

    return await response.json();
  } catch (error) {
    console.error('[RiderService] Error updating status:', error);
    throw error;
  }
};

export const updateRiderLocation = async (lat: number, lng: number) => {
  try {
    console.log(`[RiderService] Updating location to ${lat}, ${lng}`);
    const response = await authenticatedFetch('/riders/location', {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }), // Note: backend expects lat/lng
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RiderService] Failed to update location:', response.status, errorText);
      throw new Error(errorText || 'Failed to update location');
    }

    return await response.json();
  } catch (error) {
    console.error('[RiderService] Error updating location:', error);
    throw error;
  }
};

export const getRiderOrders = async () => {
  try {
    const response = await authenticatedFetch('/orders');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RiderService] Failed to get orders:', response.status, errorText);
      throw new Error(errorText || 'Failed to get orders');
    }

    return await response.json();
  } catch (error) {
    console.error('[RiderService] Error getting orders:', error);
    throw error;
  }
};

export const getOrderDetails = async (id: string) => {
  try {
    const response = await authenticatedFetch(`/orders/${id}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RiderService] Failed to get order details:', response.status, errorText);
      throw new Error(errorText || 'Failed to get order details');
    }

    return await response.json();
  } catch (error) {
    console.error('[RiderService] Error getting order details:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, status: string) => {
  try {
    const response = await authenticatedFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RiderService] Failed to update order status:', response.status, errorText);
      throw new Error(errorText || 'Failed to update order status');
    }

    return await response.json();
  } catch (error) {
    console.error('[RiderService] Error updating order status:', error);
    throw error;
  }
};

export const claimOrder = async (id: string) => {
  try {
    const response = await authenticatedFetch(`/orders/${id}/claim`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RiderService] Failed to claim order:', response.status, errorText);
      throw new Error(errorText || 'Failed to claim order');
    }

    return await response.json();
  } catch (error) {
    console.error('[RiderService] Error claiming order:', error);
    throw error;
  }
};
