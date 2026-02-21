import { StyleSheet, ScrollView, TouchableOpacity, Image, View, TextInput, Animated, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useRef, useEffect } from 'react';
import { getMerchantById, getMenuItemsByMerchant } from '@/api/services';
import { resolveImageUrl } from '@/api/client';
import { Merchant, MenuItem } from '@/api/types';
import { useCart } from '@/context/CartContext';

export default function GroceryStoreScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    const [merchantData, menuData] = await Promise.all([
      getMerchantById(id),
      getMenuItemsByMerchant(id)
    ]);
    setMerchant(merchantData);
    setMenuItems(menuData);
    setLoading(false);
  };

  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(menuByCategory).map(key => ({
    title: key,
    items: menuByCategory[key]
  }));

  const handleQuickAdd = async (item: MenuItem) => {
    if (!merchant) return;
    
    // Simplistic default option resolution
    const defaultOptions: Record<string, any> = {};
    if (Array.isArray(item.options)) {
      item.options.forEach(group => {
        if (group.required && Array.isArray(group.options) && group.options.length > 0) {
          const defaultChoice = group.options.find((c: any) => c.price === 0) || group.options[0];
          defaultOptions[group.name] = defaultChoice.label;
        }
      });
    }

    setAddingItemId(item.id);
    try {
      await addToCart({
        id: Date.now().toString(),
        menuItemId: item.id,
        merchantId: merchant.id,
        storeName: merchant.name,
        deliveryFee: merchant.deliveryFee || 0,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image || item.imageUrl,
        options: defaultOptions,
        totalPrice: item.price,
      });
    } finally {
      setAddingItemId(null);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#C2185B" />
          <ThemedText style={{ marginTop: 12 }}>Loading store...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!merchant) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
           <ThemedText>Store not found.</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Sticky Top Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>{merchant.name}</ThemedText>
          <View style={styles.headerActions}>
            <IconSymbol size={18} name="filter" color="#000" />
          </View>
        </View>
      </Animated.View>

      {/* Floating Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ThemedView style={styles.backButtonInner}>
          <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
        </ThemedView>
      </TouchableOpacity>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <ThemedView style={styles.bannerContainer}>
          <Image source={{ uri: resolveImageUrl(merchant.coverImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800') }} style={styles.bannerImage} />
        </ThemedView>
        
        <ThemedView style={styles.infoCard}>
          <ThemedView style={styles.storeHeaderRow}>
            <ThemedView style={styles.logoBoxOverlap}>
               <IconSymbol size={30} name="grocery" color="#C2185B" />
            </ThemedView>
            <ThemedView style={styles.storeInfoDetails}>
               <ThemedText style={styles.storeNameMain} numberOfLines={1}>{merchant.name}</ThemedText>
               <ThemedText style={styles.storeMetaSub}>★ {merchant.rating?.toFixed(1) || 'N/A'} • {merchant.deliveryTime || '15-30 min'}</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Promo Section */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promoScroll}>
            {/* Real promo fields might not exist on merchant yet, showing mock ones to layout visually or omit */}
            {merchant.deliveryFee === 0 && (
              <ThemedView style={styles.promoBadge}>
                <ThemedText style={styles.promoText}>🎫 Free Delivery</ThemedText>
              </ThemedView>
            )}
          </ScrollView>

          {/* Grocery Search */}
          <ThemedView style={styles.storeSearchRow}>
            <TextInput 
              placeholder="Search in store..."
              style={styles.storeSearchInput}
              placeholderTextColor="#999"
            />
          </ThemedView>
        </ThemedView>

        {/* Menu Items */}
        <ThemedView style={styles.menuSection}>
          {categories.map((section, sIndex) => (
            <ThemedView key={sIndex} style={styles.menuGroup}>
              <ThemedText style={styles.groupTitle}>{section.title}</ThemedText>
              <View style={styles.groceryGrid}>
                {section.items.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.groceryItem} onPress={() => router.push(`/menu-item/${item.id}` as any)}>
                    <ThemedView style={styles.itemImageContainer}>
                      <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.itemImg} />
                      <TouchableOpacity style={styles.addBtn} onPress={() => handleQuickAdd(item)} disabled={addingItemId === item.id}>
                        {addingItemId === item.id ? (
                          <ActivityIndicator size="small" color="#C2185B" />
                        ) : (
                          <IconSymbol size={18} name="add" color="#C2185B" />
                        )}
                      </TouchableOpacity>
                    </ThemedView>
                    <ThemedView style={styles.itemInfo}>
                      <ThemedText style={styles.itemName} numberOfLines={2}>{item.name}</ThemedText>
                      <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </View>
            </ThemedView>
          ))}
        </ThemedView>

        <ThemedView style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Cart Bar */}
      <ThemedView style={styles.cartBar}>
        <ThemedView style={styles.cartBarInfo}>
          <ThemedText style={styles.cartQty}>1 ITEM</ThemedText>
          <ThemedText style={styles.cartPrice}>₱120</ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.viewCartButton} onPress={() => router.push('/cart')}>
          <ThemedText style={styles.viewCartText}>View Cart</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#FFF',
    zIndex: 100,
    paddingTop: 45,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 20,
    alignItems: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 16,
    zIndex: 110,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Keeps name on the same baseline as the logo's bottom
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    zIndex: 110,
  },
  logoBoxOverlap: {
    width: 70,
    height: 70,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: -35, // This creates the overlap with the banner above
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  storeInfoDetails: {
    marginLeft: 12,
    marginBottom: 8, // Shift name slightly higher than the baseline
    backgroundColor: 'transparent',
    flex: 1,
  },
  storeNameMain: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  storeMetaSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginTop: 2,
  },
  infoCard: {
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  promoScroll: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  promoBadge: {
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  promoText: {
    color: '#D81B60',
    fontSize: 11,
    fontWeight: '800',
  },
  storeSearchRow: {
    marginTop: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  storeSearchInput: {
    fontSize: 13,
    color: '#333',
  },
  menuSection: {
    padding: 16,
    marginTop: 10,
  },
  menuGroup: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#333',
    marginBottom: 15,
  },
  groceryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  groceryItem: {
    width: '48%',
    marginBottom: 20,
  },
  itemImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    position: 'relative',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  addBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  itemInfo: {
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginTop: 2,
  },
  cartBar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#C2185B',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 10,
  },
  cartBarInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cartQty: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
  },
  cartPrice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  viewCartButton: {
    backgroundColor: 'transparent',
  },
  viewCartText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
