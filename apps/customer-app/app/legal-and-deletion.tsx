import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLegalPolicies, LegalPoliciesConfig } from '@/api/services';
import { PRIVACY_POLICY_VERSION, TERMS_OF_SERVICE_VERSION } from '@/constants/legal';

const DEFAULT_TERMS_URL = 'https://hatod.app/terms';
const DEFAULT_PRIVACY_URL = 'https://hatod.app/privacy';
const DEFAULT_DELETION_URL = 'https://hatod.app/account-deletion';
const DEFAULT_SUPPORT_EMAIL = 'hatodservices@gmail.com';

export default function LegalAndDeletionScreen() {
  const router = useRouter();
  const [policies, setPolicies] = useState<LegalPoliciesConfig | null>(null);

  useEffect(() => {
    getLegalPolicies().then(setPolicies).catch(() => {
      setPolicies(null);
    });
  }, []);

  const termsUrl = policies?.termsUrl || DEFAULT_TERMS_URL;
  const privacyUrl = policies?.privacyUrl || DEFAULT_PRIVACY_URL;
  const deletionInfoUrl = policies?.accountDeletionInfoUrl || DEFAULT_DELETION_URL;
  const supportEmail = policies?.supportEmail || DEFAULT_SUPPORT_EMAIL;
  const termsVersion = policies?.termsVersion || TERMS_OF_SERVICE_VERSION;
  const privacyVersion = policies?.privacyVersion || PRIVACY_POLICY_VERSION;
  const effectiveDate = policies?.effectiveDate || TERMS_OF_SERVICE_VERSION;

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const openSupportEmail = async () => {
    try {
      await Linking.openURL(`mailto:${supportEmail}`);
    } catch {
      Alert.alert('Unable to open email', 'Please try again later.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Legal & Deletion',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Policy Links</ThemedText>

          <TouchableOpacity style={styles.linkCard} onPress={() => openUrl(termsUrl)}>
            <View style={styles.linkLead}>
              <IconSymbol size={18} name="services" color="#5c6cc9" />
              <View style={{ marginLeft: 10 }}>
                <ThemedText style={styles.linkTitle}>Terms of Service</ThemedText>
                <ThemedText style={styles.linkMeta}>Version {termsVersion}</ThemedText>
              </View>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#BBB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCard} onPress={() => openUrl(privacyUrl)}>
            <View style={styles.linkLead}>
              <IconSymbol size={18} name="lock.fill" color="#5c6cc9" />
              <View style={{ marginLeft: 10 }}>
                <ThemedText style={styles.linkTitle}>Privacy Policy</ThemedText>
                <ThemedText style={styles.linkMeta}>Version {privacyVersion}</ThemedText>
              </View>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#BBB" />
          </TouchableOpacity>

          <ThemedText style={styles.footnote}>Effective date: {effectiveDate}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Deletion Details</ThemedText>
          <View style={styles.infoCard}>
            <ThemedText style={styles.infoLine}>1. Deletion currently deactivates your account and signs you out immediately.</ThemedText>
            <ThemedText style={styles.infoLine}>2. Active sessions and refresh tokens are revoked on the backend.</ThemedText>
            <ThemedText style={styles.infoLine}>3. Historical orders and transactional records may be retained for legal, fraud, and accounting requirements.</ThemedText>
            <ThemedText style={styles.infoLine}>4. For full data-erasure requests, contact support for manual review and handling.</ThemedText>
          </View>

          <TouchableOpacity style={styles.linkCard} onPress={() => openUrl(deletionInfoUrl)}>
            <View style={styles.linkLead}>
              <IconSymbol size={18} name="trash.fill" color="#B71C1C" />
              <View style={{ marginLeft: 10 }}>
                <ThemedText style={styles.linkTitle}>Full Deletion Policy</ThemedText>
                <ThemedText style={styles.linkMeta}>Read complete retention and erasure policy</ThemedText>
              </View>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#BBB" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Need Help?</ThemedText>
          <TouchableOpacity style={styles.supportButton} onPress={openSupportEmail}>
            <IconSymbol size={16} name="paperplane.fill" color="#FFF" />
            <ThemedText style={styles.supportButtonText}>{supportEmail}</ThemedText>
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
    padding: 16,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
    marginBottom: 12,
  },
  linkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 14,
    marginBottom: 10,
  },
  linkLead: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  linkMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  footnote: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 14,
  },
  infoLine: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
    marginBottom: 8,
  },
  supportButton: {
    backgroundColor: '#5c6cc9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
