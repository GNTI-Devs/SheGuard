# SheGuard AI

**A Multilingual Voice-First Maternal Health Companion for Expectant Mothers**

SheGuard AI is an offline-capable mobile health companion and real-time voice assistant built on Expo (React Native), LiveKit Cloud, and Appwrite Cloud. It is designed specifically to support expectant mothers in Nigeria (particularly in underserved regions) by offering early danger sign detection (including preeclampsia) and trimester-appropriate prenatal guidelines.

---

## 🛠️ Complete Tech Stack

SheGuard AI is architected across three primary layers: the Mobile Client, the Serverless Backend, and the Cloud AI Agent Worker.

### 1. Mobile Client (Frontend)
* **Framework**: [Expo SDK 54](https://expo.dev/) running [React Native](https://reactnative.dev/) with [Expo Router v4](https://docs.expo.dev/router/introduction/) (file-based navigation stack).
* **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type-safety configurations).
* **Real-Time Communication (WebRTC)**: 
  * [`@livekit/react-native`](https://github.com/livekit/client-sdk-react-native) & [`@livekit/components-react`](https://github.com/livekit/components-js) for handling full-duplex WebRTC audio connection, mic track controls, and data channels.
  * Native WebRTC libraries managed via `@config-plugins/react-native-webrtc`.
* **Speech Recognition**: [`@react-native-voice/voice`](https://github.com/react-native-voice/voice) for on-device, offline-capable speech-to-text dictation.
* **Geolocation & Mapping**:
  * [`expo-location`](https://docs.expo.dev/versions/latest/sdk/location/) for querying native device coordinates.
  * [`react-native-webview`](https://github.com/react-native-webview/react-native-webview) rendering a MapLibre GL instance with CARTO Dark Matter vector tile layers for real-time maternal clinic plotting.
* **Local Caching & Persistence**: [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage) for offline-first journal logs and location cache buffers.
* **Animations**: `react-native-reanimated` for layouts and recording voice pulse micro-animations.

### 2. Serverless Backend (Cloud Sync & Auth)
* **Cloud Platform**: [Appwrite Cloud](https://appwrite.io/) (API Endpoint: `https://fra.cloud.appwrite.io/v1`).
* **Database (Appwrite Database)**: Multi-collection sync (`profiles`, `conversations`, `appointments`, `keyvalue`) mapped dynamically with local cache fallbacks.
* **Auth & Session Security**: Appwrite Account session management.
* **Serverless Functions**: 
  * Node.js 22 runtime serverless function (`generate-livekit-token`) packaged with `livekit-server-sdk` using `bun`.
  * Generates short-lived WebRTC tokens dynamically on mobile client demand, injecting metadata parameters (preferred languages) securely.

### 3. Cloud AI Agent (Real-Time Brain)
* **Framework**: [LiveKit Agents SDK](https://github.com/livekit/agents) (Python worker running on Python 3.11-slim container base).
* **Large Language Model (LLM)**: [Gemini Live API](https://ai.google.dev/) (`gemini-2.5-flash-native-audio-preview-12-2025` native WebRTC model).
* **LLM Engine Plugins**: `livekit-plugins-google` and `google-genai`.
* **LLM Grounding Tools**: Integrated Google Search and Google Maps API tools to support real-time clinical and location-based grounding.
* **Custom Agent Tools**:
  * `log_symptoms(symptoms: list)`: AI logs client symptoms directly into the session attributes.
  * `schedule_appointment(title: str, datetime_str: str)`: AI registers upcoming clinic visits.

---

## 🚀 Key Features

* **Multilingual AI Voice Consultations**: Talk naturally to SheGuard in **English, Nigerian Pidgin English, Yoruba, Hausa, or Igbo**.
* **Daily Symptom logs**: Track moods and log physical symptoms. Integrated offline voice dictation makes input simple and accessible.
* **Preeclampsia Risk Warnings**: Automatically raises prominent safety alerts if warning signs (blurred vision, severe headaches, or face/feet swelling) are checked.
* **Unified Health Journal**: Merges offline daily check-in logs and LiveKit call transcripts chronologically.
* **Month Accordions (Timeline)**: Restructures pregnancy guidelines strictly into **9 Expandable Month Accordions** (Weeks 1 to 40+) with built-in voice readers.
* **Maternity Clinic Geocoding**: Plots nearby medical facilities dynamically within a 15km radius using Overpass OpenStreetMap interpretations.

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root:

```env
# LiveKit Cloud Connection URL
EXPO_PUBLIC_LIVEKIT_URL="wss://your-project-subdomain.livekit.cloud"

# (Optional) Static connection token for local testing. Leave empty in production to use dynamic Appwrite tokens.
EXPO_PUBLIC_LIVEKIT_TOKEN=""

# Agent name designation
EXPO_PUBLIC_LIVEKIT_AGENT_NAME="sheguard-ai"
```

Configure agent credentials inside `agent/.env` (used during local testing/creation):

```env
LIVEKIT_URL=wss://your-project-subdomain.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
GOOGLE_API_KEY=your-gemini-api-key
```

---

## 📦 Appwrite Database Schema

Set up the following collections in Database `sheguard`:

### 1. Collection `profiles`
* **Collection ID**: `profiles`
* Attributes: `user_id` (string), `display_name` (string), `language` (string), `pregnancy_month` (integer), `due_date` (string), `is_demo` (boolean), `emergency_contacts` (string, array), `created_at` (string).

### 2. Collection `conversations`
* **Collection ID**: `conversations`
* Attributes: `conversation_id` (string), `user_id` (string), `room_name` (string), `started_at` (string), `ended_at` (string), `had_emergency` (boolean), `messages_json` (string, LongText).

### 3. Collection `appointments`
* **Collection ID**: `appointments`
* Attributes: `appointment_id` (string), `user_id` (string), `title` (string), `datetime` (string), `location` (string), `completed` (boolean).

---

## 🌐 LiveKit Cloud Agent Deployment

SheGuard agent runs on LiveKit Cloud Managed Agents hosting. To build and deploy new code versions directly to the cloud:

```bash
cd agent
# Register and deploy the agent configuration to LiveKit Cloud (silently/non-interactively)
lk agent create --region us-east --secrets-file .env --silent .
```

This generates/updates the [livekit.toml](file:///home/zeez/gitcloned/agent-starter-react-native/agent/livekit.toml) configuration file and uploads the project container.

---

## 📱 Compiling Standalone Android Builds

### Development Build (Requires Metro Bundler)
```bash
bun install
npx expo run:android
```

### Production Release APK (Standalone Offline Bundle)
To generate the production APK that connects directly to Appwrite Cloud and LiveKit Cloud (without Metro dependencies):
```bash
cd android
./gradlew assembleRelease
```
The output standalone binary is built at:  
`android/app/build/outputs/apk/release/app-release-unsigned.apk` (or signed path).
