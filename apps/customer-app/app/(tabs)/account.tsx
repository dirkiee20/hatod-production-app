import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useUser } from '@/context/UserContext';

export default function AccountScreen() {
  const router = useRouter();
  const { user, refreshProfile, logoutUser } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const menuItems = [
    { icon: 'person', label: 'Profile Information', color: '#f78734' },
    { icon: 'cart', label: 'My Food Orders', color: '#5856D6' },
    { icon: 'grocery', label: 'My Grocery Orders', color: '#4CAF50' },
    { icon: 'bag.fill', label: 'My Pabili Requests', color: '#f78734' },
    { icon: 'government', label: 'Government Transcripts', color: '#4CD964' },
    { icon: 'paperplane.fill', label: 'Support & Feedback', color: '#FF9500' },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => {
             logoutUser();
          }
        }
      ]
    );
  };

  const getInitials = () => {
      if (!user?.customer) return 'JD';
      const first = user.customer.firstName?.charAt(0) || '';
      const last = user.customer.lastName?.charAt(0) || '';
      return (first + last).toUpperCase() || 'JD';
  };

  const getFullName = () => {
      if (!user?.customer) return 'Loading...';
      return `${user.customer.firstName} ${user.customer.lastName}`;
  };

  const getEmailOrPhone = () => {
      if (user?.phone) return user.phone;
      if (user?.email && user.email.endsWith('@hatod.com')) {
          return user.email.replace('@hatod.com', '');
      }
      return user?.email || '';
  };

  return (
    <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedView style={styles.header}>
        <ThemedView style={styles.profileContainer}>
          <ThemedView style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>{getInitials()}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.profileInfo}>
            <ThemedText style={styles.userName}>{getFullName()}</ThemedText>
            <ThemedText style={styles.email}>{getEmailOrPhone()}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>

        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuItem}
            onPress={() => {
              if (item.label === 'Profile Information') {
                router.push('/profile-info');
              } else if (item.label === 'My Food Orders') {
                router.push('/food-orders');
              } else if (item.label === 'My Grocery Orders') {
                router.push('/grocery-orders');
              } else if (item.label === 'My Pabili Requests') {
                router.push('/pabili-orders');
              } else if (item.label === 'Government Transcripts') {
                router.push('/government-transcripts');
              } else if (item.label === 'Support & Feedback') {
                router.push('/support');
              }
            }}
          >
            <ThemedView style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <IconSymbol size={20} name={item.icon as any} color={item.color} />
            </ThemedView>
            <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
            <IconSymbol size={16} name="chevron.right" color="#DDD" />
          </TouchableOpacity>
        ))}
      </ThemedView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.footerInfo}>
        <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
      </ThemedView>
    </ScrollView>
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
    paddingBottom: 25,
    backgroundColor: '#5c6cc9', // Hatod Purple
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#5c6cc9',
  },
  profileInfo: {
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  email: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 15,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#FFF1F1',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  logoutText: {
    color: '#D81B60',
    fontWeight: '800',
    fontSize: 14,
  },
  footerInfo: {
    marginTop: 40,
    alignItems: 'center',
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 11,
    color: '#BBB',
  },
});
