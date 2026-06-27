import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useLanguage } from '@/hooks/useLanguage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserProfile } from '@/services/storage';

const AVATARS = [
  { id: 'avatar_1', emoji: '🤰🏼', label: 'Early stage' },
  { id: 'avatar_2', emoji: '🤰🏽', label: 'Mid stage' },
  { id: 'avatar_3', emoji: '🤰🏾', label: 'Late stage' },
  { id: 'avatar_4', emoji: '🤱🏾', label: 'Postnatal' },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const { saveProfile } = useUserProfile();
  const { language } = useLanguage();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState('');
  const [pregnancyMonth, setPregnancyMonth] = useState<number>(3); // Default to month 3
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');

  const handleComplete = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    // Estimate due date based on pregnancy month: 9 months total.
    // 9 - current month = remaining months.
    const remainingMonths = 9 - pregnancyMonth;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + remainingMonths);

    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      phone: phone || '',
      avatar: selectedAvatar,
      language: language,
      pregnancyMonth: pregnancyMonth,
      dueDate: dueDate.toISOString(),
      isDemo: false,
      emergencyContacts: [],
      createdAt: new Date().toISOString(),
    };

    try {
      await saveProfile(newProfile);
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.icon}>📝</Text>
            <Text style={[styles.title, { color: activeColors.primary }]}>
              Your Profile
            </Text>
            <Text style={[styles.subtitle, { color: activeColors.textMuted }]}>
              Please tell us about your pregnancy so SheGuard can give tailored
              advice.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>
                Your Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: activeColors.text,
                    borderColor: activeColors.border,
                    backgroundColor: activeColors.surface,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={activeColors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Avatar Selector */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>
                Choose Avatar
              </Text>
              <Text style={[styles.inputHint, { color: activeColors.textMuted }]}>
                Select an icon representing your current stage
              </Text>
              <View style={styles.avatarGrid}>
                {AVATARS.map((av) => {
                  const isSelected = selectedAvatar === av.id;
                  return (
                    <TouchableOpacity
                      key={av.id}
                      onPress={() => setSelectedAvatar(av.id)}
                      style={[
                        styles.avatarCell,
                        {
                          backgroundColor: isSelected
                            ? activeColors.primary + '15'
                            : activeColors.surface,
                          borderColor: isSelected
                            ? activeColors.primary
                            : activeColors.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.avatarEmoji}>{av.emoji}</Text>
                      <Text
                        style={[
                          styles.avatarLabel,
                          { color: isSelected ? activeColors.primary : activeColors.textMuted },
                        ]}
                      >
                        {av.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Pregnancy Month Picker */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>
                Pregnancy Stage: Month {pregnancyMonth}
              </Text>
              <Text
                style={[styles.inputHint, { color: activeColors.textMuted }]}
              >
                Tap your current pregnancy month (1-9)
              </Text>

              <View style={styles.monthGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((month) => {
                  const isSelected = pregnancyMonth === month;
                  return (
                    <TouchableOpacity
                      key={month}
                      onPress={() => setPregnancyMonth(month)}
                      style={[
                        styles.monthCell,
                        {
                          backgroundColor: isSelected
                            ? activeColors.primary
                            : activeColors.surface,
                          borderColor: isSelected
                            ? activeColors.primary
                            : activeColors.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.monthCellText,
                          { color: isSelected ? '#FFFFFF' : activeColors.text },
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleComplete}
              style={[styles.button, { backgroundColor: activeColors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Complete Setup</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '30%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  avatarCell: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
