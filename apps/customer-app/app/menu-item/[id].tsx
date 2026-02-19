import {
  StyleSheet, ScrollView, TouchableOpacity, View, Image,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getMenuItemById } from '@/api/services';
import { resolveImageUrl } from '@/api/client';
import { MenuItem } from '@/api/types';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState('');

  // Track one selected value per radio group (keyed by group index)
  const [radioSelections, setRadioSelections] = useState<Record<number, number>>({});
  // Track multiple selected values per checkbox group (keyed by group index → set of choice indices)
  const [checkboxSelections, setCheckboxSelections] = useState<Record<number, Set<number>>>({});

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const data = await getMenuItemById(id as string);
      if (data) {
        setItem({
          ...data,
          description: data.description || '',
          options: data.options || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Normalise option groups to a consistent shape
  const normaliseGroups = (raw: any[]): { name: string; required: boolean; isRadio: boolean; choices: { label: string; price: number }[] }[] => {
    return raw.map(group => {
      const choices = (Array.isArray(group.options) ? group.options : Array.isArray(group.items) ? group.items : []).map((c: any) => ({
        label: c.label ?? c.name ?? '',
        price: parseFloat(String(c.price ?? 0)),
      }));
      const required = !!(group.isRequired ?? group.required ?? false);
      const isRadio = required || group.type === 'radio';
      return { name: group.name ?? group.title ?? '', required, isRadio, choices };
    });
  };

  const calculateTotal = () => {
    const groups = normaliseGroups(Array.isArray(item?.options) ? item.options : []);
    let extra = 0;
    groups.forEach((g, gi) => {
      if (g.isRadio) {
        const choiceIdx = radioSelections[gi];
        if (choiceIdx !== undefined) extra += g.choices[choiceIdx]?.price ?? 0;
      } else {
        (checkboxSelections[gi] ?? new Set()).forEach(ci => {
          extra += g.choices[ci]?.price ?? 0;
        });
      }
    });
    return Math.round(((item?.price ?? 0) + extra) * quantity * 100) / 100;
  };

  const handleAddToCart = () => {
    if (!item) return;
    const groups = normaliseGroups(Array.isArray(item.options) ? item.options : []);
    const selectedOptions: Record<string, any> = {};
    groups.forEach((g, gi) => {
      if (g.isRadio) {
        const ci = radioSelections[gi];
        if (ci !== undefined) selectedOptions[g.name] = g.choices[ci].label;
      } else {
        const chosen = Array.from(checkboxSelections[gi] ?? new Set()).map(ci => g.choices[ci].label);
        if (chosen.length) selectedOptions[g.name] = chosen;
      }
    });
    if (specialNote.trim()) selectedOptions['note'] = specialNote.trim();

    addToCart({
      id: Date.now().toString(),
      menuItemId: id as string,
      merchantId: item.merchantId,
      storeName: item.merchant?.name,
      deliveryFee: item.merchant?.deliveryFee ?? 50,
      name: item.name,
      price: item.price,
      quantity,
      image: item.image,
      options: selectedOptions,
      totalPrice: calculateTotal(),
    });
    router.back();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#C2185B" />
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText>Item not found</ThemedText>
      </ThemedView>
    );
  }

  const groups = normaliseGroups(Array.isArray(item.options) ? item.options : []);
  const total = calculateTotal();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ThemedView style={styles.backButtonInner}>
          <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
        </ThemedView>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero image */}
        <Image
          source={{ uri: resolveImageUrl(item.image || item.imageUrl) || 'https://via.placeholder.com/400x250?text=No+Image' }}
          style={styles.heroImage}
        />

        <ThemedView style={styles.content}>
          {/* Name + price */}
          <ThemedView style={styles.headerRow}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <View>
              {item.originalPrice != null && item.originalPrice !== item.price ? (
                <ThemedText style={styles.originalPrice}>₱{item.originalPrice}</ThemedText>
              ) : null}
              <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
            </View>
          </ThemedView>

          {/* Category pill */}
          <ThemedView style={styles.categoryRow}>
            <ThemedText style={styles.itemCategory}>
              {item.category?.name || 'Uncategorized'}
            </ThemedText>
          </ThemedView>

          {/* Description */}
          {item.description ? (
            <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
          ) : null}

          {/* Option groups */}
          {groups.map((group, gi) => (
            <ThemedView key={gi} style={styles.optionSection}>
              <ThemedView style={styles.optionHeader}>
                <ThemedView>
                  <ThemedText style={styles.optionTitle}>{group.name}</ThemedText>
                  <ThemedText style={styles.optionSubtitle}>{group.required ? 'Required' : 'Optional'}</ThemedText>
                </ThemedView>
                {group.required && (
                  <ThemedView style={styles.requiredBadge}>
                    <ThemedText style={styles.requiredText}>
                      {group.isRadio ? '1 Required' : 'Required'}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>

              {group.choices.map((choice, ci) => {
                const isSelected = group.isRadio
                  ? radioSelections[gi] === ci
                  : (checkboxSelections[gi] ?? new Set()).has(ci);

                const onPress = () => {
                  if (group.isRadio) {
                    setRadioSelections(prev => ({ ...prev, [gi]: ci }));
                  } else {
                    setCheckboxSelections(prev => {
                      const next = new Set(prev[gi] ?? []);
                      isSelected ? next.delete(ci) : next.add(ci);
                      return { ...prev, [gi]: next };
                    });
                  }
                };

                return (
                  <TouchableOpacity key={ci} style={styles.choiceRow} onPress={onPress} activeOpacity={0.7}>
                    <ThemedView style={styles.choiceMain}>
                      <ThemedView style={[
                        styles.selector,
                        group.isRadio ? styles.radio : styles.checkbox,
                        isSelected && styles.selectorActive,
                      ]}>
                        {isSelected && (
                          group.isRadio
                            ? <ThemedView style={styles.radioDot} />
                            : <ThemedText style={styles.checkmark}>✓</ThemedText>
                        )}
                      </ThemedView>
                      <ThemedText style={styles.choiceName}>{choice.label}</ThemedText>
                    </ThemedView>
                    {choice.price > 0 && (
                      <ThemedText style={styles.choicePrice}>+₱{choice.price}</ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ThemedView>
          ))}

          {/* Special Instructions */}
          <ThemedView style={styles.optionSection}>
            <ThemedView style={styles.optionHeader}>
              <ThemedView>
                <ThemedText style={styles.optionTitle}>Special Instructions</ThemedText>
                <ThemedText style={styles.optionSubtitle}>Optional</ThemedText>
              </ThemedView>
            </ThemedView>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. No onions, extra sauce…"
              placeholderTextColor="#BBB"
              multiline
              value={specialNote}
              onChangeText={setSpecialNote}
            />
          </ThemedView>

          <View style={{ height: 140 }} />
        </ThemedView>
      </ScrollView>

      {/* Footer */}
      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {/* Quantity */}
        <ThemedView style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
            <ThemedText style={styles.qtyBtnText}>−</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.qtyValue}>{quantity}</ThemedText>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
            <ThemedText style={styles.qtyBtnText}>+</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Add to cart */}
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart} activeOpacity={0.85}>
          <ThemedText style={styles.addToCartText}>Add to Cart — ₱{total.toFixed(2)}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },

  backButton: { position: 'absolute', top: 44, left: 16, zIndex: 20 },
  backButtonInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },

  heroImage: { width: '100%', height: 260 },

  content: { padding: 20 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', backgroundColor: 'transparent',
  },
  itemName: { fontSize: 22, fontWeight: '900', color: '#333', flex: 1, marginRight: 12 },
  originalPrice: {
    fontSize: 13, color: '#BBB', fontWeight: '600',
    textDecorationLine: 'line-through', textAlign: 'right',
  },
  itemPrice: { fontSize: 20, fontWeight: '800', color: '#333', textAlign: 'right' },

  categoryRow: { marginTop: 6, backgroundColor: 'transparent' },
  itemCategory: {
    fontSize: 12, fontWeight: '700', color: '#C2185B', textTransform: 'uppercase',
  },

  itemDescription: { fontSize: 14, color: '#777', marginTop: 10, lineHeight: 20 },

  optionSection: { marginTop: 28, backgroundColor: 'transparent' },
  optionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FAFAFA', padding: 12,
    marginHorizontal: -20,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0',
  },
  optionTitle: { fontSize: 16, fontWeight: '800', color: '#333' },
  optionSubtitle: { fontSize: 11, color: '#888', marginTop: 2 },
  requiredBadge: {
    backgroundColor: '#E0E0E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
  },
  requiredText: { fontSize: 10, fontWeight: '800', color: '#666' },

  choiceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  choiceMain: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' },
  selector: {
    width: 22, height: 22, borderWidth: 2, borderColor: '#DDD',
    marginRight: 12, justifyContent: 'center', alignItems: 'center',
  },
  radio: { borderRadius: 11 },
  checkbox: { borderRadius: 5 },
  selectorActive: { borderColor: '#C2185B' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C2185B' },
  checkmark: { fontSize: 13, color: '#C2185B', fontWeight: '900', lineHeight: 15 },
  choiceName: { fontSize: 14, color: '#444', fontWeight: '600' },
  choicePrice: { fontSize: 13, color: '#888' },

  textInput: {
    borderWidth: 1, borderColor: '#EEE', borderRadius: 10,
    padding: 12, marginTop: 12, height: 80,
    textAlignVertical: 'top', fontSize: 14, color: '#333',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', paddingTop: 14, paddingHorizontal: 16,
    borderTopWidth: 1, borderColor: '#EEE',
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
  },
  qtyBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: '#DDD',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 20, color: '#333', lineHeight: 22 },
  qtyValue: { fontSize: 16, fontWeight: '800', marginHorizontal: 14 },

  addToCartBtn: {
    flex: 1, backgroundColor: '#C2185B', height: 50,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  addToCartText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
