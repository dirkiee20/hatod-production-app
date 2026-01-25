import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Switch } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeesScreen() {
  const insets = useSafeAreaInsets();

  const [fees, setFees] = useState({
    platformFee: 15,
    deliveryFee: 29,
    serviceFee: 5,
    merchantCommission: 20,
    driverCommission: 80,
  });

  const feeSettings = [
    {
      id: 'platformFee',
      title: 'Platform Fee',
      description: 'Percentage charged on each order',
      value: fees.platformFee,
      unit: '%',
      color: '#C2185B',
    },
    {
      id: 'deliveryFee',
      title: 'Base Delivery Fee',
      description: 'Standard delivery charge per order',
      value: fees.deliveryFee,
      unit: '₱',
      color: '#1976D2',
    },
    {
      id: 'serviceFee',
      title: 'Service Fee',
      description: 'Additional service charge percentage',
      value: fees.serviceFee,
      unit: '%',
      color: '#388E3C',
    },
    {
      id: 'merchantCommission',
      title: 'Merchant Commission',
      description: 'Commission taken from restaurant earnings',
      value: fees.merchantCommission,
      unit: '%',
      color: '#F57C00',
    },
    {
      id: 'driverCommission',
      title: 'Driver Commission',
      description: 'Percentage of delivery fee for drivers',
      value: fees.driverCommission,
      unit: '%',
      color: '#7B1FA2',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.headerTitle}>Fee Management</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Configure platform fees and commissions</ThemedText>
      </ThemedView>

      <View style={styles.summaryCard}>
        <ThemedText style={styles.summaryTitle}>Revenue Breakdown</ThemedText>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Total Orders (Today)</ThemedText>
          <ThemedText style={styles.summaryValue}>156</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Platform Revenue</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: '#388E3C' }]}>₱12,450</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Merchant Earnings</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: '#1976D2' }]}>₱45,600</ThemedText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {feeSettings.map((setting) => (
          <View key={setting.id} style={styles.feeCard}>
            <View style={[styles.feeIcon, { backgroundColor: `${setting.color}15` }]}>
              <IconSymbol size={24} name="fees" color={setting.color} />
            </View>
            
            <View style={styles.feeInfo}>
              <ThemedText style={styles.feeTitle}>{setting.title}</ThemedText>
              <ThemedText style={styles.feeDescription}>{setting.description}</ThemedText>
              
              <View style={styles.feeInputRow}>
                <TextInput 
                  style={styles.feeInput}
                  value={setting.value.toString()}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <ThemedText style={styles.feeUnit}>{setting.unit}</ThemedText>
              </View>
            </View>

            <Switch 
              value={true} 
              trackColor={{ false: '#DDD', true: '#F48FB1' }}
              thumbColor={'#C2185B'}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton}>
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </TouchableOpacity>

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
  summaryCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  feeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  feeInfo: {
    flex: 1,
  },
  feeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  feeDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
  feeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    width: 80,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  feeUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#C2185B',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
