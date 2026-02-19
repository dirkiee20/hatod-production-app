import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { logout, authenticatedFetch, resolveImageUrl } from '@/api/client';

export default function AccountScreen() {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('Merchant Account');
  const [storeAddress, setStoreAddress] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authenticatedFetch('/merchants/profile');
      if (res.ok) {
        const data = await res.json();
        setStoreName(data.name || 'Merchant Account');
        setStoreAddress(data.address || '');
        if (data.logo) setLogo(resolveImageUrl(data.logo) || null);
      }
    } catch (e) {
      console.error('Failed to load merchant profile', e);
    }
  };

  const menuOptions = [
    { title: 'Store Profiles', subtitle: 'Hours, location, info', icon: 'house.fill' },
    { title: 'Business Analytics', subtitle: 'Payouts, sales reports', icon: 'dashboard' },
    { title: 'Settings', subtitle: 'Notifications, language', icon: 'filter' },
    { title: 'Help Center', subtitle: 'Contact support', icon: 'paperplane.fill' },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => {
             logout();
             router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.profileHeader}>
         <View style={styles.imageBox}>
            <Image 
              source={
                logo
                  ? { uri: logo }
                  : { uri: 'https://via.placeholder.com/90x90?text=Store' }
              }
              style={styles.profileImg}
            />
            <TouchableOpacity style={styles.editBadge} onPress={() => router.push('/store-profile')}>
               <IconSymbol size={12} name="dashboard" color="#FFF" />
            </TouchableOpacity>
         </View>
         <ThemedText style={styles.storeName}>{storeName}</ThemedText>
         {storeAddress ? (
           <ThemedText style={styles.storeAddress}>{storeAddress}</ThemedText>
         ) : null}
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
         {menuOptions.map((option, idx) => (
           <TouchableOpacity 
             key={idx} 
             style={styles.optionRow}
             onPress={() => {
                if (option.title === 'Store Profiles') {
                    router.push('/store-profile');
                } else if (option.title === 'Business Analytics') {
                    router.push('/analytics');
                } else if (option.title === 'Settings') {
                    router.push('/settings');
                } else if (option.title === 'Help Center') {
                    router.push('/help-center');
                }
             }}
           >
              <ThemedView style={styles.optionIconBox}>
                 <IconSymbol size={20} name={option.icon as any} color="#f78734" />
              </ThemedView>
              <ThemedView style={styles.optionInfo}>
                 <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                 <ThemedText style={styles.optionSub}>{option.subtitle}</ThemedText>
              </ThemedView>
              <IconSymbol size={18} name="chevron.right" color="#DDD" />
           </TouchableOpacity>
         ))}

         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>Log out of Merchant Console</ThemedText>
         </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  profileHeader: {
    paddingTop: 80,
    paddingBottom: 30,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  imageBox: {
    width: 90,
    height: 90,
    position: 'relative',
    marginBottom: 15,
  },
  profileImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FCE4EC',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5c6cc9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  storeAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  optionSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 30,
    alignItems: 'center',
    paddingVertical: 15,
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '800',
  },
});
