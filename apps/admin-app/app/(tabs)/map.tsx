import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView } from '@/components/ui/map-view';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Restaurants', 'Drivers', 'Active Orders'];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <ThemedText style={styles.headerTitle}>Live Map</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Track restaurants, drivers & orders</ThemedText>
        </View>
        <TouchableOpacity style={styles.refreshBtn}>
          <IconSymbol size={20} name="dashboard" color="#FFF" />
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol size={18} name="restaurants" color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search location..."
            placeholderTextColor="#999"
          />
        </View>
      </View>

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
        <MapView style={StyleSheet.absoluteFill} />

        {/* Mock Map Markers Info Overlays */}
        <View style={styles.markerInfoContainer}>
          <View style={styles.markerInfo}>
            <View style={[styles.markerDot, { backgroundColor: '#F57C00' }]} />
            <ThemedText style={styles.markerLabel}>Restaurants: 2</ThemedText>
          </View>
          <View style={styles.markerInfo}>
            <View style={[styles.markerDot, { backgroundColor: '#1976D2' }]} />
            <ThemedText style={styles.markerLabel}>Drivers: 2</ThemedText>
          </View>
          <View style={styles.markerInfo}>
            <View style={[styles.markerDot, { backgroundColor: '#388E3C' }]} />
            <ThemedText style={styles.markerLabel}>Orders: 1</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom Stats */}
      <View style={[styles.bottomStats, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>5</ThemedText>
          <ThemedText style={styles.statLabel}>Active Locations</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>2</ThemedText>
          <ThemedText style={styles.statLabel}>Drivers Online</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>1</ThemedText>
          <ThemedText style={styles.statLabel}>In Transit</ThemedText>
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
  searchContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
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
