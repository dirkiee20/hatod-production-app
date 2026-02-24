import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useRef, useEffect } from 'react';
import Mapbox from '@rnmapbox/maps';
import { Dimensions, Alert } from 'react-native';
import { reverseGeocode, getAddresses } from '@/api/services';
import * as Location from 'expo-location';
import { useCart } from '@/context/CartContext';
import { useFocusEffect } from 'expo-router';

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

export default function AddressManagerScreen() {
  const router = useRouter();
  const { setDeliveryAddress } = useCart();
  const [selectedId, setSelectedId] = useState('1');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Default to Surigao City [lng, lat]
  const [coordinates, setCoordinates] = useState([125.4947, 9.7891]);
  const [zoomLevel, setZoomLevel] = useState(14);
  const [addressText, setAddressText] = useState('');
  const cameraRef = useRef<Mapbox.Camera>(null);
  const debounceTimer = useRef<any>(null);

  // Load addresses whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAddresses();
    }, [])
  );

  const loadAddresses = async () => {
      try {
          const data = await getAddresses();
          if (Array.isArray(data)) {
              setSavedAddresses(data);
          }
      } catch (e) {
          console.error("Failed to load addresses", e);
      }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  }, []);


  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newCoords = [location.coords.longitude, location.coords.latitude];
      setCoordinates(newCoords);
      fetchAddress(newCoords[0], newCoords[1]);
      
      // Animate to user location
      cameraRef.current?.setCamera({
         centerCoordinate: newCoords,
         zoomLevel: 15, // Zoom in closer for user location
         animationDuration: 2000,
      });
      setZoomLevel(15);
    })();
  }, []);

  const fetchAddress = async (lng: number, lat: number) => {
      const address = await reverseGeocode(lat, lng);
      if (address) {
          setAddressText(address);
      }
  };

  const onCameraChanged = (state: any) => {
       const { center, zoom } = state.properties;
       setCoordinates(center);
       setZoomLevel(zoom);
       
       // Debounce geocoding
       if (debounceTimer.current) clearTimeout(debounceTimer.current);
       debounceTimer.current = setTimeout(() => {
           fetchAddress(center[0], center[1]);
       }, 800);
  };



  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Select Address',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <ThemedView style={styles.searchSection}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="location" color="#5c6cc9" />
            <TextInput 
              placeholder="Search or detect location..."
              style={styles.searchInput}
              placeholderTextColor="#999"
              value={addressText}
              onChangeText={setAddressText}
            />
          </ThemedView>
          <TouchableOpacity style={styles.currentLocationBtn} onPress={async () => {
              // Fetch current location
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') return;

              let location = await Location.getCurrentPositionAsync({});
              const address = await reverseGeocode(location.coords.latitude, location.coords.longitude);
              if (address) {
                  setAddressText(address);
              }
          }}>
             <IconSymbol size={16} name="paperplane.fill" color="#5c6cc9" />
             <ThemedText style={styles.currentLocationText}>Use current location</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.sectionDivider}>
           <ThemedText style={styles.sectionTitle}>Saved Addresses</ThemedText>
        </ThemedView>

        {savedAddresses.length === 0 ? (
             <ThemedView style={{ padding: 20, alignItems: 'center' }}>
                 <ThemedText style={{ color: '#999' }}>No saved addresses found.</ThemedText>
             </ThemedView>
        ) : (
            savedAddresses.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.addressItem, selectedId === item.id && styles.addressItemActive]}
                onPress={() => setSelectedId(item.id)}
              >
                <ThemedView style={styles.itemMain}>
                   <ThemedView style={[styles.iconContainer, selectedId === item.id && styles.iconActive]}>
                      <IconSymbol size={20} name={item.label.toLowerCase() === 'home' ? 'house.fill' : 'person'} color={selectedId === item.id ? '#FFF' : '#5c6cc9'} />
                   </ThemedView>
                   <ThemedView style={styles.addressDetails}>
                      <ThemedText style={styles.label}>{item.label}</ThemedText>
                      <ThemedText style={styles.street} numberOfLines={1}>{item.street}</ThemedText>
                      <ThemedText style={styles.landmark}>Nearby: {item.instructions || 'N/A'}</ThemedText>
                   </ThemedView>
                </ThemedView>
                
                <ThemedView style={[styles.radio, selectedId === item.id && styles.radioActive]}>
                   {selectedId === item.id && <ThemedView style={styles.radioInner} />}
                </ThemedView>
              </TouchableOpacity>
            ))
        )}

        <TouchableOpacity style={styles.addNewBtn} onPress={() => router.push('/add-address')}>
           <ThemedView style={styles.addIconCircle}>
              <ThemedText style={styles.plusText}>+</ThemedText>
           </ThemedView>
           <ThemedText style={styles.addNewText}>Add New Address</ThemedText>
        </TouchableOpacity>

        <ThemedView style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm Action */}
      <ThemedView style={styles.footer}>
         <TouchableOpacity style={styles.confirmBtn} onPress={() => {
             const selected = savedAddresses.find(addr => addr.id === selectedId);
             if (selected) {
                 setDeliveryAddress(selected);
             }
             router.back();
         }}>
            <ThemedText style={styles.confirmBtnText}>Confirm and Continue</ThemedText>
         </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  mapContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    zIndex: 10,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: 'transparent',
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#5c6cc9',
  },
  sectionDivider: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 0.5,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFF',
  },
  addressItemActive: {
    backgroundColor: '#F8FAFF',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBEFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: '#5c6cc9',
  },
  addressDetails: {
    marginLeft: 15,
    flex: 1,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  street: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  landmark: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  radioActive: {
    borderColor: '#5c6cc9',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5c6cc9',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#5c6cc9',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#5c6cc9',
    fontSize: 18,
    fontWeight: '500',
    marginTop: -2,
  },
  addNewText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#5c6cc9',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderColor: '#EEE',
  },
  confirmBtn: {
    backgroundColor: '#5c6cc9',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
