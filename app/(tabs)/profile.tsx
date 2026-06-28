import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useLanguage, LANGUAGES, LanguageCode } from '@/hooks/useLanguage';
import { useThemeContext } from '@/hooks/useThemeContext';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCustomAlert } from '@/components/CustomAlert';
import { useScreenAudio } from '@/hooks/useScreenAudio';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const { profile, saveProfile, clearProfile } = useUserProfile();
  const { language, setLanguage } = useLanguage();
  const { colorScheme, themePreference, setThemePreference } =
    useThemeContext();
  const activeColors = Colors[colorScheme];
  const router = useRouter();
  const { showAlert, AlertModal } = useCustomAlert();
  const { play, stop, isPlaying, activeKey } = useScreenAudio('profile_setup');

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const [newContact, setNewContact] = useState('');
  const [isEditingLang, setIsEditingLang] = useState(false);
  const [doctorPhone, setDoctorPhone] = useState(profile?.doctorPhone || '');

  React.useEffect(() => {
    if (profile?.doctorPhone !== undefined) {
      setDoctorPhone(profile.doctorPhone);
    }
  }, [profile?.doctorPhone]);

  const handleUpdateDoctorPhone = async (num: string) => {
    if (!profile) return;
    const updatedProfile = { ...profile, doctorPhone: num.trim() || undefined };
    try {
      await saveProfile(updatedProfile);
    } catch (e) {
      console.error('Failed to update doctor phone:', e);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.trim() || !profile) return;
    const updatedContacts = [
      ...(profile.emergencyContacts || []),
      newContact.trim(),
    ];
    const updatedProfile = { ...profile, emergencyContacts: updatedContacts };
    try {
      await saveProfile(updatedProfile);
      setNewContact('');
    } catch (e) {
      showAlert({
        title: 'Error',
        message: 'Failed to add contact.',
        type: 'danger',
        buttons: [{ text: 'OK' }],
      });
    }
  };

  const handleRemoveContact = async (index: number) => {
    if (!profile) return;
    const updatedContacts = (profile.emergencyContacts || []).filter(
      (_, i) => i !== index
    );
    const updatedProfile = { ...profile, emergencyContacts: updatedContacts };
    try {
      await saveProfile(updatedProfile);
    } catch (e) {
      showAlert({
        title: 'Error',
        message: 'Failed to remove contact.',
        type: 'danger',
        buttons: [{ text: 'OK' }],
      });
    }
  };

  const handleLangChange = async (code: LanguageCode) => {
    await setLanguage(code);
    setIsEditingLang(false);
  };

  const handleLogout = () => {
    showAlert({
      title: 'Sign Out & Reset',
      message:
        'Are you sure you want to sign out? This will clear your offline profile details and return you to the welcome screen.',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reset',
          style: 'destructive',
          onPress: async () => {
            await clearProfile();
            router.replace('/(onboarding)/language-select');
          },
        },
      ],
    });
  };

  if (!profile) {
    return (
      <View
        style={[styles.center, { backgroundColor: activeColors.background }]}
      >
        <ActivityIndicator size="large" color={activeColors.primary} />
      </View>
    );
  }

  const selectedLang =
    LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const getAvatarEmoji = (avKey: string) => {
    switch (avKey) {
      case 'avatar_1':
        return '🤰🏼';
      case 'avatar_2':
        return '🤰🏽';
      case 'avatar_3':
        return '🤰🏾';
      case 'avatar_4':
        return '🤱🏾';
      default:
        return '🤰';
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
        {/* Screen Header with Audio Guide */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: activeColors.primary,
            }}
          >
            Profile & Settings
          </Text>
          <TouchableOpacity
            onPress={() => play('settings')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: activeColors.border,
              backgroundColor:
                activeKey === 'settings' && isPlaying
                  ? activeColors.primary
                  : activeColors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                activeKey === 'settings' && isPlaying
                  ? 'volume-mute'
                  : 'volume-high'
              }
              size={22}
              color={
                activeKey === 'settings' && isPlaying
                  ? '#FFFFFF'
                  : activeColors.primary
              }
            />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.header}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.primary,
                borderWidth: 2,
              },
            ]}
          >
            <Text style={{ fontSize: 44 }}>
              {getAvatarEmoji(profile.avatar)}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: activeColors.text }]}>
            {profile.name}
          </Text>
          <Text
            style={[styles.profileStatus, { color: activeColors.textMuted }]}
          >
            Pregnancy Month {profile.pregnancyMonth} (Week{' '}
            {profile.pregnancyMonth * 4})
          </Text>
        </View>

        {/* Language Section */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="language" size={20} color={activeColors.primary} />
            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
              Preferred Language
            </Text>
          </View>

          {!isEditingLang ? (
            <View style={styles.langDisplayRow}>
              <Text style={[styles.langText, { color: activeColors.text }]}>
                {selectedLang.flag} {selectedLang.label} (
                {selectedLang.nativeLabel})
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditingLang(true)}
                style={[
                  styles.editButton,
                  { backgroundColor: activeColors.surface2 },
                ]}
              >
                <Text
                  style={[
                    styles.editButtonText,
                    { color: activeColors.primary },
                  ]}
                >
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.langList}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLangChange(lang.code)}
                  style={[
                    styles.langCell,
                    {
                      backgroundColor:
                        language === lang.code
                          ? activeColors.surface2
                          : 'transparent',
                      borderColor: activeColors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.langCellText, { color: activeColors.text }]}
                  >
                    {lang.flag} {lang.label} ({lang.nativeLabel})
                  </Text>
                  {language === lang.code && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={activeColors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setIsEditingLang(false)}
                style={styles.cancelLang}
              >
                <Text
                  style={{ color: activeColors.textMuted, fontWeight: 'bold' }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Emergency Contacts Section */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={20} color={activeColors.emergency} />
            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
              Emergency Contacts
            </Text>
          </View>
          <Text style={[styles.sectionHint, { color: activeColors.textMuted }]}>
            These phone numbers will be alerted in case of critical preeclampsia
            danger signs.
          </Text>

          {/* List */}
          <View style={styles.contactsList}>
            {(profile.emergencyContacts || []).map((contact, i) => (
              <View
                key={i}
                style={[
                  styles.contactRow,
                  { borderBottomColor: activeColors.border },
                ]}
              >
                <View style={styles.contactInfo}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={activeColors.textMuted}
                  />
                  <Text
                    style={[styles.contactText, { color: activeColors.text }]}
                  >
                    {contact}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveContact(i)}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={activeColors.emergency}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add input */}
          <View style={styles.addContactRow}>
            <TextInput
              style={[
                styles.contactInput,
                {
                  color: activeColors.text,
                  borderColor: activeColors.border,
                  backgroundColor: activeColors.surface2,
                },
              ]}
              placeholder="+234..."
              placeholderTextColor={activeColors.textMuted}
              keyboardType="phone-pad"
              value={newContact}
              onChangeText={setNewContact}
            />
            <TouchableOpacity
              onPress={handleAddContact}
              style={[
                styles.addContactButton,
                { backgroundColor: activeColors.primary },
              ]}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Doctor's Contact */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={20} color={activeColors.primary} />
            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
              My Doctor's Contact
            </Text>
          </View>
          <Text style={[styles.sectionHint, { color: activeColors.textMuted }]}>
            Set your primary doctor's phone number. In case of emergency
            check-ins, you can easily call or alert your doctor.
          </Text>
          <View style={styles.addContactRow}>
            <TextInput
              style={[
                styles.contactInput,
                {
                  color: activeColors.text,
                  borderColor: activeColors.border,
                  backgroundColor: activeColors.surface2,
                },
              ]}
              placeholder="+234..."
              placeholderTextColor={activeColors.textMuted}
              keyboardType="phone-pad"
              value={doctorPhone}
              onChangeText={(text) => {
                setDoctorPhone(text);
                handleUpdateDoctorPhone(text);
              }}
            />
          </View>
        </View>

        {/* Theme Toggle */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons
              name="contrast-outline"
              size={20}
              color={activeColors.primary}
            />
            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>
              Appearance
            </Text>
          </View>
          <Text style={[styles.sectionHint, { color: activeColors.textMuted }]}>
            Choose your preferred display mode.
          </Text>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map((pref) => {
              const isActive = themePreference === pref;
              const label =
                pref === 'light'
                  ? '☀️ Light'
                  : pref === 'dark'
                  ? '🌙 Dark'
                  : '📱 System';
              return (
                <TouchableOpacity
                  key={pref}
                  onPress={() => setThemePreference(pref)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive
                        ? activeColors.primary
                        : activeColors.surface2,
                      borderColor: isActive
                        ? activeColors.primary
                        : activeColors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isActive ? '#FFFFFF' : activeColors.text },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings Area */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              { borderColor: activeColors.emergency },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={activeColors.emergency}
            />
            <Text
              style={[
                styles.logoutButtonText,
                { color: activeColors.emergency },
              ]}
            >
              Sign Out & Reset Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <AlertModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileStatus: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHint: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  langDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langText: {
    fontSize: 15,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  langList: {
    gap: 8,
  },
  langCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  langCellText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelLang: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactsList: {
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addContactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addContactButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutWrapper: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
