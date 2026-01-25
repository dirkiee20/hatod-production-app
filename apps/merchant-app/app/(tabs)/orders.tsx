import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('New');

  const orders = [
    { id: '1234', customer: 'Juan Dela Cruz', items: 3, total: 450, time: '3 mins ago', status: 'New' },
    { id: '1235', customer: 'Maria Clara', items: 1, total: 150, time: '10 mins ago', status: 'Processing' },
    { id: '1236', customer: 'Jose Rizal', items: 2, total: 299, time: '15 mins ago', status: 'New' },
  ];

  const statusTabs = ['New', 'Processing', 'Ready', 'Completed'];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.headerTitle}>Orders Management</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Manage incoming and active orders</ThemedText>
      </ThemedView>

      <ScrollArea horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {statusTabs.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</ThemedText>
            {tab === 'New' && <View style={styles.badge}><ThemedText style={styles.badgeText}>2</ThemedText></View>}
          </TouchableOpacity>
        ))}
      </ScrollArea>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {orders.filter(o => o.status === activeTab || activeTab === 'New').map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard}
            onPress={() => router.push(`/order-details/${order.id}`)}
          >
            <View style={styles.orderHeader}>
              <ThemedText style={styles.orderId}>#ORD-{order.id}</ThemedText>
              <ThemedText style={styles.orderTime}>{order.time}</ThemedText>
            </View>
            
            <View style={styles.customerRow}>
               <IconSymbol size={16} name="person" color="#888" />
               <ThemedText style={styles.customerName}>{order.customer}</ThemedText>
            </View>

            <View style={styles.summaryRow}>
               <ThemedText style={styles.itemsCount}>{order.items} items • ₱{order.total}</ThemedText>
               <View style={styles.actionRow}>
                 <TouchableOpacity 
                    style={styles.detailsBtn}
                    onPress={() => router.push(`/order-details/${order.id}`)}
                 >
                    <ThemedText style={styles.detailsBtnText}>View Details</ThemedText>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.actionBtn}>
                    <ThemedText style={styles.actionBtnText}>Accept</ThemedText>
                 </TouchableOpacity>
               </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

// Simple horizontal scroll helper
const ScrollArea = ({ children, style, ...props }: any) => (
  <View style={style}><ScrollView {...props}>{children}</ScrollView></View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#C2185B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tabContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#C2185B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  activeTabText: {
    color: '#C2185B',
  },
  badge: {
    backgroundColor: '#C2185B',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
  },
  orderTime: {
    fontSize: 11,
    color: '#888',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemsCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  detailsBtnText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#C2185B',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
