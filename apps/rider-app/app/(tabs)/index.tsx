import { StyleSheet, ScrollView, TouchableOpacity, View, Switch, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateRiderStatus, updateRiderLocation } from '../../api/rider-service';
import { getMe, getRiderOrders } from '../../api/client';
import * as Location from 'expo-location';
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
        getMe(),
        getRiderOrders(),
      ]);

      setUserData(userRes);
      
      const allOrders = ordersRes;
      // Filter for delivered orders
      const deliveredOrders = allOrders.filter((o: any) => o.status === 'DELIVERED');
      
      // Find active order (Assigned to me and active)
      // Note: Backend findAll might return unassigned READY orders too, so check riderId.
      const myId = userRes.rider?.id;
      
      // 1. Check for Active Order (Assigned to me and in progress)
      let active = allOrders.find((o: any) => 
        ['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING'].includes(o.status) && 
        o.rider?.id === myId
      );

      // 2. If no active order, check for Available Orders (Ready and Unassigned)
      // Only if rider is ONLINE
      if (!active && (userRes.rider?.status === 'AVAILABLE' || userRes.rider?.status === 'BUSY')) {
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
      
      if (userRes.rider?.status === 'AVAILABLE' || userRes.rider?.status === 'BUSY') {
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const toggleOnlineStatus = async (value: boolean) => {
    setIsOnline(value);
    try {
        await updateRiderStatus(value ? 'AVAILABLE' : 'OFFLINE');
        
        // Also ping location to backend when coming online
        if (value) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                await updateRiderLocation(location.coords.latitude, location.coords.longitude);
            }
        }
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

  const getTaskDetails = (order: any) => {
    if (order?.isAvailableRequest) {
      return {
        title: 'New delivery request',
        subtitle: 'Review details and claim this order',
        badgeText: 'Request',
        badgeBg: '#E8F5E9',
        accentColor: '#2E7D32',
        ctaText: 'View and Accept',
      };
    }

    switch (order?.status) {
      case 'PREPARING':
        return {
          title: 'Shopping in progress',
          subtitle: 'Merchant is preparing the items',
          badgeText: 'Preparing',
          badgeBg: '#FFF8E1',
          accentColor: '#F57C00',
          ctaText: 'View Order Details',
        };
      case 'READY_FOR_PICKUP':
        return {
          title: 'Ready for pickup',
          subtitle: 'Head to merchant and collect the order',
          badgeText: 'Pickup',
          badgeBg: '#FFF8E1',
          accentColor: '#FBC02D',
          ctaText: 'Start Pickup',
        };
      case 'PICKED_UP':
        return {
          title: 'Order picked up',
          subtitle: 'Proceed to customer drop-off point',
          badgeText: 'In Transit',
          badgeBg: '#FFF3E0',
          accentColor: '#FF9800',
          ctaText: 'Navigate Delivery',
        };
      case 'DELIVERING':
        return {
          title: 'Final delivery step',
          subtitle: 'Confirm handoff to complete this trip',
          badgeText: 'Delivering',
          badgeBg: '#E3F2FD',
          accentColor: '#1976D2',
          ctaText: 'Complete Delivery',
        };
      default:
        return {
          title: 'Delivery in progress',
          subtitle: 'Open task details for the next step',
          badgeText: 'Active',
          badgeBg: '#F5F5F5',
          accentColor: '#616161',
          ctaText: 'View Details',
        };
    }
  };

  const taskDetails = activeOrder ? getTaskDetails(activeOrder) : null;

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
            <View style={styles.currentTaskHeader}>
              <ThemedText style={styles.sectionTitle}>Current Task</ThemedText>
              {activeOrder && taskDetails && (
                <View style={[styles.taskStatusPill, { backgroundColor: taskDetails.badgeBg }]}>
                  <View style={[styles.taskStatusDot, { backgroundColor: taskDetails.accentColor }]} />
                  <ThemedText style={[styles.taskStatusPillText, { color: taskDetails.accentColor }]}>
                    {taskDetails.badgeText}
                  </ThemedText>
                </View>
              )}
            </View>

            {activeOrder && taskDetails ? (
              <View style={styles.taskContent}>
                <View style={styles.taskCompactTop}>
                  <View style={[styles.taskHeadlineIcon, { backgroundColor: `${taskDetails.accentColor}18` }]}>
                    <IconSymbol
                      size={16}
                      name={activeOrder.isAvailableRequest ? 'orders' : 'map'}
                      color={taskDetails.accentColor}
                    />
                  </View>
                  <View style={styles.taskCompactMain}>
                    <View style={styles.taskCompactTitleRow}>
                      <ThemedText style={styles.taskTitleCompact} numberOfLines={1}>
                        {taskDetails.title}
                      </ThemedText>
                      {typeof activeOrder.deliveryFee === 'number' && (
                        <ThemedText style={styles.taskFeeText}>PHP {activeOrder.deliveryFee.toFixed(2)}</ThemedText>
                      )}
                    </View>
                    <ThemedText style={styles.taskSubtitleCompact} numberOfLines={1}>
                      #{activeOrder.id?.slice(0, 8) || '--------'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.taskStopsInline}>
                  <View style={styles.taskStopChip}>
                    <View style={[styles.taskStopMarker, { backgroundColor: '#F57C00' }]} />
                    <ThemedText style={styles.taskStopChipText} numberOfLines={1}>
                      {activeOrder.merchant?.name || 'Unknown merchant'}
                    </ThemedText>
                  </View>
                  <IconSymbol size={12} name="chevron.right" color="#999" />
                  <View style={styles.taskStopChip}>
                    <View style={[styles.taskStopMarker, { backgroundColor: '#1976D2' }]} />
                    <ThemedText style={styles.taskStopChipText} numberOfLines={1}>
                      {activeOrder.customer?.firstName || 'Customer'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.taskFooterRow}>
                  <TouchableOpacity
                    style={[styles.taskMiniBtn, { backgroundColor: taskDetails.accentColor }]}
                    onPress={() => router.push(`/order-details/${activeOrder.id}`)}
                  >
                    <ThemedText style={styles.taskMiniBtnText}>
                      {activeOrder.isAvailableRequest ? 'Accept' : 'Open'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.taskEmptyStateCompact}>
                <View style={styles.radarAnimationCompact}>
                  <IconSymbol size={18} name="map" color="#C2185B" />
                </View>
                <ThemedText style={styles.waitingTextCompact}>Waiting for assignment</ThemedText>
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
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  currentTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskContent: {
    width: '100%',
  },
  taskStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  taskStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  taskCompactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskHeadlineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  taskCompactMain: {
    flex: 1,
    minWidth: 0,
  },
  taskCompactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTitleCompact: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },
  taskSubtitleCompact: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  taskFeeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2E7D32',
  },
  taskStopsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  taskStopChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 0,
  },
  taskStopMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  taskStopChipText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
  },
  taskFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  taskMiniBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  taskMiniBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  taskEmptyStateCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  waitingTextCompact: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
    marginLeft: 8,
  },
  radarAnimationCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
});
