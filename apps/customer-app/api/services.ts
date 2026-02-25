import { publicFetch, authenticatedFetch } from './client';
import { Merchant, MenuItem, Order } from './types';

// Merchant APIs
export const getMerchants = async (): Promise<Merchant[]> => {
  try {
    const response = await publicFetch('/merchants');
    if (!response.ok) {
      throw new Error('Failed to fetch merchants');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return [];
  }
};

export const getGovMerchant = async (): Promise<Merchant | null> => {
  try {
    const response = await publicFetch('/merchants/gov/services');
    if (!response.ok) {
      throw new Error('Failed to fetch gov merchant');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching gov merchant:', error);
    return null;
  }
};

// User Profile API
export const getProfile = async () => {
  try {
    const response = await authenticatedFetch('/users/me');
    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

export const getMerchantById = async (id: string): Promise<Merchant | null> => {
  try {
    const response = await publicFetch(`/merchants/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch merchant');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching merchant:', error);
    return null;
  }
};

// Menu APIs
export const getMenuItemsByMerchant = async (merchantId: string): Promise<MenuItem[]> => {
  try {
    const response = await publicFetch(`/menu/merchant/${merchantId}/items`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

export const getMenuItemById = async (id: string): Promise<MenuItem | null> => {
  try {
    const response = await publicFetch(`/menu/public/items/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu item');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
};

// Order APIs
export const createOrder = async (orderData: {
  merchantId: string;
  addressId: string;
  items: { menuItemId: string; quantity: number; notes?: string }[];
  specialInstructions?: string;
}): Promise<Order | null> => {
  try {
    const response = await authenticatedFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

export const getMyOrders = async (): Promise<Order[]> => {
  try {
    const response = await authenticatedFetch('/orders');
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const response = await authenticatedFetch(`/orders/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

// Cart APIs
export const getCart = async (): Promise<any> => {
  try {
    const response = await authenticatedFetch('/cart');
    if (!response.ok) throw new Error('Failed to fetch cart');
    return await response.json();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

export const addToCartItem = async (menuItemId: string, quantity: number, options?: any) => {
  try {
    const response = await authenticatedFetch('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ menuItemId, quantity, options }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Add to cart failed:', errorText);
        throw new Error('Failed to add to cart');
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding to cart:', error);
    return null;
  }
};

export const updateCartItem = async (itemId: string, quantity: number) => {
  try {
    const response = await authenticatedFetch(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart item');
    return await response.json();
  } catch (error) {
    console.error('Error updating cart item:', error);
    return null;
  }
};

export const removeCartItem = async (itemId: string) => {
  try {
    const response = await authenticatedFetch(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove cart item');
    return await response.json();
  } catch (error) {
    console.error('Error removing cart item:', error);
    return null;
  }
};

export const clearCartItems = async () => {
  try {
    const response = await authenticatedFetch('/cart', {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear cart');
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

// Address API
export const getAddresses = async () => {
  const response = await authenticatedFetch('/addresses');
  if (!response.ok) {
      throw new Error('Failed to fetch addresses');
  }
  return response.json();
};

export const createAddress = async (addressData: any) => {
  const response = await authenticatedFetch('/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
  if (!response.ok) {
      throw new Error('Failed to create address');
  }
  return response.json();
};

// Directions API
export const getRoute = async (start: [number, number], end: [number, number]): Promise<any> => {
  try {
    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${token}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry;
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

// Mapbox API
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    console.log('[reverseGeocode] Starting reverse geocode for:', { latitude, longitude });
    
    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    console.log('[reverseGeocode] Mapbox token exists:', !!token);
    console.log('[reverseGeocode] Mapbox token value:', token);
    
    if (!token) {
      console.error('[reverseGeocode] No Mapbox access token found!');
      return null;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`;
    console.log('[reverseGeocode] Request URL:', url);
    
    console.log('[reverseGeocode] Fetching from Mapbox API...');
    const response = await fetch(url);
    
    console.log('[reverseGeocode] Response status:', response.status);
    console.log('[reverseGeocode] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[reverseGeocode] API error response:', errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('[reverseGeocode] API response data:', JSON.stringify(data, null, 2));
    
    if (data.features && data.features.length > 0) {
      const placeName = data.features[0].place_name;
      console.log('[reverseGeocode] Address found:', placeName);
      return placeName;
    }
    
    console.log('[reverseGeocode] No features found in response');
    return null;
  } catch (error) {
    console.error('[reverseGeocode] Exception caught:', error);
    console.error('[reverseGeocode] Error details:', JSON.stringify(error, null, 2));
    return null;
  }
};
// Review API
export const createReview = async (orderId: string, rating: number, comment?: string) => {
  try {
    const response = await authenticatedFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify({ orderId, rating, comment }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to submit review');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getDeliveryFeeEstimate = async (origin: { lat: number, lng: number }, destination: { lat: number, lng: number }, subtotal: number): Promise<{ fee: number, distance: number, duration: number } | null> => {
  try {
    const params = new URLSearchParams({
      originLat: origin.lat.toString(),
      originLng: origin.lng.toString(),
      destLat: destination.lat.toString(),
      destLng: destination.lng.toString(),
      subtotal: subtotal.toString(),
    });

    const response = await authenticatedFetch(`/delivery-fee/estimate?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to estimate fee');
    
    return await response.json();
  } catch (error) {
    console.error('Error estimating delivery fee:', error);
    return null;
  }
};

// Pabili Requests API
export const createPabiliRequest = async (items: string[], estimatedItemCost: number): Promise<any> => {
  try {
    const response = await authenticatedFetch('/pabili-requests', {
      method: 'POST',
      body: JSON.stringify({ items, estimatedItemCost }),
    });
    if (!response.ok) throw new Error('Failed to create pabili request');
    return await response.json();
  } catch (error) {
    console.error('Error creating pabili request:', error);
    throw error;
  }
};

export const getMyPabiliRequests = async (): Promise<any[]> => {
  try {
    const response = await authenticatedFetch('/pabili-requests/customer');
    if (!response.ok) throw new Error('Failed to fetch pabili requests');
    return await response.json();
  } catch (error) {
    console.error('Error fetching pabili requests:', error);
    return [];
  }
};

export const getPabiliRequestById = async (id: string): Promise<any> => {
  try {
    const response = await authenticatedFetch(`/pabili-requests/${id}`);
    if (!response.ok) throw new Error('Failed to fetch pabili request');
    return await response.json();
  } catch (error) {
    console.error('Error fetching pabili request:', error);
    return null;
  }
};
