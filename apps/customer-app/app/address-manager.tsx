import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function AddressManagerScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState('1');

  const addresses = [
    {
      id: '1',
      label: 'Home',
      address: '123 Rizal Street, Surigao City',
      landmark: 'Near the blue gate',
      icon: 'house.fill',
    },
    {
      id: '2',
      label: 'Work',
      address: 'Surigao City Hall, Borromeo St.',
      landmark: 'Department of Public Works',
      icon: 'grocery', // Using grocery as a generic business/work icon
    },
    {
      id: '3',
      label: 'Others',
      address: 'SM City Surigao, Km 4, National Highway',
      landmark: 'Main Entrance',
      icon: 'person',
    }
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Select Address',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search & Map Placeholder */}
        <ThemedView style={styles.searchSection}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="filter" color="#777" />
            <TextInput 
              placeholder="Search for a new address..."
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </ThemedView>
          <TouchableOpacity style={styles.currentLocationBtn}>
             <IconSymbol size={16} name="paperplane.fill" color="#C2185B" />
             <ThemedText style={styles.currentLocationText}>Use current location</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.sectionDivider}>
           <ThemedText style={styles.sectionTitle}>Saved Addresses</ThemedText>
        </ThemedView>

        {addresses.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.addressItem, selectedId === item.id && styles.addressItemActive]}
            onPress={() => setSelectedId(item.id)}
          >
            <ThemedView style={styles.itemMain}>
               <ThemedView style={[styles.iconContainer, selectedId === item.id && styles.iconActive]}>
                  <IconSymbol size={20} name={item.icon as any} color={selectedId === item.id ? '#FFF' : '#C2185B'} />
               </ThemedView>
               <ThemedView style={styles.addressDetails}>
                  <ThemedText style={styles.label}>{item.label}</ThemedText>
                  <ThemedText style={styles.street} numberOfLines={1}>{item.address}</ThemedText>
                  <ThemedText style={styles.landmark}>Nearby: {item.landmark}</ThemedText>
               </ThemedView>
            </ThemedView>
            
            <ThemedView style={[styles.radio, selectedId === item.id && styles.radioActive]}>
               {selectedId === item.id && <ThemedView style={styles.radioInner} />}
            </ThemedView>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addNewBtn}>
           <ThemedView style={styles.addIconCircle}>
              <ThemedText style={styles.plusText}>+</ThemedText>
           </ThemedView>
           <ThemedText style={styles.addNewText}>Add New Address</ThemedText>
        </TouchableOpacity>

        <ThemedView style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm Action */}
      <ThemedView style={styles.footer}>
         <TouchableOpacity style={styles.confirmBtn} onPress={() => router.back()}>
            <ThemedText style={styles.confirmBtnText}>Confirm and Continue</ThemedText>
         </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: 'transparent',
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#C2185B',
  },
  sectionDivider: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#FAFAFA',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 0.5,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFF',
  },
  addressItemActive: {
    backgroundColor: '#FFF9FB',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: '#C2185B',
  },
  addressDetails: {
    marginLeft: 15,
    flex: 1,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  street: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  landmark: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  radioActive: {
    borderColor: '#C2185B',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C2185B',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C2185B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#C2185B',
    fontSize: 18,
    fontWeight: '500',
    marginTop: -2,
  },
  addNewText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#C2185B',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderColor: '#EEE',
  },
  confirmBtn: {
    backgroundColor: '#C2185B',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
