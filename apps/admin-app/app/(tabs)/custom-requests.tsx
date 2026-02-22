import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, RefreshControl, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSocket } from '@/context/SocketContext';
import { getPabiliRequests, quotePabiliRequest } from '../../api/services';

export default function CustomRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { socket } = useSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await getPabiliRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Set up socket listener for live updates
  useEffect(() => {
    if (!socket) return;
    
    // When a new pabili request comes in, append to top or refresh
    const handleNewRequest = (newReq: any) => {
        // Just refresh the whole list to ensure correct statuses etc.
        fetchRequests();
    };

    socket.on('new_pabili_request', handleNewRequest);
    return () => {
        socket.off('new_pabili_request', handleNewRequest);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleQuoteSubmit = async () => {
      const fee = parseFloat(quoteAmount);
      if (isNaN(fee) || fee <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid service fee.');
          return;
      }

      setSubmittingQuote(true);
      try {
          await quotePabiliRequest(selectedRequest.id, fee);
          Alert.alert('Success', 'Quote has been sent to the customer!');
          setSelectedRequest(null);
          setQuoteAmount('');
          fetchRequests();
      } catch (error) {
          Alert.alert('Error', 'Failed to submit quote.');
      } finally {
          setSubmittingQuote(false);
      }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.titleRow, { marginTop: insets.top + 16 }]}>
        <ThemedText style={styles.screenTitle}>Custom Requests</ThemedText>
        <ThemedText style={{color: '#888'}}>We Buy For You requests from customers</ThemedText>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#C2185B" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {requests.length === 0 ? (
             <View style={{alignItems: 'center', marginTop: 50}}>
                <ThemedText style={{color: '#888', fontStyle: 'italic'}}>No requests found</ThemedText>
             </View>
          ) : (
            requests.map((req) => {
              const statusColor = req.status === 'PENDING_REVIEW' ? '#F57C00' :
                                  req.status === 'QUOTED' ? '#1976D2' : 
                                  req.status === 'ACCEPTED' ? '#388E3C' : '#888';

              const statusBg = req.status === 'PENDING_REVIEW' ? '#FFF3E0' :
                               req.status === 'QUOTED' ? '#E3F2FD' : 
                               req.status === 'ACCEPTED' ? '#E8F5E9' : '#EEE';

              return (
                <ThemedView key={req.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.customerInfoBlock}>
                        <ThemedText style={styles.customerName}>
                           {req.customer?.firstName} {req.customer?.lastName}
                        </ThemedText>
                        <ThemedText style={styles.contactDetails}>{req.customer?.user?.phone}</ThemedText>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusBg }]}>
                        <ThemedText style={[styles.badgeText, { color: statusColor }]}>{req.status.replace('_', ' ')}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.itemsBlock}>
                      <ThemedText style={styles.itemsTitle}>Shopping List:</ThemedText>
                      {(Array.isArray(req.items) ? req.items : []).map((itemStr: string, idx: number) => (
                           <ThemedText key={idx} style={styles.itemText}>• {itemStr}</ThemedText>
                      ))}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.footerRow}>
                      <View>
                          <ThemedText style={{fontSize: 12, color: '#888'}}>Est. Cost given by Customer</ThemedText>
                          <ThemedText style={styles.estCost}>₱{req.estimatedItemCost?.toLocaleString()}</ThemedText>
                      </View>

                      {req.status === 'PENDING_REVIEW' && (
                          <TouchableOpacity 
                             style={styles.quoteButton} 
                             onPress={() => setSelectedRequest(req)}
                          >
                             <ThemedText style={styles.quoteButtonText}>Provide Quote</ThemedText>
                          </TouchableOpacity>
                      )}

                      {req.status !== 'PENDING_REVIEW' && req.serviceFee !== null && (
                          <View style={{alignItems: 'flex-end'}}>
                             <ThemedText style={{fontSize: 12, color: '#888'}}>Service Fee</ThemedText>
                             <ThemedText style={{fontSize: 16, fontWeight: 'bold', color: '#C2185B'}}>₱{req.serviceFee?.toLocaleString()}</ThemedText>
                          </View>
                      )}
                  </View>

                </ThemedView>
            )})
          )}
        </ScrollView>
      )}

      {/* Quote Dialog Modal */}
      <Modal visible={!!selectedRequest} transparent animationType="fade">
          <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                <ThemedText style={styles.modalTitle}>Set Service Fee</ThemedText>
                <ThemedText style={styles.modalSubtitle}>How much to charge for shopping logic & delivery?</ThemedText>
                
                <View style={styles.feeInputContainer}>
                     <ThemedText style={styles.currencySymbol}>₱</ThemedText>
                     <TextInput 
                         style={styles.feeInput}
                         keyboardType="numeric"
                         placeholder="0.00"
                         value={quoteAmount}
                         onChangeText={setQuoteAmount}
                         autoFocus
                     />
                </View>

                <View style={styles.modalActions}>
                     <TouchableOpacity style={styles.modalCancel} onPress={() => { setSelectedRequest(null); setQuoteAmount(''); }} disabled={submittingQuote}>
                         <ThemedText style={{color: '#888', fontWeight: '600'}}>Cancel</ThemedText>
                     </TouchableOpacity>
                     
                     <TouchableOpacity style={styles.modalSubmit} onPress={handleQuoteSubmit} disabled={submittingQuote}>
                         {submittingQuote ? <ActivityIndicator size="small" color="#FFF" /> : <ThemedText style={{color: '#FFF', fontWeight: 'bold'}}>Send Quote</ThemedText>}
                     </TouchableOpacity>
                </View>
             </View>
          </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfoBlock: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  contactDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 15,
  },
  itemsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  estCost: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
    marginTop: 2,
  },
  quoteButton: {
    backgroundColor: '#C2185B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quoteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  feeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  feeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  modalSubmit: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#C2185B',
  }
});
