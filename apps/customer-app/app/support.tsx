import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function SupportScreen() {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');

  const faqs = [
    { question: 'How do I track my order?', answer: 'Go to your orders tab and click "Track Order".' },
    { question: 'How do I change my payment method?', answer: 'You can change it at checkout or in your profile settings.' },
    { question: 'Can I cancel my order?', answer: 'Yes, but only before the restaurant starts preparing your food.' },
  ];

  const handleSendFeedback = () => {
    // Logic to send feedback
    setFeedback('');
    alert('Thank you for your feedback!');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:09123456789');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@hatod.com');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Support & Feedback',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Hero Section */}
        <View style={styles.hero}>
            <IconSymbol size={48} name="person" color="#FF9500" />
            <ThemedText style={styles.heroTitle}>How can we help you?</ThemedText>
            <ThemedText style={styles.heroSub}>Our team is here to assist you with any issues.</ThemedText>
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
            <View style={styles.contactRow}>
                <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                        <IconSymbol size={24} name="person" color="#FF9500" />
                    </View>
                    <ThemedText style={styles.contactLabel}>Call Support</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
                     <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                        <IconSymbol size={24} name="paperplane.fill" color="#2196F3" />
                    </View>
                    <ThemedText style={styles.contactLabel}>Email Us</ThemedText>
                </TouchableOpacity>
            </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Frequently Asked Questions</ThemedText>
            {faqs.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                    <ThemedText style={styles.faqQuestion}>{faq.question}</ThemedText>
                    <ThemedText style={styles.faqAnswer}>{faq.answer}</ThemedText>
                </View>
            ))}
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Send us Feedback</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="Tell us what you think..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={feedback}
                onChangeText={setFeedback}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendFeedback}>
                <ThemedText style={styles.sendBtnText}>Submit Feedback</ThemedText>
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
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    marginTop: 16,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  faqItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
    fontSize: 14,
    color: '#333',
  },
  sendBtn: {
    backgroundColor: '#FF9500',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
