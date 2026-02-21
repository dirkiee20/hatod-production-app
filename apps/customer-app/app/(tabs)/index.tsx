import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useEffect, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getMerchants } from '@/api/services';
import { Merchant } from '@/api/types';
import { resolveImageUrl } from '@/api/client';

const PLACEHOLDER_BANNER = 'https://placehold.co/400x225/f0f0f0/aaaaaa?text=No+Image';
const PLACEHOLDER_LOGO = 'https://placehold.co/150x150/f0f0f0/aaaaaa?text=?';

// Wrapper that falls back to placeholder on error
function MerchantImage({ uri, style, placeholder }: { uri?: string; style: any; placeholder: string }) {
  const [src, setSrc] = useState<string>(uri || placeholder);
  useEffect(() => { setSrc(uri || placeholder); }, [uri]);
  return (
    <Image
      source={{ uri: src }}
      style={style}
      onError={() => setSrc(placeholder)}
    />
  );
}
import { isMerchantOpen } from '@/utils/time';
import { useSocket } from '@/context/SocketContext';

export default function FoodScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.72;
  const cardHeight = cardWidth * (9 / 16);
  
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleMerchantUpdate = (updatedMerchant: Merchant) => {
      setMerchants(prev => prev.map(m => 
        m.id === updatedMerchant.id ? { ...m, ...updatedMerchant } : m
      ));
    };

    socket.on('merchant:updated', handleMerchantUpdate);
    return () => {
      socket.off('merchant:updated', handleMerchantUpdate);
    };
  }, [socket]);

  useFocusEffect(
    useCallback(() => {
      loadMerchants();
    }, [])
  );

  const loadMerchants = async () => {
    setLoading(true);
    try {
      // Race the fetch against a 10-second timeout so a cold Railway
      // start never leaves the screen stuck in a spinning state forever.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10_000)
      );
      const data = await Promise.race([getMerchants(), timeout]);
      setMerchants(data);
    } catch (e: any) {
      console.warn('loadMerchants failed/timed-out:', e?.message);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m => 
    (!m.type || m.type === 'RESTAURANT') && 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group merchants into sections
  const recentMerchants = filteredMerchants.slice(0, 4);
  const popularMerchants = filteredMerchants.slice(0, 6);

  const sections = [
    {
      title: 'Popular Restaurants',
      items: popularMerchants
    },
    {
      title: 'All Restaurants',
      items: filteredMerchants
    }
  ];

  const renderMerchantCard = (merchant: Merchant) => {
    const { isOpen, nextOpen } = isMerchantOpen(merchant);
    
    return (
    <TouchableOpacity 
      key={merchant.id} 
      style={[styles.compactCard, { width: cardWidth }]}
      onPress={() => router.push(`/restaurant/${merchant.id}`)}
    >
      <ThemedView style={[styles.imageContainer, { height: cardHeight }]}>
        <MerchantImage
          uri={resolveImageUrl(merchant.coverImage)}
          style={styles.restaurantImage}
          placeholder={PLACEHOLDER_BANNER}
        />
        <ThemedView style={styles.heartIcon}>
          <IconSymbol size={14} name="heart" color="#000" />
        </ThemedView>
        {!isOpen && (
             <ThemedView style={styles.closedOverlay}>
                <ThemedText style={styles.closedText}>Closed</ThemedText>
                <ThemedText style={styles.opensAtText}>{nextOpen || 'Closed'}</ThemedText>
             </ThemedView>
        )}
      </ThemedView>
      
      <ThemedView style={styles.cardInfo}>
        <ThemedView style={styles.nameRow}>
          <ThemedText style={styles.restaurantName} numberOfLines={1}>{merchant.name}</ThemedText>
          {!!merchant.rating && (
            <ThemedView style={styles.ratingRow}>
              <ThemedText style={styles.ratingText}>★ {merchant.rating.toFixed(1)}</ThemedText>
              {!!merchant.reviewCount && (
                <ThemedText style={styles.countText}>({merchant.reviewCount})</ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>
        
        {!!merchant.description && (
          <ThemedText style={styles.subtitleText} numberOfLines={1}>{merchant.description}</ThemedText>
        )}
        
        <ThemedView style={styles.feeRow}>
          <IconSymbol size={12} name="paperplane.fill" color="#555" />
          <ThemedText style={styles.feeText}>
            {merchant.deliveryTime || '15-30 min'} • ₱{merchant.deliveryFee || 29}
          </ThemedText>
        </ThemedView>

        {!!merchant.address && (
          <ThemedView style={styles.promoBadge}>
            <IconSymbol size={10} name="location.fill" color="#f78734" />
            <ThemedText style={styles.promoText} numberOfLines={1}>{merchant.address}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </TouchableOpacity>
  );};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Pink Header with Search */}
      <ThemedView style={styles.headerBackground}>
        <ThemedView style={styles.searchBarContainer}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="magnifyingglass" color="#777" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search for restaurants"
              style={styles.searchInput}
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.contentBody}>
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5c6cc9" />
            <ThemedText style={styles.loadingText}>Loading restaurants...</ThemedText>
          </ThemedView>
        ) : filteredMerchants.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol size={48} name="fork.knife" color="#CCC" />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'No restaurants found' : 'Could not load restaurants'}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'The server may be waking up. Tap to retry.'}
            </ThemedText>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={loadMerchants}
              >
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        ) : (
          sections.map((section, sIndex) => (
            section.items.length > 0 && (
              <ThemedView key={sIndex} style={styles.sectionContainer}>
                <ThemedView style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                  <TouchableOpacity style={styles.seeAllButton}>
                    <IconSymbol size={18} name="chevron.right" color="#555" />
                  </TouchableOpacity>
                </ThemedView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {section.items.map(renderMerchantCard)}
                </ScrollView>
              </ThemedView>
            )
          ))
        )}
        
        {/* Placeholder for more content */}
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
    backgroundColor: '#5c6cc9',
    paddingTop: 50,
    paddingBottom: 15,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  contentBody: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 15,
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
    paddingHorizontal: 30,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#5c6cc9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  seeAllButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  compactCard: {
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  imageContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  heartIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
  },
  countText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 2,
  },
  subtitleText: {
    fontSize: 11,
    color: '#777',
    marginTop: 1,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  feeText: {
    fontSize: 11,
    color: '#555',
    marginLeft: 4,
    fontWeight: '600',
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  promoText: {
    color: '#5c6cc9',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  opensAtText: {
    color: '#EEE',
    fontSize: 12,
    marginTop: 4,
  },
});
