import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FoodScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.72; // Width matches 72% for horizontal feel
  const cardHeight = cardWidth * (9 / 16); // 16:9 for the image part
  
  const sections = [
    {
      title: 'Order again',
      items: [
        { id: '1', name: 'Greenwich - Surigao', rating: '5.0', count: '5000+', time: '15-40 min', fee: '₱29', tag: '50% off ₱149: wemissyou', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
        { id: '2', name: 'Boulevard Food', rating: '4.8', count: '1000+', time: '15-40 min', fee: '₱39', tag: '50% off ₱149: welcome', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400' },
      ]
    },
    {
      title: 'Fast delivery',
      items: [
        { id: '3', name: 'McDonald\'s - Surigao', rating: '4.9', count: '10k+', time: '5-30 min', fee: '₱19', tag: 'Free delivery', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400' },
        { id: '4', name: 'Jollibee - City Center', rating: '5.0', count: '20k+', time: '10-25 min', fee: '₱25', tag: 'Hot deal', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400' },
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Pink Header with Search */}
      <ThemedView style={styles.headerBackground}>
        <ThemedView style={styles.searchBarContainer}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="chevron.right" color="#777" style={{ transform: [{ rotate: '90deg' }], marginRight: 8 }} />
            <TextInput
              placeholder="Search for restaurants and groceries"
              style={styles.searchInput}
              placeholderTextColor="#777"
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.contentBody}>
        {sections.map((section, sIndex) => (
          <ThemedView key={sIndex} style={styles.sectionContainer}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
              <TouchableOpacity style={styles.seeAllButton}>
                <IconSymbol size={18} name="chevron.right" color="#555" />
              </TouchableOpacity>
            </ThemedView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {section.items.map((item) => (
                <TouchableOpacity 
                   key={item.id} 
                   style={[styles.compactCard, { width: cardWidth }]}
                   onPress={() => router.push(`/restaurant/${item.id}`)}
                >
                  <ThemedView style={[styles.imageContainer, { height: cardHeight }]}>
                    <Image source={{ uri: item.image }} style={styles.restaurantImage} />
                    <ThemedView style={styles.heartIcon}>
                      <IconSymbol size={14} name="person" color="#000" />
                    </ThemedView>
                    <ThemedView style={styles.adBadge}>
                      <ThemedText style={styles.adText}>Ad</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  
                  <ThemedView style={styles.cardInfo}>
                    <ThemedView style={styles.nameRow}>
                      <ThemedText style={styles.restaurantName} numberOfLines={1}>{item.name}</ThemedText>
                      <ThemedView style={styles.ratingRow}>
                        <ThemedText style={styles.ratingText}>★ {item.rating}</ThemedText>
                        <ThemedText style={styles.countText}>({item.count})</ThemedText>
                      </ThemedView>
                    </ThemedView>
                    
                    <ThemedText style={styles.subtitleText}>{item.time} • ₱₱ • Pizza</ThemedText>
                    
                    <ThemedView style={styles.feeRow}>
                      <IconSymbol size={12} name="paperplane.fill" color="#555" />
                      <ThemedText style={styles.feeText}>{item.fee}</ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.promoBadge}>
                      <Image source={require('@/assets/images/favicon.png')} style={{width: 12, height: 12, marginRight: 4}} />
                      <ThemedText style={styles.promoText} numberOfLines={1}>{item.tag}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        ))}
        
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
    backgroundColor: '#C2185B', // Deep pink mapping the reference image
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
  adBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  adText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
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
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  promoText: {
    color: '#D81B60',
    fontSize: 10,
    fontWeight: '700',
  },
});
