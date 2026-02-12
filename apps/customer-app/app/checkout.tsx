import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/api/services';

export default function CheckoutScreen() {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState('COD');

  const { items, cartTotal, clearCart, deliveryFee, deliveryAddress } = useCart();
  
  const platformFee = 5; // Platform fee might still be hardcoded or need config
  const total = cartTotal + deliveryFee + platformFee;

  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      if (!deliveryAddress) {
          Alert.alert('Missing Address', 'Please select a delivery address.');
          setLoading(false);
          return;
      }

      // Assuming all items are from the same merchant (handled by UI logic elsewhere usually)
      // Taking merchantId from the first item
      const merchantId = items[0].merchantId;
      
      const orderData = {
        merchantId: merchantId,
        addressId: deliveryAddress.id, 
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.options ? JSON.stringify(i.options) : undefined
        }))
      };
      
      console.log('Placing order with data:', JSON.stringify(orderData, null, 2));

      const order = await createOrder(orderData);

      if (order) {
         Alert.alert('Success', 'Order placed successfully!', [
            { text: 'OK', onPress: () => {
                clearCart();
                router.replace('/(tabs)');
                // Ideally navigate to order tracking or history, but ensuring stack reset is safer
                setTimeout(() => router.push({ pathname: '/order-tracking', params: { id: order.id } }), 100);
            }}
         ]);
      } else {
         Alert.alert('Order Failed', 'Could not place order. Please check your connection and try again.');
      }
    } catch (error) {
       console.error('Checkout error:', error);
       Alert.alert('Error', 'An unexpected error occurred while placing your order.');
    } finally {
       setLoading(false);
    }
  };

  const orderSummary = {
    items: items.length,
    subtotal: cartTotal,
    deliveryFee: deliveryFee,
    platformFee: platformFee,
    total: total,
  };

  const paymentMethods = [
    { id: 'COD', name: 'Cash on Delivery', icon: 'person', subtitle: 'Pay when your order arrives' },
    { id: 'GCASH', name: 'GCash', icon: 'paperplane.fill', subtitle: 'Pay via GCash app' },
    { id: 'CARD', name: 'Credit/Debit Card', icon: 'grocery', subtitle: 'Visa, Mastercard' },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Review Payment',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Delivery Address Section */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
            <TouchableOpacity onPress={() => router.push('/address-manager')}>
              <ThemedText style={styles.editBtn}>Edit</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <ThemedView style={styles.addressCard}>
             <ThemedView style={styles.addressIconBox}>
                <IconSymbol size={18} name="house.fill" color="#C2185B" />
             </ThemedView>
             <ThemedView style={styles.addressInfo}>
                <ThemedText style={styles.addressLabel}>{deliveryAddress ? deliveryAddress.label : 'Select Address'}</ThemedText>
                <ThemedText style={styles.addressText} numberOfLines={1}>{deliveryAddress ? deliveryAddress.street : 'No address selected'}</ThemedText>
             </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Order Items Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Items</ThemedText>
          {items.map((item) => (
            <ThemedView key={item.id} style={styles.itemRow}>
              <ThemedView style={styles.itemInfo}>
                <ThemedText style={styles.itemQty}>{item.quantity}x</ThemedText>
                <ThemedView>
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  {item.options?.size && <ThemedText style={styles.itemOptions}>Size: {item.options.size}</ThemedText>}
                  {item.options?.addons && item.options.addons.length > 0 && (
                     <ThemedText style={styles.itemOptions}>Addons: {item.options.addons.join(', ')}</ThemedText>
                  )}
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.itemPrice}>₱{item.totalPrice}</ThemedText>
            </ThemedView>
          ))}
          {items.length === 0 && (
             <ThemedText style={styles.emptyCartText}>Your cart is empty.</ThemedText>
          )}
        </ThemedView>

        {/* Payment Methods Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
          {paymentMethods.map((method) => (
            <TouchableOpacity 
              key={method.id} 
              style={[styles.paymentRow, selectedPayment === method.id && styles.paymentRowActive]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <ThemedView style={styles.methodMain}>
                <ThemedView style={styles.methodIcon}>
                   <IconSymbol size={16} name={method.icon as any} color={selectedPayment === method.id ? '#C2185B' : '#888'} />
                </ThemedView>
                <View>
                   <ThemedText style={[styles.methodName, selectedPayment === method.id && styles.methodNameActive]}>{method.name}</ThemedText>
                   <ThemedText style={styles.methodSub}>{method.subtitle}</ThemedText>
                </View>
              </ThemedView>
              <ThemedView style={[styles.radio, selectedPayment === method.id && styles.radioActive]}>
                {selectedPayment === method.id && <ThemedView style={styles.radioInner} />}
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* Voucher Section */}
        <TouchableOpacity style={styles.voucherRow}>
           <ThemedView style={styles.voucherLead}>
              <IconSymbol size={18} name="filter" color="#C2185B" />
              <ThemedText style={styles.voucherText}>Apply a voucher</ThemedText>
           </ThemedView>
           <IconSymbol size={16} name="chevron.right" color="#DDD" />
        </TouchableOpacity>

        {/* Bill Summary */}
        <ThemedView style={styles.billCard}>
          <ThemedText style={styles.billTitle}>Bill Summary</ThemedText>
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Item Subtotal</ThemedText>
            <ThemedText style={styles.billValue}>₱{orderSummary.subtotal}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Delivery Fee</ThemedText>
            <ThemedText style={styles.billValue}>₱{orderSummary.deliveryFee}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Platform Fee</ThemedText>
            <ThemedText style={styles.billValue}>₱{orderSummary.platformFee}</ThemedText>
          </ThemedView>
          <View style={styles.billDivider} />
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.totalLabel}>Total Payment</ThemedText>
            <ThemedText style={styles.totalValue}>₱{orderSummary.total}</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order Footer */}
      <ThemedView style={styles.footer}>
         <TouchableOpacity style={[styles.placeOrderBtn, (items.length === 0 || loading) && styles.placeOrderBtnDisabled]} onPress={handlePlaceOrder} disabled={items.length === 0 || loading}>
            <ThemedText style={styles.placeOrderText}>{loading ? 'Placing Order...' : `Place Order — ₱${orderSummary.total}`}</ThemedText>
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
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },
  editBtn: {
    fontSize: 12,
    color: '#C2185B',
    fontWeight: '700',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  addressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  addressText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  paymentRowActive: {
    borderColor: '#C2185B',
    backgroundColor: '#FFF9FB',
  },
  methodMain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  methodIcon: {
    width: 30,
    marginRight: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  methodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },
  methodNameActive: {
    color: '#C2185B',
  },
  methodSub: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#C2185B',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2185B',
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  voucherLead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  voucherText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  billCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
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
    fontWeight: '700',
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
    paddingBottom: 35,
    borderTopWidth: 1,
    borderColor: '#EEE',
  },
  placeOrderBtn: {
    backgroundColor: '#C2185B',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#CCC',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  itemInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  itemQty: {
    fontWeight: '800',
    color: '#C2185B',
    marginRight: 10,
    width: 25,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  itemOptions: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  itemPrice: {
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
});
