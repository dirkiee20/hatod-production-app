 import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      // navigation handled in context usually or here
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login failed', error.message || 'Check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <View style={styles.formContainer}>
        <View style={styles.header}>
            <Image 
                source={require('@/assets/images/hatod-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>Sign in to manage Hatod</Text>
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="admin@hatod.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
            />
        </View>
        
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
        </View>
        
        <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.buttonText}>Sign In</Text>
            )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
      width: 80,
      height: 80,
      marginBottom: 16,
      borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
      fontSize: 16,
      color: '#666',
  },
  inputGroup: {
      marginBottom: 20,
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#e1e1e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    height: 50,
    backgroundColor: '#4f46e5', // Indigo-600
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 10,
  },
  buttonDisabled: {
      opacity: 0.7,
  },
  buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
  },
});
