# Architecture Context

## Stack

| Layer     | Technology                                                      | Role                                                |
| --------- | --------------------------------------------------------------- | --------------------------------------------------- |
| Framework | Expo SDK 54 / Expo Router                                       | React Native application shell and directory routing |
| Real-time | `@livekit/react-native` & `livekit-client`                      | WebRTC client wrapper, audio session, video tracks  |
| UI        | React Native components, StyleSheet, `react-native-reanimated` | Rendering and layout animations                     |
| Auth      | LiveKit sandbox tokens / pre-generated API tokens               | Session authentication and authorization            |

## System Boundaries

- `app/` — Routing layout definition.
  - `app/(start)/index.tsx` — Connection initiation screen.
  - `app/assistant/index.tsx` — Main interactive conversation room.
  - `app/assistant/ui/` — Isolated styling wrappers for the conversation views (visualizers, control panel, chat logs).
- `hooks/` — Encapsulated React custom hooks.
  - `hooks/useConnection.tsx` — Connection context provider encapsulating LiveKit Session startup and token source configuration.
- `setup/` — Native libraries registration.
  - `setup/livekitSetup.ts` — WebRTC/LiveKit global settings initialization.

## Storage Model

- **Connection Context State**: Volatile in-memory React context (`ConnectionContext`) defining whether the connection session is active.
- **Transcriptions Log**: Temporary in-memory log of LiveKit session messages (`ReceivedMessage`) representing transcriptions in the current session.

## Auth and Access Model

- Session connection requires a token.
- Uses either a LiveKit sandbox ID to fetch a temporary token automatically or static local hardcoded URL + token configuration.

## Invariants

1. **Audio Session Lifecycle**: The iOS/Android Audio Session MUST be initialized (`AudioSession.startAudioSession()`) when the room mounts and stopped (`AudioSession.stopAudioSession()`) when it unmounts.
2. **Hook Wrapping**: LiveKit components (like `RoomView` and UI visualizers) must always be child nodes of the `SessionProvider` or `ConnectionProvider`.
3. **Single Connection State**: Transition to the assistant page must only occur when the connection active status is successfully resolved (`isConnectionActive === true`).
