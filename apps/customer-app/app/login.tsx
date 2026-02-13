import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
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

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter both phone number and password');
      return;
    }

    setLoading(true);
    try {
      await login(phone, password);
      // Refresh user context and cart context before navigation
      await Promise.all([refreshProfile(), refreshCart()]);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
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

            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                 <IconSymbol size={20} name="lock.fill" color="#f78734" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
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

            <View style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
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
  termsContainer: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  }
});
