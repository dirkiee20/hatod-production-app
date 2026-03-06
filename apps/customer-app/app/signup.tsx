import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import Constants from 'expo-constants';
import { ThemedText } from '@/components/themed-text';
import { register } from '@/api/client';
import { getLegalPolicies, LegalPoliciesConfig } from '@/api/services';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PRIVACY_POLICY_VERSION, TERMS_OF_SERVICE_VERSION } from '@/constants/legal';

const DEFAULT_TERMS_URL = 'https://hatodlegalcenter-production.up.railway.app/terms.html';
const DEFAULT_PRIVACY_URL = 'https://hatodlegalcenter-production.up.railway.app/terms.html';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [policies, setPolicies] = useState<LegalPoliciesConfig | null>(null);

  const LEGAL_FETCH_TIMEOUT_MS = 8000;

  useEffect(() => {
    getLegalPolicies().then(setPolicies).catch(() => setPolicies(null));
  }, []);

  const openPolicy = async (type: 'terms' | 'privacy') => {
    const url = type === 'terms'
      ? (policies?.termsUrl || DEFAULT_TERMS_URL)
      : (policies?.privacyUrl || DEFAULT_PRIVACY_URL);

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const handleSignup = async () => {
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
      let termsVersion = policies?.termsVersion ?? TERMS_OF_SERVICE_VERSION;
      let privacyVersion = policies?.privacyVersion ?? PRIVACY_POLICY_VERSION;

      if (!policies) {
        try {
          const fetched = await Promise.race([
            getLegalPolicies(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), LEGAL_FETCH_TIMEOUT_MS)),
          ]);
          if (fetched) {
            termsVersion = fetched.termsVersion ?? TERMS_OF_SERVICE_VERSION;
            privacyVersion = fetched.privacyVersion ?? PRIVACY_POLICY_VERSION;
          }
        } catch {
          // keep fallback versions
        }
      }

      await register({
        firstName,
        lastName,
        phone,
        password,
        email: `${phone}@hatod.com`,
        consentGiven: true,
        termsOfServiceVersion: termsVersion,
        privacyPolicyVersion: privacyVersion,
        consentAcceptedAt: new Date().toISOString(),
        consentAppVersion: Constants.expoConfig?.version ?? 'unknown',
      });
      router.replace('/login');
    } catch (error: any) {
      const message =
        error?.message?.trim?.() ||
        'Signup failed. Please check your internet connection and try again.';
      Alert.alert('Signup Failed', message);
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
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.showPasswordButton}>
                  <ThemedText style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</ThemedText>
                </TouchableOpacity>
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
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.showPasswordButton}>
                  <ThemedText style={styles.showPasswordText}>{showConfirmPassword ? 'Hide' : 'Show'}</ThemedText>
                </TouchableOpacity>
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
                  <ThemedText style={[styles.footerText, { fontWeight: 'bold', textDecorationLine: 'underline' }]}>
                    Login here
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity
              style={[styles.consentRow, consentError && styles.consentRowError]}
              onPress={() => {
                setConsentGiven(!consentGiven);
                setConsentError(false);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.consentCheckbox, consentGiven && styles.consentCheckboxChecked]}>
                {consentGiven && <IconSymbol size={14} name="checkmark" color="#FFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.consentText}>
                  I have read and agree to the{' '}
                  <ThemedText style={styles.consentLink} onPress={() => openPolicy('terms')}>
                    Terms of Service
                  </ThemedText>
                  {' '}and{' '}
                  <ThemedText style={styles.consentLink} onPress={() => openPolicy('privacy')}>
                    Privacy Policy
                  </ThemedText>
                </ThemedText>
                {consentError && (
                  <ThemedText style={styles.consentErrorText}>You must agree to continue</ThemedText>
                )}
              </View>
            </TouchableOpacity>
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
    marginBottom: 15,
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
    paddingRight: 10,
  },
  showPasswordButton: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  showPasswordText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  consentRowError: {
    borderColor: '#FFB3B3',
    backgroundColor: 'rgba(255,100,100,0.15)',
  },
  consentCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  consentCheckboxChecked: {
    backgroundColor: '#f78734',
    borderColor: '#f78734',
  },
  consentText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  consentLink: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  consentErrorText: {
    fontSize: 12,
    color: '#FFB3B3',
    marginTop: 6,
    fontWeight: '700',
  },
});
