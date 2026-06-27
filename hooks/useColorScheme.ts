/**
 * useColorScheme — custom hook that returns the active theme scheme from ThemeContext.
 * Automatically falls back to the system scheme when called outside ThemeProvider.
 */
import { useThemeContext } from './useThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  try {
    const context = useThemeContext();
    return context.colorScheme;
  } catch (e) {
    // Fallback if context is not available (e.g. outside ThemeProvider / tests)
    const { useColorScheme: useSystemColorScheme } = require('react-native');
    return useSystemColorScheme() ?? 'dark';
  }
}
