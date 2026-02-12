import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { SocketProvider } from '@/context/SocketContext';


import { useEffect, useState } from 'react';
import { getAuthToken } from '@/api/client';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Small delay to allow navigation to mount
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = await getAuthToken();
      // segments is an array of path segments. e.g. ['(tabs)', 'index']
      // simplified check: if strictly in login or signup, don't redirect if no token.
      
      const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

      if (!token && !inAuthGroup) {
        // Redirect to login if not authenticated and not already in auth screen
        router.replace('/login');
      } else if (token && inAuthGroup) {
        // Redirect to tabs if authenticated and trying to access auth screen
        router.replace('/(tabs)');
      }
      setIsReady(true);
    };

    checkAuth();
  }, [segments]);

  if (!isReady) {
      return null; // Or a splash screen
  }

  return (
    <SafeAreaProvider>
        <SocketProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
      </SocketProvider>
    </SafeAreaProvider>
  );
}
