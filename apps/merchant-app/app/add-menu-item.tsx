import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Image, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddMenuItemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    available: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [variants, setVariants] = useState<any[]>([]);

  const categories = ['Main Course', 'Appetizer', 'Beverages', 'Desserts', 'Promo'];

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert("Please fill in the name and price");
      return;
    }

    setIsSubmitting(true);
    try {
        const { authenticatedFetch } = await import('../api/client');
        
        // 1. Ensure category exists (simplification: we might want to fetch IDs first, but for now we can create on the fly or just assume existence if we had IDs. The backend expects categoryId, but let's see if we can just pass a string or if we need to implement category lookup.
        // For this demo, let's actually just fetch the categories first or create them. 
        // To simplify, I'll update the backend to optional categoryId or handle text categories, OR we just assume 'Main Course' maps to something.
        // Let's first fetch categories from backend to see if we can match.
        
        const catRes = await authenticatedFetch('/menu/categories');
        let categoryId = null;
        if (catRes.ok) {
            const cats = await catRes.json();
            const found = cats.find((c: any) => c.name === formData.category);
            if (found) {
                categoryId = found.id;
            } else {
                // Determine sort order
                const sortOrder = cats.length; 
                // Create category
                 const newCatRes = await authenticatedFetch('/menu/categories', {
                    method: 'POST',
                    body: JSON.stringify({ name: formData.category, sortOrder })
                 });
                 if (newCatRes.ok) {
                    const newCat = await newCatRes.json();
                    categoryId = newCat.id;
                 }
            }
        }

        const body = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            categoryId: categoryId,
            isAvailable: formData.available,
            // For variants, we might need a separate relation or store as JSON. 
            // The current simple schema doesn't support deep variants, so let's append to description or ignore for now to keep it simple as requested.
            // Or we could store it in description for this first pass.
        };

        const res = await authenticatedFetch('/menu/items', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert('Menu item added successfully!');
            router.back();
        } else {
            console.error(await res.text());
            alert('Failed to add item');
        }

    } catch (e) {
        console.error(e);
        alert('An error occurred');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Add New Item',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Upload Placeholder */}
        <TouchableOpacity style={styles.imageUploadBox}>
          <ThemedView style={styles.imagePlaceholderCircle}>
             <IconSymbol size={30} name="dashboard" color="#888" />
          </ThemedView>
          <ThemedText style={styles.uploadText}>Upload Product Image</ThemedText>
          <ThemedText style={styles.uploadSubtext}>JPG or PNG, max 5MB</ThemedText>
        </TouchableOpacity>

        {/* Form Fields */}
        <ThemedView style={styles.formSection}>
          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Product Name</ThemedText>
            <TextInput 
              style={styles.textInput}
              placeholder="e.g. Signature Burger"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Description</ThemedText>
            <TextInput 
              style={[styles.textInput, styles.textArea]}
              placeholder="Tell customers about your dish..."
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </ThemedView>

          {variants.length === 0 ? (
            <View style={styles.rowInputs}>
              <ThemedView style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                <ThemedText style={styles.inputLabel}>Price (₱)</ThemedText>
                <TextInput 
                  style={styles.textInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) => setFormData({...formData, price: text})}
                  placeholderTextColor="#999"
                />
              </ThemedView>

              <ThemedView style={[styles.inputGroup, { flex: 1.5 }]}>
                <ThemedText style={styles.inputLabel}>Category</ThemedText>
                <ThemedView style={styles.categoryPicker}>
                   <ThemedText style={styles.categoryText}>{formData.category}</ThemedText>
                   <IconSymbol size={14} name="chevron.right" color="#888" style={{ transform: [{ rotate: '90deg' }] }} />
                </ThemedView>
              </ThemedView>
            </View>
          ) : (
            <>
              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Category</ThemedText>
                <ThemedView style={styles.categoryPicker}>
                   <ThemedText style={styles.categoryText}>{formData.category}</ThemedText>
                   <IconSymbol size={14} name="chevron.right" color="#888" style={{ transform: [{ rotate: '90deg' }] }} />
                </ThemedView>
              </ThemedView>
              
              <ThemedView style={styles.variantPriceNotice}>
                <IconSymbol size={16} name="dashboard" color="#C2185B" />
                <ThemedText style={styles.variantPriceNoticeText}>
                  Pricing is set through variant options below
                </ThemedText>
              </ThemedView>
            </>
          )}

          <ThemedView style={styles.switchGroup}>
             <View>
                <ThemedText style={styles.switchLabel}>Available for Order</ThemedText>
                <ThemedText style={styles.switchSub}>Instantly show/hide item from menu</ThemedText>
             </View>
             <Switch 
               value={formData.available}
               onValueChange={(val) => setFormData({...formData, available: val})}
               trackColor={{ false: '#DDD', true: '#F48FB1' }}
               thumbColor={formData.available ? '#C2185B' : '#FFF'}
             />
          </ThemedView>
        </ThemedView>

        {/* Variants Section */}
        <ThemedView style={styles.variantSection}>
           <ThemedView style={styles.sectionHeader}>
             <ThemedText style={styles.sectionTitle}>Variants & Options</ThemedText>
             <TouchableOpacity 
               style={styles.addGroupBtn}
               onPress={() => setVariants([...variants, { name: '', options: [{ label: '', price: '' }] }])}
             >
                <ThemedText style={styles.addGroupText}>+ Add Group</ThemedText>
             </TouchableOpacity>
           </ThemedView>

           {variants.map((group: any, gIdx: number) => (
             <ThemedView key={gIdx} style={styles.variantGroup}>
                <ThemedView style={styles.groupHeader}>
                   <TextInput 
                     style={styles.groupNameInput}
                     placeholder="Group Name (e.g. Size)"
                     value={group.name}
                     onChangeText={(text) => {
                        const newVariants = [...variants];
                        newVariants[gIdx].name = text;
                        setVariants(newVariants);
                     }}
                     placeholderTextColor="#999"
                   />
                   <TouchableOpacity onPress={() => setVariants(variants.filter((_: any, i: number) => i !== gIdx))}>
                      <IconSymbol size={18} name="chevron.right" color="#D32F2F" />
                   </TouchableOpacity>
                </ThemedView>

                {group.options.map((opt: any, oIdx: number) => (
                   <ThemedView key={oIdx} style={styles.optionRow}>
                      <TextInput 
                        style={[styles.textInput, { flex: 2, marginRight: 10 }]}
                        placeholder="Option (e.g. Large)"
                        value={opt.label}
                        onChangeText={(text) => {
                           const newVariants = [...variants];
                           newVariants[gIdx].options[oIdx].label = text;
                           setVariants(newVariants);
                        }}
                        placeholderTextColor="#999"
                      />
                      <TextInput 
                        style={[styles.textInput, { flex: 1, marginRight: 10 }]}
                        placeholder="+₱ 0"
                        keyboardType="numeric"
                        value={opt.price}
                        onChangeText={(text) => {
                           const newVariants = [...variants];
                           newVariants[gIdx].options[oIdx].price = text;
                           setVariants(newVariants);
                        }}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity onPress={() => {
                         const newVariants = [...variants];
                         newVariants[gIdx].options = group.options.filter((_: any, i: number) => i !== oIdx);
                         setVariants(newVariants);
                      }}>
                         <IconSymbol size={16} name="chevron.right" color="#AAA" />
                      </TouchableOpacity>
                   </ThemedView>
                ))}

                <TouchableOpacity 
                  style={styles.addOptionBtn}
                  onPress={() => {
                     const newVariants = [...variants];
                     newVariants[gIdx].options.push({ label: '', price: '' });
                     setVariants(newVariants);
                  }}
                >
                   <ThemedText style={styles.addOptionText}>+ Add Option</ThemedText>
                </TouchableOpacity>
             </ThemedView>
           ))}
        </ThemedView>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Action */}
      <ThemedView style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
         <TouchableOpacity 
            style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSubmitting}
         >
            <ThemedText style={styles.saveBtnText}>
                {isSubmitting ? 'Saving...' : 'Save and Add to Menu'}
            </ThemedText>
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
    padding: 20,
  },
  imageUploadBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  imagePlaceholderCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  uploadSubtext: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 2,
  },
  formSection: {
    backgroundColor: 'transparent',
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 'auto',
    minHeight: 100,
    paddingTop: 15,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: '#FAFAFA',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF9FB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE4EC',
    marginTop: 10,
    marginBottom: 5,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
  },
  switchSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  variantPriceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9FB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCE4EC',
    marginTop: 10,
  },
  variantPriceNoticeText: {
    fontSize: 13,
    color: '#C2185B',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  variantSection: {
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addGroupBtn: {
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addGroupText: {
    color: '#C2185B',
    fontSize: 12,
    fontWeight: '800',
  },
  variantGroup: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  groupNameInput: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  addOptionBtn: {
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  addOptionText: {
    fontSize: 13,
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
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  saveBtn: {
    backgroundColor: '#C2185B',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
