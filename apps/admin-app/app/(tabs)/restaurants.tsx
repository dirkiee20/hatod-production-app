import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Switch, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMerchants, approveMerchant } from '../../api/services';
import { Merchant } from '../../api/types';
import { resolveImageUrl } from '../../api/client';

export default function RestaurantsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Merchant[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurants = async () => {
    try {
        const data = await getMerchants();
        setRestaurants(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRestaurants();
  };

  const handleApprove = async (id: string) => {
    const success = await approveMerchant(id);
    if (success) {
        // Refresh local state
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } else {
        alert('Failed to approve merchant');
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (activeTab === 'active') return r.isApproved && r.isOpen;
    if (activeTab === 'pending') return !r.isApproved;
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.headerRow, { marginTop: insets.top + 16 }]}>
        <ThemedText style={styles.screenTitle}>Partnerships</ThemedText>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.statCard, activeTab === 'all' && styles.activeStatCard]} onPress={() => setActiveTab('all')}>
          <ThemedText style={[styles.statValue, activeTab === 'all' && styles.activeStatText]}>{restaurants.length}</ThemedText>
          <ThemedText style={[styles.statLabel, activeTab === 'all' && styles.activeStatText]}>Total</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, activeTab === 'active' && styles.activeStatCard]} onPress={() => setActiveTab('active')}>
          <ThemedText style={[styles.statValue, activeTab === 'active' && styles.activeStatText]}>{restaurants.filter(r => r.isApproved && r.isOpen).length}</ThemedText>
          <ThemedText style={[styles.statLabel, activeTab === 'active' && styles.activeStatText]}>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, activeTab === 'pending' && styles.activeStatCard]} onPress={() => setActiveTab('pending')}>
          <ThemedText style={[styles.statValue, activeTab === 'pending' && styles.activeStatText]}>{restaurants.filter(r => !r.isApproved).length}</ThemedText>
          <ThemedText style={[styles.statLabel, activeTab === 'pending' && styles.activeStatText]}>New Requests</ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
           <ActivityIndicator size="large" color="#C2185B" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredRestaurants.map((restaurant) => (
            <TouchableOpacity 
              key={restaurant.id} 
              style={styles.restaurantCard}
              onPress={() => router.push(`/restaurant-details/${restaurant.id}`)}
            >
               <Image 
                  source={{ uri: resolveImageUrl(restaurant.coverImage || restaurant.imageUrl || restaurant.logo) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500' }} 
                  style={styles.restaurantImage} 
              />
              
              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantHeader}>
                  <ThemedText style={styles.restaurantName}>
                    {restaurant.name}
                    {!restaurant.isApproved && <ThemedText style={{color: '#F57C00', fontSize: 12}}> (Pending)</ThemedText>}
                  </ThemedText>
                  
                  {restaurant.isApproved ? (
                    <Switch 
                        value={restaurant.isOpen || false} 
                        trackColor={{ false: '#DDD', true: '#F48FB1' }}
                        thumbColor={restaurant.isOpen ? '#C2185B' : '#FFF'}
                        onValueChange={() => {}} // Disabled for list view
                        disabled
                    />
                  ) : (
                    <TouchableOpacity 
                        style={styles.approveBtn}
                        onPress={() => handleApprove(restaurant.id)}
                    >
                        <ThemedText style={styles.approveBtnText}>Approve</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
                
                <ThemedText style={styles.restaurantCategory}>{restaurant.city || 'Unknown Location'}</ThemedText>
                
                <View style={styles.restaurantStats}>
                  <View style={styles.statItem}>
                    <IconSymbol size={14} name="dashboard" color="#F57C00" />
                    <ThemedText style={styles.statText}>{restaurant.rating?.toFixed(1) || 'N/A'}</ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <IconSymbol size={14} name="orders" color="#1976D2" />
                    <ThemedText style={styles.statText}>{restaurant.totalOrders || 0} orders</ThemedText>
                  </View>
                </View>
                
                <View style={styles.revenueRow}>
                  <ThemedText style={styles.revenueLabel}>Total Revenue</ThemedText>
                  <ThemedText style={styles.revenueValue}>₱{((restaurant.totalOrders || 0) * 200).toLocaleString()} (Est)</ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  activeStatCard: {
    backgroundColor: '#C2185B',
    borderColor: '#C2185B',
  },
  activeStatText: {
    color: '#FFF',
  },
  approveBtn: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
