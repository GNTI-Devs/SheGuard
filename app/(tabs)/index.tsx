import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStorage, DailyCheckIn } from '@/services/storage';
import Voice from '@react-native-voice/voice';

const MOODS = [
  { id: 'great', emoji: '😊', label: 'Great' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'tired', emoji: '🥱', label: 'Tired' },
  { id: 'unwell', emoji: '🤢', label: 'Unwell' },
  { id: 'anxious', emoji: '🥺', label: 'Anxious' },
];

const SYMPTOMS = [
  { id: 'nausea', label: '🤢 Nausea / Vomiting', warning: false },
  { id: 'headache', label: '🤕 Severe Headache', warning: true },
  { id: 'swelling', label: '🦵 Swollen Face/Hands/Feet', warning: true },
  { id: 'vision', label: '👁️ Blurred Vision / Spots', warning: true },
  { id: 'cramps', label: '⚡ Severe Abdominal Pain', warning: true },
  { id: 'fatigue', label: '🥱 Extreme Fatigue', warning: false },
  { id: 'movement', label: '👶 Reduced Baby Movement', warning: true },
];

export default function HomeScreen() {
  const router = useRouter();
  const storage = useStorage();
  const { profile } = useUserProfile();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  // Check-in modal states
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [mood, setMood] = useState<'great' | 'good' | 'tired' | 'unwell' | 'anxious' | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Voice dictation states
  const [isListening, setIsListening] = useState(false);

  // Background Hospitals Pre-fetcher
  useEffect(() => {
    async function prefetchLocationAndHospitals() {
      try {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('[Hospitals Background] Location permission not granted.');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        console.log(`[Hospitals Background] Resolved coords: ${lat}, ${lng}. Caching...`);
        await AsyncStorage.setItem('cached_user_coords', JSON.stringify({ lat, lng }));

        const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:15000,${lat},${lng});node["amenity"="clinic"](around:15000,${lat},${lng}););out body;`;
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SheGuardAI/1.0 (maternal health companion; contact: support@sheguard.org)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const elements = data.elements || [];
        
        const list = elements.map((el: any) => {
          const name = el.tags.name || el.tags['name:en'] || 'Maternity Clinic / Hospital';
          const address = el.tags['addr:street'] 
            ? (el.tags['addr:street'] + (el.tags['addr:city'] ? ', ' + el.tags['addr:city'] : '')) 
            : (el.tags['addr:suburb'] || el.tags['addr:neighbourhood'] || 'Maternity facility nearby');
          const phone = el.tags.phone || el.tags['contact:phone'] || 'Emergency Dial';
          return {
            id: el.id.toString(),
            name,
            address,
            phone,
            lat: el.lat,
            lng: el.lon,
            maternityFeatures: el.tags.amenity === 'hospital' 
              ? ['General Emergency', 'Maternity Ward'] 
              : ['Outpatient Clinic', 'Prenatal Care']
          };
        });

        await AsyncStorage.setItem('cached_hospitals', JSON.stringify(list));
        console.log(`[Hospitals Background] Successfully pre-fetched and cached ${list.length} clinics.`);
      } catch (err) {
        console.warn('[Hospitals Background] Failed to prefetch:', err);
      }
    }

    prefetchLocationAndHospitals();
  }, []);

  // Voice recognition lifecycle setup
  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      console.warn('Voice recognition error:', e);
      setIsListening(false);
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setNotes((prev) => prev + (prev ? ' ' : '') + e.value![0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startSpeechToText = async () => {
    try {
      setIsListening(true);
      await Voice.start('en-US');
    } catch (e) {
      console.error('Failed to start Voice:', e);
      setIsListening(false);
    }
  };

  const stopSpeechToText = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error('Failed to stop Voice:', e);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      await stopSpeechToText();
    } else {
      await startSpeechToText();
    }
  };

  const name = profile?.name || 'Amina';
  const month = profile?.pregnancyMonth || 6;
  const currentWeek = month * 4;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleStartConversation = () => {
    router.push('/conversation');
  };

  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const hasDangerSigns = selectedSymptoms.some((sId) => {
    const matched = SYMPTOMS.find((s) => s.id === sId);
    return matched?.warning === true;
  });

  const handleSaveCheckIn = async () => {
    if (!mood) {
      Alert.alert('Mood required', 'Please select how you are feeling.');
      return;
    }

    try {
      setSaving(true);
      const logEntry: DailyCheckIn = {
        id: `checkin-${Date.now()}`,
        userId: profile?.id || 'demo-amina-123',
        timestamp: new Date().toISOString(),
        mood: mood,
        symptoms: selectedSymptoms,
        notes: notes.trim(),
      };

      await storage.saveDailyCheckIn(logEntry);

      // Alert danger triggers if critical symptoms are checked
      if (hasDangerSigns) {
        Alert.alert(
          '⚠️ Critical Warning',
          'You selected symptoms associated with preeclampsia danger signs (severe headache, face/feet swelling, blurred vision). We strongly advise joining an AI voice consultation or visiting the nearest hospital immediately.',
          [
            { text: 'Okay', style: 'default' },
            { text: 'Consult AI', style: 'default', onPress: handleStartConversation }
          ]
        );
      } else {
        Alert.alert('Check-in Saved', 'Your daily logs are registered in your health journal.');
      }

      // Reset
      setMood(null);
      setSelectedSymptoms([]);
      setNotes('');
      setIsCheckInOpen(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to register check-in.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingText, { color: activeColors.textMuted }]}>
              Welcome back,
            </Text>
            <Text style={[styles.nameText, { color: activeColors.text }]}>
              {name}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.notificationIcon,
              {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={activeColors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Pregnancy Tracker Card */}
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: activeColors.text }]}>
                Month {month} of Pregnancy
              </Text>
              <Text style={[styles.progressSubtitle, { color: activeColors.textMuted }]}>
                Approximately Week {currentWeek}
              </Text>
            </View>
            <Text style={styles.pregnancyEmoji}>👶</Text>
          </View>

          {/* Progress Bar */}
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: activeColors.border },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: activeColors.primary,
                  width: `${(month / 9) * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.progressFooter}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={activeColors.textMuted}
            />
            <Text style={[styles.dueDateText, { color: activeColors.textMuted }]}>
              Estimated Due Date:{' '}
              <Text style={{ fontWeight: '600', color: activeColors.text }}>
                {formatDate(profile?.dueDate || '')}
              </Text>
            </Text>
          </View>
        </View>

        {/* Daily Check-in Card */}
        <TouchableOpacity
          onPress={() => setIsCheckInOpen(true)}
          style={[
            styles.checkInCard,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.primary,
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.checkInContentRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.checkInTitle, { color: activeColors.primary }]}>
                How are you feeling today?
              </Text>
              <Text style={[styles.checkInSubtitle, { color: activeColors.textMuted }]}>
                Daily symptom log check-in • Tap to register notes and mood.
              </Text>
            </View>
            <View style={[styles.checkInIconCircle, { backgroundColor: activeColors.primary }]}>
              <Ionicons name="heart" size={22} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Voice Orb Area */}
        <View style={styles.orbSection}>
          <Text style={[styles.orbSectionTitle, { color: activeColors.text }]}>
            Talk to SheGuard AI
          </Text>
          <Text style={[styles.orbSectionDesc, { color: activeColors.textMuted }]}>
            Tap below to begin your real-time voice consultation
          </Text>

          <TouchableOpacity
            onPress={handleStartConversation}
            style={[
              styles.voiceOrb,
              {
                backgroundColor: activeColors.surface2,
                borderColor: activeColors.primary,
                shadowColor: activeColors.primary,
              },
            ]}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.voiceOrbInner,
                { backgroundColor: activeColors.primary },
              ]}
            >
              <Ionicons name="mic" size={44} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.tapToStart, { color: activeColors.primary }]}>
            TAP ORB TO START
          </Text>
        </View>

        {/* Quick Info Grid */}
        <View style={styles.grid}>
          {/* Today's Tip */}
          <View
            style={[
              styles.gridCard,
              {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={activeColors.primary}
              />
              <Text style={[styles.cardTitle, { color: activeColors.text }]}>
                Today's Tip
              </Text>
            </View>
            <Text style={[styles.cardContent, { color: activeColors.textMuted }]}>
              Drink at least 8-10 cups of clean water daily to stay hydrated and
              prevent infections.
            </Text>
          </View>

          {/* Next Visit */}
          <View
            style={[
              styles.gridCard,
              {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="medical-outline"
                size={20}
                color={activeColors.primary}
              />
              <Text style={[styles.cardTitle, { color: activeColors.text }]}>
                Antenatal Visit
              </Text>
            </View>
            <Text style={[styles.cardContent, { color: activeColors.textMuted }]}>
              Your next hospital check-up should be scheduled soon. Tap profile
              to configure reminders.
            </Text>
          </View>
        </View>

        {/* Emergency SOS Button */}
        <TouchableOpacity
          onPress={() => {
            router.push('/conversation?triggerEmergency=true');
          }}
          style={[
            styles.sosButton,
            { backgroundColor: activeColors.emergency },
          ]}
          activeOpacity={0.9}
        >
          <Ionicons
            name="warning"
            size={22}
            color="#FFFFFF"
            style={styles.sosIcon}
          />
          <Text style={styles.sosButtonText}>EMERGENCY SOS SHORTCUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Daily Check-in Modal Overlay */}
      <Modal
        visible={isCheckInOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCheckInOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: activeColors.surface, borderColor: activeColors.border },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: activeColors.primary }]}>
                Daily Health Check-in
              </Text>
              <TouchableOpacity onPress={() => setIsCheckInOpen(false)}>
                <Ionicons name="close" size={24} color={activeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              {/* Mood Selection */}
              <Text style={[styles.modalSectionLabel, { color: activeColors.text }]}>
                How is your mood?
              </Text>
              <View style={styles.moodRow}>
                {MOODS.map((m) => {
                  const isSel = mood === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setMood(m.id as any)}
                      style={[
                        styles.moodCell,
                        {
                          backgroundColor: isSel ? activeColors.primary + '15' : activeColors.surface2,
                          borderColor: isSel ? activeColors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text
                        style={[
                          styles.moodLabel,
                          { color: isSel ? activeColors.primary : activeColors.text },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Symptoms Checklist */}
              <Text style={[styles.modalSectionLabel, { color: activeColors.text }]}>
                Select symptoms (if any):
              </Text>
              <View style={styles.symptomsContainer}>
                {SYMPTOMS.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym.id);
                  return (
                    <TouchableOpacity
                      key={sym.id}
                      onPress={() => toggleSymptom(sym.id)}
                      style={[
                        styles.symptomRow,
                        {
                          backgroundColor: isChecked ? activeColors.surface2 : 'transparent',
                          borderColor: isChecked ? activeColors.primary : activeColors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.symptomLabel, { color: activeColors.text }]}>
                        {sym.label}
                      </Text>
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isChecked ? activeColors.primary : activeColors.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Danger Warning Alert Badge */}
              {hasDangerSigns && (
                <View
                  style={[
                    styles.dangerBadge,
                    { backgroundColor: activeColors.emergency + '15', borderColor: activeColors.emergency },
                  ]}
                >
                  <Ionicons name="warning" size={20} color={activeColors.emergency} />
                  <Text style={[styles.dangerBadgeText, { color: activeColors.emergency }]}>
                    Warning: Some selected symptoms are preeclampsia danger signs. We strongly advise speaking to SheGuard AI or visiting a health center immediately.
                  </Text>
                </View>
              )}

              {/* Notes with Voice Dictation */}
              <View style={styles.notesHeaderRow}>
                <Text style={[styles.modalSectionLabel, { color: activeColors.text }]}>
                  Notes / How you feel:
                </Text>
                <TouchableOpacity
                  onPress={toggleListening}
                  style={[
                    styles.voiceInputBtn,
                    {
                      backgroundColor: isListening ? activeColors.emergency : activeColors.primary + '15',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isListening ? 'mic' : 'mic-outline'}
                    size={16}
                    color={isListening ? '#FFFFFF' : activeColors.primary}
                  />
                  <Text
                    style={[
                      styles.voiceInputBtnText,
                      { color: isListening ? '#FFFFFF' : activeColors.primary },
                    ]}
                  >
                    {isListening ? 'Listening...' : 'Speak to write'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.notesInput,
                  {
                    color: activeColors.text,
                    borderColor: activeColors.border,
                    backgroundColor: activeColors.surface2,
                  },
                ]}
                placeholder="Enter custom symptoms or notes here..."
                placeholderTextColor={activeColors.textMuted}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveCheckIn}
                style={[styles.saveBtn, { backgroundColor: activeColors.primary }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Check-in</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  pregnancyEmoji: {
    fontSize: 32,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueDateText: {
    fontSize: 12,
  },
  checkInCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 28,
  },
  checkInContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  checkInSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkInIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  orbSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  orbSectionDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  voiceOrb: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  voiceOrbInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToStart: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  gridCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContent: {
    fontSize: 12,
    lineHeight: 16,
  },
  sosButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  sosIcon: {
    marginRight: 8,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  modalSectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 24,
  },
  moodCell: {
    flex: 1,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  symptomsContainer: {
    gap: 8,
    marginBottom: 20,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  symptomLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dangerBadge: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  dangerBadgeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  notesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  voiceInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  voiceInputBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  notesInput: {
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 28,
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
