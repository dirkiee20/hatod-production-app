import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Image, Switch, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE, authenticatedFetch, resolveImageUrl } from '../api/client'; // Import authenticatedFetch

export default function AddMenuItemScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams(); // Get editId from params
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    available: true,
  });
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const categories = ['Main Course', 'Appetizer', 'Beverages', 'Desserts', 'Promo'];

  useEffect(() => {
    if (editId) {
        fetchItemDetails(editId as string);
    }
  }, [editId]);

  const fetchItemDetails = async (id: string) => {
      try {
          const res = await authenticatedFetch(`/menu/public/items/${id}`);
          if (res.ok) {
              const data = await res.json();
              // const { description, variants: parsedVariants } = parseVariants(data.description || '');
              
              setFormData({
                  name: data.name,
                  description: data.description || '',
                  price: data.price.toString(),
                  category: data.category?.name || 'Main Course',
                  available: data.isAvailable
              });
              
              if (data.image) {
                  const baseUrl = API_BASE.replace(/\/api\/?$/, '');
                  // Check if it's already a full URL or relative
                  if (data.image.startsWith('http')) setImage(data.image);
                  else setImage(`${baseUrl}${data.image}`);
              }
              
              if (data.options) {
                  setVariants(data.options);
              } else if (data.description) {
                   // Fallback for legacy items: parse description
                   const { variants: parsedVariants } = parseVariants(data.description);
                   setVariants(parsedVariants);
              }
          }
      } catch (e) {
          console.error("Failed to fetch item for edit", e);
      }
  };

  const parseVariants = (fullDesc: string) => {
      const variantRegex = /\[(.*?)\s\((.*?)\):\s(.*?)\]/g;
      const parsedVariants: any[] = [];
      let cleanDescription = fullDesc.replace(variantRegex, '').trim();

      let match;
      while ((match = variantRegex.exec(fullDesc)) !== null) {
          const name = match[1];
          const reqText = match[2];
          const itemsStr = match[3];
          const isRequired = reqText.toLowerCase() === 'required';
          
          const options = itemsStr.split(', ').map(s => {
              const itemMatch = s.match(/(.*?)\s\(\+\$(\d+(?:\.\d+)?)\)/);
              if (itemMatch) {
                  return { label: itemMatch[1], price: itemMatch[2] };
              }
              // Handle "Regular" or other 0 price items
              return { label: s, price: '0' }; 
          });

          parsedVariants.push({ name, isRequired, options });
      }
      return { description: cleanDescription, variants: parsedVariants };
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square for menu items
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert("Please fill in the name and price");
      return;
    }

    setIsSubmitting(true);
    try {
        // Capture state values up front to avoid any shadowing issues
        const itemName = formData.name;
        const itemDescription = formData.description;
        const itemPrice = parseFloat(formData.price);
        const itemCategory = formData.category;
        const itemAvailable = formData.available;

        if (isNaN(itemPrice)) {
          alert('Please enter a valid price');
          return;
        }

        // Upload Image if selected and it's a local file (not already a URL)
        let imageUrl = image;
        if (image && !image.startsWith('http')) {
            try {
                const uploadForm = new FormData();
                uploadForm.append('file', {
                    uri: image,
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                } as any);

                const uploadResponse = await authenticatedFetch('/files/upload', {
                    method: 'POST',
                    body: uploadForm,
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    imageUrl = uploadResult.url;
                    console.log('Image uploaded:', imageUrl);
                } else {
                    const errText = await uploadResponse.text();
                    console.error('Image upload failed:', errText);
                    // Continue without image — don't block the save
                }
            } catch (err) {
                console.error('Error uploading image:', err);
                // Continue without image
            }
        }

        // Find or create category
        let categoryId: string | null = null;
        try {
            const catRes = await authenticatedFetch('/menu/categories');
            if (catRes.ok) {
                const cats = await catRes.json();
                const found = cats.find((c: any) => c.name === itemCategory);
                if (found) {
                    categoryId = found.id;
                } else {
                    const newCatRes = await authenticatedFetch('/menu/categories', {
                        method: 'POST',
                        body: JSON.stringify({ name: itemCategory, sortOrder: cats.length })
                    });
                    if (newCatRes.ok) {
                        const newCat = await newCatRes.json();
                        categoryId = newCat.id;
                    }
                }
            }
        } catch (catErr) {
            console.error('Category fetch/create failed:', catErr);
        }

        const body = {
            name: itemName,
            description: itemDescription,
            price: itemPrice,
            categoryId,
            isAvailable: itemAvailable,
            image: imageUrl,
            options: variants.length > 0 ? variants : undefined,
        };

        const url = editId ? `/menu/items/${editId}` : '/menu/items';
        const method = editId ? 'PATCH' : 'POST';

        console.log('Saving menu item to', url, JSON.stringify(body));

        const res = await authenticatedFetch(url, {
            method,
            body: JSON.stringify(body),
        });

        if (res.ok) {
            alert(editId ? 'Menu item updated!' : 'Menu item added successfully!');
            router.back();
        } else {
            const errText = await res.text();
            console.error('Save failed:', errText);
            alert(`Failed to save item: ${res.status}`);
        }

    } catch (e) {
        console.error('handleSave error:', e);
        alert('An error occurred while saving');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: editId ? 'Edit Item' : 'Add New Item',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Upload Placeholder */}
        <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage}>
          {image ? (
              <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
          ) : (
            <>
              <ThemedView style={styles.imagePlaceholderCircle}>
                 <IconSymbol size={30} name="dashboard" color="#888" />
              </ThemedView>
              <ThemedText style={styles.uploadText}>Upload Product Image</ThemedText>
              <ThemedText style={styles.uploadSubtext}>JPG or PNG, max 5MB</ThemedText>
            </>
          )}
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
                <TouchableOpacity 
                  style={styles.categoryPicker}
                  onPress={() => {
                     const currentIndex = categories.indexOf(formData.category);
                     const nextIndex = (currentIndex + 1) % categories.length;
                     setFormData({...formData, category: categories[nextIndex]});
                  }}
                >
                   <ThemedText style={styles.categoryText}>{formData.category}</ThemedText>
                   <IconSymbol size={14} name="chevron.right" color="#888" style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
              </ThemedView>
            </View>
              
            {variants.length > 0 && (
                <ThemedView style={styles.variantPriceNotice}>
                    <IconSymbol size={16} name="dashboard" color="#C2185B" />
                    <ThemedText style={styles.variantPriceNoticeText}>
                    Variants will add to the base price above
                    </ThemedText>
                </ThemedView>
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
               onPress={() => setVariants([...variants, { name: '', isRequired: false, options: [{ label: '', price: '' }] }])}
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

                {/* Configuration: Required & Display Style */}
                <View style={{ marginBottom: 15, paddingHorizontal: 2 }}>
                    {/* Required Toggle */}
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between'}}>
                        <ThemedText style={{fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase'}}>Requirement:</ThemedText>
                        <View style={{flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 2}}>
                             <TouchableOpacity 
                                onPress={() => {
                                    const newVariants = [...variants];
                                    newVariants[gIdx].isRequired = true;
                                    
                                    // Auto-add "Regular" option if it doesn't exist
                                    const hasRegular = newVariants[gIdx].options.some((opt: any) => opt.label.toLowerCase() === 'regular');
                                    if (!hasRegular) {
                                        newVariants[gIdx].options.unshift({ label: 'Regular', price: '0' });
                                    }

                                    setVariants(newVariants);
                                }}
                                style={{
                                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                                    backgroundColor: group.isRequired ? '#FFF' : 'transparent',
                                    shadowColor: "#000", shadowOpacity: group.isRequired ? 0.1 : 0, shadowRadius: 2, elevation: group.isRequired ? 2 : 0
                                }}
                             >
                                <ThemedText style={{fontSize: 12, fontWeight: '700', color: group.isRequired ? '#C2185B' : '#999'}}>Required</ThemedText>
                             </TouchableOpacity>
                             <TouchableOpacity 
                                onPress={() => {
                                    const newVariants = [...variants];
                                    newVariants[gIdx].isRequired = false;
                                    
                                    // Remove "Regular" option if switching back to Optional
                                    newVariants[gIdx].options = newVariants[gIdx].options.filter((opt: any) => opt.label.toLowerCase() !== 'regular');

                                    setVariants(newVariants);
                                }}
                                style={{
                                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                                    backgroundColor: !group.isRequired ? '#FFF' : 'transparent',
                                    shadowColor: "#000", shadowOpacity: !group.isRequired ? 0.1 : 0, shadowRadius: 2, elevation: !group.isRequired ? 2 : 0
                                }}
                             >
                                <ThemedText style={{fontSize: 12, fontWeight: '700', color: !group.isRequired ? '#333' : '#999'}}>Optional</ThemedText>
                             </TouchableOpacity>
                        </View>
                    </View>
                </View>

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
                       {opt.label.toLowerCase() === 'regular' ? (
                           <View style={[styles.textInput, { flex: 1, marginRight: 10, justifyContent: 'center', backgroundColor: '#F5F5F5' }]}>
                               <ThemedText style={{color: '#888', fontStyle: 'italic', fontSize: 13}}>Base Price</ThemedText>
                           </View>
                       ) : (
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
                       )}
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
                {isSubmitting ? 'Saving...' : (editId ? 'Update Item' : 'Save and Add to Menu')}
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
