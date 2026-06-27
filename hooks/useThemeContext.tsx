/**
 * Theme Context — wraps the system colorScheme and allows in-app override.
 * Override is persisted in AsyncStorage under 'theme_override'.
 *
 * Usage:
 *   const { colorScheme, setColorScheme } = useThemeContext();
 *   // colorScheme is 'light' | 'dark'
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'dark',
  themePreference: 'system',
  setThemePreference: async () => {},
});

const STORAGE_KEY = 'theme_override';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'dark';
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setThemePreferenceState(val);
      }
    });
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    await AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const colorScheme: ColorScheme =
    themePreference === 'system' ? systemScheme : themePreference;

  return (
    <ThemeContext.Provider value={{ colorScheme, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  return useContext(ThemeContext);
}
