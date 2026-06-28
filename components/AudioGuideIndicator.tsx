import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalAudio } from '@/hooks/AudioPlayerContext';
import { useThemeContext } from '@/hooks/useThemeContext';
import { Colors } from '@/constants/Colors';

interface AudioGuideIndicatorProps {
  tabBarHeight: number;
}

function WaveformBar({ isPlaying, delay }: { isPlaying: boolean; delay: number }) {
  const heightAnim = useRef(new Animated.Value(4)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const createAnimation = () => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(heightAnim, {
              toValue: 16,
              duration: 400 + delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(heightAnim, {
              toValue: 4,
              duration: 400 + delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      };
      
      animationRef.current = createAnimation();
      animationRef.current.start();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      Animated.timing(heightAnim, {
        toValue: 4,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isPlaying]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        {
          height: heightAnim,
          backgroundColor: '#C85A46', // warm accent rose
        },
      ]}
    />
  );
}

export function AudioGuideIndicator({ tabBarHeight }: AudioGuideIndicatorProps) {
  const { isPlaying, isPaused, stop, pause, resume, activeKey } = useGlobalAudio();
  const { colorScheme } = useThemeContext();
  const activeColors = Colors[colorScheme ?? 'light'];

  // Fade and scale transition for the pill itself
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const isActive = isPlaying || isPaused;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  if (!isActive) return null;

  // Render a friendly name for the audio file playing
  const getGuideLabel = () => {
    switch (activeKey) {
      case 'welcome':
        return 'Welcome Guide';
      case 'intro':
        return 'Introduction';
      case 'permissions':
        return 'Setup Guide';
      case 'profile_setup':
        return 'Profile Setup';
      case 'home':
        return 'Home Guide';
      case 'tips':
        return 'Daily Health Tips';
      case 'history':
        return 'Check-in History';
      case 'settings':
        return 'Settings Info';
      default:
        return 'Audio Guide';
    }
  };

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          bottom: tabBarHeight + 12,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: activeColors.surface,
            borderColor: activeColors.border,
            shadowColor: '#000',
          },
        ]}
      >
        {/* Animated Waveform Section */}
        <View style={styles.waveformContainer}>
          <WaveformBar isPlaying={isPlaying} delay={0} />
          <WaveformBar isPlaying={isPlaying} delay={150} />
          <WaveformBar isPlaying={isPlaying} delay={70} />
          <WaveformBar isPlaying={isPlaying} delay={220} />
          <WaveformBar isPlaying={isPlaying} delay={110} />
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <Text style={[styles.speakingText, { color: activeColors.text }]}>
            {getGuideLabel()}
          </Text>
          <Text style={[styles.subText, { color: activeColors.textMuted }]}>
            {isPlaying ? 'SheGuard dey speak...' : 'Audio paused'}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          {isPlaying ? (
            <TouchableOpacity
              onPress={pause}
              style={[styles.actionBtn, { backgroundColor: activeColors.surface2 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="pause" size={16} color={activeColors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={resume}
              style={[styles.actionBtn, { backgroundColor: activeColors.primary }]}
              activeOpacity={0.7}
            >
              <Ionicons name="play" size={16} color="#FFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={stop}
            style={[styles.actionBtn, styles.stopBtn]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    width: '100%',
    maxWidth: 360,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    width: 32,
    justifyContent: 'center',
    marginRight: 10,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  speakingText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    backgroundColor: '#B52B2B', // clear crimson red cancel color
  },
});
