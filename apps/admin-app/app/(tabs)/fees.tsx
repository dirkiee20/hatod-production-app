
import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDeliveryFeeConfigs, createDeliveryFeeConfig, updateDeliveryFeeConfig, deleteDeliveryFeeConfig } from '@/api/services';
import { DeliveryFeeConfig } from '@/api/types';
import { useFocusEffect } from 'expo-router';

export default function FeesScreen() {
  const insets = useSafeAreaInsets();
  const [configs, setConfigs] = useState<DeliveryFeeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New Config State
  const [newMin, setNewMin] = useState('');
  const [newMax, setNewMax] = useState('');
  const [newFee, setNewFee] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchConfigs();
    }, [])
  );

  const fetchConfigs = async () => {
    setLoading(true);
    const data = await getDeliveryFeeConfigs();
    setConfigs(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newMin || !newMax || !newFee) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const success = await createDeliveryFeeConfig({
      minDistance: parseFloat(newMin),
      maxDistance: parseFloat(newMax),
      fee: parseFloat(newFee),
    });

    if (success) {
      setNewMin('');
      setNewMax('');
      setNewFee('');
      fetchConfigs();
      Alert.alert('Success', 'Delivery fee range added');
    } else {
      Alert.alert('Error', 'Failed to add configuration');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this range?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteDeliveryFeeConfig(id);
          if (success) fetchConfigs();
          else Alert.alert('Error', 'Failed to delete');
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.headerTitle}>Delivery Fees</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Manage distance-based pricing</ThemedText>
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Add New Section */}
        <View style={styles.addCard}>
          <ThemedText style={styles.sectionTitle}>Add New Range</ThemedText>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Min (km)</ThemedText>
              <TextInput 
                style={styles.input} 
                value={newMin} 
                onChangeText={setNewMin} 
                keyboardType="numeric" 
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Max (km)</ThemedText>
              <TextInput 
                style={styles.input} 
                value={newMax} 
                onChangeText={setNewMax} 
                keyboardType="numeric" 
                placeholder="10"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Fee (₱)</ThemedText>
              <TextInput 
                style={styles.input} 
                value={newFee} 
                onChangeText={setNewFee} 
                keyboardType="numeric" 
                placeholder="50"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <ThemedText style={styles.addButtonText}>Add Rule</ThemedText>
          </TouchableOpacity>
        </View>

        {/* List Section */}
        <ThemedText style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Current Rates</ThemedText>
        
        {loading ? (
          <ActivityIndicator size="large" color="#C2185B" />
        ) : (
          configs.map((config) => (
            <View key={config.id} style={styles.configCard}>
              <View style={styles.configInfo}>
                <View style={styles.rangeBadge}>
                    <IconSymbol name="location.fill" size={16} color="#C2185B" />
                    <ThemedText style={styles.rangeText}>
                    {config.minDistance} - {config.maxDistance} km
                    </ThemedText>
                </View>
                <ThemedText style={styles.feeText}>₱{config.fee}</ThemedText>
              </View>
              
              <TouchableOpacity onPress={() => handleDelete(config.id)} style={styles.deleteButton}>
                <IconSymbol name="trash.fill" size={20} color="#FF5252" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {configs.length === 0 && !loading && (
            <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>No delivery fees configured.</ThemedText>
            </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  addCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  addButton: {
    backgroundColor: '#C2185B',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  configCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 1,
  },
  configInfo: {
    flex: 1,
  },
  rangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4EC',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  rangeText: {
    fontSize: 13,
    color: '#C2185B',
    fontWeight: '700',
    marginLeft: 6,
  },
  feeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  emptyState: {
      padding: 40,
      alignItems: 'center',
  },
  emptyText: {
      color: '#999',
      fontSize: 14,
  }
});
