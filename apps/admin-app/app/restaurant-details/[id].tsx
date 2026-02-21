import { StyleSheet, ScrollView, TouchableOpacity, View, Image, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveImageUrl } from '../../api/client';
import { approveMerchant, suspendMerchant, updateMerchantType } from '../../api/services';

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [itemAdjustments, setItemAdjustments] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [appliedGlobal, setAppliedGlobal] = useState(false);
  const [appliedItems, setAppliedItems] = useState<Record<string, boolean>>({});

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
        const res = await authenticatedFetch(`/merchants/admin/${id}`);
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
                logo: data.logo || data.imageUrl || 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=200',
                banner: data.coverImage || 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800',
                revenue: data.totalOrders * 200, // Estimate
                commission: 20,
                isApproved: data.isApproved
            });
        } else {
            console.error("Failed to fetch details", res.status);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!restaurant) return;
    
    let success = false;
    if (restaurant.isApproved) {
        success = await suspendMerchant(id as string);
    } else {
        success = await approveMerchant(id as string);
    }

    if (success) {
        setRestaurant((prev: any) => ({ ...prev, isApproved: !prev.isApproved }));
    } else {
        alert('Failed to update status');
    }
  };

  const handleChangeType = async (newType: 'RESTAURANT' | 'GROCERY' | 'PHARMACY') => {
    if (!restaurant || restaurant.type === newType) return;

    const success = await updateMerchantType(id as string, newType);
    if (success) {
        setRestaurant((prev: any) => ({ ...prev, type: newType }));
    } else {
        alert('Failed to update business type');
    }
  };

  // Render Stack.Screen config immediately to prevent default filename title
  const screenOptions = (
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
  );

  if (loading) {
      return (
          <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              {screenOptions}
              <ThemedText>Loading...</ThemedText>
          </ThemedView>
      );
  }

  if (!restaurant) {
      return (
          <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              {screenOptions}
              <ThemedText>Restaurant not found</ThemedText>
          </ThemedView>
      );
  }

  /**
   * Scale a single item's price and all its variant option prices by a percentage.
   * ALWAYS applies the percentage to the ORIGINAL (pre-admin-adjustment) price so that
   * repeated adjustments don't compound — e.g. two +10% calls still yield exactly +10%.
   * Choice prices are also scaled from their original values (stored in the item-level originalPrice context).
   * Returns true if the PATCH succeeded.
   */
  const adjustItemPrice = async (item: any, percentage: number) => {
    const { authenticatedFetch } = await import('../../api/client');
    const multiplier = 1 + percentage / 100;

    // Use the merchant's original price as the base (never the already-adjusted price)
    const basePrice: number = item.originalPrice ?? item.price;
    const newPrice = Math.round(basePrice * multiplier * 100) / 100;

    // Scale every variant option choice price.
    // We don't store originalPrice inside choices (avoids polluting options JSON).
    // Instead we rely on item.originalPrice being set — if present, choices have already
    // been adjusted before, so we need to reverse-engineer the original choice price
    // by dividing by the ratio of (current item price / original item price).
    const priceRatio = item.originalPrice != null && item.price !== 0
      ? item.price / item.originalPrice  // how much we previously scaled up/down
      : 1;

    const newOptions = (item.options ?? []).map((group: any) => {
      const choices = group.options ?? group.items ?? [];
      const scaledChoices = choices.map((choice: any) => {
        const currentChoicePrice = parseFloat(String(choice.price ?? 0));
        // Un-apply the previous ratio to get the original choice price, then apply new multiplier
        const baseChoicePrice = priceRatio !== 1
          ? Math.round((currentChoicePrice / priceRatio) * 100) / 100
          : currentChoicePrice;
        const newChoicePrice = Math.round(baseChoicePrice * multiplier * 100) / 100;
        return { ...choice, price: newChoicePrice };
      });

      return {
        ...group,
        // Write back under whichever key the group uses
        ...(group.options !== undefined ? { options: scaledChoices } : {}),
        ...(group.items !== undefined ? { items: scaledChoices } : {}),
      };
    });

    const res = await authenticatedFetch(`/menu/items/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        price: newPrice,
        options: newOptions,
        // Tell the backend the baseline — stored as originalPrice only on first admin adjustment
        originalPrice: item.originalPrice ?? item.price,
      }),
    });
    return res.ok;
  };

  const applyPriceAdjustment = async () => {
    const percentage = parseFloat(priceAdjustment);
    if (isNaN(percentage) || percentage === 0) {
        alert('Please enter a valid non-zero percentage');
        return;
    }

    setIsUpdating(true);
    try {
        const results = await Promise.all(
            restaurant.menu.map((item: any) => adjustItemPrice(item, percentage))
        );
        const allOk = results.every(Boolean);
        setPriceAdjustment('');
        if (allOk) {
            setAppliedGlobal(true);
            setTimeout(() => setAppliedGlobal(false), 2500);
            fetchDetails(); // originalPrice is now persisted in DB — no snapshot needed
        } else {
            alert('Some items failed to update. Please try again.');
        }
    } catch (e) {
        console.error(e);
        alert('An error occurred while updating prices');
    } finally {
        setIsUpdating(false);
    }
  };

  const applyItemAdjustment = async (itemId: string) => {
    const pct = parseFloat(itemAdjustments[itemId] || '');
    if (isNaN(pct) || pct === 0) {
        alert('Please enter a valid non-zero percentage');
        return;
    }

    const item = restaurant.menu.find((m: any) => m.id === itemId);
    if (!item) return;

    try {
        const ok = await adjustItemPrice(item, pct);
        if (ok) {
            setAppliedItems(prev => ({ ...prev, [itemId]: true }));
            setTimeout(() => setAppliedItems(prev => ({ ...prev, [itemId]: false })), 2500);
            setItemAdjustments(prev => ({ ...prev, [itemId]: '' }));
            fetchDetails();
        } else {
            alert('Failed to update item price');
        }
    } catch (e) {
        console.error(e);
        alert('Error updating item price');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {screenOptions}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <Image source={{ uri: resolveImageUrl(restaurant.banner) }} style={styles.bannerImage} />

        {/* Profile row — logo uses negative marginTop to straddle banner bottom */}
        <View style={styles.profileRow}>
          <Image source={{ uri: resolveImageUrl(restaurant.logo) }} style={styles.logoImage} />
          <View style={styles.nameBlock}>
            <View style={styles.nameSwitchRow}>
              <ThemedText style={styles.restaurantName} numberOfLines={2}>{restaurant.name}</ThemedText>
              <Switch
                value={restaurant.status === 'Active'}
                trackColor={{ false: '#DDD', true: '#F48FB1' }}
                thumbColor={restaurant.status === 'Active' ? '#C2185B' : '#FFF'}
              />
            </View>
            {restaurant.category ? (
              <ThemedText style={styles.restaurantCategory}>{restaurant.category}</ThemedText>
            ) : null}
          </View>
        </View>

        <ThemedView style={styles.content}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <IconSymbol size={14} name="dashboard" color="#F57C00" />
              <ThemedText style={styles.statText}>{restaurant.rating ?? 'N/A'} ★</ThemedText>
            </View>
            <View style={styles.statChip}>
              <IconSymbol size={14} name="orders" color="#1976D2" />
              <ThemedText style={styles.statText}>{restaurant.totalOrders ?? 0} orders</ThemedText>
            </View>
            <View style={styles.statChip}>
              <IconSymbol size={14} name="fees" color="#388E3C" />
              <ThemedText style={styles.statText}>₱{(restaurant.revenue ?? 0).toLocaleString()}</ThemedText>
            </View>
          </View>

          {/* Contact details */}
          <View style={styles.detailsBlock}>
            {restaurant.address ? (
              <View style={styles.detailRow}>
                <IconSymbol size={15} name="map" color="#C2185B" />
                <ThemedText style={styles.detailText}>{restaurant.address}</ThemedText>
              </View>
            ) : null}
            {restaurant.phone ? (
              <View style={styles.detailRow}>
                <IconSymbol size={15} name="person.fill" color="#C2185B" />
                <ThemedText style={styles.detailText}>{restaurant.phone}</ThemedText>
              </View>
            ) : null}
            {restaurant.email ? (
              <View style={styles.detailRow}>
                <IconSymbol size={15} name="message.fill" color="#C2185B" />
                <ThemedText style={styles.detailText}>{restaurant.email}</ThemedText>
              </View>
            ) : null}
          </View>

          {/* Store Type Selection */}
          <ThemedView style={styles.storeTypeCard}>
            <ThemedText style={styles.sectionTitle}>Store Category Type</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              determines which tab this merchant appears on in the customer app
            </ThemedText>
            <View style={styles.typeSelectorRow}>
              {(['RESTAURANT', 'GROCERY', 'PHARMACY'] as const).map(type => (
                <TouchableOpacity 
                  key={type}
                  style={[styles.typeButton, restaurant.type === type && styles.typeButtonActive]}
                  onPress={() => handleChangeType(type)}
                >
                  <ThemedText style={[styles.typeButtonText, restaurant.type === type && styles.typeButtonTextActive]}>
                    {type}
                  </ThemedText>
                </TouchableOpacity>
              ))}
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
              
              <TouchableOpacity
                style={[styles.applyButton, appliedGlobal && styles.appliedButton]}
                onPress={applyPriceAdjustment}
              >
                <ThemedText style={[styles.applyButtonText, appliedGlobal && styles.appliedButtonText]}>
                  {appliedGlobal ? 'Applied ✓' : 'Apply to All'}
                </ThemedText>
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
              <View key={item.id} style={[styles.menuItemContainer, !item.isApproved && styles.pendingItemContainer]}>
                {!item.isApproved && (
                    <View style={styles.pendingBadge}>
                        <ThemedText style={styles.pendingBadgeText}>Pending Approval</ThemedText>
                    </View>
                )}
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => router.push(`/menu-item-details/${item.id}`)}
                >
                  <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.menuItemImage} />
                  
                  <View style={styles.menuItemInfo}>
                    <ThemedText style={styles.menuItemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.menuItemCategory}>{item.category}</ThemedText>
                    <View style={styles.priceRow}>
                      {/* originalPrice is persisted in DB — shows permanently until merchant resets */}
                      {item.originalPrice != null && item.originalPrice !== item.price && (
                        <ThemedText style={styles.basePriceStrike}>₱{item.originalPrice}</ThemedText>
                      )}
                      <ThemedText style={styles.currentPrice}>₱{item.price ?? item.currentPrice}</ThemedText>
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
                      value={itemAdjustments[item.id] || ''}
                      onChangeText={(text) => setItemAdjustments({...itemAdjustments, [item.id]: text})}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                    />
                    <ThemedText style={styles.itemPercentageSymbol}>%</ThemedText>
                  </View>
                  <TouchableOpacity 
                    style={[styles.itemApplyBtn, appliedItems[item.id] && styles.itemAppliedBtn]}
                    onPress={() => applyItemAdjustment(item.id)}
                  >
                    <ThemedText style={[styles.itemApplyText, appliedItems[item.id] && styles.itemAppliedText]}>
                      {appliedItems[item.id] ? 'Applied ✓' : 'Apply'}
                    </ThemedText>
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
         <TouchableOpacity 
            style={[styles.suspendBtn, !restaurant.isApproved && { backgroundColor: '#E8F5E9' }]}
            onPress={handleToggleStatus}
         >
            <ThemedText style={[styles.suspendBtnText, !restaurant.isApproved && { color: '#388E3C' }]}>
                {restaurant.isApproved ? 'Suspend Restaurant' : 'Approve Restaurant'}
            </ThemedText>
         </TouchableOpacity>
         <TouchableOpacity style={styles.saveBtn}>
            <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
         </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const LOGO_SIZE = 80;
const LOGO_HALF = LOGO_SIZE / 2; // 40 — how much sticks up into the banner

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  // Flex row: logo (pulled up) + name block side-by-side
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  // Negative marginTop pulls the logo up by half its height, straddling the banner edge
  logoImage: {
    marginTop: -LOGO_HALF,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    paddingTop: 10,
  },
  nameSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  restaurantName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: '#222',
    lineHeight: 21,
  },
  restaurantCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2185B',
    marginTop: 3,
  },
  content: {
    padding: 16,
    paddingTop: 14,
    backgroundColor: 'transparent',
  },
  // Stats chips row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  // Contact details block
  detailsBlock: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  // Kept for menu items
  pendingItemContainer: {
    borderColor: '#FF9800',
    borderWidth: 1,
    backgroundColor: '#FFF8E1',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
    paddingVertical: 2,
    paddingHorizontal: 8,
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  pendingBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  storeTypeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#388E3C',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#388E3C',
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
  appliedButton: {
    backgroundColor: '#E8F5E9',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  appliedButtonText: {
    color: '#388E3C',
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
    fontSize: 13,
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
    fontWeight: '600',
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
  itemAppliedBtn: {
    backgroundColor: '#E8F5E9',
  },
  itemApplyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  itemAppliedText: {
    color: '#388E3C',
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
