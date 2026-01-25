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

  // Mock order data
  const order = {
    id: id,
    status: 'In Progress',
    time: 'Oct 24, 2:30 PM',
    customer: {
      name: 'Juan Dela Cruz',
      phone: '+63 912 345 6789',
      address: 'Block 5 Lot 2, Villa Corito, Surigao City',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200',
    },
    driver: {
      name: 'Pedro Penduko',
      phone: '+63 998 765 4321',
      plate: 'ABC 1234',
      vehicle: 'Motorcycle',
      status: 'On the way to restaurant',
    },
    restaurant: {
      name: 'The Burger Mansion',
      address: '123 Main St, Surigao City',
    },
    items: [
      { quantity: 2, name: 'Signature Double Cheese', price: 598, options: 'Large, Extra Cheese' },
      { quantity: 1, name: 'Classic Fries', price: 89, options: 'Regular' },
      { quantity: 2, name: 'Coke Zero', price: 120, options: 'Medium' },
    ],
    summary: {
      subtotal: 807,
      deliveryFee: 49,
      serviceFee: 25,
      total: 881,
      paymentMethod: 'Cash on Delivery',
    }
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
        
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <ThemedText style={styles.orderId}>{order.id}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
              <ThemedText style={[styles.statusText, { color: '#F57C00' }]}>{order.status}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.orderTime}>{order.time}</ThemedText>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotActive]} />
              <ThemedText style={styles.timelineText}>Order Placed</ThemedText>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotActive]} />
              <ThemedText style={styles.timelineText}>Confirmed</ThemedText>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotActive]} />
              <ThemedText style={styles.timelineText}>Preparing</ThemedText>
            </View>
            <View style={[styles.timelineLine, styles.lineInactive]} />
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <ThemedText style={[styles.timelineText, styles.textInactive]}>Delivery</ThemedText>
            </View>
          </View>
        </View>

        {/* Customer & Driver Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>People Involved</ThemedText>
          
          <View style={styles.personCard}>
            <Image source={{ uri: order.customer.image }} style={styles.avatar} />
            <View style={styles.personInfo}>
              <ThemedText style={styles.roleLabel}>Customer</ThemedText>
              <ThemedText style={styles.personName}>{order.customer.name}</ThemedText>
              <ThemedText style={styles.personDetail}>{order.customer.phone}</ThemedText>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.iconBtn}>
                <IconSymbol size={20} name="paperplane.fill" color="#C2185B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.personCard}>
            <View style={[styles.avatar, { backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }]}>
              <IconSymbol size={24} name="paperplane.fill" color="#1976D2" />
            </View>
            <View style={styles.personInfo}>
              <ThemedText style={styles.roleLabel}>Driver • {order.driver.plate}</ThemedText>
              <ThemedText style={styles.personName}>{order.driver.name}</ThemedText>
              <ThemedText style={styles.personDetail}>{order.driver.status}</ThemedText>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.iconBtn}>
                <IconSymbol size={20} name="paperplane.fill" color="#C2185B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Deliver To */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Delivery Location</ThemedText>
          <View style={styles.locationCard}>
            <IconSymbol size={24} name="map" color="#C2185B" />
            <View style={styles.locationInfo}>
              <ThemedText style={styles.locationAddress}>{order.customer.address}</ThemedText>
              <ThemedText style={styles.locationNote}>Note: Near the blue gate</ThemedText>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
          <View style={styles.itemsCard}>
            <View style={styles.restaurantHeader}>
              <ThemedText style={styles.restaurantName}>{order.restaurant.name}</ThemedText>
            </View>
            
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.orderItem}>
                <View style={styles.quantityBadge}>
                  <ThemedText style={styles.quantityText}>{item.quantity}x</ThemedText>
                </View>
                <View style={styles.itemDetails}>
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  <ThemedText style={styles.itemOptions}>{item.options}</ThemedText>
                </View>
                <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
              <ThemedText style={styles.summaryValue}>₱{order.summary.subtotal}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Delivery Fee</ThemedText>
              <ThemedText style={styles.summaryValue}>₱{order.summary.deliveryFee}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Service Fee</ThemedText>
              <ThemedText style={styles.summaryValue}>₱{order.summary.serviceFee}</ThemedText>
            </View>
            
            <View style={[styles.divider, { marginTop: 12 }]} />
            
            <View style={styles.totalRow}>
              <View>
                <ThemedText style={styles.totalLabel}>Total</ThemedText>
                <ThemedText style={styles.paymentMethod}>{order.summary.paymentMethod}</ThemedText>
              </View>
              <ThemedText style={styles.totalValue}>₱{order.summary.total}</ThemedText>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Actions */}
      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
         <TouchableOpacity style={styles.actionBtnSecondary}>
            <ThemedText style={styles.secondaryBtnText}>Cancel Order</ThemedText>
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionBtnPrimary}>
            <ThemedText style={styles.primaryBtnText}>Track Driver</ThemedText>
         </TouchableOpacity>
      </ThemedView>
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
  statusCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  orderTime: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timelineItem: {
    alignItems: 'center',
    width: 60,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EEE',
    marginBottom: 6,
  },
  dotActive: {
    backgroundColor: '#C2185B',
  },
  timelineText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  textInactive: {
    color: '#CCC',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#C2185B',
    marginBottom: 20,
  },
  lineInactive: {
    backgroundColor: '#EEE',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
    marginLeft: 4,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  personInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  personName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  personDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    lineHeight: 20,
  },
  locationNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemsCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  restaurantHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quantityBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
    height: 24,
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemOptions: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C2185B',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  secondaryBtnText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnPrimary: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
