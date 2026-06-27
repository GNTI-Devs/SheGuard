import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage, LanguageCode } from '@/hooks/useLanguage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { language, setLanguage, languages } = useLanguage();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];
  const { play, stop } = useAudioPlayer();

  // Autoplay the welcome audio guide once the screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      play('welcome');
    }, 800);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, []);

  const handleNext = async () => {
    await stop();
    router.push('/(onboarding)/intro');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: activeColors.primary }]}>
            SheGuard AI
          </Text>
          <Text style={[styles.subtitle, { color: activeColors.textMuted }]}>
            Choose your preferred language for voice conversation
          </Text>
        </View>

        <View style={styles.grid}>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected
                      ? activeColors.surface2
                      : activeColors.surface,
                    borderColor: isSelected
                      ? activeColors.primary
                      : activeColors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text
                    style={[styles.langLabel, { color: activeColors.text }]}
                  >
                    {lang.label}
                  </Text>
                </View>
                <Text
                  style={[styles.langNative, { color: activeColors.textMuted }]}
                >
                  {lang.nativeLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.button, { backgroundColor: activeColors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue / Gaba</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  langLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  langNative: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
