import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useEffect, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getMerchants, getMyOrders } from '@/api/services';
import { Merchant } from '@/api/types';
import { resolveImageUrl } from '@/api/client';

const PLACEHOLDER_BANNER = 'https://placehold.co/400x225/f0f0f0/aaaaaa?text=No+Image';
const PLACEHOLDER_LOGO = 'https://placehold.co/150x150/f0f0f0/aaaaaa?text=?';

// Wrapper that falls back to placeholder on error
function MerchantImage({ uri, style, placeholder }: { uri?: string; style: any; placeholder: string }) {
  const [src, setSrc] = useState<string>(uri || placeholder);
  useEffect(() => { setSrc(uri || placeholder); }, [uri]);
  return (
    <Image
      source={{ uri: src }}
      style={style}
      onError={() => setSrc(placeholder)}
    />
  );
}
import { isMerchantOpen } from '@/utils/time';
import { useSocket } from '@/context/SocketContext';

export default function FoodScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.72;
  const cardHeight = cardWidth * (9 / 16);
  
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<Array<{
    menuItemId: string;
    name: string;
    price: number;
    image?: string;
    merchantName: string;
    merchantLogo?: string;
    merchantRating?: number;
    merchantId: string;
    deliveryFee?: number;
  }>>([]);

  const FOOD_CATEGORIES = [
    { label: 'Chicken',       image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=200&q=80' },
    { label: 'Burgers',       image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&q=80' },
    { label: 'Fried Chicken', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=80' },
    { label: 'Pizza',         image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80' },
    { label: 'Cake',          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80' },
    { label: 'Noodles',       image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=200&q=80' },
    { label: 'Seafood',       image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&q=80' },
    { label: 'Rice Meals',    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&q=80' },
  ];
  
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleMerchantUpdate = (updatedMerchant: Merchant) => {
      setMerchants(prev => prev.map(m => 
        m.id === updatedMerchant.id ? { ...m, ...updatedMerchant } : m
      ));
    };

    socket.on('merchant:updated', handleMerchantUpdate);
    return () => {
      socket.off('merchant:updated', handleMerchantUpdate);
    };
  }, [socket]);

  useFocusEffect(
    useCallback(() => {
      loadMerchants();
      // Load recent orders for the Order Again section
      getMyOrders().then(orders => {
        const seen = new Set<string>();
        const items: typeof recentItems = [];
        for (const order of orders) {
          if (!order.merchant || (order.merchant.type && order.merchant.type !== 'RESTAURANT')) continue;
          for (const item of (order.items ?? [])) {
            if (!item.menuItem || seen.has(item.menuItemId)) continue;
            seen.add(item.menuItemId);
            items.push({
              menuItemId: item.menuItemId,
              name: item.menuItem.name,
              price: item.price,
              image: (item.menuItem as any).imageUrl || (item.menuItem as any).image,
              merchantName: order.merchant.name,
              merchantLogo: (order.merchant as any).logo,
              merchantRating: order.merchant.rating,
              merchantId: order.merchantId,
              deliveryFee: order.deliveryFee,
            });
            if (items.length >= 5) break;
          }
          if (items.length >= 5) break;
        }
        setRecentItems(items);
      }).catch(() => {});
    }, [])
  );

  const loadMerchants = async () => {
    setLoading(true);
    try {
      // Race the fetch against a 10-second timeout so a cold Railway
      // start never leaves the screen stuck in a spinning state forever.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10_000)
      );
      const data = await Promise.race([getMerchants(), timeout]);
      setMerchants(data);
    } catch (e: any) {
      console.warn('loadMerchants failed/timed-out:', e?.message);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m => {
    if (!(!m.type || m.type === 'RESTAURANT')) return false;
    if (!m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory) {
      const haystack = `${m.name} ${m.description ?? ''}`.toLowerCase();
      return haystack.includes(selectedCategory.toLowerCase());
    }
    return true;
  });

  // Group merchants into sections
  const popularMerchants = filteredMerchants.slice(0, 6);

  const sections = [
    {
      title: 'Popular Restaurants',
      items: popularMerchants
    },
    {
      title: 'All Restaurants',
      items: filteredMerchants
    }
  ];

  const renderMerchantCard = (merchant: Merchant) => {
    const { isOpen, nextOpen } = isMerchantOpen(merchant);
    
    return (
    <TouchableOpacity 
      key={merchant.id} 
      style={[styles.compactCard, { width: cardWidth }]}
      onPress={() => router.push(`/restaurant/${merchant.id}`)}
    >
      <ThemedView style={[styles.imageContainer, { height: cardHeight }]}>
        <MerchantImage
          uri={resolveImageUrl(merchant.coverImage)}
          style={styles.restaurantImage}
          placeholder={PLACEHOLDER_BANNER}
        />
        <ThemedView style={styles.heartIcon}>
          <IconSymbol size={14} name="heart" color="#000" />
        </ThemedView>
        {!isOpen && (
             <ThemedView style={styles.closedOverlay}>
                <ThemedText style={styles.closedText}>Closed</ThemedText>
                <ThemedText style={styles.opensAtText}>{nextOpen || 'Closed'}</ThemedText>
             </ThemedView>
        )}
      </ThemedView>
      
      <ThemedView style={styles.cardInfo}>
        <ThemedView style={styles.nameRow}>
          <ThemedText style={styles.restaurantName} numberOfLines={1}>{merchant.name}</ThemedText>
          {!!merchant.rating && (
            <ThemedView style={styles.ratingRow}>
              <ThemedText style={styles.ratingText}>★ {merchant.rating.toFixed(1)}</ThemedText>
              {!!merchant.reviewCount && (
                <ThemedText style={styles.countText}>({merchant.reviewCount})</ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>
        
        {!!merchant.description && (
          <ThemedText style={styles.subtitleText} numberOfLines={1}>{merchant.description}</ThemedText>
        )}
        
        <ThemedView style={styles.feeRow}>
          <IconSymbol size={12} name="paperplane.fill" color="#555" />
          <ThemedText style={styles.feeText}>
            {merchant.deliveryTime || '15-30 min'} • ₱{merchant.deliveryFee || 29}
          </ThemedText>
        </ThemedView>

        {!!merchant.address && (
          <ThemedView style={styles.promoBadge}>
            <IconSymbol size={10} name="location.fill" color="#f78734" />
            <ThemedText style={styles.promoText} numberOfLines={1}>{merchant.address}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </TouchableOpacity>
  );};

  // GrabFood-style horizontal list row for the All Restaurants section
  const renderListCard = (merchant: Merchant) => {
    const { isOpen, nextOpen } = isMerchantOpen(merchant);
    const imgSize = 110;

    return (
      <TouchableOpacity
        key={merchant.id}
        style={styles.listCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/restaurant/${merchant.id}`)}
      >
        {/* Left: Square image */}
        <View style={[styles.listImageWrap, { width: imgSize, height: imgSize }]}>
          <MerchantImage
            uri={resolveImageUrl(merchant.coverImage)}
            style={styles.listImage}
            placeholder={PLACEHOLDER_BANNER}
          />
          {!isOpen && (
            <View style={styles.listClosedOverlay}>
              <ThemedText style={styles.listClosedText}>Closed</ThemedText>
            </View>
          )}
        </View>

        {/* Right: Info */}
        <View style={styles.listInfo}>
          {/* Name row */}
          <View style={styles.listNameRow}>
            <ThemedText style={styles.listName} numberOfLines={1}>
              {merchant.name}
            </ThemedText>
          </View>

          {/* Rating + cuisine */}
          <View style={styles.listMetaRow}>
            <ThemedText style={styles.listStar}>★</ThemedText>
            <ThemedText style={styles.listRating}>
              {merchant.rating ? merchant.rating.toFixed(1) : '—'}
            </ThemedText>
            {!!merchant.reviewCount && (
              <ThemedText style={styles.listReviewCount}>
                ({merchant.reviewCount})
              </ThemedText>
            )}
            {!!merchant.description && (
              <ThemedText style={styles.listCuisine} numberOfLines={1}>
                {' · '}{merchant.description}
              </ThemedText>
            )}
          </View>

          {/* Delivery fee + ETA */}
          <View style={styles.listDeliveryRow}>
            <IconSymbol size={11} name="paperplane.fill" color="#888" />
            <ThemedText style={styles.listDeliveryText}>
              ₱{merchant.deliveryFee ?? 29}  ·  {merchant.deliveryTime || '15–30 min'}
            </ThemedText>
          </View>

          {/* Address badge */}
          {!!merchant.address && (
            <View style={styles.listAddressBadge}>
              <IconSymbol size={9} name="location.fill" color="#f78734" />
              <ThemedText style={styles.listAddressText} numberOfLines={1}>
                {merchant.address}
              </ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Pink Header with Search */}
      <ThemedView style={styles.headerBackground}>
        <ThemedView style={styles.searchBarContainer}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="magnifyingglass" color="#777" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search for restaurants"
              style={styles.searchInput}
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.contentBody}>
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5c6cc9" />
            <ThemedText style={styles.loadingText}>Loading restaurants...</ThemedText>
          </ThemedView>
        ) : merchants.filter(m => !m.type || m.type === 'RESTAURANT').length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol size={48} name="fork.knife" color="#CCC" />
            <ThemedText style={styles.emptyText}>Could not load restaurants</ThemedText>
            <ThemedText style={styles.emptySubtext}>The server may be waking up. Tap to retry.</ThemedText>
            <TouchableOpacity style={styles.retryBtn} onPress={loadMerchants}>
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <>
          {/* ── Food Categories strip ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {FOOD_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={styles.categoryItem}
                  activeOpacity={0.75}
                  onPress={() => setSelectedCategory(active ? null : cat.label)}
                >
                  <View style={[styles.categoryImgWrap, active && styles.categoryImgWrapActive]}>
                    <Image
                      source={{ uri: cat.image }}
                      style={styles.categoryImg}
                    />
                  </View>
                  <ThemedText style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Order Again ── */}
          {recentItems.length > 0 && (
            <ThemedView style={styles.sectionContainer}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Order Again</ThemedText>
              </ThemedView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orderAgainScroll}>
                {recentItems.map((item) => (
                  <TouchableOpacity
                    key={item.menuItemId}
                    style={styles.orderAgainCard}
                    activeOpacity={0.82}
                    onPress={() => router.push(`/restaurant/${item.merchantId}`)}
                  >
                    {/* Food image */}
                    <MerchantImage
                      uri={resolveImageUrl(item.image)}
                      style={styles.orderAgainImg}
                      placeholder={PLACEHOLDER_BANNER}
                    />
                    {/* Merchant row: logo + name + rating */}
                    <View style={styles.orderAgainMerchantRow}>
                      {item.merchantLogo ? (
                        <Image
                          source={{ uri: resolveImageUrl(item.merchantLogo) }}
                          style={styles.orderAgainLogo}
                        />
                      ) : (
                        <View style={[styles.orderAgainLogo, { backgroundColor: '#EEE' }]} />
                      )}
                      <ThemedText style={styles.orderAgainMerchantName} numberOfLines={1}>
                        {item.merchantName}
                      </ThemedText>
                      {!!item.merchantRating && (
                        <View style={styles.orderAgainRatingRow}>
                          <ThemedText style={styles.orderAgainStar}>★</ThemedText>
                          <ThemedText style={styles.orderAgainRatingVal}>
                            {item.merchantRating.toFixed(1)}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    {/* Item name */}
                    <ThemedText style={styles.orderAgainItemName} numberOfLines={2}>
                      {item.name}
                    </ThemedText>
                    {/* Price */}
                    <ThemedText style={styles.orderAgainPrice}>
                      ₱ {item.price.toFixed(2)}
                    </ThemedText>
                    {/* Delivery fee */}
                    <View style={styles.orderAgainDeliveryRow}>
                      <ThemedText style={styles.orderAgainDeliveryText}>
                        🚴 ₱ {(item.deliveryFee ?? 29).toFixed(2)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ThemedView>
          )}

          {sections.map((section, sIndex) => (
            section.items.length > 0 && (
              <ThemedView key={sIndex} style={styles.sectionContainer}>
                <ThemedView style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                  <TouchableOpacity style={styles.seeAllButton}>
                    <IconSymbol size={18} name="chevron.right" color="#555" />
                  </TouchableOpacity>
                </ThemedView>

                {section.title === 'All Restaurants' ? (
                  // Vertical GrabFood-style list
                  <View style={styles.listSection}>
                    {section.items.map(renderListCard)}
                  </View>
                ) : (
                  // Horizontal scroll cards (Popular)
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {section.items.map(renderMerchantCard)}
                  </ScrollView>
                )}
              </ThemedView>
            )
          ))}
          <ThemedView style={{ height: 100 }} />
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerBackground: {
    backgroundColor: '#5c6cc9',
    paddingTop: 50,
    paddingBottom: 15,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  contentBody: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#5c6cc9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  seeAllButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  compactCard: {
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  imageContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  heartIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
  },
  countText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 2,
  },
  subtitleText: {
    fontSize: 11,
    color: '#777',
    marginTop: 1,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  feeText: {
    fontSize: 11,
    color: '#555',
    marginLeft: 4,
    fontWeight: '600',
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  promoText: {
    color: '#5c6cc9',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  opensAtText: {
    color: '#EEE',
    fontSize: 12,
    marginTop: 4,
  },
  // ── Food category strip ────────────────────────────────────
  categoriesScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  categoryImgWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryImgWrapActive: {
    borderColor: '#5c6cc9',
  },
  categoryImg: {
    width: '100%',
    height: '100%',
  },
  categoryLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#5c6cc9',
    fontWeight: '800',
  },
  // ── All Restaurants list styles ──────────────────────────────
  listSection: {
    paddingHorizontal: 16,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listImageWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    flexShrink: 0,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listClosedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  listClosedText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    gap: 4,
  },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  listStar: {
    color: '#FFC107',
    fontSize: 13,
    fontWeight: '700',
  },
  listRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginLeft: 2,
  },
  listReviewCount: {
    fontSize: 11,
    color: '#888',
    marginLeft: 2,
  },
  listCuisine: {
    fontSize: 12,
    color: '#666',
    flexShrink: 1,
  },
  listDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listDeliveryText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 3,
  },
  listAddressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  listAddressText: {
    fontSize: 10,
    color: '#E65100',
    fontWeight: '600',
    flexShrink: 1,
  },
  // ── Order Again styles ──────────────────────────────────────
  orderAgainScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 0,
  },
  orderAgainCard: {
    width: 148,
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  orderAgainImg: {
    width: 148,
    height: 148,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
  },
  orderAgainMerchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  orderAgainLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DDD',
    flexShrink: 0,
  },
  orderAgainMerchantName: {
    fontSize: 11,
    color: '#666',
    flex: 1,
    flexShrink: 1,
  },
  orderAgainRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  orderAgainStar: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: '700',
  },
  orderAgainRatingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  orderAgainItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 4,
    lineHeight: 18,
  },
  orderAgainPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E91E8C',
    marginTop: 4,
  },
  orderAgainDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orderAgainDeliveryText: {
    fontSize: 12,
    color: '#888',
  },
});
