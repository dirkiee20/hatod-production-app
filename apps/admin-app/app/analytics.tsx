import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_H = 130;
const ACCENT = '#C2185B';
const ACCENT_LIGHT = '#FCE4EC';

type Range = 'week' | 'month' | 'year';

interface Analytics {
  totalRevenue: number;
  totalDeliveryFees: number;
  totalMarkup: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  cancelRate: number;
  avgOrderValue: number;
  merchantCount: number;
  riderCount: number;
  customerCount: number;
  chartData: { label: string; value: number }[];
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={chartStyles.container}>
      {/* bars row — fixed height, no overflow */}
      <View style={chartStyles.bars}>
        {data.map((d, i) => (
          <View key={i} style={chartStyles.barCol}>
            <View style={chartStyles.barTrack}>
              <View style={[chartStyles.barFill, { height: `${Math.max(d.value / max * 100, 3)}%` }]} />
            </View>
          </View>
        ))}
      </View>
      {/* labels row — separate, below bars */}
      <View style={chartStyles.labels}>
        {data.map((d, i) => (
          <ThemedText key={i} style={chartStyles.barLabel}>{d.label}</ThemedText>
        ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { paddingTop: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: 4, paddingHorizontal: 2 },
  barCol: { flex: 1, height: '100%' },          // exactly fills bars row, no overflow
  barTrack: {
    flex: 1, width: '100%', backgroundColor: '#F5F5F5',
    borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: ACCENT, borderRadius: 5 },
  labels: { flexDirection: 'row', marginTop: 4, paddingHorizontal: 2 },
  barLabel: { flex: 1, fontSize: 9, color: '#AAA', textAlign: 'center' },
});

function KpiCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: any }) {
  return (
    <View style={kpiStyles.card}>
      <View style={kpiStyles.iconBox}>
        <IconSymbol size={18} name={icon} color={ACCENT} />
      </View>
      <ThemedText style={kpiStyles.value}>{value}</ThemedText>
      <ThemedText style={kpiStyles.label}>{label}</ThemedText>
      {sub ? <ThemedText style={kpiStyles.sub}>{sub}</ThemedText> : null}
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  card: {
    width: (SCREEN_W - 48) / 2,
    backgroundColor: '#FFF',
    borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEE',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  value: { fontSize: 22, fontWeight: '900', color: '#222' },
  label: { fontSize: 11, color: '#999', marginTop: 2, fontWeight: '600' },
  sub: { fontSize: 10, color: '#BBB', marginTop: 1 },
});

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [range, setRange] = useState<Range>('week');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (r: Range) => {
    try {
      const { authenticatedFetch } = await import('../api/client');
      const res = await authenticatedFetch(`/orders/admin/analytics?range=${r}`);
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(range);
  }, [range]);

  const onRefresh = () => { setRefreshing(true); fetchAnalytics(range); };

  const fmt = (n: number) => n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : `₱${n.toFixed(0)}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol size={20} name="chevron.left" color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Business Analytics</ThemedText>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Range Picker */}
        <View style={styles.rangePicker}>
          {(['week', 'month', 'year'] as Range[]).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
              onPress={() => setRange(r)}
            >
              <ThemedText style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadBox}>
            <ActivityIndicator color={ACCENT} size="large" />
            <ThemedText style={styles.loadTxt}>Loading analytics…</ThemedText>
          </View>
        ) : analytics ? (
          <>
            {/* Revenue Chart */}
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>Revenue</ThemedText>
              <ThemedText style={styles.bigNum}>{fmt(analytics.totalRevenue)}</ThemedText>
              <View style={{ marginTop: 12 }}>
                <BarChart data={analytics.chartData} />
              </View>
              <View style={styles.statRow}>
                <View style={styles.statCell}>
                  <ThemedText style={styles.statVal}>{analytics.deliveredOrders}</ThemedText>
                  <ThemedText style={styles.statLbl}>Delivered</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.statCell}>
                  <ThemedText style={styles.statVal}>{analytics.cancelledOrders}</ThemedText>
                  <ThemedText style={styles.statLbl}>Cancelled</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.statCell}>
                  <ThemedText style={styles.statVal}>{fmt(analytics.avgOrderValue)}</ThemedText>
                  <ThemedText style={styles.statLbl}>Avg Order</ThemedText>
                </View>
                <View style={styles.divider} />
                <View style={styles.statCell}>
                  <ThemedText style={[styles.statVal, { color: analytics.cancelRate > 10 ? '#E53935' : '#2E7D32' }]}>
                    {fmtPct(analytics.cancelRate)}
                  </ThemedText>
                  <ThemedText style={styles.statLbl}>Cancel Rate</ThemedText>
                </View>
              </View>
            </View>

            {/* Delivery Fees + Markup Row */}
            <View style={styles.bannersRow}>
              <View style={[styles.feesBanner, { flex: 1 }]}>
                <View style={styles.feesIcon}>
                  <IconSymbol size={18} name="fees" color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.feesLabel}>Delivery Fees</ThemedText>
                  <ThemedText style={styles.feesVal}>{fmt(analytics.totalDeliveryFees)}</ThemedText>
                </View>
              </View>
              <View style={[styles.feesBanner, { flex: 1, backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
                <View style={[styles.feesIcon, { backgroundColor: '#FFF' }]}>
                  <IconSymbol size={18} name="chart.bar.fill" color="#2E7D32" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.feesLabel}>Markup Collected</ThemedText>
                  <ThemedText style={[styles.feesVal, { color: '#2E7D32' }]}>{fmt(analytics.totalMarkup)}</ThemedText>
                </View>
              </View>
            </View>

            {/* KPI Grid */}
            <ThemedText style={styles.sectionLabel}>PLATFORM OVERVIEW</ThemedText>
            <View style={styles.kpiGrid}>
              <KpiCard icon="storefront" label="Active Merchants" value={String(analytics.merchantCount)} sub="approved & live" />
              <KpiCard icon="person.2.fill" label="Total Customers" value={String(analytics.customerCount)} />
              <KpiCard icon="bicycle" label="Riders" value={String(analytics.riderCount)} sub="registered" />
              <KpiCard icon="bag.fill" label="Total Orders" value={String(analytics.totalOrders)} sub={`this ${range}`} />
            </View>
          </>
        ) : (
          <View style={styles.loadBox}>
            <ThemedText style={{ color: '#999' }}>Could not load analytics.</ThemedText>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: ACCENT, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },

  scrollContent: { padding: 16, paddingTop: 20 },

  rangePicker: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#F0F0F0', alignItems: 'center',
  },
  rangeBtnActive: { backgroundColor: ACCENT },
  rangeBtnText: { fontSize: 13, fontWeight: '700', color: '#666' },
  rangeBtnTextActive: { color: '#FFF' },

  loadBox: { height: 220, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadTxt: { fontSize: 13, color: '#AAA' },

  card: {
    backgroundColor: '#FFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#EEE', padding: 16, marginBottom: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 2 },
  bigNum: { fontSize: 26, fontWeight: '900', color: ACCENT },

  statRow: {
    flexDirection: 'row', marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '900', color: '#333' },
  statLbl: { fontSize: 9, color: '#AAA', marginTop: 2 },
  divider: { width: 1, backgroundColor: '#EEE', marginHorizontal: 4 },

  bannersRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  feesBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: ACCENT_LIGHT, borderRadius: 14,
    padding: 12, borderWidth: 1, borderColor: '#F8BBD0', gap: 10,
  },
  feesIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
  },
  feesLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  feesVal: { fontSize: 20, fontWeight: '900', color: ACCENT, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAA',
    letterSpacing: 1, marginBottom: 10,
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
