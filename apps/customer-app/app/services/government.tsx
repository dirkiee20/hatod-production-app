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
            <ActivityIndicator size="large" color="#C2185B" />
        </ThemedView>
     );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Pink Header with Search */}
      <ThemedView style={styles.headerBackground}>
        <ThemedView style={styles.searchRow}>
          <ThemedView style={styles.searchBar}>
            <IconSymbol size={18} name="chevron.right" color="#777" style={{ transform: [{ rotate: '90deg' }], marginRight: 8 }} />
            <TextInput
              placeholder="Search for government services..."
              style={styles.searchInput}
              placeholderTextColor="#777"
            />
          </ThemedView>
          <TouchableOpacity style={styles.filterButton}>
            <IconSymbol size={20} name="filter" color="#FFF" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.contentBody}>
        <ThemedView style={styles.introSection}>
          <ThemedText style={styles.pageTitle}>Government Services</ThemedText>
          <ThemedText style={styles.pageSubtitle}>Skip the line. We'll handle the delivery only for you.</ThemedText>
        </ThemedView>

        {groupedServices.length === 0 ? (
            <ThemedView style={{ padding: 20 }}>
                <ThemedText>No services found.</ThemedText>
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
    backgroundColor: '#C2185B',
    paddingTop: 50,
    paddingBottom: 15,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  filterButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBody: {
    flex: 1,
    paddingTop: 20,
  },
  introSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#222',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
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
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
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
    color: '#C2185B',
    fontWeight: '800',
  },
});
