import { Client, Databases, Account, ID, Query } from 'react-native-appwrite';
import { AsyncStorageProvider } from './AsyncStorageProvider';
import {
  IStorageService,
  UserProfile,
  ConversationRecord,
  AppointmentRecord,
  DailyCheckIn,
} from '../IStorageService';

// Initialize the Appwrite Client using the project details retrieved from context
const appwriteClient = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68b412c200088ae94f6a');

const databases = new Databases(appwriteClient);
const account = new Account(appwriteClient);

const DATABASE_ID = 'sheguard';
const COLLECTIONS = {
  PROFILES: 'profiles',
  CONVERSATIONS: 'conversations',
  APPOINTMENTS: 'appointments',
  DAILY_CHECKINS: 'daily_checkins',
  KEYVALUE: 'keyvalue',
};

export class AppwriteProvider implements IStorageService {
  private localFallback = new AsyncStorageProvider();
  private isUserAuthenticated = false;
  private currentUserId = 'anonymous';

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
    this.initSession = this.initSession.bind(this);

    this.initSession();
  }

  // Ensure an Appwrite account session is active (creating an anonymous session if none exists)
  private async initSession() {
    try {
      const user = await account.get();
      this.currentUserId = user.$id;
      this.isUserAuthenticated = true;
    } catch (e) {
      try {
        // Fallback to anonymous session to allow database interactions
        const session = await account.createAnonymousSession();
        this.currentUserId = session.userId;
        this.isUserAuthenticated = true;
      } catch (err) {
        console.warn(
          'Appwrite: Failed to initialize session, running in local-only mode.',
          err
        );
      }
    }
  }

  // --- Profile Methods ---
  async getProfile(): Promise<UserProfile | null> {
    try {
      await this.initSession();
      if (!this.isUserAuthenticated)
        return await this.localFallback.getProfile();

      // Retrieve profile matching the current user ID
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        this.currentUserId
      );

      return {
        id: doc.user_id,
        name: doc.display_name,
        phone: doc.phone || '',
        avatar: doc.avatar || 'avatar_1',
        language: doc.language,
        pregnancyMonth: doc.pregnancy_month,
        dueDate: doc.due_date,
        isDemo: doc.is_demo,
        emergencyContacts: doc.emergency_contacts || [],
        createdAt: doc.created_at,
      };
    } catch (e: any) {
      console.warn(
        `Appwrite: getProfile failed (Code: ${
          e.code || 'unknown'
        }). Falling back to local storage.`,
        e.message
      );
      return await this.localFallback.getProfile();
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    // Save locally first to guarantee offline availability
    await this.localFallback.saveProfile(profile);

    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return;

      const data = {
        user_id: profile.id,
        display_name: profile.name,
        phone: profile.phone,
        avatar: profile.avatar,
        language: profile.language,
        pregnancy_month: profile.pregnancyMonth,
        due_date: profile.dueDate,
        is_demo: profile.isDemo,
        emergency_contacts: profile.emergencyContacts,
        created_at: profile.createdAt,
      };

      try {
        // Update if document exists
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          this.currentUserId,
          data
        );
      } catch (updateErr: any) {
        // If not found, create new
        if (updateErr.code === 404) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            this.currentUserId,
            data
          );
        } else {
          throw updateErr;
        }
      }
    } catch (e: any) {
      console.warn(
        `Appwrite: saveProfile failed (Code: ${
          e.code || 'unknown'
        }). Saved locally only.`,
        e.message
      );
    }
  }

  async clearProfile(): Promise<void> {
    await this.localFallback.clearProfile();
    try {
      await this.initSession();
      if (this.isUserAuthenticated) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          this.currentUserId
        );
      }
    } catch (e: any) {
      console.warn(
        `Appwrite: clearProfile database deletion failed.`,
        e.message
      );
    }
  }

  // --- Conversation History Methods ---
  async saveConversation(record: ConversationRecord): Promise<void> {
    await this.localFallback.saveConversation(record);
    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return;

      const data = {
        conversation_id: record.id,
        user_id: this.currentUserId,
        room_name: record.roomName,
        started_at: record.startedAt,
        ended_at: record.endedAt || '',
        had_emergency: record.hadEmergency,
        messages_json: JSON.stringify(record.messages),
      };

      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CONVERSATIONS,
          record.id,
          data
        );
      } catch (updateErr: any) {
        if (updateErr.code === 404) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.CONVERSATIONS,
            record.id,
            data
          );
        } else {
          throw updateErr;
        }
      }
    } catch (e: any) {
      console.warn(
        `Appwrite: saveConversation database sync failed. Saved locally only.`,
        e.message
      );
    }
  }

  async getConversations(): Promise<ConversationRecord[]> {
    try {
      await this.initSession();
      if (!this.isUserAuthenticated)
        return await this.localFallback.getConversations();

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        [
          Query.equal('user_id', this.currentUserId),
          Query.orderDesc('started_at'),
        ]
      );

      return response.documents.map((doc: any) => ({
        id: doc.conversation_id,
        roomName: doc.room_name,
        startedAt: doc.started_at,
        endedAt: doc.ended_at,
        hadEmergency: doc.had_emergency,
        messages: JSON.parse(doc.messages_json || '[]'),
      }));
    } catch (e: any) {
      console.warn(
        `Appwrite: getConversations failed. Fetching local fallback logs.`,
        e.message
      );
      return await this.localFallback.getConversations();
    }
  }

  async getConversation(id: string): Promise<ConversationRecord | null> {
    try {
      await this.initSession();
      if (!this.isUserAuthenticated)
        return await this.localFallback.getConversation(id);

      const doc: any = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        id
      );
      return {
        id: doc.conversation_id,
        roomName: doc.room_name,
        startedAt: doc.started_at,
        endedAt: doc.ended_at,
        hadEmergency: doc.had_emergency,
        messages: JSON.parse(doc.messages_json || '[]'),
      };
    } catch (e: any) {
      console.warn(
        `Appwrite: getConversation by ID failed. Fetching local fallback.`,
        e.message
      );
      return await this.localFallback.getConversation(id);
    }
  }

  // --- Appointment/Reminder Methods ---
  async saveAppointment(appt: AppointmentRecord): Promise<void> {
    await this.localFallback.saveAppointment(appt);
    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return;

      const data = {
        appointment_id: appt.id,
        user_id: this.currentUserId,
        title: appt.title,
        datetime: appt.datetime,
        location: appt.location || '',
        completed: appt.completed,
      };

      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.APPOINTMENTS,
          appt.id,
          data
        );
      } catch (updateErr: any) {
        if (updateErr.code === 404) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.APPOINTMENTS,
            appt.id,
            data
          );
        } else {
          throw updateErr;
        }
      }
    } catch (e: any) {
      console.warn(
        `Appwrite: saveAppointment database sync failed. Saved locally only.`,
        e.message
      );
    }
  }

  async getAppointments(): Promise<AppointmentRecord[]> {
    try {
      await this.initSession();
      if (!this.isUserAuthenticated)
        return await this.localFallback.getAppointments();

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.APPOINTMENTS,
        [Query.equal('user_id', this.currentUserId)]
      );

      return response.documents.map((doc: any) => ({
        id: doc.appointment_id,
        title: doc.title,
        datetime: doc.datetime,
        location: doc.location,
        completed: doc.completed,
      }));
    } catch (e: any) {
      console.warn(
        `Appwrite: getAppointments failed. Fetching local fallback.`,
        e.message
      );
      return await this.localFallback.getAppointments();
    }
  }

  async markAppointmentComplete(id: string): Promise<void> {
    await this.localFallback.markAppointmentComplete(id);
    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return;

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.APPOINTMENTS,
        id,
        {
          completed: true,
        }
      );
    } catch (e: any) {
      console.warn(
        `Appwrite: markAppointmentComplete database sync failed.`,
        e.message
      );
    }
  }

  // --- Generic Key-Value Methods ---
  async get(key: string): Promise<string | null> {
    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return await this.localFallback.get(key);

      const docId = `${this.currentUserId}_${key}`;
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.KEYVALUE,
        docId
      );
      return doc.value;
    } catch (e: any) {
      return await this.localFallback.get(key);
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.localFallback.set(key, value);
    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return;

      const docId = `${this.currentUserId}_${key}`;
      const data = {
        key_id: docId,
        user_id: this.currentUserId,
        key_name: key,
        value: value,
      };

      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.KEYVALUE,
          docId,
          data
        );
      } catch (updateErr: any) {
        if (updateErr.code === 404) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.KEYVALUE,
            docId,
            data
          );
        } else {
          throw updateErr;
        }
      }
    } catch (e: any) {
      // Swallowed warning since we have local fallback already active
    }
  }

  async remove(key: string): Promise<void> {
    await this.localFallback.remove(key);
    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return;

      const docId = `${this.currentUserId}_${key}`;
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.KEYVALUE, docId);
    } catch (e: any) {
      // Swallowed warning
    }
  }

  // --- Daily Check-in Methods ---
  async saveDailyCheckIn(checkIn: DailyCheckIn): Promise<void> {
    await this.localFallback.saveDailyCheckIn(checkIn);
    try {
      await this.initSession();
      if (!this.isUserAuthenticated) return;

      const data = {
        checkin_id: checkIn.id,
        user_id: this.currentUserId,
        timestamp: checkIn.timestamp,
        mood: checkIn.mood,
        symptoms: checkIn.symptoms,
        notes: checkIn.notes,
      };

      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.DAILY_CHECKINS,
          checkIn.id,
          data
        );
      } catch (updateErr: any) {
        if (updateErr.code === 404) {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.DAILY_CHECKINS,
            checkIn.id,
            data
          );
        } else {
          throw updateErr;
        }
      }
    } catch (e: any) {
      console.warn(
        'Appwrite: saveDailyCheckIn sync failed. Saved locally only.',
        e.message
      );
    }
  }

  async getDailyCheckIns(): Promise<DailyCheckIn[]> {
    try {
      await this.initSession();
      if (!this.isUserAuthenticated)
        return await this.localFallback.getDailyCheckIns();

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DAILY_CHECKINS,
        [
          Query.equal('user_id', this.currentUserId),
          Query.orderDesc('timestamp'),
        ]
      );

      return response.documents.map((doc: any) => ({
        id: doc.checkin_id,
        userId: doc.user_id,
        timestamp: doc.timestamp,
        mood: doc.mood as any,
        symptoms: doc.symptoms || [],
        notes: doc.notes || '',
      }));
    } catch (e: any) {
      console.warn(
        'Appwrite: getDailyCheckIns sync failed. Using local fallback.',
        e.message
      );
      return await this.localFallback.getDailyCheckIns();
    }
  }
}
