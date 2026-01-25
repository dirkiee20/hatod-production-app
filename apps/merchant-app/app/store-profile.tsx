import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function StoreProfileScreen() {
  const router = useRouter();
  
  // State for form fields
  const [storeName, setStoreName] = useState('The Burger Mansion');
  const [address, setAddress] = useState('Surigao City Central Plaza');
  const [description, setDescription] = useState('Serving the best burgers in town since 2015. We use 100% locally sourced beef and fresh ingredients.');
  const [phone, setPhone] = useState('0912 345 6789');

  const handleSave = () => {
    // Logic to save
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Store Profile',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Cover & Logo Section */}
        <View style={styles.brandingSection}>
            <View style={styles.coverImageContainer}>
                 {/* Placeholder for cover image */}
                 <View style={styles.coverPlaceholder}>
                    <IconSymbol size={32} name="house.fill" color="#DDD" />
                    <ThemedText style={styles.coverText}>Add Cover Photo</ThemedText>
                 </View>
                 <TouchableOpacity style={styles.editCoverBtn}>
                    <IconSymbol size={16} name="dashboard" color="#FFF" />
                 </TouchableOpacity>
            </View>

            <View style={styles.logoRow}>
                <View style={styles.logoContainer}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400' }} style={styles.logoImg} />
                    <TouchableOpacity style={styles.editLogoBtn}>
                        <IconSymbol size={12} name="dashboard" color="#FFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.ratingInfo}>
                    <ThemedText style={styles.ratingLabel}>Store Rating</ThemedText>
                    <View style={styles.stars}>
                        <IconSymbol size={16} name="person" color="#FFD700" />
                        <ThemedText style={styles.ratingVal}>4.8</ThemedText>
                        <ThemedText style={styles.ratingCount}>(1.2k reviews)</ThemedText>
                    </View>
                </View>
            </View>
        </View>

        {/* Basic Info Form */}
        <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Store Name</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={storeName} 
                    onChangeText={setStoreName}
                />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Store Address</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={address} 
                    onChangeText={setAddress}
                />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={phone} 
                    keyboardType="phone-pad"
                    onChangeText={setPhone}
                />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={description} 
                    multiline
                    numberOfLines={4}
                    onChangeText={setDescription}
                />
            </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
             <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
             <View style={styles.tagsRow}>
                 <View style={styles.tag}>
                     <ThemedText style={styles.tagText}>Fast Food</ThemedText>
                     <TouchableOpacity>
                        <IconSymbol size={12} name="chevron.right" color="#C2185B" style={{transform:[{rotate:'45deg'}]}} />
                     </TouchableOpacity>
                 </View>
                 <View style={styles.tag}>
                     <ThemedText style={styles.tagText}>Burgers</ThemedText>
                     <TouchableOpacity>
                         <IconSymbol size={12} name="chevron.right" color="#C2185B" style={{transform:[{rotate:'45deg'}]}} />
                     </TouchableOpacity>
                 </View>
                 <TouchableOpacity style={styles.addTagBtn}>
                     <IconSymbol size={14} name="add" color="#C2185B" />
                     <ThemedText style={styles.addTagText}>Add</ThemedText>
                 </TouchableOpacity>
             </View>
        </View>

        {/* Save Button */}
        <View style={styles.footer}>
             <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
             </TouchableOpacity>
        </View>

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
    paddingBottom: 40,
  },
  brandingSection: {
    backgroundColor: '#FFF',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  coverImageContainer: {
    height: 150,
    backgroundColor: '#EEEEEE',
    position: 'relative',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: {
    marginTop: 8,
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  editCoverBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -40,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  logoImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  editLogoBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#C2185B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  ratingInfo: {
    paddingBottom: 4,
  },
  ratingLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    color: '#C2185B',
    fontSize: 13,
    fontWeight: '700',
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C2185B',
    borderStyle: 'dashed',
    gap: 4,
  },
  addTagText: {
    color: '#C2185B',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
  },
  saveBtn: {
    backgroundColor: '#C2185B',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C2185B',
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
