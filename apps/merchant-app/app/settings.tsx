import { StyleSheet, View, ScrollView, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';

export default function SettingsScreen() {
  const router = useRouter();

  // State for toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [receiptsEnabled, setReceiptsEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  const renderSectionHeader = (title: string) => (
    <ThemedText style={styles.sectionHeader}>{title}</ThemedText>
  );

  const renderToggleRow = (icon: string, title: string, value: boolean, onValueChange: (val: boolean) => void, color: string = '#333') => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: '#F5F5F5' }]}>
          <IconSymbol size={20} name={icon as any} color={color} />
        </View>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
      </View>
      <Switch
        trackColor={{ false: '#767577', true: '#EC407A' }}
        thumbColor={value ? '#FFF' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  const renderActionRow = (icon: string, title: string, subtitle?: string, onPress?: () => void, color: string = '#333') => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
         <View style={[styles.iconBox, { backgroundColor: '#F5F5F5' }]}>
           <IconSymbol size={20} name={icon as any} color={color} />
         </View>
         <View>
            <ThemedText style={styles.rowTitle}>{title}</ThemedText>
            {subtitle && <ThemedText style={styles.rowSubtitle}>{subtitle}</ThemedText>}
         </View>
      </View>
      <IconSymbol size={16} name="chevron.right" color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Settings',
        headerTitleStyle: { fontWeight: '900', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#000" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Notifications */}
        <View style={styles.section}>
          {renderSectionHeader('NOTIFICATIONS')}
          <View style={styles.sectionBody}>
            {renderToggleRow('bell.fill', 'Push Notifications', pushEnabled, setPushEnabled, '#C2185B')}
            {renderToggleRow('envelope.fill', 'Email Updates', emailEnabled, setEmailEnabled, '#2196F3')}
            {renderToggleRow('speaker.wave.2.fill', 'Order Sounds', soundEnabled, setSoundEnabled, '#FF9800')}
          </View>
        </View>

        {/* Store Preferences */}
        <View style={styles.section}>
          {renderSectionHeader('STORE PREFERENCES')}
          <View style={styles.sectionBody}>
             {renderToggleRow('printer.fill', 'Auto-Print Receipts', receiptsEnabled, setReceiptsEnabled, '#607D8B')}
             <View style={styles.divider} />
             {renderActionRow('globe', 'Language', 'English (US)', () => {}, '#4CAF50')}
             <View style={styles.divider} />
             {renderActionRow('dollarsign.circle', 'Currency', 'PHP (₱)', () => {}, '#009688')}
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          {renderSectionHeader('SECURITY')}
          <View style={styles.sectionBody}>
             {renderToggleRow('faceid', 'Biometric Login', biometricsEnabled, setBiometricsEnabled, '#673AB7')}
             <View style={styles.divider} />
             {renderActionRow('lock.fill', 'Change Password', undefined, () => {}, '#333')}
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          {renderSectionHeader('SUPPORT & LEGAL')}
          <View style={styles.sectionBody}>
             {renderActionRow('questionmark.circle', 'Help Center', undefined, () => {}, '#9C27B0')}
             <View style={styles.divider} />
             {renderActionRow('doc.text', 'Terms of Service', undefined, () => {}, '#795548')}
             <View style={styles.divider} />
             {renderActionRow('shield.fill', 'Privacy Policy', undefined, () => {}, '#795548')}
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.footer}>
           <ThemedText style={styles.versionText}>Merchant App v1.0.0</ThemedText>
           <ThemedText style={styles.buildText}>Build 2026.01.25</ThemedText>
           
           <TouchableOpacity style={styles.cacheBtn} onPress={() => Alert.alert('Cache Cleared')}>
              <ThemedText style={styles.cacheText}>Clear Cache</ThemedText>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sectionBody: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 64, 
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  versionText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
  },
  buildText: {
    color: '#CCC',
    fontSize: 11,
  },
  cacheBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cacheText: {
    color: '#C2185B',
    fontWeight: '600',
    fontSize: 13,
  },
});
