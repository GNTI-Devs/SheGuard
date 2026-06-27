import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useAgent,
  useSessionMessages,
  useTrackToggle,
  TrackReference,
} from '@livekit/components-react';
import {
  AudioSession,
  useIOSAudioManagement,
  useLocalParticipant,
  BarVisualizer,
  VideoTrack,
  useRoomContext,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useConnection } from '@/hooks/useConnection';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

import { RoomContext } from '@livekit/react-native';

export default function ConversationScreen() {
  const router = useRouter();
  const { triggerEmergency } = useLocalSearchParams<{
    triggerEmergency?: string;
  }>();
  const connection = useConnection();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  // Track connection failure state
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [failReason, setFailReason] = useState('');
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const room = connection.room;
  const [roomState, setRoomState] = useState(room?.state || 'disconnected');
  const roomStateRef = useRef(roomState);

  // Sync ref to prevent stale closure issues in useEffect timeout callbacks
  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  // Track room connection state changes dynamically
  useEffect(() => {
    if (!room) {
      setRoomState('disconnected');
      return;
    }

    const handleStateChange = (state: string) => {
      console.log('[Conversation] Room state changed to:', state);
      setRoomState(state);
    };

    room.on('connectionStateChanged', handleStateChange);
    setRoomState(room.state);

    return () => {
      room.off('connectionStateChanged', handleStateChange);
    };
  }, [room]);

  // Manage hardware Audio Session lifecycle and connection
  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        await AudioSession.startAudioSession();
      } catch (e) {
        console.error('Failed to start audio session:', e);
      }
    }
    start();

    if (triggerEmergency === 'true') {
      connection.setEmergencyMode(true);
    } else {
      connection.connect();
    }

    // 30-second hard timeout: if room never reaches 'connected', show retry
    connectTimeoutRef.current = setTimeout(() => {
      if (!cancelled && (!room || roomStateRef.current !== 'connected')) {
        setConnectionFailed(true);
        setFailReason('Connection timed out. The assistant could not be reached.');
      }
    }, 30000);

    return () => {
      cancelled = true;
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      AudioSession.stopAudioSession();
    };
  }, []);

  // Watch for unexpected room disconnections after it was once connected
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (!room) return;
    if (room.state === 'connected') {
      wasConnectedRef.current = true;
      // Clear timeout once we're actually connected
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
    } else if (room.state === 'disconnected' && wasConnectedRef.current) {
      // Dropped after being connected — show retry rather than stuck spinner
      setConnectionFailed(true);
      setFailReason('The session ended unexpectedly. Please try again.');
    }
  }, [room?.state]);

  const handleCancelConnection = () => {
    connection.disconnect();
    router.back();
  };

  const handleRetry = () => {
    wasConnectedRef.current = false;
    setConnectionFailed(false);
    setFailReason('');
    connection.disconnect();
    setTimeout(() => {
      connection.connect();
      // Restart timeout
      connectTimeoutRef.current = setTimeout(() => {
        if (!room || room.state !== 'connected') {
          setConnectionFailed(true);
          setFailReason('Connection timed out. Check your network and try again.');
        }
      }, 30000);
    }, 500);
  };

  // ── Failed / timed-out state ──
  if (connectionFailed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
        <View style={styles.workspace}>
          <View style={styles.voiceWorkspace}>
            <View style={[styles.visualizerCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
              <Ionicons name="wifi-outline" size={48} color={activeColors.textMuted} />
            </View>
            <Text style={[styles.instructionText, { color: activeColors.text, fontWeight: '600', fontSize: 16 }]}>
              Could not connect
            </Text>
            <Text style={[styles.instructionText, { color: activeColors.textMuted, marginTop: 8 }]}>
              {failReason}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={[styles.retryButton, { backgroundColor: activeColors.primary, marginTop: 24 }]}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.controlsBar, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <TouchableOpacity
            onPress={handleCancelConnection}
            style={[styles.hangupButton, { backgroundColor: activeColors.emergency, alignSelf: 'center' }]}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Connecting / waiting state ──
  if (!room || roomState !== 'connected') {
    const statusMsg = connection.emergencyMode ? '⚠️ PREECLAMPSIA ALERT!' : 'Connecting...';
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
        <View style={styles.topBar}>
          <Text style={[styles.statusText, { color: connection.emergencyMode ? activeColors.emergency : activeColors.text }]}>
            {statusMsg}
          </Text>
        </View>
        <View style={styles.workspace}>
          <View style={styles.voiceWorkspace}>
            <View style={[styles.visualizerCard, { backgroundColor: activeColors.surface, borderColor: connection.emergencyMode ? activeColors.emergency : activeColors.border }]}>
              <ActivityIndicator size="large" color={connection.emergencyMode ? '#FFFFFF' : activeColors.primary} />
            </View>
            <Text style={[styles.instructionText, { color: activeColors.textMuted }]}>
              Starting your session...
            </Text>
          </View>
        </View>
        <View style={[styles.controlsBar, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <TouchableOpacity
            onPress={handleCancelConnection}
            style={[styles.hangupButton, { backgroundColor: activeColors.emergency, alignSelf: 'center' }]}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RoomContext.Provider value={room}>
      <ConversationRoomContent room={room} />
    </RoomContext.Provider>
  );
}

function ConversationRoomContent({ room }: { room: any }) {
  const router = useRouter();
  const connection = useConnection();
  const { profile } = useUserProfile();
  const { addConversation } = useConversationHistory();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  useIOSAudioManagement(room, true);

  const { state: agentState, microphoneTrack, cameraTrack } = useAgent();
  const { messages } = useSessionMessages();
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const micToggle = useTrackToggle({ source: Track.Source.Microphone });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sessionStartTime] = useState(new Date().toISOString());
  const [barWidth, setBarWidth] = useState(0);
  const [barBorderRadius, setBarBorderRadius] = useState(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // Set up animations depending on agent state
  useEffect(() => {
    // Pulse animation for idle & speaking
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: agentState === 'speaking' ? 600 : 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: agentState === 'speaking' ? 600 : 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Rotation animation for thinking
    if (agentState === 'connecting' || agentState === 'thinking') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }

    // Ripple animation for listening
    if (agentState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rippleAnim.setValue(0);
    }
  }, [agentState]);

  // Log conversation to history on End Call
  const handleEndCall = async () => {
    try {
      if (messages.length > 0) {
        const formattedMessages = messages.map((m) => ({
          role:
            m.from === localParticipant
              ? ('user' as const)
              : ('agent' as const),
          text: m.message,
          timestamp: new Date(m.timestamp).toISOString(),
        }));

        await addConversation({
          id: `conv-${Date.now()}`,
          roomName: `sheguard-room-${Date.now()}`,
          startedAt: sessionStartTime,
          endedAt: new Date().toISOString(),
          messages: formattedMessages,
          hadEmergency: connection.emergencyMode,
        });
      }
    } catch (e) {
      console.error('Failed to log conversation details:', e);
    } finally {
      connection.disconnect();
      router.back();
    }
  };

  const handleCallHospital = () => {
    const phone = profile?.emergencyContacts?.[0] || '112';
    Linking.openURL(`tel:${phone}`);
  };

  const handleNotifyCaregiver = () => {
    const phone = profile?.emergencyContacts?.[1] || '+2348012345678';
    Linking.openURL(
      `sms:${phone}?body=SheGuard AI emergency warning: Please check on me, a danger sign was detected.`
    );
  };

  const getStatusMessage = () => {
    if (connection.emergencyMode) return '⚠️ PREECLAMPSIA ALERT!';
    switch (agentState) {
      case 'connecting':
        return 'Connecting to SheGuard...';
      case 'listening':
        return 'Listening to you...';
      case 'speaking':
        return 'SheGuard is speaking...';
      case 'thinking':
        return 'Analyzing symptoms...';
      default:
        return 'Ready to talk';
    }
  };

  // Spinner rotation mapping
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Ripple scaling mapping
  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });
  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.6, 0.4, 0],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text
          style={[
            styles.statusText,
            {
              color: connection.emergencyMode
                ? activeColors.emergency
                : activeColors.text,
            },
          ]}
        >
          {getStatusMessage()}
        </Text>

        <TouchableOpacity
          onPress={() => setIsChatOpen(!isChatOpen)}
          style={[
            styles.topIcon,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
        >
          <Ionicons
            name={isChatOpen ? 'mic' : 'chatbox-ellipses-outline'}
            size={20}
            color={activeColors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Main Workspace Area */}
      <View style={styles.workspace}>
        {!isChatOpen ? (
          /* Voice Assistant Visualizer Workspace */
          <View style={styles.voiceWorkspace}>
            <View
              style={[
                styles.visualizerCard,
                {
                  backgroundColor: activeColors.surface,
                  borderColor: connection.emergencyMode
                    ? activeColors.emergency
                    : activeColors.border,
                },
              ]}
            >
              <View
                style={styles.visualizerWrapper}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setBarWidth(0.25 * height);
                  setBarBorderRadius(0.25 * height);
                }}
              >
                {room && room.state === 'connected' ? (
                  <BarVisualizer
                    state={agentState}
                    barCount={5}
                    options={{
                      minHeight: 0.2,
                      barWidth: barWidth,
                      barColor: connection.emergencyMode
                        ? '#FFFFFF'
                        : activeColors.primary,
                      barBorderRadius: barBorderRadius,
                    }}
                    trackRef={microphoneTrack}
                    style={styles.visualizer}
                  />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={connection.emergencyMode ? '#FFFFFF' : activeColors.primary} />
                  </View>
                )}
              </View>

              {cameraTrack && (
                <View style={styles.videoOverlay}>
                  <VideoTrack
                    trackRef={cameraTrack}
                    style={styles.videoOverlayTrack}
                  />
                </View>
              )}
            </View>

            <Text
              style={[
                styles.instructionText,
                { color: activeColors.textMuted },
              ]}
            >
              {agentState === 'listening'
                ? 'Speak now, SheGuard is listening.'
                : agentState === 'speaking'
                ? 'SheGuard is speaking. You can interrupt anytime.'
                : 'Patience... SheGuard is processing.'}
            </Text>
          </View>
        ) : (
          /* Text Chat Drawer Workspace */
          <View
            style={[
              styles.chatWorkspace,
              {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
              },
            ]}
          >
            <View style={styles.chatHeader}>
              <Text style={[styles.chatTitle, { color: activeColors.text }]}>
                Live Captions / Transcript
              </Text>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={activeColors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.chatScroll}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <Text
                  style={[
                    styles.emptyChatText,
                    { color: activeColors.textMuted },
                  ]}
                >
                  Speak to SheGuard to see the text transcript log dynamically.
                </Text>
              ) : (
                messages.map((m, index) => {
                  const isAgent = m.from !== localParticipant;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.chatBubble,
                        {
                          alignSelf: isAgent ? 'flex-start' : 'flex-end',
                          backgroundColor: isAgent
                            ? activeColors.surface2
                            : activeColors.primary,
                          borderTopLeftRadius: isAgent ? 2 : 12,
                          borderTopRightRadius: isAgent ? 12 : 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chatBubbleText,
                          { color: isAgent ? activeColors.text : '#FFFFFF' },
                        ]}
                      >
                        {m.message}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Control Buttons Capsule */}
      <View
        style={[
          styles.controlsBar,
          {
            backgroundColor: activeColors.surface,
            borderColor: activeColors.border,
          },
        ]}
      >
        {/* Mute/Unmute */}
        <TouchableOpacity
          onPress={() => micToggle.toggle()}
          style={[
            styles.iconButton,
            {
              backgroundColor: isMicrophoneEnabled
                ? activeColors.surface2
                : activeColors.primaryMuted,
            },
          ]}
        >
          <Ionicons
            name={isMicrophoneEnabled ? 'mic' : 'mic-off'}
            size={22}
            color={isMicrophoneEnabled ? activeColors.primary : '#FFFFFF'}
          />
        </TouchableOpacity>

        {/* SOS Manual trigger */}
        <TouchableOpacity
          onPress={() => connection.setEmergencyMode(true)}
          style={[
            styles.iconButton,
            { backgroundColor: activeColors.surface2 },
          ]}
        >
          <Ionicons name="warning" size={22} color={activeColors.emergency} />
        </TouchableOpacity>

        {/* End Call / Hangup */}
        <TouchableOpacity
          onPress={handleEndCall}
          style={[
            styles.hangupButton,
            { backgroundColor: activeColors.emergency },
          ]}
        >
          <Ionicons
            name="call"
            size={24}
            color="#FFFFFF"
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {/* Emergency Overlay */}
      {connection.emergencyMode && (
        <View style={styles.emergencyOverlay}>
          <SafeAreaView style={styles.overlaySafe}>
            <View style={styles.overlayHeader}>
              <View style={styles.warningAlertIconContainer}>
                <Ionicons name="warning" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.overlayTitle}>Danger Sign Detected</Text>
              <Text style={styles.overlayDesc}>
                SheGuard has detected symptoms requiring medical attention.
                Please act immediately to protect you and your baby.
              </Text>
            </View>

            <View style={styles.overlayActions}>
              <TouchableOpacity
                onPress={handleCallHospital}
                style={[styles.actionBtn, { backgroundColor: '#FFFFFF' }]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="call"
                  size={22}
                  color={activeColors.emergency}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: activeColors.emergency },
                  ]}
                >
                  Call Doctor / Hospital
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNotifyCaregiver}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbox" size={22} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                  Alert Support Caregiver
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  alert(
                    'Emergency advice: Danger signs in the 3rd trimester include bleeding, severe headache with blurred vision, convulsions, and severe belly pain. Seek nearest healthcare clinic.'
                  );
                }}
                style={[styles.actionBtnTextOnly]}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnTextOnlyLabel}>
                  Read Warning Sign Advice
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => connection.setEmergencyMode(false)}
                style={styles.dismissBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.dismissBtnText}>Dismiss / I am safe</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  topIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspace: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  voiceWorkspace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  visualizerCard: {
    width: '100%',
    height: '60%',
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 32,
  },
  visualizerWrapper: {
    width: '100%',
    height: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  visualizer: {
    width: '90%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  videoOverlayTrack: {
    width: '100%',
    height: '100%',
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  chatWorkspace: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: '90%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 10,
    marginBottom: 12,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  chatScroll: {
    flexGrow: 1,
    gap: 12,
  },
  emptyChatText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  chatBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    maxWidth: '85%',
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 18,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginHorizontal: 24,
    marginBottom: 20,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C0392B', // Heavy crimson red
    zIndex: 10,
  },
  overlaySafe: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  overlayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 16,
  },
  warningAlertIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  overlayDesc: {
    color: '#F4EFEB',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  overlayActions: {
    gap: 14,
    width: '100%',
    paddingBottom: 20,
  },
  actionBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBtnTextOnly: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  actionBtnTextOnlyLabel: {
    color: '#F4EFEB',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  dismissBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dismissBtnText: {
    color: '#F4EFEB',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
