import { StyleSheet, ScrollView, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { getGovMerchant } from '@/api/services';
import type { Merchant } from '@/api/types';

export default function BusinessPermitScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [govMerchantId, setGovMerchantId] = useState<string | null>(null);
  const [govMenuItemId, setGovMenuItemId] = useState<string | null>(null);
  const [govMenuItemPrice, setGovMenuItemPrice] = useState<number>(0);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [binPermitNo, setBinPermitNo] = useState('');
  const [renewalOrNew, setRenewalOrNew] = useState('');
  const [lgu, setLgu] = useState('Claver BPLO');

  // Fetch gov merchant on mount
  useEffect(() => {
    const fetchGovMerchant = async () => {
      try {
        const merchant: Merchant | null = await getGovMerchant();
        if (merchant) {
          setGovMerchantId(merchant.id);
          // Look for a Business Permit menu item in the categories
          if (merchant.categories && merchant.categories.length > 0) {
            for (const category of merchant.categories) {
              const permitItem = (category as any).menuItems?.find(
                (item: any) => item.name.toLowerCase().includes('permit') || item.name.toLowerCase().includes('business')
              );
              if (permitItem) {
                setGovMenuItemId(permitItem.id);
                setGovMenuItemPrice(permitItem.price ?? 0);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch gov merchant:', err);
        Alert.alert('Error', 'Unable to load government services. Please try again later.');
      }
    };
    fetchGovMerchant();
  }, []);

  const handleSubmit = async () => {
    if (!companyName.trim() || !binPermitNo.trim() || !renewalOrNew.trim() || !lgu.trim()) {
      Alert.alert('Missing Info', 'Please fill up all required fields.');
      return;
    }

    if (!govMerchantId || !govMenuItemId) {
      Alert.alert('Error', 'Government services are not available. Please try again later.');
      return;
    }
    
    setIsSubmitting(true);
    try {
       const options = {
         'Company Name': companyName,
         'BIN Permit No.': binPermitNo,
         'Renewal/New': renewalOrNew,
         'LGU': lgu
       };

       await addToCart({
         id: Date.now().toString(),
         menuItemId: govMenuItemId,
         merchantId: govMerchantId,
         name: 'Business Permit',
         price: govMenuItemPrice,
         quantity: 1,
         options: options,
         totalPrice: govMenuItemPrice,
       });

       router.push('/(tabs)/cart');
    } catch (err) {
       console.error('Failed to add to cart:', err);
       Alert.alert('Error', 'Failed to add to cart. Please try again.');
    } finally {
       setIsSubmitting(false);
    }
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
                <ThemedText style={styles.feeInfoText}>Our service fee will be calculated based on your delivery distance automatically upon checkout.</ThemedText>
            </View>
          </ThemedView>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.8} disabled={isSubmitting}>
              {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
              ) : (
                 <>
                     <ThemedText style={styles.primaryButtonText}>Continue to Checkout</ThemedText>
                     <IconSymbol name="chevron.right" size={18} color="#FFF" />
                 </>
              )}
          </TouchableOpacity>
        </View>

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
  }
});

