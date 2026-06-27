# Code Standards

## General

- Keep components small and focused on one specific role (e.g. separate visualizer from text logs).
- Follow clean unmount patterns to prevent resource leaks (e.g. stop audio sessions and disconnect rooms).
- Keep component layout and layout calculations separated from direct domain state operations.

## TypeScript

- Strict type checking must be followed throughout.
- Avoid using `any` or empty type casts.
- Declare precise prop typings for all screens and components.
- Leverage structural typing interface suffixes like `Props` or `Options`.

## React Native & Expo

- Use Expo Router structures; define configurations in `app.json`.
- Avoid mixing React Native web APIs in native routes unless structured inside `.web.ts` files.
- Prefer `expo-status-bar` over base React Native status bar for consistent mobile overlay handling.

## Styling

- Use `StyleSheet.create` for defining static layouts.
- Avoid inline styles for anything except dynamic layout calculations (e.g. animations or coordinates calculated via `onLayout`).
- Ensure contrast guidelines and tap sizing boundaries from `ui-rules.md` are respected.

## File Organization

- `app/` — Expo Router folder structure containing screens.
- `app/assistant/ui/` — Sub-components scoped exclusively to the assistant screen.
- `constants/` — Static resource files, styles, assets configuration.
- `hooks/` — Custom reusable logic hooks.
- `setup/` — Initializers executing before the root layout loads.
