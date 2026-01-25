import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function GroceryScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  
  const popularShops = [
    { id: '1', name: 'Shell Select\n(Borromeo Su...', color: '#FFD700', text: 'Shell\nSelect' },
    { id: '2', name: 'Watsons (Casa\nDomingo Suri...', color: '#009688', text: 'watsons' },
    { id: '3', name: 'Merrymart\nGrocery - City...', color: '#FFFFFF', text: 'MERRYMART', textColor: '#00A859' },
  ];

  const promos = [
    { id: '1', title: '30% off', subtitle: '12-month plan', code: 'GOPRONA', color: '#6A1B9A' },
    { id: '2', title: 'Unlock up to 30% OFF', subtitle: 'Go PRO', code: '', color: '#8E24AA' },
  ];

  const stores = [
    { 
      id: '1', 
      name: 'Shell Select (Borromeo Surigao)', 
      status: 'Opens at Sun, 10:00 AM', 
      info: '₱39 or Free with ₱799 spend',
      image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400' 
    },
    { 
      id: '2', 
      name: 'Watsons Pharmacy', 
      status: 'Open Now', 
      info: '₱25 Delivery Fee',
      image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400' 
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Pink Header with Search & Filter */}
      <ThemedView style={styles.headerBackground}>
        <ThemedView style={styles.searchRow}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="chevron.right" color="#777" style={{ transform: [{ rotate: '90deg' }], marginRight: 8 }} />
            <TextInput
              placeholder="Looking for something?"
              style={styles.searchInput}
              placeholderTextColor="#777"
            />
          </ThemedView>
          <TouchableOpacity style={styles.filterButton}>
            <IconSymbol size={20} name="filter" color="#FFF" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.contentBody}>
        {/* Popular Shops */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Popular Shops</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {popularShops.map((shop) => (
              <TouchableOpacity key={shop.id} style={styles.shopItem} onPress={() => router.push(`/grocery-store/${shop.id}`)}>
                <ThemedView style={[styles.shopIcon, { backgroundColor: shop.color }]}>
                  <ThemedText style={[styles.shopIconText, { color: shop.textColor || '#FFF' }]}>
                    {shop.text}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.shopName} numberOfLines={2}>{shop.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Save Big Section */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Save big on your groceries</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {promos.map((promo) => (
              <ThemedView key={promo.id} style={[styles.promoCard, { backgroundColor: promo.color }]}>
                <ThemedText style={styles.promoTitle}>{promo.title}</ThemedText>
                <ThemedText style={styles.promoSubtitle}>{promo.subtitle}</ThemedText>
                {promo.code ? (
                  <ThemedView style={styles.promoCodeContainer}>
                    <ThemedText style={styles.promoCodeText}>code {promo.code}</ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.promoBadge}>
                    <ThemedText style={styles.promoBadgeText}>Go PRO ›</ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Shop by Store */}
        <ThemedView style={styles.storeSection}>
          <ThemedText style={styles.sectionTitle}>Shop by store</ThemedText>
          <ThemedView style={styles.filterRow}>
            <TouchableOpacity style={[styles.filterChip, styles.activeChip]}>
              <ThemedText style={styles.activeChipText}>All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <ThemedText style={styles.chipText}>Convenience</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {stores.map((store) => (
            <TouchableOpacity key={store.id} style={styles.storeCard} onPress={() => router.push(`/grocery-store/${store.id}`)}>
              <ThemedView style={styles.storeImageContainer}>
                <Image source={{ uri: store.image }} style={styles.storeImage} />
                <ThemedView style={styles.storeOverlay}>
                  <ThemedText style={styles.storeStatusText}>{store.status}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.heartButton}>
                   <IconSymbol size={14} name="person" color="#000" />
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.storeInfo}>
                <ThemedText style={styles.storeName} numberOfLines={1}>{store.name}</ThemedText>
                <ThemedView style={styles.deliveryInfoRow}>
                  <IconSymbol size={12} name="paperplane.fill" color="#888" />
                  <ThemedText style={styles.deliveryText}>{store.info}</ThemedText>
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={{ height: 100 }} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerBackground: {
    backgroundColor: '#C2185B',
    paddingTop: 50,
    paddingBottom: 15,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  filterButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBody: {
    flex: 1,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  shopItem: {
    width: 85,
    marginRight: 12,
    alignItems: 'center',
  },
  shopIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  shopIconText: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  shopName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
  promoCard: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
    padding: 15,
    justifyContent: 'center',
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  promoSubtitle: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  promoCodeContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  promoCodeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  promoBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  promoBadgeText: {
    color: '#6A1B9A',
    fontSize: 10,
    fontWeight: '800',
  },
  storeSection: {
    paddingTop: 10,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  activeChipText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  storeCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 15,
    alignItems: 'center',
  },
  storeImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  storeStatusText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '600',
  },
  heartButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  deliveryText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
});
