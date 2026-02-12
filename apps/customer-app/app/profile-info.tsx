import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

import { useUser } from '@/context/UserContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUserLocal } = useUser();
  
  const [formData, setFormData] = useState({
    firstName: user?.customer?.firstName || '',
    lastName: user?.customer?.lastName || '',
    email: '',
    phone: user?.phone || '', 
  });

  React.useEffect(() => {
    if (user) {
        let emailDisplay = user.email || '';
        if (emailDisplay.endsWith('@hatod.com')) {
            emailDisplay = ''; 
        }
        setFormData({
            firstName: user.customer?.firstName || '',
            lastName: user.customer?.lastName || '',
            email: emailDisplay,
            phone: user.phone || user.email?.replace('@hatod.com','') || '',
        });
    }
  }, [user]);

  const handleSave = () => {
    // Optimistic update locally
    updateUserLocal({
        customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
        },
        // Phone/Email update logic would need backend support
    });
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Profile Information',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
                <ThemedText style={styles.avatarText}>{formData.firstName[0]}{formData.lastName[0]}</ThemedText>
                <TouchableOpacity style={styles.cameraBtn}>
                    <IconSymbol size={16} name="add" color="#FFF" /> 
                </TouchableOpacity>
            </View>
            <ThemedText style={styles.avatarCta}>Change Profile Picture</ThemedText>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>First Name</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={formData.firstName}
                    onChangeText={(text) => setFormData({...formData, firstName: text})}
                />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Last Name</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={formData.lastName}
                    onChangeText={(text) => setFormData({...formData, lastName: text})}
                />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email Address</ThemedText>
                <TextInput 
                    style={[styles.input, styles.inputDisabled]} 
                    value={formData.email}
                    editable={false}
                    placeholder="Not Set"
                />
                <IconSymbol size={16} name="person" color="#aaa" style={styles.fieldIcon} />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={formData.phone}
                    keyboardType="phone-pad"
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                />
            </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C5CAE9',
    marginBottom: 12,
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#5c6cc9',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f78734',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarCta: {
    fontSize: 14,
    color: '#5c6cc9',
    fontWeight: '700',
  },
  formSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    height: 48,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  fieldIcon: {
    position: 'absolute',
    right: 16,
    top: 38,
  },
  saveBtn: {
    height: 50,
    backgroundColor: '#f78734',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f78734',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
