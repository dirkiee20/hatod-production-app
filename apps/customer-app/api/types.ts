 // API Response Types

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  coverImage?: string;
  logo?: string;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  deliveryFee?: number;
  isOpen?: boolean;
  isApproved?: boolean;
  operatingHours?: any;
  createdAt: string;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  type?: 'RESTAURANT' | 'GROCERY' | 'PHARMACY';
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  image?: string; // Add image field as alternative to imageUrl
  categoryId?: string;
  merchantId: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  category?: MenuCategory;
  options?: any[]; // For frontend mocked options
  merchant?: Merchant;
}

export interface MenuCategory {
  id: string;
  name: string;
  merchantId: string;
}

export interface Order {
  id: string;
  customerId: string;
  merchantId: string;
  riderId?: string;
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  deliveryAddress: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  merchant?: Merchant;
}

export interface OrderItem {  
  id: string;
  orderId: string; 
  menuItemId: string;
  quantity: number;
  price: number;
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

export interface DeliveryFeeConfig {
  id: string;
  minDistance: number;
  maxDistance: number;
  fee: number;
}

export interface DeliveryFeeEstimate {
  fee: number;
  distance: number; // in km
  duration: number; // in seconds
}
