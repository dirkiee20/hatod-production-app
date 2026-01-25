import { StyleSheet, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function FoodOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');

  const activeOrders = [
    {
       id: 'ORD-1024',
       restaurant: 'Jollibee - Surigao',
       status: 'Preparing',
       items: '1x Chickenjoy Bucket, 2x Jolly Spaghetti',
       total: 650,
       date: 'Today, 10:30 AM',
       icon: 'food'
    }
  ];

  const pastOrders = [
    {
       id: 'ORD-998',
       restaurant: 'McDonalds - Rizal St.',
       status: 'Delivered',
       items: '2x Big Mac Meal, 1x McFlurry',
       total: 480,
       date: 'Jan 24, 12:15 PM',
       icon: 'food'
    },
    {
       id: 'ORD-856',
       restaurant: 'Chowking',
       status: 'Canceled',
       items: '1x Chao Fan, 1x Siomai',
       total: 120,
       date: 'Jan 20, 6:45 PM',
       icon: 'food'
    }
  ];

  const renderOrderCard = (order: any, isPast: boolean) => (
    <TouchableOpacity key={order.id} style={styles.card} onPress={() => {}}>
        <View style={styles.cardHeader}>
            <View style={styles.restaurantRow}>
                <View style={styles.iconBox}>
                    <IconSymbol size={20} name={order.icon} color="#C2185B" />
                </View>
                <View>
                    <ThemedText style={styles.restaurantName}>{order.restaurant}</ThemedText>
                    <ThemedText style={styles.dateText}>{order.date}</ThemedText>
                </View>
            </View>
            <View style={[styles.statusBadge, 
                order.status === 'Delivered' ? styles.statusSuccess : 
                order.status === 'Canceled' ? styles.statusError : styles.statusInfo
            ]}>
                <ThemedText style={[styles.statusText,
                     order.status === 'Delivered' ? styles.statusTextSuccess : 
                     order.status === 'Canceled' ? styles.statusTextError : styles.statusTextInfo
                ]}>{order.status}</ThemedText>
            </View>
        </View>
        
        <View style={styles.divider} />
        
        <ThemedText style={styles.itemsText} numberOfLines={2}>
            {order.items}
        </ThemedText>

        <View style={styles.cardFooter}>
            <ThemedText style={styles.totalText}>Total: ₱{order.total}</ThemedText>
            {isPast && order.status === 'Delivered' && (
                <TouchableOpacity style={styles.reorderBtn}>
                    <ThemedText style={styles.reorderText}>Reorder</ThemedText>
                </TouchableOpacity>
            )}
            {!isPast && (
                 <TouchableOpacity style={styles.trackBtn} onPress={() => router.push('/order-tracking')}>
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

      <ScrollView contentContainerStyle={styles.listContent}>
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
            pastOrders.map(order => renderOrderCard(order, true))
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
    backgroundColor: '#C2185B',
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
    backgroundColor: '#FCE4EC',
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
    borderColor: '#C2185B',
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2185B',
  },
  trackBtn: {
    backgroundColor: '#C2185B',
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
