import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useEffect, useState } from 'react';
import { getMenuItemsByMerchant } from '@/api/services';

const GOV_MERCHANT_ID = '57d3838e-0678-4908-ba98-322960675688';

export default function GovernmentScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [groupedServices, setGroupedServices] = useState<any[]>([]);

  useEffect(() => {
    async function fetchServices() {
        setLoading(true);
        const items = await getMenuItemsByMerchant(GOV_MERCHANT_ID);
        
        // Group by category
        const groups: any = {};
        items.forEach(item => {
            const catName = item.category?.name || 'Other Services';
            if (!groups[catName]) {
                groups[catName] = {
                    title: catName,
                    items: []
                };
            }
            groups[catName].items.push(item);
        });
        
        // Convert to array
        setGroupedServices(Object.values(groups));
        setLoading(false);
    }
    fetchServices();
  }, []);

  if (loading) {
     return (
        <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#5c6cc9" />
        </ThemedView>
     );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Sub-page Header */}
      <ThemedView style={styles.headerBackground}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800' }} 
          style={styles.headerImage} 
        />
        <View style={styles.headerOverlay} />
        
        <View style={styles.headerSafeArea}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.right" size={24} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.headerTitle}>Government Services</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Skip the line. We handle the delivery.</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.contentBody}>
        <ThemedView style={styles.searchRow}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="chevron.right" color="#777" style={{ transform: [{ rotate: '90deg' }], marginRight: 8 }} />
            <TextInput
              placeholder="Search services..."
              style={styles.searchInput}
              placeholderTextColor="#777"
            />
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Business & Trade</ThemedText>
            <ThemedView style={styles.itemsGrid}>
                <TouchableOpacity 
                    style={styles.serviceCard}
                    onPress={() => router.push('/services/business-permit')}
                >
                    <ThemedView style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                        <IconSymbol size={24} name="building.2.fill" color="#1565C0" />
                    </ThemedView>
                    
                    <ThemedView style={styles.cardInfo}>
                        <ThemedText style={styles.itemName} numberOfLines={1}>Business Permits</ThemedText>
                        <ThemedText style={styles.itemMeta} numberOfLines={1}>New or Renewal business application processing</ThemedText>
                        
                        <ThemedView style={styles.feeHighlight}>
                            <ThemedText style={styles.feeText}>Quoted service fee</ThemedText>
                        </ThemedView>
                    </ThemedView>
                    
                    <IconSymbol size={18} name="chevron.right" color="#DDD" />
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>

        {groupedServices.length === 0 ? (
            <ThemedView style={{ padding: 20 }}>
                <ThemedText>No additional services found.</ThemedText>
            </ThemedView>
        ) : (
            groupedServices.map((section, sIndex) => (
            <ThemedView key={sIndex} style={styles.sectionContainer}>
                <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                
                <ThemedView style={styles.itemsGrid}>
                {section.items.map((item: any) => (
                    <TouchableOpacity 
                    key={item.id} 
                    style={styles.serviceCard}
                    onPress={() => router.push(`/menu-item/${item.id}`)}
                    >
                    <ThemedView style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                        {/* Use item.image as icon name if possible, else default */}
                        <IconSymbol size={24} name={(item.image as any) || "description"} color="#1565C0" />
                    </ThemedView>
                    
                    <ThemedView style={styles.cardInfo}>
                        <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
                        <ThemedText style={styles.itemMeta} numberOfLines={1}>{item.description}</ThemedText>
                        
                        <ThemedView style={styles.feeHighlight}>
                        <ThemedText style={styles.feeText}>₱{item.price} service fee</ThemedText>
                        </ThemedView>
                    </ThemedView>
                    
                    <IconSymbol size={18} name="chevron.right" color="#DDD" />
                    </TouchableOpacity>
                ))}
                </ThemedView>
            </ThemedView>
            ))
        )}
        
        <ThemedView style={{ height: 100 }} />
      </ThemedView>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerBackground: {
    height: 180,
    position: 'relative',
    backgroundColor: '#1565C0',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 101, 192, 0.85)',
  },
  headerSafeArea: {
    paddingTop: 50,
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginTop: 'auto',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  contentBody: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#F5F7FA', // distinct backing for lists
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  itemsGrid: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  itemMeta: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  feeHighlight: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  feeText: {
    fontSize: 11,
    color: '#5c6cc9',
    fontWeight: '800',
  },
});
