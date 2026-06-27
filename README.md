<p align="center">
  <img src="./assets/images/icon.png" alt="SheGuard Logo" width="160" height="160" style="border-radius: 32px;" />
</p>

<h1 align="center">SheGuard AI</h1>

<p align="center">
  <strong>A Multilingual, Voice-First Maternal Health Companion for Expectant Mothers in Nigeria</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" />
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/built%20with-Expo%20SDK%2054-blueviolet.svg" alt="Expo" />
  <img src="https://img.shields.io/badge/AI-Gemini%20Live%20API-orange.svg" alt="Gemini" />
  <img src="https://img.shields.io/badge/voice-LiveKit%20Cloud-green.svg" alt="LiveKit" />
  <img src="https://img.shields.io/badge/backend-Appwrite%20Cloud-red.svg" alt="Appwrite" />
</p>

---

## 📖 About the Project

**SheGuard AI** is an open-source, offline-capable mobile health companion and real-time voice assistant built specifically for expectant mothers in Nigeria, with a focus on underserved and rural communities.

Maternal mortality in Nigeria remains among the highest in the world. A significant proportion of preventable deaths are caused by **late recognition of danger signs** — particularly preeclampsia, haemorrhage, and infection — that could have been identified and escalated hours earlier. SheGuard aims to close that gap by putting an intelligent, warm, culturally-aware AI health companion directly in a mother's pocket, available 24/7 in her own language.

SheGuard is **not a replacement for a doctor** — it is a triage and guidance tool that:
- Detects danger signs through natural conversation and raises immediate alerts.
- Delivers trimester-specific, evidence-based pregnancy guidance.
- Encourages consistent antenatal attendance.
- Connects mothers to nearby maternity facilities in real time.
- Gives mothers an emotional support channel — especially in communities where healthcare workers are few.

---

## 🏆 Hackathon Project

This application was conceived, designed, and built as a **hackathon project** by:

| Name | Role |
|---|---|
| **Ummulkhair Logun** | Co-Lead / Product & AI Strategy |
| **Katrina Emegbagha** | Co-Lead / UX, Design & Community Research |
| **GNTI Developers Team** | Technical Development & Engineering Assistance |

> _"We built SheGuard because we believe every mother deserves a knowledgeable companion by her side — regardless of where she lives, what language she speaks, or how much she earns."_

---

## ✨ Key Features

### 🎙️ Multilingual AI Voice Consultations
Talk naturally to SheGuard — no typing required. The AI responds in your language:
- 🇬🇧 **English**
- 🇳🇬 **Nigerian Pidgin English** (e.g. *"How you dey? No worry, I dey here for you."*)
- **Yoruba**
- **Hausa**
- **Igbo**

Language is detected from the user's onboarding preference and injected into every AI session automatically.

### 🚨 Preeclampsia & Danger Sign Detection
The AI continuously monitors conversation for **8 critical danger signs**:
- Severe headache
- Face, hands, or feet swelling
- Blurred or disturbed vision
- Vaginal bleeding or spotting
- Fever or chills
- Reduced or absent fetal movement
- Severe abdominal pain
- Convulsions

If any are mentioned, SheGuard immediately reassures the user, explains the risk, and triggers a **prominent Emergency Alert Overlay** in the app with one-tap options to call the user's configured doctor, caregiver, or emergency services.

### 📓 Daily Symptom Check-In & Health Journal
- Users log their daily mood (great / good / tired / unwell / anxious) and physical symptoms through an interactive check-in modal.
- Integrated **offline on-device voice dictation** (via `@react-native-voice/voice`) makes input simple even for users with limited literacy.
- All check-ins, alert events, and LiveKit call transcripts are merged into a **unified chronological Health Journal**.

### 📅 Month-by-Month Pregnancy Timeline
Pregnancy guidelines are structured into **9 Expandable Month Accordions** (Months 1–9) covering:
- Physical changes to expect
- Nutritional advice
- Danger signs specific to each trimester
- Activity and rest recommendations
- Antenatal visit milestones

Each accordion has a built-in **voice reader** that reads the content aloud for users with limited reading ability.

### 🏥 Real-Time Maternity Clinic Locator
- Detects the user's GPS coordinates using the native `expo-location` API.
- Queries the **OpenStreetMap Overpass API** to find real maternity facilities within a 15km radius.
- Results are sorted nearest-first, displayed on an interactive **MapLibre GL map** with CARTO vector tiles.
- Full address parsing from OSM tags, opening hours badges, and distance labels on every result card.
- **Cache-first architecture**: results cached in `AsyncStorage` — if the user is within 3km of the last fetch location, results load instantly without any network call.

### 🩺 Doctor Contact & Emergency Calling
- Users configure their **personal doctor's phone number** during onboarding or in Profile Settings.
- Emergency overlay buttons dynamically route: Doctor → Primary Caregiver → Emergency Services (112), in that priority order.

### 🌙 Light / Dark / System Theme Support
Full theme switching with a dedicated toggle in profile settings, propagated instantly across all screens via a centralized `ThemeContext`.

### 🔒 Offline-First & Privacy-Respecting
- All personal data is stored locally first using `AsyncStorage`.
- Cloud sync to Appwrite is secondary and optional.
- No raw audio recordings are stored. Only conversation transcripts (if enabled).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE CLIENT (Expo)                      │
│  React Native + TypeScript + Expo Router                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Onboarding  │  │  Home / Tabs │  │ Conversation │      │
│  │  (Language,  │  │  (Journal,   │  │  (LiveKit    │      │
│  │   Profile,   │  │  Timeline,   │  │   WebRTC     │      │
│  │   Perms)     │  │  Hospitals)  │  │   Session)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Storage Layer: IStorageService                             │
│  ├── AsyncStorageProvider (local/offline, always active)    │
│  └── AppwriteProvider (cloud sync, optional)                │
└────────────────────────┬────────────────────────────────────┘
                         │ WebRTC (wss://)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               LIVEKIT CLOUD (Managed Agent Hosting)          │
│                                                             │
│  Room: sheguard-room                                        │
│  Agent: sheguard-ai (named worker)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Python Agent Worker (agent.py)               │   │
│  │                                                     │   │
│  │  Gemini Live API (gemini-2.5-flash-native-audio)    │   │
│  │  Voice: Aoede (warm female)                         │   │
│  │  Tools: GoogleSearch, GoogleMaps,                   │   │
│  │         log_symptoms, schedule_appointment          │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPWRITE CLOUD (Backend)                    │
│                                                             │
│  Auth: Account sessions                                     │
│  Database: profiles, conversations, appointments            │
│  Functions: generate-livekit-token (Node.js 22 / Bun)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Mobile Client

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 54](https://expo.dev/) + [React Native](https://reactnative.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| Navigation | [Expo Router v4](https://docs.expo.dev/router/introduction/) (file-based) |
| Real-Time Voice | [`@livekit/react-native`](https://github.com/livekit/client-sdk-react-native) |
| WebRTC Config | `@config-plugins/react-native-webrtc` |
| Speech-to-Text | [`@react-native-voice/voice`](https://github.com/react-native-voice/voice) (offline, on-device) |
| Geolocation | [`expo-location`](https://docs.expo.dev/versions/latest/sdk/location/) |
| Maps | `react-native-webview` + MapLibre GL + CARTO tiles |
| Local Storage | [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage) |
| Animations | `react-native-reanimated` |

### Backend (Appwrite Cloud)

| Layer | Technology |
|---|---|
| Cloud Platform | [Appwrite Cloud](https://appwrite.io/) |
| Auth | Appwrite Account sessions |
| Database | Appwrite Database (multi-collection) |
| Token Generation | Appwrite Serverless Functions (Node.js 22, Bun runtime) |

### AI Agent (LiveKit Cloud)

| Layer | Technology |
|---|---|
| Agent Framework | [LiveKit Agents SDK](https://github.com/livekit/agents) (`>=1.2.0`) |
| Language | Python 3.11 |
| LLM | Gemini Live API (`gemini-2.5-flash-native-audio-preview-12-2025`) |
| Plugins | `livekit-plugins-google` (`>=0.5.0`), `google-genai` (`>=0.1.1`) |
| Grounding Tools | Google Search, Google Maps (via `google.tools`) |
| Hosting | LiveKit Cloud Managed Agents |

---

## 📂 Project Structure

```
agent-starter-react-native/
├── agent/                        # Python AI agent worker
│   ├── agent.py                  # Main agent entrypoint (Gemini Live session)
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Container definition for LiveKit Cloud deploy
│   ├── livekit.toml              # LiveKit Cloud agent configuration
│   └── .env                      # Agent secrets (not committed)
│
├── app/                          # Expo Router screens (file-based routing)
│   ├── (onboarding)/             # Onboarding flow
│   │   ├── index.tsx             # Language selection grid
│   │   ├── intro.tsx             # Intro carousel slides
│   │   ├── permissions.tsx       # Mic + notification permissions
│   │   ├── auth.tsx              # Login / Demo login
│   │   └── profile-setup.tsx    # Name, due date, doctor phone setup
│   ├── (tabs)/                   # Main bottom tab screens
│   │   ├── index.tsx             # Home (weeks counter, check-in modal)
│   │   ├── tips.tsx              # Month accordion pregnancy timeline
│   │   ├── hospitals.tsx         # Maternity clinic map + list
│   │   ├── history.tsx           # Unified health journal
│   │   └── profile.tsx           # Settings, theme toggle, doctor config
│   └── conversation.tsx          # Immersive AI voice session screen
│
├── components/                   # Reusable UI components
│   ├── CustomAlert.tsx           # Premium modal dialog (dismissible, pill buttons)
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── useConnection.tsx         # LiveKit connection lifecycle, token fetching
│   ├── useColorScheme.ts         # Theme-aware color scheme hook
│   └── useThemeColor.ts          # Token-level theme color resolver
│
├── services/                     # Storage abstraction layer
│   └── storage/
│       ├── IStorageService.ts    # Interface + UserProfile schema
│       ├── AsyncStorageProvider.ts  # Offline-first local implementation
│       ├── AppwriteProvider.ts   # Appwrite cloud sync implementation
│       └── APPWRITE_GUIDE.md    # Full Appwrite schema + function setup guide
│
├── constants/                    # App-wide constants (Colors, theme tokens)
├── setup/                        # Third-party library setup hooks
├── context/                      # Project context files (architecture, UI rules, etc.)
├── assets/                       # Images, fonts, icons
├── android/                      # Native Android project files
├── app.json                      # Expo app configuration
├── package.json
└── taskfile.yaml                 # Task runner shortcuts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/) (used as the package manager and runtime)
- [Android Studio](https://developer.android.com/studio) with an Android emulator configured (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)
- [Python 3.11+](https://www.python.org/) (for running the agent locally)
- [LiveKit CLI](https://docs.livekit.io/agents/cli/) (`lk`) for cloud agent management
- An [Appwrite Cloud](https://appwrite.io/) account
- A [LiveKit Cloud](https://cloud.livekit.io/) project
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

---

### 1. Clone the Repository

```bash
git clone https://github.com/GNTI-Devs/SheGuard.git
cd SheGuard
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Your LiveKit Cloud WebSocket URL (found in your LiveKit Cloud project settings)
EXPO_PUBLIC_LIVEKIT_URL="wss://your-project-subdomain.livekit.cloud"

# Leave empty in production — Appwrite function generates tokens dynamically
EXPO_PUBLIC_LIVEKIT_TOKEN=""

# The registered agent name on LiveKit Cloud (must match your deployed agent)
EXPO_PUBLIC_LIVEKIT_AGENT_NAME="sheguard-ai"
```

Create `agent/.env` for the AI agent:

```env
LIVEKIT_URL=wss://your-project-subdomain.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
GOOGLE_API_KEY=your-google-gemini-api-key
```

### 4. Set Up Appwrite

Follow the full guide in [`services/storage/APPWRITE_GUIDE.md`](./services/storage/APPWRITE_GUIDE.md).

In summary:

1. Create an Appwrite project.
2. Create a database named `sheguard`.
3. Create the following collections:

#### Collection: `profiles`
| Attribute | Type | Notes |
|---|---|---|
| `user_id` | String | Appwrite user UID |
| `display_name` | String | User's full name |
| `language` | String | Language code (`en`, `ha`, `yo`, `ig`, `pcm`) |
| `pregnancy_month` | Integer | Current pregnancy month (1–9) |
| `due_date` | String | ISO date string |
| `is_demo` | Boolean | `true` for demo accounts |
| `emergency_contacts` | String[] | Array of phone numbers |
| `doctor_phone` | String | Primary doctor's phone number |
| `created_at` | String | ISO timestamp |

#### Collection: `conversations`
| Attribute | Type | Notes |
|---|---|---|
| `conversation_id` | String | Unique session ID |
| `user_id` | String | Owner's UID |
| `room_name` | String | LiveKit room name |
| `started_at` | String | ISO timestamp |
| `ended_at` | String | ISO timestamp |
| `had_emergency` | Boolean | Whether an emergency alert was raised |
| `messages_json` | String (LongText) | JSON-encoded transcript array |

#### Collection: `appointments`
| Attribute | Type | Notes |
|---|---|---|
| `appointment_id` | String | Unique ID |
| `user_id` | String | Owner's UID |
| `title` | String | Appointment description |
| `datetime` | String | ISO datetime string |
| `location` | String | Optional clinic/facility name |
| `completed` | Boolean | Whether the appointment was attended |

4. Deploy the `generate-livekit-token` serverless function (see the guide for full code and environment variable setup).

---

### 5. Run the Mobile App (Development)

```bash
# Start Metro bundler + Android
bun run android

# Or for iOS (macOS only)
bun run ios
```

### 6. Run the AI Agent Locally (for testing)

```bash
cd agent
pip install -r requirements.txt
python agent.py start
```

> **Note**: For local testing, ensure your `.env` inside `agent/` is correctly populated. The agent will connect to your LiveKit Cloud project and register itself as `sheguard-ai`.

---

## ☁️ Deploying to LiveKit Cloud (Production)

SheGuard's AI agent runs on **LiveKit Cloud Managed Agents**, which handles container orchestration, scaling, and uptime automatically.

### Deploy the Agent

```bash
# From the project root
lk agent deploy --secrets-file agent/.env agent/
```

This builds a Docker image from `agent/Dockerfile`, pushes it to LiveKit Cloud, and starts the managed worker.

### Create the Dispatch Rule

The LiveKit dispatch rule connects incoming room connections to the named agent:

```bash
lk dispatch create --room sheguard-room --agent-name sheguard-ai
```

> **Tip**: Recreate this dispatch rule whenever you redeploy the agent to ensure stale sessions are cleared.

### Monitor Agent Logs

```bash
lk agent logs sheguard-ai
```

---

## 📱 Building a Standalone Android APK

### Debug Build (requires Metro bundler at runtime)

```bash
bun run android
```

### Production Release APK (fully standalone, no Metro)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

> For a signed APK, configure your keystore in `android/app/build.gradle` and run `assembleRelease` with signing config set.

---

## 🤝 Contributing

SheGuard is an open-source project and contributions are warmly welcomed — especially from developers, designers, and healthcare professionals with expertise in maternal health.

### How to Contribute

1. **Fork** the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes, ensuring you follow the existing code standards (see `context/code-standards.md`).
4. Run the TypeScript compiler to validate your changes:
   ```bash
   bun run typescript
   ```
5. Run the linter:
   ```bash
   bun run lint
   ```
6. Commit your changes with a clear message:
   ```bash
   git commit -m "feat: your descriptive message"
   ```
7. Push and open a **Pull Request** against the `main` branch.

### Areas We Need Help

- 🌍 **More Nigerian Language Support**: Improve Hausa, Yoruba, Igbo, and Pidgin conversation quality and vocabulary.
- 🏥 **Healthcare Content Review**: Medical professionals reviewing and improving the danger sign detection and guidance content.
- 📱 **iOS Testing & Compatibility**: Testing and fixing any iOS-specific issues.
- ♿ **Accessibility**: Screen reader support, larger text modes, and high-contrast theming.
- 🔐 **Security Hardening**: Reviewing auth flows and token management.
- 📊 **Analytics & Insights**: Anonymised aggregate health trend reporting for community health workers.
- 🌐 **Offline AI**: Exploring on-device small language models for fully offline voice conversations.
- 🧪 **Test Coverage**: Unit and integration tests across the React Native codebase.

### Code of Conduct

Please be respectful and constructive. This project is built for vulnerable populations — maintain sensitivity and care in all contributions.

---

## 🔑 Environment Variable Reference

| Variable | Location | Description |
|---|---|---|
| `EXPO_PUBLIC_LIVEKIT_URL` | `.env` (root) | Your LiveKit Cloud WebSocket URL |
| `EXPO_PUBLIC_LIVEKIT_TOKEN` | `.env` (root) | Static token (leave empty for production) |
| `EXPO_PUBLIC_LIVEKIT_AGENT_NAME` | `.env` (root) | Registered agent name on LiveKit Cloud |
| `LIVEKIT_URL` | `agent/.env` | LiveKit Cloud URL for the Python agent |
| `LIVEKIT_API_KEY` | `agent/.env` | LiveKit Cloud API key |
| `LIVEKIT_API_SECRET` | `agent/.env` | LiveKit Cloud API secret |
| `GOOGLE_API_KEY` | `agent/.env` | Google Gemini API key |

---

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- You are free to use, modify, and distribute this software.
- If you run a modified version as a service (e.g. a web app or API), you **must** publish the source code of your modifications under the same license.
- See [LICENSE](./LICENSE) for the full terms.

---

## 🙏 Acknowledgements

- [LiveKit](https://livekit.io/) — for the incredible open-source WebRTC infrastructure and Agents SDK.
- [Google DeepMind](https://deepmind.google/) — for the Gemini Live API enabling low-latency, native-audio AI conversations.
- [Appwrite](https://appwrite.io/) — for the open-source backend-as-a-service platform.
- [OpenStreetMap Contributors](https://www.openstreetmap.org/) — for the geospatial data powering the clinic locator.
- Every expectant mother in Nigeria who deserves better access to maternal healthcare information.

---

<p align="center">
  Built with ❤️ for mothers across Nigeria
</p>
