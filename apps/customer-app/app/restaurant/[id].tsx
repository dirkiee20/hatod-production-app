import { StyleSheet, ScrollView, TouchableOpacity, Image, View, Animated, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useRef, useEffect } from 'react';
import { getMerchantById, getMenuItemsByMerchant, getMerchantReviews, getDeliveryFeeEstimate } from '@/api/services';
import { Review } from '@/api/types';
import { resolveImageUrl } from '@/api/client';
import { Merchant, MenuItem } from '@/api/types';
import { isMerchantOpen } from '@/utils/time';
import { useCart } from '@/context/CartContext';

const PLACEHOLDER_BANNER = 'https://placehold.co/800x400/f0f0f0/aaaaaa?text=No+Image';
const PLACEHOLDER_LOGO = 'https://placehold.co/150x150/f0f0f0/aaaaaa?text=?';
const PLACEHOLDER_ITEM = 'https://placehold.co/150x150/f0f0f0/aaaaaa?text=Food';

function FallbackImage({ uri, style, placeholder }: { uri?: string; style: any; placeholder: string }) {
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

// ─── Reviews Bottom Sheet ─────────────────────────────────────────────────────

function StarRow({ filled, size = 14 }: { filled: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <ThemedText key={s} style={{ fontSize: size, color: s <= filled ? '#FFD700' : '#E0E0E0' }}>★</ThemedText>
      ))}
    </View>
  );
}

function ReviewsSheet({
  visible, merchantId, merchantName, avgRating, reviewCount, onClose,
}: {
  visible: boolean; merchantId: string; merchantName: string;
  avgRating?: number; reviewCount?: number; onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getMerchantReviews(merchantId).then((data: Review[]) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      });
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter((r: Review) => r.rating === star).length,
  }));
  const maxCount = Math.max(1, ...breakdown.map(b => b.count));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={rvStyles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, rvStyles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[rvStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={rvStyles.handle} />

          {/* Header */}
          <View style={rvStyles.sheetHeader}>
            <ThemedText style={rvStyles.sheetTitle}>Reviews · {merchantName}</ThemedText>
            <TouchableOpacity onPress={onClose} style={rvStyles.closeBtn}>
              <ThemedText style={{ fontSize: 16, color: '#666', fontWeight: '700' }}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={rvStyles.summary}>
            <View style={rvStyles.ratingBig}>
              <ThemedText style={rvStyles.ratingNum}>{avgRating?.toFixed(1) ?? '—'}</ThemedText>
              <StarRow filled={Math.round(avgRating ?? 0)} size={18} />
              <ThemedText style={rvStyles.ratingTotal}>{reviewCount ?? 0} reviews</ThemedText>
            </View>
            <View style={rvStyles.breakdown}>
              {breakdown.map(({ star, count }) => (
                <View key={star} style={rvStyles.barRow}>
                  <ThemedText style={rvStyles.barLabel}>{star}★</ThemedText>
                  <View style={rvStyles.barTrack}>
                    <View style={[rvStyles.barFill, { width: `${(count / maxCount) * 100}%` as any }]} />
                  </View>
                  <ThemedText style={rvStyles.barCount}>{count}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={rvStyles.sheetDivider} />

          {/* List */}
          {loading ? (
            <View style={rvStyles.loadingBox}>
              <ActivityIndicator size="large" color="#5c6cc9" />
            </View>
          ) : reviews.length === 0 ? (
            <View style={rvStyles.emptyBox}>
              <ThemedText style={{ fontSize: 36 }}>💬</ThemedText>
              <ThemedText style={rvStyles.emptyText}>No reviews yet</ThemedText>
              <ThemedText style={rvStyles.emptySubText}>Be the first to leave a review!</ThemedText>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rvStyles.reviewList}>
              {reviews.map((review: Review) => (
                <View key={review.id} style={rvStyles.reviewCard}>
                  <View style={rvStyles.reviewHeader}>
                    <View style={rvStyles.avatar}>
                      <ThemedText style={rvStyles.avatarText}>
                        {(review.customer?.firstName?.[0] ?? '?').toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={rvStyles.reviewerName}>
                        {review.customer
                          ? `${review.customer.firstName} ${review.customer.lastName[0]}.`
                          : 'Customer'}
                      </ThemedText>
                      <ThemedText style={rvStyles.reviewDate}>{formatDate(review.createdAt)}</ThemedText>
                    </View>
                    <StarRow filled={review.rating} size={13} />
                  </View>
                  {review.comment ? (
                    <ThemedText style={rvStyles.comment}>&ldquo;{review.comment}&rdquo;</ThemedText>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const rvStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    maxHeight: '85%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0',
    alignSelf: 'center', marginBottom: 18,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 17, fontWeight: '900', color: '#222', flex: 1, marginRight: 8 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  summary: { flexDirection: 'row', gap: 20, alignItems: 'center', marginBottom: 20 },
  ratingBig: { alignItems: 'center', gap: 6, minWidth: 80 },
  ratingNum: { fontSize: 44, fontWeight: '900', color: '#222', lineHeight: 50 },
  ratingTotal: { fontSize: 12, color: '#888', marginTop: 2 },
  breakdown: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontSize: 11, color: '#888', width: 22, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  barCount: { fontSize: 11, color: '#888', width: 16, textAlign: 'right' },
  sheetDivider: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 16 },
  loadingBox: { height: 150, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { height: 180, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#555', marginTop: 4 },
  emptySubText: { fontSize: 13, color: '#AAAAAA' },
  reviewList: { paddingBottom: 8, gap: 14 },
  reviewCard: {
    backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#5c6cc9',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  reviewerName: { fontSize: 13, fontWeight: '800', color: '#333' },
  reviewDate: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  comment: { fontSize: 13, color: '#555', lineHeight: 19, fontStyle: 'italic' },
});

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { items, itemCount, cartTotal, addToCart, deliveryAddress } = useCart();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState<{ fee: number; distance: number; duration: number } | null>(null);

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

  useEffect(() => {
    const fetchDeliveryEstimate = async () => {
      if (!merchant) {
        setDeliveryEstimate(null);
        return;
      }

      if (
        !merchant.latitude ||
        !merchant.longitude ||
        !deliveryAddress?.latitude ||
        !deliveryAddress?.longitude
      ) {
        setDeliveryEstimate(null);
        return;
      }

      const subtotalForThisMerchant = items
        .filter((ci) => ci.merchantId === merchant.id)
        .reduce((sum, ci) => sum + ci.totalPrice, 0);

      const estimate = await getDeliveryFeeEstimate(
        { lat: merchant.latitude, lng: merchant.longitude },
        { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude },
        subtotalForThisMerchant
      );

      setDeliveryEstimate(estimate);
    };

    fetchDeliveryEstimate();
  }, [
    merchant?.id,
    merchant?.latitude,
    merchant?.longitude,
    deliveryAddress?.latitude,
    deliveryAddress?.longitude,
    items,
  ]);

  // Handle quick add to cart
  const handleQuickAdd = async (item: MenuItem) => {
    if (!merchant) return;

    // Normalise options and select default (cheapest/base) required choices automatically
    const groups = (Array.isArray(item.options) ? item.options : []).map(group => {
      const choices = (Array.isArray(group.options) ? group.options : Array.isArray(group.items) ? group.items : []).map((c: any) => ({
        label: c.label ?? c.name ?? '',
        price: parseFloat(String(c.price ?? 0)),
      }));
      const required = !!(group.isRequired ?? group.required ?? false);
      const isRadio = required || group.type === 'radio';
      return { name: group.name ?? group.title ?? '', required, isRadio, choices };
    });

    const defaultOptions: Record<string, any> = {};
    groups.forEach(g => {
      if (g.isRadio && g.required && g.choices.length > 0) {
        // Find choice with 0 price (base size), fallback to first
        const defaultChoice = g.choices.find((c: { price: number }) => c.price === 0) || g.choices[0];
        defaultOptions[g.name] = defaultChoice.label;
      }
    });

    setAddingItemId(item.id);
    try {
      await addToCart({
        id: Date.now().toString(),
        menuItemId: item.id,
        merchantId: merchant.id,
        storeName: merchant.name,
        deliveryFee: deliveryEstimate?.fee ?? merchant.deliveryFee ?? 0,
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

  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categoryKeys = Object.keys(menuByCategory);
  const categories = ['All', ...categoryKeys];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const controlOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5c6cc9" />
          <ThemedText style={styles.loadingText}>Loading restaurant...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!merchant) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={styles.loadingContainer}>
          <IconSymbol size={48} name="exclamationmark.triangle" color="#CCC" />
          <ThemedText style={styles.loadingText}>Restaurant not found</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  const { isOpen: isStoreOpen, nextOpen } = merchant ? isMerchantOpen(merchant) : { isOpen: true, nextOpen: '' };
  const estimatedEtaText = (() => {
    if (deliveryEstimate?.duration && deliveryEstimate.duration > 0) {
      const minutes = Math.max(1, Math.round(deliveryEstimate.duration / 60));
      return `${minutes} min`;
    }
    return merchant.deliveryTime || '15-30 min';
  })();
  const estimatedFeeValue = deliveryEstimate?.fee ?? merchant.deliveryFee ?? 29;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Sticky Top Header (Integrated Icons) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>{merchant.name}</ThemedText>
          <View style={styles.headerActions}>
            <IconSymbol size={18} name="heart" color="#000" style={{marginLeft: 15}} />
          </View>
        </View>
      </Animated.View>

      {/* Floating Back Button (Fades out on scroll) */}
      <Animated.View style={[styles.floatingControls, { opacity: controlOpacity }]}>
        <TouchableOpacity style={styles.floatingButton} onPress={() => router.back()}>
          <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <ThemedView style={styles.bannerContainer}>
        <FallbackImage
            uri={resolveImageUrl(merchant.coverImage)}
            style={styles.bannerImage}
            placeholder={PLACEHOLDER_BANNER}
          />
          {!isStoreOpen && (
            <ThemedView style={styles.closedBanner}>
               <ThemedText style={styles.closedBannerText}>CLOSED</ThemedText>
               <ThemedText style={styles.opensAtBannerText}>{nextOpen || 'Closed'}</ThemedText>
            </ThemedView>
          )}
          <ThemedView style={styles.identityRow}>
            <ThemedView style={styles.logoBox}>
              <FallbackImage
                uri={resolveImageUrl(merchant.logo)}
                style={styles.restaurantLogo}
                placeholder={PLACEHOLDER_LOGO}
              />
            </ThemedView>
            <ThemedText style={styles.restaurantNameBeside}>{merchant.name}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.infoCard}>
          <ThemedView style={styles.infoContent}>
            <ThemedView style={styles.ratingRow}>
              <ThemedText style={styles.ratingStar}>★</ThemedText>
              <ThemedText style={styles.ratingValue}>{merchant.rating?.toFixed(1) || 'New'}</ThemedText>
              {merchant.reviewCount ? (
                <TouchableOpacity onPress={() => setShowReviews(true)} activeOpacity={0.7}>
                  <ThemedText style={styles.ratingCount}>({merchant.reviewCount} ratings) ›</ThemedText>
                </TouchableOpacity>
              ) : (
                <ThemedText style={styles.ratingCount}>(No reviews yet)</ThemedText>
              )}
            </ThemedView>

            {merchant.description && (
              <ThemedText style={styles.description}>{merchant.description}</ThemedText>
            )}

            <ThemedView style={styles.deliveryCard}>
              <ThemedView style={styles.deliveryTextGroup}>
                <ThemedText style={styles.deliveryTitle}>
                  Delivery {estimatedEtaText}
                </ThemedText>
                <ThemedText style={styles.deliverySub}>
                  ₱ {estimatedFeeValue.toFixed(2)} delivery fee
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {merchant.address && (
              <ThemedView style={styles.addressCard}>
                <IconSymbol size={14} name="location.fill" color="#5c6cc9" />
                <ThemedText style={styles.addressText}>{merchant.address}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Categories */}
        {categories.length > 0 && (
          <ThemedView style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
              {categories.map((cat, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveCategory(i)} style={[styles.tab, activeCategory === i && styles.activeTab]}>
                  <ThemedText style={[styles.tabText, activeCategory === i && styles.activeTabText]}>{cat}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        )}

          {/* Menu Items */}
        <ThemedView style={styles.menuSection}>
          {menuItems.length === 0 ? (
            <ThemedView style={styles.emptyMenu}>
              <IconSymbol size={48} name="fork.knife" color="#CCC" />
              <ThemedText style={styles.emptyText}>No menu items available</ThemedText>
            </ThemedView>
          ) : (
            (activeCategory === 0 ? categoryKeys : [categories[activeCategory]]).map((categoryName, sIndex) => (
              <ThemedView key={sIndex} style={styles.menuGroup}>
                <ThemedText style={styles.groupTitle}>{categoryName}</ThemedText>
                {menuByCategory[categoryName]?.map((item) => (
                   <TouchableOpacity 
                    key={item.id} 
                    style={[styles.menuItem, (!isStoreOpen || !item.isAvailable) && styles.menuItemDimmed]}
                    onPress={() => {
                      if (!isStoreOpen || !item.isAvailable) return;
                      router.push(`/menu-item/${item.id}`);
                    }}
                    activeOpacity={isStoreOpen && item.isAvailable ? 0.7 : 1}
                  >
                    <ThemedView style={styles.itemInfo}>
                      <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                      {item.description && (
                        <ThemedText style={styles.itemDesc} numberOfLines={2}>{item.description}</ThemedText>
                      )}
                      <ThemedText style={styles.itemPrice}>₱{item.price.toFixed(2)}</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.itemImageWrapper}>
                      <FallbackImage
                        uri={resolveImageUrl(item.image || item.imageUrl)}
                        style={styles.itemImg}
                        placeholder={PLACEHOLDER_ITEM}
                      />
                      {/* Out of Stock overlay on image */}
                      {!item.isAvailable && (
                        <View style={styles.outOfStockOverlay}>
                          <ThemedText style={styles.outOfStockText}>Out of{`\n`}Stock</ThemedText>
                        </View>
                      )}
                      {/* Add button — only when available and store is open */}
                      {item.isAvailable && isStoreOpen && (
                        <TouchableOpacity 
                          style={[
                            styles.addBtn, 
                            items.some(ci => ci.menuItemId === item.id) && { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' }
                          ]} 
                          onPress={() => handleQuickAdd(item)}
                          disabled={addingItemId === item.id || items.some(ci => ci.menuItemId === item.id)}
                        >
                          {addingItemId === item.id ? (
                            <ActivityIndicator size="small" color={items.some(ci => ci.menuItemId === item.id) ? "#4CAF50" : "#5c6cc9"} />
                          ) : items.some(ci => ci.menuItemId === item.id) ? (
                            <IconSymbol size={22} name="checkmark" color="#4CAF50" />
                          ) : (
                            <IconSymbol size={22} name="add" color="#5c6cc9" />
                          )}
                        </TouchableOpacity>
                      )}
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            ))
          )}
        </ThemedView>
        
        <ThemedView style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Cart Preview */}
      {itemCount > 0 && (
        <ThemedView style={[styles.cartPreview, { bottom: Math.max(20, insets.bottom + 10) }]}>
          <ThemedView style={styles.cartInfo}>
            <ThemedText style={styles.cartQty}>{itemCount} ITEMS</ThemedText>
            <ThemedText style={styles.cartTotal}>₱{cartTotal}</ThemedText>
          </ThemedView>
          <TouchableOpacity style={styles.viewBtn} onPress={() => router.push('/(tabs)/cart')}>
            <ThemedText style={styles.viewBtnText}>View Cart</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Reviews Bottom Sheet */}
      {merchant && (
        <ReviewsSheet
          visible={showReviews}
          merchantId={merchant.id}
          merchantName={merchant.name}
          avgRating={merchant.rating}
          reviewCount={merchant.reviewCount}
          onClose={() => setShowReviews(false)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#5c6cc9',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  floatingControls: {
    position: 'absolute',
    top: 35,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 90,
    backgroundColor: 'transparent',
  },
  floatingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  identityRow: {
    position: 'absolute',
    bottom: -45,
    left: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
    zIndex: 110,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  restaurantLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  restaurantNameBeside: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
    marginLeft: 12,
    marginBottom: 10, 
  },
  infoCard: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  infoContent: {
    backgroundColor: 'transparent',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  ratingStar: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  ratingCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#FFF',
  },
  deliveryTextGroup: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  deliverySub: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF5F8',
    borderRadius: 10,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  tabContainer: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5c6cc9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#5c6cc9',
    fontWeight: '800',
  },
  menuSection: {
    padding: 16,
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  menuGroup: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  menuItemDimmed: {
    opacity: 0.5,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  itemImageWrapper: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  itemImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  addBtn: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartPreview: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: '#5c6cc9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cartInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cartQty: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  cartTotal: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '900',
  },
  viewBtn: {
    backgroundColor: 'transparent',
  },
  viewBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  closedBanner: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closedBannerText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  opensAtBannerText: {
    color: '#DDD',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
});
