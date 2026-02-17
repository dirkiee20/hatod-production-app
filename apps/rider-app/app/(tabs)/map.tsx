import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import { updateRiderStatus, updateRiderLocation } from '../../api/rider-service';
import * as Location from 'expo-location';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('[RiderApp Map] Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: [number, number] = [location.coords.longitude, location.coords.latitude];
      setCurrentLocation(coords);

      // Center camera on current location
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        zoomLevel: 15,
        animationDuration: 1000,
      });
    } catch (error) {
      console.error('[RiderApp Map] Error getting location:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (updatingStatus) return;

    try {
      setUpdatingStatus(true);
      const newStatus = !isOnline;
      const status = newStatus ? 'AVAILABLE' : 'OFFLINE';

      console.log('[RiderApp MapScreen] Toggling status to:', status);
      
      // Update status
      await updateRiderStatus(status);
      
      // If going online, also update location so merchants can find the rider
      if (newStatus && currentLocation) {
        console.log('[RiderApp MapScreen] Updating location for merchant search:', currentLocation);
        await updateRiderLocation(currentLocation[1], currentLocation[0]); // lat, lng
      } else if (newStatus && !currentLocation) {
        // Try to get location if we don't have it yet
        await getCurrentLocation();
        if (currentLocation) {
          await updateRiderLocation(currentLocation[1], currentLocation[0]);
        }
      }
      
      setIsOnline(newStatus);
    } catch (error) {
      console.error('[RiderApp MapScreen] Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <Mapbox.MapView 
          style={styles.map} 
          styleURL={Mapbox.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <Mapbox.Camera
            ref={cameraRef}
            zoomLevel={14}
            centerCoordinate={currentLocation || [120.9842, 14.5995]}
            animationMode={'flyTo'}
            animationDuration={2000}
          />
          
          {/* Show user location marker */}
          <Mapbox.UserLocation visible={true} />
          
          {currentLocation && (
            <Mapbox.PointAnnotation 
              id="rider-location" 
              coordinate={currentLocation}
            >
              <View style={styles.riderLocationMarker}>
                <IconSymbol size={20} name="paperplane.fill" color="#FFF" />
              </View>
            </Mapbox.PointAnnotation>
          )}
        </Mapbox.MapView>

        {/* Top Overlay */}
        <View style={[styles.topOverlay, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.menuBtn}>
            <IconSymbol size={24} name="dashboard" color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusPill, { backgroundColor: isOnline ? '#E8F5E9' : '#ECEFF1' }]}
            onPress={toggleOnlineStatus}
            disabled={updatingStatus}
          >
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#388E3C' : '#999' }]} />
            <ThemedText style={[styles.statusText, { color: isOnline ? '#388E3C' : '#666' }]}>
              {updatingStatus ? 'Updating...' : (isOnline ? 'Online' : 'Offline')}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn}>
            <IconSymbol size={24} name="account" color="#333" />
          </TouchableOpacity>
        </View>

        {/* Bottom Booking Card (if online/active) */}
        {isOnline && (
          <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
            <ThemedText style={styles.heatmapTitle}>You're Online</ThemedText>
            <ThemedText style={styles.heatmapSubtitle}>Waiting for delivery requests...</ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  map: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  heatmapTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
  },
  heatmapSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  riderLocationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
