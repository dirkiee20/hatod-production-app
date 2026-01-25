import { StyleSheet, ScrollView, TouchableOpacity, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CartScreen() {
  const router = useRouter();
  const cartItems = [
    {
      id: '1',
      store: 'The Burger Mansion',
      name: 'Classic Cheeseburger',
      price: 150,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200',
    },
    {
      id: '2',
      store: 'Shell Select',
      name: 'Cold Brew Coffee',
      price: 120,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200',
    },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = 29;
  const total = subtotal + deliveryFee;

  return (
    <ThemedView style={styles.container}>
      {/* Pink Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>My Cart</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{cartItems.length} items from 2 stores</ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cartItems.map((item) => (
          <ThemedView key={item.id} style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <ThemedView style={styles.itemDetails}>
              <ThemedText style={styles.storeName}>{item.store}</ThemedText>
              <ThemedText style={styles.itemName}>{item.name}</ThemedText>
              <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
              
              <ThemedView style={styles.quantityControls}>
                <TouchableOpacity style={styles.qtyButton}>
                  <ThemedText style={styles.qtyButtonText}>−</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                <TouchableOpacity style={styles.qtyButton}>
                  <ThemedText style={styles.qtyButtonText}>+</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
            <ThemedText style={styles.itemTotal}>₱{item.price * item.quantity}</ThemedText>
          </ThemedView>
        ))}

        {/* Bill Details */}
        <ThemedView style={styles.billSection}>
          <ThemedText style={styles.sectionTitle}>Bill Summary</ThemedText>
          <ThemedView style={styles.billRow}>
            <ThemedText style={styles.billLabel}>Item Subtotal</ThemedText>
            <ThemedText style={styles.billValue}>₱{subtotal}</ThemedText>
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
    color: '#C2185B',
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
    backgroundColor: '#C2185B',
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
