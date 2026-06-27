import { useState, useEffect } from 'react';
import { useStorage } from '@/services/storage';

export type LanguageCode = 'en' | 'ha' | 'yo' | 'ig' | 'pcm';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ha', label: 'Hausa', nativeLabel: 'Harshen Hausa', flag: '🇳🇬' },
  { code: 'yo', label: 'Yoruba', nativeLabel: 'Èdè Yorùbá', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', nativeLabel: 'Asụsụ Igbo', flag: '🇳🇬' },
  { code: 'pcm', label: 'Pidgin', nativeLabel: 'Nigerian Pidgin', flag: '🇳🇬' },
];

export function useLanguage() {
  const storage = useStorage();
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLang() {
      try {
        const stored = await storage.get('language');
        if (stored) {
          setLanguageState(stored as LanguageCode);
        } else {
          // If no language stored, check profile
          const profile = await storage.getProfile();
          if (profile?.language) {
            setLanguageState(profile.language);
            await storage.set('language', profile.language);
          }
        }
      } catch (e) {
        console.error('Failed to load language:', e);
      } finally {
        setLoading(false);
      }
    }
    loadLang();
  }, [storage]);

  const setLanguage = async (code: LanguageCode) => {
    try {
      setLanguageState(code);
      await storage.set('language', code);

      // If user has a profile, sync language with profile as well
      const profile = await storage.getProfile();
      if (profile && profile.language !== code) {
        profile.language = code;
        await storage.saveProfile(profile);
      }
    } catch (e) {
      console.error('Failed to save language:', e);
    }
  };

  const getLanguageDetails = (): LanguageInfo => {
    return LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  };

  return {
    language,
    setLanguage,
    loading,
    getLanguageDetails,
    languages: LANGUAGES,
  };
}
