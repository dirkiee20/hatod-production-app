import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  const stats = [
    { label: 'Total Revenue', value: '₱125,450', icon: 'fees', color: '#388E3C', change: '+12%' },
    { label: 'Active Orders', value: '24', icon: 'orders', color: '#1976D2', change: '+5%' },
    { label: 'Total Users', value: '1,234', icon: 'users', color: '#7B1FA2', change: '+8%' },
    { label: 'Restaurants', value: '45', icon: 'restaurants', color: '#F57C00', change: '+3%' },
  ];

  const recentActivity = [
    { id: '1', type: 'order', message: 'New order #ORD-1234 placed', time: '2 mins ago' },
    { id: '2', type: 'restaurant', message: 'Pizza Palace updated menu', time: '15 mins ago' },
    { id: '3', type: 'user', message: 'New merchant registered', time: '1 hour ago' },
    { id: '4', type: 'order', message: 'Order #ORD-1230 completed', time: '2 hours ago' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Compact Header */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View>
            <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
            <ThemedText style={styles.adminName}>Admin</ThemedText>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <IconSymbol size={20} name="dashboard" color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <TouchableOpacity key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <IconSymbol size={20} name={stat.icon as any} color={stat.color} />
              </View>
              <View>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          {recentActivity.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityCard}>
              <View style={[styles.activityDot, { 
                backgroundColor: activity.type === 'order' ? '#1976D2' : 
                               activity.type === 'restaurant' ? '#F57C00' : '#7B1FA2' 
              }]} />
              <View style={styles.activityInfo}>
                <ThemedText style={styles.activityMessage}>{activity.message}</ThemedText>
                <ThemedText style={styles.activityTime}>{activity.time}</ThemedText>
              </View>
              <IconSymbol size={16} name="chevron.right" color="#DDD" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol size={28} name="restaurants" color="#C2185B" />
              <ThemedText style={styles.actionText}>Add Restaurant</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol size={28} name="users" color="#C2185B" />
              <ThemedText style={styles.actionText}>Manage Users</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol size={28} name="fees" color="#C2185B" />
              <ThemedText style={styles.actionText}>Update Fees</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol size={28} name="orders" color="#C2185B" />
              <ThemedText style={styles.actionText}>View Reports</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 12,
    color: '#888',
  },
  adminName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    gap: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginTop: 6,
    textAlign: 'center',
  },
});
