import { useState, useEffect } from 'react';
import { useStorage, UserProfile } from '@/services/storage';

export function useUserProfile() {
  const storage = useStorage();
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await storage.getProfile();
      setProfileState(data);
    } catch (e) {
      console.error('Failed to load user profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [storage]);

  const saveProfile = async (updatedProfile: UserProfile) => {
    try {
      await storage.saveProfile(updatedProfile);
      setProfileState(updatedProfile);
      // Also sync current language key in key-value store
      await storage.set('language', updatedProfile.language);
    } catch (e) {
      console.error('Failed to save user profile:', e);
      throw e;
    }
  };

  const createDemoProfile = async () => {
    // Demo patient is Amina, 6 months pregnant (3rd trimester prep), Yoruba preferred for demo
    const demoProfile: UserProfile = {
      id: 'demo-amina-123',
      name: 'Amina',
      phone: '+2348012345678',
      avatar: 'avatar_1',
      language: 'pcm', // Default to Pidgin for general demo comfort
      pregnancyMonth: 6,
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months from now
      isDemo: true,
      emergencyContacts: ['+234 801 234 5678', '+234 802 345 6789'],
      createdAt: new Date().toISOString(),
    };

    await saveProfile(demoProfile);
    return demoProfile;
  };

  const clearProfile = async () => {
    try {
      await storage.clearProfile();
      await storage.remove('language');
      setProfileState(null);
    } catch (e) {
      console.error('Failed to clear profile:', e);
    }
  };

  return {
    profile,
    loading,
    saveProfile,
    createDemoProfile,
    clearProfile,
    refreshProfile: loadProfile,
  };
}
