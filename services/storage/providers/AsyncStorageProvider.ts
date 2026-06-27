import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  IStorageService,
  UserProfile,
  ConversationRecord,
  AppointmentRecord,
  DailyCheckIn,
} from '../IStorageService';

// In-memory fallback map to survive native AsyncStorage module failures/missing links
const inMemoryStore = new Map<string, string>();

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`AsyncStorage get failed for key "${key}", using in-memory store.`, e);
      return inMemoryStore.get(key) || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`AsyncStorage set failed for key "${key}", using in-memory store.`, e);
      inMemoryStore.set(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`AsyncStorage remove failed for key "${key}", using in-memory store.`, e);
      inMemoryStore.delete(key);
    }
  }
};

export class AsyncStorageProvider implements IStorageService {
  constructor() {
    // Bind all class methods to prevent context loss when destructured
    this.getProfile = this.getProfile.bind(this);
    this.saveProfile = this.saveProfile.bind(this);
    this.clearProfile = this.clearProfile.bind(this);
    this.saveConversation = this.saveConversation.bind(this);
    this.getConversations = this.getConversations.bind(this);
    this.getConversation = this.getConversation.bind(this);
    this.saveAppointment = this.saveAppointment.bind(this);
    this.getAppointments = this.getAppointments.bind(this);
    this.markAppointmentComplete = this.markAppointmentComplete.bind(this);
    this.saveDailyCheckIn = this.saveDailyCheckIn.bind(this);
    this.getDailyCheckIns = this.getDailyCheckIns.bind(this);
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.remove = this.remove.bind(this);
  }

  // --- Profile Methods ---
  async getProfile(): Promise<UserProfile | null> {

    try {
      const raw = await safeStorage.getItem('profile');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to get profile from AsyncStorage:', e);
      return null;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await safeStorage.setItem('profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile to AsyncStorage:', e);
    }
  }

  async clearProfile(): Promise<void> {
    try {
      await safeStorage.removeItem('profile');
    } catch (e) {
      console.error('Failed to clear profile in AsyncStorage:', e);
    }
  }

  // --- Conversation History Methods ---
  async saveConversation(record: ConversationRecord): Promise<void> {
    try {
      const listRaw = await safeStorage.getItem('conversations');
      const list: ConversationRecord[] = listRaw ? JSON.parse(listRaw) : [];

      // Update existing or push new
      const index = list.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        list[index] = record;
      } else {
        list.push(record);
      }

      await safeStorage.setItem('conversations', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save conversation in AsyncStorage:', e);
    }
  }

  async getConversations(): Promise<ConversationRecord[]> {
    try {
      const raw = await safeStorage.getItem('conversations');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to get conversations from AsyncStorage:', e);
      return [];
    }
  }

  async getConversation(id: string): Promise<ConversationRecord | null> {
    try {
      const list = await this.getConversations();
      return list.find((item) => item.id === id) || null;
    } catch (e) {
      console.error('Failed to get conversation by id from AsyncStorage:', e);
      return null;
    }
  }

  // --- Appointment/Reminder Methods ---
  async saveAppointment(appt: AppointmentRecord): Promise<void> {
    try {
      const listRaw = await safeStorage.getItem('appointments');
      const list: AppointmentRecord[] = listRaw ? JSON.parse(listRaw) : [];

      const index = list.findIndex((item) => item.id === appt.id);
      if (index >= 0) {
        list[index] = appt;
      } else {
        list.push(appt);
      }

      await safeStorage.setItem('appointments', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save appointment in AsyncStorage:', e);
    }
  }

  async getAppointments(): Promise<AppointmentRecord[]> {
    try {
      const raw = await safeStorage.getItem('appointments');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to get appointments from AsyncStorage:', e);
      return [];
    }
  }

  async markAppointmentComplete(id: string): Promise<void> {
    try {
      const list = await this.getAppointments();
      const item = list.find((a) => a.id === id);
      if (item) {
        item.completed = true;
        await safeStorage.setItem('appointments', JSON.stringify(list));
      }
    } catch (e) {
      console.error('Failed to mark appointment complete in AsyncStorage:', e);
    }
  }

  // --- Generic Key-Value Methods ---
  async get(key: string): Promise<string | null> {
    try {
      return await safeStorage.getItem(key);
    } catch (e) {
      console.error(`Failed to get key ${key} from AsyncStorage:`, e);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await safeStorage.setItem(key, value);
    } catch (e) {
      console.error(`Failed to set key ${key} in AsyncStorage:`, e);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await safeStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove key ${key} in AsyncStorage:`, e);
    }
  }

  // --- Daily Check-in Methods ---
  async saveDailyCheckIn(checkIn: DailyCheckIn): Promise<void> {
    try {
      const listRaw = await safeStorage.getItem('daily_checkins');
      const list: DailyCheckIn[] = listRaw ? JSON.parse(listRaw) : [];

      const index = list.findIndex((item) => item.id === checkIn.id);
      if (index >= 0) {
        list[index] = checkIn;
      } else {
        list.push(checkIn);
      }

      await safeStorage.setItem('daily_checkins', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save daily check-in in AsyncStorage:', e);
    }
  }

  async getDailyCheckIns(): Promise<DailyCheckIn[]> {
    try {
      const raw = await safeStorage.getItem('daily_checkins');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to get daily check-ins from AsyncStorage:', e);
      return [];
    }
  }
}
