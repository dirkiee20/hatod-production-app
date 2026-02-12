import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback } from 'react';
import { getMenuItems } from '@/api/services';
import { MenuItem } from '@/api/types';
import { resolveImageUrl } from '@/api/client';

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    const data = await getMenuItems();
    setMenuItems(data);
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ThemedText style={styles.headerTitle}>Menu Builder</ThemedText>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-menu-item')}>
           <ThemedText style={styles.addBtnText}>+ Add Item</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchBar}>
           <IconSymbol size={18} name="filter" color="#999" />
           <ThemedText style={styles.searchPlaceholder}>Search food items...</ThemedText>
        </View>

        {loading ? (
             <ActivityIndicator size="large" color="#f78734" style={{ marginTop: 20 }} />
        ) : menuItems.length === 0 ? (
             <ThemedText style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No menu items found.</ThemedText>
        ) : (
            menuItems.map((item) => (
            <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => router.push(`/menu-details/${item.id}`)}
            >
                <Image 
                    source={{ uri: resolveImageUrl(item.image || item.imageUrl) || 'https://via.placeholder.com/150' }} 
                    style={styles.itemImg} 
                />
                <ThemedView style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
                <ThemedView style={styles.statusRow}>
                    <ThemedText style={[styles.statusLabel, { color: item.isAvailable ? '#388E3C' : '#D32F2F' }]}>
                        {item.isAvailable ? 'Available' : 'Out of Stock'}
                    </ThemedText>
                    <Switch 
                        value={item.isAvailable} 
                        trackColor={{ false: '#DDD', true: '#F48FB1' }}
                        thumbColor={item.isAvailable ? '#f78734' : '#FFF'}
                        disabled={true} // Disable pending implementation
                    />
                </ThemedView>
                </ThemedView>
                <View style={styles.editIcon}>
                <IconSymbol size={18} name="chevron.right" color="#DDD" />
                </View>
            </TouchableOpacity>
            ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  addBtn: {
    backgroundColor: '#5c6cc9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 13,
    color: '#AAA',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
  },
  itemImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  editIcon: {
    padding: 5,
  },
});
