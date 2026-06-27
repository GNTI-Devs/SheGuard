# React Native Voice Assistant Overview

## Overview

This is a React Native mobile application built with Expo, integrated with LiveKit's Real-Time SDK and Agents framework. It provides a real-time conversational voice and video interface to interact with an AI agent. The app supports audio streams, video feeds (camera and screen sharing), and text transcription message logs.

## Goals

1. Establish a low-latency WebRTC connection to a LiveKit agent.
2. Provide visual feedback during the conversation (mic activity, voice waveform visualizer, and connection status).
3. Deliver a fallback text communication interface (chat transcriptions and manual text messaging).
4. Maintain performance and responsiveness across both iOS and Android platforms.

## Core User Flow

1. **Launch**: User launches the app and sees the "Start Voice Assistant" welcome screen.
2. **Connect**: User taps the button, triggering connection details retrieval and initializing a LiveKit audio/video room.
3. **Conversing**: The app navigates to the Assistant screen, starting the audio session and rendering the Agent voice visualization.
4. **Interactions**:
   - User speaks to the agent, seeing their local mic visualizer and the agent's voice visualizer respond.
   - User toggles the local camera or screen share to share their video feed.
   - User opens the chat drawer to view transcriptions or send manual text messages.
5. **Disconnect**: User taps the exit/hang-up button to close the session and return to the start screen.

## Features

### Voice / Audio Interface
- Real-time full-duplex voice communication with LiveKit agents.
- Local microphone status toggles and visual volume feedback.
- Real-time agent microphone visualizer (`BarVisualizer`).

### Video feeds
- Toggle camera to stream local video to the agent.
- Toggle screen share to stream mobile screen.
- Layout adjusting dynamically depending on active video streams.

### Text Chat & Transcriptions
- Interactive chat panel showing real-time transcription history of the session.
- TextInput field to send messages directly to the Agent session.

## Scope

### In Scope
- WebRTC voice connection using the `@livekit/react-native` and `@livekit/components-react` packages.
- Layout transitions (collapsed/expanded views) when text chat or camera feeds are active.
- Android and iOS platform optimization (Expo dev client, native modules setup).

### Out of Scope
- Custom token generation backend (relies on sandbox token server or pre-generated manual tokens for local testing).
- Persistent conversation database storage (history is session-only).
