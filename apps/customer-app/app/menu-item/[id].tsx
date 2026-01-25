import { StyleSheet, ScrollView, TouchableOpacity, Image, View, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Mock data for the specific item
  const item = {
    name: 'Signature Double Cheese',
    price: 299,
    description: 'Double beef patty, quadruple cheese, secret sauce, and fresh vegetables on a brioche bun.',
    image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800',
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

  const toggleAddon = (name: string) => {
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter(a => a !== name));
    } else {
      setSelectedAddons([...selectedAddons, name]);
    }
  };

  const calculateTotal = () => {
    let extra = 0;
    const sizeOption = item.options[0].items.find(i => i.name === selectedSize);
    if (sizeOption) extra += sizeOption.price;
    
    selectedAddons.forEach(addonName => {
      const addon = item.options[1].items.find(i => i.name === addonName);
      if (addon) extra += addon.price;
    });

    return (item.price + extra) * quantity;
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ThemedView style={styles.backButtonInner}>
          <IconSymbol size={20} name="chevron.right" color="#000" style={{transform: [{rotate: '180deg'}]}} />
        </ThemedView>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Image source={{ uri: item.image }} style={styles.heroImage} />
        
        <ThemedView style={styles.content}>
          <ThemedView style={styles.headerRow}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
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
                <TouchableOpacity 
                  key={cIdx} 
                  style={styles.choiceRow}
                  onPress={() => option.type === 'radio' ? setSelectedSize(choice.name) : toggleAddon(choice.name)}
                >
                  <ThemedView style={styles.choiceMain}>
                    <ThemedView style={[
                      styles.selector, 
                      option.type === 'radio' ? styles.radio : styles.checkbox,
                      (option.type === 'radio' ? selectedSize === choice.name : selectedAddons.includes(choice.name)) && styles.selectorActive
                    ]}>
                      {(option.type === 'radio' ? selectedSize === choice.name : selectedAddons.includes(choice.name)) && (
                        <ThemedView style={styles.selectorInner} />
                      )}
                    </ThemedView>
                    <ThemedText style={styles.choiceName}>{choice.name}</ThemedText>
                  </ThemedView>
                  {choice.price > 0 && (
                    <ThemedText style={styles.choicePrice}>+₱{choice.price}</ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </ThemedView>
          ))}

          <ThemedView style={styles.instructionSection}>
            <ThemedText style={styles.optionTitle}>Special Instructions</ThemedText>
            <TextInput 
              style={styles.textInput}
              placeholder="e.g. No onions, please!"
              placeholderTextColor="#999"
              multiline
            />
          </ThemedView>

          <ThemedView style={{ height: 150 }} />
        </ThemedView>
      </ScrollView>

      {/* Footer Actions */}
      <ThemedView style={styles.footer}>
        <ThemedView style={styles.quantityContainer}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <ThemedText style={styles.qtyBtnText}>−</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.qtyValue}>{quantity}</ThemedText>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <ThemedText style={styles.qtyBtnText}>+</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <TouchableOpacity style={styles.addToCartBtn}>
          <ThemedText style={styles.addToCartText}>Add to Cart — ₱{calculateTotal()}</ThemedText>
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
  selectorActive: {
    borderColor: '#C2185B',
  },
  selectorInner: {
    width: 10,
    height: 10,
    backgroundColor: '#C2185B',
    borderRadius: 5,
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
  instructionSection: {
    marginTop: 30,
    backgroundColor: 'transparent',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'transparent',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    color: '#333',
    lineHeight: 22,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 15,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#C2185B',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
