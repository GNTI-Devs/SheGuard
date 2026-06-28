/**
 * AudioPlayerContext — global singleton for audio guide playback.
 *
 * Centralises all audio guide playback into a single shared Sound instance.
 * Supports play, stop, pause, resume, and tracking of active key / states.
 * Also holds the global audioGuideEnabled preference and syncs it to AsyncStorage.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioGuideKey } from './useAudioPlayer';

interface AudioPlayerContextType {
  play: (key: AudioGuideKey) => Promise<void>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  isPlaying: boolean;
  isPaused: boolean;
  activeKey: AudioGuideKey | null;
  audioGuideEnabled: boolean | null;
  setAudioGuideEnabled: (enabled: boolean) => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  play: async () => {},
  stop: async () => {},
  pause: async () => {},
  resume: async () => {},
  isPlaying: false,
  isPaused: false,
  activeKey: null,
  audioGuideEnabled: null,
  setAudioGuideEnabled: async () => {},
});

const ANDROID_SETTLE_MS = 150;
const GUIDE_ENABLED_KEY = 'audio_guide_enabled';

const AUDIO_ASSETS: Record<AudioGuideKey, any> = {
  welcome: require('@/assets/audio/welcome.wav'),
  intro: require('@/assets/audio/intro.wav'),
  permissions: require('@/assets/audio/permissions.wav'),
  profile_setup: require('@/assets/audio/profile_setup.wav'),
  home: require('@/assets/audio/home.wav'),
  tips: require('@/assets/audio/tips.wav'),
  history: require('@/assets/audio/history.wav'),
  settings: require('@/assets/audio/settings.wav'),
};

export function AudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeKey, setActiveKey] = useState<AudioGuideKey | null>(null);
  const [audioGuideEnabled, setAudioGuideEnabledState] = useState<boolean | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load global setting on mount
  useEffect(() => {
    AsyncStorage.getItem(GUIDE_ENABLED_KEY)
      .then((val) => {
        // Default to false on first launch (when val is null)
        setAudioGuideEnabledState(val === 'true');
      })
      .catch(() => {
        setAudioGuideEnabledState(false);
      });
  }, []);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const stop = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (_) {}
    setIsPlaying(false);
    setIsPaused(false);
    setActiveKey(null);
  }, []);

  const pause = useCallback(async () => {
    try {
      if (soundRef.current && isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        setIsPaused(true);
      }
    } catch (_) {}
  }, [isPlaying]);

  const resume = useCallback(async () => {
    try {
      if (soundRef.current && isPaused) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        setIsPaused(false);
      }
    } catch (_) {}
  }, [isPaused]);

  const setAudioGuideEnabled = useCallback(async (enabled: boolean) => {
    setAudioGuideEnabledState(enabled);
    await AsyncStorage.setItem(GUIDE_ENABLED_KEY, enabled ? 'true' : 'false').catch(() => {});
  }, []);

  const play = useCallback(
    async (key: AudioGuideKey) => {
      try {
        // Toggle play/stop if same key is already active
        if (activeKey === key) {
          if (isPlaying) {
            await pause();
          } else if (isPaused) {
            await resume();
          } else {
            await stop();
          }
          return;
        }

        await stop();

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        }).catch(() => {});

        if (Platform.OS === 'android') {
          await new Promise<void>((r) => setTimeout(r, ANDROID_SETTLE_MS));
        }

        const source = AUDIO_ASSETS[key];
        if (!source) return;

        const { sound } = await Audio.Sound.createAsync(
          source,
          { shouldPlay: true },
          (status: any) => {
            if (status.isLoaded && status.didJustFinish && !status.isPlaying) {
              setIsPlaying(false);
              setIsPaused(false);
              setActiveKey(null);
            }
          }
        );

        soundRef.current = sound;
        setIsPlaying(true);
        setIsPaused(false);
        setActiveKey(key);
      } catch (e) {
        console.warn('[AudioPlayerContext] Play error:', e);
        setIsPlaying(false);
        setIsPaused(false);
        setActiveKey(null);
      }
    },
    [activeKey, isPlaying, isPaused, stop, pause, resume]
  );

  return (
    <AudioPlayerContext.Provider
      value={{
        play,
        stop,
        pause,
        resume,
        isPlaying,
        isPaused,
        activeKey,
        audioGuideEnabled,
        setAudioGuideEnabled,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useGlobalAudio() {
  return useContext(AudioPlayerContext);
}
