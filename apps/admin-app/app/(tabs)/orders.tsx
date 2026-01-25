import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');

  const orders = [
    { id: 'ORD-1001', customer: 'Juan Dela Cruz', restaurant: 'The Burger Mansion', total: 450, status: 'Pending', time: '5 mins ago' },
    { id: 'ORD-1002', customer: 'Maria Santos', restaurant: 'Pizza Palace', total: 890, status: 'Delivered', time: '15 mins ago' },
    { id: 'ORD-1003', customer: 'Jose Rizal', restaurant: 'Sushi Bar', total: 1250, status: 'In Progress', time: '30 mins ago' },
  ];

  const statusTabs = ['All', 'Pending', 'In Progress', 'Delivered', 'Cancelled'];

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {orders.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard}
            onPress={() => router.push(`/order-details/${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <View>
                <ThemedText style={styles.orderId}>{order.id}</ThemedText>
                <ThemedText style={styles.orderTime}>{order.time}</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: order.status === 'Delivered' ? '#E8F5E9' : order.status === 'Cancelled' ? '#FFEBEE' : '#FFF3E0' }]}>
                <ThemedText style={[styles.statusText, { color: order.status === 'Delivered' ? '#388E3C' : order.status === 'Cancelled' ? '#D32F2F' : '#F57C00' }]}>
                  {order.status}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.orderDetails}>
              <ThemedText style={styles.customerName}>{order.customer}</ThemedText>
              <ThemedText style={styles.restaurantName}>{order.restaurant}</ThemedText>
            </View>
            
            <View style={styles.orderFooter}>
              <ThemedText style={styles.orderTotal}>₱{order.total}</ThemedText>
              <IconSymbol size={16} name="chevron.right" color="#CCC" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
