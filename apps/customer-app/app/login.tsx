import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, View, Modal } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { login } from '@/api/client';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';

export default function LoginScreen() {
  const router = useRouter();
  const { refreshProfile } = useUser();
  const { refreshCart } = useCart();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [policyModal, setPolicyModal] = useState<'terms' | 'privacy' | null>(null);

  const handleLogin = async () => {
    // Clear previous errors
    setPasswordError('');

    if (!phone || !password) {
      if (!password) {
        setPasswordError('Password is required');
      }
      return;
    }

    setLoading(true);
    try {
      await login(phone, password);
      // Refresh user context and cart context before navigation
      await Promise.all([refreshProfile(), refreshCart()]);
      router.replace('/(tabs)');
    } catch (error: any) {
      setPasswordError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
               <Image 
                 source={require('@/assets/images/hatod-logo.png')} 
                 style={styles.logoImage} 
                 resizeMode="contain"
               />
            </View>
            <ThemedText style={styles.title}>HATOD LOGIN</ThemedText>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                 <IconSymbol size={20} name="phone" color="#f78734" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="0912 345 6789"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={11}
              />
            </View>

            <View>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                   <IconSymbol size={20} name="lock.fill" color="#f78734" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                  }}
                  secureTextEntry
                />
              </View>
              {passwordError ? (
                <ThemedText style={styles.errorText}>{passwordError}</ThemedText>
              ) : null}
            </View>

            <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <IconSymbol name="checkmark" size={12} color="#f78734" />}
                    </View>
                    <ThemedText style={styles.optionText}>Remember me</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity>
                   <ThemedText style={[styles.optionText, { textDecorationLine: 'underline' }]}>Forget password?</ThemedText>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#5c6cc9" />
              ) : (
                <ThemedText style={styles.loginButtonText}>Login</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Not a member?</ThemedText>
              <Link href="/signup" asChild>
                <TouchableOpacity style={styles.signupButton}>
                    <ThemedText style={styles.signupButtonText}>Create account</ThemedText>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Tappable Consent Notice */}
            <View style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                By logging in, you agree to our{' '}
                <ThemedText style={styles.termsLink} onPress={() => setPolicyModal('terms')}>Terms of Service</ThemedText>
                {' '}and{' '}
                <ThemedText style={styles.termsLink} onPress={() => setPolicyModal('privacy')}>Privacy Policy</ThemedText>
              </ThemedText>
            </View>

            {/* Policy Modal */}
            <Modal visible={!!policyModal} transparent animationType="slide" onRequestClose={() => setPolicyModal(null)}>
              <View style={styles.policyOverlay}>
                <View style={styles.policySheet}>
                  <View style={styles.policyHeader}>
                    <ThemedText style={styles.policyTitle}>
                      {policyModal === 'terms' ? '📄 Terms of Service' : '🔒 Privacy Policy'}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setPolicyModal(null)} style={styles.policyClose}>
                      <ThemedText style={{ fontSize: 16, color: '#666', fontWeight: '700' }}>✕</ThemedText>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {policyModal === 'terms' ? (
                      <ThemedText style={styles.policyBody}>
                        {`HATOD TERMS OF SERVICE\n\nEffective Date: February 2026\n\n1. ACCEPTANCE OF TERMS\nBy creating an account and using the HATOD app, you agree to be bound by these Terms of Service.\n\n2. USE OF SERVICE\nHATOD provides an on-demand delivery platform connecting customers with merchants and riders. You must be at least 18 years old to use this service.\n\n3. ACCOUNT RESPONSIBILITY\nYou are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use.\n\n4. ORDERS AND PAYMENTS\nAll orders placed through HATOD are subject to merchant availability. Prices displayed are set by merchants and may vary.\n\n5. DELIVERY\nDelivery times are estimates and may vary based on demand, weather, and other factors. HATOD is not liable for delays outside its reasonable control.\n\n6. CANCELLATIONS\nOrders may be cancelled prior to merchant acceptance. Once accepted and being prepared, cancellations may not be possible.\n\n7. PROHIBITED CONDUCT\nYou agree not to misuse the platform, submit fraudulent orders, or engage in any conduct that disrupts the service.\n\n8. MODIFICATIONS\nHATOD reserves the right to modify these Terms at any time. Continued use of the service constitutes acceptance of the revised Terms.\n\n9. GOVERNING LAW\nThese Terms are governed by the laws of the Republic of the Philippines.\n\nFor questions, contact us at support@hatod.app`}
                      </ThemedText>
                    ) : (
                      <ThemedText style={styles.policyBody}>
                        {`HATOD PRIVACY POLICY\n\nEffective Date: February 2026\n\n1. INFORMATION WE COLLECT\nWe collect information you provide when registering: name, phone number, and delivery addresses. We also collect order history and usage data.\n\n2. HOW WE USE YOUR INFORMATION\n• To process and fulfill your orders\n• To communicate order status and updates\n• To improve our services\n• To comply with legal obligations\n\n3. DATA SHARING\nWe share your information with:\n• Merchants — to fulfill your orders\n• Riders — for delivery purposes (name and delivery address only)\n• Payment processors — for transaction processing\n\nWe do NOT sell your personal data to third parties.\n\n4. DATA RETENTION\nWe retain your data for as long as your account is active or as required by law.\n\n5. YOUR RIGHTS\nUnder the Philippine Data Privacy Act of 2012 (R.A. 10173), you have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Request erasure of your data\n• Object to processing\n\n6. DATA SECURITY\nWe implement appropriate technical and organizational measures to protect your personal data against unauthorized access.\n\n7. CONTACT US\nFor privacy concerns, contact our Data Protection Officer at privacy@hatod.app`}
                      </ThemedText>
                    )}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.policyCloseBtn}
                    onPress={() => setPolicyModal(null)}
                  >
                    <ThemedText style={styles.policyCloseBtnText}>Close</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5c6cc9', // Splash screen color
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -60, // Pull text closer to image
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    borderRadius: 30, // Pill shape
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginBottom: 20,
    backgroundColor: 'transparent',
    height: 60,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    height: '100%',
    paddingRight: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#FFF',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FFF',
  },
  optionText: {
    color: '#FFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#f78734', // Orange accent
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#f78734',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 10,
    opacity: 0.9,
  },
  signupButton: {
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  signupButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: '#ffcccc',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    marginLeft: 20,
  },
  termsContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  termsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#FFD700',
    fontWeight: '800',
    textDecorationLine: 'underline',
    fontSize: 12,
  },
  // Policy Modal
  policyOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  policySheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  policyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  policyTitle: { fontSize: 18, fontWeight: '900', color: '#222', flex: 1 },
  policyClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  policyBody: { fontSize: 13, color: '#444', lineHeight: 22, paddingBottom: 20 },
  policyCloseBtn: {
    backgroundColor: '#5c6cc9', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 12,
  },
  policyCloseBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' }
});
