# Progress Tracker

### Current Phase

- Phase 2: Feature Exploration & Hardening (Verification & Deployment Prep)

## Current Goal

- Hardening screens, testing compilation diagnostics, and preparing LiveKit CLI deployment.

## Completed

- Copy context file templates from downloads.
- Create root and sub-directory `AGENTS.md` files (DOX indexing).
- Write `context/project-overview.md` with core user flow.
- Write `context/architecture.md` detailing system dependencies and boundaries.
- Create `context/ui-tokens.md`, `context/ui-rules.md`, and `context/ui-registry.md`.
- Update `context/code-standards.md` with React Native code rules.
- Create `context/library-docs.md` detailing LiveKit hook guidelines.
- Create `context/build-plan.md`.
- Clean up duplicate `typescript` dependency in `package.json`.
- Configured connection details to load dynamically from `EXPO_PUBLIC_LIVEKIT_...` environment variables.
- Created `.env` and `.env.example` configuration files.
- Implemented swappable Storage Layer abstraction (`IStorageService` interface, default offline `AsyncStorageProvider`, Appwrite stub).
- Created onboarding screen flow (Language Grid, Intro slide carousel, mic/notif permission panels, Auth/Demo login).
- Created bottom tabs layout, Home weeks-elapsed counter, Trimester guidelines tab, speech history transcript lists, and Profile settings panels.
- Refactored `useConnection` hook to pass participant attributes (language codes) and listen for preeclampsia warning attributes.
- Built immersive `app/conversation.tsx` screen using the original SDK `BarVisualizer` and `VideoTrack` styled in terracotta. Added transcription captions drawers and Emergency alert overlays.
- Created Python Agent (`agent/agent.py` and requirements) running Gemini Live API (`google.realtime.RealtimeModel` with the voice `Aoede` for natural audio conversation).
- Verified typescript compilation (`tsc --noemit`) and eslint format configurations are clean and free of errors.
- Fixed AsyncStorage web/mock fallback and python `cli.run_app` worker boot.
- Integrated Gemini Provider Tools (`GoogleSearch` and `GoogleMaps`) into SheGuard AI Python agent.
- Created `app/(tabs)/hospitals.tsx` real-time maternity clinic locator using MapLibre GL inside a WebView and querying the OpenStreetMap Overpass API.
- Patched permissions screen to check and enforce microphone and notification access before onboarding continuation.
- Implemented production-ready `AppwriteProvider.ts` using the official `react-native-appwrite` SDK.
- Created `services/storage/APPWRITE_GUIDE.md` detailing database schemas, custom attributes, and the Serverless LiveKit Token Generation function code for Appwrite.
- Created and successfully deployed the `generate-livekit-token` Appwrite serverless function using the Node.js 22 runtime, and configured the required environment variables (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`).
- Integrated dynamic Appwrite token fetching into `hooks/useConnection.tsx` to automatically request authorization tokens for the client.
- Resolved class context binding loss on storage providers by explicitly binding all class methods in constructors.
- Implemented strict `RoomContext` render guards on legacy components to avoid pre-loading crashes when the user is outside active session loops.
- Safeguarded `app/conversation.tsx` from `RoomContext` hook crashes during early initialization phase by conditionally wrapping room-dependent elements in a sub-component.
- Implemented client-side permission checks for `canUpdateMetadata` in `useConnection.tsx` to safely bypass attribute updates on restricted tokens.
- Fixed HTTP 406 Not Acceptable error in `hospitals.tsx` native fetches by appending an identified User-Agent header.
- Replaced app launcher icon assets and native Android mipmaps with the custom SheGuard maternal icons.
- Completely rewrote `hospitals.tsx` with: (1) cache-first loading using `AsyncStorage` — if user is within 3km of last fetch, results load instantly without any network call; (2) rich OSM tag address parsing (`buildAddress`) so each card shows a real address instead of "Maternity facility nearby"; (3) dynamic distance-based sorting (nearest first); (4) dynamically generated area filter pills populated from real fetched suburb/neighbourhood tags; (5) opening hours and distance badges on cards; (6) `expo-location` native location API to bypass WebView secure-origin geolocation block.
- Added background hospital prefetch in `HomeScreen` (`app/(tabs)/index.tsx`) — requests location and fetches clinics on app start so results are cached and instant when the user opens the Hospitals tab.
- Fixed LiveKit stuck loading state in `conversation.tsx` — added a 30-second connection timeout, a disconnect-after-connected detection hook (`wasConnectedRef`), and a proper "Could not connect / Try Again" screen instead of infinite spinner.
- Added `expo-location` package and `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` permissions to `app.json` and `AndroidManifest.xml`.
- Downgraded `expo-location` from `56.0.18` to `19.0.8` to match Expo SDK 54 compatibility, resolving the `NoClassDefFoundError` startup crash.
- Created safe-zone padded splash screen icons (66% logo size on transparent background canvas) to prevent Android circular cropping.
- Fixed python agent crash by replacing `.participants` room checks with `.remote_participants`.
- Patched python agent v1.x class usage: updated `session.start` call parameters to match `(agent, room=ctx.room)` signature.
- Fixed React Native UI stuck loading spinner by exporting the active room from `useConnection` and wrapping room hooks inside `<RoomContext.Provider value={room}>` in `conversation.tsx`.
- Integrated `@react-native-voice/voice` offline on-device speech-to-text dictation button into the check-in modal.
- Configured local storage (AsyncStorage) and cloud sync (Appwrite) for profile phone numbers, avatars, daily check-ins, and clinic appointments.
- Restructured `tips.tsx` into a month-by-month timeline (Months 1–9) with expandable accordions and speech reader triggers.
- Repurposed `history.tsx` into a unified chronological Health Journal combining daily symptom check-ins, alert logs, and collapsible LiveKit transcripts.
- Integrated LiveKit python agent tools (`log_symptoms` and `schedule_appointment`) that trigger client-side auto-logging.
- Fixed duplicate WebP asset resource merge errors and manifest merger appComponentFactory AndroidX/Support library conflicts in Gradle compiler.
- Created `agent/Dockerfile` for Python agent worker containerization.
- Compiled the clean Android debug APK binary.
- Cleared static connection tokens in `.env` to enable dynamic production token retrieval.
- Compiled the standalone offline-ready Android production release binary `sheguard-production.apk`.
- Wiped old git history commits to completely purge past MIT license footprints from GitHub, rebasing with the new AGPL-3.0 License.
- Set up a GitHub Actions CI/CD automation workflow (`build.yml`) to compile APK and iOS simulator app packages with Xcode 16.2.
- Fixed LiveKit Cloud agent silent audio/loopback bug by correcting room connection order in `agent.py` (connecting to the room first before starting the session and resolving user attributes).
- Overhauled CustomAlert modal with a premium left-aligned layout, tap-outside-to-dismiss behavior, close icon, and dynamic button layout styling (pill buttons for alerts, rectangular rows for lists/checklists).
- Added `doctorPhone` schema field to `UserProfile` in onboarding profile setup, edit profile settings, and conversation call emergency buttons to call the user's primary doctor directly with family caregiver fallbacks.
- Resolved uncaught `@react-native-voice/voice` TypeError crashes on startup on devices/emulators lacking speech recognition modules by wrapping initialization in try/catch and dynamically hiding the dictation button when voice is unsupported.
- Connected the custom `ThemeContext` directly to `@/hooks/useColorScheme` so the selected Light/Dark/System preference immediately propagates to all screens using `useColorScheme`.
- Fixed LiveKit Cloud deployment tool registration crash by decorating python functions with `@llm.function_tool` to convert them to `FunctionTool` instances.
- Enabled auto-dispatch routing for named agents by configuring the LiveKit Cloud agent worker to run as a named agent matching the explicit `lk dispatch create` room settings.
## In Progress

- Production live validation and testing of the standalone release binary.

## Next Up

- Distribute release APK for clinical testing.

## Open Questions

- None.

## Architecture Decisions

- Swappable storage service layer (`services/storage/`) to isolate persistent code from backend specifics.
- Integration of the original SDK `BarVisualizer` and `VideoTrack` inside `conversation.tsx` modal.
- Gemini Live API selected for low-latency audio-to-audio conversation.
- MapLibre GL inside a native Webview with CARTO tiles and OpenStreetMap Overpass API utilized for real-time, free hospital geolocation.


