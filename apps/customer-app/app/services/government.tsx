import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, View, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useEffect, useState } from 'react';
import { getGovernmentServiceConfig, getMenuItemsByMerchant } from '@/api/services';

const GOV_MERCHANT_ID = '57d3838e-0678-4908-ba98-322960675688';
const DEFAULT_UNAVAILABLE_MESSAGE =
  'Government services are currently unavailable. Please check back later.';

export default function GovernmentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState(DEFAULT_UNAVAILABLE_MESSAGE);
  const [groupedServices, setGroupedServices] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      setLoading(true);

      try {
        const config = await getGovernmentServiceConfig();
        const enabled = config?.enabled ?? false;
        if (!isMounted) return;

        setServiceEnabled(enabled);
        setUnavailableMessage(config?.message || DEFAULT_UNAVAILABLE_MESSAGE);

        if (!enabled) {
          setGroupedServices([]);
          return;
        }

        const items = await getMenuItemsByMerchant(GOV_MERCHANT_ID);
        if (!isMounted) return;

        const groups: Record<string, { title: string; items: any[] }> = {};
        items.forEach((item) => {
          const catName = item.category?.name || 'Other Services';
          if (!groups[catName]) {
            groups[catName] = {
              title: catName,
              items: [],
            };
          }
          groups[catName].items.push(item);
        });

        setGroupedServices(Object.values(groups));
      } catch (error) {
        console.error('Failed to load government services:', error);
        if (!isMounted) return;
        setServiceEnabled(false);
        setUnavailableMessage(DEFAULT_UNAVAILABLE_MESSAGE);
        setGroupedServices([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#5c6cc9" />
      </ThemedView>
    );
  }

  if (!serviceEnabled) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedView style={styles.container}>
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
                <ThemedText style={styles.headerSubtitle}>Currently unavailable</ThemedText>
              </View>
            </View>
          </ThemedView>

          <View style={styles.unavailableContainer}>
            <View style={styles.unavailableIconBox}>
              <IconSymbol name="building.2.fill" size={28} color="#B26A00" />
            </View>
            <ThemedText style={styles.unavailableTitle}>Service Unavailable</ThemedText>
            <ThemedText style={styles.unavailableMessage}>{unavailableMessage}</ThemedText>

            <TouchableOpacity
              style={styles.backToServicesButton}
              onPress={() => router.replace('/(tabs)/services' as any)}
            >
              <ThemedText style={styles.backToServicesButtonText}>Back to Services</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
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
              <IconSymbol
                size={18}
                name="chevron.right"
                color="#777"
                style={{ transform: [{ rotate: '90deg' }], marginRight: 8 }}
              />
              <TextInput
                placeholder="Search services..."
                style={styles.searchInput}
                placeholderTextColor="#777"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Business and Trade</ThemedText>
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
                  <ThemedText style={styles.itemMeta} numberOfLines={1}>
                    New or renewal business application processing
                  </ThemedText>

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
                        <IconSymbol size={24} name={(item.image as any) || 'building.2.fill'} color="#1565C0" />
                      </ThemedView>

                      <ThemedView style={styles.cardInfo}>
                        <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
                        <ThemedText style={styles.itemMeta} numberOfLines={1}>{item.description}</ThemedText>

                        <ThemedView style={styles.feeHighlight}>
                          <ThemedText style={styles.feeText}>PHP {item.price} service fee</ThemedText>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  unavailableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F5F7FA',
  },
  unavailableIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  unavailableMessage: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  backToServicesButton: {
    marginTop: 20,
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backToServicesButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
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
    backgroundColor: '#F5F7FA',
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
