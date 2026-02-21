// API Response Types

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  type?: 'RESTAURANT' | 'GROCERY' | 'PHARMACY';
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  image?: string;
  categoryId?: string;
  merchantId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  category?: MenuCategory;
}

export interface MenuCategory {
  id: string;
  name: string;
  merchantId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  merchantId: string;
  riderId?: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer?: {
      firstName: string;
      lastName: string;
  };
  address?: {
      street: string;
      city: string;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  menuItem?: MenuItem;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
