import { StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';

export default function ServicesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const services = [
    {
      id: 'gov',
      title: 'Government Permits',
      subtitle: 'Fast-track your document processing',
      icon: 'government',
      route: '/services/government', 
      color: '#1565C0',
      bgColor: '#E3F2FD',
      image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc53a?w=800', // Cityscape/documents vibe
    },
    {
      id: 'pabili',
      title: 'We Buy For You',
      subtitle: 'Personal shopper & custom errands',
      icon: 'pabili',
      route: '/services/pabili',
      color: '#FB8C00',
      bgColor: '#FFF3E0',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800', // Shopping/errands vibe
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Hatod Services</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Premium assistance at your fingertips</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText style={styles.sectionTitle}>What do you need help with?</ThemedText>
        
        {services.map((service, index) => (
          <TouchableOpacity 
            key={service.id} 
            style={styles.card}
            onPress={() => router.push(service.route as any)}
            activeOpacity={0.85}
          >
            <View style={styles.imageContainer}>
              <Image source={{ uri: service.image }} style={styles.cardImage} />
              <View style={styles.imageOverlay} />
              <View style={[styles.iconBadge, { backgroundColor: service.bgColor }]}>
                <IconSymbol name={service.icon as any} size={28} color={service.color} />
              </View>
            </View>

            <ThemedView style={styles.cardFooter}>
              <ThemedView style={styles.textContainer}>
                <ThemedText style={styles.cardTitle}>{service.title}</ThemedText>
                <ThemedText style={styles.cardSubtitle}>{service.subtitle}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.arrowBox}>
                <IconSymbol name="chevron.right" size={24} color="#C2185B" />
              </ThemedView>
            </ThemedView>
          </TouchableOpacity>
        ))}

        <ThemedView style={styles.comingSoonCard}>
          <ThemedView style={styles.comingSoonIconBox}>
             <IconSymbol name="services" size={28} color="#AAA" />
          </ThemedView>
          <ThemedView style={styles.comingSoonTextContainer}>
             <ThemedText style={styles.comingSoonTitle}>More Services Soon</ThemedText>
             <ThemedText style={styles.comingSoonSubtitle}>We are constantly adding new professional services to simplify your life.</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#C2185B',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  cardFooter: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  textContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  arrowBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  comingSoonCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  comingSoonIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E4E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  comingSoonTextContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  comingSoonSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    lineHeight: 18,
  },
});
