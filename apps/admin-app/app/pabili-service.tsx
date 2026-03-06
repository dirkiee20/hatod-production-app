import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  getPabiliServiceConfig,
  PabiliServiceConfig,
  setPabiliServiceConfig,
} from '@/api/services';

const DEFAULT_CONFIG: PabiliServiceConfig = {
  enabled: false,
  message: 'We Buy For You service is currently unavailable. Please check back later.',
  updatedAt: null,
  updatedBy: null,
};

export default function PabiliServiceScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<PabiliServiceConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const data = await getPabiliServiceConfig();
    setConfig(data ?? DEFAULT_CONFIG);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    const updated = await setPabiliServiceConfig({
      enabled: config.enabled,
      message: config.message.trim() || DEFAULT_CONFIG.message,
    });
    setSaving(false);

    if (!updated) {
      Alert.alert('Error', 'Failed to update We Buy For You availability.');
      return;
    }

    setConfig(updated);
    Alert.alert(
      'Saved',
      updated.enabled
        ? 'We Buy For You is now available in Customer App.'
        : 'We Buy For You is now marked unavailable in Customer App.',
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#f78734" />
        <ThemedText style={styles.loadingText}>Loading settings…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'We Buy For You',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol
                size={20}
                name="chevron.right"
                color="#f78734"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <IconSymbol size={24} name="pabili" color="#f78734" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.heroTitle}>We Buy For You Availability</ThemedText>
            <ThemedText style={styles.heroSub}>
              Control whether customers can submit Pabili requests.
            </ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.rowTitle}>Service Status</ThemedText>
              <ThemedText style={styles.rowSub}>
                {config.enabled ? 'Currently available to customers' : 'Currently unavailable to customers'}
              </ThemedText>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={(enabled) => setConfig((prev) => ({ ...prev, enabled }))}
              trackColor={{ false: '#DADADA', true: '#FFCC80' }}
              thumbColor="#FFF"
              disabled={saving}
            />
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.rowTitle}>Unavailable Message</ThemedText>
          <ThemedText style={styles.rowSub}>
            This message is shown in the Customer App when service is unavailable.
          </ThemedText>
          <TextInput
            value={config.message}
            onChangeText={(message) => setConfig((prev) => ({ ...prev, message }))}
            style={styles.input}
            placeholder="We Buy For You service is currently unavailable…"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.metaLabel}>Last Updated</ThemedText>
          <ThemedText style={styles.metaValue}>
            {config.updatedAt ? new Date(config.updatedAt).toLocaleString('en-PH') : 'Not set yet'}
          </ThemedText>
          <ThemedText style={styles.metaLabel}>Updated By</ThemedText>
          <ThemedText style={styles.metaValue}>{config.updatedBy ?? 'N/A'}</ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.65 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    gap: 10,
  },
  loadingText: {
    color: '#777',
    fontSize: 13,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1F2937',
  },
  heroSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDEDED',
    padding: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },
  rowSub: {
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: 3,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
  },
  metaLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  metaValue: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#f78734',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
});
