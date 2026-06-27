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
  Animated,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useThemeContext } from '@/hooks/useThemeContext';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStorage, DailyCheckIn } from '@/services/storage';
import Voice from '@react-native-voice/voice';
import { useCustomAlert } from '@/components/CustomAlert';
import { TIPS } from './tips';

const MOODS = [
  { id: 'great', emoji: '😊', label: 'Great' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'tired', emoji: '🥱', label: 'Tired' },
  { id: 'unwell', emoji: '🤢', label: 'Unwell' },
  { id: 'anxious', emoji: '🥺', label: 'Anxious' },
];

// Symptom categories
const SYMPTOM_SECTIONS = [
  {
    section: '⚠️ Danger Signs — Seek Help Now',
    isDanger: true,
    symptoms: [
      { id: 'headache', label: '🤕 Severe or Persistent Headache', warning: true },
      { id: 'swelling', label: '🦵 Sudden Swelling: Face, Hands or Feet', warning: true },
      { id: 'vision', label: '👁️ Blurred Vision or Seeing Spots', warning: true },
      { id: 'cramps', label: '⚡ Severe Abdominal Pain or Cramps', warning: true },
      { id: 'movement', label: '👶 Reduced or No Baby Movement (6+ hrs)', warning: true },
      { id: 'bleeding', label: '🩸 Vaginal Bleeding (any amount)', warning: true },
      { id: 'fever', label: '🌡️ High Fever (feels very hot, chills)', warning: true },
      { id: 'breathing', label: '🫁 Sudden Difficulty Breathing', warning: true },
      { id: 'contractions', label: '🔔 Regular Contractions Before Week 37', warning: true },
      { id: 'water', label: '💧 Water Breaking / Fluid Leaking', warning: true },
    ],
  },
  {
    section: '📋 Common Discomforts (Log These Too)',
    isDanger: false,
    symptoms: [
      { id: 'nausea', label: '🤢 Nausea or Vomiting', warning: false },
      { id: 'fatigue', label: '🥱 Extreme Tiredness / Fatigue', warning: false },
      { id: 'heartburn', label: '🔥 Heartburn or Indigestion', warning: false },
      { id: 'backpain', label: '🪑 Lower Back Pain', warning: false },
      { id: 'legcramps', label: '🦿 Leg Cramps', warning: false },
      { id: 'dizziness', label: '😵 Dizziness or Lightheadedness', warning: false },
      { id: 'constipation', label: '🚽 Constipation', warning: false },
      { id: 'itching', label: '🖐️ Itchy Skin (especially palms/feet)', warning: false },
      { id: 'anxiety', label: '🧠 Anxiety / Persistent Sadness / Feeling Low', warning: false },
      { id: 'insomnia', label: '🌙 Difficulty Sleeping', warning: false },
    ],
  },
];

// Flat list for backward compatibility
const SYMPTOMS = SYMPTOM_SECTIONS.flatMap((s) => s.symptoms);

export default function HomeScreen() {
  const router = useRouter();
  const storage = useStorage();
  const { profile } = useUserProfile();
  const { colorScheme } = useThemeContext();
  const activeColors = Colors[colorScheme];
  const { showAlert, AlertModal } = useCustomAlert();

  // Dynamically select a tip based on pregnancy month and current day of the month
  const monthVal = profile?.pregnancyMonth || 6;
  const monthTips = TIPS.filter((t) => t.month === monthVal);
  const availableTips = monthTips.length > 0 ? monthTips : TIPS;
  const dateDay = new Date().getDate();
  const dailyTip = availableTips[dateDay % availableTips.length];

  // Pulsing animation for check-in card
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.025, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);


  // Check-in modal states
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [mood, setMood] = useState<'great' | 'good' | 'tired' | 'unwell' | 'anxious' | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Voice dictation states
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);

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
    try {
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
    } catch (e) {
      console.warn('Voice speech recognition not supported on this device/platform:', e);
      setIsVoiceSupported(false);
    }

    return () => {
      try {
        Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
      } catch (e) {}
    };
  }, []);

  const startSpeechToText = async () => {
    if (!isVoiceSupported) return;
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

  const getDangerSymptomNames = () =>
    selectedSymptoms
      .filter((sId) => SYMPTOMS.find((s) => s.id === sId)?.warning)
      .map((sId) => SYMPTOMS.find((s) => s.id === sId)?.label.replace(/^[^a-zA-Z]+/, '').trim())
      .join(', ');

  const handleSaveCheckIn = async () => {
    if (!mood) {
      showAlert({ title: 'Mood Required', message: 'Please select how you are feeling before saving.', type: 'info', buttons: [{ text: 'OK' }] });
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

      if (hasDangerSigns) {
        const names = getDangerSymptomNames();
        showAlert({
          title: '🚨 Pregnancy Danger Signs',
          message: `You reported: ${names}.

These are warning signs that need urgent medical attention. Please speak to SheGuard AI now or go to the nearest hospital immediately.`,
          type: 'danger',
          buttons: [
            { text: 'Dismiss', style: 'cancel' },
            { text: '🎙️ Talk to AI', onPress: handleStartConversation },
          ],
        });
      } else {
        showAlert({
          title: 'Check-in Saved ✅',
          message: 'Your daily health log has been recorded in your health journal.',
          type: 'success',
          buttons: [{ text: 'Great!' }],
        });
      }

      // Reset
      setMood(null);
      setSelectedSymptoms([]);
      setNotes('');
      setIsCheckInOpen(false);
    } catch (err) {
      showAlert({ title: 'Error', message: 'Failed to register check-in. Please try again.', type: 'danger', buttons: [{ text: 'OK' }] });
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

        {/* Daily Check-in Card — pulsing to signal it's tappable */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={() => setIsCheckInOpen(true)}
            style={[
              styles.checkInCard,
              {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.primary,
                shadowColor: activeColors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 8,
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={styles.checkInContentRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkInTitle, { color: activeColors.primary }]}>
                  How are you feeling today?
                </Text>
                <Text style={[styles.checkInSubtitle, { color: activeColors.textMuted }]}>
                  Tap here to log your daily symptoms and mood 👆
                </Text>
              </View>
              <View style={[styles.checkInIconCircle, { backgroundColor: activeColors.primary }]}>
                <Ionicons name="heart" size={22} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

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
          <TouchableOpacity
            onPress={() => {
              showAlert({
                title: `${dailyTip.icon} ${dailyTip.title}`,
                message: dailyTip.content,
                type: dailyTip.dangerLevel === 'high' ? 'danger' : 'success',
                buttons: [{ text: 'Got it!' }],
              });
            }}
            style={[
              styles.gridCard,
              {
                backgroundColor: activeColors.surface,
                borderColor: dailyTip.dangerLevel === 'high' ? activeColors.emergency : activeColors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={activeColors.primary}
              />
              <Text style={[styles.cardTitle, { color: activeColors.text }]}>
                Daily Tip {dailyTip.icon}
              </Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'flex-start' }}>
              <Text style={[styles.cardContent, { color: activeColors.text, fontWeight: 'bold' }]} numberOfLines={1}>
                {dailyTip.title}
              </Text>
              <Text style={[styles.cardContent, { color: activeColors.textMuted, marginTop: 2, fontSize: 10, lineHeight: 14 }]} numberOfLines={4}>
                {dailyTip.content}
              </Text>
            </View>
          </TouchableOpacity>

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
            showAlert({
              title: '🚨 Emergency SOS',
              message: 'What is happening right now? Select the closest description.',
              type: 'danger',
              buttons: [
                {
                  text: '🩸 Severe pain / bleeding / no baby movement',
                  onPress: () => router.push('/conversation?triggerEmergency=true&concern=danger'),
                },
                {
                  text: '🌡️ High fever / difficulty breathing',
                  onPress: () => router.push('/conversation?triggerEmergency=true&concern=fever'),
                },
                {
                  text: '🔔 Labour contractions / water broke',
                  onPress: () => router.push('/conversation?triggerEmergency=true&concern=labour'),
                },
                {
                  text: '📞 Call 112 Emergency Services',
                  style: 'destructive',
                  onPress: () => Linking.openURL('tel:112'),
                },
              ],
            });
          }}
          style={[
            styles.sosButton,
            { backgroundColor: activeColors.emergency },
          ]}
          activeOpacity={0.9}
        >
          <Ionicons name="warning" size={22} color="#FFFFFF" style={styles.sosIcon} />
          <Text style={styles.sosButtonText}>🚨 EMERGENCY SOS</Text>
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

              {/* Symptoms Checklist — sectioned */}
              {SYMPTOM_SECTIONS.map((section) => (
                <View key={section.section}>
                  <Text
                    style={[
                      styles.modalSectionLabel,
                      {
                        color: section.isDanger ? activeColors.emergency : activeColors.text,
                        marginTop: 4,
                      },
                    ]}
                  >
                    {section.section}
                  </Text>
                  <View style={styles.symptomsContainer}>
                    {section.symptoms.map((sym) => {
                      const isChecked = selectedSymptoms.includes(sym.id);
                      return (
                        <TouchableOpacity
                          key={sym.id}
                          onPress={() => toggleSymptom(sym.id)}
                          style={[
                            styles.symptomRow,
                            {
                              backgroundColor: isChecked
                                ? sym.warning
                                  ? activeColors.emergency + '12'
                                  : activeColors.surface2
                                : 'transparent',
                              borderColor: isChecked
                                ? sym.warning
                                  ? activeColors.emergency
                                  : activeColors.primary
                                : activeColors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.symptomLabel, { color: activeColors.text }]}>
                            {sym.label}
                          </Text>
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={
                              isChecked
                                ? sym.warning
                                  ? activeColors.emergency
                                  : activeColors.primary
                                : activeColors.textMuted
                            }
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

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
                    🚨 You have selected pregnancy danger signs. Do not wait — speak to SheGuard AI now or go to the nearest hospital or maternity clinic immediately.
                  </Text>
                </View>
              )}

              {/* Notes with Voice Dictation */}
              <View style={styles.notesHeaderRow}>
                <Text style={[styles.modalSectionLabel, { color: activeColors.text }]}>
                  Notes / How you feel:
                </Text>
                {isVoiceSupported && (
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
                )}
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
      <AlertModal />
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
