import { StyleSheet, ScrollView, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';

type Step = 'request' | 'waiting' | 'review';

export default function PabiliScreen() {
  const router = useRouter();
  const [items, setItems] = useState<string[]>(['']);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [step, setStep] = useState<Step>('request');
  const [serviceFee, setServiceFee] = useState(0);

  const addItem = () => setItems([...items, '']);
  const updateItem = (text: string, index: number) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (items.some(i => i.trim() === '') || !estimatedPrice) {
      Alert.alert('Missing Info', 'Please list all items and estimated price.');
      return;
    }
    setStep('waiting');
  };

  // Mock function to simulate Admin updating the fee
  const simulateAdminUpdate = () => {
    setServiceFee(50); // Admin sets 50 fee
    setStep('review');
  };

  const handleCheckout = () => {
    // Navigate to checkout or address selection
    // For now, we just show an alert
    Alert.alert('Proceed to Checkout', 'Navigate to address selection...');
  };

  const renderRequestStep = () => (
    <ThemedView style={styles.content}>
        <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>What do you need?</ThemedText>
            {items.map((item, index) => (
                <TextInput
                    key={index}
                    style={styles.input}
                    placeholder={`Item #${index + 1} (e.g. 1kg Rice)`}
                    value={item}
                    onChangeText={(text) => updateItem(text, index)}
                />
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <IconSymbol name="add" size={20} color="#C2185B" />
                <ThemedText style={styles.addButtonText}>Add another item</ThemedText>
            </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
             <ThemedText style={styles.sectionTitle}>Estimated Total Price</ThemedText>
             <ThemedText style={styles.sectionSubtitle}>This helps riders prepare enough cash.</ThemedText>
             <TextInput
                style={styles.input}
                placeholder="₱ 0.00"
                keyboardType="numeric"
                value={estimatedPrice}
                onChangeText={setEstimatedPrice}
             />
             
             {/* Read-only Service Fee field initially */}
             <ThemedText style={[styles.sectionSubtitle, {marginTop: 10}]}>Service Fee (To be added via admin call)</ThemedText>
             <TextInput
                style={[styles.input, { backgroundColor: '#EEE', color: '#999' }]}
                placeholder="--.--"
                editable={false}
             />
        </ThemedView>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <ThemedText style={styles.submitButtonText}>Submit Request</ThemedText>
        </TouchableOpacity>
    </ThemedView>
  );

  const renderWaitingStep = () => (
    <ThemedView style={[styles.content, { alignItems: 'center', paddingTop: 60 }]}>
        <ActivityIndicator size="large" color="#FB8C00" style={{ marginBottom: 20 }} />
        <ThemedText style={styles.waitingTitle}>Request Submitted!</ThemedText>
        <ThemedText style={styles.waitingSubtitle}>
          Please wait for our admin to call you to confirm the service details and fee.
        </ThemedText>
        <ThemedText style={styles.waitingSubtitle}>Do not close this app.</ThemedText>

        {/* SIMULATION BUTTON - Remove in production */}
        <TouchableOpacity style={styles.simButton} onPress={simulateAdminUpdate}>
             <ThemedText style={styles.simButtonText}>[DEV: Simulate Admin Call]</ThemedText>
        </TouchableOpacity>
    </ThemedView>
  );

  const renderReviewStep = () => {
    const estTotal = parseFloat(estimatedPrice) || 0;
    const finalTotal = estTotal + serviceFee;

    return (
        <ThemedView style={styles.content}>
            <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
                
                <View style={styles.row}>
                    <ThemedText>Est. Item Cost</ThemedText>
                    <ThemedText>₱{estTotal.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.row}>
                    <ThemedText>Service Fee</ThemedText>
                    <ThemedText style={{ color: '#C2185B', fontWeight: 'bold' }}>₱{serviceFee.toFixed(2)}</ThemedText>
                </View>
                <View style={[styles.row, styles.totalRow]}>
                    <ThemedText style={styles.totalText}>Total Estimate</ThemedText>
                    <ThemedText style={styles.totalText}>₱{finalTotal.toFixed(2)}</ThemedText>
                </View>
            </ThemedView>

            <TouchableOpacity style={styles.submitButton} onPress={handleCheckout}>
                <ThemedText style={styles.submitButtonText}>Proceed to Checkout</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
             <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
               <IconSymbol name="chevron.right" size={28} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
             </TouchableOpacity>
            <ThemedView>
              <ThemedText style={styles.headerTitle}>We Buy For You</ThemedText>
              <ThemedText style={styles.headerSubtitle}>List what you need, we'll find it.</ThemedText>
            </ThemedView>
        </ThemedView>

        {step === 'request' && renderRequestStep()}
        {step === 'waiting' && renderWaitingStep()}
        {step === 'review' && renderReviewStep()}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#FB8C00',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#C2185B',
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#FB8C00',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#FB8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 5,
  },
  simButton: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#EEE',
    borderRadius: 8,
  },
  simButtonText: {
    fontSize: 12,
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  }
});
