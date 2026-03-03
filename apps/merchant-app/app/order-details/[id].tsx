import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrderById, updateOrderStatus } from '@/api/services';
import { Order, OrderStatus } from '@/api/types';
import { getMerchantOrderItemUnitPrice, getMerchantOrderSubtotal } from '@/lib/pricing';

const formatMoney = (value: number) => `₱${Number(value || 0).toFixed(2)}`;

const getPrimaryAction = (status: OrderStatus): { label: string; nextStatus: OrderStatus } | null => {
  if (status === OrderStatus.PENDING) return { label: 'Confirm Order', nextStatus: OrderStatus.CONFIRMED };
  if (status === OrderStatus.CONFIRMED) return { label: 'Move to Preparation', nextStatus: OrderStatus.PREPARING };
  if (status === OrderStatus.PREPARING) return { label: 'Mark Ready for Pickup', nextStatus: OrderStatus.READY_FOR_PICKUP };
  return null;
};

const canCancelOrder = (status: OrderStatus) =>
  [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP].includes(status);

const renderOptionsText = (item: Order['items'][number]) => {
  if (typeof item.notes === 'string' && item.notes.trim().length > 0) return item.notes.trim();

  const rawOptions = item.options;
  if (!rawOptions) return null;

  if (typeof rawOptions === 'string') {
    try {
      const parsed = JSON.parse(rawOptions);
      return Object.entries(parsed)
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
        .join(' • ');
    } catch {
      return rawOptions;
    }
  }

  if (typeof rawOptions === 'object') {
    return Object.entries(rawOptions)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
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

  const handleUpdateStatus = async (nextStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    const success = await updateOrderStatus(order.id, nextStatus);
    if (!success) {
      Alert.alert('Error', 'Failed to update order status.');
      setUpdating(false);
      return;
    }
    await fetchOrder();
    setUpdating(false);
  };

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert(
      'Cancel Order',
      `Cancel order #${order.orderNumber || order.id.slice(0, 8)}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        { text: 'Cancel Order', style: 'destructive', onPress: () => handleUpdateStatus(OrderStatus.CANCELLED) },
      ],
    );
  };

  const callCustomer = async () => {
    const phone = order?.customer?.user?.phone || order?.customer?.phone;
    if (!phone) {
      Alert.alert('No Phone', 'Customer phone number is not available.');
      return;
    }
    const url = `tel:${phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unsupported', 'This device cannot place a call.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open dialer.');
    }
  };

  const customerName = useMemo(() => {
    if (!order?.customer) return 'Guest Customer';
    return `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Guest Customer';
  }, [order]);

  const customerPhone = order?.customer?.user?.phone || order?.customer?.phone || 'No phone provided';
  const addressText = [order?.address?.street, order?.address?.city, order?.address?.state]
    .filter(Boolean)
    .join(', ') || 'No address provided';

  const merchantSubtotal = useMemo(() => getMerchantOrderSubtotal(order), [order]);
  const primaryAction = order ? getPrimaryAction(order.status) : null;
  const showCancel = order ? canCancelOrder(order.status) : false;

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
        <TouchableOpacity onPress={() => router.back()} style={styles.secondaryGhostBtn}>
          <ThemedText style={styles.secondaryGhostText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.statusPill}>
          <ThemedText style={styles.statusText}>{order.status.replace(/_/g, ' ')}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>
          <ThemedView style={styles.card}>
            <View style={styles.customerHeader}>
              <View style={styles.avatarBox}>
                <IconSymbol size={24} name="person" color="#C2185B" />
              </View>
              <View style={styles.customerMeta}>
                <ThemedText style={styles.customerName}>{customerName}</ThemedText>
                <ThemedText style={styles.customerPhone}>{customerPhone}</ThemedText>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
                <IconSymbol size={18} name="phone.fill" color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.addressRow}>
              <IconSymbol size={16} name="house.fill" color="#888" />
              <ThemedText style={styles.addressText}>{addressText}</ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Items</ThemedText>
          <ThemedView style={styles.card}>
            {(order.items || []).map((item, idx) => {
              const optionsText = renderOptionsText(item);
              const lineTotal = getMerchantOrderItemUnitPrice(item) * Number(item.quantity || 1);
              return (
                <View key={item.id} style={[styles.itemRow, idx !== order.items.length - 1 && styles.itemDivider]}>
                  <View style={styles.itemMain}>
                    <ThemedText style={styles.itemQty}>{item.quantity}x</ThemedText>
                    <View style={styles.itemInfo}>
                      <ThemedText style={styles.itemName}>{item.menuItem?.name || 'Menu Item'}</ThemedText>
                      {!!optionsText && <ThemedText style={styles.itemOptions}>{optionsText}</ThemedText>}
                    </View>
                  </View>
                  <ThemedText style={styles.itemPrice}>{formatMoney(lineTotal)}</ThemedText>
                </View>
              );
            })}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Summary</ThemedText>
          <ThemedView style={styles.card}>
            <View style={styles.billRow}>
              <ThemedText style={styles.billLabel}>Subtotal (Original Price)</ThemedText>
              <ThemedText style={styles.billValue}>{formatMoney(merchantSubtotal)}</ThemedText>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <ThemedText style={styles.totalLabel}>Total Earned</ThemedText>
              <ThemedText style={styles.totalValue}>{formatMoney(merchantSubtotal)}</ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        <View style={{ height: 130 }} />
      </ScrollView>

      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {showCancel ? (
          <TouchableOpacity style={[styles.cancelBtn, updating && styles.disabledBtn]} onPress={handleCancelOrder} disabled={updating}>
            <ThemedText style={styles.cancelBtnText}>Cancel Order</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <ThemedText style={styles.cancelBtnText}>Back</ThemedText>
          </TouchableOpacity>
        )}

        {primaryAction ? (
          <TouchableOpacity
            style={[styles.acceptBtn, updating && styles.disabledBtn]}
            onPress={() => handleUpdateStatus(primaryAction.nextStatus)}
            disabled={updating}
          >
            {updating ? <ActivityIndicator size="small" color="#FFF" /> : <ThemedText style={styles.acceptBtnText}>{primaryAction.label}</ThemedText>}
          </TouchableOpacity>
        ) : (
          <View style={styles.acceptBtnDisabled}>
            <ThemedText style={styles.acceptBtnDisabledText}>No Further Action</ThemedText>
          </View>
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
  section: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#888',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FCE4EC',
    marginBottom: 14,
  },
  statusText: {
    color: '#C2185B',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerMeta: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  customerPhone: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#388E3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 15,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  addressText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemMain: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: 'transparent',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '900',
    color: '#C2185B',
    width: 30,
  },
  itemInfo: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  itemOptions: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  billLabel: {
    fontSize: 13,
    color: '#777',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
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
    justifyContent: 'center',
    gap: 12,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '800',
  },
  acceptBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  acceptBtnDisabled: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnDisabledText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryGhostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F1F1',
  },
  secondaryGhostText: {
    color: '#333',
    fontWeight: '700',
  },
});
