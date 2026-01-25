import { StyleSheet, View, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';

const FAQ_ITEMS = [
  { question: 'How do I change my opening hours?', answer: 'Go to Store Profile > Schedule to update your operating hours.' },
  { question: 'When do I get paid?', answer: 'Payouts are processed every Monday for the previous week\'s earnings.' },
  { question: 'How do I refund an order?', answer: 'Contact support with the Order ID to initiate a refund request.' },
  { question: 'Can I add multiple employee accounts?', answer: 'Yes, visit Employee Management to add and manage staff access.' },
];

export default function HelpCenterScreen() {
  const router = useRouter();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@hatod.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+639123456789');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Help Center',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
             <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Support Banner */}
        <View style={styles.banner}>
           <View style={styles.bannerIcon}>
              <IconSymbol size={32} name="questionmark.circle.fill" color="#FFF" />
           </View>
           <ThemedText style={styles.bannerTitle}>How can we help you?</ThemedText>
           <ThemedText style={styles.bannerSub}>Find answers or contact our team.</ThemedText>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
           <TouchableOpacity style={styles.actionCard} onPress={handleContactSupport}>
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                 <IconSymbol size={24} name="envelope.fill" color="#2196F3" />
              </View>
              <ThemedText style={styles.actionText}>Email Us</ThemedText>
           </TouchableOpacity>

           <TouchableOpacity style={styles.actionCard} onPress={handleCallSupport}>
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                 <IconSymbol size={24} name="phone.fill" color="#4CAF50" />
              </View>
              <ThemedText style={styles.actionText}>Call Us</ThemedText>
           </TouchableOpacity>

           <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FAFAFA' }]}>
                 <IconSymbol size={24} name="message.fill" color="#333" />
              </View>
              <ThemedText style={styles.actionText}>Live Chat</ThemedText>
           </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
           <ThemedText style={styles.sectionTitle}>Frequently Asked Questions</ThemedText>
           
           {FAQ_ITEMS.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                 <View style={styles.faqHeader}>
                    <IconSymbol size={16} name="questionmark.circle" color="#C2185B" />
                    <ThemedText style={styles.question}>{item.question}</ThemedText>
                 </View>
                 <ThemedText style={styles.answer}>{item.answer}</ThemedText>
              </View>
           ))}
        </View>

        {/* Resources */}
        <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>More Resources</ThemedText>
            
            <TouchableOpacity style={styles.resourceRow}>
                <View style={styles.resourceLeft}>
                   <IconSymbol size={20} name="doc.text.fill" color="#607D8B" />
                   <ThemedText style={styles.resourceText}>Merchant Guidebook</ThemedText>
                </View>
                <IconSymbol size={16} name="chevron.right" color="#DDD" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceRow}>
                <View style={styles.resourceLeft}>
                   <IconSymbol size={20} name="play.rectangle.fill" color="#F44336" />
                   <ThemedText style={styles.resourceText}>Video Tutorials</ThemedText>
                </View>
                <IconSymbol size={16} name="chevron.right" color="#DDD" />
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
    padding: 20,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#C2185B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
    marginLeft: 4,
  },
  faqItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  question: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  answer: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    paddingLeft: 26,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resourceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
