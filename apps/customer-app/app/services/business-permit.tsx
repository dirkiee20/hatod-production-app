import { StyleSheet, ScrollView, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useEffect } from 'react';
import { createPabiliRequest } from '../../api/services';
import { useSocket } from '@/context/SocketContext';

type Step = 'request' | 'waiting' | 'review';

export default function BusinessPermitScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const [step, setStep] = useState<Step>('request');
  const [serviceFee, setServiceFee] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [binPermitNo, setBinPermitNo] = useState('');
  const [renewalOrNew, setRenewalOrNew] = useState('');
  const [lgu, setLgu] = useState('Claver BPLO');

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

  const handleSubmit = async () => {
    if (!companyName.trim() || !binPermitNo.trim() || !renewalOrNew.trim() || !lgu.trim()) {
      Alert.alert('Missing Info', 'Please fill up all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    try {
       const formArr = [
         `Service: Business Permit`,
         `Company Name: ${companyName}`,
         `BIN Permit No.: ${binPermitNo}`,
         `Renewal/New (DTI/Business Name): ${renewalOrNew}`,
         `LGU: ${lgu}`
       ];
       // Since it's a permit, estimated item cost might be 0 or small base fee, lets use 0
       const req = await createPabiliRequest(formArr, 0); 
       setRequestId(req.id);
       setStep('waiting');
    } catch (error) {
       Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleCheckout = () => {
    // Navigating back or specific receipt page for now we just alert
    Alert.alert('Proceed to Checkout', 'Navigate to address selection...', [
      { text: 'OK', onPress: () => router.push('/(tabs)') }
    ]);
  };

  const renderRequestStep = () => (
    <View style={styles.stepContainer}>
      <ThemedView style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <IconSymbol name="government" size={22} color="#1565C0" />
          <ThemedText style={styles.cardTitle}>Application Form</ThemedText>
        </View>
        <ThemedText style={styles.cardSubtitle}>Please provide all required business details.</ThemedText>
        
        <View style={styles.divider} />

        <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>1. Company Name <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
            <TextInput
            style={styles.inputItem}
            placeholder="e.g. Hatod Delivery"
            placeholderTextColor="#A0AAB5"
            value={companyName}
            onChangeText={setCompanyName}
            />
        </View>

        <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>2. BIN Permit No. <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
            <TextInput
            style={styles.inputItem}
            placeholder="e.g. 1234-5678"
            placeholderTextColor="#A0AAB5"
            value={binPermitNo}
            onChangeText={setBinPermitNo}
            />
        </View>

        <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>3. Renewal / New (DTI or Business Name) <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
            <TextInput
            style={styles.inputItem}
            placeholder="e.g. New - Hatod Delivery"
            placeholderTextColor="#A0AAB5"
            value={renewalOrNew}
            onChangeText={setRenewalOrNew}
            />
        </View>

        <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>4. Government LGU <ThemedText style={styles.asterisk}>*</ThemedText></ThemedText>
            <TextInput
            style={styles.inputItem}
            placeholder="e.g. Claver BPLO"
            placeholderTextColor="#A0AAB5"
            value={lgu}
            onChangeText={setLgu}
            />
        </View>

        <View style={styles.feeInfoBox}>
            <IconSymbol name="info.circle.fill" size={16} color="#78909C" />
            <ThemedText style={styles.feeInfoText}>Service Fee will properly be calculated by our admin after reviewing your requirements.</ThemedText>
        </View>
      </ThemedView>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.8} disabled={isSubmitting}>
          {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
          ) : (
             <>
                 <ThemedText style={styles.primaryButtonText}>Submit Application</ThemedText>
                 <IconSymbol name="paperplane.fill" size={18} color="#FFF" />
             </>
          )}
      </TouchableOpacity>
    </View>
  );

  const renderWaitingStep = () => (
    <View style={styles.stepContainer}>
      <ThemedView style={styles.waitingCard}>
          <View style={styles.spinnerWrapper}>
             <ActivityIndicator size="large" color="#1565C0" />
          </View>
          <ThemedText style={styles.waitingTitle}>Application Submitted</ThemedText>
          <ThemedText style={styles.waitingSubtitle}>
            Please wait while our admin reviews your business permit details. We will calculate your processing fee shortly.
          </ThemedText>
          
          <View style={styles.waitingTipBox}>
             <IconSymbol name="phone" size={20} color="#1565C0" />
             <ThemedText style={styles.waitingTipText}>We will call you if we need clarification. Keep your app open.</ThemedText>
          </View>
      </ThemedView>
    </View>
  );

  const renderReviewStep = () => {
    return (
        <View style={styles.stepContainer}>
            <ThemedView style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                   <IconSymbol name="government" size={28} color="#1565C0" />
                   <ThemedText style={styles.receiptTitle}>Document Summary</ThemedText>
                   <ThemedText style={styles.receiptId}>APP-{(Math.random() * 100000).toFixed(0)}</ThemedText>
                </View>

                <View style={styles.dottedDivider} />
                
                <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Processing Fee (Permit)</ThemedText>
                    <ThemedText style={styles.receiptValue}>TBD</ThemedText>
                </View>
                <View style={styles.receiptRow}>
                    <ThemedText style={styles.receiptLabel}>Our Service Fee</ThemedText>
                    <View style={styles.feeHighlight}>
                       <ThemedText style={styles.feeHighlightText}>₱{serviceFee.toFixed(2)}</ThemedText>
                    </View>
                </View>

                <View style={styles.dottedDivider} />

                <View style={[styles.receiptRow, { marginBottom: 0 }]}>
                    <ThemedText style={styles.totalText}>Amount to Pay Now</ThemedText>
                    <ThemedText style={styles.totalAmount}>₱{serviceFee.toFixed(2)}</ThemedText>
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
              source={{ uri: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800' }} 
              style={styles.headerImage} 
            />
            <View style={styles.headerOverlay} />
            
            <View style={styles.headerSafeArea}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <IconSymbol name="chevron.right" size={24} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
              
              <View style={styles.headerTextContainer}>
                <ThemedText style={styles.headerTitle}>Business Permits</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Fast-track your business document processing.</ThemedText>
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
    height: 180,
    position: 'relative',
    backgroundColor: '#1565C0',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 101, 192, 0.85)',
  },
  headerSafeArea: {
    paddingTop: 50,
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'space-between',
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
    fontWeight: '500',
  },
  stepContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#2A3037',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#78909C',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  asterisk: {
    color: '#5c6cc9',
  },
  inputItem: {
    backgroundColor: '#F5F7F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2A3037',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feeInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  feeInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#546E7A',
    marginLeft: 10,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#1565C0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  waitingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 16,
  },
  spinnerWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A3037',
    marginBottom: 8,
  },
  waitingSubtitle: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  waitingTipBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  waitingTipText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '600',
    marginLeft: 12,
    lineHeight: 20,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1565C0',
  },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A3037',
    marginTop: 8,
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
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 15,
    color: '#2A3037',
    fontWeight: 'bold',
  },
  feeHighlight: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  feeHighlightText: {
    color: '#1565C0',
    fontWeight: '800',
    fontSize: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2A3037',
  }
});
