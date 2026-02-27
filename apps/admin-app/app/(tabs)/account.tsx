import React from 'react';
import {
  StyleSheet, ScrollView, TouchableOpacity, View, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../../api/client';

const ACCENT = '#C2185B';
const ACCENT_LIGHT = '#FCE4EC';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.avatarRing}>
          <ThemedText style={styles.avatarLetter}>A</ThemedText>
        </View>
        <View style={styles.adminInfo}>
          <ThemedText style={styles.adminName}>Admin</ThemedText>
          <ThemedText style={styles.adminRole}>Super Administrator</ThemedText>
        </View>
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <ThemedText style={styles.sectionLabel}>GENERAL</ThemedText>
        <View style={styles.menuGroup}>
          {[
            { icon: 'chart.bar.fill' as const, label: 'Business Analytics', sub: 'Revenue, orders, platform KPIs', route: '/analytics' },
            { icon: 'person.fill' as const, label: 'Edit Profile', sub: 'Update your admin info', route: null },
            { icon: 'lock.fill' as const, label: 'Change Password', sub: 'Update your password', route: null },
            { icon: 'bell.fill' as const, label: 'Notifications', sub: 'Manage push notifications', route: null },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuIconBox}>
                <IconSymbol size={18} name={item.icon} color={ACCENT} />
              </View>
              <View style={styles.menuTextBlock}>
                <ThemedText style={styles.menuRowLabel}>{item.label}</ThemedText>
                <ThemedText style={styles.menuRowSub}>{item.sub}</ThemedText>
              </View>
              <IconSymbol size={16} name="chevron.right" color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.sectionLabel}>SYSTEM</ThemedText>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => router.push('/typhoon-mode' as any)}>
            <View style={styles.menuIconBox}>
              <IconSymbol size={18} name={'typhoon.fill' as any} color={ACCENT} />
            </View>
            <View style={styles.menuTextBlock}>
              <ThemedText style={styles.menuRowLabel}>Typhoon Mode</ThemedText>
              <ThemedText style={styles.menuRowSub}>Override restaurant hours</ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => router.push('/(tabs)/fees' as any)}>
            <View style={styles.menuIconBox}>
              <IconSymbol size={18} name="fees" color={ACCENT} />
            </View>
            <View style={styles.menuTextBlock}>
              <ThemedText style={styles.menuRowLabel}>Delivery Fees</ThemedText>
              <ThemedText style={styles.menuRowSub}>Manage distance-based pricing</ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => router.push('/gov-pricing' as any)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E3F2FD' }]}>
              <IconSymbol size={18} name="building.2.fill" color="#1565C0" />
            </View>
            <View style={styles.menuTextBlock}>
              <ThemedText style={styles.menuRowLabel}>Government Service Fees</ThemedText>
              <ThemedText style={styles.menuRowSub}>Set prices for government services</ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <View style={styles.menuIconBox}>
              <IconSymbol size={18} name="doc.text" color={ACCENT} />
            </View>
            <View style={styles.menuTextBlock}>
              <ThemedText style={styles.menuRowLabel}>Audit Logs</ThemedText>
              <ThemedText style={styles.menuRowSub}>View system activity</ThemedText>
            </View>
            <IconSymbol size={16} name="chevron.right" color="#CCC" />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.sectionLabel}>SUPPORT</ThemedText>
        <View style={styles.menuGroup}>
          {[
            { icon: 'questionmark.circle' as const, label: 'Help Center', sub: 'FAQs and guides' },
            { icon: 'message.fill' as const, label: 'Contact Support', sub: 'Get help from our team' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuRow} activeOpacity={0.7}>
              <View style={styles.menuIconBox}>
                <IconSymbol size={18} name={item.icon} color={ACCENT} />
              </View>
              <View style={styles.menuTextBlock}>
                <ThemedText style={styles.menuRowLabel}>{item.label}</ThemedText>
                <ThemedText style={styles.menuRowSub}>{item.sub}</ThemedText>
              </View>
              <IconSymbol size={16} name="chevron.right" color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: ACCENT, gap: 14,
  },
  avatarRing: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  adminRole: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scrollContent: { padding: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAA',
    letterSpacing: 1, marginTop: 8, marginBottom: 8,
  },
  menuGroup: {
    backgroundColor: '#FFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#EEE', marginBottom: 16, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuTextBlock: { flex: 1 },
  menuRowLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  menuRowSub: { fontSize: 12, color: '#999', marginTop: 2 },

  logoutBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFCDD2',
    borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#D32F2F' },
});
