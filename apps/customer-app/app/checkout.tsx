import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { createOrder, createAddress, getPabiliRequestById, getTyphoonMode, TyphoonConfig } from '@/api/services';
import * as Location from 'expo-location';

export default function CheckoutScreen() {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState('COD');

  const { items, cartTotal, clearCart, deliveryFee, deliveryAddress, setDeliveryAddress } = useCart();
  const { pabiliRequestId } = useLocalSearchParams<{ pabiliRequestId?: string }>();
  const [pabiliRequest, setPabiliRequest] = useState<any>(null);

  useEffect(() => {
    if (pabiliRequestId) {
        getPabiliRequestById(pabiliRequestId).then(data => {
            if (data) setPabiliRequest(data);
        });
    }
  }, [pabiliRequestId]);

  const isPabili = !!pabiliRequest;
  const displayItems = isPabili ? [
     { id: 'pabili-item', quantity: 1, name: 'Custom Pabili Items', options: { addons: pabiliRequest.items } as any, totalPrice: pabiliRequest.estimatedItemCost }
  ] : items;

  const displaySubtotal = isPabili ? pabiliRequest.estimatedItemCost : cartTotal;
  const displayDeliveryFee = isPabili ? (pabiliRequest.serviceFee || 0) : deliveryFee;
  const total = displaySubtotal + displayDeliveryFee;

  const [loading, setLoading] = useState(false);
  const [typhoon, setTyphoon] = useState<TyphoonConfig | null>(null);

  useEffect(() => {
    getTyphoonMode().then(t => setTyphoon(t)).catch(() => {});
  }, []);

  const handlePlaceOrder = async () => {
    if (displayItems.length === 0) return;

    // Block order placement during typhoon mode
    if (typhoon?.enabled) {
      Alert.alert(
        '🌀 Orders Suspended',
        typhoon.message || 'Service is temporarily suspended due to a typhoon. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      if (selectedPayment !== 'COD') {
        Alert.alert('Payment Unavailable', 'This payment method is not yet available. Please contact the admin to continue.');
        setLoading(false);
        return;
      }

      if (!deliveryAddress) {
          Alert.alert('Missing Address', 'Please select a delivery address.');
          setLoading(false);
          return;
      }

      const isCurrentLocationAddress =
        deliveryAddress.id === 'temp-current' ||
        String(deliveryAddress.label || '').trim().toLowerCase() === 'current location';

      if (!isCurrentLocationAddress) {
        Alert.alert(
          'Current Location Required',
          'Cash on Delivery is only available for your current location. Please tap "Edit" and use current location.',
        );
        setLoading(false);
        return;
      }

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permission to place a Cash on Delivery order using your current location.',
        );
        setLoading(false);
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let resolvedAddressId = deliveryAddress.id;

      // If using GPS current location, persist it first to get a real UUID
      if (deliveryAddress.id === 'temp-current') {
        try {
          const saved = await createAddress({
            label: 'Current Location',
            street: deliveryAddress.street || 'Current Location',
            city: '',
            state: '',
            latitude: deliveryAddress.latitude ?? 0,
            longitude: deliveryAddress.longitude ?? 0,
          });
          resolvedAddressId = saved.id;
          // Update context so future orders reuse the saved address
          setDeliveryAddress({ ...deliveryAddress, id: saved.id });
        } catch (addrErr) {
          console.error('Failed to save current location as address:', addrErr);
          Alert.alert('Error', 'Could not save your current location. Please select an address manually.');
          setLoading(false);
          return;
        }
      }

      const orderData: any = {
        addressId: resolvedAddressId,
        paymentMethod: 'CASH_ON_DELIVERY',
        customerLatitude: currentPosition.coords.latitude,
        customerLongitude: currentPosition.coords.longitude,
      };

      if (isPabili) {
        orderData.pabiliRequestId = pabiliRequest.id;
        // Pabili requests no longer need a ghost merchant or items array mapped.
      } else {
        orderData.merchantId = items[0].merchantId;
        orderData.items = items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          options: i.options || undefined,
          notes: typeof i.options?.note === 'string' ? i.options.note : undefined,
        }));
      }
      
      console.log('Placing order with data:', JSON.stringify(orderData, null, 2));

      const order = await createOrder(orderData);
      clearCart();
      router.replace({ pathname: '/order-summary', params: { id: order.id } });
    } catch (error) {
       console.error('Checkout error:', error);
       const message =
         error instanceof Error && error.message
           ? error.message
           : 'An unexpected error occurred while placing your order.';
       Alert.alert('Order Failed', message);
    } finally {
       setLoading(false);
    }
  };

  const orderSummary = {
    items: displayItems.length,
    subtotal: displaySubtotal,
    deliveryFee: displayDeliveryFee,
    total: total,
  };

  const paymentMethods = [
    { id: 'COD', name: 'Cash on Delivery', icon: 'person', subtitle: 'Pay when your order arrives', available: true },
    { id: 'GCASH', name: 'GCash', icon: 'paperplane.fill', subtitle: 'Not yet available', available: false },
    { id: 'CARD', name: 'Credit/Debit Card', icon: 'grocery', subtitle: 'Not yet available', available: false },
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

      {/* 🌀 Typhoon Banner */}
      {typhoon?.enabled && (
        <ThemedView style={styles.typhoonBanner}>
          <ThemedText style={styles.typhoonBannerIcon}>🌀</ThemedText>
          <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
            <ThemedText style={styles.typhoonBannerTitle}>Orders Suspended</ThemedText>
            <ThemedText style={styles.typhoonBannerMsg} numberOfLines={2}>
              {typhoon.message}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}

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
                <IconSymbol size={18} name="house.fill" color="#5c6cc9" />
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
          {displayItems.map((item) => (
            <ThemedView key={item.id} style={styles.itemRow}>
              <ThemedView style={styles.itemInfo}>
                <ThemedText style={styles.itemQty}>{item.quantity}x</ThemedText>
                <ThemedView style={{flex: 1}}>
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  {item.options?.size && <ThemedText style={styles.itemOptions}>Size: {item.options.size}</ThemedText>}
                  {item.options?.addons && item.options.addons.length > 0 && (
                     <ThemedText style={styles.itemOptions}>List: {item.options.addons.join(', ')}</ThemedText>
                  )}
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.itemPrice}>₱{item.totalPrice}</ThemedText>
            </ThemedView>
          ))}
          {displayItems.length === 0 && (
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
              onPress={() => {
                if (!method.available) {
                  Alert.alert('Payment Unavailable', `${method.name} is not yet available. Please contact the admin to continue.`);
                  return;
                }
                setSelectedPayment(method.id);
              }}
            >
              <ThemedView style={styles.methodMain}>
                <ThemedView style={styles.methodIcon}>
                   <IconSymbol size={16} name={method.icon as any} color={selectedPayment === method.id ? '#5c6cc9' : '#888'} />
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
              <IconSymbol size={18} name="filter" color="#5c6cc9" />
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
         <TouchableOpacity
           style={[styles.placeOrderBtn, (displayItems.length === 0 || loading || !!typhoon?.enabled) && styles.placeOrderBtnDisabled]}
           onPress={handlePlaceOrder}
           disabled={displayItems.length === 0 || loading || !!typhoon?.enabled}
         >
            <ThemedText style={styles.placeOrderText}>
              {loading ? 'Placing Order...' : typhoon?.enabled ? '🌀 Orders Suspended' : `Place Order — ₱${orderSummary.total}`}
            </ThemedText>
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
    color: '#5c6cc9',
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
    backgroundColor: '#EBEFFF',
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
    borderColor: '#5c6cc9',
    backgroundColor: '#F8FAFF',
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
    color: '#5c6cc9',
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
    borderColor: '#5c6cc9',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5c6cc9',
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
    color: '#5c6cc9',
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
    backgroundColor: '#5c6cc9',
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
    color: '#5c6cc9',
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
  // ── Typhoon styles ──────────────────────────────────────────
  typhoonBanner: {
    backgroundColor: '#B71C1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  typhoonBannerIcon: { fontSize: 24 },
  typhoonBannerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF' },
  typhoonBannerMsg: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});
