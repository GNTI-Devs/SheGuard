import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ConnectionProvider } from '@/hooks/useConnection';
import { StorageProvider, useStorage } from '@/services/storage';
import { Colors } from '@/constants/Colors';
import {
  ThemeProvider as AppThemeProvider,
  useThemeContext,
} from '@/hooks/useThemeContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudioPlayerProvider } from '@/hooks/AudioPlayerContext';

const AUDIO_ONBOARDING_KEY = 'onboarding_audio_shown';
const GUIDE_ENABLED_KEY = 'audio_guide_enabled';

// ─── First-launch Audio Onboarding Prompt ────────────────────────────────────
function AudioOnboardingModal() {
  const { colorScheme } = useThemeContext();
  const activeColors = Colors[colorScheme ?? 'dark'];
  const { play } = useAudioPlayer();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    AsyncStorage.getItem(AUDIO_ONBOARDING_KEY)
      .then((val) => {
        if (!val) setVisible(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const dismiss = async (enableAudio: boolean) => {
    await AsyncStorage.setItem(AUDIO_ONBOARDING_KEY, 'true').catch(() => {});
    await AsyncStorage.setItem(
      GUIDE_ENABLED_KEY,
      enableAudio ? 'true' : 'false'
    ).catch(() => {});

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      if (enableAudio) {
        // Small delay so modal fully closes before audio starts
        setTimeout(() => play('welcome'), 600);
      }
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: activeColors.surface,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: activeColors.primaryMuted },
            ]}
          >
            <Text style={styles.iconEmoji}>🔊</Text>
          </View>

          <Text style={[styles.title, { color: activeColors.text }]}>
            Make SheGuard Guide You
          </Text>

          <Text style={[styles.body, { color: activeColors.textMuted }]}>
            SheGuard fit dey talk to you as you enter each part of the app —
            like a helper wey sabi the road. You want make e dey guide you?
          </Text>

          <TouchableOpacity
            id="audio-onboarding-yes"
            style={[
              styles.primaryBtn,
              { backgroundColor: activeColors.primary },
            ]}
            onPress={() => dismiss(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Yes, guide me 🎙️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            id="audio-onboarding-skip"
            style={[styles.skipBtn, { borderColor: activeColors.border }]}
            onPress={() => dismiss(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipBtnText, { color: activeColors.textMuted }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Route Guard ──────────────────────────────────────────────────────────────
function RouteGuard() {
  const { getProfile } = useStorage();
  const router = useRouter();
  const segments = useSegments();
  const { colorScheme } = useThemeContext();
  const [loading, setLoading] = useState(true);

  const activeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    async function checkAuth() {
      try {
        const profile = await getProfile();
        const inOnboardingGroup = segments[0] === '(onboarding)';
        const inTabsGroup = segments[0] === '(tabs)';

        if (!profile) {
          if (!inOnboardingGroup) {
            router.replace('/(onboarding)/language-select');
          }
        } else {
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

// ─── Inner layout with theme ──────────────────────────────────────────────────
function RootLayoutInner() {
  const { colorScheme } = useThemeContext();
  const activeColors = Colors[colorScheme ?? 'light'];

  const customNavigationTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: activeColors.background,
      card: activeColors.surface,
      text: activeColors.text,
      border: activeColors.border,
    },
  };

  return (
    <ThemeProvider value={customNavigationTheme}>
      <AudioOnboardingModal />
      <RouteGuard />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <AppThemeProvider>
      <StorageProvider>
        <ConnectionProvider>
          <AudioPlayerProvider>
            <RootLayoutInner />
          </AudioPlayerProvider>
        </ConnectionProvider>
      </StorageProvider>
    </AppThemeProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconEmoji: {
    fontSize: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
