# UI Components Registry

This registry tracks the primary user interface screens and reusable visual modules of the SheGuard AI application.

| Component Name | Relative Path | Purpose |
| :--- | :--- | :--- |
| `SplashGuard` | [_layout.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/_layout.tsx) | Navigation guard checking profiles and routing to Onboarding or Tabs. |
| `LanguageSelect` | [language-select.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(onboarding)/language-select.tsx) | Welcome language selection screen (Yoruba, Igbo, Hausa, Pidgin, English). |
| `IntroCarousel` | [intro.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(onboarding)/intro.tsx) | Paged horizontal slider detailing SheGuard's core values. |
| `PermissionsSetup` | [permissions.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(onboarding)/permissions.tsx) | Microphone and notifications request panels. |
| `AuthDemo` | [auth-demo.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(onboarding)/auth-demo.tsx) | Phone sign-in and **Try Demo** CTA (seeds Amina's profile). |
| `ProfileSetup` | [profile-setup.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(onboarding)/profile-setup.tsx) | Initial profile setup screen (name and month) calculating pregnancy due dates. |
| `HomeDashboard` | [index.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(tabs)/index.tsx) | Dashboard tracking weeks elapsed, daily tip card, and Central Voice Orb launcher. |
| `PregnancyTips` | [tips.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(tabs)/tips.tsx) | Trimester-sorted pregnancy guidelines (including critical preeclampsia signs). |
| `ConversationHistory` | [history.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(tabs)/history.tsx) | List of past conversation log logs and expandable user vs agent speech transcripts. |
| `ProfileSettings` | [profile.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(tabs)/profile.tsx) | Settings panel for dynamic language changes and editing caregiver helper numbers. |
| `HospitalsScreen` | [hospitals.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/(tabs)/hospitals.tsx) | Maternity clinics locator screen using MapLibre GL WebView and OpenStreetMap Overpass API. |
| `VoiceRoomModal` | [conversation.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/conversation.tsx) | Immersive fullscreen voice assistant containing the original SDK `BarVisualizer` and `VideoTrack`. |
| `EmergencyOverlay` | [conversation.tsx](file:///home/zeez/gitcloned/agent-starter-react-native/app/conversation.tsx#L375) | Crimson overlay triggered by the agent's attribute warnings to call hospitals or alert caregivers. |

