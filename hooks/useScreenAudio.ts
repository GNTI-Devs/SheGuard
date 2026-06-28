/**
 * useScreenAudio — auto-plays an audio guide on the first visit to a screen.
 *
 * Uses the global AudioPlayerContext so the floating SpeakingIndicator can
 * observe playback state across all screens.
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioGuideKey } from './useAudioPlayer';
import { useGlobalAudio } from './AudioPlayerContext';

const AUTOPLAY_DELAY_MS = 1500;
const GUIDE_ENABLED_KEY = 'audio_guide_enabled';

export function useScreenAudio(screenKey: AudioGuideKey) {
  const { play, stop, isPlaying, activeKey } = useGlobalAudio();
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    if (hasAutoPlayed.current) return;

    let timer: ReturnType<typeof setTimeout>;

    (async () => {
      try {
        // 1. Check global toggle (default: enabled)
        const guideEnabled = await AsyncStorage.getItem(GUIDE_ENABLED_KEY);
        if (guideEnabled === 'false') return;

        // 2. Check per-screen flag
        const playedKey = `audio_played_${screenKey}`;
        const alreadyPlayed = await AsyncStorage.getItem(playedKey);
        if (alreadyPlayed === 'true') return;

        // 3. Schedule auto-play
        hasAutoPlayed.current = true;
        timer = setTimeout(async () => {
          await play(screenKey);
          // 4. Mark as heard
          await AsyncStorage.setItem(playedKey, 'true').catch(() => {});
        }, AUTOPLAY_DELAY_MS);
      } catch (_) {}
    })();

    return () => {
      clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { play, stop, isPlaying, activeKey };
}
