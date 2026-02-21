import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getMerchants } from '@/api/services';
import { Merchant } from '@/api/types';

export default function GroceryScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');


  useFocusEffect(
    useCallback(() => {
      loadMerchants();
    }, [])
  );

  const loadMerchants = async () => {
    setLoading(true);
    const data = await getMerchants();
    setMerchants(data.filter((m: Merchant) => m.isActive && (m.type === 'GROCERY' || m.type === 'PHARMACY')));
    setLoading(false);
  };

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularShops = filteredMerchants.slice(0, 6);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Pink Header with Search & Filter */}
      <ThemedView style={styles.headerBackground}>
        <ThemedView style={styles.searchRow}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="magnifyingglass" color="#777" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Looking for something?"
              style={styles.searchInput}
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </ThemedView>
          <TouchableOpacity style={styles.filterButton}>
            <IconSymbol size={20} name="line.3.horizontal.decrease.circle" color="#FFF" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.contentBody}>
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5c6cc9" />
            <ThemedText style={styles.loadingText}>Loading stores...</ThemedText>
          </ThemedView>
        ) : (
          <>
            {/* Popular Shops */}
            {popularShops.length > 0 && (
              <ThemedView style={styles.sectionContainer}>
                <ThemedText style={styles.sectionTitle}>Popular Shops</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {popularShops.map((shop) => (
                    <TouchableOpacity key={shop.id} style={styles.shopItem} onPress={() => router.push(`/grocery-store/${shop.id}`)}>
                      <ThemedView style={styles.shopIcon}>
                        <Image 
                          source={{ uri: shop.logo || shop.coverImage || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100' }} 
                          style={styles.shopIconImage}
                        />
                      </ThemedView>
                      <ThemedText style={styles.shopName} numberOfLines={2}>{shop.name}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </ThemedView>
            )}

            {/* Shop by Store */}
            <ThemedView style={styles.storeSection}>
              <ThemedText style={styles.sectionTitle}>Shop by store</ThemedText>
              <ThemedView style={styles.filterRow}>
                <TouchableOpacity 
                  style={[styles.filterChip, activeFilter === 'All' && styles.activeChip]}
                  onPress={() => setActiveFilter('All')}
                >
                  <ThemedText style={activeFilter === 'All' ? styles.activeChipText : styles.chipText}>
                    All
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, activeFilter === 'Convenience' && styles.activeChip]}
                  onPress={() => setActiveFilter('Convenience')}
                >
                  <ThemedText style={activeFilter === 'Convenience' ? styles.activeChipText : styles.chipText}>
                    Convenience
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterChip, activeFilter === 'Pharmacy' && styles.activeChip]}
                  onPress={() => setActiveFilter('Pharmacy')}
                >
                  <ThemedText style={activeFilter === 'Pharmacy' ? styles.activeChipText : styles.chipText}>
                    Pharmacy
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {filteredMerchants.length === 0 ? (
                <ThemedView style={styles.emptyContainer}>
                  <IconSymbol size={48} name="cart" color="#CCC" />
                  <ThemedText style={styles.emptyText}>No stores found</ThemedText>
                  <ThemedText style={styles.emptySubtext}>
                    {searchQuery ? 'Try a different search term' : 'Check back later for new stores'}
                  </ThemedText>
                </ThemedView>
              ) : (
                filteredMerchants.map((store) => (
                  <TouchableOpacity key={store.id} style={styles.storeCard} onPress={() => router.push(`/grocery-store/${store.id}`)}>
                    <ThemedView style={styles.storeImageContainer}>
                      <Image 
                        source={{ uri: store.coverImage || store.logo || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400' }} 
                        style={styles.storeImage} 
                      />
                      <ThemedView style={styles.storeOverlay}>
                        <ThemedText style={styles.storeStatusText}>
                          {store.isActive ? 'Open Now' : 'Closed'}
                        </ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.heartButton}>
                        <IconSymbol size={14} name="heart" color="#000" />
                      </ThemedView>
                    </ThemedView>
                    <ThemedView style={styles.storeInfo}>
                      <ThemedText style={styles.storeName} numberOfLines={1}>{store.name}</ThemedText>
                      {store.description && (
                        <ThemedText style={styles.storeDescription} numberOfLines={1}>
                          {store.description}
                        </ThemedText>
                      )}
                      <ThemedView style={styles.deliveryInfoRow}>
                        <IconSymbol size={12} name="paperplane.fill" color="#888" />
                        <ThemedText style={styles.deliveryText}>
                          {store.deliveryTime || '15-30 min'} • ₱{store.deliveryFee || 29} delivery
                        </ThemedText>
                      </ThemedView>
                      {store.rating && (
                        <ThemedView style={styles.ratingRow}>
                          <ThemedText style={styles.ratingText}>★ {store.rating.toFixed(1)}</ThemedText>
                          {store.reviewCount && (
                            <ThemedText style={styles.reviewText}>({store.reviewCount})</ThemedText>
                          )}
                        </ThemedView>
                      )}
                    </ThemedView>
                  </TouchableOpacity>
                ))
              )}
            </ThemedView>

            <ThemedView style={{ height: 100 }} />
          </>
        )}
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
    backgroundColor: '#5c6cc9',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
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
    backgroundColor: '#F5F5F5',
  },
  shopIconImage: {
    width: '100%',
    height: '100%',
  },
  shopName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
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
  storeDescription: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
  reviewText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 2,
  },
});
