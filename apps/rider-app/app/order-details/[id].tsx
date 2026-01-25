import { StyleSheet, ScrollView, TouchableOpacity, View, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Mock order details
  const order = {
    id: id,
    status: 'Completed',
    date: 'Oct 24, 2:30 PM',
    distance: '3.2 km',
    duration: '24 mins',
    earnings: {
      base: 45,
      distance: 25,
      surge: 15,
      tip: 20,
      total: 105,
    },
    restaurant: {
      name: 'The Burger Mansion',
      address: '123 Main St, Surigao City',
    },
    customer: {
      name: 'Juan Dela Cruz',
      address: 'Block 5 Lot 2, Villa Corito, Surigao City',
      note: 'Gate is blue, please ring doorbell.',
    },
    items: [
      { quantity: 2, name: 'Signature Double Cheese', subtext: 'Large' },
      { quantity: 1, name: 'Classic Fries', subtext: 'Regular' },
    ]
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Order Details',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <ThemedText style={styles.cardTitle}>Total Earnings</ThemedText>
          <ThemedText style={styles.totalAmount}>₱{order.earnings.total}</ThemedText>
          
          <View style={styles.divider} />
          
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>Base Fare</ThemedText>
            <ThemedText style={styles.breakdownValue}>₱{order.earnings.base}</ThemedText>
          </View>
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>Distance Fee</ThemedText>
            <ThemedText style={styles.breakdownValue}>₱{order.earnings.distance}</ThemedText>
          </View>
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>Surge Bonus</ThemedText>
            <ThemedText style={styles.breakdownValue}>₱{order.earnings.surge}</ThemedText>
          </View>
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>Customer Tip</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: '#388E3C' }]}>+₱{order.earnings.tip}</ThemedText>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Trip Details</ThemedText>
          
          <View style={styles.routeCard}>
            {/* Pickup */}
            <View style={styles.locationRow}>
              <View style={styles.timelineSidebar}>
                <View style={[styles.dot, { backgroundColor: '#C2185B' }]} />
                <View style={styles.line} />
              </View>
              <View style={styles.locationContent}>
                <ThemedText style={styles.locationLabel}>Pickup</ThemedText>
                <ThemedText style={styles.locationName}>{order.restaurant.name}</ThemedText>
                <ThemedText style={styles.address}>{order.restaurant.address}</ThemedText>
              </View>
            </View>

            {/* Dropoff */}
            <View style={styles.locationRow}>
              <View style={styles.timelineSidebar}>
                <View style={[styles.dot, { backgroundColor: '#1976D2' }]} />
              </View>
              <View style={styles.locationContent}>
                <ThemedText style={styles.locationLabel}>Drop-off</ThemedText>
                <ThemedText style={styles.locationName}>{order.customer.name}</ThemedText>
                <ThemedText style={styles.address}>{order.customer.address}</ThemedText>
                <View style={styles.noteBox}>
                  <ThemedText style={styles.noteText}>"{order.customer.note}"</ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items Summary */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Items</ThemedText>
          <View style={styles.itemsCard}>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.quantityBadge}>
                  <ThemedText style={styles.quantityText}>{item.quantity}x</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  <ThemedText style={styles.itemSubtext}>{item.subtext}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metaInfo}>
          <ThemedText style={styles.metaText}>Order ID: {order.id}</ThemedText>
          <ThemedText style={styles.metaText}>{order.date}</ThemedText>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Support Button Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.supportBtn}>
          <IconSymbol size={20} name="chat.bubble" color="#666" />
          <ThemedText style={styles.supportText}>Report an Issue</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 16,
  },
  earningsCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#CCC',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  routeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  locationRow: {
    flexDirection: 'row',
  },
  timelineSidebar: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
    minHeight: 60,
  },
  locationContent: {
    flex: 1,
    paddingBottom: 24,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  noteBox: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#F57C00',
    fontStyle: 'italic',
  },
  itemsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtext: {
    fontSize: 12,
    color: '#888',
  },
  metaInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    padding: 16,
  },
  supportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  supportText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
});
