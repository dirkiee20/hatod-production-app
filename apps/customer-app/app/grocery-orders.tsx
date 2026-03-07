import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useCallback, useState } from 'react';
import { getMyOrders } from '@/api/services';
import { resolveImageUrl } from '@/api/client';

export default function GroceryOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async (isRefreshing = false) => {
    if (!isRefreshing && orders.length === 0) setLoading(true);
    try {
      const data = await getMyOrders();
      if (Array.isArray(data)) setOrders(data);
    } catch (error) {
      console.error('Failed to load grocery orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, []);

  const groceryOrders = orders.filter((o) => {
    const type = o?.merchant?.type;
    return type === 'GROCERY' || type === 'PHARMACY';
  });

  const isPastStatus = (status?: string) =>
    ['DELIVERED', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(String(status || '').toUpperCase());

  const activeOrders = groceryOrders.filter((o) => !isPastStatus(o.status));
  const pastOrders = groceryOrders.filter((o) => isPastStatus(o.status));

  const formatStatus = (status?: string) =>
    String(status || 'PENDING')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (date: string) =>
    new Date(date).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderOrderCard = (order: any, isPast: boolean) => {
    const status = String(order.status || '').toUpperCase();
    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
    const itemLabel = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
    const itemSummary =
      Array.isArray(order.items) && order.items.length > 0
        ? order.items
            .map((item: any) => `${item.quantity}x ${item.menuItem?.name || 'Item'}`)
            .join(', ')
        : 'No item details';
    const isDelivered = status === 'DELIVERED';
    const isCancelled = status === 'CANCELLED' || status === 'CANCELED';
    const logoUrl = resolveImageUrl(order?.merchant?.logo);

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => router.push({ pathname: '/order-summary', params: { id: order.id } })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.storeRow}>
            <View style={styles.iconBox}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.storeLogo} resizeMode="cover" />
              ) : (
                <IconSymbol size={20} name="grocery" color="#4CAF50" />
              )}
            </View>
            <View>
              <ThemedText style={styles.storeName}>{order?.merchant?.name || 'Grocery Store'}</ThemedText>
              <ThemedText style={styles.dateText}>{formatDate(order.createdAt)}</ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              isDelivered ? styles.statusSuccess : isCancelled ? styles.statusError : styles.statusInfo,
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                isDelivered
                  ? styles.statusTextSuccess
                  : isCancelled
                    ? styles.statusTextError
                    : styles.statusTextInfo,
              ]}
            >
              {formatStatus(status)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsContainer}>
          <View style={styles.itemCountBadge}>
            <ThemedText style={styles.itemCountText}>{itemLabel}</ThemedText>
          </View>
          <ThemedText style={styles.itemsDesc} numberOfLines={1}>
            {itemSummary}
          </ThemedText>
        </View>

        <View style={styles.cardFooter}>
          <ThemedText style={styles.totalText}>Total: P{Number(order.total || 0).toFixed(2)}</ThemedText>

          {!isPast && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => router.push({ pathname: '/order-summary', params: { id: order.id } })}
            >
              <ThemedText style={styles.trackText}>Summary</ThemedText>
            </TouchableOpacity>
          )}

          {isPast && isDelivered && order.merchantId && (
            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => router.push(`/grocery-store/${order.merchantId}`)}
            >
              <ThemedText style={styles.reorderText}>Buy Again</ThemedText>
            </TouchableOpacity>
          )}

          {isPast && isCancelled && order.merchantId && (
            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => router.push(`/grocery-store/${order.merchantId}`)}
            >
              <ThemedText style={styles.reorderText}>Visit Store</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const currentList = activeTab === 'Active' ? activeOrders : pastOrders;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Grocery Orders',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol
                size={20}
                name="chevron.right"
                color="#000"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>
            Active
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Past' && styles.activeTab]}
          onPress={() => setActiveTab('Past')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>
            Past
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && orders.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {currentList.length > 0 ? (
            currentList.map((order) => renderOrderCard(order, activeTab === 'Past'))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="grocery" color="#DDD" />
              <ThemedText style={styles.emptyText}>
                {activeTab === 'Active' ? 'No active grocery orders' : 'No past grocery orders'}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  storeLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  dateText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusInfo: { backgroundColor: '#E3F2FD' },
  statusSuccess: { backgroundColor: '#E8F5E9' },
  statusError: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextInfo: { color: '#1976D2' },
  statusTextSuccess: { color: '#388E3C' },
  statusTextError: { color: '#D32F2F' },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCountBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  itemsDesc: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  reorderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
  trackBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
