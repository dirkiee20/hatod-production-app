import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function GovernmentScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  
  const services = [
    {
      title: 'Business & Permits',
      items: [
        { id: '1', name: 'Business Permit Renewal', type: 'Permit', process: '3-5 Working Days', fee: '₱500 service fee', color: '#1A237E', icon: 'business' },
        { id: '2', name: 'New Business Application', type: 'Permit', process: '7-10 Working Days', fee: '₱1,200 service fee', color: '#0D47A1', icon: 'add-business' },
      ]
    },
    {
      title: 'Civil Registry Documents',
      items: [
        { id: '3', name: 'PSA Birth Certificate', type: 'Document', process: '2-3 Working Days', fee: '₱150 service fee', color: '#E65100', icon: 'description' },
        { id: '4', name: 'Marriage Certificate', type: 'Document', process: '2-3 Working Days', fee: '₱150 service fee', color: '#D84315', icon: 'description' },
      ]
    },
    {
      title: 'Clearances & ID',
      items: [
        { id: '5', name: 'NBI Clearance Delivery', type: 'Clearance', process: 'Next Day Delivery', fee: '₱100 delivery fee', color: '#004D40', icon: 'verified-user' },
        { id: '6', name: 'Barangay Clearance', type: 'Clearance', process: 'Same Day', fee: '₱50 delivery fee', color: '#1B5E20', icon: 'home-work' },
      ]
    }
  ];

  return (
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

        {services.map((section, sIndex) => (
          <ThemedView key={sIndex} style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            
            <ThemedView style={styles.itemsGrid}>
              {section.items.map((item) => (
                <TouchableOpacity 
                   key={item.id} 
                   style={styles.serviceCard}
                   onPress={() => router.push(`/government-service/${item.id}`)}
                >
                  <ThemedView style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <IconSymbol size={24} name="government" color={item.color} />
                  </ThemedView>
                  
                  <ThemedView style={styles.cardInfo}>
                    <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
                    <ThemedText style={styles.itemMeta}>{item.process}</ThemedText>
                    
                    <ThemedView style={styles.feeHighlight}>
                      <ThemedText style={styles.feeText}>{item.fee}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  
                  <IconSymbol size={18} name="chevron.right" color="#DDD" />
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        ))}
        
        <ThemedView style={{ height: 100 }} />
      </ThemedView>
    </ScrollView>
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
