import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface CartItem {
  id: string; // Unique ID for the cart item instance (e.g. random UUID)
  menuItemId: string;
  merchantId: string;
  storeName?: string;
  deliveryFee?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  // Flexible options: keyed by group name → string (radio) or string[] (checkbox)
  // Also supports legacy { size, addons, instructions } shape from older code
  options?: Record<string, any>;
  totalPrice: number; // calculated as (base + options) * quantity
}

export interface DeliveryAddress {
  id: string;
  label: string;
  street: string;
  instructions?: string;
  latitude?: number;
  longitude?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  deliveryFee: number;
  deliveryAddress: DeliveryAddress | null;
  setDeliveryAddress: (address: DeliveryAddress | null) => void;
  refreshCart: () => Promise<void>;
}

import { getCart, addToCartItem, updateCartItem, removeCartItem, clearCartItems, getDeliveryFeeEstimate, getMerchantById } from '@/api/services';
import { resolveImageUrl } from '@/api/client';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(50); // Default fee

  const refreshCart = async () => {
    const token = await import('@/api/client').then(m => m.getAuthToken());
    if (!token) {
        setItems([]);
        return;
    }
    const cartData = await getCart();
    if (cartData && cartData.items) {
      // Map backend structure to frontend structure
      const mappedItems: CartItem[] = cartData.items.map((ci: any) => ({
        id: ci.id,
        menuItemId: ci.menuItemId,
        merchantId: ci.menuItem.merchantId,
        storeName: ci.menuItem?.merchant?.name,
        deliveryFee: 50, // Hardcoded or from backend
        name: ci.menuItem.name,
        price: ci.menuItem.price,
        quantity: ci.quantity,
        image: resolveImageUrl(ci.menuItem.image || ci.menuItem.imageUrl), // Resolve URL
        options: ci.options || {},
        totalPrice: ci.menuItem.price * ci.quantity, // Simple calculation ignoring option prices for now
      }));
      setItems(mappedItems);
    } else {
        setItems([]);
    }
  };

  // Load cart from server on mount
  useEffect(() => {
    refreshCart();

    // Auto-detect location for estimated fee if no address set
    (async () => {
        if (!deliveryAddress) {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    const { latitude, longitude } = location.coords;

                    // Reverse geocode to get a human-readable address
                    let streetAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                    try {
                        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
                        if (place) {
                            const parts = [
                                place.streetNumber,
                                place.street,
                                place.district ?? place.subregion,
                                place.city ?? place.region,
                            ].filter(Boolean);
                            if (parts.length > 0) streetAddress = parts.join(', ');
                        }
                    } catch (geoErr) {
                        console.log('Reverse geocode failed, using coords', geoErr);
                    }

                    setDeliveryAddress({
                        id: 'temp-current',
                        label: 'Current Location',
                        street: streetAddress,
                        latitude,
                        longitude,
                    });
                }
            } catch (e) {
                console.log('Failed to auto-detect location for cart estimate', e);
            }
        }
    })();
  }, []);

  // Calculate delivery fee when address or items change
  useEffect(() => {
    const calculateFee = async () => {
      if (!deliveryAddress || !deliveryAddress.latitude || !deliveryAddress.longitude || items.length === 0) {

        setDeliveryFee(50); // Fallback to default
        return;
      }

      // Assume all items from same merchant for now
      const merchantId = items[0].merchantId;
      try {
        console.log('Fetching merchant for fee calculation:', merchantId);
        const merchant = await getMerchantById(merchantId);
        if (merchant && merchant.latitude && merchant.longitude) {
            console.log('Calculating estimate from', { lat: merchant.latitude, lng: merchant.longitude }, 'to', { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude });
            const estimate = await getDeliveryFeeEstimate(
                { lat: merchant.latitude, lng: merchant.longitude },
                { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude }
            );
            console.log('Fee estimate received:', estimate);
            if (estimate) {
                setDeliveryFee(estimate.fee);
            }
        } else {
            console.warn('Merchant location not found for fee calculation');
        }
      } catch (e) {
        console.error("Failed to calculate delivery fee", e);
      }
    };
    
    calculateFee();
  }, [deliveryAddress, items.length > 0 ? items[0].merchantId : null]);


  const addToCart = async (newItem: CartItem) => {
    // Optimistic update or wait for server?
    // Let's wait for server for "production ready" reliability
    const res = await addToCartItem(newItem.menuItemId, newItem.quantity, newItem.options);
    if (res) {
        refreshCart();
    } else {
        Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const removeFromCart = async (itemId: string) => {
    // Note: itemId here is the CART ITEM ID (from backend), not menuItemId
    // But frontend might pass either depending on how it was built. 
    // The mappedItems uses `ci.id` as `id`, so it should be correct.
    const res = await removeCartItem(itemId);
    if (res) refreshCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    const res = await updateCartItem(itemId, quantity);
    if (res) refreshCart();
  };

  const clearCart = async () => {
    const res = await clearCartItems();
    if (res) setItems([]);
  };

  const cartTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, deliveryFee, deliveryAddress, setDeliveryAddress, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
