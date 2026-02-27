import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect, useCallback } from 'react';
import { getMyOrders } from '@/api/services';
import { Order, OrderStatus } from '@/api/types';

// Human-readable label for each backend order status
const STATUS_LABELS: Record<string, string> = {
  PENDING:          'Pending Review',
  CONFIRMED:        'Accepted',
  PREPARING:        'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  PICKED_UP:        'Picked Up',
  DELIVERING:       'On the Way',
  DELIVERED:        'Completed',
  CANCELLED:        'Cancelled',
};

// Statuses considered "active" (still in progress)
const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERING,
];

const HISTORY_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

function isCompleted(status: OrderStatus) {
  return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
}

export default function GovernmentTranscriptsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Active' | 'History'>('Active');
  const [loading, setLoading] = useState(true);
  const [govOrders, setGovOrders] = useState<Order[]>([]);

  const fetchGovOrders = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getMyOrders();
      // Filter to only orders placed with the GOVERNMENT merchant
      const gov = all.filter((o) => o.merchant?.type === 'GOVERNMENT');
      setGovOrders(gov);
    } catch (err) {
      console.error('Failed to fetch gov orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGovOrders();
  }, [fetchGovOrders]);

  const activeOrders = govOrders.filter((o) =>
    ACTIVE_STATUSES.includes(o.status as OrderStatus)
  );
  const historyOrders = govOrders.filter((o) =>
    HISTORY_STATUSES.includes(o.status as OrderStatus)
  );

  const displayList = activeTab === 'Active' ? activeOrders : historyOrders;

  const renderRequestCard = (order: Order) => {
    const isHistory = isCompleted(order.status as OrderStatus);
    const statusLabel = STATUS_LABELS[order.status] ?? order.status;
    const serviceName =
      order.items?.[0]?.menuItem?.name ?? 'Government Service';
    const shortId = order.id.substring(0, 8).toUpperCase();
    const date = new Date(order.createdAt).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const total = order.total ?? 0;

    return (
      <TouchableOpacity key={order.id} style={styles.card} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={styles.agencyRow}>
            <View style={styles.iconBox}>
              <IconSymbol size={22} name="building.2.fill" color="#009688" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.agencyName} numberOfLines={1}>
                {serviceName}
              </ThemedText>
              <ThemedText style={styles.refText}>Ref: {shortId}</ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              isHistory ? styles.statusSuccess : styles.statusInfo,
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                isHistory ? styles.statusTextSuccess : styles.statusTextInfo,
              ]}
            >
              {statusLabel}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Total Fee:</ThemedText>
            <ThemedText style={styles.detailValue}>₱{total.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date Filed:</ThemedText>
            <ThemedText style={styles.detailValue}>{date}</ThemedText>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {!isHistory ? (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() =>
                router.push({ pathname: '/order-tracking', params: { id: order.id } })
              }
            >
              <ThemedText style={styles.trackText}>Track Application</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={[styles.trackBtn, { backgroundColor: '#F5F5F5' }]}>
              <ThemedText style={[styles.trackText, { color: '#666' }]}>
                {order.status === OrderStatus.CANCELLED ? 'Cancelled' : 'Completed'}
              </ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Government Transcripts',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol
                size={20}
                name="chevron.right"
                color="#000"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}
        >
          <ThemedText
            style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}
          >
            Active{activeOrders.length > 0 ? ` (${activeOrders.length})` : ''}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'History' && styles.activeTab]}
          onPress={() => setActiveTab('History')}
        >
          <ThemedText
            style={[styles.tabText, activeTab === 'History' && styles.activeTabText]}
          >
            History
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#009688" />
          <ThemedText style={styles.loadingText}>Loading your applications…</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {displayList.length > 0 ? (
            displayList.map((order) => renderRequestCard(order))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="building.2.fill" color="#DDD" />
              <ThemedText style={styles.emptyText}>
                {activeTab === 'Active'
                  ? 'No active government applications'
                  : 'No past government applications'}
              </ThemedText>
              <ThemedText style={styles.emptySubText}>
                Applications you submit via Government Services will appear here.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#009688',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  agencyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  refText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusInfo: { backgroundColor: '#E0F7FA' },
  statusSuccess: { backgroundColor: '#E8F5E9' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextInfo: { color: '#006064' },
  statusTextSuccess: { color: '#388E3C' },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 4,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#777',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  trackBtn: {
    backgroundColor: '#009688',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#777',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubText: {
    color: '#AAA',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
