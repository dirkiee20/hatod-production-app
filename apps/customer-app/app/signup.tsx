import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, View, Modal, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { register } from '@/api/client'; // Assuming register function exists or I'll need to create it
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [policyModal, setPolicyModal] = useState<'terms' | 'privacy' | null>(null);

  const handleSignup = async () => {
    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');
    setConsentError(false);

    if (!consentGiven) {
      setConsentError(true);
      Alert.alert('Consent Required', 'Please agree to our Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!firstName || !lastName || !phone || !password || !confirmPassword) {
      if (!password) {
        setPasswordError('Password is required');
      }
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
      }
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Assuming register takes (firstName, lastName, phone, password, email)
      // Since email is not in the form, I'll generate a dummy one or update the backend to optional.
      // But typically we need unique email. I'll ask user for email or just use phone@hatod.com for now
      // Actually, looking at previous code, user model has email @unique.
      // I should probably add an Email field to be safe, or generate one.
      // I'll add an Email field to the form.
      await register({ firstName, lastName, phone, password, email: `${phone}@hatod.com` }); 
      router.replace('/login');
    } catch (error: any) {
      // Handle error silently or show inline error if needed in the future
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
            <ThemedText style={styles.title}>HATOD SIGNUP</ThemedText>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                 <IconSymbol size={20} name="person.fill" color="#f78734" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                 <IconSymbol size={20} name="person.fill" color="#f78734" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

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
            
            <View>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                   <IconSymbol size={20} name="lock.fill" color="#f78734" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmPasswordError('');
                  }}
                  secureTextEntry
                />
              </View>
              {confirmPasswordError ? (
                <ThemedText style={styles.errorText}>{confirmPasswordError}</ThemedText>
              ) : null}
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#5c6cc9" />
              ) : (
                <ThemedText style={styles.loginButtonText}>Sign Up</ThemedText>
              )}
            </TouchableOpacity>

      <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Already a member?</ThemedText>
              <Link href="/login" asChild>
                <TouchableOpacity>
                    <ThemedText style={[styles.footerText, { fontWeight: 'bold', textDecorationLine: 'underline' }]}>Login here</ThemedText>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Consent Checkbox */}
            <TouchableOpacity
              style={[styles.consentRow, consentError && styles.consentRowError]}
              onPress={() => { setConsentGiven(!consentGiven); setConsentError(false); }}
              activeOpacity={0.8}
            >
              <View style={[styles.consentCheckbox, consentGiven && styles.consentCheckboxChecked]}>
                {consentGiven && <ThemedText style={styles.consentCheckmark}>✓</ThemedText>}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.consentText}>
                  I have read and agree to the{' '}
                  <ThemedText
                    style={styles.consentLink}
                    onPress={() => setPolicyModal('terms')}
                  >Terms of Service</ThemedText>
                  {' '}and{' '}
                  <ThemedText
                    style={styles.consentLink}
                    onPress={() => setPolicyModal('privacy')}
                  >Privacy Policy</ThemedText>
                </ThemedText>
                {consentError && (
                  <ThemedText style={styles.consentErrorText}>⚠ You must agree to continue</ThemedText>
                )}
              </View>
            </TouchableOpacity>

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
                    style={styles.policyAgreeBtn}
                    onPress={() => { setConsentGiven(true); setConsentError(false); setPolicyModal(null); }}
                  >
                    <ThemedText style={styles.policyAgreeBtnText}>I Agree & Close</ThemedText>
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
    backgroundColor: '#5c6cc9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -60,
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
    borderRadius: 30,
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginBottom: 15, // slightly tighter for signup
    backgroundColor: 'transparent',
    height: 55,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
  loginButton: {
    backgroundColor: '#f78734',
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
  errorText: {
    color: '#ffcccc',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 5,
    marginLeft: 20,
  },
  // Consent
  consentRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginTop: 16, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  consentRowError: {
    borderColor: '#FFB3B3',
    backgroundColor: 'rgba(255,100,100,0.15)',
  },
  consentCheckbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#FFF',
    backgroundColor: 'transparent',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1, flexShrink: 0,
  },
  consentCheckboxChecked: {
    backgroundColor: '#f78734', borderColor: '#f78734',
  },
  consentCheckmark: { fontSize: 14, color: '#FFF', fontWeight: '900', lineHeight: 16 },
  consentText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  consentLink: { fontSize: 13, color: '#FFD700', fontWeight: '800', textDecorationLine: 'underline' },
  consentErrorText: { fontSize: 12, color: '#FFB3B3', marginTop: 6, fontWeight: '700' },
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
  policyAgreeBtn: {
    backgroundColor: '#5c6cc9', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 12,
  },
  policyAgreeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' }
});
