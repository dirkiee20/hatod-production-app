import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getMerchantOrders } from '@/api/services';
import { Order, OrderStatus } from '@/api/types';

import { useSocket } from '@/context/SocketContext';
import { Alert } from 'react-native';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Today\'s Sales', value: '₱0', icon: 'dashboard', color: '#f78734' },
    { label: 'Active Orders', value: '0', icon: 'orders', color: '#1976D2' },
    { label: 'Total Revenue', value: '₱0', icon: 'chevron.right', color: '#388E3C' },
  ]);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
        loadData();
    }, [])
  );

  // Socket Listener for Real-time Updates
  React.useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: any) => {
        console.log('New order received via socket:', data);
        Alert.alert('New Order!', `Order #${data.orderNumber} just arrived.`);
        loadData(); // Refresh dashboard
    };

    const handleOrderUpdate = (data: any) => {
        console.log('Order updated via socket:', data);
        loadData(); // Refresh dashboard
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:updated', handleOrderUpdate);

    return () => {
        socket.off('order:created', handleNewOrder);
        socket.off('order:updated', handleOrderUpdate);
    };
  }, [socket]);

  const loadData = async () => {
    setLoading(true);
    const orders = await getMerchantOrders();
    
    // Calculate Stats
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Today's Sales (Completed/Active orders made today)
    const todaysOrders = orders.filter(o => 
        o.createdAt.startsWith(today) && 
        o.status !== OrderStatus.CANCELLED
    );
    const todaysSales = todaysOrders.reduce((sum, o) => sum + o.total, 0);

    // 2. Active Orders
    const activeOrders = orders.filter(o => 
        [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP].includes(o.status)
    );

    // 3. Total Revenue (All non-cancelled)
    const totalRevenue = orders
        .filter(o => o.status !== OrderStatus.CANCELLED)
        .reduce((sum, o) => sum + o.total, 0);

    setStats([
        { label: 'Today\'s Sales', value: `₱${todaysSales.toLocaleString()}`, icon: 'dashboard', color: '#f78734' },
        { label: 'Active Orders', value: `${activeOrders.length}`, icon: 'orders', color: '#1976D2' },
        { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, icon: 'chevron.right', color: '#388E3C' },
    ]);

    // Recent Order
    if (orders.length > 0) {
        // Sort by date desc
        const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentOrder(sorted[0]);
    } else {
        setRecentOrder(null);
    }
    
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
          <ThemedText style={styles.merchantName}>Merchant Dashboard</ThemedText>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
           <IconSymbol size={24} name="paperplane.fill" color="#333" />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
           {stats.map((stat, i) => (
             <ThemedView key={i} style={styles.statCard}>
                <ThemedView style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                   <IconSymbol size={22} name={stat.icon as any} color={stat.color} />
                </ThemedView>
                <ThemedText style={styles.statValue}>{loading ? '...' : stat.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
             </ThemedView>
           ))}
        </View>

        {/* Quick Actions */}
        <ThemedView style={styles.sectionHeader}>
           <ThemedText style={styles.sectionTitle}>Overview</ThemedText>
        </ThemedView>

        <ThemedView style={styles.chartPlaceholder}>
           <ThemedText style={styles.placeholderText}>Sales Chart Placeholder</ThemedText>
        </ThemedView>

        {/* Live Orders Snippet */}
        <ThemedView style={styles.sectionHeader}>
           <ThemedText style={styles.sectionTitle}>Recent Updates</ThemedText>
           <TouchableOpacity><ThemedText style={styles.seeAllText}>See all</ThemedText></TouchableOpacity>
        </ThemedView>
        
        {loading ? (
            <ActivityIndicator color="#C2185B" />
        ) : recentOrder ? (
            <ThemedView style={styles.recentItem}>
            <ThemedView style={styles.recentIcon}>
                <IconSymbol size={18} name="orders" color="#C2185B" />
            </ThemedView>
            <ThemedView style={styles.recentInfo}>
                <ThemedText style={styles.recentTitle}>Order #{recentOrder.orderNumber}</ThemedText>
                <ThemedText style={styles.recentSub} numberOfLines={1}>
                    {recentOrder.status} • {new Date(recentOrder.createdAt).toLocaleTimeString()}
                </ThemedText>
            </ThemedView>
            <ThemedText style={styles.recentValue}>₱{recentOrder.total}</ThemedText>
            </ThemedView>
        ) : (
            <ThemedText style={{ color: '#999', fontStyle: 'italic' }}>No recent orders</ThemedText>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 13,
    color: '#888',
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  seeAllText: {
    fontSize: 12,
    color: '#C2185B',
    fontWeight: '700',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  recentSub: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  recentValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C2185B',
  },
});
