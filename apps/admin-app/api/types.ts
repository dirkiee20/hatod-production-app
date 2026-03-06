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
  type?: 'RESTAURANT' | 'GROCERY' | 'PHARMACY' | 'GOVERNMENT';
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
  subtotal?: number;
  total?: number;
  totalAmount: number;
  deliveryFee: number;
  tax?: number;
  deliveryAddress: string;
  paymentMethod?: 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  merchant?: Merchant;
  customer?: User & {
    firstName?: string;
    lastName?: string;
    user?: { phone?: string; email?: string };
  };
  rider?: User & {
    firstName?: string;
    lastName?: string;
    vehicleNumber?: string;
    vehicleType?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  quantity: number;
  price: number;
  notes?: string;
  options?: any;
  menuItem?: MenuItem;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  DELIVERING = 'DELIVERING',
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

export interface DeliveryFeeTier {
  id: string;
  configId: string;
  minOrderAmount: number;
  maxOrderAmount: number | null;
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryFeeConfig {
  id: string;
  minDistance: number;
  maxDistance: number;
  baseFee: number | null;
  tiers: DeliveryFeeTier[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodCategorySetting {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

