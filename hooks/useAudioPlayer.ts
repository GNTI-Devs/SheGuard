import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export type AudioGuideKey =
  | 'welcome'
  | 'intro'
  | 'permissions'
  | 'profile_setup'
  | 'home'
  | 'tips'
  | 'history'
  | 'settings';

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

const ANDROID_SETTLE_MS = 150;

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKey, setActiveKey] = useState<AudioGuideKey | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Clean up sound on unmount only
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const stop = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setActiveKey(null);
    } catch (e) {
      console.warn('[useAudioPlayer] Stop error:', e);
    }
  };

  const play = async (key: AudioGuideKey) => {
    try {
      // Toggle: if same key is playing, stop it
      if (activeKey === key && isPlaying) {
        await stop();
        return;
      }

      // Stop any existing sound first
      await stop();

      // Re-configure audio mode before every playback to guarantee
      // correct routing after returning from background or a LiveKit call
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      }).catch((err: any) =>
        console.warn('[useAudioPlayer] setAudioModeAsync error:', err)
      );

      // On Android, give the OS audio session time to release focus before
      // starting a new sound — prevents the first syllable from being clipped
      if (Platform.OS === 'android') {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, ANDROID_SETTLE_MS)
        );
      }

      const source = AUDIO_ASSETS[key];
      if (!source) {
        console.warn(`[useAudioPlayer] Asset not found for key: ${key}`);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true },
        (status: any) => {
          // Guard: only react when fully loaded and truly finished
          if (status.isLoaded && status.didJustFinish && !status.isPlaying) {
            setIsPlaying(false);
            setActiveKey(null);
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setActiveKey(key);
    } catch (e) {
      console.warn('[useAudioPlayer] Play error:', e);
      setIsPlaying(false);
      setActiveKey(null);
    }
  };

  return {
    play,
    stop,
    isPlaying,
    activeKey,
  };
}
