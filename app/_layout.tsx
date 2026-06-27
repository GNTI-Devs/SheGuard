import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ConnectionProvider } from '@/hooks/useConnection';
import { StorageProvider, useStorage } from '@/services/storage';
import { Colors } from '@/constants/Colors';

function RouteGuard() {
  const { getProfile } = useStorage();
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);

  const activeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    async function checkAuth() {
      try {
        const profile = await getProfile();
        const inOnboardingGroup = segments[0] === '(onboarding)';
        const inTabsGroup = segments[0] === '(tabs)';

        if (!profile) {
          // If no profile, force redirect to language-select onboarding
          if (!inOnboardingGroup) {
            router.replace('/(onboarding)/language-select');
          }
        } else {
          // If profile exists, force redirect to tabs home
          if (!inTabsGroup && segments[0] !== 'conversation') {
            router.replace('/(tabs)');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [segments]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: activeColors.background,
        }}
      >
        <ActivityIndicator size="large" color={activeColors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="conversation"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen name="(start)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const customNavigationTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: Colors[colorScheme ?? 'light'].background,
      card: Colors[colorScheme ?? 'light'].surface,
      text: Colors[colorScheme ?? 'light'].text,
      border: Colors[colorScheme ?? 'light'].border,
    },
  };

  return (
    <StorageProvider>
      <ConnectionProvider>
        <ThemeProvider value={customNavigationTheme}>
          <RouteGuard />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </ConnectionProvider>
    </StorageProvider>
  );
}
