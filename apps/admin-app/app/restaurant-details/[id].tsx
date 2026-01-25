import { StyleSheet, ScrollView, TouchableOpacity, View, Image, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [priceAdjustment, setPriceAdjustment] = useState('0');
  const [itemAdjustments, setItemAdjustments] = useState<Record<string, string>>({});

  // State for fetched data
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (id) {
        fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    try {
        const { authenticatedFetch } = await import('../../api/client');
        const res = await authenticatedFetch(`/merchants/${id}`);
        if (res.ok) {
            const data = await res.json();
            // Flatten menu items from categories for display, or adjust UI to support categories
            // The current UI expects a flat 'menu' array with 'category' field.
            let flatMenu: any[] = [];
            
            if (data.categories) {
                data.categories.forEach((cat: any) => {
                    if (cat.menuItems) {
                        cat.menuItems.forEach((item: any) => {
                            flatMenu.push({
                                ...item,
                                category: cat.name,
                                basePrice: item.price,
                                currentPrice: item.price, // Adjust if we have logic for this
                                available: item.isAvailable,
                                image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'
                            });
                        });
                    }
                });
            }

            setRestaurant({
                ...data,
                menu: flatMenu,
                status: data.isOpen ? 'Active' : 'Closed',
                logo: data.logo || 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=200',
                banner: data.coverImage || 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800',
                revenue: data.totalOrders * 200, // Estimate
                commission: 20
            });
        } else {
            console.error("Failed to fetch details");
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
      return (
          <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ThemedText>Loading...</ThemedText>
          </ThemedView>
      );
  }

  if (!restaurant) {
      return (
          <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ThemedText>Restaurant not found</ThemedText>
          </ThemedView>
      );
  }

  const applyPriceAdjustment = () => {
    const percentage = parseFloat(priceAdjustment) || 0;
    // This would update prices in the backend
    console.log(`Applying ${percentage}% price adjustment to all menu items`);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Restaurant Details',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Image */}
        <Image source={{ uri: restaurant.banner }} style={styles.bannerImage} />
        
        {/* Logo overlapping banner */}
        <View style={styles.logoContainer}>
          <Image source={{ uri: restaurant.logo }} style={styles.logoImage} />
        </View>

        <ThemedView style={styles.content}>
          {/* Restaurant Info */}
          <ThemedView style={styles.infoCard}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.restaurantName}>{restaurant.name}</ThemedText>
                <ThemedText style={styles.restaurantCategory}>{restaurant.category}</ThemedText>
              </View>
              <Switch 
                value={restaurant.status === 'Active'} 
                trackColor={{ false: '#DDD', true: '#F48FB1' }}
                thumbColor={restaurant.status === 'Active' ? '#C2185B' : '#FFF'}
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <IconSymbol size={16} name="dashboard" color="#F57C00" />
                <ThemedText style={styles.statText}>{restaurant.rating} ★</ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconSymbol size={16} name="orders" color="#1976D2" />
                <ThemedText style={styles.statText}>{restaurant.totalOrders} orders</ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconSymbol size={16} name="fees" color="#388E3C" />
                <ThemedText style={styles.statText}>₱{restaurant.revenue.toLocaleString()}</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <IconSymbol size={16} name="map" color="#888" />
              <ThemedText style={styles.detailText}>{restaurant.address}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <IconSymbol size={16} name="dashboard" color="#888" />
              <ThemedText style={styles.detailText}>{restaurant.phone}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <IconSymbol size={16} name="dashboard" color="#888" />
              <ThemedText style={styles.detailText}>{restaurant.email}</ThemedText>
            </View>
          </ThemedView>

          {/* Price Adjustment Section */}
          <ThemedView style={styles.priceAdjustmentCard}>
            <ThemedText style={styles.sectionTitle}>Menu Price Adjustment</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Apply percentage increase/decrease to all menu prices
            </ThemedText>
            
            <View style={styles.adjustmentRow}>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.percentageInput}
                  value={priceAdjustment}
                  onChangeText={setPriceAdjustment}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
                <ThemedText style={styles.percentageSymbol}>%</ThemedText>
              </View>
              
              <TouchableOpacity style={styles.applyButton} onPress={applyPriceAdjustment}>
                <ThemedText style={styles.applyButtonText}>Apply to All</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.adjustmentNote}>
              Example: +10% will increase ₱100 to ₱110, -5% will decrease ₱100 to ₱95
            </ThemedText>
          </ThemedView>

          {/* Menu Section */}
          <ThemedView style={styles.menuSection}>
            <View style={styles.menuHeader}>
              <ThemedText style={styles.sectionTitle}>Menu Items ({restaurant.menu.length})</ThemedText>
              <TouchableOpacity>
                <ThemedText style={styles.editMenuText}>Edit Menu</ThemedText>
              </TouchableOpacity>
            </View>

            {restaurant.menu.map((item: any) => (
              <View key={item.id} style={styles.menuItemContainer}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => router.push(`/menu-item-details/${item.id}`)}
                >
                  <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                  
                  <View style={styles.menuItemInfo}>
                    <ThemedText style={styles.menuItemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.menuItemCategory}>{item.category}</ThemedText>
                    <View style={styles.priceRow}>
                      {item.basePrice !== item.currentPrice && (
                        <ThemedText style={styles.basePriceStrike}>₱{item.basePrice}</ThemedText>
                      )}
                      <ThemedText style={styles.currentPrice}>₱{item.currentPrice}</ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.menuItemActions}>
                    <View style={[styles.availabilityBadge, { backgroundColor: item.available ? '#E8F5E9' : '#FFEBEE' }]}>
                      <ThemedText style={[styles.availabilityText, { color: item.available ? '#388E3C' : '#D32F2F' }]}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Individual Price Adjustment */}
                <View style={styles.itemAdjustmentRow}>
                  <ThemedText style={styles.adjustLabel}>Price Adjustment:</ThemedText>
                  <View style={styles.itemInputContainer}>
                    <TextInput 
                      style={styles.itemPercentageInput}
                      value={itemAdjustments[item.id] || '0'}
                      onChangeText={(text) => setItemAdjustments({...itemAdjustments, [item.id]: text})}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                    />
                    <ThemedText style={styles.itemPercentageSymbol}>%</ThemedText>
                  </View>
                  <TouchableOpacity 
                    style={styles.itemApplyBtn}
                    onPress={() => console.log(`Apply ${itemAdjustments[item.id] || 0}% to ${item.name}`)}
                  >
                    <ThemedText style={styles.itemApplyText}>Apply</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ThemedView>

          <View style={{ height: 100 }} />
        </ThemedView>
      </ScrollView>

      {/* Footer Actions */}
      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
         <TouchableOpacity style={styles.suspendBtn}>
            <ThemedText style={styles.suspendBtnText}>Suspend Restaurant</ThemedText>
         </TouchableOpacity>
         <TouchableOpacity style={styles.saveBtn}>
            <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
         </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  bannerImage: {
    width: '100%',
    height: 200,
  },
  logoContainer: {
    position: 'absolute',
    top: 140,
    left: 20,
    zIndex: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  content: {
    paddingTop: 70,
    padding: 16,
    backgroundColor: 'transparent',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  restaurantCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2185B',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  priceAdjustmentCard: {
    backgroundColor: '#FFF9FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 12,
  },
  adjustmentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 16,
    height: 50,
  },
  percentageInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  percentageSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C2185B',
  },
  applyButton: {
    backgroundColor: '#C2185B',
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  adjustmentNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  menuSection: {
    backgroundColor: 'transparent',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editMenuText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C2185B',
  },
  menuItemContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  menuItemCategory: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  basePriceStrike: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C2185B',
  },
  menuItemActions: {
    justifyContent: 'center',
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemAdjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
    gap: 10,
  },
  adjustLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  itemInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 10,
    height: 36,
  },
  itemPercentageInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    padding: 0,
  },
  itemPercentageSymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2185B',
  },
  itemApplyBtn: {
    backgroundColor: '#C2185B',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemApplyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    gap: 12,
  },
  suspendBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  suspendBtnText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
