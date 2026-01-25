import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Switch } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();

  const menuItems = [
    { icon: 'fees', label: 'Earnings & Payouts', color: '#388E3C' },
    { icon: 'receipt', label: 'Delivery History', color: '#1976D2' },
    { icon: 'map', label: 'Documents & Vehicle', color: '#F57C00' },
    { icon: 'dashboard', label: 'Performance & Ratings', color: '#7B1FA2' },
    { icon: 'account', label: 'Settings', color: '#666' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.profileRow}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200' }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <ThemedText style={styles.name}>Pedro Penduko</ThemedText>
            <ThemedText style={styles.vehicle}>Yamaha NMAX • ABC 1234</ThemedText>
            <View style={styles.ratingBadge}>
              <IconSymbol size={12} name="dashboard" color="#FFF" />
              <ThemedText style={styles.ratingText}>4.9 (1,240 deliveries)</ThemedText>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View>
            <ThemedText style={styles.walletLabel}>Available Balance</ThemedText>
            <ThemedText style={styles.walletAmount}>₱1,250.50</ThemedText>
          </View>
          <TouchableOpacity style={styles.cashoutBtn}>
            <ThemedText style={styles.cashoutText}>Cash Out</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <IconSymbol size={20} name={item.icon as any} color={item.color} />
              </View>
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
              <IconSymbol size={20} name="chevron.right" color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
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
  header: {
    backgroundColor: '#FFF',
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#C2185B',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  vehicle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C2185B',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  walletLabel: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  cashoutBtn: {
    backgroundColor: '#C2185B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cashoutText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  logoutBtn: {
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 15,
    fontWeight: '800',
  },
});
