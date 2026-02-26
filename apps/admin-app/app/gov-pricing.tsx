import React, { useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import {
  StyleSheet, ScrollView, TouchableOpacity, View,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGovServiceItems, updateGovServicePrice } from '@/api/services';

const GOV_BLUE = '#1565C0';
const GOV_BLUE_LIGHT = '#E3F2FD';
const GOV_BLUE_SOFT = '#BBDEFB';

interface GovServiceItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryName?: string;
  isAvailable: boolean;
  isApproved: boolean;
}

export default function GovPricingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [items, setItems] = useState<GovServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // id of item being saved

  // Editable prices per item (local state)
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const fetchItems = async () => {
    setLoading(true);
    const data = await getGovServiceItems();
    setItems(data);
    // Initialize edited prices from fetched data
    const initialPrices: Record<string, string> = {};
    data.forEach((item: GovServiceItem) => {
      initialPrices[item.id] = String(item.price);
    });
    setEditedPrices(initialPrices);
    setLoading(false);
  };

  const handleSave = async (item: GovServiceItem) => {
    const raw = editedPrices[item.id];
    const parsed = parseFloat(raw);

    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price (0 or above).');
      return;
    }

    setSaving(item.id);
    const success = await updateGovServicePrice(item.id, parsed);
    setSaving(null);

    if (success) {
      // Update local state
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, price: parsed } : i));
      Alert.alert('✅ Saved', `"${item.name}" price updated to ₱${parsed.toFixed(2)}`);
    } else {
      Alert.alert('Error', 'Failed to update price. Please try again.');
    }
  };

  const hasChanged = (item: GovServiceItem) => {
    const raw = editedPrices[item.id];
    return parseFloat(raw) !== item.price;
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol size={20} name="chevron.right" color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <ThemedText style={styles.headerTitle}>Government Pricing</ThemedText>
          <ThemedText style={styles.headerSub}>Set service fees for government transactions</ThemedText>
        </View>
      </ThemedView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOV_BLUE} />
          <ThemedText style={styles.loadingText}>Loading services...</ThemedText>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <IconSymbol size={40} name="building.2.fill" color={GOV_BLUE} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Government Services Found</ThemedText>
          <ThemedText style={styles.emptyDesc}>
            Make sure the Government merchant exists and has menu items added.
          </ThemedText>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchItems}>
            <ThemedText style={styles.refreshBtnText}>Refresh</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <IconSymbol size={16} name="info.circle.fill" color={GOV_BLUE} />
            <ThemedText style={styles.infoText}>
              Set the service fee for each government document. Changes apply immediately when customers place new orders.
            </ThemedText>
          </View>

          <ThemedText style={styles.sectionLabel}>SERVICE ITEMS ({items.length})</ThemedText>

          {items.map(item => (
            <View key={item.id} style={styles.card}>
              {/* Badge Row */}
              <View style={styles.cardTopRow}>
                <View style={styles.categoryBadge}>
                  <ThemedText style={styles.categoryBadgeText}>{item.categoryName || 'General'}</ThemedText>
                </View>
                {!item.isApproved && (
                  <View style={styles.unapprovedBadge}>
                    <ThemedText style={styles.unapprovedText}>Pending Approval</ThemedText>
                  </View>
                )}
                {!item.isAvailable && (
                  <View style={styles.unavailableBadge}>
                    <ThemedText style={styles.unavailableText}>Unavailable</ThemedText>
                  </View>
                )}
              </View>

              {/* Service Info */}
              <View style={styles.cardBody}>
                <View style={styles.iconCircle}>
                  <IconSymbol size={22} name="doc.badge.fill" color={GOV_BLUE} />
                </View>
                <View style={styles.nameBlock}>
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  {item.description ? (
                    <ThemedText style={styles.itemDesc} numberOfLines={2}>{item.description}</ThemedText>
                  ) : null}
                </View>
              </View>

              {/* Price Editor */}
              <View style={styles.priceRow}>
                <View style={styles.priceInputGroup}>
                  <ThemedText style={styles.priceLabel}>Service Fee (₱)</ThemedText>
                  <View style={styles.priceInputWrapper}>
                    <ThemedText style={styles.pesosSign}>₱</ThemedText>
                    <TextInput
                      style={styles.priceInput}
                      value={editedPrices[item.id] ?? String(item.price)}
                      onChangeText={v => setEditedPrices(prev => ({ ...prev, [item.id]: v }))}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#A0AFBE"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    !hasChanged(item) && styles.saveBtnDisabled,
                  ]}
                  onPress={() => handleSave(item)}
                  disabled={!hasChanged(item) || saving === item.id}
                >
                  {saving === item.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <ThemedText style={styles.saveBtnText}>
                      {hasChanged(item) ? 'Save' : 'Saved ✓'}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              {/* Current stored price indicator */}
              <View style={styles.currentPriceRow}>
                <ThemedText style={styles.currentPriceLabel}>
                  Current stored price:{' '}
                  <ThemedText style={styles.currentPriceValue}>
                    ₱{item.price.toFixed(2)}
                  </ThemedText>
                </ThemedText>
              </View>
            </View>
          ))}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: GOV_BLUE,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },

  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: GOV_BLUE_LIGHT, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#333', textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  refreshBtn: {
    marginTop: 20, backgroundColor: GOV_BLUE,
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10,
  },
  refreshBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  scroll: { padding: 16, paddingTop: 20 },

  infoBanner: {
    flexDirection: 'row',
    backgroundColor: GOV_BLUE_LIGHT,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GOV_BLUE_SOFT,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1A3A5C',
    lineHeight: 18,
    fontWeight: '500',
  },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAA',
    letterSpacing: 1, marginBottom: 12,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: GOV_BLUE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: GOV_BLUE },
  unapprovedBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  unapprovedText: { fontSize: 11, fontWeight: '700', color: '#856404' },
  unavailableBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  unavailableText: { fontSize: 11, fontWeight: '700', color: '#C62828' },

  cardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: GOV_BLUE_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  nameBlock: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1C2B3A' },
  itemDesc: { fontSize: 12, color: '#7A8FA6', marginTop: 3, lineHeight: 17 },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 14,
  },
  priceInputGroup: { flex: 1 },
  priceLabel: { fontSize: 11, fontWeight: '700', color: '#7A8FA6', marginBottom: 6, letterSpacing: 0.5 },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GOV_BLUE,
    borderRadius: 10,
    backgroundColor: '#F8FAFD',
    paddingHorizontal: 12,
    height: 44,
  },
  pesosSign: { fontSize: 16, fontWeight: '800', color: GOV_BLUE, marginRight: 4 },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#1C2B3A',
  },

  saveBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: GOV_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#B0BEC5',
  },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  currentPriceRow: { marginTop: 10 },
  currentPriceLabel: { fontSize: 11, color: '#A0AFBE', fontWeight: '500' },
  currentPriceValue: { color: GOV_BLUE, fontWeight: '700' },
});
