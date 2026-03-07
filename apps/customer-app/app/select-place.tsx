import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePlace } from '@/context/PlaceContext';
import { OrderPlace, PLACE_OPTIONS } from '@/utils/place';

export default function SelectPlaceScreen() {
  const router = useRouter();
  const { selectedPlace, setSelectedPlace, loading } = usePlace();
  const [draftPlace, setDraftPlace] = useState<OrderPlace | null>(selectedPlace);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setDraftPlace(selectedPlace);
    }
  }, [loading, selectedPlace]);

  const canContinue = useMemo(() => !!draftPlace && !saving, [draftPlace, saving]);

  const handleContinue = async () => {
    if (!draftPlace) return;
    setSaving(true);
    try {
      await setSelectedPlace(draftPlace);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#5c6cc9" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Choose Delivery Place</ThemedText>
        <ThemedText style={styles.subtitle}>
          We will only show stores available in your selected place.
        </ThemedText>
      </View>

      <View style={styles.optionsWrap}>
        {PLACE_OPTIONS.map((option) => {
          const active = draftPlace === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, active && styles.optionCardActive]}
              onPress={() => setDraftPlace(option.id)}
              activeOpacity={0.85}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                  <IconSymbol name="location.fill" size={18} color={active ? '#FFF' : '#5c6cc9'} />
                </View>
                <ThemedText style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {option.label}
                </ThemedText>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <ThemedText style={styles.continueText}>Continue</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
    paddingHorizontal: 20,
    paddingTop: 72,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
  },
  header: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1D2240',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666A80',
    lineHeight: 20,
  },
  optionsWrap: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F2',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardActive: {
    borderColor: '#5c6cc9',
    backgroundColor: '#EEF1FF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionIconActive: {
    backgroundColor: '#5c6cc9',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303552',
  },
  optionLabelActive: {
    color: '#27358A',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CDD2E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#5c6cc9',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5c6cc9',
  },
  footer: {
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5c6cc9',
  },
  continueBtnDisabled: {
    backgroundColor: '#BCC3E9',
  },
  continueText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
