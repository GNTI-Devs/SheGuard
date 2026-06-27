# App UI & Screens Contract

## Purpose
This directory houses the user interface screens, Expo Router structure, and visual component trees (views/layouts).

## Ownership
- **Owner**: Zeez (Lead Developer)
- **Collaborator**: Antigravity (AI Coding Assistant)

## Local Contracts
- Screens in `app/` must only delegate direct WebRTC session management to hooks (e.g., `useConnection`).
- UI styling must leverage StyleSheet or theme-aware components, adhering to styles configured in `constants/Colors.ts`.
- Navigation must be defined and managed via Expo Router (`expo-router`).

## Work Guidance
- Use functional React components with proper TypeScript typing.
- Layouts should handle safe area inserts (`react-native-safe-area-context`).
- Support both light and dark color schemes dynamically using `useColorScheme`.

## Verification
- Run `npm run typescript` to ensure no typing regressions occur on the screens.
- Open screens inside standard React Native runtime or simulator (managed via Expo).

## Child DOX Index
- None. Subdirectories (e.g. `(start)`, `assistant-legacy`) are managed directly by this level.

