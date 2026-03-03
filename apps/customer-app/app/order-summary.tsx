import { StyleSheet, ScrollView, TouchableOpacity, View, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getOrderById } from '@/api/services';
import { resolveImageUrl } from '@/api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatMoney = (value: number) => `₱${value.toFixed(2)}`;

export default function OrderSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        setLoading(false);
        Alert.alert('Missing Order', 'No order ID provided.', [
          { text: 'Back to Home', onPress: () => router.replace('/(tabs)') },
        ]);
        return;
      }

      try {
        const data = await getOrderById(id);
        if (!data) {
          Alert.alert('Error', 'Unable to load your order summary.', [
            { text: 'Back to Home', onPress: () => router.replace('/(tabs)') },
          ]);
          return;
        }
        setOrder(data);
      } catch (error) {
        console.error('Failed to load order summary:', error);
        Alert.alert('Error', 'Unable to load your order summary.', [
          { text: 'Back to Home', onPress: () => router.replace('/(tabs)') },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const summary = useMemo(() => {
    const items = Array.isArray(order?.items) ? order.items : [];
    const subtotal = items.reduce((sum: number, item: any) => {
      const itemPrice = Number(item?.price ?? item?.menuItem?.price ?? 0);
      const quantity = Number(item?.quantity ?? 1);
      return sum + itemPrice * quantity;
    }, 0);
    const deliveryFee = Number(order?.deliveryFee ?? 0);
    const total = Number(order?.totalAmount ?? order?.total ?? subtotal + deliveryFee);
    const itemCount = items.reduce((sum: number, item: any) => sum + Number(item?.quantity ?? 1), 0);
    return { items, subtotal, deliveryFee, total, itemCount };
  }, [order]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.loadingWrap]}>
        <ActivityIndicator size="large" color="#5c6cc9" />
      </ThemedView>
    );
  }

  if (!order) return null;

  const orderNumber = order.orderNumber || order.id?.slice(0, 8)?.toUpperCase();
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
  const addressText = order?.address?.street || order?.deliveryAddress || 'No delivery address';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Order Summary',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ThemedView style={styles.successCard}>
          <View style={styles.successIcon}>
            <IconSymbol size={20} name="checkmark" color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.successTitle}>Order placed successfully</ThemedText>
            <ThemedText style={styles.successSub}>Order #{orderNumber}</ThemedText>
            {!!createdAt && <ThemedText style={styles.successSub}>{createdAt}</ThemedText>}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Merchant</ThemedText>
          <View style={styles.merchantRow}>
            {order?.merchant?.logo ? (
              <Image source={{ uri: resolveImageUrl(order.merchant.logo) }} style={styles.merchantLogo} />
            ) : (
              <View style={styles.merchantFallback}>
                <IconSymbol size={18} name="food" color="#5c6cc9" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.merchantName}>{order?.merchant?.name || 'Hatod Partner'}</ThemedText>
              <ThemedText style={styles.merchantStatus}>Status: {String(order?.status || 'PENDING').replace(/_/g, ' ')}</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Items ({summary.itemCount})</ThemedText>
          {summary.items.map((item: any, index: number) => (
            <View key={`${item?.id || index}`} style={styles.itemRow}>
              <Image
                source={{ uri: resolveImageUrl(item?.menuItem?.image || item?.menuItem?.imageUrl) || undefined }}
                style={styles.itemImage}
              />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.itemName}>{item?.quantity || 1}x {item?.menuItem?.name || item?.name || 'Item'}</ThemedText>
                {(() => {
                  const rawOptions = item?.options ?? item?.notes;
                  if (!rawOptions) return null;
                  let parsed: Record<string, any> = {};
                  try {
                    parsed = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions;
                  } catch {
                    return null;
                  }
                  const lines = Object.entries(parsed).filter(([, val]) =>
                    val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0),
                  );
                  if (lines.length === 0) return null;
                  return (
                    <View style={{ marginTop: 4 }}>
                      {lines.map(([key, val]) => (
                        <ThemedText key={`${item?.id || index}-${key}`} style={styles.itemMeta}>
                          {key}: {Array.isArray(val) ? val.join(', ') : String(val)}
                        </ThemedText>
                      ))}
                    </View>
                  );
                })()}
              </View>
              <ThemedText style={styles.itemPrice}>{formatMoney((Number(item?.price || 0) * Number(item?.quantity || 1)))}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <IconSymbol size={16} name="house.fill" color="#5c6cc9" />
            </View>
            <ThemedText style={styles.addressText}>{addressText}</ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Summary</ThemedText>
          <View style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.billValue}>{formatMoney(summary.subtotal)}</ThemedText>
          </View>
          <View style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Delivery Fee</ThemedText>
            <ThemedText style={styles.billValue}>{formatMoney(summary.deliveryFee)}</ThemedText>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>{formatMoney(summary.total)}</ThemedText>
          </View>
        </ThemedView>

        <View style={{ height: 120 }} />
      </ScrollView>

      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => router.push({ pathname: '/order-tracking', params: { id: order.id } })}
        >
          <ThemedText style={styles.trackBtnText}>Track Order</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)')}>
          <ThemedText style={styles.browseBtnText}>Back to Browsing</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  successIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2E7D32',
  },
  successSub: {
    fontSize: 12,
    color: '#4E8F52',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  merchantLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
  merchantFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBEFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },
  merchantStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F3F3F3',
    marginRight: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  itemMeta: {
    fontSize: 11,
    color: '#888',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    marginLeft: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBEFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#444',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#666',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5c6cc9',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  trackBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#5c6cc9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  browseBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7DCF7',
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseBtnText: {
    color: '#5c6cc9',
    fontSize: 14,
    fontWeight: '800',
  },
});
