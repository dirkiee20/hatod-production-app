import { StyleSheet, TextInput, ScrollView, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useRef, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { createAddress, reverseGeocode } from '@/api/services';

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

export default function AddAddressScreen() {
  const router = useRouter();
  const [coordinates, setCoordinates] = useState([125.4947, 9.7891]);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [followUser, setFollowUser] = useState(true);
  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  
  const cameraRef = useRef<Mapbox.Camera>(null);
  const debounceTimer = useRef<any>(null);

  // Initial location text
  useEffect(() => {
    (async () => {
      console.log('[AddAddress] Requesting location permissions...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[AddAddress] Location permission status:', status);
      
      if (status === 'granted') {
          console.log('[AddAddress] Getting current position...');
          let location = await Location.getCurrentPositionAsync({});
          const newCoords = [location.coords.longitude, location.coords.latitude];
          console.log('[AddAddress] Current location:', newCoords);
          // We let Mapbox Camera follow user, but we fetch address immediately
          fetchAddress(newCoords[0], newCoords[1]);
      } else {
          console.log('[AddAddress] Location permission denied');
      }
    })();
  }, []);

  const fetchAddress = async (lng: number, lat: number) => {
      console.log('[AddAddress] fetchAddress called with:', { lng, lat });
      try {
          const address = await reverseGeocode(lat, lng);
          console.log('[AddAddress] Reverse geocode result:', address);
          if (address) {
              setStreet(address);
              console.log('[AddAddress] Address set successfully');
          } else {
              console.log('[AddAddress] No address returned from reverseGeocode');
          }
      } catch (error) {
          console.error('[AddAddress] Error in fetchAddress:', error);
      }
  };

  const onMapPress = (feature: any) => {
    const coords = feature.geometry.coordinates;
    setFollowUser(false);
    setCoordinates(coords);
    fetchAddress(coords[0], coords[1]);
  };

  const onCameraChanged = (state: any) => {
       const { zoom } = state.properties;
       if (state.gestures?.isGesture) {
           setFollowUser(false);
       }
       setZoomLevel(zoom);
  };
  const handleSave = async () => {
      if (!street) {
          Alert.alert('Please select a location');
          return;
      }
      
      setLoading(true);
      try {
          await createAddress({
              label,
              street,
              city: 'Surigao City',
              state: 'Surigao del Norte',
              latitude: coordinates[1],
              longitude: coordinates[0],
              instructions,
              zipCode: '8400'
          });
          router.back();
      } catch (e) {
          Alert.alert('Error', 'Failed to save address');
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Add New Address',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Map Section */}
          <View style={styles.mapContainer}>
             <Mapbox.MapView
                style={styles.map}
                styleURL={Mapbox.StyleURL.Street}
                logoEnabled={false}
                attributionEnabled={false}
                onCameraChanged={onCameraChanged}
                onPress={onMapPress}
             >
                <Mapbox.UserLocation visible={true} />
                <Mapbox.Camera
                    ref={cameraRef}
                    zoomLevel={zoomLevel}
                    followUserLocation={followUser}
                    centerCoordinate={followUser ? undefined : coordinates}
                    animationMode={'flyTo'}
                    animationDuration={1000}
                />
                <Mapbox.PointAnnotation
                     id="selectedLocation"
                     coordinate={coordinates}
                >
                     <IconSymbol size={36} name="location.fill" color="#C2185B" />
                </Mapbox.PointAnnotation>
             </Mapbox.MapView>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
              <ThemedText style={styles.sectionTitle}>Label</ThemedText>
              <View style={styles.labelSelector}>
                  {['Home', 'Work', 'Other'].map((l) => (
                      <TouchableOpacity 
                        key={l} 
                        style={[styles.labelChip, label === l && styles.labelChipActive]}
                        onPress={() => setLabel(l)}
                      >
                          <ThemedText style={[styles.labelText, label === l && styles.labelTextActive]}>{l}</ThemedText>
                      </TouchableOpacity>
                  ))}
              </View>

              <ThemedText style={styles.sectionTitle}>Address</ThemedText>
              <View style={styles.inputWrapper}>
                  <TextInput 
                      style={styles.input} 
                      value={street} 
                      onChangeText={setStreet}
                      placeholder="Fetching address..."
                      multiline
                  />
                  <IconSymbol size={20} name="pencil" color="#999" style={{ position: 'absolute', right: 10, top: 12 }}/>
              </View>

              <ThemedText style={styles.sectionTitle}>Delivery Instructions (Optional)</ThemedText>
              <View style={styles.inputWrapper}>
                  <TextInput 
                      style={styles.input} 
                      value={instructions} 
                      onChangeText={setInstructions}
                      placeholder="e.g. Near the blue gate, call upon arrival"
                  />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                  {loading ? (
                      <ActivityIndicator color="#FFF" />
                  ) : (
                      <ThemedText style={styles.saveBtnText}>Save Address</ThemedText>
                  )}
              </TouchableOpacity>
          </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  mapContainer: { height: 300, width: '100%', position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  centerMarkerContainer: {
    position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -36, zIndex: 10, elevation: 10,
  },
  formContainer: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 10, marginTop: 10 },
  labelSelector: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  labelChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F0F0F0' },
  labelChipActive: { backgroundColor: '#C2185B' },
  labelText: { color: '#666', fontWeight: '600', fontSize: 13 },
  labelTextActive: { color: '#FFF' },
  inputWrapper: { position: 'relative', marginBottom: 10 },
  input: {
      backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 12,
      fontSize: 14, color: '#333',
  },
  saveBtn: {
      backgroundColor: '#C2185B', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
