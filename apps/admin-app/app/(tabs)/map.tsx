
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import { getMerchants, getAllOrders, getRiders } from '../../api/services';
import { Merchant, Order, Rider } from '../../api/types';
import { resolveImageUrl } from '../../api/client';
import * as Location from 'expo-location';

// Initialize Mapbox with the same token key as other apps
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = ['All', 'Restaurants', 'Active Riders'];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
      }
    })();
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [merchantsData, ordersData, ridersData] = await Promise.all([
            getMerchants(),
            getAllOrders(),
            getRiders()
        ]);
        setMerchants(merchantsData);
        setOrders(ordersData);
        setRiders(ridersData);
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load map data');
    } finally {
        setLoading(false);
    }
  };

  const getActiveOrders = () => {
      return orders.filter(o => ['PENDING', 'PREPARING', 'READY', 'PICKED_UP'].includes(o.status));
  };

  const getActiveRiders = () => {
      // Riders who have active orders or are marked as BUSY/AVAILABLE (online)
      // The requirement was "riders that is not yet delivered", which implies actively delivering
      return riders.filter(r => 
        (r.status === 'BUSY' || (r.orders && r.orders.length > 0)) && r.currentLatitude && r.currentLongitude
      );
  };

  const getAllOnlineRiders = () => {
    return riders.filter(r => r.status !== 'OFFLINE');
  };

  const shouldShowRestaurants = selectedFilter === 'All' || selectedFilter === 'Restaurants';
  const shouldShowRiders = selectedFilter === 'All' || selectedFilter === 'Active Riders';

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <ThemedText style={styles.headerTitle}>Live Map</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Real-time monitoring</ThemedText>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
          <IconSymbol size={20} name="dashboard" color="#FFF" />
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <ThemedText style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {loading && (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#C2185B" />
            </View>
        )}
        
        <Mapbox.MapView 
            style={styles.map} 
            styleURL={Mapbox.StyleURL.Street}
            logoEnabled={false}
            attributionEnabled={false}
        >
            <Mapbox.Camera
                zoomLevel={11}
                centerCoordinate={[120.9842, 14.5995]}
                animationMode={'flyTo'}
                animationDuration={2000}
                ref={(c) => {
                    if (c) {
                        const coordinates = [
                            ...merchants.filter(m => m.longitude && m.latitude).map(m => [m.longitude!, m.latitude!]),
                            ...riders.filter(r => r.currentLongitude && r.currentLatitude).map(r => [r.currentLongitude!, r.currentLatitude!])
                        ];

                        if (coordinates.length > 0) {
                            const minLng = Math.min(...coordinates.map(c => c[0]));
                            const maxLng = Math.max(...coordinates.map(c => c[0]));
                            const minLat = Math.min(...coordinates.map(c => c[1]));
                            const maxLat = Math.max(...coordinates.map(c => c[1]));

                            // If only one point
                            if (minLng === maxLng && minLat === maxLat) {
                                c.setCamera({
                                    centerCoordinate: [minLng, minLat],
                                    zoomLevel: 14,
                                    animationDuration: 2000,
                                });
                            } else {
                                // Add 10% padding
                                const latDiff = maxLat - minLat;
                                const lngDiff = maxLng - minLng;
                                
                                c.fitBounds(
                                    [maxLng + lngDiff * 0.1, maxLat + latDiff * 0.1], // ne
                                    [minLng - lngDiff * 0.1, minLat - latDiff * 0.1], // sw
                                    50, // padding
                                    2000 // duration
                                );
                            }
                        }
                    }
                }}
            />

            {/* Restaurant Markers */}
            {shouldShowRestaurants && merchants.map((merchant) => {
                const imageUrl = resolveImageUrl(merchant.logo || merchant.imageUrl || merchant.coverImage);
                return (
                    merchant.latitude && merchant.longitude && (
                        <Mapbox.MarkerView 
                            key={`merchant-${merchant.id}`} 
                            id={`merchant-${merchant.id}`} 
                            coordinate={[merchant.longitude, merchant.latitude]}
                        >
                             {imageUrl ? (
                                 <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.merchantLogoMarker}
                                 />
                             ) : (
                                 <View style={[styles.merchantLogoMarker, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F57C00' }]}>
                                     <IconSymbol size={20} name="restaurants" color="#FFF" />
                                 </View>
                             )}
                        </Mapbox.MarkerView>
                    )
                );
            })}
            
            {/* Active Rider Markers */}
            {shouldShowRiders && getActiveRiders().map((rider) => (
                rider.currentLatitude && rider.currentLongitude && (
                    <Mapbox.PointAnnotation 
                        key={`rider-${rider.id}`} 
                        id={`rider-${rider.id}`} 
                        coordinate={[rider.currentLongitude, rider.currentLatitude]}
                    >
                         <View style={styles.riderMarker}>
                             <IconSymbol size={16} name="map" color="#FFF" /> 
                         </View>
                        <Mapbox.Callout title={`${rider.firstName} ${rider.lastName}`} />
                    </Mapbox.PointAnnotation>
                )
            ))}

            <Mapbox.UserLocation 
                visible={true} 
                showsUserHeadingIndicator={true}
                androidRenderMode="gps"
            />
            
        </Mapbox.MapView>

        {/* Floating Info Card */}
        <View style={styles.markerInfoContainer}>
          <View style={styles.markerInfo}>
            <View style={[styles.markerDot, { backgroundColor: '#F57C00' }]} />
            <ThemedText style={styles.markerLabel}>Restaurants: {merchants.filter(m => m.latitude).length}</ThemedText>
          </View>
          <View style={styles.markerInfo}>
             <View style={[styles.markerDot, { backgroundColor: '#43A047' }]} />
             <ThemedText style={styles.markerLabel}>Active Riders: {getActiveRiders().length}</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom Stats */}
      <View style={[styles.bottomStats, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{merchants.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Locations</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{getActiveOrders().length}</ThemedText>
          <ThemedText style={styles.statLabel}>Orders</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{getAllOnlineRiders().length}</ThemedText>
          <ThemedText style={styles.statLabel}>Riders Online</ThemedText>
        </View>
      </View>
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
    backgroundColor: '#C2185B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterChipActive: {
    backgroundColor: '#C2185B',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  merchantLogoMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  riderMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#43A047',
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
  markerInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  markerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  markerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  bottomStats: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#C2185B',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
});
