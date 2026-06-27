/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Colors = {
  light: {
    background: '#FFF8F6', // Warmest blush white
    surface: '#FFFFFF', // Pure white cards
    surface2: '#FFF0EC', // Soft rose-tinted elevated surface
    primary: '#A0405A', // Deep rose / raspberry
    primaryMuted: '#C47A8A', // Lighter rose for secondary elements
    text: '#2D1520', // Very dark plum — warm, not harsh black
    textMuted: '#8A5A67', // Muted mauve-rose for subtitles
    success: '#4A7A52', // Sage green (kept for safety indicators)
    emergency: '#B52B2B', // Deep crimson for danger signs
    border: '#F0D5DB', // Soft rose divider
    tint: '#A0405A', // Deep rose tint
    icon: '#8A5A67', // Muted mauve icon
    tabIconDefault: '#8A5A67',
    tabIconSelected: '#A0405A',
  },

  dark: {
    background: '#1A0F18', // Deep plum-black (rich, not flat black)
    surface: '#2A1828', // Dark plum surface
    surface2: '#3D2038', // Elevated rose-plum
    primary: '#D4607A', // Vibrant raspberry — pops on dark bg
    primaryMuted: '#A0405A', // Medium rose for secondary elements
    text: '#FDF4F7', // Warm white with a rose tint
    textMuted: '#C4A0AC', // Muted rose-lavender for subtitles
    success: '#6AAF7A', // Brighter sage green for dark bg
    emergency: '#E05050', // Vivid red — clear danger on dark
    border: '#5A2A40', // Dark rose divider
    tint: '#D4607A', // Raspberry tint
    icon: '#C4A0AC', // Muted rose icon
    tabIconDefault: '#C4A0AC',
    tabIconSelected: '#D4607A',
  },
};
