// API Response Types for Admin App

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
  RIDER = 'RIDER',
}

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  logo?: string;
  coverImage?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  deliveryFee?: number;
  isActive: boolean;
  isOpen?: boolean;
  isApproved: boolean;
  totalOrders?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
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
  orderNumber?: string;
  customerId: string;
  merchantId: string;
  riderId?: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  merchant?: Merchant;
  customer?: User;
  rider?: User;
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
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface DashboardStats {
  totalRevenue: number;
  activeOrders: number;
  totalUsers: number;
  totalMerchants: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'order' | 'merchant' | 'user' | 'rider';
  message: string;
  time: string;
  createdAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  currentLatitude?: number;
  currentLongitude?: number;
  user: User;
  orders: { id: string; status: OrderStatus; merchant: { name: true } }[];
}

export interface DeliveryFeeConfig {
  id: string;
  minDistance: number;
  maxDistance: number;
  fee: number;
  createdAt: string;
  updatedAt: string;
}
