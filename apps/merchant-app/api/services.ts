import { authenticatedFetch } from './client';
import { MenuItem, Order, OrderStatus } from './types';

// Menu
export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await authenticatedFetch('/menu/items');
    if (!response.ok) {
        throw new Error('Failed to fetch menu items');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const response = await authenticatedFetch('/menu/categories');
    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Orders
export const getMerchantOrders = async (): Promise<Order[]> => {
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

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
};
export const getAvailableRiders = async (lat?: number, lng?: number): Promise<any[]> => {
    try {
        let url = '/riders/available';
        if (lat && lng) url += `?lat=${lat}&lng=${lng}`;
        
        const response = await authenticatedFetch(url);
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const assignRider = async (orderId: string, riderId: string): Promise<boolean> => {
    try {
        const response = await authenticatedFetch(`/orders/${orderId}/assign-rider`, {
            method: 'PATCH',
            body: JSON.stringify({ riderId })
        });
        if (!response.ok) {
             const error = await response.json();
             throw new Error(error.message || 'Failed to assign rider');
        }
        return true;
    } catch (e) {
        throw e; 
    }
};
