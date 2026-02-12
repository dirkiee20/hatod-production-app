import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUsers } from '../../api/services';
import { User, UserRole } from '../../api/types';

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
        const data = await getUsers();
        setUsers(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const userTabs = ['All', 'Customers', 'Merchants', 'Drivers'];

  const getFilteredUsers = () => {
    if (activeTab === 'All') return users;
    return users.filter(u => {
      const role = u.role?.toUpperCase();
      if (activeTab === 'Customers') return role === 'CUSTOMER';
      if (activeTab === 'Merchants') return role === 'MERCHANT';
      if (activeTab === 'Drivers') return role === 'RIDER';
      return false;
    });
  };

  const filteredUsers = getFilteredUsers();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.headerTitle}>Users Management</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Manage all platform users</ThemedText>
      </ThemedView>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol size={18} name="users" color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={{ height: 55 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={{paddingRight: 20}}>
            {userTabs.map((tab) => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
           <ActivityIndicator size="large" color="#C2185B" />
        </View>
      ) : (
        <ScrollView 
          style={{flex: 1}}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredUsers.length === 0 ? (
             <View style={{alignItems: 'center', marginTop: 50}}>
                <ThemedText style={{color: '#888', fontStyle: 'italic'}}>No users found</ThemedText>
             </View>
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity key={user.id} style={styles.userCard}>
                <View style={styles.avatarCircle}>
                  <ThemedText style={styles.avatarText}>{(user.name || 'U').charAt(0)}</ThemedText>
                </View>
                
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{user.name || 'Unknown'}</ThemedText>
                  <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
                  <View style={styles.userMeta}>
                    <View style={[styles.typeBadge, { 
                        backgroundColor: user.role === UserRole.MERCHANT ? '#E3F2FD' : 
                                       user.role === UserRole.ADMIN ? '#FFF3E0' : '#F3E5F5' 
                    }]}>
                      <ThemedText style={[styles.typeText, { 
                          color: user.role === UserRole.MERCHANT ? '#1976D2' : 
                                 user.role === UserRole.ADMIN ? '#E65100' : '#7B1FA2' 
                      }]}>
                        {user.role}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.orderCount}>0 orders</ThemedText>
                  </View>
                </View>

                <View style={[styles.statusDot, { backgroundColor: user.isActive ? '#4CAF50' : '#F44336' }]} />
              </TouchableOpacity>
            ))
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#C2185B',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  tabContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#C2185B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  activeTabText: {
    color: '#C2185B',
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 10,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderCount: {
    fontSize: 12,
    color: '#999',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
