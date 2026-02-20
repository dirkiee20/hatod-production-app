import { StyleSheet, ScrollView, TouchableOpacity, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCart } from '@/context/CartContext';

export default function CartScreen() {
  const router = useRouter();
  const { items, cartTotal, updateQuantity, removeFromCart, itemCount, deliveryFee } = useCart();
  
  const total = cartTotal + deliveryFee;

  return (
    <ThemedView style={styles.container}>
      {/* Pink Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>My Cart</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
            {itemCount} items
            {/* We could calculate unique stores if we want, but keeping it simple for now */}
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
             <ThemedView style={{ padding: 40, alignItems: 'center' }}>
                <ThemedText style={{ color: '#888' }}>Your cart is empty.</ThemedText>
                <TouchableOpacity onPress={() => router.push('/')} style={{ marginTop: 20 }}>
                     <ThemedText style={{ color: '#f78734', fontWeight: 'bold' }}>Browse Menu</ThemedText>
                </TouchableOpacity>
             </ThemedView>
        ) : (
             items.map((item) => (
              <ThemedView key={item.id} style={styles.cartItem}>
                <Image source={{ uri: item.image || 'https://via.placeholder.com/200' }} style={styles.itemImage} />
                <ThemedView style={styles.itemDetails}>
                  <ThemedText style={styles.storeName}>{item.storeName || 'Unknown Store'}</ThemedText>
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
                  
                  <ThemedView style={styles.quantityControls}>
                    <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                      <ThemedText style={styles.qtyButtonText}>−</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                    <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                      <ThemedText style={styles.qtyButtonText}>+</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
                <ThemedView style={styles.itemRight}>
                  <ThemedText style={styles.itemTotal}>₱{item.totalPrice}</ThemedText>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeFromCart(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <IconSymbol name="trash.fill" size={16} color="#D32F2F" />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))
        )}

        {/* Bill Details */}
        <ThemedView style={styles.billSection}>
          <ThemedText style={styles.sectionTitle}>Bill Summary</ThemedText>
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Item Subtotal</ThemedText>
            <ThemedText style={styles.billValue}>₱{cartTotal}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Delivery Fee</ThemedText>
            <ThemedText style={styles.billValue}>₱{deliveryFee}</ThemedText>
          </ThemedView>
          <View style={styles.divider} />
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.totalLabel}>Grand Total</ThemedText>
            <ThemedText style={styles.totalValue}>₱{total}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* Footer Checkout */}
      <ThemedView style={styles.footer}>
        <ThemedView style={styles.footerInfo}>
          <ThemedText style={styles.footerTotalLabel}>Total to pay</ThemedText>
          <ThemedText style={styles.footerTotalValue}>₱{total}</ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/checkout')}>
          <ThemedText style={styles.checkoutText}>Review Payment</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#5c6cc9',
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
  scrollContent: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  storeName: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  qtyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 18,
  },
  qtyText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'transparent',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  billSection: {
    padding: 20,
    marginTop: 10,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
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
    color: '#666',
  },
  billValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#f78734',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
  },
  footerInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  footerTotalLabel: {
    fontSize: 11,
    color: '#888',
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#f78734',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkoutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
