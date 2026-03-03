import {
  StyleSheet, View, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Animated,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getMyOrders, createReview } from '@/api/services';
import { resolveImageUrl } from '@/api/client';

// ─── Rating Modal ─────────────────────────────────────────────────────────────

interface RatingModalProps {
  visible: boolean;
  order: any | null;
  onClose: () => void;
  onSubmitted: (orderId: string) => void;
}

function RatingModal({ visible, order, onClose, onSubmitted }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRating(0);
      setHoveredRating(0);
      setComment('');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    if (!order) return;

    setSubmitting(true);
    try {
      await createReview(order.id, rating, comment.trim() || undefined);
      onSubmitted(order.id);
      Alert.alert('Thank you! ⭐', 'Your review has been submitted successfully.');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already')) {
        onSubmitted(order.id); // Mark as reviewed anyway
        Alert.alert('Already Reviewed', 'You have already rated this order.');
      } else {
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor 😞', 'Fair 😐', 'Good 😊', 'Great 😄', 'Excellent 🤩'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Rate Your Order</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol size={18} name="xmark" color="#666" />
            </TouchableOpacity>
          </View>

          {/* Store info */}
          {order && (
            <View style={styles.storeRow}>
              <View style={styles.storeIconBox}>
                {order.merchant?.logo ? (
                  <Image source={{ uri: resolveImageUrl(order.merchant.logo) }} style={styles.storeLogoSm} />
                ) : (
                  <IconSymbol size={18} name="food" color="#f78734" />
                )}
              </View>
              <View>
                <ThemedText style={styles.storeName}>{order.merchant?.name || 'Store'}</ThemedText>
                <ThemedText style={styles.storeDate}>
                  {new Date(order.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Stars */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <ThemedText style={[
                  styles.starIcon,
                  star <= (hoveredRating || rating) ? styles.starFilled : styles.starEmpty,
                ]}>
                  ★
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Label */}
          <ThemedText style={styles.ratingLabel}>
            {ratingLabels[rating] || 'Tap to rate'}
          </ThemedText>

          {/* Comment */}
          <View style={styles.commentWrapper}>
            <ThemedText style={styles.commentLabel}>Leave a comment (optional)</ThemedText>
            <TextInput
              style={styles.commentInput}
              placeholder="How was your experience? Food quality, packaging, delivery..."
              placeholderTextColor="#BDBDBD"
              multiline
              numberOfLines={3}
              maxLength={300}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
            <ThemedText style={styles.charCount}>{comment.length}/300</ThemedText>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <ThemedText style={styles.submitText}>Submit Review</ThemedText>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FoodOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rating modal state
  const [ratingOrder, setRatingOrder] = useState<any | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefreshing = false) => {
    if (orders.length === 0 && !isRefreshing) setLoading(true);
    try {
      const data = await getMyOrders();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, []);

  const handleReviewSubmitted = (orderId: string) => {
    setReviewedOrderIds(prev => new Set([...prev, orderId]));
    setRatingOrder(null);
  };

  const activeOrders = orders.filter(o => !['DELIVERED', 'COMPLETED', 'CANCELED'].includes(o.status));
  const pastOrders = orders.filter(o => ['DELIVERED', 'COMPLETED', 'CANCELED'].includes(o.status));

  const StoreLogo = ({ logoUrl }: { logoUrl: string | null | undefined }) => {
    const [imageError, setImageError] = useState(false);
    if (!logoUrl || imageError) {
      return <IconSymbol size={20} name="food" color="#f78734" />;
    }
    return (
      <Image
        source={{ uri: logoUrl }}
        style={styles.storeLogo}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
    );
  };

  const renderOrderCard = (order: any, isPast: boolean) => {
    const logoUrl = order.merchant?.logo ? resolveImageUrl(order.merchant.logo) : null;
    const isDelivered = order.status === 'DELIVERED';
    const alreadyReviewed = reviewedOrderIds.has(order.id) || !!order.review;

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.card}
        onPress={() => router.push({ pathname: '/order-summary', params: { id: order.id } })}
        activeOpacity={0.95}
      >
        <View style={styles.cardHeader}>
          <View style={styles.restaurantRow}>
            <View style={styles.iconBox}>
              <StoreLogo logoUrl={logoUrl} />
            </View>
            <View>
              <ThemedText style={styles.restaurantName}>{order.merchant?.name || 'Unknown Store'}</ThemedText>
              <ThemedText style={styles.dateText}>
                {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            order.status === 'DELIVERED' ? styles.statusSuccess :
            order.status === 'CANCELED' ? styles.statusError : styles.statusInfo,
          ]}>
            <ThemedText style={[
              styles.statusText,
              order.status === 'DELIVERED' ? styles.statusTextSuccess :
              order.status === 'CANCELED' ? styles.statusTextError : styles.statusTextInfo,
            ]}>{order.status}</ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        <ThemedText style={styles.itemsText} numberOfLines={2}>
          {order.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name || i.name}`).join(', ')}
        </ThemedText>

        <View style={styles.cardFooter}>
          <ThemedText style={styles.totalText}>Total: ₱{order.total}</ThemedText>

          {/* Past + Delivered → Rate or Reviewed badge */}
          {isPast && isDelivered && (
            alreadyReviewed ? (
              <View style={styles.reviewedBadge}>
                <IconSymbol size={12} name="checkmark" color="#388E3C" />
                <ThemedText style={styles.reviewedText}>Reviewed</ThemedText>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setRatingOrder(order);
                }}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.rateStar}>★</ThemedText>
                <ThemedText style={styles.rateText}>Rate Order</ThemedText>
              </TouchableOpacity>
            )
          )}

          {/* Active orders → Track */}
          {!isPast && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => router.push({ pathname: '/order-summary', params: { id: order.id } })}
            >
              <ThemedText style={styles.trackText}>View Summary</ThemedText>
            </TouchableOpacity>
          )}

          {/* Past + Cancelled → Visit Store */}
          {isPast && !isDelivered && (
            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => router.push(`/restaurant/${order.merchantId}`)}
            >
              <ThemedText style={styles.reorderText}>Visit Store</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'My Food Orders',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Past' && styles.activeTab]}
          onPress={() => setActiveTab('Past')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past</ThemedText>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && orders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#f78734" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'Active' ? (
            activeOrders.length > 0 ? (
              activeOrders.map(order => renderOrderCard(order, false))
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol size={48} name="food" color="#DDD" />
                <ThemedText style={styles.emptyText}>No active orders</ThemedText>
              </View>
            )
          ) : (
            pastOrders.length > 0 ? (
              pastOrders.map(order => renderOrderCard(order, true))
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol size={48} name="food" color="#DDD" />
                <ThemedText style={styles.emptyText}>No past orders</ThemedText>
              </View>
            )
          )}
        </ScrollView>
      )}

      {/* Rating Modal */}
      <RatingModal
        visible={!!ratingOrder}
        order={ratingOrder}
        onClose={() => setRatingOrder(null)}
        onSubmitted={handleReviewSubmitted}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // ── Tabs ──
  tabsContainer: {
    flexDirection: 'row', backgroundColor: '#FFF', padding: 4,
    margin: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EEE',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#5c6cc9' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#FFF', fontWeight: '800' },
  listContent: { padding: 16, paddingTop: 0 },

  // ── Order Card ──
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#EEE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  restaurantRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden',
  },
  storeLogo: { width: 36, height: 36, borderRadius: 8 },
  restaurantName: { fontSize: 14, fontWeight: '800', color: '#333' },
  dateText: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusInfo: { backgroundColor: '#E3F2FD' },
  statusSuccess: { backgroundColor: '#E8F5E9' },
  statusError: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextInfo: { color: '#1976D2' },
  statusTextSuccess: { color: '#388E3C' },
  statusTextError: { color: '#D32F2F' },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 12 },
  itemsText: { fontSize: 13, color: '#555', marginBottom: 12, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 14, fontWeight: '800', color: '#333' },

  // ── Buttons ──
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8,
    backgroundColor: '#FFF9E6', borderWidth: 1.5, borderColor: '#FFD700',
  },
  rateStar: { fontSize: 14, color: '#FFD700' },
  rateText: { fontSize: 12, fontWeight: '800', color: '#B8860B' },
  reviewedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  reviewedText: { fontSize: 12, fontWeight: '700', color: '#388E3C' },
  reorderBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#f78734',
  },
  reorderText: { fontSize: 12, fontWeight: '700', color: '#f78734' },
  trackBtn: {
    backgroundColor: '#f78734', paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: 8,
  },
  trackText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: '#999', fontSize: 14 },

  // ── Rating Modal ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#222' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  storeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  storeIconBox: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  storeLogoSm: { width: 44, height: 44, borderRadius: 10 },
  storeName: { fontSize: 15, fontWeight: '800', color: '#222' },
  storeDate: { fontSize: 12, color: '#888', marginTop: 2 },

  // Stars
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 44 },
  starFilled: { color: '#FFD700' },
  starEmpty: { color: '#E0E0E0' },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#555', marginBottom: 24, minHeight: 22 },

  // Comment
  commentWrapper: { marginBottom: 24 },
  commentLabel: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8 },
  commentInput: {
    borderWidth: 1.5, borderColor: '#EEEEEE', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#333', backgroundColor: '#FAFAFA',
    minHeight: 90, lineHeight: 20,
  },
  charCount: { fontSize: 11, color: '#BDBDBD', textAlign: 'right', marginTop: 6 },

  // Submit
  submitBtn: {
    backgroundColor: '#5c6cc9', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#5c6cc9', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: '#C5CAE9', shadowOpacity: 0 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
});
