import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/api/client';

type Range = 'Week' | 'Month' | 'Year';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  cancelRate: number;
  rating: number;
  chartData: { label: string; value: number }[];
  topItems: { name: string; sales: number; revenue: number }[];
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<Range>('Week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const rangeParam = timeRange.toLowerCase();
      const res = await authenticatedFetch(`/orders/merchant/analytics?range=${rangeParam}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `₱${(val / 1000).toFixed(1)}k`;
    return `₱${val.toFixed(0)}`;
  };

  const renderBarChart = () => {
    const chartData = data?.chartData ?? [];
    const maxValue = Math.max(...chartData.map(d => d.value), 1);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.chartTitle}>Revenue Overview</ThemedText>
          <View style={styles.timeFilter}>
            {(['Week', 'Month', 'Year'] as Range[]).map((t) => (
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

        {loading ? (
          <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#C2185B" />
          </View>
        ) : (
          <View style={styles.chartArea}>
            {chartData.map((item, index) => {
              const heightPercentage = (item.value / maxValue) * 100;
              return (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${heightPercentage}%` as any }]} />
                  </View>
                  <ThemedText style={styles.barLabel}>{item.label}</ThemedText>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const totalRevenue = data?.totalRevenue ?? 0;
  const totalOrders = data?.totalOrders ?? 0;
  const avgOrder = data?.avgOrder ?? 0;
  const cancelRate = data?.cancelRate ?? 0;
  const rating = data?.rating ?? 0;
  const topItems = data?.topItems ?? [];

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
            <ThemedText style={styles.kpiValueLight}>
              {loading ? '—' : `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </ThemedText>
            <View style={styles.kpiBadge}>
               <ThemedText style={styles.kpiBadgeText}>{timeRange}</ThemedText>
            </View>
          </View>

          <View style={styles.kpiRightCol}>
             <View style={styles.kpiCardSmall}>
                <ThemedText style={styles.kpiLabel}>Total Orders</ThemedText>
                <View style={styles.kpiRowSmall}>
                   <ThemedText style={styles.kpiValue}>{loading ? '—' : totalOrders}</ThemedText>
                </View>
             </View>
             <View style={styles.kpiCardSmall}>
                <ThemedText style={styles.kpiLabel}>Avg. Order</ThemedText>
                <View style={styles.kpiRowSmall}>
                   <ThemedText style={styles.kpiValue}>{loading ? '—' : `₱${avgOrder.toFixed(0)}`}</ThemedText>
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
          </View>

          {loading ? (
            <ActivityIndicator color="#C2185B" style={{ marginVertical: 20 }} />
          ) : topItems.length === 0 ? (
            <ThemedText style={{ color: '#999', textAlign: 'center', paddingVertical: 20 }}>No sales data yet</ThemedText>
          ) : (
            topItems.map((item, idx) => (
               <View key={idx} style={styles.itemRow}>
                  <View style={styles.rankBadge}>
                     <ThemedText style={styles.rankText}>#{idx + 1}</ThemedText>
                  </View>
                  <View style={styles.itemInfo}>
                     <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                     <ThemedText style={styles.itemSales}>{item.sales} sold</ThemedText>
                  </View>
                  <View style={styles.itemRevenue}>
                     <ThemedText style={styles.revenueText}>₱{item.revenue.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</ThemedText>
                  </View>
               </View>
            ))
          )}
        </View>

        {/* Performance Stats */}
        <View style={styles.statsGrid}>
           <View style={styles.statBox}>
              <IconSymbol size={24} name="star.fill" color="#FFD700" />
              <ThemedText style={styles.statVal}>{loading ? '—' : rating.toFixed(1)}</ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
           </View>
           <View style={styles.statBox}>
              <IconSymbol size={24} name="xmark.circle.fill" color="#F44336" />
              <ThemedText style={styles.statVal}>{loading ? '—' : `${cancelRate.toFixed(1)}%`}</ThemedText>
              <ThemedText style={styles.statLabel}>Cancel Rate</ThemedText>
           </View>
           <View style={styles.statBox}>
              <IconSymbol size={24} name="bag.fill" color="#4CAF50" />
              <ThemedText style={styles.statVal}>{loading ? '—' : totalOrders}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Orders</ThemedText>
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
    fontSize: 24,
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
