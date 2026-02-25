import { StyleSheet, View, TouchableOpacity, Image, Animated, Easing, Platform, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import Mapbox from '@rnmapbox/maps';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getOrderById, getRoute, createReview } from '@/api/services';
import { resolveImageUrl } from '@/api/client';
import { useSocket } from '@/context/SocketContext';

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');


export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { socket } = useSocket();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  
  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Animation for the "pulse" effect finding a rider
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (id) {
      fetchOrder();
    } else {
       setLoading(false);
       Alert.alert('Error', 'No order ID provided', [
           { text: 'Go Back', onPress: () => router.back() }
       ]);
    }
  }, [id]);

  useEffect(() => {
    if (!socket) {
        console.log('[OrderTracking] No socket instance available');
        return;
    }

    console.log('[OrderTracking] Setting up socket listeners. Socket ID:', socket.id);

    const handleOrderUpdate = (updatedOrder: any) => {
        console.log('[OrderTracking] Received order:updated event:', updatedOrder.status, updatedOrder.id);
        const currentId = Array.isArray(id) ? id[0] : id;
        
        setOrder((currentOrder: any) => {
            // Match against current order or URL param
            if ((currentOrder && currentOrder.id === updatedOrder.id) || (updatedOrder.id === currentId)) {
                console.log('[OrderTracking] Updating order state');

                // Shallow-merge top-level fields first
                const merged: any = { ...currentOrder, ...updatedOrder };

                // Deep-merge nested objects so we don't lose fields (like merchant.logo)
                if (currentOrder?.merchant || updatedOrder.merchant) {
                    merged.merchant = {
                        ...(currentOrder?.merchant || {}),
                        ...(updatedOrder.merchant || {}),
                    };
                }

                if (currentOrder?.rider || updatedOrder.rider) {
                    merged.rider = {
                        ...(currentOrder?.rider || {}),
                        ...(updatedOrder.rider || {}),
                    };
                }

                if (currentOrder?.address || updatedOrder.address) {
                    merged.address = {
                        ...(currentOrder?.address || {}),
                        ...(updatedOrder.address || {}),
                    };
                }

                console.log('[OrderTracking] Merged merchant logo:', merged?.merchant?.logo);
                return merged;
            }
            return currentOrder;
        });
    };

    const handleRiderLocation = (data: { riderId: string, location: { latitude: number, longitude: number } }) => {
         console.log('[OrderTracking] Received rider:location', data);
         setOrder((currentOrder: any) => {
             if (currentOrder && currentOrder.rider && currentOrder.rider.id === data.riderId) {
                 return {
                     ...currentOrder,
                     rider: {
                         ...currentOrder.rider,
                         currentLatitude: data.location.latitude,
                         currentLongitude: data.location.longitude
                     }
                 };
             }
             return currentOrder;
         });
    };

    socket.on('order:updated', handleOrderUpdate);
    socket.on('rider:location', handleRiderLocation);

    return () => {
      console.log('[OrderTracking] Cleaning up socket listeners');
      socket.off('order:updated', handleOrderUpdate);
      socket.off('rider:location', handleRiderLocation);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!order || !order.rider) return;

    const fetchRoute = async () => {
      const isPabiliOrder = !!order.pabiliRequestId;

      // Only draw routes when the rider is actually in motion or preparing
      const shouldDraw =
        isPabiliOrder
          ? ['PICKED_UP', 'DELIVERING'].includes(order.status)
          : ['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING', 'ON_THE_WAY'].includes(order.status);

      if (!shouldDraw) return;

      const customerLoc: [number, number] = [
        order.address?.longitude ?? 120.9850,
        order.address?.latitude ?? 14.6010,
      ];

      const riderLoc: [number, number] = [
        order.rider.currentLongitude ?? customerLoc[0],
        order.rider.currentLatitude ?? customerLoc[1],
      ];

      let start: [number, number] = riderLoc;
      let end: [number, number] = customerLoc;

      // For non-pabili orders, when rider is going to the merchant, route rider -> merchant
      if (!isPabiliOrder) {
        const merchantLng = order.merchant?.longitude;
        const merchantLat = order.merchant?.latitude;
        if (merchantLng != null && merchantLat != null) {
          const merchantLoc: [number, number] = [merchantLng, merchantLat];
          if (order.status === 'READY_FOR_PICKUP' || order.status === 'PREPARING') {
            end = merchantLoc;
          }
        }
      }

      const route = await getRoute(start, end);
      if (route) {
        setRouteGeoJSON(route);
      }
    };

    fetchRoute();
  }, [order]);

  // For Pabili orders: when a rider gets assigned, shift camera to rider (or fallback to customer)
  useEffect(() => {
    if (!order || !order.pabiliRequestId || !order.rider) return;

    const lng = order.rider.currentLongitude || order.address?.longitude;
    const lat = order.rider.currentLatitude || order.address?.latitude;
    if (lng == null || lat == null) return;

    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: 15,
      animationDuration: 1000,
    });
  }, [order?.riderId, order?.pabiliRequestId]);

  const fetchOrder = async () => {
      try {
          const data = await getOrderById(id as string);
          console.log('[OrderTracking] Order data:', JSON.stringify(data, null, 2));
          console.log('[OrderTracking] Merchant logo:', data?.merchant?.logo);
          console.log('[OrderTracking] Resolved logo URL:', data?.merchant?.logo ? resolveImageUrl(data.merchant.logo) : 'N/A');
          setOrder(data);
          
          // Initial Camera Position Logic
          if (data) {
              if (data.status === 'PENDING' || data.status === 'CONFIRMED' || data.status === 'PREPARING') {
                   // Focus on Merchant
                   const m = data.merchant;
                   const lng = m?.longitude;
                   const lat = m?.latitude;
                   
                   if (lng !== undefined && lat !== undefined) {
                        setTimeout(() => {
                            cameraRef.current?.setCamera({
                                centerCoordinate: [lng, lat],
                                zoomLevel: 15,
                                animationDuration: 1000
                            });
                        }, 500);
                   }
              } else if (data.status === 'DELIVERING' || data.status === 'PICKED_UP') {
                   // Focus on Rider (if real rider loc provided) or bounds
                   // For now, keeping merchant focus or transitioning to customer
                   // User specifically asked for PENDING -> Merchant
              }
          }

      } catch (e) {
          Alert.alert('Error', 'Failed to load order details');
          router.back();
      } finally {
          setLoading(false);
      }
  };

  // When screen regains focus (e.g. app returns from background), refetch latest order state
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      fetchOrder();
    }, [id])
  );

  if (loading) {
      return (
          <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#5c6cc9" />
          </ThemedView>
      );
  }

  if (!order) return null;

  const isPabili = !!order.pabiliRequestId;

  const isRiderAssigned = !!order.rider;
  const showRider = isRiderAssigned && ['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING', 'ON_THE_WAY'].includes(order.status);

  // Coordinates
  const customerCoords = [order.address?.longitude || 120.9850, order.address?.latitude || 14.6010]; 
  const merchantCoords = [
    order.merchant?.longitude ?? customerCoords[0],
    order.merchant?.latitude ?? customerCoords[1],
  ];
  const initialCenterCoords = isPabili ? customerCoords : merchantCoords;
  // Rider Coords: Real app would stream this via socket. 
  // For now using static or null.
  const riderCoords = order.rider ? [order.rider.currentLongitude || 120.9842, order.rider.currentLatitude || 14.5995] : null;

  const submitReview = async () => {
    if (!order) return;
    try {
        setSubmittingReview(true);
        await createReview(order.id, rating, reviewComment);
        Alert.alert('Success', 'Thank you for your feedback!');
        setShowReviewModal(false);
        fetchOrder(); // Refresh to hide button
    } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
        setSubmittingReview(false);
    }
  };

  const renderStars = () => {
      return (
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <IconSymbol 
                        size={32} 
                        name={star <= rating ? "star.fill" : "star"} 
                        color={star <= rating ? "#FFD700" : "#CCC"} 
                      />
                  </TouchableOpacity>
              ))}
          </View>
      );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Map Area */}
      <View style={styles.mapArea}>
        <Mapbox.MapView 
            style={styles.map} 
            styleURL={Mapbox.StyleURL.Street}
            logoEnabled={false}
            attributionEnabled={false}
        >
            <Mapbox.Camera
                ref={cameraRef}
                zoomLevel={15}
                centerCoordinate={initialCenterCoords} 
                animationMode={'flyTo'}
                animationDuration={2000}
            />

            {/* Customer Location */}
            <Mapbox.PointAnnotation id="customer" coordinate={customerCoords}>
                <IconSymbol size={40} name="location.fill" color="#5c6cc9" />
            </Mapbox.PointAnnotation>

            {/* Route Line */}
            {routeGeoJSON && (
              <Mapbox.ShapeSource id="routeSource" shape={routeGeoJSON}>
                <Mapbox.LineLayer
                  id="routeFill"
                  style={{
                    lineColor: '#5c6cc9',
                    lineWidth: 4,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </Mapbox.ShapeSource>
            )}

            {/* Rider Location */}
            {showRider && riderCoords && (
                <Mapbox.PointAnnotation id="rider" coordinate={riderCoords}>
                    <View style={styles.riderMarker}>
                        <IconSymbol size={20} name="paperplane.fill" color="#FFF" />
                    </View>
                    <Mapbox.Callout title="Rider" />
                </Mapbox.PointAnnotation>
            )}

            {/* Restaurant Location (Store Logo) */}
            {!isPabili && (
              <Mapbox.MarkerView id="restaurant" coordinate={merchantCoords}>
                  <Image
                      source={{ uri: resolveImageUrl(order.merchant?.logo) || undefined }}
                      style={styles.restaurantLogoMarker}
                  />
              </Mapbox.MarkerView>
            )}
        </Mapbox.MapView>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol size={24} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Status Card */}
      <ThemedView style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        {!isRiderAssigned ? (
            <View style={styles.statusContainer}>
                <ThemedText style={styles.statusTitle}>{order.status.replace(/_/g, ' ')}</ThemedText>
                <ThemedText style={styles.statusSub}>
                    {order.status === 'PENDING' ? 'Waiting for restaurant confirmation' : 
                     order.status === 'PREPARING' ? 'Restaurant is preparing your food' :
                     'Searching for a rider...'}
                </ThemedText>
                
                <Animated.View style={[styles.radarCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <IconSymbol size={40} name="food" color="#FFF" />
                </Animated.View>
                
                {order.status === 'PENDING' && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                        <ThemedText style={styles.cancelText}>Cancel Order</ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        ) : (
            <View style={styles.statusContainer}>
                <View style={styles.riderInfoRow}>
                    <View style={styles.riderAvatar}>
                        <IconSymbol size={30} name="person" color="#555" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <ThemedText style={styles.riderName}>{order.rider.firstName} {order.rider.lastName}</ThemedText>
                        <View style={styles.ratingRow}>
                            <IconSymbol size={14} name="person" color="#FFD700" /> 
                            <ThemedText style={styles.ratingText}>{order.rider.rating || '5.0'} ({order.rider.totalDeliveries || 0} deliveries)</ThemedText>
                        </View>
                    </View>
                    <View style={styles.plateBadge}>
                        <ThemedText style={styles.plateText}>{order.rider.vehicleNumber || 'No Plate'}</ThemedText>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.timelineContainer}>
                     <View style={styles.timelineItem}>
                        <View style={styles.timelineDotActive} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.timelineTitle}>Order Status: {order.status.replace(/_/g, ' ')}</ThemedText>
                        </View>
                     </View>
                </View>

                {order.status === 'DELIVERED' && !order.review ? (
                    <TouchableOpacity style={styles.rateBtn} onPress={() => setShowReviewModal(true)}>
                        <IconSymbol size={20} name="star.fill" color="#FFF" />
                        <ThemedText style={styles.rateText}>Rate Order</ThemedText>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.messageBtn}>
                            <IconSymbol size={20} name="message.fill" color="#5c6cc9" />
                            <ThemedText style={styles.messageText}>Message</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callBtn}>
                            <IconSymbol size={20} name="phone.fill" color="#FFF" /> 
                            <ThemedText style={styles.callText}>Call</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )}

        {/* Order Items Summary */}
        {order.items && order.items.length > 0 && (
            <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#EEE' }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '900', color: '#333', marginBottom: 16 }}>Order Summary</ThemedText>
                {order.items.map((item: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
                         <Image 
                            source={{ uri: resolveImageUrl(item.menuItem?.image || item.menuItem?.imageUrl) || undefined }}
                            style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#F5F5F5', marginRight: 12 }} 
                         />
                         <View style={{ flex: 1 }}>
                             <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>{item.quantity}x {item.menuItem?.name}</ThemedText>
                             {(() => {
                               if (!item.notes) return null;
                               let parsed: Record<string, any> = {};
                               try { parsed = typeof item.notes === 'string' ? JSON.parse(item.notes) : item.notes; } catch { return null; }
                               const entries = Object.entries(parsed).filter(([, v]) =>
                                 v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
                               );
                               if (entries.length === 0) return null;
                               return (
                                 <View style={{ marginTop: 3 }}>
                                   {entries.map(([key, value]) => {
                                     if (key === 'note') {
                                       return (
                                         <ThemedText key={key} style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>
                                           📝 {String(value)}
                                         </ThemedText>
                                       );
                                     }
                                     const display = Array.isArray(value) ? value.join(', ') : String(value);
                                     return (
                                       <View key={key} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                         <ThemedText style={{ fontSize: 11, color: '#aaa', fontWeight: '700' }}>{key}: </ThemedText>
                                         <ThemedText style={{ fontSize: 11, color: '#666', fontWeight: '600' }}>{display}</ThemedText>
                                       </View>
                                     );
                                   })}
                                 </View>
                               );
                             })()}
                         </View>
                         <ThemedText style={{ fontWeight: '700' }}>₱{((item.price || 0) * item.quantity).toFixed(2)}</ThemedText>
                    </View>
                ))}
            </View>
        )}

      </ThemedView>
      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <ThemedText style={styles.modalTitle}>Rate your Order</ThemedText>
                <ThemedText style={styles.modalSubtitle}>How was your experience with {order?.merchant?.name}?</ThemedText>
                
                {renderStars()}

                <TextInput 
                    style={styles.input}
                    placeholder="Write a comment (optional)"
                    multiline
                    numberOfLines={4}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowReviewModal(false)}>
                        <ThemedText style={{ color: '#666' }}>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.modalBtnSubmit, submittingReview && { opacity: 0.7 }]} 
                        onPress={submitReview}
                        disabled={submittingReview}
                    >
                        {submittingReview ? <ActivityIndicator color="#FFF" /> : <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Submit Review</ThemedText>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },

  riderMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5c6cc9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  restaurantLogoMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
  },
  statusSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5c6cc9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#5c6cc9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  riderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  plateBadge: {
    backgroundColor: '#EBEFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  plateText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5c6cc9',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EEE',
    marginBottom: 20,
  },
  timelineContainer: {
    width: '100%',
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#DDD',
    marginLeft: 5,
    marginVertical: 4,
  },
  timelineDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5c6cc9',
    marginTop: 4,
  },
  timelineDotInactive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DDD',
    marginTop: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  timelineTitleInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  messageBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBEFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageText: {
    color: '#5c6cc9',
    fontWeight: '800',
    fontSize: 14,
  },
  callBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#5c6cc9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  rateBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#5c6cc9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  rateText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    width: '100%' 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  modalSubtitle: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#DDD', 
    borderRadius: 12, 
    padding: 12, 
    height: 100, 
    textAlignVertical: 'top', 
    marginBottom: 20 
  },
  modalButtons: { 
    flexDirection: 'row', 
    width: '100%', 
    gap: 12 
  },
  modalBtnCancel: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: '#F5F5F5', 
    alignItems: 'center' 
  },
  modalBtnSubmit: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: '#5c6cc9', 
    alignItems: 'center' 
  },
});

