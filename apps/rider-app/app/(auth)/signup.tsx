import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { register } from '@/api/client';
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

  const handleSignup = async () => {
    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');

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
      await register({ firstName, lastName, phone, password, email: `${phone}@hatod.com` }); 
      router.replace('/(auth)/login');
    } catch (error: any) {
      // Handle error silently or show inline error if needed in the future
      console.error(error);
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
            <ThemedText style={styles.title}>RIDER SIGNUP</ThemedText>
            <ThemedText style={styles.subtitle}>Join as Partner</ThemedText>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                 <IconSymbol size={20} name="person.fill" color="#C2185B" />
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
                 <IconSymbol size={20} name="person.fill" color="#C2185B" />
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
                 <IconSymbol size={20} name="phone" color="#C2185B" />
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
                   <IconSymbol size={20} name="lock.fill" color="#C2185B" />
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
                   <IconSymbol size={20} name="lock.fill" color="#C2185B" />
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
                <ActivityIndicator color="#C2185B" />
              ) : (
                <ThemedText style={styles.loginButtonText}>Sign Up</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Already a partner?</ThemedText>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                    <ThemedText style={[styles.footerText, { fontWeight: 'bold', textDecorationLine: 'underline' }]}>Login here</ThemedText>
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
    backgroundColor: '#C2185B',
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
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -20,
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
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
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
    paddingRight: 20,
  },
  loginButton: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#C2185B',
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
  termsContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  termsText: {
    color: '#FFF',
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorText: {
    color: '#ffcccc',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 5,
    marginLeft: 20,
  }
});
