/**
 * useScreenAudio — auto-plays an audio guide on the first visit to a screen.
 *
 * Listens to the global audioGuideEnabled state from AudioPlayerContext so that
 * when the user turns it on (e.g. from the onboarding prompt modal), the guide
 * immediately starts playing for the active screen.
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioGuideKey } from './useAudioPlayer';
import { useGlobalAudio } from './AudioPlayerContext';

const AUTOPLAY_DELAY_MS = 1500;

export function useScreenAudio(screenKey: AudioGuideKey) {
  const { play, stop, isPlaying, activeKey, audioGuideEnabled } = useGlobalAudio();
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    // 1. Wait until preferences are loaded, and make sure guide is enabled
    if (audioGuideEnabled === null || !audioGuideEnabled || hasAutoPlayed.current) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    (async () => {
      try {
        // 2. Check if user already heard the guide for this screen
        const playedKey = `audio_played_${screenKey}`;
        const alreadyPlayed = await AsyncStorage.getItem(playedKey);
        if (alreadyPlayed === 'true') return;

        // 3. Play screen audio guide
        hasAutoPlayed.current = true;
        timer = setTimeout(async () => {
          await play(screenKey);
          // 4. Save played flag
          await AsyncStorage.setItem(playedKey, 'true').catch(() => {});
        }, AUTOPLAY_DELAY_MS);
      } catch (_) {}
    })();

    return () => {
      clearTimeout(timer);
    };
  }, [audioGuideEnabled, screenKey, play]);

  return { play, stop, isPlaying, activeKey };
}
