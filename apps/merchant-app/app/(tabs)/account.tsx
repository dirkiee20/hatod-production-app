import { StyleSheet, ScrollView, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';

export default function AccountScreen() {
  const router = useRouter();
  const menuOptions = [
    { title: 'Store Profiles', subtitle: 'Hours, location, info', icon: 'house.fill' },
    { title: 'Business Analytics', subtitle: 'Payouts, sales reports', icon: 'dashboard' },
    { title: 'Employee Management', subtitle: 'Staff accounts, permissions', icon: 'person' },
    { title: 'Settings', subtitle: 'Notifications, language', icon: 'filter' },
    { title: 'Help Center', subtitle: 'Contact support', icon: 'paperplane.fill' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.profileHeader}>
         <View style={styles.imageBox}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400' }} style={styles.profileImg} />
            <TouchableOpacity style={styles.editBadge} onPress={() => router.push('/store-profile')}>
               <IconSymbol size={12} name="dashboard" color="#FFF" />
            </TouchableOpacity>
         </View>
         <ThemedText style={styles.storeName}>The Burger Mansion</ThemedText>
         <ThemedText style={styles.storeAddress}>Surigao City Central Plaza</ThemedText>
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
                } else if (option.title === 'Employee Management') {
                    router.push('/employee-management');
                } else if (option.title === 'Settings') {
                    router.push('/settings');
                } else if (option.title === 'Help Center') {
                    router.push('/help-center');
                }
             }}
           >
              <ThemedView style={styles.optionIconBox}>
                 <IconSymbol size={20} name={option.icon as any} color="#C2185B" />
              </ThemedView>
              <ThemedView style={styles.optionInfo}>
                 <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                 <ThemedText style={styles.optionSub}>{option.subtitle}</ThemedText>
              </ThemedView>
              <IconSymbol size={18} name="chevron.right" color="#DDD" />
           </TouchableOpacity>
         ))}

         <TouchableOpacity style={styles.logoutBtn}>
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
    backgroundColor: '#C2185B',
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
