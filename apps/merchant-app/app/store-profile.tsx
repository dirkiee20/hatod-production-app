import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { authenticatedFetch, API_BASE, resolveImageUrl, getAuthToken } from '../api/client';

export default function StoreProfileScreen() {
  const router = useRouter();
  
  // State for form fields
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  
  // Dashboard stats (readonly)
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [operatingHours, setOperatingHours] = useState<any>({
    Mon: { open: '08:00', close: '22:00', isOpen: true },
    Tue: { open: '08:00', close: '22:00', isOpen: true },
    Wed: { open: '08:00', close: '22:00', isOpen: true },
    Thu: { open: '08:00', close: '22:00', isOpen: true },
    Fri: { open: '08:00', close: '22:00', isOpen: true },
    Sat: { open: '08:00', close: '22:00', isOpen: true },
    Sun: { open: '08:00', close: '22:00', isOpen: true },
  });

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
        const res = await authenticatedFetch('/merchants/profile');
        if (res.ok) {
            const data = await res.json();
            setStoreName(data.name || '');
            setAddress(data.address || '');
            setLatitude(data.latitude || null);
            setLongitude(data.longitude || null);
            setDescription(data.description || '');
            setPhone(data.phone || '');
            setCoverImage(data.coverImage);
            setLogo(data.logo);
            setRating(data.rating || 0);
            setReviewCount(data.totalOrders || 0); // Using orders as proxy solely for display if reviews not avail
            setCategories(data.categories || []);
            if (data.operatingHours) {
                setOperatingHours(typeof data.operatingHours === 'string' ? JSON.parse(data.operatingHours) : data.operatingHours);
            }
        } else {
            Alert.alert('Error', 'Failed to load profile');
        }
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'An error occurred loading profile');
    } finally {
        setLoading(false);
    }
  };
  
  // ... (pickImage, uploadImage same)

  const handleGetCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
    
    try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        });
         if (reverseGeocode.length > 0) {
             const addr = reverseGeocode[0];
             const fullAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`; 
             setAddress(fullAddress.replace(/^ ,/, '').trim());
         }
    } catch (e) {
         console.log("Reverse geocode failed", e);
    }
  };

  const pickImage = async (type: 'cover' | 'logo') => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'cover' ? [16, 9] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri, type);
    }
  };

  const uploadImage = async (uri: string, type: 'cover' | 'logo') => {
      // Create form data
      const formData = new FormData();
      
      const filename = uri.split('/').pop() || 'image.jpg';
      const fileType = filename.split('.').pop() === 'png' ? 'image/png' : 'image/jpeg';
      
      formData.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: fileType,
      } as any);

      try {
          // 1. Upload file
          const token = await getAuthToken();
          const uploadUrl = `${API_BASE}/files/upload`;
          console.log('Uploading to:', uploadUrl);

          const uploadRes = await fetch(uploadUrl, {
              method: 'POST',
              body: formData,
              headers: {
                 // Content-Type: 'multipart/form-data', // DO NOT SET THIS MANUALLY! Fetch sets it with boundary.
                 Accept: 'application/json',
                 Authorization: `Bearer ${token}`,
              }
          });
          
          if (!uploadRes.ok) {
               console.error('Upload failed with status:', uploadRes.status);
               const text = await uploadRes.text();
               console.error('Upload response:', text);
               throw new Error(`Failed to upload image: ${uploadRes.status} ${text}`);
          }

          const data = await uploadRes.json();
          console.log('Upload success, data:', data);
          const imageUrl = data.url;

          // 2. Update state locally
          if (type === 'cover') setCoverImage(imageUrl);
          else setLogo(imageUrl);

      } catch (e) {
          console.error('Upload Error Details:', e);
          Alert.alert('Error', 'Failed to upload image. Check console for details.');
      }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
        const body = {
            name: storeName,
            address,
            latitude,
            longitude,
            description,
            phone,
            coverImage,
            logo,
            operatingHours
        };
        
        const res = await authenticatedFetch('/merchants/profile', {
            method: 'PATCH',
            body: JSON.stringify(body)
        });

        if (res.ok) {
            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        } else {
            console.error(await res.text());
            Alert.alert('Error', 'Failed to update profile');
        }
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'An error occurred');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
      return (
          <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#C2185B" />
          </ThemedView>
      );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Store Profile',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Cover & Logo Section */}
        <View style={styles.brandingSection}>
            <View style={styles.coverImageContainer}>
                 {coverImage ? (
                     <Image source={{ uri: resolveImageUrl(coverImage) }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                 ) : (
                    <View style={styles.coverPlaceholder}>
                        <IconSymbol size={32} name="house.fill" color="#DDD" />
                        <ThemedText style={styles.coverText}>Add Cover Photo</ThemedText>
                    </View>
                 )}
                 <TouchableOpacity style={styles.editCoverBtn} onPress={() => pickImage('cover')}>
                    <IconSymbol size={16} name="dashboard" color="#FFF" />
                 </TouchableOpacity>
            </View>

            <View style={styles.logoRow}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={{ uri: resolveImageUrl(logo) || 'https://via.placeholder.com/150' }} 
                        style={styles.logoImg} 
                    />
                    <TouchableOpacity style={styles.editLogoBtn} onPress={() => pickImage('logo')}>
                        <IconSymbol size={12} name="dashboard" color="#FFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.ratingInfo}>
                    <ThemedText style={styles.ratingLabel}>Store Rating</ThemedText>
                    <View style={styles.stars}>
                        <IconSymbol size={16} name="person" color="#FFD700" />
                        <ThemedText style={styles.ratingVal}>{rating.toFixed(1)}</ThemedText>
                        <ThemedText style={styles.ratingCount}>({reviewCount} reviews)</ThemedText>
                    </View>
                </View>
            </View>
        </View>

        {/* Basic Info Form */}
        <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
            
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Store Name</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={storeName} 
                    onChangeText={setStoreName}
                    placeholder="Enter store name"
                />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Store Address</ThemedText>
                <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                    <TextInput 
                        style={[styles.input, {flex: 1}]} 
                        value={address} 
                        onChangeText={setAddress}
                        placeholder="Enter full address"
                    />
                    <TouchableOpacity onPress={handleGetCurrentLocation} style={{
                        backgroundColor: '#C2185B', borderRadius: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center'
                    }}>
                        <IconSymbol size={20} name="location.fill" color="#FFF" />
                    </TouchableOpacity>
                </View>
                {latitude && longitude && (
                    <ThemedText style={{fontSize: 11, color: '#4CAF50', marginTop: 4, fontWeight: '600'}}>
                         Location Pinned ✓
                    </ThemedText>
                )}
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput 
                    style={styles.input} 
                    value={phone} 
                    keyboardType="phone-pad"
                    onChangeText={setPhone}
                    placeholder="09xx xxx xxxx"
                />
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Description</ThemedText>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={description} 
                    multiline
                    numberOfLines={4}
                    onChangeText={setDescription}
                    placeholder="Describe your store..."
                />
            </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Operating Hours</ThemedText>
            {DAYS.map((day) => {
                const dayData = operatingHours[day];
                return (
                    <View key={day} style={styles.hoursRow}>
                        <View style={styles.dayCol}>
                            <ThemedText style={styles.dayText}>{day}</ThemedText>
                        </View>
                        <View style={styles.toggleCol}>
                             <Switch
                                value={dayData.isOpen}
                                onValueChange={(val) => {
                                    setOperatingHours((prev: any) => ({
                                        ...prev,
                                        [day]: { ...prev[day], isOpen: val }
                                    }));
                                }}
                                trackColor={{ false: '#DDD', true: '#F48FB1' }}
                                thumbColor={dayData.isOpen ? '#C2185B' : '#FFF'}
                             />
                             <ThemedText style={styles.statusText}>{dayData.isOpen ? 'Open' : 'Closed'}</ThemedText>
                        </View>
                        {dayData.isOpen && (
                            <View style={styles.timeCol}>
                                <TextInput
                                    style={styles.timeInput}
                                    value={dayData.open}
                                    onChangeText={(text) => {
                                        setOperatingHours((prev: any) => ({
                                            ...prev,
                                            [day]: { ...prev[day], open: text }
                                        }));
                                    }}
                                    placeholder="08:00"
                                />
                                <ThemedText style={styles.toText}>to</ThemedText>
                                <TextInput
                                    style={styles.timeInput}
                                    value={dayData.close}
                                    onChangeText={(text) => {
                                        setOperatingHours((prev: any) => ({
                                            ...prev,
                                            [day]: { ...prev[day], close: text }
                                        }));
                                    }}
                                    placeholder="22:00"
                                />
                            </View>
                        )}
                    </View>
                );
            })}
        </View>

        {/* Categories */}
        <View style={styles.section}>
             <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
             <View style={styles.tagsRow}>
                 {categories.map((cat) => (
                    <View key={cat.id} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{cat.name}</ThemedText>
                        <TouchableOpacity onPress={async () => {
                            Alert.alert("Delete Category", `Are you sure you want to delete "${cat.name}"?`,
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Delete", style: "destructive", onPress: async () => {
                                        try {
                                            const res = await authenticatedFetch(`/menu/categories/${cat.id}`, { method: 'DELETE' });
                                            if (res.ok) {
                                                fetchProfile(); // Refresh
                                            } else {
                                                const err = await res.json();
                                                Alert.alert("Error", err.message || "Failed to delete category");
                                            }
                                        } catch (e) {
                                            Alert.alert("Error", "An error occurred");
                                        }
                                    }}
                                ]
                            )
                        }}>
                           <IconSymbol size={14} name="trash.fill" color="#C2185B" />
                        </TouchableOpacity>
                    </View>
                 ))}
                 
                 {categories.length === 0 && !isAddingCategory && (
                     <ThemedText style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>No categories yet.</ThemedText>
                 )}

                 {isAddingCategory ? (
                     <View style={[styles.tag, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C2185B' }]}>
                         <TextInput 
                            value={newCategoryName} 
                            onChangeText={setNewCategoryName} 
                            autoFocus 
                            placeholder="New Category"
                            style={{ fontSize: 13, color: '#333', minWidth: 80, padding: 0 }}
                            onSubmitEditing={async () => {
                                if (!newCategoryName.trim()) { setIsAddingCategory(false); return; }
                                try {
                                    const res = await authenticatedFetch('/menu/categories', {
                                        method: 'POST',
                                        body: JSON.stringify({ name: newCategoryName, merchantId: "" }) // merchantId filled by backend from token
                                    });
                                    if (res.ok) {
                                        setNewCategoryName('');
                                        setIsAddingCategory(false);
                                        fetchProfile();
                                    } else {
                                        Alert.alert("Error", "Failed to add category");
                                    }
                                } catch (e) { Alert.alert("Error", "An error occurred"); }
                            }}
                         />
                         <TouchableOpacity onPress={() => setIsAddingCategory(false)}>
                             <ThemedText style={{color: '#999', fontWeight:'bold', marginLeft: 5}}>X</ThemedText>
                         </TouchableOpacity>
                     </View>
                 ) : (
                    <TouchableOpacity style={styles.addTagBtn} onPress={() => setIsAddingCategory(true)}>
                        <IconSymbol size={14} name="add" color="#C2185B" />
                        <ThemedText style={styles.addTagText}>Add</ThemedText>
                    </TouchableOpacity>
                 )}
             </View>
        </View>

        {/* Save Button */}
        <View style={styles.footer}>
             <TouchableOpacity style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleSave} disabled={isSubmitting}>
                <ThemedText style={styles.saveBtnText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</ThemedText>
             </TouchableOpacity>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    paddingBottom: 40,
  },
  brandingSection: {
    backgroundColor: '#FFF',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  coverImageContainer: {
    height: 150,
    backgroundColor: '#EEEEEE',
    position: 'relative',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: {
    marginTop: 8,
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  editCoverBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -40,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  logoImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  editLogoBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#C2185B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  ratingInfo: {
    paddingBottom: 4,
  },
  ratingLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    color: '#C2185B',
    fontSize: 13,
    fontWeight: '700',
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C2185B',
    borderStyle: 'dashed',
    gap: 4,
  },
  addTagText: {
    color: '#C2185B',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
  },
  saveBtn: {
    backgroundColor: '#C2185B',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dayCol: {
    width: 50,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  toggleCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    fontSize: 13,
    textAlign: 'center',
  },
  toText: {
    fontSize: 12,
    color: '#999',
  },
});
