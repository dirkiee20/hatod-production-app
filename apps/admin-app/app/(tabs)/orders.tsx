import { StyleSheet, ScrollView, TouchableOpacity, View, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllOrders } from '../../api/services';
import { Order } from '../../api/types';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const statusTabs = ['All', 'Pending', 'In Progress', 'Delivered', 'Cancelled'];

  const filteredOrders = activeTab === 'All' 
    ? orders 
    : orders.filter(o => {
        if (activeTab === 'Pending') return o.status === 'PENDING';
        if (activeTab === 'In Progress') return ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'].includes(o.status);
        if (activeTab === 'Delivered') return o.status === 'DELIVERED';
        if (activeTab === 'Cancelled') return o.status === 'CANCELLED';
        return true;
      });

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.titleRow, { marginTop: insets.top + 16 }]}>
        <ThemedText style={styles.screenTitle}>Orders</ThemedText>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {statusTabs.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#C2185B" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredOrders.length === 0 ? (
             <View style={{alignItems: 'center', marginTop: 50}}>
                <ThemedText style={{color: '#888', fontStyle: 'italic'}}>No orders found</ThemedText>
             </View>
          ) : (
            filteredOrders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => router.push(`/order-details/${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <ThemedText style={styles.orderId}>#{order.id.slice(0, 8)}...</ThemedText>
                    <ThemedText style={styles.orderTime}>
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: order.status === 'DELIVERED' ? '#E8F5E9' : 
                                   order.status === 'CANCELLED' ? '#FFEBEE' : '#FFF3E0' 
                  }]}>
                    <ThemedText style={[styles.statusText, { 
                      color: order.status === 'DELIVERED' ? '#388E3C' : 
                             order.status === 'CANCELLED' ? '#D32F2F' : '#F57C00' 
                    }]}>
                      {order.status}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.orderDetails}>
                  <ThemedText style={styles.customerName}>{order.customer?.name || 'Guest'}</ThemedText>
                  <ThemedText style={styles.restaurantName}>{order.merchant?.name || 'Access Denied'}</ThemedText>
                </View>
                
                <View style={styles.orderFooter}>
                  <ThemedText style={styles.orderTotal}>₱{order.totalAmount?.toLocaleString()}</ThemedText>
                  <IconSymbol size={16} name="chevron.right" color="#CCC" />
                </View>
              </TouchableOpacity>
            ))
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
  titleRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
  },
  tabContainer: {
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  tabScroll: {
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  activeTab: {
    backgroundColor: '#C2185B',
    borderColor: '#C2185B',
    borderBottomWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
  },
  orderTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  orderDetails: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 12,
    color: '#888',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C2185B',
  },
});
