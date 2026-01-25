import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const item = {
    id: id,
    name: 'Signature Double Cheese',
    description: 'Double beef patty, quadruple cheese, secret sauce, and fresh vegetables on a brioche bun.',
    price: 299,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800',
    available: true,
    options: [
      {
        title: 'Choose Size',
        required: true,
        type: 'radio',
        items: [
          { name: 'Regular', price: 0 },
          { name: 'Large', price: 50 },
          { name: 'Monster Size', price: 120 },
        ]
      },
      {
        title: 'Extra Add-ons',
        required: false,
        type: 'checkbox',
        items: [
          { name: 'Extra Cheese', price: 25 },
          { name: 'Bacon Strips', price: 45 },
          { name: 'Fried Egg', price: 20 },
          { name: 'Caramelized Onions', price: 15 },
        ]
      }
    ]
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ThemedView style={styles.backButtonInner}>
          <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
        </ThemedView>
      </TouchableOpacity>

      <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/add-menu-item?editId=${id}`)}>
        <ThemedView style={styles.editButtonInner}>
          <ThemedText style={styles.editButtonText}>Edit</ThemedText>
        </ThemedView>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Image source={{ uri: item.image }} style={styles.heroImage} />
        
        <ThemedView style={styles.content}>
          <ThemedView style={styles.headerRow}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.categoryRow}>
            <ThemedText style={styles.itemCategory}>{item.category}</ThemedText>
            <ThemedView style={styles.availabilityToggle}>
              <ThemedText style={styles.availabilityLabel}>Available</ThemedText>
              <Switch 
                value={item.available} 
                trackColor={{ false: '#DDD', true: '#F48FB1' }}
                thumbColor={item.available ? '#C2185B' : '#FFF'}
              />
            </ThemedView>
          </ThemedView>
          
          <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>

          {item.options.map((option, idx) => (
            <ThemedView key={idx} style={styles.optionSection}>
              <ThemedView style={styles.optionHeader}>
                <ThemedView>
                  <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                  <ThemedText style={styles.optionSubtitle}>{option.required ? 'Required' : 'Optional'}</ThemedText>
                </ThemedView>
                {option.required && (
                  <ThemedView style={styles.requiredBadge}>
                    <ThemedText style={styles.requiredText}>1 Required</ThemedText>
                  </ThemedView>
                )}
              </ThemedView>

              {option.items.map((choice, cIdx) => (
                <View 
                  key={cIdx} 
                  style={styles.choiceRow}
                >
                  <ThemedView style={styles.choiceMain}>
                    <ThemedView style={[
                      styles.selector, 
                      option.type === 'radio' ? styles.radio : styles.checkbox
                    ]}>
                    </ThemedView>
                    <ThemedText style={styles.choiceName}>{choice.name}</ThemedText>
                  </ThemedView>
                  {choice.price > 0 && (
                    <ThemedText style={styles.choicePrice}>+₱{choice.price}</ThemedText>
                  )}
                </View>
              ))}
            </ThemedView>
          ))}

          <ThemedView style={{ height: 150 }} />
        </ThemedView>
      </ScrollView>

      {/* Footer Actions */}
      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
         <TouchableOpacity style={styles.deleteBtn}>
            <ThemedText style={styles.deleteBtnText}>Delete Item</ThemedText>
         </TouchableOpacity>
         <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
            <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 20,
  },
  editButtonInner: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C2185B',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  itemName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginLeft: 15,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2185B',
    textTransform: 'uppercase',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  availabilityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    lineHeight: 20,
  },
  optionSection: {
    marginTop: 30,
    backgroundColor: 'transparent',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
    marginHorizontal: -20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  optionSubtitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  requiredBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
  },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  choiceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selector: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radio: {
    borderRadius: 10,
  },
  checkbox: {
    borderRadius: 4,
  },
  choiceName: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  choicePrice: {
    fontSize: 13,
    color: '#888',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#EEE',
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
    fontWeight: '800',
  },
});
