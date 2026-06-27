# UI Tokens Spec

This file defines the visual styling tokens and design values utilized across the Voice Assistant interfaces.

## Themes

The application defaults to a technical dark theme environment, utilizing deep background tones with crisp white text and high-contrast blue/gray interactive elements.

## Color Tokens

Colors are declared in `constants/Colors.ts`. Do not use hardcoded hex codes directly in screen layouts.

### Dark Palette

| Token Name | Assigned Code | Role / Usage |
| :--- | :--- | :--- |
| `background` | `#151718` | Root screen background container. |
| `text` | `#ECEDEE` | Primary body, titles, and active input text. |
| `accent` | `#002CF2` | Connect button background. |
| `control-bg` | `#070707` | Control bar background. |
| `surface-dark` | `#131313` | Chat input and User Transcription bubble backgrounds. |
| `muted` | `#9BA1A6` | Placeholders, inactive state icons, secondary info text. |
| `border` | `#202020` | Subtle lines separating control panels. |

### Light Palette

| Token Name | Assigned Code | Role / Usage |
| :--- | :--- | :--- |
| `background` | `#FFFFFF` | Light theme background. |
| `text` | `#11181C` | Primary body and titles in light mode. |
| `tint` | `#0a7ea4` | Active icons and highlighted links. |
| `surface-light` | `#B0B0B0` | Light theme bubble backgrounds. |
| `muted` | `#687076` | Inactive icon or secondary text colors. |

## Typography (Sizes & Weight)

- **Welcome / Subtitle**: `fontSize: 17` (Normal/Muted text spacing).
- **Buttons / Actions**: `fontSize: 16`, medium/semi-bold weight, wrapped in 12px vertical padding.
- **Transcriptions**: `fontSize: 17` for readability during speech sessions.

## Border Radius Scale

- **Action Buttons / TextInput**: `borderRadius: 24` (Pill-shaped inputs).
- **Card / Bubble**: `borderRadius: 6` (Rounded corners for chat logs).
- **Controls Container**: `borderRadius: 53` (Wide rounded capsule layout).
