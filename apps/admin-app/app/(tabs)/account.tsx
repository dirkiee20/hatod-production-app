import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View, Alert,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../../api/client';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_H = 120;
const ACCENT = '#C2185B';
const ACCENT_LIGHT = '#FCE4EC';

type Range = 'week' | 'month' | 'year';

interface Analytics {
  totalRevenue: number;
  totalDeliveryFees: number;
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
      <View style={chartStyles.bars}>
        {data.map((d, i) => {
          const pct = d.value / max;
          return (
            <View key={i} style={chartStyles.barCol}>
              <View style={chartStyles.barTrack}>
                <View style={[chartStyles.barFill, { height: `${Math.max(pct * 100, 2)}%` }]} />
              </View>
              <ThemedText style={chartStyles.barLabel}>{d.label}</ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { height: CHART_H + 24, paddingTop: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: 4, paddingHorizontal: 4 },
  barCol: { flex: 1, alignItems: 'center', height: CHART_H + 18 },
  barTrack: {
    flex: 1, width: '100%', backgroundColor: '#F5F5F5',
    borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: ACCENT, borderRadius: 4 },
  barLabel: { fontSize: 9, color: '#AAA', marginTop: 4, textAlign: 'center' },
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  value: { fontSize: 22, fontWeight: '900', color: '#222' },
  label: { fontSize: 11, color: '#999', marginTop: 2, fontWeight: '600' },
  sub: { fontSize: 10, color: '#BBB', marginTop: 1 },
});

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [range, setRange] = useState<Range>('week');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (r: Range) => {
    try {
      const { authenticatedFetch } = await import('../../api/client');
      const res = await authenticatedFetch(`/orders/admin/analytics?range=${r}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(range);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const fmt = (n: number) =>
    n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : `₱${n.toFixed(0)}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.avatarRing}>
          <ThemedText style={styles.avatarLetter}>A</ThemedText>
        </View>
        <View style={styles.adminInfo}>
          <ThemedText style={styles.adminName}>Admin</ThemedText>
          <ThemedText style={styles.adminRole}>Super Administrator</ThemedText>
        </View>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* ── ANALYTICS SECTION ── */}
        <ThemedText style={styles.sectionLabel}>BUSINESS ANALYTICS</ThemedText>

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
          </View>
        ) : analytics ? (
          <>
            {/* Revenue Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <ThemedText style={styles.chartTitle}>Revenue</ThemedText>
                <ThemedText style={styles.chartTotal}>{fmt(analytics.totalRevenue)}</ThemedText>
              </View>
              <BarChart data={analytics.chartData} />
              <View style={styles.chartFooter}>
                <View style={styles.chartStat}>
                  <ThemedText style={styles.chartStatVal}>{analytics.deliveredOrders}</ThemedText>
                  <ThemedText style={styles.chartStatLbl}>Delivered</ThemedText>
                </View>
                <View style={styles.chartDivider} />
                <View style={styles.chartStat}>
                  <ThemedText style={styles.chartStatVal}>{analytics.cancelledOrders}</ThemedText>
                  <ThemedText style={styles.chartStatLbl}>Cancelled</ThemedText>
                </View>
                <View style={styles.chartDivider} />
                <View style={styles.chartStat}>
                  <ThemedText style={styles.chartStatVal}>{fmt(analytics.avgOrderValue)}</ThemedText>
                  <ThemedText style={styles.chartStatLbl}>Avg Order</ThemedText>
                </View>
                <View style={styles.chartDivider} />
                <View style={styles.chartStat}>
                  <ThemedText style={[styles.chartStatVal, { color: analytics.cancelRate > 10 ? '#E53935' : '#2E7D32' }]}>
                    {fmtPct(analytics.cancelRate)}
                  </ThemedText>
                  <ThemedText style={styles.chartStatLbl}>Cancel Rate</ThemedText>
                </View>
              </View>
            </View>

            {/* Delivery Fees */}
            <View style={styles.feesCard}>
              <IconSymbol size={20} name="fees" color={ACCENT} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={styles.feesLabel}>Total Delivery Fees Collected</ThemedText>
                <ThemedText style={styles.feesValue}>{fmt(analytics.totalDeliveryFees)}</ThemedText>
              </View>
            </View>

            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <KpiCard
                icon="storefront"
                label="Active Merchants"
                value={String(analytics.merchantCount)}
                sub="approved & live"
              />
              <KpiCard
                icon="person.2.fill"
                label="Total Customers"
                value={String(analytics.customerCount)}
              />
              <KpiCard
                icon="bicycle"
                label="Riders"
                value={String(analytics.riderCount)}
                sub="registered"
              />
              <KpiCard
                icon="bag.fill"
                label="Total Orders"
                value={String(analytics.totalOrders)}
                sub={`this ${range}`}
              />
            </View>
          </>
        ) : (
          <View style={styles.loadBox}>
            <ThemedText style={{ color: '#999' }}>Could not load analytics.</ThemedText>
          </View>
        )}

        {/* ── GENERAL ── */}
        <ThemedText style={styles.sectionLabel}>GENERAL</ThemedText>
        <View style={styles.menuGroup}>
          {[
            { icon: 'person.fill' as const, label: 'Edit Profile', sub: 'Update your admin info' },
            { icon: 'lock.fill' as const, label: 'Change Password', sub: 'Update your password' },
            { icon: 'bell.fill' as const, label: 'Notifications', sub: 'Manage push notifications' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuRow} activeOpacity={0.7}>
              <View style={styles.menuIconBox}>
                <IconSymbol size={18} name={item.icon} color={ACCENT} />
              </View>
              <View style={styles.menuTextBlock}>
                <ThemedText style={styles.menuRowLabel}>{item.label}</ThemedText>
                <ThemedText style={styles.menuRowSub}>{item.sub}</ThemedText>
              </View>
              <IconSymbol size={16} name="chevron.right" color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SYSTEM ── */}
        <ThemedText style={styles.sectionLabel}>SYSTEM</ThemedText>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <View style={styles.menuIconBox}>
              <IconSymbol size={18} name={'typhoon.fill' as any} color={ACCENT} />
            </View>
            <View style={styles.menuTextBlock}>
              <ThemedText style={styles.menuRowLabel}>Typhoon Mode</ThemedText>
              <ThemedText style={styles.menuRowSub}>Override restaurant hours</ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => router.push('/(tabs)/fees')}>
            <View style={styles.menuIconBox}>
              <IconSymbol size={18} name="fees" color={ACCENT} />
            </View>
            <View style={styles.menuTextBlock}>
              <ThemedText style={styles.menuRowLabel}>Delivery Fees</ThemedText>
              <ThemedText style={styles.menuRowSub}>Manage distance-based pricing</ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <View style={styles.menuIconBox}>
              <IconSymbol size={18} name="doc.text" color={ACCENT} />
            </View>
            <View style={styles.menuTextBlock}>
              <ThemedText style={styles.menuRowLabel}>Audit Logs</ThemedText>
              <ThemedText style={styles.menuRowSub}>View system activity</ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* ── SUPPORT ── */}
        <ThemedText style={styles.sectionLabel}>SUPPORT</ThemedText>
        <View style={styles.menuGroup}>
          {[
            { icon: 'questionmark.circle' as const, label: 'Help Center', sub: 'FAQs and guides' },
            { icon: 'message.fill' as const, label: 'Contact Support', sub: 'Get help from our team' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuRow} activeOpacity={0.7}>
              <View style={styles.menuIconBox}>
                <IconSymbol size={18} name={item.icon} color={ACCENT} />
              </View>
              <View style={styles.menuTextBlock}>
                <ThemedText style={styles.menuRowLabel}>{item.label}</ThemedText>
                <ThemedText style={styles.menuRowSub}>{item.sub}</ThemedText>
              </View>
              <IconSymbol size={16} name="chevron.right" color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: ACCENT, gap: 14,
  },
  avatarRing: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  adminRole: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scrollContent: { padding: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAA',
    letterSpacing: 1, marginTop: 8, marginBottom: 8,
  },

  /* Range Picker */
  rangePicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rangeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F0F0F0', alignItems: 'center',
  },
  rangeBtnActive: { backgroundColor: ACCENT },
  rangeBtnText: { fontSize: 13, fontWeight: '700', color: '#666' },
  rangeBtnTextActive: { color: '#FFF' },

  loadBox: { height: 200, justifyContent: 'center', alignItems: 'center' },

  /* Chart Card */
  chartCard: {
    backgroundColor: '#FFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#EEE',
    padding: 16, marginBottom: 12,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chartTitle: { fontSize: 14, fontWeight: '800', color: '#333' },
  chartTotal: { fontSize: 20, fontWeight: '900', color: ACCENT },
  chartFooter: {
    flexDirection: 'row', marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  chartStat: { flex: 1, alignItems: 'center' },
  chartStatVal: { fontSize: 15, fontWeight: '900', color: '#333' },
  chartStatLbl: { fontSize: 10, color: '#AAA', marginTop: 2 },
  chartDivider: { width: 1, backgroundColor: '#EEE', marginHorizontal: 4 },

  /* Fees Banner */
  feesCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: ACCENT_LIGHT, borderRadius: 14,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#F8BBD0',
  },
  feesLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  feesValue: { fontSize: 20, fontWeight: '900', color: ACCENT, marginTop: 2 },

  /* KPI Grid */
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },

  /* Menu rows */
  menuGroup: {
    backgroundColor: '#FFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#EEE', marginBottom: 16, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuTextBlock: { flex: 1 },
  menuRowLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  menuRowSub: { fontSize: 12, color: '#999', marginTop: 2 },

  logoutBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFCDD2',
    borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#D32F2F' },
});
