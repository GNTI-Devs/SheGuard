import { useEffect, useState, useRef } from 'react';
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

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKey, setActiveKey] = useState<AudioGuideKey | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Setup audio category once on initialization
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch((err: any) =>
      console.warn('[useAudioPlayer] setAudioModeAsync error:', err)
    );

    return () => {
      // Clean up sound on unmount
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
      // If playing the same sound, stop it (toggle action)
      if (activeKey === key && isPlaying) {
        await stop();
        return;
      }

      // Stop any existing sound
      await stop();

      const source = AUDIO_ASSETS[key];
      if (!source) {
        console.warn(`[useAudioPlayer] Asset not found for key: ${key}`);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true },
        (status: any) => {
          if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
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
