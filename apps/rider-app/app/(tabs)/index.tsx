import { StyleSheet, ScrollView, TouchableOpacity, View, Switch } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);

  const stats = [
    { label: 'Earnings', value: '₱1,250', icon: 'fees', color: '#388E3C' },
    { label: 'Orders', value: '12', icon: 'orders', color: '#1976D2' },
    { label: 'Online', value: '4h 30m', icon: 'dashboard', color: '#F57C00' },
  ];

  const recentOrders = [
    { id: 'ORD-1001', restaurant: 'The Burger Mansion', income: '₱85', time: '15 mins ago', status: 'Completed' },
    { id: 'ORD-1002', restaurant: 'Pizza Palace', income: '₱120', time: '1 hour ago', status: 'Completed' },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <ThemedText style={styles.greeting}>Good afternoon,</ThemedText>
          <ThemedText style={styles.riderName}>Pedro Penduko</ThemedText>
        </View>
        <View style={styles.statusToggle}>
          <ThemedText style={[styles.statusText, { color: isOnline ? '#388E3C' : '#999' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </ThemedText>
          <Switch 
            value={isOnline} 
            onValueChange={setIsOnline}
            trackColor={{ false: '#DDD', true: '#A5D6A7' }}
            thumbColor={isOnline ? '#388E3C' : '#F5F5F5'}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <IconSymbol size={20} name={stat.icon as any} color={stat.color} />
              </View>
              <View>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Current Task (if online) */}
        {isOnline && (
          <View style={styles.currentTaskCard}>
            <ThemedText style={styles.sectionTitle}>Current Task</ThemedText>
            <View style={styles.taskContent}>
              <ThemedText style={styles.waitingText}>Scanning for nearby orders...</ThemedText>
              <View style={styles.radarAnimation}>
                <IconSymbol size={32} name="map" color="#C2185B" />
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order, idx) => (
            <View key={idx} style={styles.orderCard}>
              <View style={styles.orderIcon}>
                <IconSymbol size={20} name="receipt" color="#C2185B" />
              </View>
              <View style={styles.orderInfo}>
                <ThemedText style={styles.orderRestaurant}>{order.restaurant}</ThemedText>
                <ThemedText style={styles.orderTime}>{order.time} • {order.status}</ThemedText>
              </View>
              <ThemedText style={styles.orderIncome}>{order.income}</ThemedText>
            </View>
          ))}
        </View>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  greeting: {
    fontSize: 12,
    color: '#888',
  },
  riderName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
  },
  currentTaskCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
  },
  taskContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  radarAnimation: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2185B',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  orderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderRestaurant: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  orderTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  orderIncome: {
    fontSize: 14,
    fontWeight: '800',
    color: '#388E3C',
  },
});
