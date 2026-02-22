import { StyleSheet, ScrollView, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useEffect } from 'react';
import { createPabiliRequest } from '../../api/services';
import { useSocket } from '@/context/SocketContext';

type Step = 'request' | 'waiting' | 'review';

export default function PabiliScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const [items, setItems] = useState<string[]>(['']);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [step, setStep] = useState<Step>('request');
  const [serviceFee, setServiceFee] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleQuote = (updatedRequest: any) => {
      if (updatedRequest.id === requestId) {
        setServiceFee(updatedRequest.serviceFee);
        setStep('review');
      }
    };
    
    socket.on('pabili_request_quoted', handleQuote);
    return () => {
       socket.off('pabili_request_quoted', handleQuote);
    };
  }, [socket, requestId]);

  const addItem = () => setItems([...items, '']);
  const updateItem = (text: string, index: number) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
  };
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.trim() !== '');
    if (validItems.length === 0 || !estimatedPrice) {
      Alert.alert('Missing Info', 'Please list at least one item and estimated price.');
      return;
    }
    
    setIsSubmitting(true);
    try {
       const req = await createPabiliRequest(validItems, parseFloat(estimatedPrice));
       setRequestId(req.id);
       setStep('waiting');
    } catch (error) {
       Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleCheckout = () => {
    Alert.alert('Proceed to Checkout', 'Navigate to address selection...');
  };

  const renderRequestStep = () => (
    <View style={styles.stepContainer}>
      <ThemedView style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <IconSymbol name="pabili" size={22} color="#F57C00" />
          <ThemedText style={styles.cardTitle}>Shopping List</ThemedText>
        </View>
        <ThemedText style={styles.cardSubtitle}>List exactly what you need us to buy</ThemedText>
        
        <View style={styles.divider} />

        {items.map((item, index) => (
          <View key={index} style={styles.inputWrapper}>
             <View style={styles.bulletPoint} />
             <TextInput
                style={styles.inputItem}
                placeholder={`Item ${index + 1} (e.g. 1kg Rice)`}
                placeholderTextColor="#A0AAB5"
                value={item}
                onChangeText={(text) => updateItem(text, index)}
             />
             {items.length > 1 && (
               <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(index)}>
                 <IconSymbol name="trash.fill" size={18} color="#FF5252" />
               </TouchableOpacity>
             )}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <View style={styles.addIconCircle}>
              <IconSymbol name="add" size={16} color="#F57C00" />
            </View>
            <ThemedText style={styles.addButtonText}>Add another item</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.card}>
         <View style={styles.cardHeaderRow}>
            <IconSymbol name="cart" size={22} color="#F57C00" />
            <ThemedText style={styles.cardTitle}>Estimated Budget</ThemedText>
         </View>
         <ThemedText style={styles.cardSubtitle}>This helps our riders prepare enough cash.</ThemedText>
         
         <View style={styles.priceInputContainer}>
            <ThemedText style={styles.currencySymbol}>₱</ThemedText>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor="#A0AAB5"
              keyboardType="numeric"
              value={estimatedPrice}
              onChangeText={setEstimatedPrice}
            />
         </View>
         
         {/* Read-only Service Fee field initially */}
         <View style={styles.feeInfoBox}>
            <IconSymbol name="government" size={16} color="#78909C" />
            <ThemedText style={styles.feeInfoText}>Service Fee will be calculated by our admin after reviewing your request.</ThemedText>
         </View>
      </ThemedView>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.8} disabled={isSubmitting}>
          {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
          ) : (
             <>
                 <ThemedText style={styles.primaryButtonText}>Submit Request</ThemedText>
                 <IconSymbol name="chevron.right" size={20} color="#FFF" />
             </>
          )}
      </TouchableOpacity>
    </View>
  );

  const renderWaitingStep = () => (
    <View style={styles.stepContainer}>
      <ThemedView style={styles.waitingCard}>
          <View style={styles.spinnerWrapper}>
             <ActivityIndicator size="large" color="#F57C00" />
          </View>
          <ThemedText style={styles.waitingTitle}>Request Submitted 🎉</ThemedText>
          <ThemedText style={styles.waitingSubtitle}>
            Please wait while our admin reviews your list to calculate the precise service fee.
          </ThemedText>
          
          <View style={styles.waitingTipBox}>
             <IconSymbol name="phone" size={20} color="#F57C00" />
             <ThemedText style={styles.waitingTipText}>We may call you if we need clarification. Keep your app open.</ThemedText>
          </View>
      </ThemedView>
    </View>
  );

  const renderReviewStep = () => {
    const estTotal = parseFloat(estimatedPrice) || 0;
    const finalTotal = estTotal + serviceFee;

    return (
        <View style={styles.stepContainer}>
            <ThemedView style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                   <IconSymbol name="pabili" size={28} color="#F57C00" />
                   <ThemedText style={styles.receiptTitle}>Order Summary</ThemedText>
                   <ThemedText style={styles.receiptId}>ORDER #{(Math.random() * 100000).toFixed(0)}</ThemedText>
                </View>

                <View style={styles.dottedDivider} />
                
                <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Estimated Item Cost</ThemedText>
                    <ThemedText style={styles.receiptValue}>₱{estTotal.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Service Fee</ThemedText>
                    <View style={styles.feeHighlight}>
                       <ThemedText style={styles.feeHighlightText}>₱{serviceFee.toFixed(2)}</ThemedText>
                    </View>
                </View>

                <View style={styles.dottedDivider} />

                <View style={[styles.receiptRow, { marginBottom: 0 }]}>
                    <ThemedText style={styles.totalText}>Total Estimate</ThemedText>
                    <ThemedText style={styles.totalAmount}>₱{finalTotal.toFixed(2)}</ThemedText>
                </View>
            </ThemedView>

            <TouchableOpacity style={styles.primaryButton} onPress={handleCheckout} activeOpacity={0.8}>
                <ThemedText style={styles.primaryButtonText}>Proceed to Checkout</ThemedText>
                <IconSymbol name="chevron.right" size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        
        <ThemedView style={styles.header}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800' }} 
              style={styles.headerImage} 
            />
            <View style={styles.headerOverlay} />
            
            <View style={styles.headerSafeArea}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <IconSymbol name="chevron.right" size={24} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
              
              <View style={styles.headerTextContainer}>
                <ThemedText style={styles.headerTitle}>We Buy For You</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Your personal shopper for anything you need.</ThemedText>
              </View>
            </View>
        </ThemedView>

        {step === 'request' && renderRequestStep()}
        {step === 'waiting' && renderWaitingStep()}
        {step === 'review' && renderReviewStep()}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    height: 240,
    position: 'relative',
    backgroundColor: '#F57C00',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 124, 0, 0.8)', // Orange vibrant overlay
  },
  headerSafeArea: {
    paddingTop: 60,
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginTop: 'auto',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 6,
    fontWeight: '500',
  },
  stepContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A3037',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#78909C',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F57C00',
    marginRight: 12,
  },
  inputItem: {
    flex: 1,
    backgroundColor: '#F5F7F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2A3037',
    fontWeight: '500',
  },
  removeBtn: {
    padding: 10,
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addButtonText: {
    color: '#F57C00',
    fontWeight: '700',
    fontSize: 15,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A3037',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A3037',
    paddingVertical: 16,
  },
  feeInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  feeInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#546E7A',
    marginLeft: 10,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#F57C00',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 18,
    marginTop: 10,
    shadowColor: '#F57C00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
  },
  waitingCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    marginTop: 20,
  },
  spinnerWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2A3037',
    marginBottom: 12,
  },
  waitingSubtitle: {
    fontSize: 15,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  waitingTipBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  waitingTipText: {
    flex: 1,
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
    marginLeft: 12,
    lineHeight: 20,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F57C00',
  },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2A3037',
    marginTop: 12,
    marginBottom: 4,
  },
  receiptId: {
    fontSize: 12,
    color: '#A0AAB5',
    fontWeight: '700',
    letterSpacing: 1,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 1,
    width: '100%',
    marginVertical: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptLabel: {
    fontSize: 15,
    color: '#546E7A',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 16,
    color: '#2A3037',
    fontWeight: '700',
  },
  feeHighlight: {
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  feeHighlightText: {
    color: '#C2185B',
    fontWeight: '800',
    fontSize: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A3037',
  }
});
