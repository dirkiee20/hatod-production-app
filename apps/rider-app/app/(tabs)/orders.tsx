import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRiderOrders } from '@/api/rider-service';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('[RiderApp Orders] Starting fetchOrders...');
      
      const data = await getRiderOrders();
      console.log('[RiderApp Orders] Orders fetched successfully:', data ? data.length : 'null');
      
      if (!Array.isArray(data)) {
        console.warn('[RiderApp Orders] Data is not an array:', data);
        setOrders([]);
        return;
      }

      // Sort by date desc
      const sorted = data.sort((a: any, b: any) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error('[RiderApp Orders] Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { marginTop: insets.top + 16 }]}>
        <ThemedText style={styles.screenTitle}>My Deliveries</ThemedText>
        <View style={styles.filterBtn}>
          <IconSymbol size={20} name="receipt" color="#666" />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C2185B']} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#C2185B" style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol size={48} name="receipt" color="#CCC" />
            <ThemedText style={styles.emptyText}>No orders found</ThemedText>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.orderCard}
              onPress={() => router.push(`/order-details/${order.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateRow}>
                  <ThemedText style={styles.orderDate}>{formatDate(order.updatedAt)}</ThemedText>
                  <ThemedText style={styles.orderId}>{order.orderNumber || order.id.slice(0, 8)}</ThemedText>
                </View>
                <ThemedText style={styles.earnings}>₱{order.deliveryFee}</ThemedText>
              </View>

              <View style={styles.divider} />

              <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: '#C2185B' }]} />
                  <ThemedText style={styles.locationText}>
                    {order.merchant?.name || 'Unknown Merchant'}
                  </ThemedText>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <View style={[styles.dot, { backgroundColor: '#1976D2' }]} />
                  <ThemedText style={styles.locationText} numberOfLines={1}>
                    {order.address?.street}, {order.address?.city}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statBadge}>
                  <IconSymbol size={14} name="map" color="#666" />
                  <ThemedText style={styles.statText}>-- km</ThemedText> 
                  {/* Distance is not yet available in backend response */}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: order.status === 'DELIVERED' ? '#E8F5E9' : '#FFF3E0' }]}>
                  <ThemedText style={[styles.statusText, { color: order.status === 'DELIVERED' ? '#388E3C' : '#FF9800' }]}>
                    {order.status}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateRow: {
    flex: 1,
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  earnings: {
    fontSize: 16,
    fontWeight: '900',
    color: '#388E3C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: '#EEE',
    marginLeft: 3,
    marginVertical: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#388E3C',
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  }
});
