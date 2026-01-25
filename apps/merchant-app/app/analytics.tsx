import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

// Mock Data
const WEEKLY_DATA = [
  { day: 'Mon', value: 4500, label: '4.5k' },
  { day: 'Tue', value: 3200, label: '3.2k' },
  { day: 'Wed', value: 5800, label: '5.8k' },
  { day: 'Thu', value: 4900, label: '4.9k' },
  { day: 'Fri', value: 7200, label: '7.2k' },
  { day: 'Sat', value: 8500, label: '8.5k' },
  { day: 'Sun', value: 6100, label: '6.1k' },
];

const TOP_ITEMS = [
  { name: 'Double Cheese Burger', sales: 142, revenue: '28,400', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' },
  { name: 'Spicy Chicken Wings', sales: 98, revenue: '14,700', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=200' },
  { name: 'French Fries (L)', sales: 85, revenue: '8,500', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e06497?w=200' },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('Week');
  const screenWidth = Dimensions.get('window').width;

  const renderBarChart = () => {
    const maxValue = Math.max(...WEEKLY_DATA.map(d => d.value));
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.chartTitle}>Revenue Overview</ThemedText>
          <View style={styles.timeFilter}>
            {['Week', 'Month', 'Year'].map((t) => (
              <TouchableOpacity 
                key={t} 
                style={[styles.filterBtn, timeRange === t && styles.filterBtnActive]}
                onPress={() => setTimeRange(t)}
              >
                <ThemedText style={[styles.filterText, timeRange === t && styles.filterTextActive]}>{t}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.chartArea}>
          {WEEKLY_DATA.map((item, index) => {
            const heightPercentage = (item.value / maxValue) * 100;
            return (
              <View key={index} style={styles.barGroup}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${heightPercentage}%` }]} />
                </View>
                <ThemedText style={styles.barLabel}>{item.day}</ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Business Analytics',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
            <View style={styles.kpiIcon}>
               <IconSymbol size={20} name="creditcard" color="#FFF" />
            </View>
            <ThemedText style={styles.kpiLabelLight}>Total Revenue</ThemedText>
            <ThemedText style={styles.kpiValueLight}>₱48,500</ThemedText>
            <View style={styles.kpiBadge}>
               <IconSymbol size={10} name="arrow.up" color="#4CAF50" />
               <ThemedText style={styles.kpiBadgeText}>+12.5%</ThemedText>
            </View>
          </View>
          
          <View style={styles.kpiRightCol}>
             <View style={styles.kpiCardSmall}>
                <ThemedText style={styles.kpiLabel}>Total Orders</ThemedText>
                <View style={styles.kpiRowSmall}>
                   <ThemedText style={styles.kpiValue}>342</ThemedText>
                   <ThemedText style={styles.kpiChangePositive}>+5%</ThemedText>
                </View>
             </View>
             <View style={styles.kpiCardSmall}>
                <ThemedText style={styles.kpiLabel}>Avg. Order</ThemedText>
                <View style={styles.kpiRowSmall}>
                   <ThemedText style={styles.kpiValue}>₱142</ThemedText>
                   <ThemedText style={styles.kpiChangeNegative}>-2%</ThemedText>
                </View>
             </View>
          </View>
        </View>

        {/* Chart Section */}
        {renderBarChart()}

        {/* Top Selling */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Top Selling Items</ThemedText>
            <TouchableOpacity>
               <ThemedText style={styles.seeAll}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          {TOP_ITEMS.map((item, idx) => (
             <View key={idx} style={styles.itemRow}>
                <View style={styles.rankBadge}>
                   <ThemedText style={styles.rankText}>#{idx + 1}</ThemedText>
                </View>
                <View style={styles.itemInfo}>
                   <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                   <ThemedText style={styles.itemSales}>{item.sales} sold</ThemedText>
                </View>
                <View style={styles.itemRevenue}>
                   <ThemedText style={styles.revenueText}>₱{item.revenue}</ThemedText>
                </View>
             </View>
          ))}
        </View>

        {/* Performance Stats */}
        <View style={styles.statsGrid}>
           <View style={styles.statBox}>
              <IconSymbol size={24} name="star.fill" color="#FFD700" />
              <ThemedText style={styles.statVal}>4.8</ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
           </View>
           <View style={styles.statBox}>
              <IconSymbol size={24} name="clock.fill" color="#2196F3" />
              <ThemedText style={styles.statVal}>24m</ThemedText>
              <ThemedText style={styles.statLabel}>Avg Prep</ThemedText>
           </View>
           <View style={styles.statBox}>
              <IconSymbol size={24} name="xmark.circle.fill" color="#F44336" />
              <ThemedText style={styles.statVal}>1.2%</ThemedText>
              <ThemedText style={styles.statLabel}>Cancel Rate</ThemedText>
           </View>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  kpiCard: {
    flex: 1.2,
    padding: 20,
    borderRadius: 20,
    justifyContent: 'space-between',
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  kpiCardPrimary: {
    backgroundColor: '#C2185B',
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiLabelLight: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  kpiValueLight: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  kpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  kpiBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiRightCol: {
    flex: 1,
    gap: 12,
  },
  kpiCardSmall: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  kpiLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiRowSmall: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  kpiChangePositive: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiChangeNegative: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  timeFilter: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 2,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#333',
    fontWeight: '800',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
  },
  barGroup: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  barTrack: {
    width: 8,
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#C2185B',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#999',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  seeAll: {
    fontSize: 13,
    color: '#C2185B',
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 11,
    color: '#C2185B',
    fontWeight: '800',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  itemSales: {
    fontSize: 12,
    color: '#888',
  },
  itemRevenue: {
    alignItems: 'flex-end',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
});
