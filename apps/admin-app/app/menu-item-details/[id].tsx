import { StyleSheet, ScrollView, TouchableOpacity, View, Image, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authenticatedFetch, resolveImageUrl } from '../../api/client';
import { approveMenuItem, disapproveMenuItem } from '../../api/services';

export default function MenuItemDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState('0');
  const [available, setAvailable] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<any[]>([]);

  React.useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  /**
   * Fallback: parse options embedded in description string.
   * Format: [Title (Required/Optional): ChoiceName (+$price), ...]
   */
  const parseVariantsFromDescription = (fullDesc: string): any[] => {
    const variantRegex = /\[(.*?)\s\((.*?)\):\s(.*?)\]/g;
    const parsed: any[] = [];
    let match;
    while ((match = variantRegex.exec(fullDesc)) !== null) {
      const title = match[1];
      const reqText = match[2];
      const itemsStr = match[3];
      const isRequired = reqText.toLowerCase() === 'required';
      const items = itemsStr.split(', ').map((s: string) => {
        const m = s.match(/(.*?)\s\(\+\$(\d+(?:\.\d+)?)\)/);
        if (m) return { name: m[1], label: m[1], price: parseFloat(m[2]) };
        return { name: s, label: s, price: 0 };
      });
      parsed.push({
        title, name: title,
        required: isRequired, isRequired,
        type: isRequired ? 'radio' : 'checkbox',
        items, options: items,
      });
    }
    return parsed;
  };

  const fetchItem = async () => {
    try {
      const res = await authenticatedFetch(`/menu/admin/items/${id}`);
      if (res.ok) {
        const data = await res.json();
        // Prefer structured JSON options from DB; fall back to description parsing
        const resolvedOptions: any[] =
          Array.isArray(data.options) && data.options.length > 0
            ? data.options
            : parseVariantsFromDescription(data.description || '');
        setItem({ ...data, description: data.description || '', available: data.isAvailable });
        setPrice(data.price.toString());
        setAvailable(data.isAvailable);
        setOptions(resolvedOptions);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await authenticatedFetch(`/menu/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ price: parseFloat(price), isAvailable: available, options }),
      });
      if (res.ok) {
        alert('Item updated successfully');
        setIsEditing(false);
        fetchItem();
      } else {
        console.error(await res.text());
        alert('Failed to update item');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating item');
    }
  };

  const handleApprove = async () => {
    try {
      const success = await approveMenuItem(id as string);
      if (success) { alert('Item approved!'); fetchItem(); }
      else alert('Failed to approve');
    } catch (e) { console.error(e); }
  };

  const handleDisapprove = async () => {
    try {
      const success = await disapproveMenuItem(id as string);
      if (success) { alert('Item disapproved.'); fetchItem(); }
      else alert('Failed to disapprove');
    } catch (e) { console.error(e); }
  };

  const screenOptions = (
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
  );

  if (loading) return (
    <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      {screenOptions}
      <ThemedText>Loading...</ThemedText>
    </ThemedView>
  );

  if (!item) return (
    <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      {screenOptions}
      <ThemedText>Item not found</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {screenOptions}

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.heroImage} />

        <ThemedView style={styles.content}>
          {/* Name + Price */}
          <ThemedView style={styles.headerRow}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            ) : (
              <ThemedText style={styles.itemPrice}>₱{item.price}</ThemedText>
            )}
          </ThemedView>

          {/* Category + Availability */}
          <ThemedView style={styles.categoryRow}>
            <ThemedText style={styles.itemCategory}>{item.category?.name || 'Uncategorized'}</ThemedText>
            <ThemedView style={styles.availabilityToggle}>
              <ThemedText style={styles.availabilityLabel}>Available</ThemedText>
              <Switch
                value={available}
                onValueChange={isEditing ? setAvailable : undefined}
                disabled={!isEditing}
                trackColor={{ false: '#DDD', true: '#F48FB1' }}
                thumbColor={available ? '#C2185B' : '#FFF'}
              />
            </ThemedView>
          </ThemedView>

          <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{item.totalOrders || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Sold</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>₱{((item.totalOrders || 0) * item.price).toLocaleString()}</ThemedText>
              <ThemedText style={styles.statLabel}>Revenue</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{item.isApproved ? '✓' : '⏳'}</ThemedText>
              <ThemedText style={styles.statLabel}>{item.isApproved ? 'Approved' : 'Pending'}</ThemedText>
            </View>
          </View>

          {/* Options — same rendering as merchant app */}
          {options.map((option: any, idx: number) => {
            const groupTitle = option.name || option.title || 'Options';
            const choices: any[] = option.options || option.items || [];
            const isRequired = option.isRequired || option.required;

            return (
              <ThemedView key={idx} style={styles.optionSection}>
                <ThemedView style={styles.optionHeader}>
                  <ThemedView>
                    <ThemedText style={styles.optionTitle}>{groupTitle}</ThemedText>
                    <ThemedText style={styles.optionSubtitle}>{isRequired ? 'Required' : 'Optional'}</ThemedText>
                  </ThemedView>
                  {isRequired && (
                    <ThemedView style={styles.requiredBadge}>
                      <ThemedText style={styles.requiredText}>1 Required</ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>

                {choices.map((choice: any, cIdx: number) => {
                  const choiceName = choice.label || choice.name || '';
                  const choicePrice = typeof choice.price === 'number'
                    ? choice.price
                    : parseFloat(choice.price ?? '0');

                  return (
                    <View key={cIdx} style={styles.choiceRow}>
                      <View style={styles.choiceMain}>
                        <View style={[
                          styles.selector,
                          option.type === 'radio' || isRequired ? styles.radio : styles.checkbox,
                        ]} />
                        {isEditing ? (
                          <TextInput
                            style={[styles.choiceName, { borderBottomWidth: 1, borderColor: '#DDD', flex: 1 }]}
                            value={choiceName}
                            onChangeText={(text) => {
                              const newOpts = [...options];
                              const arr = newOpts[idx].options || newOpts[idx].items || [];
                              arr[cIdx] = { ...arr[cIdx], name: text, label: text };
                              setOptions(newOpts);
                            }}
                          />
                        ) : (
                          <ThemedText style={styles.choiceName}>{choiceName}</ThemedText>
                        )}
                      </View>
                      {choicePrice > 0 && (
                        <ThemedText style={styles.choicePrice}>+₱{choicePrice}</ThemedText>
                      )}
                    </View>
                  );
                })}
              </ThemedView>
            );
          })}

          <View style={{ height: 140 }} />
        </ThemedView>
      </ScrollView>

      {/* Footer — always visible: approve/disapprove toggle + edit actions */}
      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {item.isApproved ? (
          <TouchableOpacity style={styles.disapproveBtn} onPress={handleDisapprove}>
            <ThemedText style={styles.disapproveBtnText}>Disapprove Item</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
            <ThemedText style={styles.approveBtnText}>Approve Item</ThemedText>
          </TouchableOpacity>
        )}
        {isEditing && (
          <>
            <TouchableOpacity style={styles.deleteBtn}>
              <ThemedText style={styles.deleteBtnText}>Delete</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <ThemedText style={styles.saveBtnText}>Save</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFF',
  },
  editBtnText: {
    color: '#C2185B',
    fontWeight: '700',
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 8,
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
  priceInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C2185B',
    borderBottomWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 4,
    minWidth: 80,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    lineHeight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
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
  // Options — same layout as merchant app
  optionSection: {
    marginTop: 24,
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  choiceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    borderTopColor: '#EEE',
    flexDirection: 'row',
    gap: 12,
  },
  approveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  approveBtnText: {
    color: '#388E3C',
    fontWeight: '800',
    fontSize: 14,
  },
  disapproveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  disapproveBtnText: {
    color: '#D32F2F',
    fontWeight: '800',
    fontSize: 14,
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
