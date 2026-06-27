import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AuthDemoScreen() {
  const router = useRouter();
  const { createDemoProfile } = useUserProfile();
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];

  const [phone, setPhone] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLogin = () => {
    if (!phone || phone.length < 9) {
      alert('Please enter a valid phone number');
      return;
    }
    // For standard login, we take them to profile-setup to set their custom details
    router.push({
      pathname: '/(onboarding)/profile-setup',
      params: { phone }
    });
  };

  const handleTryDemo = async () => {
    try {
      setDemoLoading(true);
      // Seeding storage with Amina's demo profile (Pidgin preferred, 6 months)
      await createDemoProfile();
      // Redirecting straight to tabs since profile is established!
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
      alert('Failed to initialize demo profile');
    } finally {
      setDemoLoading(false);
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons
              name="female"
              size={64}
              color={activeColors.primary}
              style={styles.icon}
            />
            <Text style={[styles.title, { color: activeColors.primary }]}>
              Join SheGuard
            </Text>
            <Text style={[styles.subtitle, { color: activeColors.textMuted }]}>
              Enter your mobile number to sign up or use the fully
              pre-configured demo.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: activeColors.text }]}>
                Phone Number
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
                placeholder="+234..."
                placeholderTextColor={activeColors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.button, { backgroundColor: activeColors.primary }]}
              activeOpacity={0.8}
              disabled={demoLoading}
            >
              <Text style={styles.buttonText}>Sign In / Create Profile</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: activeColors.border },
                ]}
              />
              <Text
                style={[styles.dividerText, { color: activeColors.textMuted }]}
              >
                OR
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: activeColors.border },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={handleTryDemo}
              style={[
                styles.demoButton,
                {
                  borderColor: activeColors.primary,
                  backgroundColor: activeColors.surface,
                },
              ]}
              activeOpacity={0.8}
              disabled={demoLoading}
            >
              {demoLoading ? (
                <ActivityIndicator color={activeColors.primary} />
              ) : (
                <Text
                  style={[
                    styles.demoButtonText,
                    { color: activeColors.primary },
                  ]}
                >
                  Try Fully Configured Demo
                </Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.demoHint, { color: activeColors.textMuted }]}>
              The demo logs you in instantly as Amina (6 months pregnant) to let
              you test the LiveKit voice agent immediately.
            </Text>
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
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  demoButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
});
