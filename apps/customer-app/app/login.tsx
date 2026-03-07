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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { getFriendlyErrorMessage, login } from '@/api/client';
import { getLegalPolicies, LegalPoliciesConfig } from '@/api/services';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';

const DEFAULT_TERMS_URL = 'https://hatodlegalcenter-production.up.railway.app/terms.html';
const DEFAULT_PRIVACY_URL = 'https://hatodlegalcenter-production.up.railway.app/terms.html';
const REMEMBER_ME_KEY = 'customer_remember_me';

export default function LoginScreen() {
  const router = useRouter();
  const { refreshProfile } = useUser();
  const { refreshCart } = useCart();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [policies, setPolicies] = useState<LegalPoliciesConfig | null>(null);

  useEffect(() => {
    getLegalPolicies().then(setPolicies).catch(() => setPolicies(null));
    AsyncStorage.getItem(REMEMBER_ME_KEY)
      .then((stored) => {
        if (stored === 'true') setRememberMe(true);
        if (stored === 'false') setRememberMe(false);
      })
      .catch(() => {});
  }, []);

  const onToggleRememberMe = () => {
    const next = !rememberMe;
    setRememberMe(next);
    AsyncStorage.setItem(REMEMBER_ME_KEY, String(next)).catch(() => {});
  };

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

  const handleLogin = async () => {
    setPasswordError('');

    if (!phone || !password) {
      setPasswordError('Phone number and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(phone, password, { rememberMe });
      await Promise.all([refreshProfile(), refreshCart()]);
      router.replace('/select-place');
    } catch (error) {
      setPasswordError(
        getFriendlyErrorMessage(error, 'Unable to log in right now. Please try again.'),
      );
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

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.rememberRow} onPress={onToggleRememberMe}>
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

            <View style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                By logging in, you agree to our{' '}
                <ThemedText style={styles.termsLink} onPress={() => openPolicy('terms')}>Terms of Service</ThemedText>
                {' '}and{' '}
                <ThemedText style={styles.termsLink} onPress={() => openPolicy('privacy')}>Privacy Policy</ThemedText>
              </ThemedText>
            </View>
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
    marginBottom: 40,
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
    paddingRight: 10,
  },
  showPasswordButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  showPasswordText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 12,
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
    backgroundColor: '#f78734',
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
});
