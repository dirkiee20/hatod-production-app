import { StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getTyphoonMode, TyphoonConfig } from '@/api/services';

export default function ServicesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [typhoon, setTyphoon] = useState<TyphoonConfig | null>(null);

  useFocusEffect(
    useCallback(() => {
      getTyphoonMode().then(t => setTyphoon(t)).catch(() => {});
    }, [])
  );

  const services = [
    {
      id: 'gov',
      title: 'Government Permits',
      subtitle: 'Fast-track your document processing',
      icon: 'government',
      route: '/services/government',
      color: '#1565C0',
      bgColor: '#E3F2FD',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    },
    {
      id: 'pabili',
      title: 'We Buy For You',
      subtitle: 'Personal shopper & custom errands',
      icon: 'pabili',
      route: '/services/pabili',
      color: '#f78734',
      bgColor: '#FFF3E0',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Hatod Services</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Premium assistance at your fingertips</ThemedText>
      </ThemedView>

      {/* 🌀 Typhoon Mode Banner */}
      {typhoon?.enabled && (
        <ThemedView style={styles.typhoonBanner}>
          <ThemedText style={styles.typhoonBannerIcon}>🌀</ThemedText>
          <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
            <ThemedText style={styles.typhoonBannerTitle}>Typhoon Mode Active</ThemedText>
            <ThemedText style={styles.typhoonBannerMsg} numberOfLines={2}>
              {typhoon.message}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      <ThemedView style={styles.content}>
        <ThemedText style={styles.sectionTitle}>What do you need help with?</ThemedText>

        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[styles.card, typhoon?.enabled && styles.cardDisabled]}
            onPress={() => !typhoon?.enabled && router.push(service.route as any)}
            activeOpacity={typhoon?.enabled ? 1 : 0.85}
            disabled={!!typhoon?.enabled}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: service.image }}
                style={[styles.cardImage, typhoon?.enabled && { opacity: 0.4 }]}
              />
              <View style={styles.imageOverlay} />
              {typhoon?.enabled ? (
                <View style={styles.typhoonCardOverlay}>
                  <ThemedText style={styles.typhoonCardIcon}>🌀</ThemedText>
                  <ThemedText style={styles.typhoonCardText}>Suspended</ThemedText>
                </View>
              ) : null}
              <View style={[styles.iconBadge, { backgroundColor: typhoon?.enabled ? '#E0E0E0' : service.bgColor }]}>
                <IconSymbol
                  name={service.icon as any}
                  size={20}
                  color={typhoon?.enabled ? '#AAA' : service.color}
                />
              </View>
            </View>

            <ThemedView style={[styles.cardFooter, typhoon?.enabled && { backgroundColor: '#F5F5F5' }]}>
              <ThemedView style={styles.textContainer}>
                <ThemedText style={[styles.cardTitle, typhoon?.enabled && { color: '#AAA' }]}>
                  {service.title}
                </ThemedText>
                <ThemedText style={styles.cardSubtitle}>{service.subtitle}</ThemedText>
                {typhoon?.enabled && (
                  <ThemedText style={styles.suspendedTag}>⚠ Unavailable during typhoon</ThemedText>
                )}
              </ThemedView>
              <ThemedView style={[styles.arrowBox, typhoon?.enabled && { backgroundColor: '#EEEEEE' }]}>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={typhoon?.enabled ? '#CCC' : '#5c6cc9'}
                />
              </ThemedView>
            </ThemedView>
          </TouchableOpacity>
        ))}

        <ThemedView style={styles.comingSoonCard}>
          <ThemedView style={styles.comingSoonIconBox}>
             <IconSymbol name="services" size={20} color="#AAA" />
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
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#5c6cc9',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#5c6cc9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  // ── Typhoon banner ─────────────────────────────────────────
  typhoonBanner: {
    backgroundColor: '#B71C1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  typhoonBannerIcon: { fontSize: 26 },
  typhoonBannerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF' },
  typhoonBannerMsg: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  typhoonCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  typhoonCardIcon: { fontSize: 30 },
  typhoonCardText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  // ─────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  imageContainer: {
    width: '100%',
    height: 100,
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
    bottom: -12,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardFooter: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  textContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  suspendedTag: {
    fontSize: 11,
    color: '#B71C1C',
    fontWeight: '700',
    marginTop: 4,
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBEFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  comingSoonCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  comingSoonIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  comingSoonTextContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  comingSoonSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    lineHeight: 16,
  },
});
