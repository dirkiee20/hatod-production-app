import { StyleSheet, ScrollView, TouchableOpacity, View, Image, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuItemDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State for editable fields
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState('299');
  const [available, setAvailable] = useState(true);

  // Mock item data
  const item = {
    id: id,
    name: 'Signature Double Cheese',
    restaurant: 'The Burger Mansion',
    category: 'Burgers',
    description: 'Two juicy beef patties topped with melted double cheese, crisp lettuce, fresh tomatoes, and our signature secret sauce on a toasted brioche bun.',
    image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800',
    basePrice: 299,
    variants: [
      { name: 'Regular', price: 0 },
      { name: 'Large', price: 50 },
      { name: 'Monster Size', price: 120 },
    ],
    addons: [
      { name: 'Extra Cheese', price: 25 },
      { name: 'Bacon Strips', price: 45 },
      { name: 'Fried Egg', price: 20 },
    ],
    stats: {
      totalSold: 1245,
      revenue: 372255,
      rating: 4.9,
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Item Details',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ marginRight: 10 }}>
            <ThemedText style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</ThemedText>
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: item.image }} style={styles.heroImage} />
        
        <ThemedView style={styles.content}>
          
          {/* Header Info */}
          <View style={styles.headerSection}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <ThemedText style={styles.restaurantName}>by {item.restaurant}</ThemedText>
            
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: available ? '#E8F5E9' : '#FFEBEE' }]}>
                <ThemedText style={[styles.statusText, { color: available ? '#388E3C' : '#D32F2F' }]}>
                  {available ? 'Available' : 'Unavailable'}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{item.stats.totalSold}</ThemedText>
              <ThemedText style={styles.statLabel}>Sold</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{item.stats.rating} ★</ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>₱{item.stats.revenue.toLocaleString()}</ThemedText>
              <ThemedText style={styles.statLabel}>Revenue</ThemedText>
            </View>
          </View>

          {/* Price & Availability Control */}
          <ThemedView style={styles.controlCard}>
            <ThemedText style={styles.sectionTitle}>Price & Status</ThemedText>
            
            <View style={styles.controlRow}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Base Price (₱)</ThemedText>
                {isEditing ? (
                  <TextInput 
                    style={styles.priceInput}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                ) : (
                  <ThemedText style={styles.priceDisplay}>₱{item.basePrice}</ThemedText>
                )}
              </View>

              <View style={styles.switchGroup}>
                <ThemedText style={styles.inputLabel}>Availability</ThemedText>
                <Switch 
                  value={available}
                  onValueChange={isEditing ? setAvailable : undefined}
                  disabled={!isEditing}
                  trackColor={{ false: '#DDD', true: '#F48FB1' }}
                  thumbColor={available ? '#C2185B' : '#FFF'}
                />
              </View>
            </View>
          </ThemedView>

          <ThemedText style={styles.description}>{item.description}</ThemedText>

          {/* Variants Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Variants & Sizes</ThemedText>
            {item.variants.map((variant, idx) => (
              <View key={idx} style={styles.optionRow}>
                <ThemedText style={styles.optionName}>{variant.name}</ThemedText>
                <ThemedText style={styles.optionPrice}>
                  {variant.price === 0 ? 'Base Price' : `+₱${variant.price}`}
                </ThemedText>
              </View>
            ))}
          </ThemedView>

          {/* Add-ons Section */}
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Add-ons</ThemedText>
            {item.addons.map((addon, idx) => (
              <View key={idx} style={styles.optionRow}>
                <ThemedText style={styles.optionName}>{addon.name}</ThemedText>
                <ThemedText style={styles.optionPrice}>+₱{addon.price}</ThemedText>
              </View>
            ))}
          </ThemedView>

          <View style={{ height: 100 }} />
        </ThemedView>
      </ScrollView>

      {isEditing && (
        <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
           <TouchableOpacity style={styles.deleteBtn}>
              <ThemedText style={styles.deleteBtnText}>Delete Item</ThemedText>
           </TouchableOpacity>
           <TouchableOpacity style={styles.saveBtn} onPress={() => setIsEditing(false)}>
              <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
           </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FAFAFA',
  },
  editBtnText: {
    color: '#C2185B',
    fontWeight: '700',
    fontSize: 14,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  itemName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EEE',
  },
  controlCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
    fontWeight: '600',
  },
  priceInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C2185B',
    borderBottomWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 4,
    width: 100,
  },
  priceDisplay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  switchGroup: {
    alignItems: 'flex-end',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  deleteBtnText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#C2185B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
