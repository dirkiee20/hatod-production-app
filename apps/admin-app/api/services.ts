import { authenticatedFetch, publicFetch } from './client';
import { Merchant, Order, User, DashboardStats } from './types';

// Merchant APIs
export const getMerchants = async (): Promise<Merchant[]> => {
  try {
    const response = await authenticatedFetch('/merchants/admin/list');
    if (!response.ok) {
      throw new Error(`Failed to fetch merchants: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return [];
  }
};

export const approveMerchant = async (id: string): Promise<boolean> => {
    try {
        const response = await authenticatedFetch(`/merchants/${id}/approve`, {
            method: 'PATCH'
        });
        return response.ok;
    } catch (error) {
        console.error('Error approving merchant:', error);
        return false;
    }
}

export const suspendMerchant = async (id: string): Promise<boolean> => {
    try {
        const response = await authenticatedFetch(`/merchants/${id}/suspend`, {
            method: 'PATCH'
        });
        return response.ok;
    } catch (error) {
        console.error('Error suspending merchant:', error);
        return false;
    }
}


export const approveMenuItem = async (id: string): Promise<boolean> => {
    try {
        const response = await authenticatedFetch(`/merchants/menu-items/${id}/approve`, {
            method: 'PATCH'
        });
        return response.ok;
    } catch (error) {
        console.error('Error approving menu item:', error);
        return false;
    }
}

export const disapproveMenuItem = async (id: string): Promise<boolean> => {
    try {
        // The PATCH /menu/items/:id endpoint accepts isApproved in the body
        const response = await authenticatedFetch(`/menu/items/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isApproved: false }),
        });
        return response.ok;
    } catch (error) {
        console.error('Error disapproving menu item:', error);
        return false;
    }
}

export const getMerchantById = async (id: string): Promise<Merchant | null> => {
  try {
    const response = await authenticatedFetch(`/merchants/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch merchant');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching merchant:', error);
    return null;
  }
};

// Order APIs
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const response = await authenticatedFetch('/orders/admin/list');
    if (!response.ok) {
        // If 403 or similar, it might be because the user is not authorized or no orders found
        if (response.status === 404) return [];
        throw new Error('Failed to fetch orders');
    }
    const data = await response.json();
    return data.map((order: any) => ({
        ...order,
        totalAmount: order.total ?? order.totalAmount ?? 0,
        customer: order.customer ? { 
            ...order.customer, 
            name: order.customer.firstName && order.customer.lastName
                ? `${order.customer.firstName} ${order.customer.lastName}`
                : order.customer.name || 'Guest'
        } : null
    }));
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

// User APIs
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await authenticatedFetch('/users/me');
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    const data = await response.json();
    return mapUser(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await authenticatedFetch('/users');
    if (!response.ok) {
       throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.map(mapUser);
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

const mapUser = (u: any): User => {
    let name = 'Unknown';
    if (u.customer) name = `${u.customer.firstName} ${u.customer.lastName}`;
    else if (u.merchant) name = u.merchant.name;
    else if (u.rider) name = `${u.rider.firstName} ${u.rider.lastName}`;
    else if (u.admin) name = `${u.admin.firstName} ${u.admin.lastName}`;
    
    return {
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt || u.createdAt, // Fallback
        name
    };
};

// Dashboard Stats (Calculated on client side for now as no endpoint exists)
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const [orders, merchants, users] = await Promise.all([
            getAllOrders(),
            getMerchants(),
            getUsers()
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const activeOrders = orders.filter(o => ['PENDING', 'PREPARING', 'READY', 'PICKED_UP'].includes(o.status)).length;
        
        // Mocking recent activity for now based on orders
        const recentActivity = orders.slice(0, 5).map(order => ({
            id: order.id,
            type: 'order' as const,
            message: `New order from ${order.merchant?.name || 'Restaurant'}`,
            time: new Date(order.createdAt).toLocaleTimeString(),
            createdAt: order.createdAt
        }));

        return {
            totalRevenue,
            activeOrders,
            totalUsers: users.length,
            totalMerchants: merchants.length,
            recentActivity
        };
    } catch (error) {
        console.error("Error calculating dashboard stats", error);
        return {
            totalRevenue: 0,
            activeOrders: 0,
            totalUsers: 0,
            totalMerchants: 0,
            recentActivity: []
        };
    }
}

// Rider APIs
export const getRiders = async (): Promise<any[]> => {
  try {
    const response = await authenticatedFetch('/riders/admin/list');
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch riders: ${response.status} ${text}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching riders detailed:', error);
    return [];
  }
};

// Delivery Fee APIs
export const getDeliveryFeeConfigs = async (): Promise<any[]> => {
  try {
    const response = await authenticatedFetch('/delivery-fee');
    if (!response.ok) throw new Error('Failed to fetch delivery fees');
    return await response.json();
  } catch (error) {
    console.error('Error fetching delivery fees:', error);
    return [];
  }
};

export const createDeliveryFeeConfig = async (data: any): Promise<boolean> => {
  try {
    const response = await authenticatedFetch('/delivery-fee', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (error) {
    console.error('Error creating delivery fee:', error);
    return false;
  }
};

export const updateDeliveryFeeConfig = async (id: string, data: any): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(`/delivery-fee/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating delivery fee:', error);
    return false;
  }
};

export const deleteDeliveryFeeConfig = async (id: string): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(`/delivery-fee/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting delivery fee:', error);
    return false;
  }
};

export const updateMerchantType = async (id: string, type: 'RESTAURANT' | 'GROCERY' | 'PHARMACY'): Promise<boolean> => {
  try {
    const response = await authenticatedFetch(`/merchants/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating merchant type:', error);
    return false;
  }
};
