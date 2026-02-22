import { StyleSheet, ScrollView, TouchableOpacity, View, Switch, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';
import { useLocationTracker } from '@/hooks/useLocationTracker';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  useLocationTracker(isOnline);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [stats, setStats] = useState({
    earnings: 0,
    orders: 0,
    onlineHours: '0h',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, ordersRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/orders'),
      ]);

      setUserData(userRes.data);
      
      const allOrders = ordersRes.data;
      // Filter for delivered orders
      const deliveredOrders = allOrders.filter((o: any) => o.status === 'DELIVERED');
      
      // Find active order (Assigned to me and active)
      // Note: Backend findAll might return unassigned READY orders too, so check riderId.
      const myId = userRes.data.rider?.id;
      
      // 1. Check for Active Order (Assigned to me and in progress)
      let active = allOrders.find((o: any) => 
        ['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING'].includes(o.status) && 
        o.rider?.id === myId
      );

      // 2. If no active order, check for Available Orders (Ready and Unassigned)
      // Only if rider is ONLINE
      if (!active && (userRes.data.rider?.status === 'AVAILABLE' || userRes.data.rider?.status === 'BUSY')) {
          active = allOrders.find((o: any) => 
            o.status === 'READY_FOR_PICKUP' && 
            !o.riderId // Unassigned
          );
          if (active) {
              active.isAvailableRequest = true;
          }
      }

      setActiveOrder(active || null);

      const totalEarnings = deliveredOrders.reduce((sum: number, order: any) => sum + (order.deliveryFee || 0), 0);
      
      setStats({
        earnings: totalEarnings,
        orders: deliveredOrders.length,
        onlineHours: '4h 30m', 
      });
      
      const sortedOrders = allOrders.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRecentOrders(sortedOrders.slice(0, 5));
      
      if (userRes.data.rider?.status === 'AVAILABLE' || userRes.data.rider?.status === 'BUSY') {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const toggleOnlineStatus = async (value: boolean) => {
    setIsOnline(value);
    try {
        await api.patch('/riders/status', { status: value ? 'AVAILABLE' : 'OFFLINE' });
    } catch (error) {
        console.error('Failed to update status', error);
        setIsOnline(!value);
        Alert.alert('Error', 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return '#388E3C';
      case 'CANCELLED': return '#D32F2F';
      case 'DELIVERING': return '#1976D2';
      case 'READY_FOR_PICKUP': return '#FBC02D';
      case 'PICKED_UP': return '#FF9800';
      case 'PREPARING': return '#F57C00';
      default: return '#999';
    }
  };

  const dashboardStats = [
    { label: 'Earnings', value: `₱${stats.earnings.toFixed(2)}`, icon: 'fees', color: '#388E3C' },
    { label: 'Orders', value: stats.orders.toString(), icon: 'orders', color: '#1976D2' },
    { label: 'Online', value: stats.onlineHours, icon: 'dashboard', color: '#F57C00' },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <ThemedText style={styles.greeting}>Good day,</ThemedText>
          <ThemedText style={styles.riderName}>
            {userData?.rider ? `${userData.rider.firstName} ${userData.rider.lastName}` : 'Rider'}
          </ThemedText>
        </View>
        <View style={styles.statusToggle}>
          <ThemedText style={[styles.statusText, { color: isOnline ? '#388E3C' : '#999' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </ThemedText>
          <Switch 
            value={isOnline} 
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#DDD', true: '#A5D6A7' }}
            thumbColor={isOnline ? '#388E3C' : '#F5F5F5'}
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C2185B']} />
        }
      >
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {dashboardStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <IconSymbol size={20} name={stat.icon as any} color={stat.color} />
              </View>
              <View>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Current Task (if online) */}
        {isOnline && (
          <View style={styles.currentTaskCard}>
            <ThemedText style={styles.sectionTitle}>Current Task</ThemedText>
            {activeOrder ? (
                 <View style={styles.taskContent}>
                    <View style={{ alignItems: 'flex-start', width: '100%', marginBottom: 10 }}>
                        <ThemedText style={{ fontSize: 18, fontWeight: '800', color: activeOrder.isAvailableRequest ? '#2E7D32' : '#333' }}>
                            {activeOrder.isAvailableRequest 
                                ? 'New Delivery Request' 
                                : (
                                  activeOrder.status === 'PREPARING' ? 'Shopping in Progress' 
                                  : activeOrder.status === 'READY_FOR_PICKUP' ? 'Prepare for Pickup' 
                                  : 'Delivery in Progress'
                                )
                            }
                        </ThemedText>
                        <ThemedText style={{ color: '#666' }}>ID: #{activeOrder.id.slice(0,8)}</ThemedText>
                    </View>
                    
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                         <View>
                              <ThemedText style={{ fontSize: 12, color: '#888' }}>Merchant</ThemedText>
                              <ThemedText style={{ fontWeight: '600' }}>{activeOrder.merchant?.name}</ThemedText>
                         </View>
                         <View style={{ alignItems: 'flex-end' }}>
                              <ThemedText style={{ fontSize: 12, color: '#888' }}>Customer</ThemedText>
                              <ThemedText style={{ fontWeight: '600' }}>{activeOrder.customer?.firstName}</ThemedText>
                         </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.actionBtn, activeOrder.isAvailableRequest && { backgroundColor: '#2E7D32' }]}
                        onPress={() => router.push(`/order-details/${activeOrder.id}`)}
                    >
                        <ThemedText style={styles.actionBtnText}>
                            {activeOrder.isAvailableRequest ? 'View & Accept' : 'View Details / Proceed'}
                        </ThemedText>
                    </TouchableOpacity>
                 </View>
            ) : (
                <View style={styles.taskContent}>
                <ThemedText style={styles.waitingText}>Scanning for assigned orders...</ThemedText>
                <View style={styles.radarAnimation}>
                    <IconSymbol size={32} name="map" color="#C2185B" />
                </View>
                </View>
            )}
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator size="small" color="#C2185B" style={{ marginTop: 20 }} />
          ) : recentOrders.length === 0 ? (
            <ThemedText style={styles.emptyText}>No recent orders</ThemedText>
          ) : (
            recentOrders.map((order, idx) => (
              <View key={idx} style={styles.orderCard}>
                <View style={[styles.orderIcon, { backgroundColor: order.status === 'DELIVERED' ? '#E8F5E9' : '#FCE4EC' }]}>
                  <IconSymbol 
                    size={20} 
                    name="receipt" 
                    color={order.status === 'DELIVERED' ? '#388E3C' : '#C2185B'} 
                  />
                </View>
                <View style={styles.orderInfo}>
                  <ThemedText style={styles.orderRestaurant}>
                    {order.merchant?.name || 'Unknown Merchant'}
                  </ThemedText>
                  <ThemedText style={styles.orderTime}>
                    {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <ThemedText style={{ color: getStatusColor(order.status), fontWeight: '600' }}>{order.status}</ThemedText>
                  </ThemedText>
                </View>
                <ThemedText style={styles.orderIncome}>₱{order.deliveryFee}</ThemedText>
              </View>
            ))
          )}
        </View>

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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  greeting: {
    fontSize: 12,
    color: '#888',
  },
  riderName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
  },
  currentTaskCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
  },
  taskContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  radarAnimation: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2185B',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  orderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderRestaurant: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  orderTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  orderIncome: {
    fontSize: 14,
    fontWeight: '800',
    color: '#388E3C',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  actionBtn: {
    backgroundColor: '#C2185B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
