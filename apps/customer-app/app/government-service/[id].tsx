import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function GovernmentServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock data for the specific service
  const service = {
    id: id,
    name: 'PSA Birth Certificate',
    type: 'Document',
    fee: 150,
    deliveryFee: 50,
    process: '2-3 Working Days',
    color: '#E65100',
  };

  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    purpose: '',
    address: '',
    notes: '',
  });

  const totalFee = service.fee + service.deliveryFee;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Service Details</ThemedText>
        <View style={{ width: 40 }} />
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Service Summary Card */}
        <ThemedView style={styles.summaryCard}>
          <ThemedView style={[styles.iconBox, { backgroundColor: service.color + '15' }]}>
            <IconSymbol size={24} name="government" color={service.color} />
          </ThemedView>
          <ThemedView style={styles.summaryInfo}>
            <ThemedText style={styles.serviceName}>{service.name}</ThemedText>
            <ThemedView style={styles.metaRow}>
              <ThemedText style={styles.metaText}>{service.process}</ThemedText>
              <ThemedText style={styles.metaDivider}>•</ThemedText>
              <ThemedText style={styles.metaText}>{service.type}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Form Sections */}
        <ThemedView style={styles.formContainer}>
          <ThemedText style={styles.sectionTitle}>Requester Information</ThemedText>
          
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Full Name (as it appears on records)</ThemedText>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter full name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Date of Birth</ThemedText>
            <TextInput 
              style={styles.textInput}
              placeholder="MM/DD/YYYY"
              value={formData.birthDate}
              onChangeText={(text) => setFormData({...formData, birthDate: text})}
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Purpose of Request</ThemedText>
            <TextInput 
              style={styles.textInput}
              placeholder="e.g. Passport Application, Employment"
              value={formData.purpose}
              onChangeText={(text) => setFormData({...formData, purpose: text})}
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedText style={styles.sectionTitle}>Delivery Details</ThemedText>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Full Delivery Address</ThemedText>
            <TextInput 
              style={[styles.textInput, styles.textArea]}
              placeholder="Unit/House No, Street, Brgy, City"
              value={formData.address}
              onChangeText={(text) => setFormData({...formData, address: text})}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Additional Notes (Optional)</ThemedText>
            <TextInput 
              style={[styles.textInput, styles.textArea]}
              placeholder="Any specific instructions for the courier?"
              value={formData.notes}
              onChangeText={(text) => setFormData({...formData, notes: text})}
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.warningBox}>
          <ThemedText style={styles.warningText}>
            Note: We only handle the pickup and delivery of your documents. You are responsible for ensuring all government fees are paid and requirements are met.
          </ThemedText>
        </ThemedView>

        <ThemedView style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <ThemedView style={styles.footer}>
        <ThemedView style={styles.priceContainer}>
          <ThemedText style={styles.priceLabel}>Total Service Fee</ThemedText>
          <ThemedText style={styles.priceAmount}>₱{totalFee.toFixed(2)}</ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/cart')}>
          <ThemedText style={styles.submitBtnText}>Proceed to Checkout</ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 25,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  metaDivider: {
    marginHorizontal: 6,
    color: '#DDD',
  },
  formContainer: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
    marginTop: 10,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 48,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFF',
  },
  textArea: {
    height: 'auto',
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  warningBox: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFECC0',
    marginTop: 10,
  },
  warningText: {
    fontSize: 11,
    color: '#856404',
    lineHeight: 16,
    fontWeight: '500',
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
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  priceLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#5c6cc9',
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 180,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
