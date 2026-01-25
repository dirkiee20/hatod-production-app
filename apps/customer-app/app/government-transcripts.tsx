import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function GovernmentTranscriptsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Active' | 'History'>('Active');

  const activeRequests = [
    {
       id: 'DOC-9921',
       agency: 'PSA - Birth Certificate',
       status: 'Processing',
       recipient: 'Juan Dela Cruz',
       fee: 365,
       date: 'Filed Today, 9:00 AM',
       icon: 'government'
    },
    {
       id: 'DOC-9925',
       agency: 'NBI Clearance',
       status: 'Rider is on the way to PSA',
       recipient: 'Juan Dela Cruz',
       fee: 150,
       date: 'Filed Jan 24, 2:00 PM',
       icon: 'government'
    }
  ];

  const historyRequests = [
    {
       id: 'DOC-8800',
       agency: 'Barangay Clearance',
       status: 'Delivered',
       recipient: 'Juan Dela Cruz',
       fee: 120,
       date: 'Jan 15, 10:30 AM',
       icon: 'government'
    },
    {
       id: 'DOC-7500',
       agency: 'PSA - Marriage Certificate',
       status: 'Completed',
       recipient: 'Maria Dela Cruz',
       fee: 365,
       date: 'Dec 12, 2024',
       icon: 'government'
    }
  ];

  const renderRequestCard = (request: any, isHistory: boolean) => (
    <TouchableOpacity key={request.id} style={styles.card} onPress={() => {}}>
        <View style={styles.cardHeader}>
            <View style={styles.agencyRow}>
                <View style={styles.iconBox}>
                    <IconSymbol size={22} name={request.icon} color="#009688" />
                </View>
                <View>
                    <ThemedText style={styles.agencyName}>{request.agency}</ThemedText>
                    <ThemedText style={styles.refText}>Ref: {request.id}</ThemedText>
                </View>
            </View>
            <View style={[styles.statusBadge, 
                request.status === 'Delivered' || request.status === 'Completed' ? styles.statusSuccess : 
                styles.statusInfo
            ]}>
                <ThemedText style={[styles.statusText,
                     request.status === 'Delivered' || request.status === 'Completed' ? styles.statusTextSuccess : 
                     styles.statusTextInfo
                ]}>{request.status}</ThemedText>
            </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Recipient:</ThemedText>
                <ThemedText style={styles.detailValue}>{request.recipient}</ThemedText>
            </View>
            <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Total Fee:</ThemedText>
                <ThemedText style={styles.detailValue}>₱{request.fee}</ThemedText>
            </View>
            <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Date:</ThemedText>
                <ThemedText style={styles.detailValue}>{request.date}</ThemedText>
            </View>
        </View>

        {!isHistory && (
            <View style={styles.cardFooter}>
                 <TouchableOpacity style={styles.trackBtn} onPress={() => router.push('/order-tracking')}>
                    <ThemedText style={styles.trackText}>Track Application</ThemedText>
                </TouchableOpacity>
            </View>
        )}
        
        {isHistory && (
             <View style={styles.cardFooter}>
                 <TouchableOpacity style={styles.viewBtn}>
                    <ThemedText style={styles.viewText}>View Receipt</ThemedText>
                </TouchableOpacity>
            </View>
        )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
       <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Government Transcripts',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'Active' && styles.activeTab]} 
            onPress={() => setActiveTab('Active')}
        >
            <ThemedText style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'History' && styles.activeTab]} 
            onPress={() => setActiveTab('History')}
        >
            <ThemedText style={[styles.tabText, activeTab === 'History' && styles.activeTabText]}>History</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
         {activeTab === 'Active' ? (
            activeRequests.length > 0 ? (
                activeRequests.map(req => renderRequestCard(req, false))
            ) : (
                <View style={styles.emptyState}>
                    <IconSymbol size={48} name="government" color="#DDD" />
                    <ThemedText style={styles.emptyText}>No active requests</ThemedText>
                </View>
            )
         ) : (
            historyRequests.map(req => renderRequestCard(req, true))
         )}
      </ScrollView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#009688', // Teal/Formal color for gov
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
  viewBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
