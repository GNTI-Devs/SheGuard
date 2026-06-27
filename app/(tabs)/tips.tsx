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
import { useUserProfile } from '@/hooks/useUserProfile';

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
  category: 'nutrition' | 'body' | 'mental' | 'danger' | 'anc' | 'exercise' | 'prep';
}

export const TIPS: TipItem[] = [
  // ── Month 1 ──────────────────────────────────────────────────────────────
  { id: 'm1-1', title: 'Start Folic Acid Now', month: 1, icon: '💊', dangerLevel: 'none', category: 'nutrition',
    content: 'Begin 400–800 mcg of folic acid daily. It protects the baby\'s brain and spinal cord from neural tube defects during the first critical weeks.' },
  { id: 'm1-2', title: 'Book Your First Antenatal Visit', month: 1, icon: '🏥', dangerLevel: 'none', category: 'anc',
    content: 'Register at a clinic early. Your first antenatal visit will check your blood pressure, blood group, HIV status, malaria, and haemoglobin to establish healthy baselines.' },
  { id: 'm1-3', title: 'Avoid Alcohol, Tobacco & Self-Medication', month: 1, icon: '🚫', dangerLevel: 'warning', category: 'danger',
    content: 'No alcohol, cigarettes, or herbal mixtures during pregnancy. Even in month 1, these can damage the developing embryo. Never take any drug without a health worker\'s approval.' },
  { id: 'm1-4', title: 'Rest and Manage Early Fatigue', month: 1, icon: '😴', dangerLevel: 'none', category: 'body',
    content: 'Extreme tiredness in the first month is normal — your body is working hard. Rest when you need to. Sleep 7–9 hours and take short naps if needed.' },
  { id: 'm1-5', title: 'Mental Health Matters Too', month: 1, icon: '🧠', dangerLevel: 'none', category: 'mental',
    content: 'Mixed feelings — excitement, fear, anxiety — are normal. Share your feelings with someone you trust. Antenatal depression is real and treatable. Don\'t suffer in silence.' },

  // ── Month 2 ──────────────────────────────────────────────────────────────
  { id: 'm2-1', title: 'Managing Morning Sickness', month: 2, icon: '🤢', dangerLevel: 'none', category: 'body',
    content: 'Eat small frequent meals (crackers, dry bread, boiled yam). Avoid strong smells. Ginger tea can help. If you cannot keep any food or water down for more than 24 hours, see a health worker immediately — severe vomiting (hyperemesis gravidarum) can be dangerous.' },
  { id: 'm2-2', title: 'Iron-Rich Foods for Anaemia Prevention', month: 2, icon: '🥬', dangerLevel: 'none', category: 'nutrition',
    content: 'Anaemia is one of the most common pregnancy complications in Nigeria. Eat iron-rich foods: ugwu (pumpkin leaves), liver, beans, red meat, fish. Take your iron supplement if prescribed.' },
  { id: 'm2-3', title: 'Stay Hydrated', month: 2, icon: '💧', dangerLevel: 'none', category: 'nutrition',
    content: 'Drink at least 8–10 cups of clean water daily. Dehydration can cause urinary tract infections (UTIs), which are dangerous in pregnancy. Drink even if you feel nauseous.' },
  { id: 'm2-4', title: 'Danger Sign: Heavy Bleeding', month: 2, icon: '🚨', dangerLevel: 'high', category: 'danger',
    content: 'Heavy vaginal bleeding at any point in pregnancy is an emergency. Go to the nearest hospital immediately. Light spotting can sometimes be normal but must always be checked by a health worker.' },
  { id: 'm2-5', title: 'Protect Against Malaria', month: 2, icon: '🦟', dangerLevel: 'warning', category: 'danger',
    content: 'Malaria in pregnancy can cause severe anaemia and premature birth. Sleep under an insecticide-treated net every night. Your antenatal clinic will give you IPTp (preventive malaria medicine) — take all doses.' },

  // ── Month 3 ──────────────────────────────────────────────────────────────
  { id: 'm3-1', title: 'First Trimester Scan (Ultrasound)', month: 3, icon: '🔬', dangerLevel: 'none', category: 'anc',
    content: 'Request an ultrasound scan around weeks 10–13 if available. It confirms the pregnancy is inside the womb, checks the baby\'s heartbeat, and estimates the due date accurately.' },
  { id: 'm3-2', title: 'Avoid Raw or Undercooked Food', month: 3, icon: '🍖', dangerLevel: 'warning', category: 'nutrition',
    content: 'Raw meat, undercooked fish, unpasteurized milk, and unwashed vegetables can contain bacteria like Listeria and Toxoplasma that harm the developing baby. All food should be properly cooked and washed.' },
  { id: 'm3-3', title: 'Light Exercise', month: 3, icon: '🚶🏾‍♀️', dangerLevel: 'none', category: 'exercise',
    content: 'Short 15–20 minute daily walks are safe and beneficial. Exercise improves circulation, reduces constipation, and lifts your mood. Avoid heavy lifting or strenuous exercise.' },
  { id: 'm3-4', title: 'Heartburn and Digestion', month: 3, icon: '🔥', dangerLevel: 'none', category: 'body',
    content: 'Heartburn and bloating are common as pregnancy hormones relax your digestive muscles. Eat smaller portions, avoid spicy/fatty foods, and don\'t lie down immediately after eating.' },
  { id: 'm3-5', title: 'Emotional Support Network', month: 3, icon: '🤝', dangerLevel: 'none', category: 'mental',
    content: 'Identify at least one trusted person — husband, mother, sister, friend — who will support you through the pregnancy. Pregnancy is not meant to be carried alone.' },

  // ── Month 4 ──────────────────────────────────────────────────────────────
  { id: 'm4-1', title: 'Balanced Nutrition: Protein and Iron', month: 4, icon: '🥗', dangerLevel: 'none', category: 'nutrition',
    content: 'Your baby is growing rapidly. Include protein (eggs, beans, groundnut, fish, chicken) and iron-rich foods at every meal. A colourful plate with vegetables, legumes, and carbohydrates serves both of you.' },
  { id: 'm4-2', title: 'Start Sleeping on Your Side', month: 4, icon: '🛌', dangerLevel: 'none', category: 'body',
    content: 'From month 4, sleeping on your left side improves blood flow to the placenta and reduces pressure on major blood vessels. Use a pillow between your knees for comfort.' },
  { id: 'm4-3', title: 'Second Trimester Energy Returns', month: 4, icon: '⚡', dangerLevel: 'none', category: 'body',
    content: 'Many women feel significantly better in the second trimester. Morning sickness usually eases. Use this energy to establish healthy routines — regular meals, walks, and rest.' },
  { id: 'm4-4', title: 'Dental Health in Pregnancy', month: 4, icon: '🦷', dangerLevel: 'warning', category: 'anc',
    content: 'Pregnancy hormones can cause gum swelling and bleeding (pregnancy gingivitis). Brush twice daily with fluoride toothpaste, floss, and visit a dentist. Untreated gum disease has been linked to premature labour.' },
  { id: 'm4-5', title: 'Danger Sign: Fever and Chills', month: 4, icon: '🌡️', dangerLevel: 'high', category: 'danger',
    content: 'A fever above 38°C during pregnancy can signal malaria, typhoid, or a urinary infection. All of these can trigger premature labour. Do not self-treat — seek medical attention the same day.' },
  { id: 'm4-6', title: 'Avoid Stress and Overwork', month: 4, icon: '🧘🏾‍♀️', dangerLevel: 'none', category: 'mental',
    content: 'Chronic stress raises cortisol, which can restrict fetal growth and raise blood pressure. Rest, delegate tasks, and ask for help. Your mental health directly affects the baby.' },

  // ── Month 5 ──────────────────────────────────────────────────────────────
  { id: 'm5-1', title: 'Your Baby is Moving!', month: 5, icon: '👶', dangerLevel: 'none', category: 'body',
    content: 'Between weeks 18–22, you will begin to feel "quickening" — gentle fluttering or butterfly movements. This is your baby. From this point, pay attention to how often you feel movement daily.' },
  { id: 'm5-2', title: 'Counting Kick Movements', month: 5, icon: '🦶', dangerLevel: 'warning', category: 'danger',
    content: 'Note your baby\'s normal pattern of movement. If you notice a significant DECREASE in movement that lasts more than 12 hours, this is a warning sign. Do not wait — go to a clinic to check the baby\'s heartbeat.' },
  { id: 'm5-3', title: 'Mid-Pregnancy Anatomy Scan', month: 5, icon: '🔬', dangerLevel: 'none', category: 'anc',
    content: 'Request a detailed ultrasound scan (anomaly scan) around weeks 18–22. It checks the baby\'s organs, spine, heart, and limbs and confirms growth is on track.' },
  { id: 'm5-4', title: 'Leg Cramps and Swelling', month: 5, icon: '🦵', dangerLevel: 'none', category: 'body',
    content: 'Mild foot and ankle swelling is common. Elevate your feet when resting. Leg cramps may indicate low calcium or magnesium — eat dairy, fish with soft bones, and leafy greens.' },
  { id: 'm5-5', title: 'Gestational Diabetes Screening', month: 5, icon: '🩸', dangerLevel: 'warning', category: 'anc',
    content: 'Ask your health worker about a glucose tolerance test (GTT) at this stage. Gestational diabetes is common and manageable if caught early. Unmanaged blood sugar harms both mother and baby.' },

  // ── Month 6 ──────────────────────────────────────────────────────────────
  { id: 'm6-1', title: 'Calcium for Bones and Teeth', month: 6, icon: '🥛', dangerLevel: 'none', category: 'nutrition',
    content: 'Your baby\'s bones are hardening. Increase calcium: milk, yogurt, soya milk, fish with edible bones, and calcium-fortified foods. Without enough calcium, your own bones will be depleted to feed the baby.' },
  { id: 'm6-2', title: 'Braxton Hicks Contractions', month: 6, icon: '🫁', dangerLevel: 'none', category: 'body',
    content: 'You may feel occasional mild tightening in your womb — these are Braxton Hicks (practice contractions). They are painless and irregular. If contractions become painful, regular, or occur before 37 weeks, go to hospital immediately.' },
  { id: 'm6-3', title: 'Danger Sign: Preterm Labour Warning', month: 6, icon: '🚨', dangerLevel: 'high', category: 'danger',
    content: 'Regular painful contractions before week 37, water breaking, or lower back pain with pelvic pressure before full term is a medical emergency. Go to hospital without delay — preterm birth requires specialist care.' },
  { id: 'm6-4', title: 'Emotional Changes Are Normal', month: 6, icon: '💭', dangerLevel: 'none', category: 'mental',
    content: 'Mood swings, anxiety, and worrying about the baby are normal. If you feel persistently sad, hopeless, or unable to function, speak to a health worker. Antenatal depression is real and treatable.' },
  { id: 'm6-5', title: 'Vitamin D and Sun Exposure', month: 6, icon: '☀️', dangerLevel: 'none', category: 'nutrition',
    content: 'Spend 15–30 minutes in morning sunlight daily — this stimulates vitamin D production, which supports your baby\'s bone and immune development. If you stay mostly indoors, ask your health worker about a supplement.' },

  // ── Month 7 ──────────────────────────────────────────────────────────────
  { id: 'm7-1', title: 'Blood Pressure Monitoring', month: 7, icon: '🩺', dangerLevel: 'warning', category: 'anc',
    content: 'Check your blood pressure at every antenatal visit. High blood pressure in the third trimester (140/90 or above) can be a sign of preeclampsia, which is dangerous. Report any headache, visual changes, or face swelling immediately.' },
  { id: 'm7-2', title: 'Danger Signs: Preeclampsia', month: 7, icon: '🚨', dangerLevel: 'high', category: 'danger',
    content: 'SEEK HELP IMMEDIATELY if you experience: severe persistent headache, blurred vision or spots in your eyes, sudden swelling of your face, hands, or feet, abdominal pain in the upper right. These are signs of preeclampsia — a life-threatening condition.' },
  { id: 'm7-3', title: 'Omega-3 for Brain Development', month: 7, icon: '🐟', dangerLevel: 'none', category: 'nutrition',
    content: 'Your baby\'s brain grows rapidly in the third trimester. Eat fatty fish (mackerel, sardines, salmon) 2-3 times per week for omega-3 fatty acids. Avoid large predatory fish (shark, swordfish) due to mercury content.' },
  { id: 'm7-4', title: 'Sleep Difficulties', month: 7, icon: '🌙', dangerLevel: 'none', category: 'body',
    content: 'Getting comfortable to sleep becomes harder. Try sleeping on your left side with pillows supporting your bump and between your knees. Short naps during the day help compensate for disturbed night sleep.' },
  { id: 'm7-5', title: 'Shortness of Breath', month: 7, icon: '🫁', dangerLevel: 'none', category: 'body',
    content: 'As the womb grows, it pushes against your diaphragm, making breathing feel harder. Mild breathlessness is normal. However, sudden severe breathlessness, chest pain, or palpitations are emergencies — call for help.' },
  { id: 'm7-6', title: 'Birth Companion Plan', month: 7, icon: '👩‍👩‍👦', dangerLevel: 'none', category: 'prep',
    content: 'Decide now who will accompany you to the hospital for delivery. Identify a backup person. A labour companion reduces anxiety and supports better birth outcomes.' },

  // ── Month 8 ──────────────────────────────────────────────────────────────
  { id: 'm8-1', title: 'Prepare Your Hospital Bag', month: 8, icon: '👜', dangerLevel: 'none', category: 'prep',
    content: 'Pack now: maternity pads, baby blankets, diapers, clean clothes for you and baby, your clinic card and documents, any prescribed medications, phone charger, water and snacks for your companion. Keep the bag near your door.' },
  { id: 'm8-2', title: 'Know Your Birth Plan', month: 8, icon: '📋', dangerLevel: 'none', category: 'prep',
    content: 'Confirm where you will deliver. Know the address, transport route, and contact number of the hospital. Identify who will drive you in an emergency. Tell your family your plan clearly.' },
  { id: 'm8-3', title: 'Danger Check: Decreased Fetal Movement', month: 8, icon: '🚨', dangerLevel: 'high', category: 'danger',
    content: 'At this stage your baby should move regularly throughout the day. If you notice the baby moving significantly less than usual, or no movement for several hours — do NOT wait until morning. Go to hospital immediately for a check.' },
  { id: 'm8-4', title: 'Pelvic Pain and Pressure', month: 8, icon: '⬇️', dangerLevel: 'none', category: 'body',
    content: 'As the baby moves lower into position, you may feel pressure in your pelvis, hips, and lower back. This is normal. Warm baths, gentle stretching, and rest help. Report sharp or shooting pain to your health worker.' },
  { id: 'm8-5', title: 'Group B Strep Test', month: 8, icon: '🧫', dangerLevel: 'warning', category: 'anc',
    content: 'Ask your health worker about Group B Streptococcus (GBS) screening at around week 36. GBS can be passed to the baby during birth and cause serious infections. If positive, antibiotics during labour protect the baby.' },
  { id: 'm8-6', title: 'Financial and Family Preparations', month: 8, icon: '🏠', dangerLevel: 'none', category: 'prep',
    content: 'Arrange finances for delivery costs, baby items, and the first few months. Confirm who will help at home after delivery. Postpartum support from family reduces maternal depression risk significantly.' },

  // ── Month 9 ──────────────────────────────────────────────────────────────
  { id: 'm9-1', title: 'Recognizing True Labour Signs', month: 9, icon: '🔔', dangerLevel: 'none', category: 'body',
    content: 'Real labour contractions are regular, get closer together, stronger, and don\'t stop with rest. Other signs: water breaking (even as a trickle), a blood-stained mucus "show". When any of these happen — head to hospital calmly.' },
  { id: 'm9-2', title: 'Do Not Delay Going to Hospital', month: 9, icon: '🚗', dangerLevel: 'warning', category: 'danger',
    content: 'When labour starts, go to hospital early. In Nigeria, road conditions and traffic can delay arrival. Arriving early gives doctors time to monitor you and reduces complications. Do not wait at home until contractions are very severe.' },
  { id: 'm9-3', title: 'Danger Sign: Cord or Unusual Presentation', month: 9, icon: '🚨', dangerLevel: 'high', category: 'danger',
    content: 'If you see or feel the umbilical cord outside the birth canal, feel something unusual (hand or foot) coming out first, or experience sudden severe pain — this is an emergency. Call for help and go to hospital immediately.' },
  { id: 'm9-4', title: 'Pain Management Options', month: 9, icon: '💉', dangerLevel: 'none', category: 'prep',
    content: 'Understand what pain relief is available at your delivery facility. Options may include breathing techniques, walking during early labour, warm baths, epidural (where available), or other methods. Ask your health worker in advance.' },
  { id: 'm9-5', title: 'Breastfeeding Preparation', month: 9, icon: '🤱🏾', dangerLevel: 'none', category: 'prep',
    content: 'Plan to breastfeed exclusively for the first 6 months. Breast milk protects against infections, promotes brain development, and is always safe and sterile. Ask a health worker or nurse to show you how to latch the baby correctly.' },
  { id: 'm9-6', title: 'Postpartum Warning Signs', month: 9, icon: '⚠️', dangerLevel: 'high', category: 'danger',
    content: 'AFTER delivery, seek help for: heavy bleeding that soaks more than one pad per hour, severe headache or vision problems, high fever, foul-smelling discharge, feeling extremely sad or detached from your baby. Postpartum complications are real and treatable.' },
];

const MONTHS_METADATA = [
  { month: 1, label: 'Month 1', weeks: 'Weeks 1–4', description: 'Your body begins to change.' },
  { month: 2, label: 'Month 2', weeks: 'Weeks 5–8', description: 'Heart and limbs begin to form.' },
  { month: 3, label: 'Month 3', weeks: 'Weeks 9–12', description: 'Placenta and organs form.' },
  { month: 4, label: 'Month 4', weeks: 'Weeks 13–16', description: 'Rapid bone and muscle growth.' },
  { month: 5, label: 'Month 5', weeks: 'Weeks 17–20', description: 'Baby kicks can be felt.' },
  { month: 6, label: 'Month 6', weeks: 'Weeks 21–24', description: 'Lungs and skin are developing.' },
  { month: 7, label: 'Month 7', weeks: 'Weeks 25–28', description: 'Brain activity begins.' },
  { month: 8, label: 'Month 8', weeks: 'Weeks 29–32', description: 'Active growth and positioning.' },
  { month: 9, label: 'Month 9', weeks: 'Weeks 33–40+', description: 'Final preparation for birth.' },
];

function getMonthStatus(monthNum: number, currentMonth: number): 'past' | 'current' | 'future' {
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

  // Sync expandedMonthId to user's current pregnancy month once the profile loads
  React.useEffect(() => {
    if (profile?.pregnancyMonth) {
      setExpandedMonthId(profile.pregnancyMonth);
    }
  }, [profile?.pregnancyMonth]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeColors.primary }]}>
          Pregnancy Guide
        </Text>
        <Text style={[styles.subtitle, { color: activeColors.textMuted }]}>
          Showing Month {currentMonth} guidance for your pregnancy stage
        </Text>
      </View>

      {/* Disclaimer Banner */}
      <View style={[styles.disclaimerBanner, { backgroundColor: '#D48C4520', borderColor: '#D48C45' }]}>
        <Ionicons name="information-circle-outline" size={18} color="#D48C45" />
        <Text style={[styles.disclaimerText, { color: '#D48C45' }]}>
          For education only. Every pregnancy is different — always consult a registered health worker before acting on any advice.
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
                      <Text style={[styles.monthLabelText, { color: activeColors.text }]}>
                        {monthMeta.label}
                      </Text>
                      <Text style={styles.statusIcon}>{getStatusIcon(status)}</Text>
                      {isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: activeColors.primary }]}>
                          <Text style={styles.currentBadgeText}>YOUR STAGE</Text>
                        </View>
                      )}
                    </View>
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
                  style={[styles.monthBodyContainer, { borderTopColor: activeColors.border }]}
                >
                  {/* Future-month advisory */}
                  {status === 'future' && (
                    <View style={[styles.futureNotice, { backgroundColor: activeColors.surface2 }]}>
                      <Ionicons name="lock-closed-outline" size={14} color={activeColors.textMuted} />
                      <Text style={[styles.futureNoticeText, { color: activeColors.textMuted }]}>
                        You haven't reached this stage yet. This information is shown for reference only. Focus on your current month first.
                      </Text>
                    </View>
                  )}

                  {monthTips.length === 0 ? (
                    <Text style={[styles.emptyTipsText, { color: activeColors.textMuted }]}>
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
                          <View style={[styles.tag, { backgroundColor: activeColors.emergency }]}>
                            <Text style={styles.tagText}>⚠️ DANGER SIGN</Text>
                          </View>
                        );
                      } else if (tip.dangerLevel === 'warning') {
                        tipCardBorderColor = '#D48C45';
                        warningTag = (
                          <View style={[styles.tag, { backgroundColor: '#D48C45' }]}>
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
                              <Text style={[styles.tipDisclaimer, { color: activeColors.textMuted }]}>
                                ⓘ This is general guidance. Your health worker's advice for your specific situation always takes priority.
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
  monthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  monthLabelText: { fontSize: 15, fontWeight: 'bold' },
  statusIcon: { fontSize: 14 },
  currentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 },
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
  futureNoticeText: { flex: 1, fontSize: 11, lineHeight: 15, fontStyle: 'italic' },
  emptyTipsText: { fontSize: 13, textAlign: 'center', fontStyle: 'italic', paddingVertical: 12 },
  tipItemCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tipHeaderTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  tipTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 },
  tipEmojiIcon: { fontSize: 22 },
  tipTitleWrapper: { flex: 1 },
  tag: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginBottom: 4 },
  tagText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 },
  tipTitleText: { fontSize: 14, fontWeight: 'bold' },
  tipExpandBody: { padding: 12, borderTopWidth: 0.5 },
  tipContentText: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  tipDisclaimer: { fontSize: 10, lineHeight: 14, fontStyle: 'italic' },
});
