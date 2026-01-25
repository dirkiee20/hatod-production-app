import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RestaurantsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [restaurants, setRestaurants] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
        const { authenticatedFetch, API_BASE } = await import('../../api/client');
        const res = await authenticatedFetch('/merchants');
        if (res.ok) {
            const data = await res.json();
            // Transform data if necessary or use as is. 
            // The backend returns Merchant objects.
            setRestaurants(data);
        } else {
            console.error("Failed to fetch merchants");
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.headerRow, { marginTop: insets.top + 16 }]}>
        <ThemedText style={styles.screenTitle}>Restaurants</ThemedText>
        <TouchableOpacity style={styles.addBtn}>
          <ThemedText style={styles.addBtnText}>+ Add New</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{restaurants.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{restaurants.filter(r => r.isOpen).length}</ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>0</ThemedText>
          <ThemedText style={styles.statLabel}>Pending</ThemedText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {restaurants.map((restaurant) => (
          <TouchableOpacity 
            key={restaurant.id} 
            style={styles.restaurantCard}
            onPress={() => router.push(`/restaurant-details/${restaurant.id}`)}
          >
            {/* Fallback image if restaurant.coverImage is null */}
            <Image 
                source={{ uri: restaurant.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500' }} 
                style={styles.restaurantImage} 
            />
            
            <View style={styles.restaurantInfo}>
              <View style={styles.restaurantHeader}>
                <ThemedText style={styles.restaurantName}>{restaurant.name}</ThemedText>
                <Switch 
                  value={restaurant.isOpen} 
                  trackColor={{ false: '#DDD', true: '#F48FB1' }}
                  thumbColor={restaurant.isOpen ? '#C2185B' : '#FFF'}
                />
              </View>
              
              <ThemedText style={styles.restaurantCategory}>{restaurant.city}</ThemedText>
              
              <View style={styles.restaurantStats}>
                <View style={styles.statItem}>
                  <IconSymbol size={14} name="dashboard" color="#F57C00" />
                  <ThemedText style={styles.statText}>{restaurant.rating || 0} ★</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <IconSymbol size={14} name="orders" color="#1976D2" />
                  <ThemedText style={styles.statText}>{restaurant.totalOrders || 0} orders</ThemedText>
                </View>
              </View>
              
              <View style={styles.revenueRow}>
                <ThemedText style={styles.revenueLabel}>Total Revenue</ThemedText>
                <ThemedText style={styles.revenueValue}>₱{(restaurant.totalOrders * 200).toLocaleString()} (Est)</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
  },
  addBtn: {
    backgroundColor: '#C2185B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C2185B',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  restaurantCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
  },
  restaurantImage: {
    width: '100%',
    height: 140,
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
    flex: 1,
  },
  restaurantCategory: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginBottom: 10,
  },
  restaurantStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#888',
  },
  revenueValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#388E3C',
  },
});
