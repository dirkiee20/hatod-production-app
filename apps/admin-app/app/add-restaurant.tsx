import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { publicFetch } from '../api/client';

export default function AddRestaurantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
        Alert.alert('Missing Fields', 'Please fill in all required fields.');
        return;
    }

    setIsSubmitting(true);
    try {
        const payload = {
            email: formData.email,
            password: formData.password,
            role: 'MERCHANT',
            firstName: 'Merchant', // Required by DTO but unused for Merchant role
            lastName: 'Admin',    // Required by DTO but unused for Merchant role
            merchantName: formData.name,
            address: 'To be set',
            phone: formData.phone,
            city: 'Unknown'
        };

        // Regiser endpoint is public
        const res = await publicFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            Alert.alert(
                'Success', 
                'Merchant account created successfully!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            const error = await res.json();
            Alert.alert('Error', error.message || 'Failed to create merchant');
        }
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'An unexpected error occurred');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Add New Restaurant',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
           <ThemedText style={styles.helperText}>
             Create a new merchant account. The merchant can log in with these credentials to manage their store.
           </ThemedText>

           <ThemedView style={styles.inputGroup}>
             <ThemedText style={styles.label}>Restaurant Name *</ThemedText>
             <TextInput 
               style={styles.input}
               placeholder="e.g. Burger Queen"
               value={formData.name}
               onChangeText={(t) => setFormData({...formData, name: t})}
             />
           </ThemedView>

           <ThemedView style={styles.inputGroup}>
             <ThemedText style={styles.label}>Email Address *</ThemedText>
             <TextInput 
               style={styles.input}
               placeholder="merchant@example.com"
               keyboardType="email-address"
               autoCapitalize="none"
               value={formData.email}
               onChangeText={(t) => setFormData({...formData, email: t})}
             />
           </ThemedView>

           <ThemedView style={styles.inputGroup}>
             <ThemedText style={styles.label}>Password *</ThemedText>
             <TextInput 
               style={styles.input}
               placeholder="At least 6 characters"
               secureTextEntry
               value={formData.password}
               onChangeText={(t) => setFormData({...formData, password: t})}
             />
           </ThemedView>

           <ThemedView style={styles.inputGroup}>
             <ThemedText style={styles.label}>Phone Number</ThemedText>
             <TextInput 
               style={styles.input}
               placeholder="+63 9xx xxx xxxx"
               keyboardType="phone-pad"
               value={formData.phone}
               onChangeText={(t) => setFormData({...formData, phone: t})}
             />
           </ThemedView>

           <View style={{ height: 40 }} />
        </ScrollView>

        <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
           <TouchableOpacity 
              style={[styles.createBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
           >
              {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
              ) : (
                  <ThemedText style={styles.createBtnText}>Create Account</ThemedText>
              )}
           </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  createBtn: {
    backgroundColor: '#C2185B',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
