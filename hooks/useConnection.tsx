import {
  TokenSource,
  TokenSourceResponseObject,
  RoomEvent,
  ConnectionState,
} from 'livekit-client';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { SessionProvider, useSession } from '@livekit/components-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, Functions } from 'react-native-appwrite';
import { useStorage } from '@/services/storage';

// Initialize the Appwrite Client and Functions SDK
const appwriteClient = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68b412c200088ae94f6a');

const appwriteFunctions = new Functions(appwriteClient);

// Read from Expo environment variables with fallback defaults for production release builds
const sandboxID = process.env.EXPO_PUBLIC_LIVEKIT_SANDBOX_ID || '';
const agentName = process.env.EXPO_PUBLIC_LIVEKIT_AGENT_NAME || 'sheguard-ai';
const hardcodedUrl =
  process.env.EXPO_PUBLIC_LIVEKIT_URL ||
  'wss://novasync-novasync-9ozn4l47.livekit.cloud';
const hardcodedToken = process.env.EXPO_PUBLIC_LIVEKIT_TOKEN || '';

interface ConnectionContextType {
  isConnectionActive: boolean;
  emergencyMode: boolean;
  setEmergencyMode: (val: boolean) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  room: any;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnectionActive: false,
  emergencyMode: false,
  setEmergencyMode: () => {},
  connect: async () => {},
  disconnect: () => {},
  room: null,
});

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return ctx;
}

interface ConnectionProviderProps {
  children: React.ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const storage = useStorage();
  const [isConnectionActive, setIsConnectionActive] = useState(false);
  const [activeToken, setActiveToken] = useState(hardcodedToken);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // Guards to prevent double-starts and unintended restarts
  const hasStartedRef = useRef(false);
  const isDisconnectingRef = useRef(false);

  const tokenSource = useMemo(() => {
    if (sandboxID) {
      return TokenSource.sandboxTokenServer(sandboxID);
    } else {
      return TokenSource.literal({
        serverUrl: hardcodedUrl,
        participantToken: activeToken,
      } satisfies TokenSourceResponseObject);
    }
  }, [activeToken]);
  // NOTE: sandboxID and hardcodedUrl are module-level constants — no need as deps

  const session = useSession(
    tokenSource,
    agentName ? { agentName } : undefined
  );

  const { start: startSession, end: endSession } = session;

  // ─── Start session ONCE per connect() call ───────────────────────────────
  // We use a ref flag instead of watching session.room (which changes reference
  // constantly and caused a re-start loop: room connects → ref changes → effect
  // re-fires → room disconnects → CLIENT_INITIATED disconnect → stuck forever).
  useEffect(() => {
    if (
      isConnectionActive &&
      activeToken &&
      !hasStartedRef.current &&
      !isDisconnectingRef.current
    ) {
      hasStartedRef.current = true;
      console.log(
        'Starting LiveKit session with token:',
        activeToken.substring(0, 15) + '...'
      );
      startSession();
    }
  }, [isConnectionActive, activeToken, startSession]);

  // ─── Listen to room events ────────────────────────────────────────────────
  useEffect(() => {
    const room = session.room;
    if (!room) return;

    const onAttributesChanged = (changedAttributes: Record<string, string>) => {
      if (changedAttributes.emergency_level === 'red') {
        setEmergencyMode(true);
      }

      if (changedAttributes.log_symptoms) {
        (async () => {
          try {
            const list = JSON.parse(changedAttributes.log_symptoms);
            const profile = await storage.getProfile();
            await storage.saveDailyCheckIn({
              id: `checkin-ai-${Date.now()}`,
              userId: profile?.id || 'demo-amina-123',
              timestamp: new Date().toISOString(),
              mood: 'good',
              symptoms: list,
              notes:
                'Logged automatically by SheGuard AI during voice consultation.',
            });
            console.log('[useConnection] Automatically logged symptoms:', list);
          } catch (e) {
            console.warn('[useConnection] Failed to auto-save check-in:', e);
          }
        })();
      }

      if (changedAttributes.new_appointment) {
        (async () => {
          try {
            const appt = JSON.parse(changedAttributes.new_appointment);
            await storage.saveAppointment({
              id: `appt-ai-${Date.now()}`,
              title: appt.title,
              datetime: appt.datetime,
              completed: false,
            });
            console.log(
              '[useConnection] Automatically scheduled appointment:',
              appt
            );
          } catch (e) {
            console.warn('[useConnection] Failed to auto-save appointment:', e);
          }
        })();
      }
    };

    const onConnected = () => {
      (async () => {
        try {
          const storedLang = (await AsyncStorage.getItem('language')) || 'en';
          const permissions = room.localParticipant.permissions;
          if (permissions && permissions.canUpdateMetadata) {
            await room.localParticipant.setAttributes({ language: storedLang });
            console.log('Set participant language attribute:', storedLang);
          } else {
            console.log(
              'Skipped setting language attribute (no permission). Relying on token metadata.'
            );
          }
        } catch (err) {
          console.warn('Failed to set language attribute:', err);
        }
      })();
    };

    room.on(RoomEvent.ParticipantAttributesChanged, onAttributesChanged);
    room.on(RoomEvent.Connected, onConnected);

    // If already connected when this effect runs, fire immediately
    if (room.state === ConnectionState.Connected) {
      onConnected();
    }

    return () => {
      room.off(RoomEvent.ParticipantAttributesChanged, onAttributesChanged);
      room.off(RoomEvent.Connected, onConnected);
    };
  }, [session.room]);

  // ─── connect() ────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    // Guard: don't start if already starting / connected
    if (hasStartedRef.current || isConnectionActive) {
      console.log(
        '[useConnection] connect() called but already active — ignoring.'
      );
      return;
    }

    isDisconnectingRef.current = false;
    setEmergencyMode(false);
    setIsConnectionActive(true);
    setIsLoadingToken(true);

    try {
      let tokenToUse = hardcodedToken;

      // Fetch from Appwrite function only when no hardcoded token and no sandbox
      if (!tokenToUse && !sandboxID) {
        console.log('Fetching dynamic LiveKit token from Appwrite function...');
        const storedProfileRaw = await AsyncStorage.getItem('profile');
        let identity = 'anonymous-user';
        let language = 'en';

        if (storedProfileRaw) {
          try {
            const profile = JSON.parse(storedProfileRaw);
            if (profile?.name) {
              identity =
                profile.name.toLowerCase().replace(/[^a-z0-9]/g, '-') +
                '-' +
                Math.floor(Math.random() * 1000);
            }
            if (profile?.language) {
              language = profile.language;
            }
          } catch (err) {
            console.warn('Failed to parse profile for token request:', err);
          }
        }

        const response = await appwriteFunctions.createExecution(
          'generate-livekit-token',
          JSON.stringify({ room: 'sheguard-room', identity, language })
        );

        const body = JSON.parse(response.responseBody || '{}');
        tokenToUse = body.token;
        if (!tokenToUse) {
          throw new Error(
            body.error || 'Failed to get token from Appwrite function'
          );
        }
        console.log('LiveKit token retrieved from Appwrite successfully.');
      }

      setActiveToken(tokenToUse);
      // hasStartedRef will be set true in the next useEffect run
    } catch (err) {
      console.error('Failed to get token or connect:', err);
      hasStartedRef.current = false;
      setIsConnectionActive(false);
    } finally {
      setIsLoadingToken(false);
    }
  }, []);
  // NOTE: hardcodedToken and sandboxID are module-level constants — safe to omit

  // ─── disconnect() ─────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    isDisconnectingRef.current = true;
    hasStartedRef.current = false;
    setIsConnectionActive(false);
    setEmergencyMode(false);
    // Reset token back to hardcoded (or empty) WITHOUT triggering a startSession
    setActiveToken(hardcodedToken);
    endSession();
  }, [endSession]);

  const value = useMemo(
    () => ({
      isConnectionActive: isConnectionActive || isLoadingToken,
      emergencyMode,
      setEmergencyMode,
      connect,
      disconnect,
      room: session.room,
    }),
    [
      isConnectionActive,
      isLoadingToken,
      emergencyMode,
      connect,
      disconnect,
      session.room,
    ]
  );

  return (
    <SessionProvider session={session}>
      <ConnectionContext.Provider value={value}>
        {children}
      </ConnectionContext.Provider>
    </SessionProvider>
  );
}
