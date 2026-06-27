# UI Context

## Theme

The design language is a dark technical conversation room. It features deep near-black backgrounds, layered gray panels for controls, and white text, with blue button accents for interactive elements.

## Colors

All styling colors must refer to values defined in `constants/Colors.ts`.

| Role            | Value / Code | Usage |
| --------------- | ------------ | ----- |
| Page background | `#151718`     | Root view container background. |
| Surface         | `#131313`     | Text box and transcript bubbles. |
| Primary text    | `#ECEDEE`     | Body labels and input values. |
| Muted text      | `#9BA1A6`     | Placeholders and inactive control buttons. |
| Primary accent  | `#002CF2`     | Voice assistant start button. |
| Border          | `#202020`     | Capsule control borders. |

## Typography

| Role      | Font Family |
| --------- | ----------- |
| UI text   | System Default |
| Code/mono | System Monospace |

## Border Radius

- Inline / small UI: `borderRadius: 6` (Chat transcription bubbles).
- Cards / panels: `borderRadius: 24` (Inputs / main button layouts).
- Modals / overlays: `borderRadius: 53` (Control bar capsule).

## Layout Patterns

- **Welcome Landing**: Centered branding logo, single instruction line, and a prominent centered connect CTA button.
- **Room Workspace**: Vertically structured chat transcript, bottom horizontal text entry input, dynamically animated agent visualizer area, and bottom fixed capsule bar.

## Icons

- Material icon images imported locally from `assets/images/` for control toggles (Mic, Video, ScreenShare, Chat, Exit).
- Scale size: `width: 20` for standard control buttons.
