import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrderById, updateOrderStatus } from '@/api/services';
import { Order, OrderStatus } from '@/api/types';

const formatCurrency = (value: number) => `₱${Number(value || 0).toFixed(2)}`;
const formatStatus = (status?: string) => (status || '').replace(/_/g, ' ');

const getStatusColors = (status?: string) => {
  if (status === 'DELIVERED') return { bg: '#E8F5E9', text: '#388E3C' };
  if (status === 'CANCELLED') return { bg: '#FFEBEE', text: '#D32F2F' };
  if (status === 'PENDING') return { bg: '#FFF8E1', text: '#F57C00' };
  return { bg: '#E3F2FD', text: '#1976D2' };
};

const canCancel = (status?: string) =>
  ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(String(status || ''));

const getOptionsText = (item: any): string | null => {
  const raw = item?.options ?? item?.notes;
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
        .join(' • ');
    } catch {
      return raw;
    }
  }
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      .join(' • ');
  }
  return null;
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const orderId = Array.isArray(id) ? id[0] : id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getOrderById(orderId);
    setOrder(data);
    setLoading(false);
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder]),
  );

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert(
      'Cancel Order',
      `Cancel order #${order.orderNumber || order.id.slice(0, 8)}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            const ok = await updateOrderStatus(order.id, OrderStatus.CANCELLED);
            setUpdating(false);
            if (!ok) {
              Alert.alert('Error', 'Failed to cancel order.');
              return;
            }
            await fetchOrder();
          },
        },
      ],
    );
  };

  const timeline = useMemo(() => {
    const status = String(order?.status || '');
    const isCancelled = status === 'CANCELLED';

    const steps = [
      { label: 'Order Placed', done: true },
      { label: 'Preparing', done: ['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING', 'DELIVERED'].includes(status) },
      { label: 'Delivery', done: ['PICKED_UP', 'DELIVERING', 'DELIVERED'].includes(status) },
      { label: 'Completed', done: status === 'DELIVERED' },
    ];

    if (isCancelled) {
      return steps.map((step, idx) => ({ ...step, done: idx === 0 }));
    }

    return steps;
  }, [order?.status]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#C2185B" />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={{ color: '#666', marginBottom: 12 }}>Order not found.</ThemedText>
        <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => router.back()}>
          <ThemedText style={styles.secondaryBtnText}>Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const statusColor = getStatusColors(order.status);
  const customerName =
    order.customer?.name ||
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() ||
    'Guest';
  const customerPhone = order.customer?.user?.phone || order.customer?.phone || 'No phone';
  const riderName =
    `${order.rider?.firstName || ''} ${order.rider?.lastName || ''}`.trim() || order.rider?.name || 'Unassigned';
  const riderMeta = order.rider
    ? `${order.rider.vehicleType || 'Rider'}${order.rider.vehicleNumber ? ` • ${order.rider.vehicleNumber}` : ''}`
    : 'No rider assigned yet';
  const address = [order.address?.street, order.address?.city, order.address?.state].filter(Boolean).join(', ') || order.deliveryAddress || 'No address';
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
  const subtotal = Number(order.subtotal ?? order.totalAmount ?? 0);
  const deliveryFee = Number(order.deliveryFee ?? 0);
  const tax = Number(order.tax ?? 0);
  const total = Number(order.total ?? order.totalAmount ?? subtotal + deliveryFee + tax);
  const paymentMethod = order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ') : 'N/A';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Order Details',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.orderIdBlock}>
              <ThemedText style={styles.orderId}>#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <ThemedText style={[styles.statusText, { color: statusColor.text }]}>{formatStatus(order.status)}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.orderTime}>{createdAt}</ThemedText>

          <View style={styles.timeline}>
            {timeline.map((step, idx) => (
              <React.Fragment key={step.label}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, step.done && styles.dotActive]} />
                  <ThemedText style={[styles.timelineText, !step.done && styles.textInactive]}>{step.label}</ThemedText>
                </View>
                {idx < timeline.length - 1 && (
                  <View style={[styles.timelineLine, !(step.done && timeline[idx + 1].done) && styles.lineInactive]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>People Involved</ThemedText>

          <View style={styles.personCard}>
            <View style={[styles.avatar, styles.iconAvatar]}>
              <IconSymbol size={24} name="person.fill" color="#C2185B" />
            </View>
            <View style={styles.personInfo}>
              <ThemedText style={styles.roleLabel}>Customer</ThemedText>
              <ThemedText style={styles.personName}>{customerName}</ThemedText>
              <ThemedText style={styles.personDetail}>{customerPhone}</ThemedText>
            </View>
          </View>

          <View style={styles.personCard}>
            <View style={[styles.avatar, { backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }]}>
              <IconSymbol size={24} name="paperplane.fill" color="#1976D2" />
            </View>
            <View style={styles.personInfo}>
              <ThemedText style={styles.roleLabel}>Rider</ThemedText>
              <ThemedText style={styles.personName}>{riderName}</ThemedText>
              <ThemedText style={styles.personDetail}>{riderMeta}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Delivery Location</ThemedText>
          <View style={styles.locationCard}>
            <IconSymbol size={24} name="map" color="#C2185B" />
            <View style={styles.locationInfo}>
              <ThemedText style={styles.locationAddress}>{address}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
          <View style={styles.itemsCard}>
            <View style={styles.restaurantHeader}>
              <ThemedText style={styles.restaurantName}>{order.merchant?.name || 'Merchant'}</ThemedText>
            </View>

            {(order.items || []).map((item, idx) => {
              const optionsText = getOptionsText(item);
              const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
              return (
                <View key={item.id || idx} style={styles.orderItem}>
                  <View style={styles.quantityBadge}>
                    <ThemedText style={styles.quantityText}>{item.quantity}x</ThemedText>
                  </View>
                  <View style={styles.itemDetails}>
                    <ThemedText style={styles.itemName}>{item.menuItem?.name || 'Item'}</ThemedText>
                    {!!optionsText && <ThemedText style={styles.itemOptions}>{optionsText}</ThemedText>}
                  </View>
                  <ThemedText style={styles.itemPrice}>{formatCurrency(lineTotal)}</ThemedText>
                </View>
              );
            })}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
              <ThemedText style={styles.summaryValue}>{formatCurrency(subtotal)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Delivery Fee</ThemedText>
              <ThemedText style={styles.summaryValue}>{formatCurrency(deliveryFee)}</ThemedText>
            </View>
            {tax > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Tax</ThemedText>
                <ThemedText style={styles.summaryValue}>{formatCurrency(tax)}</ThemedText>
              </View>
            )}

            <View style={[styles.divider, { marginTop: 12 }]} />

            <View style={styles.totalRow}>
              <View>
                <ThemedText style={styles.totalLabel}>Total</ThemedText>
                <ThemedText style={styles.paymentMethod}>{paymentMethod}</ThemedText>
              </View>
              <ThemedText style={styles.totalValue}>{formatCurrency(total)}</ThemedText>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => router.back()}>
          <ThemedText style={styles.secondaryBtnText}>Back</ThemedText>
        </TouchableOpacity>
        {canCancel(order.status) ? (
          <TouchableOpacity
            style={[styles.actionBtnPrimary, updating && { opacity: 0.7 }]}
            onPress={handleCancelOrder}
            disabled={updating}
          >
            {updating ? <ActivityIndicator size="small" color="#FFF" /> : <ThemedText style={styles.primaryBtnText}>Cancel Order</ThemedText>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={fetchOrder}>
            <ThemedText style={styles.primaryBtnText}>Refresh</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  orderIdBlock: {
    flex: 1,
    minWidth: 0,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  orderTime: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timelineItem: {
    alignItems: 'center',
    width: 60,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EEE',
    marginBottom: 6,
  },
  dotActive: {
    backgroundColor: '#C2185B',
  },
  timelineText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  textInactive: {
    color: '#CCC',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#C2185B',
    marginBottom: 20,
  },
  lineInactive: {
    backgroundColor: '#EEE',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
    marginLeft: 4,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  iconAvatar: {
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  personName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  personDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    lineHeight: 20,
  },
  itemsCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  restaurantHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quantityBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
    height: 24,
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemOptions: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C2185B',
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
  actionBtnSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  secondaryBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnPrimary: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
