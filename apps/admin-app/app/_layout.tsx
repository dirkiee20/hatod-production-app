import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

function ProtectedLayout() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is on login screen
    // segments[0] might be undefined for root, or 'login' for login screen
    const isLoginGroup = segments[0] === 'login';

    if (!token && !isLoginGroup) {
      // If not logged in and not on login screen, redirect to login
      router.replace('/login');
    } else if (token && isLoginGroup) {
      // If logged in and on login screen, redirect to home
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ProtectedLayout />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
