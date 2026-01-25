import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView } from '@/components/ui/map-view';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(true);

  return (
    <ThemedView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView style={StyleSheet.absoluteFill} />

        {/* Top Overlay */}
        <View style={[styles.topOverlay, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.menuBtn}>
            <IconSymbol size={24} name="dashboard" color="#333" />
          </TouchableOpacity>
          <View style={[styles.statusPill, { backgroundColor: isOnline ? '#E8F5E9' : '#ECEFF1' }]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#388E3C' : '#999' }]} />
            <ThemedText style={[styles.statusText, { color: isOnline ? '#388E3C' : '#666' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <IconSymbol size={24} name="account" color="#333" />
          </TouchableOpacity>
        </View>

        {/* Bottom Booking Card (if online/active) */}
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
          <ThemedText style={styles.heatmapTitle}>High Demand Area</ThemedText>
          <ThemedText style={styles.heatmapSubtitle}>+₱15 surge pricing in this zone</ThemedText>
          
          <TouchableOpacity style={styles.navigateBtn}>
            <ThemedText style={styles.btnText}>Navigate to Hotspot</ThemedText>
            <IconSymbol size={20} name="paperplane.fill" color="#FFF" />
          </TouchableOpacity>
        </View>
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
    marginBottom: 16,
  },
  navigateBtn: {
    backgroundColor: '#C2185B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    gap: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
