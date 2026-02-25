import { StyleSheet, ScrollView, TouchableOpacity, View, RefreshControl, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllOrders, getPabiliRequests, quotePabiliRequest, getRiders, assignRiderToOrder } from '../../api/services';
import { Order } from '../../api/types';
import { useSocket } from '@/context/SocketContext';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { socket } = useSocket();

  // Top Level Tab: Regular Orders vs Pabili Requests vs Gov Requests
  const [mainTab, setMainTab] = useState<'Standard' | 'Pabili' | 'Gov'>('Standard');

  // Standard Orders State
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Pabili Requests State
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [customActiveTab, setCustomActiveTab] = useState('Pending Review');

  // Rider Assignment State
  const [riders, setRiders] = useState<any[]>([]);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState<string | null>(null);
  const [assigningRiderId, setAssigningRiderId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await getPabiliRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchOrders(), fetchRequests()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    fetchRequests();
  }, []);

  // Socket listener for new custom requests
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = (newReq: any) => {
        fetchRequests();
    };
    socket.on('new_pabili_request', handleNewRequest);
    return () => {
        socket.off('new_pabili_request', handleNewRequest);
    };
  }, [socket]);

  const onRefresh = () => {
    fetchAll();
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

  const handleOpenAssignRider = async (orderId: string) => {
      setSelectedOrderForRider(orderId);
      setShowRiderModal(true);
      try {
          const fetchedRiders = await getRiders();
          // Filter to only show available riders if you want, or show all
          setRiders(fetchedRiders.filter((r: any) => r.status === 'AVAILABLE'));
      } catch (error) {
          console.error("Error fetching riders", error);
      }
  };

  const handleAssignRiderSubmit = async (riderId: string) => {
      if (!selectedOrderForRider) return;
      setAssigningRiderId(riderId);
      try {
          await assignRiderToOrder(selectedOrderForRider, riderId);
          Alert.alert("Success", "Rider assigned successfully!");
          setShowRiderModal(false);
          setSelectedOrderForRider(null);
          // Refresh both the custom requests and standard orders to reflect the assignment
          fetchAll();
      } catch (error) {
          Alert.alert("Error", "Failed to assign rider.");
      } finally {
          setAssigningRiderId(null);
      }
  };

  const statusTabs = ['All', 'Pending', 'In Progress', 'Delivered', 'Cancelled'];

  // Determine government orders by merchant.type when available.
  // Fallback: some gov requests are represented as items starting with 'Service:' (business permit flow).
  const standardOrders = orders.filter(o => {
    const isGovByType = o.merchant?.type === 'GOVERNMENT';
    const isGovByItems = Array.isArray((o as any).items) && typeof (o as any).items[0] === 'string' && (o as any).items[0].trim().startsWith('Service:');
    return !(isGovByType || isGovByItems);
  });

  const govOrders = orders.filter(o => {
    const isGovByType = o.merchant?.type === 'GOVERNMENT';
    const isGovByItems = Array.isArray((o as any).items) && typeof (o as any).items[0] === 'string' && (o as any).items[0].trim().startsWith('Service:');
    return isGovByType || isGovByItems;
  });

  const filteredOrders = activeTab === 'All' 
    ? standardOrders 
    : standardOrders.filter(o => {
        if (activeTab === 'Pending') return o.status === 'PENDING';
        if (activeTab === 'In Progress') return ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'READY_FOR_PICKUP', 'DELIVERING'].includes(o.status);
        if (activeTab === 'Delivered') return o.status === 'DELIVERED';
        if (activeTab === 'Cancelled') return o.status === 'CANCELLED';
        return true;
      });

  const filteredGovOrders = activeTab === 'All' 
    ? govOrders 
    : govOrders.filter(o => {
        if (activeTab === 'Pending') return o.status === 'PENDING';
        if (activeTab === 'In Progress') return ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'READY_FOR_PICKUP', 'DELIVERING'].includes(o.status);
        if (activeTab === 'Delivered') return o.status === 'DELIVERED';
        if (activeTab === 'Cancelled') return o.status === 'CANCELLED';
        return true;
      });

  const customStatusTabs = ['All', 'Pending Review', 'Quoted', 'Placed', 'Preparing', 'In Delivery', 'Delivered'];

  // Split requests into Pabili vs Government
  // Government requests are submitted as structured form lines, starting with "Service: ..."
  const isGovRequest = (r: any) =>
    Array.isArray(r?.items) &&
    typeof r.items[0] === 'string' &&
    r.items[0].trim().startsWith('Service:');

  const govRequests = requests.filter(isGovRequest);
  const pabiliRequestsOnly = requests.filter((r: any) => !isGovRequest(r));

  const renderStandardOrders = (ordersToRender: Order[]) => {
    if (loadingOrders) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#C2185B" />
        </View>
      );
    }

    return (
      <>
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {statusTabs.map((tab) => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {ordersToRender.length === 0 ? (
             <View style={{alignItems: 'center', marginTop: 50}}>
                <ThemedText style={{color: '#888', fontStyle: 'italic'}}>No orders found</ThemedText>
             </View>
          ) : (
            ordersToRender.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => router.push(`/order-details/${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdBlock}>
                    <ThemedText style={styles.orderId} numberOfLines={1}>
                      #{order.orderNumber || order.id.slice(0, 6).toUpperCase()}
                    </ThemedText>
                    <ThemedText style={styles.orderTime}>
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: order.status === 'DELIVERED' ? '#E8F5E9' : 
                                   order.status === 'CANCELLED' ? '#FFEBEE' : '#FFF3E0' 
                  }]}>
                    <ThemedText style={[styles.statusText, { 
                      color: order.status === 'DELIVERED' ? '#388E3C' : 
                             order.status === 'CANCELLED' ? '#D32F2F' : '#F57C00' 
                    }]}>
                      {order.status}
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.orderDetails}>
                  <ThemedText style={styles.customerName}>{order.customer?.name || 'Guest'}</ThemedText>
                  <ThemedText style={styles.restaurantName}>{order.merchant?.name || 'Access Denied'}</ThemedText>
                  {(() => {
                    const firstOptions = (order as any)?.items?.find((it: any) => it?.options)?.options;
                    if (firstOptions) {
                      return (
                        <ThemedText style={{fontSize: 12, color: '#666'}}>Permit: {firstOptions.companyName || 'Business Permit'}</ThemedText>
                      );
                    }
                    return null;
                  })()}
                </View>
                
                <View style={styles.orderFooter}>
                  <ThemedText style={styles.orderTotal}>₱{order.totalAmount?.toLocaleString()}</ThemedText>
                  <IconSymbol size={16} name="chevron.right" color="#CCC" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </>
    );
  };

  const renderCustomRequests = (source: any[]) => {
    if (loadingRequests) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#C2185B" />
        </View>
      );
    }

    return (
      <>
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {customStatusTabs.map((tab) => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setCustomActiveTab(tab)}
                style={[styles.tab, customActiveTab === tab && styles.activeTab]}
              >
                <ThemedText style={[styles.tabText, customActiveTab === tab && styles.activeTabText]}>{tab}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { marginTop: 10 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {(
            customActiveTab === 'All'
              ? source
              : source.filter((r: any) => {
                  if (customActiveTab === 'Pending Review') return r.status === 'PENDING_REVIEW';
                  if (customActiveTab === 'Quoted') return r.status === 'QUOTED';
                  if (customActiveTab === 'Placed') return r.status === 'ACCEPTED' && (!r.order || r.order.status === 'PENDING');
                  if (customActiveTab === 'Preparing') return r.status === 'ACCEPTED' && r.order?.status === 'PREPARING';
                  if (customActiveTab === 'In Delivery') return r.status === 'ACCEPTED' && ['READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING'].includes(r.order?.status || '');
                  if (customActiveTab === 'Delivered') return r.status === 'COMPLETED' || r.order?.status === 'DELIVERED';
                  return true;
                })
          ).length === 0 ? (
             <View style={{alignItems: 'center', marginTop: 50}}>
                <ThemedText style={{color: '#888', fontStyle: 'italic'}}>No requests found</ThemedText>
             </View>
          ) : (
            (
              customActiveTab === 'All'
                ? source
                : source.filter((r: any) => {
                    if (customActiveTab === 'Pending Review') return r.status === 'PENDING_REVIEW';
                    if (customActiveTab === 'Quoted') return r.status === 'QUOTED';
                    if (customActiveTab === 'Placed') return r.status === 'ACCEPTED' && (!r.order || r.order.status === 'PENDING');
                    if (customActiveTab === 'Preparing') return r.status === 'ACCEPTED' && r.order?.status === 'PREPARING';
                    if (customActiveTab === 'In Delivery') return r.status === 'ACCEPTED' && ['READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING'].includes(r.order?.status || '');
                    if (customActiveTab === 'Delivered') return r.status === 'COMPLETED' || r.order?.status === 'DELIVERED';
                    return true;
                  })
            ).map((req: any) => {
              const statusColor = req.status === 'PENDING_REVIEW' ? '#F57C00' :
                                  req.status === 'QUOTED' ? '#1976D2' : 
                                  req.status === 'ACCEPTED' ? '#388E3C' : '#888';

              const statusBg = req.status === 'PENDING_REVIEW' ? '#FFF3E0' :
                               req.status === 'QUOTED' ? '#E3F2FD' : 
                               req.status === 'ACCEPTED' ? '#E8F5E9' : '#EEE';

              return (
                <ThemedView key={req.id} style={styles.reqCard}>
                  <View style={styles.reqCardHeader}>
                    <View style={styles.reqCustomerInfoBlock}>
                        <ThemedText style={styles.reqCustomerName}>
                           {req.customer?.firstName} {req.customer?.lastName}
                        </ThemedText>
                        <ThemedText style={styles.reqContactDetails}>{req.customer?.user?.phone}</ThemedText>
                    </View>
                    <View style={[styles.reqBadge, { backgroundColor: statusBg }]}>
                        <ThemedText style={[styles.reqBadgeText, { color: statusColor }]}>{req.status.replace('_', ' ')}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.reqItemsBlock}>
                      <ThemedText style={styles.reqItemsTitle}>Shopping List:</ThemedText>
                      {(Array.isArray(req.items) ? req.items : []).map((itemStr: string, idx: number) => (
                           <ThemedText key={idx} style={styles.reqItemText}>• {itemStr}</ThemedText>
                      ))}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.reqFooterRow}>
                      <View>
                          <ThemedText style={{fontSize: 12, color: '#888'}}>Est. Cost</ThemedText>
                          <ThemedText style={styles.reqEstCost}>₱{req.estimatedItemCost?.toLocaleString()}</ThemedText>
                      </View>

                      {req.status === 'PENDING_REVIEW' && (
                          <TouchableOpacity 
                             style={styles.reqQuoteButton} 
                             onPress={() => setSelectedRequest(req)}
                          >
                             <ThemedText style={styles.reqQuoteButtonText}>Provide Quote</ThemedText>
                          </TouchableOpacity>
                      )}

                      {req.status !== 'PENDING_REVIEW' && req.serviceFee !== null && (
                          <View style={{alignItems: 'flex-end'}}>
                             <ThemedText style={{fontSize: 12, color: '#888'}}>Service Fee</ThemedText>
                             <ThemedText style={{fontSize: 16, fontWeight: 'bold', color: '#C2185B'}}>₱{req.serviceFee?.toLocaleString()}</ThemedText>
                          </View>
                      )}

                      {req.status === 'ACCEPTED' && (!req.order || req.order.status === 'PENDING') && (
                          <TouchableOpacity 
                             style={[styles.reqQuoteButton, { backgroundColor: '#4CAF50' }]} 
                             onPress={() => {
                                 if (req.order?.id) {
                                     handleOpenAssignRider(req.order.id);
                                 } else {
                                     Alert.alert('Error', 'No actual order found yet. The customer might still be paying.');
                                 }
                             }}
                          >
                             <ThemedText style={styles.reqQuoteButtonText}>Assign Rider</ThemedText>
                          </TouchableOpacity>
                      )}

                      {req.order?.status === 'PREPARING' && (
                          <View style={{alignItems: 'flex-end', justifyContent: 'center'}}>
                              <ThemedText style={{fontSize: 12, color: '#F57C00', fontWeight: 'bold'}}>Rider is Shopping</ThemedText>
                          </View>
                      )}
                      
                      {req.order?.status === 'DELIVERING' && (
                          <View style={{alignItems: 'flex-end', justifyContent: 'center'}}>
                              <ThemedText style={{fontSize: 12, color: '#1976D2', fontWeight: 'bold'}}>Out for Delivery</ThemedText>
                          </View>
                      )}

                      {(req.order?.status === 'DELIVERED' || req.status === 'COMPLETED') && (
                          <View style={{alignItems: 'flex-end', justifyContent: 'center'}}>
                              <ThemedText style={{fontSize: 12, color: '#388E3C', fontWeight: 'bold'}}>Request Completed</ThemedText>
                          </View>
                      )}
                  </View>

                </ThemedView>
            )})
          )}
        </ScrollView>

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

        {/* Assign Rider Modal */}
        <Modal visible={showRiderModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                        <ThemedText style={styles.modalTitle}>Select a Rider</ThemedText>
                        <TouchableOpacity onPress={() => setShowRiderModal(false)}>
                            <ThemedText style={{ color: '#999', fontWeight: 'bold' }}>Close</ThemedText>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {riders.length === 0 ? (
                            <ThemedText style={{color: '#888', textAlign: 'center', marginVertical: 20}}>No available riders found.</ThemedText>
                        ) : (
                            riders.map(rider => (
                                <TouchableOpacity 
                                    key={rider.id}
                                    style={{
                                        flexDirection: 'row', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: 12,
                                        borderWidth: 1,
                                        borderColor: '#EEE',
                                        borderRadius: 8,
                                        marginBottom: 8
                                    }}
                                    onPress={() => handleAssignRiderSubmit(rider.id)}
                                    disabled={!!assigningRiderId}
                                >
                                    <View>
                                        <ThemedText style={{fontSize: 16, fontWeight: 'bold'}}>{rider.user?.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || 'Unknown Rider'}</ThemedText>
                                        <ThemedText style={{fontSize: 12, color: '#666'}}>{rider.vehicleType} • {rider.plateNumber}</ThemedText>
                                    </View>
                                    {assigningRiderId === rider.id ? (
                                        <ActivityIndicator size="small" color="#C2185B" />
                                    ) : (
                                        <View style={{backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12}}>
                                            <ThemedText style={{fontSize: 12, color: '#388E3C', fontWeight: 'bold'}}>Assign</ThemedText>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.titleRow, { marginTop: insets.top + 16 }]}>
        <ThemedText style={styles.screenTitle}>Track Orders</ThemedText>
      </View>

      <View style={styles.mainTabContainer}>
         <TouchableOpacity 
            style={[styles.mainTabBtn, mainTab === 'Standard' && styles.mainTabBtnActive]} 
            onPress={() => setMainTab('Standard')}
         >
            <ThemedText style={[styles.mainTabBtnText, mainTab === 'Standard' && styles.mainTabBtnTextActive]}>Regular</ThemedText>
         </TouchableOpacity>
         <TouchableOpacity 
            style={[styles.mainTabBtn, mainTab === 'Pabili' && styles.mainTabBtnActive]} 
            onPress={() => setMainTab('Pabili')}
         >
            <ThemedText style={[styles.mainTabBtnText, mainTab === 'Pabili' && styles.mainTabBtnTextActive]}>Pabili</ThemedText>
         </TouchableOpacity>
         <TouchableOpacity 
            style={[styles.mainTabBtn, mainTab === 'Gov' && styles.mainTabBtnActive]} 
            onPress={() => setMainTab('Gov')}
         >
            <ThemedText style={[styles.mainTabBtnText, mainTab === 'Gov' && styles.mainTabBtnTextActive]}>Government</ThemedText>
         </TouchableOpacity>
      </View>

      {mainTab === 'Standard' && renderStandardOrders(filteredOrders)}
      {mainTab === 'Pabili' && renderCustomRequests(pabiliRequestsOnly)}
      {mainTab === 'Gov' && renderStandardOrders(filteredGovOrders)}
      
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
  },
  mainTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  mainTabBtnActive: {
    backgroundColor: '#C2185B',
  },
  mainTabBtnText: {
    fontWeight: '700',
    color: '#888',
  },
  mainTabBtnTextActive: {
    color: '#FFF',
  },
  tabContainer: {
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  tabScroll: {
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  activeTab: {
    backgroundColor: '#C2185B',
    borderColor: '#C2185B',
    borderBottomWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  orderIdBlock: {
    flex: 1,
    minWidth: 0,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
  },
  orderTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 12,
  },
  orderDetails: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 12,
    color: '#888',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C2185B',
  },

  // Custom Requests Styles
  reqCard: {
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
  reqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reqCustomerInfoBlock: {
    flex: 1,
  },
  reqCustomerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  reqContactDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  reqBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reqBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  reqItemsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  reqItemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
  },
  reqItemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reqFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  reqEstCost: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
    marginTop: 2,
  },
  reqQuoteButton: {
    backgroundColor: '#C2185B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reqQuoteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Modal Styles
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
