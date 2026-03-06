import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { resolveImageUrl } from '@/api/client';
import {
  createFoodCategory,
  deleteFoodCategory,
  getFoodCategoriesAdmin,
  updateFoodCategory,
} from '@/api/services';
import { FoodCategorySetting } from '@/api/types';

type EditableCategory = FoodCategorySetting & {
  draftName: string;
  draftImageUrl: string;
  draftSortOrder: string;
  saving?: boolean;
};

const toEditable = (category: FoodCategorySetting): EditableCategory => ({
  ...category,
  draftName: category.name,
  draftImageUrl: category.imageUrl,
  draftSortOrder: String(category.sortOrder),
  saving: false,
});

export default function FoodCategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<EditableCategory[]>([]);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const data = await getFoodCategoriesAdmin();
    setItems(data.map(toEditable));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const createPreviewUri = useMemo(() => {
    const trimmed = imageUrl.trim();
    if (!trimmed) return undefined;
    return resolveImageUrl(trimmed) || trimmed;
  }, [imageUrl]);

  const parseSortOrder = (value: string): number => {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Category name is required.');
      return;
    }
    if (!imageUrl.trim()) {
      Alert.alert('Validation', 'Category image URL is required.');
      return;
    }

    setCreating(true);
    const created = await createFoodCategory({
      name: name.trim(),
      imageUrl: imageUrl.trim(),
      sortOrder: parseSortOrder(sortOrder),
      isActive: true,
    });
    setCreating(false);

    if (!created) {
      Alert.alert('Error', 'Failed to create category. Check image URL and try again.');
      return;
    }

    setName('');
    setImageUrl('');
    setSortOrder('0');
    await loadCategories();
  };

  const updateDraft = (
    id: string,
    patch: Partial<Pick<EditableCategory, 'draftName' | 'draftImageUrl' | 'draftSortOrder' | 'isActive' | 'saving'>>,
  ) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const saveItem = async (item: EditableCategory) => {
    if (!item.draftName.trim()) {
      Alert.alert('Validation', 'Category name is required.');
      return;
    }
    if (!item.draftImageUrl.trim()) {
      Alert.alert('Validation', 'Category image URL is required.');
      return;
    }

    updateDraft(item.id, { saving: true });
    const updated = await updateFoodCategory(item.id, {
      name: item.draftName.trim(),
      imageUrl: item.draftImageUrl.trim(),
      sortOrder: parseSortOrder(item.draftSortOrder),
      isActive: item.isActive,
    });
    updateDraft(item.id, { saving: false });

    if (!updated) {
      Alert.alert('Error', 'Failed to save category.');
      return;
    }

    setItems((prev) => prev.map((row) => (row.id === item.id ? toEditable(updated) : row)));
  };

  const toggleActive = async (item: EditableCategory, next: boolean) => {
    updateDraft(item.id, { isActive: next, saving: true });
    const updated = await updateFoodCategory(item.id, { isActive: next });
    updateDraft(item.id, { saving: false });

    if (!updated) {
      updateDraft(item.id, { isActive: item.isActive });
      Alert.alert('Error', 'Failed to update active status.');
      return;
    }

    setItems((prev) => prev.map((row) => (row.id === item.id ? toEditable(updated) : row)));
  };

  const confirmDelete = (item: EditableCategory) => {
    Alert.alert(
      'Delete Category',
      `Delete "${item.name}"? This removes it from the customer Food tab.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteFoodCategory(item.id);
            if (!ok) {
              Alert.alert('Error', 'Failed to delete category.');
              return;
            }
            setItems((prev) => prev.filter((row) => row.id !== item.id));
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Food Categories',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerTintColor: '#4f46e5',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol
                size={20}
                name="chevron.right"
                color="#4f46e5"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.cardTitle}>Create Category</ThemedText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Category name (e.g., Burgers)"
            placeholderTextColor="#9AA0AA"
          />
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="Image URL or /uploads path"
            placeholderTextColor="#9AA0AA"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={sortOrder}
            onChangeText={setSortOrder}
            placeholder="Sort order"
            placeholderTextColor="#9AA0AA"
            keyboardType="number-pad"
          />

          {createPreviewUri ? (
            <Image source={{ uri: createPreviewUri }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.previewPlaceholder]}>
              <ThemedText style={styles.previewText}>Image preview</ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, creating && { opacity: 0.65 }]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Add Category</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedText style={styles.sectionLabel}>Configured Categories</ThemedText>

        {loading ? (
          <ThemedView style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <ThemedText style={styles.loadingText}>Loading categories...</ThemedText>
          </ThemedView>
        ) : items.length === 0 ? (
          <ThemedView style={styles.emptyWrap}>
            <ThemedText style={styles.emptyTitle}>No categories yet</ThemedText>
            <ThemedText style={styles.emptySub}>Add your first permanent food category above.</ThemedText>
          </ThemedView>
        ) : (
          items.map((item) => {
            const previewUri = resolveImageUrl(item.draftImageUrl) || item.draftImageUrl;
            return (
              <ThemedView key={item.id} style={styles.itemCard}>
                <Image source={{ uri: previewUri }} style={styles.itemImage} />
                <View style={styles.itemContent}>
                  <TextInput
                    style={styles.input}
                    value={item.draftName}
                    onChangeText={(value) => updateDraft(item.id, { draftName: value })}
                    placeholder="Category name"
                    placeholderTextColor="#9AA0AA"
                  />
                  <TextInput
                    style={styles.input}
                    value={item.draftImageUrl}
                    onChangeText={(value) => updateDraft(item.id, { draftImageUrl: value })}
                    placeholder="Image URL"
                    placeholderTextColor="#9AA0AA"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    style={styles.input}
                    value={item.draftSortOrder}
                    onChangeText={(value) => updateDraft(item.id, { draftSortOrder: value })}
                    placeholder="Sort order"
                    placeholderTextColor="#9AA0AA"
                    keyboardType="number-pad"
                  />

                  <View style={styles.row}>
                    <ThemedText style={styles.statusLabel}>
                      {item.isActive ? 'Active' : 'Hidden'}
                    </ThemedText>
                    <Switch
                      value={item.isActive}
                      onValueChange={(next) => toggleActive(item, next)}
                      disabled={!!item.saving}
                    />
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.saveButton, !!item.saving && { opacity: 0.65 }]}
                      onPress={() => saveItem(item)}
                      disabled={!!item.saving}
                    >
                      {item.saving ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDelete(item)}
                      disabled={!!item.saving}
                    >
                      <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </ThemedView>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FB' },
  content: { padding: 16, paddingBottom: 36 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1F2430', marginBottom: 10 },
  input: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#E2E6EE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1F2430',
    marginBottom: 10,
  },
  preview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#ECEFF5',
    marginBottom: 10,
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    color: '#8C94A5',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C94A5',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 2,
  },
  loadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: { marginTop: 8, color: '#8C94A5' },
  emptyWrap: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    padding: 18,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#1F2430' },
  emptySub: { fontSize: 12, color: '#8C94A5', marginTop: 4 },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#ECEFF5',
  },
  itemContent: { padding: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  statusLabel: { fontSize: 12, fontWeight: '700', color: '#4A5260' },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { color: '#DC2626', fontSize: 13, fontWeight: '800' },
});
