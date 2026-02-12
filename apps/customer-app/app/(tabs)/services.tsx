import { StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ServicesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const services = [
    {
      id: 'gov',
      title: 'Government',
      subtitle: 'Process documents & permits',
      icon: 'government',
      route: '/services/government', 
      color: '#1565C0',
      bgColor: '#E3F2FD'
    },
    {
      id: 'pabili',
      title: 'We Buy For You',
      subtitle: 'Custom shopping & errands',
      icon: 'pabili',
      route: '/services/pabili',
      color: '#FB8C00',
      bgColor: '#FFF3E0'
    },
    // Future services can be added here
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Services</ThemedText>
        <ThemedText style={styles.headerSubtitle}>What would you like to do today?</ThemedText>
      </ThemedView>

      <ThemedView style={styles.grid}>
        {services.map((service) => (
          <TouchableOpacity 
            key={service.id} 
            style={[styles.card, { width: (width - 48) / 2 }]}
            onPress={() => router.push(service.route as any)}
          >
            <ThemedView style={[styles.iconContainer, { backgroundColor: service.bgColor }]}>
              <IconSymbol name={service.icon as any} size={32} color={service.color} />
            </ThemedView>
            <ThemedText style={styles.cardTitle}>{service.title}</ThemedText>
            <ThemedText style={styles.cardSubtitle}>{service.subtitle}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#5c6cc9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
