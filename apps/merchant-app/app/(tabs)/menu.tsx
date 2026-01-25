import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Switch } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchMenuItems();
    }, [])
  );

  const fetchMenuItems = async () => {
    try {
        const { authenticatedFetch } = await import('../../api/client');
        const res = await authenticatedFetch('/menu/items');
        if (res.ok) {
            const data = await res.json();
            setMenuItems(data.map((item: any) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                available: item.isAvailable,
                // If we need category sorting later: item.category?.name
            })));
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
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
             <ThemedText style={{ textAlign: 'center', marginTop: 20 }}>Loading menu...</ThemedText>
        ) : (
            menuItems.map((item) => (
            <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => router.push(`/menu-details/${item.id}`)}
            >
                <Image source={{ uri: item.image }} style={styles.itemImg} />
                <ThemedView style={styles.itemInfo}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
                <ThemedView style={styles.statusRow}>
                    <ThemedText style={[styles.statusLabel, { color: item.available ? '#388E3C' : '#D32F2F' }]}>
                        {item.available ? 'Available' : 'Out of Stock'}
                    </ThemedText>
                    <Switch 
                        value={item.available} 
                        trackColor={{ false: '#DDD', true: '#F48FB1' }}
                        thumbColor={item.available ? '#C2185B' : '#FFF'}
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
    backgroundColor: '#C2185B',
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
