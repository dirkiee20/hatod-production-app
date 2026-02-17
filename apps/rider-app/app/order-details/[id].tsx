import { StyleSheet, ScrollView, TouchableOpacity, View, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrderDetails, updateOrderStatus, claimOrder } from '@/api/rider-service';
import Mapbox from '@rnmapbox/maps';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { getRoute } from '@/services/map';

const formatVariant = (note: string) => {
  if (!note) return '';
  try {
    const parsed = JSON.parse(note);
    if (typeof parsed === 'object' && parsed !== null) {
       return Object.entries(parsed).map(([key, val]) => `${key}: ${val}`).join(', ');
    }
    return note;
  } catch (e) {
    return note; 
  }
};

const getCorrectedCoordinate = (lat: number, lng: number): [number, number] => {
  if (!lat || !lng) return [120.9850, 14.6010]; 
  if (Math.abs(lat) > 90) {
      return [lat, lng]; 
  }
  return [lng, lat];
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const { location } = useLocationTracker(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  useEffect(() => {
      if (!order || !location) return;

      const fetchRoute = async () => {
          const riderLoc: [number, number] = [location.coords.longitude, location.coords.latitude];
          let endLoc: [number, number] | null = null;

          if (order.status === 'READY_FOR_PICKUP' || order.status === 'PREPARING') {
              // Target: Merchant
              if (order.merchant?.longitude) {
                  endLoc = [order.merchant.longitude, order.merchant.latitude];
              }
          } else if (order.status === 'PICKED_UP' || order.status === 'DELIVERING') {
              // Target: Customer
              if (order.address?.longitude) {
                  endLoc = [order.address.longitude, order.address.latitude];
              }
          }

          if (endLoc && endLoc[0] && endLoc[1]) {
               const route = await getRoute(riderLoc, endLoc);
               if (route) setRouteGeoJSON(route);
          }
      };
      
      fetchRoute();
  }, [order, location]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await getOrderDetails(Array.isArray(id) ? id[0] : id);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setLoading(true);
      const orderId = Array.isArray(id) ? id[0] : id;
      if (status === 'CLAIM') {
          await claimOrder(orderId);
          Alert.alert('Success', 'Order accepted! Please proceed to the merchant.');
      } else {
          await updateOrderStatus(orderId, status);
      }
      
      await fetchOrderDetails();
      if (status === 'DELIVERED') {
         Alert.alert('Success', 'Order completed!');
         router.back();
      }
    } catch (error: any) {
       console.error(error);
       const msg = error.message || 'Failed to update status';
       Alert.alert('Error', msg);
       setLoading(false);
    }
  };

  const getActionBtn = () => {
    if (!order) return null;

    // Check availability for claiming
    if (!order.riderId && (order.status === 'READY_FOR_PICKUP' || order.status === 'PREPARING')) {
        return { label: 'Accept Order', status: 'CLAIM', color: '#2E7D32' };
    }

     switch(order.status) {
         case 'READY_FOR_PICKUP':
             return { label: 'Confirm Pickup', status: 'PICKED_UP', color: '#1976D2' };
         case 'PICKED_UP':
             return { label: 'Start Delivery', status: 'DELIVERING', color: '#FF9800' };
         case 'DELIVERING':
             return { label: 'Complete Delivery', status: 'DELIVERED', color: '#43A047' };
         default:
             return null;
     }
  };

  const action = getActionBtn();

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#C2185B" />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ThemedText>Order not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Order Details',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.mapContainer}>
             <Mapbox.MapView style={styles.map}>
                <Mapbox.Camera
                    zoomLevel={13}
                    centerCoordinate={
                        order.address 
                        ? getCorrectedCoordinate(order.address.latitude, order.address.longitude)
                        : [120.9850, 14.6010]
                    }
                />
                
                {routeGeoJSON && (
                  <Mapbox.ShapeSource id="routeSource" shape={routeGeoJSON}>
                    <Mapbox.LineLayer
                      id="routeFill"
                      style={{
                        lineColor: '#2E7D32', // Green for Rider
                        lineWidth: 4,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />
                  </Mapbox.ShapeSource>
                )}

                {order.merchant?.longitude && (
                    <Mapbox.PointAnnotation
                        id="merchant"
                        coordinate={getCorrectedCoordinate(order.merchant.latitude, order.merchant.longitude)}
                    >
                         <View style={{backgroundColor:'white', padding:6, borderRadius:20, elevation:2}}><IconSymbol name="house.fill" size={20} color="#C2185B" /></View>
                    </Mapbox.PointAnnotation>
                )}
                {order.address?.longitude && (
                     <Mapbox.PointAnnotation
                        id="customer"
                        coordinate={getCorrectedCoordinate(order.address.latitude, order.address.longitude)}
                    >
                         <View style={{backgroundColor:'#1976D2', padding:6, borderRadius:20, elevation:2}}><IconSymbol name="account" size={20} color="white" /></View>
                    </Mapbox.PointAnnotation>
                )}
                 {location && (
                      <Mapbox.PointAnnotation
                        id="rider"
                        coordinate={[location.coords.longitude, location.coords.latitude]}
                    >
                         <View style={{backgroundColor:'#4CAF50', padding:6, borderRadius:20, elevation:2}}><IconSymbol name="paperplane.fill" size={20} color="white" /></View>
                    </Mapbox.PointAnnotation>
                 )}
             </Mapbox.MapView>
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <ThemedText style={styles.cardTitle}>Total Earnings</ThemedText>
          <ThemedText style={styles.totalAmount}>₱{order.deliveryFee}</ThemedText>
          
          <View style={styles.divider} />
          
          <View style={styles.breakdownRow}>
            <ThemedText style={styles.breakdownLabel}>Base Fare</ThemedText>
            <ThemedText style={styles.breakdownValue}>₱{order.deliveryFee}</ThemedText>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Trip Details</ThemedText>
          
          <View style={styles.routeCard}>
            {/* Pickup */}
            <View style={styles.locationRow}>
              <View style={styles.timelineSidebar}>
                <View style={[styles.dot, { backgroundColor: '#C2185B' }]} />
                <View style={styles.line} />
              </View>
              <View style={styles.locationContent}>
                <ThemedText style={styles.locationLabel}>Pickup</ThemedText>
                <ThemedText style={styles.locationName}>{order.merchant?.name}</ThemedText>
                <ThemedText style={styles.address}>
                  {order.merchant?.address}, {order.merchant?.city}
                </ThemedText>
              </View>
            </View>

            {/* Dropoff */}
            <View style={styles.locationRow}>
              <View style={styles.timelineSidebar}>
                <View style={[styles.dot, { backgroundColor: '#1976D2' }]} />
              </View>
              <View style={styles.locationContent}>
                <ThemedText style={styles.locationLabel}>Drop-off</ThemedText>
                <ThemedText style={styles.locationName}>
                  {order.customer?.firstName} {order.customer?.lastName}
                </ThemedText>
                <ThemedText style={styles.address}>
                  {order.address?.street}, {order.address?.city}
                </ThemedText>
                {order.address?.instructions && (
                  <View style={styles.noteBox}>
                    <ThemedText style={styles.noteText}>"{order.address.instructions}"</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Order Items Summary */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Order Items</ThemedText>
          <View style={styles.itemsCard}>
            {order.items?.map((item: any, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.quantityBadge}>
                  <ThemedText style={styles.quantityText}>{item.quantity}x</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.itemName}>{item.menuItem?.name}</ThemedText>
                  {item.notes && <ThemedText style={styles.itemSubtext}>{formatVariant(item.notes)}</ThemedText>}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metaInfo}>
          <ThemedText style={styles.metaText}>Order ID: {order.orderNumber || order.id}</ThemedText>
          <ThemedText style={styles.metaText}>
            {new Date(order.createdAt).toLocaleString()}
          </ThemedText>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Support Button Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {action && (
            <TouchableOpacity 
                style={[styles.mainActionBtn, { backgroundColor: action.color }]}
                onPress={() => handleStatusUpdate(action.status)}
            >
              <ThemedText style={styles.mainActionText}>{action.label}</ThemedText>
            </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.supportBtn}>
          <IconSymbol size={20} name="chat.bubble" color="#666" />
          <ThemedText style={styles.supportText}>Report an Issue</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  earningsCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#CCC',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  routeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  locationRow: {
    flexDirection: 'row',
  },
  timelineSidebar: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#EEE',
    marginVertical: 4,
    minHeight: 60,
  },
  locationContent: {
    flex: 1,
    paddingBottom: 24,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginBottom: 2,
  },
  address: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  noteBox: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#F57C00',
    fontStyle: 'italic',
  },
  itemsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtext: {
    fontSize: 12,
    color: '#888',
  },
  metaInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    padding: 16,
  },
  supportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  supportText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: '#EEE',
  },
  map: {
    flex: 1,
  },
  mainActionBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    },
  mainActionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
