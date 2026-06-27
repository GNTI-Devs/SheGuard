import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import * as Speech from 'expo-speech';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface TipItem {
  id: string;
  title: string;
  month: number;
  content: string;
  icon: string;
  dangerLevel: 'none' | 'warning' | 'high';
  category:
    | 'nutrition'
    | 'body'
    | 'mental'
    | 'danger'
    | 'anc'
    | 'exercise'
    | 'prep';
}

export const TIPS: TipItem[] = [
  // ── Month 1 ──────────────────────────────────────────────────────────────
  {
    id: 'm1-1',
    title: 'Start Folic Acid Now',
    month: 1,
    icon: '💊',
    dangerLevel: 'none',
    category: 'nutrition',
    content:
      "Welcome to your first month! To help protect your baby's developing brain and spinal cord, please start taking a daily folic acid supplement (400–800 mcg). It's a simple, loving step to give your little one a healthy start.",
  },
  {
    id: 'm1-2',
    title: 'Book Your First Antenatal Visit',
    month: 1,
    icon: '🏥',
    dangerLevel: 'none',
    category: 'anc',
    content:
      'Registering at a clinic early is a beautiful way to care for yourself. Your first visit helps check your blood pressure and establish baseline numbers so you and your doctor can track your progress together.',
  },
  {
    id: 'm1-3',
    title: 'Avoid Alcohol, Tobacco & Self-Medication',
    month: 1,
    icon: '🚫',
    dangerLevel: 'warning',
    category: 'danger',
    content:
      'Your baby is growing its very first cells this month. Please protect them by avoiding alcohol, smoking, and traditional herbal mixtures. Always check with your doctor before taking any medications.',
  },
  {
    id: 'm1-4',
    title: 'Rest and Manage Early Fatigue',
    month: 1,
    icon: '😴',
    dangerLevel: 'none',
    category: 'body',
    content:
      'Feeling deeply exhausted is completely normal right now as your body builds a home for your baby. Please listen to your body, sleep 7–9 hours, and give yourself permission to take short naps during the day.',
  },
  {
    id: 'm1-5',
    title: 'Mental Health Matters Too',
    month: 1,
    icon: '🧠',
    dangerLevel: 'none',
    category: 'mental',
    content:
      'Feeling a mix of excitement, fear, or anxiety is completely natural. Share your heart with someone you trust. Remember, antenatal blues are very real and treatable — you are never alone.',
  },

  // ── Month 2 ──────────────────────────────────────────────────────────────
  {
    id: 'm2-1',
    title: 'Managing Morning Sickness',
    month: 2,
    icon: '🤢',
    dangerLevel: 'none',
    category: 'body',
    content:
      "If you're dealing with morning sickness, try eating small bites of dry toast or crackers before getting out of bed. If you cannot keep any food or water down for 24 hours, please go see your doctor so they can help you stay hydrated.",
  },
  {
    id: 'm2-2',
    title: 'Iron-Rich Foods for Anaemia Prevention',
    month: 2,
    icon: '🥬',
    dangerLevel: 'none',
    category: 'nutrition',
    content:
      'Pregnancy anemia is common, but you can build your blood by eating iron-rich foods like pumpkin leaves (ugwu), liver, beans, and red meat. Taking iron supplements with orange juice also helps your body absorb it better!',
  },
  {
    id: 'm2-3',
    title: 'Stay Hydrated',
    month: 2,
    icon: '💧',
    dangerLevel: 'none',
    category: 'nutrition',
    content:
      'Drinking 8–10 cups of clean water daily is a simple way to care for your body and prevent painful urinary infections. Keep a bottle near you, and take small, frequent sips if you feel nauseated.',
  },
  {
    id: 'm2-4',
    title: 'Danger Sign: Heavy Bleeding',
    month: 2,
    icon: '🚨',
    dangerLevel: 'high',
    category: 'danger',
    content:
      'If you notice heavy vaginal bleeding or severe abdominal pain, please go to the nearest hospital immediately. While light spotting can sometimes happen, early checkups keep you and your baby safe.',
  },
  {
    id: 'm2-5',
    title: 'Protect Against Malaria',
    month: 2,
    icon: '🦟',
    dangerLevel: 'warning',
    category: 'danger',
    content:
      'Sleeping under a treated mosquito net is a gentle, protective shield against malaria, which can cause severe anemia. When your clinic offers you IPTp (malaria preventive medicine), please take all doses to stay safe.',
  },

  // ── Month 3 ──────────────────────────────────────────────────────────────
  {
    id: 'm3-1',
    title: 'First Trimester Scan (Ultrasound)',
    month: 3,
    icon: '🔬',
    dangerLevel: 'none',
    category: 'anc',
    content:
      'Getting an ultrasound scan around weeks 10–13 is an exciting moment! It lets you see your baby, check their heartbeat, and gives your doctor an accurate estimation of your due date.',
  },
  {
    id: 'm3-2',
    title: 'Avoid Raw or Undercooked Food',
    month: 3,
    icon: '🍖',
    dangerLevel: 'warning',
    category: 'nutrition',
    content:
      "To protect your baby from harmful bacteria, please ensure all meat, eggs, and fish are thoroughly cooked, and wash fruits and vegetables very well. It's a simple way to keep your stomach happy and healthy.",
  },
  {
    id: 'm3-3',
    title: 'Light Exercise',
    month: 3,
    icon: '🚶🏾‍♀️',
    dangerLevel: 'none',
    category: 'exercise',
    content:
      'Taking a gentle 15–20 minute walk daily is a wonderful way to keep your blood flowing, boost your mood, and reduce constipation. Just remember to rest when you feel tired and avoid heavy lifting.',
  },
  {
    id: 'm3-4',
    title: 'Heartburn and Digestion',
    month: 3,
    icon: '🔥',
    dangerLevel: 'none',
    category: 'body',
    content:
      "If you're feeling a burning sensation or bloating after eating, try eating smaller meals more often and avoid spicy foods. Staying upright for an hour after eating also helps ease digestion.",
  },
  {
    id: 'm3-5',
    title: 'Emotional Support Network',
    month: 3,
    icon: '🤝',
    dangerLevel: 'none',
    category: 'mental',
    content:
      'You do not have to carry this pregnancy alone. Choose a partner, family member, or trusted friend who can be your anchor. Sharing the load is a beautiful way to care for your mental health.',
  },

  // ── Month 4 ──────────────────────────────────────────────────────────────
  {
    id: 'm4-1',
    title: 'Balanced Nutrition: Protein and Iron',
    month: 4,
    icon: '🥗',
    dangerLevel: 'none',
    category: 'nutrition',
    content:
      'Your baby is growing rapidly now! Give them strength by eating protein-rich foods like eggs, beans, fish, and groundnuts. Colorful plates filled with local vegetables and grains feed both of you beautifully.',
  },
  {
    id: 'm4-2',
    title: 'Start Sleeping on Your Side',
    month: 4,
    icon: '🛌',
    dangerLevel: 'none',
    category: 'body',
    content:
      'Starting this month, try to sleep on your left side. It improves blood flow to your baby and keeps you comfortable. Placing a soft pillow between your knees can give you extra support.',
  },
  {
    id: 'm4-3',
    title: 'Second Trimester Energy Returns',
    month: 4,
    icon: '⚡',
    dangerLevel: 'none',
    category: 'body',
    content:
      'Many mothers feel their energy return this month as morning sickness fades! Enjoy this window to establish gentle routines, cook nourishing meals, and prepare your body with light walks.',
  },
  {
    id: 'm4-4',
    title: 'Dental Health in Pregnancy',
    month: 4,
    icon: '🦷',
    dangerLevel: 'warning',
    category: 'anc',
    content:
      'Pregnancy hormones can make your gums tender or bleed easily. Brush twice daily, and visit a dentist if you can. Keeping your gums healthy is a loving shield against early labor.',
  },
  {
    id: 'm4-5',
    title: 'Danger Sign: Fever and Chills',
    month: 4,
    icon: '🌡️',
    dangerLevel: 'high',
    category: 'danger',
    content:
      'If you develop a high fever or chills, please seek medical care today. Fevers can be a sign of malaria or infections, and treating them quickly prevents complications for your pregnancy.',
  },
  {
    id: 'm4-6',
    title: 'Avoid Stress and Overwork',
    month: 4,
    icon: '🧘🏾‍♀️',
    dangerLevel: 'none',
    category: 'mental',
    content:
      'Chronic stress is heavy for both you and your baby. Please delegate chores, rest when you can, and make time for things that bring you peace. Your peace of mind directly nurtures your baby.',
  },

  // ── Month 5 ──────────────────────────────────────────────────────────────
  {
    id: 'm5-1',
    title: 'Your Baby is Moving!',
    month: 5,
    icon: '👶',
    dangerLevel: 'none',
    category: 'body',
    content:
      "You might start feeling gentle flutters or tiny kicks this month! It's your baby saying hello. Take moments to sit quietly and connect with these beautiful movements.",
  },
  {
    id: 'm5-2',
    title: 'Counting Kick Movements',
    month: 5,
    icon: '🦶',
    dangerLevel: 'warning',
    category: 'danger',
    content:
      "Get to know your baby's active hours. If you notice a sudden drop in their movements or feel nothing for 6–12 hours, please don't wait — visit your clinic so they can listen to their heartbeat and reassure you.",
  },
  {
    id: 'm5-3',
    title: 'Mid-Pregnancy Anatomy Scan',
    month: 5,
    icon: '🔬',
    dangerLevel: 'none',
    category: 'anc',
    content:
      "Having an anatomy scan around weeks 18–22 is a wonderful opportunity to check that your baby's heart, spine, and limbs are developing beautifully and on track.",
  },
  {
    id: 'm5-4',
    title: 'Leg Cramps and Swelling',
    month: 5,
    icon: '🦵',
    dangerLevel: 'none',
    category: 'body',
    content:
      'If you experience leg cramps or swelling, try elevating your feet when sitting down. Eating calcium-rich foods like yogurt, local greens, and fish with soft bones helps ease muscle tightness.',
  },
  {
    id: 'm5-5',
    title: 'Gestational Diabetes Screening',
    month: 5,
    icon: '🩸',
    dangerLevel: 'warning',
    category: 'anc',
    content:
      'Asking your midwife for a gestational diabetes screening is a smart preventative step. Managing blood sugar early keeps you feeling energized and ensures a healthy birth size for your baby.',
  },

  // ── Month 6 ──────────────────────────────────────────────────────────────
  {
    id: 'm6-1',
    title: 'Calcium for Bones and Teeth',
    month: 6,
    icon: '🥛',
    dangerLevel: 'none',
    category: 'nutrition',
    content:
      "Your baby's bones are hardening, and they need calcium! Please include yogurt, milk, local greens, or soya milk in your meals so your own bones and teeth stay strong and healthy.",
  },
  {
    id: 'm6-2',
    title: 'Braxton Hicks Contractions',
    month: 6,
    icon: '🫁',
    dangerLevel: 'none',
    category: 'body',
    content:
      'You might feel occasional, painless tightening in your belly — these are practice contractions. They are normal, but if they become painful, regular, or are accompanied by fluid, please see your midwife.',
  },
  {
    id: 'm6-3',
    title: 'Danger Sign: Preterm Labour Warning',
    month: 6,
    icon: '🚨',
    dangerLevel: 'high',
    category: 'danger',
    content:
      'If you feel regular painful contractions, notice your water breaking, or have constant back pain before week 37, please listen to your body and go to the hospital right away. Early checkups are the safest, most loving way to protect both of you.',
  },
  {
    id: 'm6-4',
    title: 'Emotional Changes Are Normal',
    month: 6,
    icon: '💭',
    dangerLevel: 'none',
    category: 'mental',
    content:
      'Mood changes, worries, and fears are completely natural as your due date approaches. Please talk to your clinic or a loved one if you feel overwhelmed — your emotional well-being is precious.',
  },
  {
    id: 'm6-5',
    title: 'Vitamin D and Sun Exposure',
    month: 6,
    icon: '☀️',
    dangerLevel: 'none',
    category: 'nutrition',
    content:
      "Spend 15–30 minutes in the gentle morning sunlight daily. It's a natural way to boost your Vitamin D, which supports your baby's bone and immune development.",
  },

  // ── Month 7 ──────────────────────────────────────────────────────────────
  {
    id: 'm7-1',
    title: 'Blood Pressure Monitoring',
    month: 7,
    icon: '🩺',
    dangerLevel: 'warning',
    category: 'anc',
    content:
      'Checking your blood pressure at every clinic visit is a simple, life-saving habit. If you experience severe headaches, blurred vision, or sudden swelling in your face and hands, please get checked immediately.',
  },
  {
    id: 'm7-2',
    title: 'Danger Signs: Preeclampsia',
    month: 7,
    icon: '🚨',
    dangerLevel: 'high',
    category: 'danger',
    content:
      'If you develop a sudden, severe headache, blurry vision, or sudden swelling in your face or hands, please go to the clinic immediately. These are signs of preeclampsia, and getting care early is the warmest way to keep you both safe.',
  },
  {
    id: 'm7-3',
    title: 'Omega-3 for Brain Development',
    month: 7,
    icon: '🐟',
    dangerLevel: 'none',
    category: 'nutrition',
    content:
      "Your baby's brain is growing very fast! Try to eat safe, low-mercury fish like mackerel or sardines 2–3 times a week. It's a delicious way to support their mental development.",
  },
  {
    id: 'm7-4',
    title: 'Sleep Difficulties',
    month: 7,
    icon: '🌙',
    dangerLevel: 'none',
    category: 'body',
    content:
      'Finding a comfortable sleep position can be hard now. Support your bump with pillows, sleep on your side, and take short naps during the day to stay rested.',
  },
  {
    id: 'm7-5',
    title: 'Shortness of Breath',
    month: 7,
    icon: '🫁',
    dangerLevel: 'none',
    category: 'body',
    content:
      'As your baby grows, they push against your lungs, making it feel harder to breathe. Move slowly and rest. If you feel sudden, severe breathlessness or chest pain, seek help immediately.',
  },
  {
    id: 'm7-6',
    title: 'Birth Companion Plan',
    month: 7,
    icon: '👩‍👩‍👦',
    dangerLevel: 'none',
    category: 'prep',
    content:
      'Choose a loving, supportive companion — like your husband, mother, or sister — to be with you during delivery. Having a friendly face by your side makes birth a warmer experience.',
  },

  // ── Month 8 ──────────────────────────────────────────────────────────────
  {
    id: 'm8-1',
    title: 'Prepare Your Hospital Bag',
    month: 8,
    icon: '👜',
    dangerLevel: 'none',
    category: 'prep',
    content:
      "It's time to pack your hospital bag! Include clean baby clothes, blankets, maternity pads, your clinic card, and warm socks. Keep it near the door so you are ready whenever the time comes.",
  },
  {
    id: 'm8-2',
    title: 'Know Your Birth Plan',
    month: 8,
    icon: '📋',
    dangerLevel: 'none',
    category: 'prep',
    content:
      'Confirm how you will get to the hospital when labor starts. Plan a primary route, identify a driver, and keep their contact number handy. Sharing this plan with family gives everyone peace of mind.',
  },
  {
    id: 'm8-3',
    title: 'Danger Check: Decreased Fetal Movement',
    month: 8,
    icon: '🚨',
    dangerLevel: 'high',
    category: 'danger',
    content:
      "Your baby should remain active daily. If you notice their kicks slowing down significantly or feel nothing for several hours, please don't wait for morning — go to the hospital immediately to ensure they are safe.",
  },
  {
    id: 'm8-4',
    title: 'Pelvic Pain and Pressure',
    month: 8,
    icon: '⬇️',
    dangerLevel: 'none',
    category: 'body',
    content:
      'You might feel heavy pelvic pressure as your baby settles into position. Taking warm baths, resting with elevated hips, and doing gentle stretches can help ease this discomfort.',
  },
  {
    id: 'm8-5',
    title: 'Group B Strep Test',
    month: 8,
    icon: '🧫',
    dangerLevel: 'warning',
    category: 'anc',
    content:
      'Ask your clinic about Group B Strep screening. If positive, they will give you simple antibiotics during labor to protect your baby from catching the infection during birth.',
  },
  {
    id: 'm8-6',
    title: 'Financial and Family Preparations',
    month: 8,
    icon: '🏠',
    dangerLevel: 'none',
    category: 'prep',
    content:
      'Prepare your delivery budget and arrange for family support at home during the first few weeks. Having a warm network of helpers allows you to recover and bond with your baby peacefully.',
  },

  // ── Month 9 ──────────────────────────────────────────────────────────────
  {
    id: 'm9-1',
    title: 'Recognizing True Labour Signs',
    month: 9,
    icon: '🔔',
    dangerLevel: 'none',
    category: 'body',
    content:
      "True labor contractions feel regular, get closer together, and don't stop with rest. If your water breaks (even as a leak) or you see a pink discharge, it's time to head to the hospital calmly!",
  },
  {
    id: 'm9-2',
    title: 'Do Not Delay Going to Hospital',
    month: 9,
    icon: '🚗',
    dangerLevel: 'warning',
    category: 'danger',
    content:
      'When labor begins, please start your journey to the hospital early. Road traffic and delays can happen, and arriving early ensures a relaxed, safe environment for your delivery.',
  },
  {
    id: 'm9-3',
    title: 'Danger Sign: Cord or Unusual Presentation',
    month: 9,
    icon: '🚨',
    dangerLevel: 'high',
    category: 'danger',
    content:
      'If you see the umbilical cord slip out, feel a hand or foot presenting first, or experience sudden severe pain, please call for help and head to the hospital immediately. You need expert care right away.',
  },
  {
    id: 'm9-4',
    title: 'Pain Management Options',
    month: 9,
    icon: '💉',
    dangerLevel: 'none',
    category: 'prep',
    content:
      'Talk to your midwife about pain relief options, including deep breathing, moving around, and warm water. Knowing your choices ahead of time helps you feel confident and in control.',
  },
  {
    id: 'm9-5',
    title: 'Breastfeeding Preparation',
    month: 9,
    icon: '🤱🏾',
    dangerLevel: 'none',
    category: 'prep',
    content:
      "Plan to give your baby only breastmilk for the first 6 months. It's sterile, packed with antibodies, and builds a close bond. Ask a nurse to help you find a comfortable latch in the hospital.",
  },
  {
    id: 'm9-6',
    title: 'Postpartum Warning Signs',
    month: 9,
    icon: '⚠️',
    dangerLevel: 'high',
    category: 'danger',
    content:
      'After delivery, seek urgent medical help if you experience very heavy bleeding, a high fever, severe headaches, or feel completely detached from your baby. Your health remains the highest priority.',
  },
];

const MONTHS_METADATA = [
  {
    month: 1,
    label: 'Month 1',
    weeks: 'Weeks 1–4',
    description: 'Your body begins to change.',
  },
  {
    month: 2,
    label: 'Month 2',
    weeks: 'Weeks 5–8',
    description: 'Heart and limbs begin to form.',
  },
  {
    month: 3,
    label: 'Month 3',
    weeks: 'Weeks 9–12',
    description: 'Placenta and organs form.',
  },
  {
    month: 4,
    label: 'Month 4',
    weeks: 'Weeks 13–16',
    description: 'Rapid bone and muscle growth.',
  },
  {
    month: 5,
    label: 'Month 5',
    weeks: 'Weeks 17–20',
    description: 'Baby kicks can be felt.',
  },
  {
    month: 6,
    label: 'Month 6',
    weeks: 'Weeks 21–24',
    description: 'Lungs and skin are developing.',
  },
  {
    month: 7,
    label: 'Month 7',
    weeks: 'Weeks 25–28',
    description: 'Brain activity begins.',
  },
  {
    month: 8,
    label: 'Month 8',
    weeks: 'Weeks 29–32',
    description: 'Active growth and positioning.',
  },
  {
    month: 9,
    label: 'Month 9',
    weeks: 'Weeks 33–40+',
    description: 'Final preparation for birth.',
  },
];

function getMonthStatus(
  monthNum: number,
  currentMonth: number
): 'past' | 'current' | 'future' {
  if (monthNum < currentMonth) return 'past';
  if (monthNum === currentMonth) return 'current';
  return 'future';
}

export default function TipsScreen() {
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];
  const { profile } = useUserProfile();
  const currentMonth = profile?.pregnancyMonth ?? 1;

  const [expandedMonthId, setExpandedMonthId] = useState<number | null>(null);
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Sync expandedMonthId to user's current pregnancy month once the profile loads
  React.useEffect(() => {
    if (profile?.pregnancyMonth) {
      setExpandedMonthId(profile.pregnancyMonth);
    }
  }, [profile?.pregnancyMonth]);

  const {
    play: playGuide,
    stop: stopGuide,
    isPlaying: isPlayingGuide,
    activeKey: activeKeyGuide,
  } = useAudioPlayer();

  // Clean up and stop speaking when screen unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
      stopGuide();
    };
  }, []);

  const handleSpeakTip = async (tip: TipItem) => {
    try {
      if (speakingId === tip.id) {
        await Speech.stop();
        setSpeakingId(null);
      } else {
        await Speech.stop();
        setSpeakingId(tip.id);

        const langCode = profile?.language || 'en';
        // Map language code to standard TTS language locale
        let ttsLang = 'en-US';
        if (langCode === 'ha') ttsLang = 'ha-NE';
        else if (langCode === 'yo') ttsLang = 'yo-NG';
        else if (langCode === 'ig') ttsLang = 'ig-NG';
        else if (langCode === 'pcm') ttsLang = 'en-NG'; // Nigerian English fallback for Pidgin

        await Speech.speak(`${tip.title}. ${tip.content}`, {
          language: ttsLang,
          onDone: () => setSpeakingId(null),
          onError: () => setSpeakingId(null),
          onStopped: () => setSpeakingId(null),
        });
      }
    } catch (e) {
      console.warn('TTS error:', e);
      setSpeakingId(null);
    }
  };

  const handleToggleMonth = (month: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMonthId(expandedMonthId === month ? null : month);
  };

  const handleToggleTip = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTipId(expandedTipId === id ? null : id);
  };

  const getStatusIcon = (status: 'past' | 'current' | 'future') => {
    if (status === 'past') return '✅';
    if (status === 'current') return '🔵';
    return '🔒';
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 20,
          },
        ]}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.title, { color: activeColors.primary }]}>
            Pregnancy Guide
          </Text>
          <Text style={[styles.subtitle, { color: activeColors.textMuted }]}>
            Showing Month {currentMonth} guidance for your pregnancy stage
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => playGuide('tips')}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: activeColors.border,
            backgroundColor:
              activeKeyGuide === 'tips' && isPlayingGuide
                ? activeColors.primary
                : activeColors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              activeKeyGuide === 'tips' && isPlayingGuide
                ? 'volume-mute'
                : 'volume-high'
            }
            size={22}
            color={
              activeKeyGuide === 'tips' && isPlayingGuide
                ? '#FFFFFF'
                : activeColors.primary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Disclaimer Banner */}
      <View
        style={[
          styles.disclaimerBanner,
          { backgroundColor: '#D48C4520', borderColor: '#D48C45' },
        ]}
      >
        <Ionicons name="information-circle-outline" size={18} color="#D48C45" />
        <Text style={[styles.disclaimerText, { color: '#D48C45' }]}>
          For education only. Every pregnancy is different — always consult a
          registered health worker before acting on any advice.
        </Text>
      </View>

      {/* Accordion Month List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {MONTHS_METADATA.map((monthMeta) => {
          const status = getMonthStatus(monthMeta.month, currentMonth);
          const isMonthExpanded = expandedMonthId === monthMeta.month;
          const monthTips = TIPS.filter((tip) => tip.month === monthMeta.month);
          const isCurrent = status === 'current';
          const isPast = status === 'past';

          return (
            <View
              key={monthMeta.month}
              style={[
                styles.monthCard,
                {
                  backgroundColor: activeColors.surface,
                  borderColor: isCurrent
                    ? activeColors.primary
                    : isPast
                    ? activeColors.border
                    : activeColors.border,
                  opacity: status === 'future' ? 0.65 : 1,
                },
              ]}
            >
              {/* Accordion Header */}
              <TouchableOpacity
                onPress={() => handleToggleMonth(monthMeta.month)}
                style={styles.monthHeaderRow}
                activeOpacity={0.8}
              >
                <View style={styles.monthTitleBlock}>
                  <View
                    style={[
                      styles.monthBadge,
                      {
                        backgroundColor: isCurrent
                          ? activeColors.primary
                          : isPast
                          ? activeColors.border
                          : activeColors.surface2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthBadgeText,
                        { color: isCurrent ? '#FFFFFF' : activeColors.text },
                      ]}
                    >
                      M{monthMeta.month}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.monthLabelRow}>
                      <Text
                        style={[
                          styles.monthLabelText,
                          { color: activeColors.text },
                        ]}
                      >
                        {monthMeta.label}
                      </Text>
                      <Text style={styles.statusIcon}>
                        {getStatusIcon(status)}
                      </Text>
                      {isCurrent && (
                        <View
                          style={[
                            styles.currentBadge,
                            { backgroundColor: activeColors.primary },
                          ]}
                        >
                          <Text style={styles.currentBadgeText}>
                            YOUR STAGE
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.monthWeeksText,
                        { color: activeColors.textMuted },
                      ]}
                    >
                      {monthMeta.weeks} • {monthMeta.description}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isMonthExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={activeColors.textMuted}
                />
              </TouchableOpacity>

              {/* Accordion Body */}
              {isMonthExpanded && (
                <View
                  style={[
                    styles.monthBodyContainer,
                    { borderTopColor: activeColors.border },
                  ]}
                >
                  {/* Future-month advisory */}
                  {status === 'future' && (
                    <View
                      style={[
                        styles.futureNotice,
                        { backgroundColor: activeColors.surface2 },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={14}
                        color={activeColors.textMuted}
                      />
                      <Text
                        style={[
                          styles.futureNoticeText,
                          { color: activeColors.textMuted },
                        ]}
                      >
                        You haven't reached this stage yet. This information is
                        shown for reference only. Focus on your current month
                        first.
                      </Text>
                    </View>
                  )}

                  {monthTips.length === 0 ? (
                    <Text
                      style={[
                        styles.emptyTipsText,
                        { color: activeColors.textMuted },
                      ]}
                    >
                      No guidelines loaded for this month yet.
                    </Text>
                  ) : (
                    monthTips.map((tip) => {
                      const isTipExpanded = expandedTipId === tip.id;

                      let warningTag = null;
                      let tipCardBorderColor = activeColors.border;

                      if (tip.dangerLevel === 'high') {
                        tipCardBorderColor = activeColors.emergency;
                        warningTag = (
                          <View
                            style={[
                              styles.tag,
                              { backgroundColor: activeColors.emergency },
                            ]}
                          >
                            <Text style={styles.tagText}>⚠️ DANGER SIGN</Text>
                          </View>
                        );
                      } else if (tip.dangerLevel === 'warning') {
                        tipCardBorderColor = '#D48C45';
                        warningTag = (
                          <View
                            style={[styles.tag, { backgroundColor: '#D48C45' }]}
                          >
                            <Text style={styles.tagText}>📢 IMPORTANT</Text>
                          </View>
                        );
                      }

                      return (
                        <View
                          key={tip.id}
                          style={[
                            styles.tipItemCard,
                            {
                              backgroundColor: activeColors.background,
                              borderColor: tipCardBorderColor,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => handleToggleTip(tip.id)}
                            style={styles.tipHeaderTouch}
                            activeOpacity={0.8}
                          >
                            <View style={styles.tipTitleRow}>
                              <Text style={styles.tipEmojiIcon}>
                                {tip.icon}
                              </Text>
                              <View style={styles.tipTitleWrapper}>
                                {warningTag}
                                <Text
                                  style={[
                                    styles.tipTitleText,
                                    { color: activeColors.text },
                                  ]}
                                >
                                  {tip.title}
                                </Text>
                              </View>
                            </View>
                            <Ionicons
                              name={
                                isTipExpanded ? 'chevron-up' : 'chevron-down'
                              }
                              size={16}
                              color={activeColors.textMuted}
                            />
                          </TouchableOpacity>

                          {isTipExpanded && (
                            <View
                              style={[
                                styles.tipExpandBody,
                                { borderTopColor: activeColors.border },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.tipContentText,
                                  { color: activeColors.text },
                                ]}
                              >
                                {tip.content}
                              </Text>

                              {/* Audio Reader Action Button */}
                              <TouchableOpacity
                                onPress={() => handleSpeakTip(tip)}
                                style={[
                                  styles.speakButton,
                                  {
                                    backgroundColor:
                                      speakingId === tip.id
                                        ? activeColors.primary
                                        : activeColors.surface2,
                                  },
                                ]}
                                activeOpacity={0.8}
                              >
                                <Ionicons
                                  name={
                                    speakingId === tip.id
                                      ? 'stop-circle'
                                      : 'volume-high'
                                  }
                                  size={16}
                                  color={
                                    speakingId === tip.id
                                      ? '#FFFFFF'
                                      : activeColors.primary
                                  }
                                />
                                <Text
                                  style={[
                                    styles.speakButtonText,
                                    {
                                      color:
                                        speakingId === tip.id
                                          ? '#FFFFFF'
                                          : activeColors.primary,
                                    },
                                  ]}
                                >
                                  {speakingId === tip.id
                                    ? 'Stop Reading'
                                    : 'Read Aloud'}
                                </Text>
                              </TouchableOpacity>

                              <Text
                                style={[
                                  styles.tipDisclaimer,
                                  { color: activeColors.textMuted },
                                ]}
                              >
                                ⓘ This is general guidance. Your health worker's
                                advice for your specific situation always takes
                                priority.
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  bottomPad: { height: 40 },
  monthCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  monthTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  monthBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBadgeText: { fontSize: 13, fontWeight: 'bold' },
  monthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  monthLabelText: { fontSize: 15, fontWeight: 'bold' },
  statusIcon: { fontSize: 14 },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  monthWeeksText: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  monthBodyContainer: { borderTopWidth: 1.5, padding: 10, gap: 8 },
  futureNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  futureNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  emptyTipsText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  tipItemCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tipHeaderTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  tipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  tipEmojiIcon: { fontSize: 22 },
  tipTitleWrapper: { flex: 1 },
  tag: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tipTitleText: { fontSize: 14, fontWeight: 'bold' },
  tipExpandBody: { padding: 12, borderTopWidth: 0.5 },
  tipContentText: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  speakButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipDisclaimer: { fontSize: 10, lineHeight: 14, fontStyle: 'italic' },
});
