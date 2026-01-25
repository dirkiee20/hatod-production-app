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

  // Mock data for the specific order
  const order = {
    id: id,
    customer: 'Juan Dela Cruz',
    phone: '+63 912 345 6789',
    address: '123 Rizal Street, Surigao City, Surigao del Norte',
    items: [
      { id: '1', name: 'Signature Double Cheese', quantity: 2, price: 598, options: 'No onions' },
      { id: '2', name: 'Bacon Blast Burger', quantity: 1, price: 349, options: 'Extra cheese' },
    ],
    subtotal: 947,
    deliveryFee: 29,
    total: 976,
    status: 'New',
    time: '3 mins ago',
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: `Order #ORD-${id}`,
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Customer Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>
          <ThemedView style={styles.card}>
            <View style={styles.customerHeader}>
              <View style={styles.avatarBox}>
                 <IconSymbol size={24} name="person" color="#C2185B" />
              </View>
              <View style={styles.customerMeta}>
                <ThemedText style={styles.customerName}>{order.customer}</ThemedText>
                <ThemedText style={styles.customerPhone}>{order.phone}</ThemedText>
              </View>
              <TouchableOpacity style={styles.callBtn}>
                 <IconSymbol size={18} name="paperplane.fill" color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.addressRow}>
               <IconSymbol size={16} name="house.fill" color="#888" />
               <ThemedText style={styles.addressText}>{order.address}</ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Order Items Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Items</ThemedText>
          <ThemedView style={styles.card}>
            {order.items.map((item, idx) => (
              <View key={item.id} style={[styles.itemRow, idx !== order.items.length - 1 && styles.itemDivider]}>
                <View style={styles.itemMain}>
                  <ThemedText style={styles.itemQty}>{item.quantity}x</ThemedText>
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                    {item.options && <ThemedText style={styles.itemOptions}>{item.options}</ThemedText>}
                  </View>
                </View>
                <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
              </View>
            ))}
          </ThemedView>
        </ThemedView>

        {/* Payment Summary Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Summary</ThemedText>
          <ThemedView style={styles.card}>
            <View style={styles.billRow}>
              <ThemedText style={styles.billLabel}>Subtotal</ThemedText>
              <ThemedText style={styles.billValue}>₱{order.subtotal}</ThemedText>
            </View>
            <View style={styles.billRow}>
              <ThemedText style={styles.billLabel}>Delivery Fee</ThemedText>
              <ThemedText style={styles.billValue}>₱{order.deliveryFee}</ThemedText>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <ThemedText style={styles.totalLabel}>Total Earned</ThemedText>
              <ThemedText style={styles.totalValue}>₱{order.total}</ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Footer */}
      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
         <TouchableOpacity style={styles.cancelBtn}>
            <ThemedText style={styles.cancelBtnText}>Cancel Order</ThemedText>
         </TouchableOpacity>
         <TouchableOpacity style={styles.acceptBtn}>
            <ThemedText style={styles.acceptBtnText}>Move to Preparation</ThemedText>
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
  section: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#888',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerMeta: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  customerPhone: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#388E3C', // Green for calling/contact
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 15,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  addressText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemMain: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: 'transparent',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '900',
    color: '#C2185B',
    width: 30,
  },
  itemInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  itemOptions: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  billLabel: {
    fontSize: 13,
    color: '#777',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
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
    justifyContent: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '800',
  },
  acceptBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
