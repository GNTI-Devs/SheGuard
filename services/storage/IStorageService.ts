export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar: string; // Key/name of selected avatar representation
  language: 'en' | 'ha' | 'yo' | 'ig' | 'pcm';
  pregnancyMonth: number;
  dueDate: string; // ISO date string
  isDemo: boolean;
  emergencyContacts: string[];
  createdAt: string;
}

export interface ConversationMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface ConversationRecord {
  id: string;
  roomName: string;
  startedAt: string;
  endedAt?: string;
  messages: ConversationMessage[];
  hadEmergency: boolean;
}

export interface AppointmentRecord {
  id: string;
  title: string;
  datetime: string;
  location?: string;
  completed: boolean;
}

export interface DailyCheckIn {
  id: string;
  userId: string;
  timestamp: string; // ISO date string
  mood: 'great' | 'good' | 'tired' | 'unwell' | 'anxious';
  symptoms: string[]; // e.g. ["nausea", "headache", "fatigue", "swelling"]
  notes: string;
}

/**
 * IStorageService — the contract interface. Swapping providers doesn't affect consumers.
 */
export interface IStorageService {
  // Profile Methods
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  clearProfile(): Promise<void>;

  // Conversation History Methods
  saveConversation(record: ConversationRecord): Promise<void>;
  getConversations(): Promise<ConversationRecord[]>;
  getConversation(id: string): Promise<ConversationRecord | null>;

  // Appointment/Reminder Methods
  saveAppointment(appt: AppointmentRecord): Promise<void>;
  getAppointments(): Promise<AppointmentRecord[]>;
  markAppointmentComplete(id: string): Promise<void>;

  // Daily Check-in Logs Methods
  saveDailyCheckIn(checkIn: DailyCheckIn): Promise<void>;
  getDailyCheckIns(): Promise<DailyCheckIn[]>;

  // Key-Value Methods (language settings, onboarding flag, etc.)
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
