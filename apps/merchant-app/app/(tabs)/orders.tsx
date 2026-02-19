import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Alert, RefreshControl, Modal, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback, useEffect } from 'react';
import { getMerchantOrders, updateOrderStatus, getAvailableRiders, assignRider } from '@/api/services';
import { Order, OrderStatus } from '@/api/types';
import { useSocket } from '@/context/SocketContext';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('New');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingRiders, setLoadingRiders] = useState(false);

  const statusTabs = ['New', 'Processing', 'Ready', 'Completed'];

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (newOrder: Order) => {
        setOrders(prev => [newOrder, ...prev]);
        // Also maybe play a sound in future
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:updated', handleOrderUpdated);

    return () => {
        socket.off('order:created', handleOrderCreated);
        socket.off('order:updated', handleOrderUpdated);
    };
  }, [socket]);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getMerchantOrders();
    setOrders(data || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await getMerchantOrders();
    setOrders(data || []);
    setRefreshing(false);
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
        const status = order.status;
        if (activeTab === 'New') return status === OrderStatus.PENDING || status === OrderStatus.CONFIRMED;
        if (activeTab === 'Processing') return status === OrderStatus.PREPARING;
        if (activeTab === 'Ready') return status === OrderStatus.READY_FOR_PICKUP;
        if (activeTab === 'Completed') return [
            OrderStatus.PICKED_UP, 
            OrderStatus.DELIVERING, 
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED // Optional: maybe hidden or separate tab
        ].includes(status);
        return false;
    });
  };



  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());

  const toggleProcessing = (orderId: string, isProcessing: boolean) => {
      setProcessingOrders(prev => {
          const next = new Set(prev);
          if (isProcessing) next.add(orderId);
          else next.delete(orderId);
          return next;
      });
  };

  const handleAction = async (order: Order) => {
    let nextStatus: OrderStatus | null = null;
    let actionName = '';
    let confirmTitle = '';
    let confirmMessage = '';
    let needsConfirm = false;

    if (order.status === OrderStatus.PENDING) {
        nextStatus = OrderStatus.CONFIRMED;
        actionName = 'Confirm';
        confirmTitle = 'Confirm Order';
        confirmMessage = `Confirm order #${order.orderNumber || order.id.slice(0,8)}? The customer will be notified.`;
        needsConfirm = true;
    } else if (order.status === OrderStatus.CONFIRMED) {
        nextStatus = OrderStatus.PREPARING;
        actionName = 'Start Preparing';
        // No confirmation needed for routine action
    } else if (order.status === OrderStatus.PREPARING) {
        nextStatus = OrderStatus.READY_FOR_PICKUP;
        actionName = 'Mark Ready';
        confirmTitle = 'Mark as Ready?';
        confirmMessage = `Mark order #${order.orderNumber || order.id.slice(0,8)} as ready for pickup?`;
        needsConfirm = true;
    }

    const executeAction = async () => {
      toggleProcessing(order.id, true);
      try {
          if (nextStatus) {
              const success = await updateOrderStatus(order.id, nextStatus);
              if (success) {
                  fetchOrders();
              } else {
                  Alert.alert('Error', `Failed to ${actionName.toLowerCase()} order.`);
              }
          } else if (order.status === OrderStatus.READY_FOR_PICKUP && !order.riderId) {
              await openAssignModal(order);
          }
      } catch (error) {
          console.error('Action failed:', error);
          Alert.alert('Error', 'An unexpected error occurred');
      } finally {
          toggleProcessing(order.id, false);
      }
    };

    if (needsConfirm) {
      Alert.alert(
        confirmTitle,
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: actionName, style: 'default', onPress: executeAction },
        ]
      );
    } else {
      await executeAction();
    }
  };

  const openAssignModal = async (order: Order) => {
      setSelectedOrder(order);
      setModalVisible(true);
      setLoadingRiders(true);
      const riders = await getAvailableRiders();
      setAvailableRiders(riders);
      setLoadingRiders(false);
  };

  const confirmAssignment = async (riderId: string) => {
      if (!selectedOrder) return;
      try {
          await assignRider(selectedOrder.id, riderId);
          setModalVisible(false);
          Alert.alert('Success', 'Rider assigned successfully');
          fetchOrders();
      } catch (e: any) {
          Alert.alert('Assignment Failed', e.message);
          if (e.message && e.message.includes('available')) {
             const riders = await getAvailableRiders();
             setAvailableRiders(riders);
          }
      }
  };

  const getActionButtonText = (status: OrderStatus, hasRider: boolean) => {
      if (status === OrderStatus.PENDING) return 'Confirm';
      if (status === OrderStatus.CONFIRMED) return 'Prepare';
      if (status === OrderStatus.PREPARING) return 'Ready';
      if (status === OrderStatus.READY_FOR_PICKUP && !hasRider) return 'Assign Rider';
      return null;
  };

  const filteredOrders = getFilteredOrders();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.headerTitle}>Orders Management</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Manage incoming and active orders</ThemedText>
      </ThemedView>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {statusTabs.map((tab) => {
                // Calculate count for this tab
                const count = orders.filter(o => {
                    if (tab === 'New') return o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED;
                    if (tab === 'Processing') return o.status === OrderStatus.PREPARING;
                    if (tab === 'Ready') return o.status === OrderStatus.READY_FOR_PICKUP;
                    return false; // Don't badge completed
                }).length;

                return (
                <TouchableOpacity 
                    key={tab} 
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                >
                    <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</ThemedText>
                    {count > 0 && <View style={styles.badge}><ThemedText style={styles.badgeText}>{count}</ThemedText></View>}
                </TouchableOpacity>
                );
            })}
        </ScrollView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5c6cc9']} />
        }
      >
        {loading && !refreshing ? (
             <ActivityIndicator size="large" color="#f78734" style={{ marginTop: 20 }} />
        ) : filteredOrders.length === 0 ? (
             <View style={{ padding: 20, alignItems: 'center', marginTop: 50 }}>
                 <IconSymbol size={48} name="orders" color="#DDD" />
                 <ThemedText style={{ color: '#999', marginTop: 10, fontSize: 16 }}>No orders found</ThemedText>
                 <ThemedText style={{ color: '#CCC', fontSize: 12 }}>Pull down to refresh</ThemedText>
             </View>
        ) : (
            filteredOrders.map((order) => {
             const actionText = getActionButtonText(order.status, !!order.riderId);
             const isProcessing = processingOrders.has(order.id);
             
             return (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => router.push(`/order-details/${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <ThemedText style={styles.orderId}>#{order.orderNumber || order.id.slice(0,8)}</ThemedText>
                  <ThemedText style={styles.orderTime}>{new Date(order.createdAt).toLocaleTimeString()}</ThemedText>
                </View>
                
                <View style={styles.customerRow}>
                   <IconSymbol size={16} name="person" color="#888" />
                   <ThemedText style={styles.customerName}>
                       {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest Customer'}
                   </ThemedText>
                </View>
    
                <View style={styles.summaryRow}>
                   <ThemedText style={styles.itemsCount}>
                       {order.items?.length || 0} items • ₱{order.total}
                   </ThemedText>
                   <View style={styles.actionRow}>
                     <TouchableOpacity 
                        style={styles.detailsBtn}
                        onPress={() => router.push(`/order-details/${order.id}`)}
                     >
                        <ThemedText style={styles.detailsBtnText}>View Details</ThemedText>
                     </TouchableOpacity>
                     
                     {actionText && (
                        <TouchableOpacity 
                            style={[styles.actionBtn, isProcessing && { opacity: 0.8 }]}
                            onPress={() => handleAction(order)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <ThemedText style={styles.actionBtnText}>{actionText}</ThemedText>
                            )}
                        </TouchableOpacity>
                     )}
                   </View>
                </View>
              </TouchableOpacity>
            )})
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <ThemedText style={styles.modalTitle}>Select Rider</ThemedText>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <IconSymbol size={24} name="xmark.circle.fill" color="#888" />
                    </TouchableOpacity>
                </View>
                
                {loadingRiders ? (
                    <ActivityIndicator size="large" color="#f78734" style={{ marginVertical: 20 }} />
                ) : availableRiders.length === 0 ? (
                    <View style={styles.emptyModalState}>
                        <ThemedText style={{ color: '#888' }}>No available riders found.</ThemedText>
                        <TouchableOpacity onPress={() => openAssignModal(selectedOrder!)} style={{ marginTop: 10 }}>
                            <ThemedText style={{ color: '#5c6cc9' }}>Refresh</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={availableRiders}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.riderRow} onPress={() => confirmAssignment(item.id)}>
                                <View style={styles.riderAvatar}>
                                    <IconSymbol size={20} name="person" color="#555" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <ThemedText style={styles.riderName}>{item.firstName} {item.lastName}</ThemedText>
                                    <ThemedText style={styles.riderSub}>
                                        {item.vehicleType || 'Motorcycle'} • {item.vehicleNumber || 'No Plate'} • {item.rating || '5.0'}★
                                    </ThemedText>
                                </View>
                                <TouchableOpacity style={styles.assignRowBtn} onPress={() => confirmAssignment(item.id)}>
                                    <ThemedText style={styles.assignRowText}>Assign</ThemedText>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: 400 }}
                    />
                )}
            </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#5c6cc9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tabContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    height: 50,
  },
  tab: {
    paddingHorizontal: 20,
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#5c6cc9',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  activeTabText: {
    color: '#5c6cc9',
  },
  badge: {
    backgroundColor: '#f78734',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
  },
  orderTime: {
    fontSize: 11,
    color: '#888',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemsCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  detailsBtnText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#f78734',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  emptyModalState: {
    alignItems: 'center',
    padding: 20,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  riderSub: {
    fontSize: 12,
    color: '#888',
  },
  assignRowBtn: {
    backgroundColor: '#f78734',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  assignRowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  }
});
