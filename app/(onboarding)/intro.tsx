import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const SLIDES: Slide[] = [
  {
    title: "Talk, Don't Type",
    description:
      'Speak naturally to SheGuard just like a trusted sister. No typing required.',
    iconName: 'chatbubbles',
  },
  {
    title: 'In Your Language',
    description:
      'Speak and receive maternal health advice in English, Hausa, Yoruba, Igbo, or Nigerian Pidgin.',
    iconName: 'globe',
  },
  {
    title: 'Danger Sign Detection',
    description:
      'SheGuard monitors for symptoms like severe headache or swelling and guides you to safety.',
    iconName: 'alert-circle',
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];
  const { play, stop } = useAudioPlayer();

  const [activePageIndex, setActivePageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      play('intro');
    }, 800);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offset / slideSize);
    setActivePageIndex(pageIndex);
  };

  const handleNext = async () => {
    if (activePageIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activePageIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      await stop();
      router.push('/(onboarding)/permissions');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: 'rgba(200, 90, 70, 0.1)' },
              ]}
            >
              <Ionicons
                name={slide.iconName}
                size={80}
                color={activeColors.primary}
              />
            </View>
            <Text style={[styles.slideTitle, { color: activeColors.text }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideDesc, { color: activeColors.textMuted }]}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activePageIndex
                      ? activeColors.primary
                      : activeColors.border,
                  width: index === activePageIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.button, { backgroundColor: activeColors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {activePageIndex === SLIDES.length - 1 ? 'Start setup' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
