import React, { useState } from 'react';
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

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TipItem {
  id: string;
  title: string;
  month: number; // 1 to 9
  content: string;
  icon: string;
  dangerLevel: 'none' | 'warning' | 'high';
}

const TIPS: TipItem[] = [
  // Month 1
  {
    id: 'm1-1',
    title: 'Folic Acid Intake',
    month: 1,
    content: "Start taking daily folic acid supplements immediately. It prevents neural tube birth defects and supports brain development in the first month.",
    icon: '💊',
    dangerLevel: 'none'
  },
  {
    id: 'm1-2',
    title: 'Book Antenatal Care',
    month: 1,
    content: "Schedule your first prenatal clinic visit. Early checkups help establish healthy baselines for blood pressure and blood levels.",
    icon: '🏥',
    dangerLevel: 'none'
  },
  // Month 2
  {
    id: 'm2-1',
    title: 'Morning Sickness Relief',
    month: 2,
    content: "Eat small, frequent, dry meals (like crackers or toasted bread). Ginger tea or lemon water can settle your stomach.",
    icon: '🍵',
    dangerLevel: 'none'
  },
  {
    id: 'm2-2',
    title: 'Avoid Self-Medication',
    month: 2,
    content: "Do not take any medications, herbal mixtures, or native herbs without consulting a health worker first, as they can harm the developing baby.",
    icon: '⚠️',
    dangerLevel: 'warning'
  },
  // Month 3
  {
    id: 'm3-1',
    title: 'Stay Hydrated',
    month: 3,
    content: "Drink plenty of clean water (at least 8-10 cups daily). Proper hydration supports amniotic fluid levels and prevents painful urinary infections.",
    icon: '💧',
    dangerLevel: 'none'
  },
  {
    id: 'm3-2',
    title: 'Light Exercises',
    month: 3,
    content: "Start taking short, 15-minute daily walks. Staying active boosts circulation and reduces fatigue.",
    icon: '🚶🏼‍♀️',
    dangerLevel: 'none'
  },
  // Month 4
  {
    id: 'm4-1',
    title: 'Balanced Nutrition',
    month: 4,
    content: "Include protein (eggs, beans, fish) and iron-rich foods (green leafy vegetables, ugwu) in your meals to build healthy red blood levels.",
    icon: '🥗',
    dangerLevel: 'none'
  },
  {
    id: 'm4-2',
    title: 'Side-Sleeping Position',
    month: 4,
    content: "Start sleeping on your left side. This position improves blood and oxygen flow to the placenta and your baby.",
    icon: '🛌',
    dangerLevel: 'none'
  },
  // Month 5
  {
    id: 'm5-1',
    title: 'Watch for First Kicks',
    month: 5,
    content: "Between weeks 18 and 22, you will start feeling tiny flutters. This is called 'quickening' and is a sign of your baby moving.",
    icon: '👶',
    dangerLevel: 'none'
  },
  // Month 6
  {
    id: 'm6-1',
    title: 'Calcium and Vitamins',
    month: 6,
    content: "Ensure good calcium intake (milk, yogurt, fish bones) to strengthen baby's bones while preserving your own dental and bone strength.",
    icon: '🥛',
    dangerLevel: 'none'
  },
  // Month 7
  {
    id: 'm7-1',
    title: 'Monitor Blood Pressure',
    month: 7,
    content: "Have your blood pressure checked regularly. High blood pressure is a warning sign of preeclampsia, which is more common in the third trimester.",
    icon: '🩺',
    dangerLevel: 'warning'
  },
  // Month 8
  {
    id: 'm8-1',
    title: 'Prepare Birth Plan',
    month: 8,
    content: "Decide where you will deliver, identify transport options, and select who will support you at the hospital.",
    icon: '📋',
    dangerLevel: 'none'
  },
  {
    id: 'm8-2',
    title: 'Preeclampsia Danger Check',
    month: 8,
    content: "Immediately call a health worker if you have a persistent headache, sudden swelling of your hands and face, or blurred vision.",
    icon: '🚨',
    dangerLevel: 'high'
  },
  // Month 9
  {
    id: 'm9-1',
    title: 'Recognizing Labor Signs',
    month: 9,
    content: "Watch for regular painful contractions that get closer together, leaking water, or a blood-stained mucus discharge.",
    icon: '🔔',
    dangerLevel: 'none'
  },
  {
    id: 'm9-2',
    title: 'Hospital Bag Prep',
    month: 9,
    content: "Pack clothes for yourself and baby, sanitary pads, baby blankets, diapers, and clinic card. Keep the bag ready near the door.",
    icon: '👜',
    dangerLevel: 'none'
  }
];

const MONTHS_METADATA = [
  { month: 1, label: 'Month 1', weeks: 'Weeks 1-4', description: 'Your body begins to change.' },
  { month: 2, label: 'Month 2', weeks: 'Weeks 5-8', description: 'Heart and limbs begin to form.' },
  { month: 3, label: 'Month 3', weeks: 'Weeks 9-12', description: 'Placenta and organs form.' },
  { month: 4, label: 'Month 4', weeks: 'Weeks 13-16', description: 'Rapid bone and muscle growth.' },
  { month: 5, label: 'Month 5', weeks: 'Weeks 17-20', description: 'Baby kicks start to be felt.' },
  { month: 6, label: 'Month 6', weeks: 'Weeks 21-24', description: 'Lungs and skin are developing.' },
  { month: 7, label: 'Month 7', weeks: 'Weeks 25-28', description: 'Brain activity begins.' },
  { month: 8, label: 'Month 8', weeks: 'Weeks 29-32', description: 'Active growth and positioning.' },
  { month: 9, label: 'Month 9', weeks: 'Weeks 33-40+', description: 'Final prep for labor and birth.' },
];

export default function TipsScreen() {
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  const [expandedMonthId, setExpandedMonthId] = useState<number | null>(null);
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [listeningId, setListeningId] = useState<string | null>(null);

  const handleToggleMonth = (month: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMonthId(expandedMonthId === month ? null : month);
  };

  const handleToggleTip = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTipId(expandedTipId === id ? null : id);
  };

  const handleListenTip = (id: string) => {
    if (listeningId === id) {
      setListeningId(null);
    } else {
      setListeningId(id);
      // Simulate playback stop
      setTimeout(() => {
        setListeningId((current) => (current === id ? null : current));
      }, 4000);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeColors.primary }]}>
          Pregnancy Timeline
        </Text>
        <Text style={[styles.subtitle, { color: activeColors.textMuted }]}>
          Month-by-month timeline and safety guidelines for your pregnancy journey
        </Text>
      </View>

      {/* Accordion Month List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {MONTHS_METADATA.map((monthMeta) => {
          const isMonthExpanded = expandedMonthId === monthMeta.month;
          const monthTips = TIPS.filter((tip) => tip.month === monthMeta.month);

          return (
            <View
              key={monthMeta.month}
              style={[
                styles.monthCard,
                {
                  backgroundColor: activeColors.surface,
                  borderColor: isMonthExpanded ? activeColors.primary : activeColors.border,
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
                      { backgroundColor: isMonthExpanded ? activeColors.primary : activeColors.surface2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthBadgeText,
                        { color: isMonthExpanded ? '#FFFFFF' : activeColors.text },
                      ]}
                    >
                      M{monthMeta.month}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.monthLabelText, { color: activeColors.text }]}>
                      {monthMeta.label}
                    </Text>
                    <Text style={[styles.monthWeeksText, { color: activeColors.textMuted }]}>
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
                  {monthTips.length === 0 ? (
                    <Text style={[styles.emptyTipsText, { color: activeColors.textMuted }]}>
                      No guidelines loaded for this month yet. Check back soon!
                    </Text>
                  ) : (
                    monthTips.map((tip) => {
                      const isTipExpanded = expandedTipId === tip.id;
                      const isListening = listeningId === tip.id;

                      let warningTag = null;
                      let tipCardBorderColor = activeColors.border;

                      if (tip.dangerLevel === 'high') {
                        tipCardBorderColor = activeColors.emergency;
                        warningTag = (
                          <View style={[styles.tag, { backgroundColor: activeColors.emergency }]}>
                            <Text style={styles.tagText}>CRITICAL DANGER SIGN</Text>
                          </View>
                        );
                      } else if (tip.dangerLevel === 'warning') {
                        tipCardBorderColor = '#D48C45';
                        warningTag = (
                          <View style={[styles.tag, { backgroundColor: '#D48C45' }]}>
                            <Text style={styles.tagText}>IMPORTANT NOTICE</Text>
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
                              <Text style={styles.tipEmojiIcon}>{tip.icon}</Text>
                              <View style={styles.tipTitleWrapper}>
                                {warningTag}
                                <Text style={[styles.tipTitleText, { color: activeColors.text }]}>
                                  {tip.title}
                                </Text>
                              </View>
                            </View>
                            <Ionicons
                              name={isTipExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={activeColors.textMuted}
                            />
                          </TouchableOpacity>

                          {isTipExpanded && (
                            <View style={[styles.tipExpandBody, { borderTopColor: activeColors.border }]}>
                              <Text style={[styles.tipContentText, { color: activeColors.text }]}>
                                {tip.content}
                              </Text>

                              <TouchableOpacity
                                onPress={() => handleListenTip(tip.id)}
                                style={[
                                  styles.audioBtn,
                                  {
                                    backgroundColor: isListening ? activeColors.success : activeColors.surface2,
                                    borderColor: activeColors.primary,
                                  },
                                ]}
                                activeOpacity={0.8}
                              >
                                <Ionicons
                                  name={isListening ? 'volume-medium' : 'volume-mute-outline'}
                                  size={16}
                                  color={isListening ? '#FFFFFF' : activeColors.primary}
                                />
                                <Text
                                  style={[
                                    styles.audioBtnText,
                                    { color: isListening ? '#FFFFFF' : activeColors.primary },
                                  ]}
                                >
                                  {isListening ? 'Playing voice read...' : 'Listen in my language'}
                                </Text>
                              </TouchableOpacity>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  monthCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  monthTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  monthBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  monthLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthWeeksText: {
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
  },
  monthBodyContainer: {
    borderTopWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  emptyTipsText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  tipItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
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
  tipEmojiIcon: {
    fontSize: 24,
  },
  tipTitleWrapper: {
    flex: 1,
  },
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
  tipTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipExpandBody: {
    padding: 12,
    borderTopWidth: 0.5,
  },
  tipContentText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  audioBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
