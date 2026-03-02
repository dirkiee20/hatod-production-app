import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, ScrollView, View, TouchableOpacity,
  Switch, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getTyphoonMode, setTyphoonMode, TyphoonConfig } from '../api/services';

const SIGNAL_LEVELS = [
  { key: 'SIGNAL_1' as const, label: 'Signal #1', wind: '60–89 km/h', color: '#FDD835', desc: 'Winds may occur in 36 hrs' },
  { key: 'SIGNAL_2' as const, label: 'Signal #2', wind: '90–120 km/h', color: '#FB8C00', desc: 'Damaging winds in 24 hrs' },
  { key: 'SIGNAL_3' as const, label: 'Signal #3', wind: '121–170 km/h', color: '#E53935', desc: 'Destructive winds in 18 hrs' },
  { key: 'SIGNAL_4' as const, label: 'Signal #4', wind: '> 171 km/h', color: '#6A1B9A', desc: 'Very destructive in 12 hrs' },
];

export default function TyphoonModeScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<TyphoonConfig>({
    enabled: false,
    message: 'Service is temporarily suspended due to typhoon. Please stay safe.',
    activatedAt: null,
    activatedBy: null,
    level: 'SIGNAL_1',
    suspendOrders: true,
    suspendDeliveries: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const data = await getTyphoonMode();
    if (data) setConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleToggle = () => {
    const next = !config.enabled;
    Alert.alert(
      next ? '⚠️ Activate Typhoon Mode?' : 'Deactivate Typhoon Mode?',
      next
        ? 'This will display a typhoon warning to all app users and optionally suspend orders and deliveries.'
        : 'This will resume normal operations and hide the typhoon alert from users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Activate' : 'Deactivate',
          style: next ? 'destructive' : 'default',
          onPress: () => save({ ...config, enabled: next }),
        },
      ],
    );
  };

  const save = async (patch: TyphoonConfig) => {
    setSaving(true);
    const result = await setTyphoonMode(patch);
    if (result) {
      setConfig(result);
      Alert.alert(
        result.enabled ? '🚨 Typhoon Mode Active' : '✅ Typhoon Mode Deactivated',
        result.enabled
          ? 'Warning is now showing to all users.'
          : 'Normal operations resumed.',
      );
    } else {
      Alert.alert('Error', 'Failed to update settings. Check your connection.');
    }
    setSaving(false);
  };

  const currentLevel = SIGNAL_LEVELS.find(l => l.key === config.level)!;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <ThemedText style={{ color: '#999', marginTop: 12 }}>Loading settings…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Typhoon Mode',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerStyle: { backgroundColor: config.enabled ? '#4f46e5' : '#FFF' },
          headerTintColor: config.enabled ? '#FFF' : '#4f46e5',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol
                size={20}
                name="chevron.right"
                color={config.enabled ? '#FFF' : '#4f46e5'}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, config.enabled && { backgroundColor: '#1e1b4b' }]}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Banner */}
        <View style={[styles.hero, { backgroundColor: config.enabled ? '#4f46e5' : '#EEF2FF' }]}>
          <ThemedText style={styles.heroIcon}>🌀</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: config.enabled ? '#FFF' : '#4f46e5' }]}>
            {config.enabled ? 'TYPHOON MODE ACTIVE' : 'Typhoon Mode'}
          </ThemedText>
          <ThemedText style={[styles.heroSub, { color: config.enabled ? '#C7D2FE' : '#6366f1' }]}>
            {config.enabled
              ? `Activated ${config.activatedAt ? new Date(config.activatedAt).toLocaleString('en-PH') : ''}`
              : 'Suspend platform operations during a storm signal'}
          </ThemedText>

          {/* Master Toggle */}
          <View style={[styles.toggleCard, { borderColor: config.enabled ? '#6366f1' : '#C7D2FE' }]}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.toggleLabel, { color: config.enabled ? '#FFF' : '#333' }]}>
                {config.enabled ? 'Typhoon Mode is ON' : 'Typhoon Mode is OFF'}
              </ThemedText>
              <ThemedText style={[styles.toggleSub, { color: config.enabled ? '#C7D2FE' : '#888' }]}>
                {config.enabled ? 'Tap to deactivate' : 'Tap to activate'}
              </ThemedText>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggle}
              trackColor={{ false: '#CCC', true: '#EF5350' }}
              thumbColor={config.enabled ? '#FFF' : '#FFF'}
              disabled={saving}
            />
          </View>
        </View>

        {/* Signal Level */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, config.enabled && { color: '#90CAF9' }]}>
            TYPHOON SIGNAL LEVEL
          </ThemedText>
          <View style={styles.signalGrid}>
            {SIGNAL_LEVELS.map(level => {
              const active = config.level === level.key;
              return (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.signalChip,
                    { borderColor: active ? level.color : '#EEE' },
                    active && { backgroundColor: level.color + '22' },
                  ]}
                  onPress={() => setConfig(c => ({ ...c, level: level.key }))}
                >
                  <ThemedText style={[styles.signalLabel, active && { color: level.color, fontWeight: '900' }]}>
                    {level.label}
                  </ThemedText>
                  <ThemedText style={styles.signalWind}>{level.wind}</ThemedText>
                  <ThemedText style={styles.signalDesc} numberOfLines={2}>{level.desc}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.signalAlert, { backgroundColor: currentLevel.color + '22', borderColor: currentLevel.color }]}>
            <ThemedText style={[styles.signalAlertText, { color: currentLevel.color }]}>
              {currentLevel.label}: {currentLevel.desc} — Winds {currentLevel.wind}
            </ThemedText>
          </View>
        </View>

        {/* Suspension Options */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, config.enabled && { color: '#90CAF9' }]}>
            SUSPENSION SETTINGS
          </ThemedText>
          <View style={[styles.card, config.enabled && styles.cardDark]}>
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.optionLabel, config.enabled && { color: '#E8EAF6' }]}>
                  Suspend New Orders
                </ThemedText>
                <ThemedText style={styles.optionSub}>
                  Prevent customers from placing new orders
                </ThemedText>
              </View>
              <Switch
                value={config.suspendOrders}
                onValueChange={v => setConfig(c => ({ ...c, suspendOrders: v }))}
                trackColor={{ false: '#CCC', true: '#EF5350' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.optionLabel, config.enabled && { color: '#E8EAF6' }]}>
                  Suspend Deliveries
                </ThemedText>
                <ThemedText style={styles.optionSub}>
                  Pause all active rider dispatching
                </ThemedText>
              </View>
              <Switch
                value={config.suspendDeliveries}
                onValueChange={v => setConfig(c => ({ ...c, suspendDeliveries: v }))}
                trackColor={{ false: '#CCC', true: '#EF5350' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        {/* Custom Message */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, config.enabled && { color: '#90CAF9' }]}>
            ALERT MESSAGE
          </ThemedText>
          <View style={[styles.card, config.enabled && styles.cardDark]}>
            <ThemedText style={[styles.optionSub, { marginBottom: 8 }]}>
              Shown as a banner to all users when Typhoon Mode is active
            </ThemedText>
            <TextInput
              style={[styles.messageInput, config.enabled && styles.messageInputDark]}
              value={config.message}
              onChangeText={v => setConfig(c => ({ ...c, message: v }))}
              multiline
              numberOfLines={3}
              placeholder="Enter your typhoon alert message…"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Save / Apply Changes Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={() => save(config)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.saveBtnText}>
                {config.enabled ? 'Update & Keep Active' : 'Save Changes'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <ThemedText style={styles.infoTitle}>ℹ️  How Typhoon Mode works</ThemedText>
          <ThemedText style={styles.infoText}>
            • A storm warning banner appears on the customer & rider apps{'\n'}
            • Optionally blocks new orders & delivery dispatching{'\n'}
            • Settings persist in Redis — no app restart needed{'\n'}
            • Deactivate anytime to resume normal operations
          </ThemedText>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    paddingBottom: 28,
  },
  heroIcon: { fontSize: 52 },
  heroTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  heroSub: { fontSize: 13, textAlign: 'center' },

  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    width: '100%',
  },
  toggleLabel: { fontSize: 15, fontWeight: '800' },
  toggleSub: { fontSize: 12, marginTop: 2 },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#888',
    letterSpacing: 1, marginBottom: 10,
  },

  signalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  signalChip: {
    width: '47%', borderWidth: 2, borderRadius: 12,
    padding: 12, backgroundColor: '#FFF',
  },
  signalLabel: { fontSize: 13, fontWeight: '700', color: '#333' },
  signalWind: { fontSize: 11, color: '#666', marginTop: 2 },
  signalDesc: { fontSize: 10, color: '#999', marginTop: 4 },
  signalAlert: {
    borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4,
  },
  signalAlertText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  card: {
    backgroundColor: '#FFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#EEE',
    overflow: 'hidden',
  },
  cardDark: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },

  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  optionLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  optionSub: { fontSize: 12, color: '#999', marginTop: 2, paddingHorizontal: 16 },
  separator: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 },

  messageInput: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 10, padding: 12,
    fontSize: 13, color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
    backgroundColor: '#FAFAFA',
  },
  messageInputDark: {
    backgroundColor: '#3730a3', borderColor: '#6366f1', color: '#E8EAF6',
  },

  saveBtn: {
    backgroundColor: '#4f46e5', borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  infoBox: {
    margin: 16, marginTop: 20,
    backgroundColor: '#EEF2FF', borderRadius: 12,
    padding: 16, gap: 8,
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#4f46e5' },
  infoText: { fontSize: 12, color: '#6366f1', lineHeight: 20 },
});
