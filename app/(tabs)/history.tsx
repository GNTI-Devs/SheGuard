import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage, DailyCheckIn } from '@/services/storage';

const SYMPTOMS = [
  { id: 'nausea', label: '🤢 Nausea / Vomiting', warning: false },
  { id: 'headache', label: '🤕 Severe Headache', warning: true },
  { id: 'swelling', label: '🦵 Swollen Face/Hands/Feet', warning: true },
  { id: 'vision', label: '👁️ Blurred Vision / Spots', warning: true },
  { id: 'cramps', label: '⚡ Severe Abdominal Pain', warning: true },
  { id: 'fatigue', label: '🥱 Extreme Fatigue', warning: false },
  { id: 'movement', label: '👶 Reduced Baby Movement', warning: true },
];

export default function HistoryScreen() {
  const storage = useStorage();
  const { conversations, loading: convsLoading, refreshConversations } = useConversationHistory();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCheckIns = async () => {
    try {
      setJournalLoading(true);
      const list = await storage.getDailyCheckIns();
      setCheckIns(list);
    } catch (err) {
      console.warn('Failed to load check-ins:', err);
    } finally {
      setJournalLoading(false);
    }
  };

  useEffect(() => {
    loadCheckIns();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshConversations(), loadCheckIns()]);
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (startedAt: string, endedAt?: string) => {
    if (!endedAt) return 'Active session';
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    const diffSeconds = Math.round((end - start) / 1000);
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'tired': return '🥱';
      case 'unwell': return '🤢';
      case 'anxious': return '🥺';
      default: return '🤰';
    }
  };

  const formatSymptomsList = (sList: string[]) => {
    if (!sList || sList.length === 0) return 'No symptoms reported';
    return sList.map((sId) => {
      const match = SYMPTOMS.find((s) => s.id === sId);
      return match ? match.label : sId;
    }).join(', ');
  };

  // Merge daily mood check-ins and LiveKit voice sessions into a single chronological timeline
  const timelineItems = [
    ...conversations.map((c) => ({
      id: c.id,
      type: 'voice' as const,
      timestamp: c.startedAt,
      title: c.hadEmergency ? '🚨 Emergency SOS Check' : '💬 Voice Consultation',
      subtitle: `Call duration: ${getDuration(c.startedAt, c.endedAt)}`,
      hadEmergency: c.hadEmergency,
      details: c,
    })),
    ...checkIns.map((ci) => {
      const hasDanger = ci.symptoms.some((sId) => {
        const sym = SYMPTOMS.find((s) => s.id === sId);
        return sym?.warning === true;
      });
      return {
        id: ci.id,
        type: 'checkin' as const,
        timestamp: ci.timestamp,
        title: hasDanger ? '🚨 Risk Alert Logged' : '🩺 Health Check-in',
        subtitle: `Logged mood: ${ci.mood.charAt(0).toUpperCase() + ci.mood.slice(1)} ${getMoodEmoji(ci.mood)}`,
        hadEmergency: hasDanger,
        details: ci,
      };
    })
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const loadingState = convsLoading || journalLoading;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeColors.primary }]}>
          Health Journal
        </Text>
        <Text style={[styles.subtitle, { color: activeColors.textMuted }]}>
          Chronological logs of your daily check-ins and AI voice consultations
        </Text>
      </View>

      {loadingState && timelineItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={activeColors.primary} />
        </View>
      ) : timelineItems.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={activeColors.primary} />
          }
        >
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={[styles.emptyText, { color: activeColors.text }]}>
            Your journal is empty
          </Text>
          <Text style={[styles.emptySubtext, { color: activeColors.textMuted }]}>
            Log how you feel on the Home screen or call SheGuard AI to record your first timeline entry.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={activeColors.primary} />
          }
        >
          {timelineItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const isVoice = item.type === 'voice';

            return (
              <View
                key={item.id}
                style={[
                  styles.journalCard,
                  {
                    backgroundColor: activeColors.surface,
                    borderColor: item.hadEmergency
                      ? activeColors.emergency
                      : activeColors.border,
                  },
                ]}
              >
                {/* Header Toggle Row */}
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  style={styles.cardHeader}
                  activeOpacity={0.8}
                >
                  <View style={styles.headerDetails}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.cardTitle, { color: activeColors.text }]}>
                        {item.title}
                      </Text>
                      {item.hadEmergency && (
                        <View style={[styles.sosBadge, { backgroundColor: activeColors.emergency }]}>
                          <Text style={styles.sosText}>ALERT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardDate, { color: activeColors.textMuted }]}>
                      {formatDate(item.timestamp)} • {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={activeColors.textMuted}
                  />
                </TouchableOpacity>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <View style={[styles.expandBody, { borderTopColor: activeColors.border }]}>
                    {isVoice ? (
                      // Voice transcript bubbles rendering
                      <View style={styles.voiceSection}>
                        <Text style={[styles.bodySectionLabel, { color: activeColors.textMuted }]}>
                          Call Transcript:
                        </Text>
                        {item.details.messages.length === 0 ? (
                          <Text style={[styles.noMsgText, { color: activeColors.textMuted }]}>
                            No conversation transcript recorded for this check-in.
                          </Text>
                        ) : (
                          <View style={styles.bubblesFeed}>
                            {item.details.messages.map((msg: any, index: number) => {
                              const isUser = msg.role === 'user';
                              return (
                                <View
                                  key={index}
                                  style={[
                                    styles.bubbleWrapper,
                                    {
                                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                                      alignItems: isUser ? 'flex-end' : 'flex-start',
                                    },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.bubble,
                                      {
                                        backgroundColor: isUser
                                          ? activeColors.primary
                                          : activeColors.surface2,
                                        borderTopRightRadius: isUser ? 2 : 12,
                                        borderTopLeftRadius: isUser ? 12 : 2,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.bubbleText,
                                        { color: isUser ? '#FFFFFF' : activeColors.text },
                                      ]}
                                    >
                                      {msg.text}
                                    </Text>
                                  </View>
                                  <Text style={[styles.bubbleTime, { color: activeColors.textMuted }]}>
                                    {isUser ? 'You' : 'SheGuard AI'}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ) : (
                      // Symptom & mood checklist details rendering
                      <View style={styles.checkinDetails}>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: activeColors.textMuted }]}>Logged Symptoms:</Text>
                          <Text style={[styles.detailValueText, { color: activeColors.text }]}>
                            {formatSymptomsList(item.details.symptoms)}
                          </Text>
                        </View>
                        {item.details.notes ? (
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: activeColors.textMuted }]}>Notes / Voice memo:</Text>
                            <Text style={[styles.notesBodyText, { color: activeColors.text, backgroundColor: activeColors.surface2 }]}>
                              "{item.details.notes}"
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
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
    paddingBottom: 16,
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 120,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  journalCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  sosBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardDate: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  expandBody: {
    padding: 16,
    borderTopWidth: 1.5,
  },
  bodySectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  noMsgText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  voiceSection: {
    gap: 6,
  },
  bubblesFeed: {
    gap: 10,
  },
  bubbleWrapper: {
    maxWidth: '85%',
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
    alignSelf: 'flex-start',
    paddingLeft: 4,
  },
  checkinDetails: {
    gap: 14,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailValueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesBodyText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
});
