# Third-Party Library Integration Docs

This document captures constraints, warnings, and implementation conventions for the external dependencies.

## LiveKit React Native SDK (`@livekit/react-native`)

### Audio Session Management
- **Requirement**: Audio Session must be started on entering the assistant screen and terminated on leaving.
```typescript
import { AudioSession } from '@livekit/react-native';

useEffect(() => {
  AudioSession.startAudioSession();
  return () => {
    AudioSession.stopAudioSession();
  };
}, []);
```
- **iOS Caveat**: Always invoke `useIOSAudioManagement(room, true)` inside LiveKit room contexts to ensure iOS handles routing through speaker/receivers properly.

### Video Track Component
- **Usage**: Use `<VideoTrack trackRef={trackRef} />` to render both local (user) and remote (agent) video feeds.
- **Constraints**: Ensure the container wrapping `<VideoTrack>` has explicit styles for width and height.

## LiveKit Components React (`@livekit/components-react`)

### Hook Hooks and Providers
- Must be rendered inside a `<SessionProvider session={session}>` tree.
- `useLocalParticipant()`: Exposes camera/mic status hooks.
- `useAgent()`: Retrieves remote agent voice track state and track references.
- `useSessionMessages()`: Exposes `messages` array and the `send` event callback to execute message delivery.

## React Native Reanimated (`react-native-reanimated`)

- Utilize `Animated.FlatList` or `Animated.View` for layouts that adapt dynamically to view state changes (e.g. Chat slideout toggles).
- Use `LinearTransition` layout animation configurations to smooth out items shifting when transcription rows list updates.
