import {
  StyleSheet, ScrollView, TouchableOpacity, View, TextInput,
  Image, Switch, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getUsers, getMerchants, approveMerchant } from '../../api/services';
import { User, UserRole, Merchant } from '../../api/types';
import { resolveImageUrl } from '../../api/client';

type Segment = 'users' | 'restaurants';

export default function ManageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('restaurants');

  // ── Users state ──────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const [userFilter, setUserFilter] = useState('All');
  const userTabs = ['All', 'Customers', 'Merchants', 'Drivers'];

  // ── Restaurants state ─────────────────
  const [restaurants, setRestaurants] = useState<Merchant[]>([]);
  const [restLoading, setRestLoading] = useState(true);
  const [restRefreshing, setRestRefreshing] = useState(false);
  const [restFilter, setRestFilter] = useState<'all' | 'active' | 'pending'>('pending');

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
      fetchRestaurants();
    }, [])
  );

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
      setUsersRefreshing(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const data = await getMerchants();
      setRestaurants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRestLoading(false);
      setRestRefreshing(false);
    }
  };

  const handleApprove = async (id: string) => {
    const success = await approveMerchant(id);
    if (success) {
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
    } else {
      alert('Failed to approve merchant');
    }
  };

  const getFilteredUsers = () => {
    if (userFilter === 'All') return users;
    return users.filter(u => {
      const role = u.role?.toUpperCase();
      if (userFilter === 'Customers') return role === 'CUSTOMER';
      if (userFilter === 'Merchants') return role === 'MERCHANT';
      if (userFilter === 'Drivers') return role === 'RIDER';
      return false;
    });
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (restFilter === 'active') return r.isApproved && r.isOpen;
    if (restFilter === 'pending') return !r.isApproved;
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.headerTitle}>Manage</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {segment === 'users' ? 'Platform users & roles' : 'Restaurant partnerships'}
        </ThemedText>
      </ThemedView>

      {/* Segment Toggle */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segBtn, segment === 'restaurants' && styles.segBtnActive]}
          onPress={() => setSegment('restaurants')}
        >
          <IconSymbol size={16} name="restaurants" color={segment === 'restaurants' ? '#FFF' : '#888'} />
          <ThemedText style={[styles.segText, segment === 'restaurants' && styles.segTextActive]}>
            Restaurants
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segBtn, segment === 'users' && styles.segBtnActive]}
          onPress={() => setSegment('users')}
        >
          <IconSymbol size={16} name="users" color={segment === 'users' ? '#FFF' : '#888'} />
          <ThemedText style={[styles.segText, segment === 'users' && styles.segTextActive]}>
            Users
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* ─── RESTAURANTS ─── */}
      {segment === 'restaurants' && (
        <>
          {/* Stats / filter row */}
          <View style={styles.statsRow}>
            {(['all', 'active', 'pending'] as const).map(f => {
              const count =
                f === 'all' ? restaurants.length :
                f === 'active' ? restaurants.filter(r => r.isApproved && r.isOpen).length :
                restaurants.filter(r => !r.isApproved).length;
              const labels = { all: 'Total', active: 'Active', pending: 'Pending' };
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.statCard, restFilter === f && styles.activeStatCard]}
                  onPress={() => setRestFilter(f)}
                >
                  <ThemedText style={[styles.statValue, restFilter === f && styles.activeStatText]}>{count}</ThemedText>
                  <ThemedText style={[styles.statLabel, restFilter === f && styles.activeStatText]}>{labels[f]}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {restLoading ? (
            <View style={styles.loadingBox}><ActivityIndicator size="large" color="#C2185B" /></View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={restRefreshing} onRefresh={() => { setRestRefreshing(true); fetchRestaurants(); }} />}
            >
              {filteredRestaurants.length === 0 ? (
                <View style={styles.emptyBox}>
                  <ThemedText style={styles.emptyText}>No restaurants found</ThemedText>
                </View>
              ) : filteredRestaurants.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.restaurantCard}
                  onPress={() => router.push(`/restaurant-details/${r.id}`)}
                >
                  <Image
                    source={{ uri: resolveImageUrl(r.coverImage || r.imageUrl || r.logo) || 'https://placehold.co/500x200/f0f0f0/aaa?text=Restaurant' }}
                    style={styles.restaurantImage}
                  />
                  <View style={styles.restaurantInfo}>
                    <View style={styles.restaurantHeader}>
                      <ThemedText style={styles.restaurantName} numberOfLines={1}>{r.name}</ThemedText>
                      {r.isApproved ? (
                        <Switch
                          value={r.isOpen || false}
                          trackColor={{ false: '#DDD', true: '#F48FB1' }}
                          thumbColor={r.isOpen ? '#C2185B' : '#FFF'}
                          disabled
                        />
                      ) : (
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(r.id)}>
                          <ThemedText style={styles.approveBtnText}>Approve</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                    <ThemedText style={styles.restaurantLocation}>{r.city || 'Unknown Location'}</ThemedText>
                    <View style={styles.restaurantStats}>
                      <View style={styles.statItem}>
                        <IconSymbol size={13} name="dashboard" color="#F57C00" />
                        <ThemedText style={styles.statItemText}>{r.rating?.toFixed(1) || 'N/A'}</ThemedText>
                      </View>
                      <View style={styles.statItem}>
                        <IconSymbol size={13} name="orders" color="#1976D2" />
                        <ThemedText style={styles.statItemText}>{r.totalOrders || 0} orders</ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </>
      )}

      {/* ─── USERS ─── */}
      {segment === 'users' && (
        <>
          {/* Sub-filter tabs */}
          <View style={{ height: 50 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ paddingRight: 16 }}>
              {userTabs.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, userFilter === tab && styles.activeTab]}
                  onPress={() => setUserFilter(tab)}
                >
                  <ThemedText style={[styles.tabText, userFilter === tab && styles.activeTabText]}>{tab}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {usersLoading ? (
            <View style={styles.loadingBox}><ActivityIndicator size="large" color="#C2185B" /></View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={usersRefreshing} onRefresh={() => { setUsersRefreshing(true); fetchUsers(); }} />}
            >
              {getFilteredUsers().length === 0 ? (
                <View style={styles.emptyBox}>
                  <ThemedText style={styles.emptyText}>No users found</ThemedText>
                </View>
              ) : getFilteredUsers().map(user => (
                <View key={user.id} style={styles.userCard}>
                  <View style={[styles.avatarCircle, {
                    backgroundColor:
                      user.role === UserRole.MERCHANT ? '#1976D2' :
                      user.role === UserRole.ADMIN ? '#E65100' : '#C2185B'
                  }]}>
                    <ThemedText style={styles.avatarText}>{(user.name || 'U').charAt(0)}</ThemedText>
                  </View>
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName}>{user.name || 'Unknown'}</ThemedText>
                    <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
                    <View style={styles.userMeta}>
                      <View style={[styles.roleBadge, {
                        backgroundColor:
                          user.role === UserRole.MERCHANT ? '#E3F2FD' :
                          user.role === UserRole.ADMIN ? '#FFF3E0' : '#F3E5F5'
                      }]}>
                        <ThemedText style={[styles.roleText, {
                          color:
                            user.role === UserRole.MERCHANT ? '#1976D2' :
                            user.role === UserRole.ADMIN ? '#E65100' : '#7B1FA2'
                        }]}>{user.role}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: user.isActive ? '#4CAF50' : '#F44336' }]} />
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#C2185B',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Segment toggle
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 6,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segBtnActive: { backgroundColor: '#C2185B' },
  segText: { fontSize: 13, fontWeight: '700', color: '#888' },
  segTextActive: { color: '#FFF' },

  // Restaurant cards
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#EEE',
  },
  activeStatCard: { backgroundColor: '#C2185B', borderColor: '#C2185B' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#C2185B' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  activeStatText: { color: '#FFF' },
  restaurantCard: {
    backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE', overflow: 'hidden',
  },
  restaurantImage: { width: '100%', height: 130 },
  restaurantInfo: { padding: 12 },
  restaurantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  restaurantName: { fontSize: 15, fontWeight: '900', color: '#333', flex: 1 },
  restaurantLocation: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 8 },
  restaurantStats: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statItemText: { fontSize: 12, color: '#666', fontWeight: '600' },
  approveBtn: { backgroundColor: '#388E3C', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  approveBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // User tabs
  tabRow: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { paddingHorizontal: 18, paddingVertical: 14 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#C2185B' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#999' },
  activeTabText: { color: '#C2185B' },

  // User cards
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEE',
  },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 14, fontWeight: '800', color: '#333' },
  userEmail: { fontSize: 12, color: '#888', marginTop: 2 },
  userMeta: { flexDirection: 'row', marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: '800' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  // Shared
  scrollContent: { padding: 16 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', fontStyle: 'italic' },
});
