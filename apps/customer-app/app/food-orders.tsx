import { StyleSheet, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback } from 'react';
import { getMyOrders } from '@/api/services';

export default function FoodOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefreshing = false) => {
      // Only show full loader if we have no data and not refreshing
      if (orders.length === 0 && !isRefreshing) {
        setLoading(true);
      }
      
      try {
          const data = await getMyOrders();
          if (Array.isArray(data)) {
              setOrders(data);
          }
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

  const activeOrders = orders.filter(o => !['DELIVERED', 'COMPLETED', 'CANCELED'].includes(o.status));
  const pastOrders = orders.filter(o => ['DELIVERED', 'COMPLETED', 'CANCELED'].includes(o.status));

  const renderOrderCard = (order: any, isPast: boolean) => (
    <TouchableOpacity 
        key={order.id} 
        style={styles.card} 
        onPress={() => router.push({ pathname: '/order-tracking', params: { id: order.id } })}
    >
        <View style={styles.cardHeader}>
            <View style={styles.restaurantRow}>
                <View style={styles.iconBox}>
                    <IconSymbol size={20} name="food" color="#f78734" />
                </View>
                <View>
                    <ThemedText style={styles.restaurantName}>{order.merchant?.name || 'Unknown Store'}</ThemedText>
                    <ThemedText style={styles.dateText}>{new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</ThemedText>
                </View>
            </View>
            <View style={[styles.statusBadge, 
                order.status === 'DELIVERED' ? styles.statusSuccess : 
                order.status === 'CANCELED' ? styles.statusError : styles.statusInfo
            ]}>
                <ThemedText style={[styles.statusText,
                     order.status === 'DELIVERED' ? styles.statusTextSuccess : 
                     order.status === 'CANCELED' ? styles.statusTextError : styles.statusTextInfo
                ]}>{order.status}</ThemedText>
            </View>
        </View>
        
        <View style={styles.divider} />
        
        <ThemedText style={styles.itemsText} numberOfLines={2}>
            {order.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name || i.name}`).join(', ')}
        </ThemedText>

        <View style={styles.cardFooter}>
            <ThemedText style={styles.totalText}>Total: ₱{order.total}</ThemedText>
            {isPast && order.status === 'DELIVERED' && (
                <TouchableOpacity 
                    style={styles.reorderBtn}
                    onPress={() => router.push(`/restaurant/${order.merchantId}`)}
                >
                    <ThemedText style={styles.reorderText}>Visit Store</ThemedText>
                </TouchableOpacity>
            )}
            {!isPast && (
                 <TouchableOpacity 
                    style={styles.trackBtn} 
                    onPress={() => router.push({ pathname: '/order-tracking', params: { id: order.id } })}
                 >
                    <ThemedText style={styles.trackText}>Track Order</ThemedText>
                </TouchableOpacity>
            )}
        </View>
    </TouchableOpacity>
  );

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
    backgroundColor: '#5c6cc9',
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
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  restaurantName: {
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
  itemsText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
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
    borderColor: '#f78734',
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f78734',
  },
  trackBtn: {
    backgroundColor: '#f78734',
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
