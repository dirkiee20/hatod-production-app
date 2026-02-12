import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/services/api';

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!firstName || !lastName || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Backend automatically generates dummy email if only phone is provided
      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        phone,
        password,
        role: 'RIDER',
      });

      const { access_token } = response.data;
      if (access_token) {
        await SecureStore.setItemAsync('authToken', access_token);
        router.replace('/(tabs)');
      } else {
         Alert.alert('Success', 'Account created! Please login.');
         router.back();
      }
    } catch (error: any) {
        console.error(error);
        const message = error.response?.data?.message || 'Registration failed';
        Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Join Hatod</ThemedText>
        <ThemedText style={styles.subtitle}>Create your Rider Account</ThemedText>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <ThemedText style={styles.label}>First Name</ThemedText>
                <TextInput
                style={styles.input}
                placeholder="Juan"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <ThemedText style={styles.label}>Last Name</ThemedText>
                <TextInput
                style={styles.input}
                placeholder="Dela Cruz"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Mobile Number</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="+639123456789"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginBtn, isLoading && styles.disabledBtn]} 
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.loginBtnText}>Create Account</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, alignItems: 'center' }}>
               <ThemedText style={{ color: '#666', fontWeight: '600' }}>Already have an account? Sign In</ThemedText>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C2185B',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
      flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  loginBtn: {
    backgroundColor: '#C2185B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
