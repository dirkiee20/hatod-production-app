import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback } from 'react';
import { getMyPabiliRequests } from '@/api/services';

export default function PabiliOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefreshing = false) => {
      if (requests.length === 0 && !isRefreshing) {
        setLoading(true);
      }
      
      try {
          const data = await getMyPabiliRequests();
          if (Array.isArray(data)) {
              setRequests(data);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, []);

  const activeRequests = requests.filter(r => ['PENDING_REVIEW', 'QUOTED', 'ACCEPTED'].includes(r.status));
  const pastRequests = requests.filter(r => ['COMPLETED', 'REJECTED', 'CANCELED'].includes(r.status));

  const renderRequestCard = (req: any, isPast: boolean) => {
    const statusColor = req.status === 'PENDING_REVIEW' ? '#f78734' :
                        req.status === 'QUOTED' ? '#1976D2' : 
                        req.status === 'ACCEPTED' ? '#388E3C' : '#888';

    const statusBg = req.status === 'PENDING_REVIEW' ? '#FFF3E0' :
                     req.status === 'QUOTED' ? '#E3F2FD' : 
                     req.status === 'ACCEPTED' ? '#E8F5E9' : '#EEE';

    return (
    <TouchableOpacity 
        key={req.id} 
        style={styles.card} 
        onPress={() => {
            if (req.status === 'QUOTED' || req.status === 'ACCEPTED') {
                router.push({ pathname: '/checkout', params: { pabiliRequestId: req.id } })
            }
        }}
        disabled={req.status !== 'QUOTED' && req.status !== 'ACCEPTED'}
    >
        <View style={styles.cardHeader}>
            <View style={styles.restaurantRow}>
                <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                   <IconSymbol size={20} name="bag.fill" color="#f78734" />
                </View>
                <View>
                    <ThemedText style={styles.restaurantName}>We Buy For You</ThemedText>
                    <ThemedText style={styles.dateText}>{new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</ThemedText>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                <ThemedText style={[styles.statusText, { color: statusColor }]}>{req.status.replace('_', ' ')}</ThemedText>
            </View>
        </View>
        
        <View style={styles.divider} />
        
        <ThemedText style={styles.itemsText} numberOfLines={2}>
            {req.items?.join(', ')}
        </ThemedText>

        <View style={styles.cardFooter}>
            <ThemedText style={styles.totalText}>Est: ₱{req.estimatedItemCost}</ThemedText>
            
            {(req.status === 'QUOTED' || req.status === 'ACCEPTED') && !isPast && (
                 <TouchableOpacity 
                    style={styles.trackBtn} 
                    onPress={() => router.push({ pathname: '/checkout', params: { pabiliRequestId: req.id } })}
                 >
                    <ThemedText style={styles.trackText}>Checkout</ThemedText>
                </TouchableOpacity>
            )}

            {req.status === 'PENDING_REVIEW' && !isPast && (
                 <View style={styles.waitingBtn}>
                    <ActivityIndicator size="small" color="#f78734" style={{marginRight: 4}} />
                    <ThemedText style={styles.waitingText}>Reviewing</ThemedText>
                </View>
            )}
        </View>
    </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
       <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Custom Requests',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'Active' && styles.activeTab]} 
            onPress={() => setActiveTab('Active')}
        >
            <ThemedText style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'Past' && styles.activeTab]} 
            onPress={() => setActiveTab('Past')}
        >
            <ThemedText style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>Past</ThemedText>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && requests.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#f78734" />
          </View>
      ) : (
          <ScrollView 
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
             {activeTab === 'Active' ? (
                activeRequests.length > 0 ? (
                    activeRequests.map(req => renderRequestCard(req, false))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol size={48} name="bag.fill" color="#DDD" />
                        <ThemedText style={styles.emptyText}>No active requests</ThemedText>
                    </View>
                )
             ) : (
                pastRequests.length > 0 ? (
                    pastRequests.map(req => renderRequestCard(req, true))
                ) : (
                    <View style={styles.emptyState}>
                        <IconSymbol size={48} name="bag.fill" color="#DDD" />
                        <ThemedText style={styles.emptyText}>No past requests</ThemedText>
                    </View>
                )
             )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f78734',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  dateText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  itemsText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  trackBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  waitingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f78734',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
