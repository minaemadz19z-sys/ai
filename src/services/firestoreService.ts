import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  updatedAt?: any;
}

export interface UserProfileMemory {
  uid?: string;
  name: string;
  primaryLanguage: string; // 'English'
  englishLevel: string; // 'Beginner' | 'Intermediate' | 'Advanced' | 'Fluent'
  goals: string[];
  interests: string[];
  facts: string[];
  culturalTopicsExplored: string[];
  totalSessions: number;
  totalDurationSeconds: number;
  lastConversationSummary?: string;
  updatedAt: string;
}

export interface FirestoreConversation {
  id: string;
  userId: string;
  title: string;
  voiceModel: string;
  durationSeconds: number;
  totalTurns: number;
  summary?: string;
  turns: Array<{ role: 'user' | 'model'; text: string; timestamp?: string }>;
  createdAt: string;
}

export interface FirestoreChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface FirestoreChatSession {
  id: string;
  userId: string;
  title: string;
  model: 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | string;
  systemInstruction?: string;
  messages: FirestoreChatMessage[];
  updatedAt: string;
}

export interface FirestoreTranscriptRecord {
  id: string;
  userId: string;
  text: string;
  model: string;
  audioDurationSeconds: number;
  createdAt: string;
}

/**
 * Persist or update user profile document in /users/{userId}
 */
export async function syncUserProfileToFirestore(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  if (!user.uid) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore profile sync notice:', error);
  }
}

/**
 * Save voice conversation archive into /users/{userId}/conversations/{conversationId}
 */
export async function saveConversationToFirestore(
  userId: string,
  conversation: Omit<FirestoreConversation, 'id' | 'userId'>
): Promise<string | null> {
  if (!userId) return null;
  try {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const convRef = doc(db, 'users', userId, 'conversations', id);
    const data: FirestoreConversation = {
      ...conversation,
      id,
      userId,
    };
    await setDoc(convRef, data);
    return id;
  } catch (error) {
    console.warn('Firestore save conversation notice:', error);
    return null;
  }
}

/**
 * List recent user conversations from /users/{userId}/conversations
 */
export async function getUserConversationsFromFirestore(
  userId: string
): Promise<FirestoreConversation[]> {
  if (!userId) return [];
  try {
    const collRef = collection(db, 'users', userId, 'conversations');
    const q = query(collRef, limit(30));
    const snapshot = await getDocs(q);
    const list: FirestoreConversation[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as FirestoreConversation);
    });
    // Sort descending by createdAt
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.warn('Firestore list conversations notice:', error);
    return [];
  }
}

/**
 * Save or update multi-turn Chat Session in /users/{userId}/chat_sessions/{sessionId}
 */
export async function saveChatSessionToFirestore(
  userId: string,
  session: {
    id?: string;
    title: string;
    model: string;
    systemInstruction?: string;
    messages: FirestoreChatMessage[];
  }
): Promise<string | null> {
  if (!userId) return null;
  try {
    const id = session.id || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionRef = doc(db, 'users', userId, 'chat_sessions', id);
    const data: FirestoreChatSession = {
      id,
      userId,
      title: session.title,
      model: session.model,
      systemInstruction: session.systemInstruction || '',
      messages: session.messages,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(sessionRef, data);
    return id;
  } catch (error) {
    console.warn('Firestore save chat session notice:', error);
    return null;
  }
}

/**
 * Fetch all chat sessions for user
 */
export async function getChatSessionsFromFirestore(
  userId: string
): Promise<FirestoreChatSession[]> {
  if (!userId) return [];
  try {
    const collRef = collection(db, 'users', userId, 'chat_sessions');
    const snapshot = await getDocs(collRef);
    const list: FirestoreChatSession[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as FirestoreChatSession);
    });
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.warn('Firestore fetch chat sessions notice:', error);
    return [];
  }
}

/**
 * Save speech transcription log to /users/{userId}/transcripts/{transcriptId}
 */
export async function saveTranscriptToFirestore(
  userId: string,
  record: {
    text: string;
    model: string;
    audioDurationSeconds: number;
  }
): Promise<string | null> {
  if (!userId) return null;
  try {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txRef = doc(db, 'users', userId, 'transcripts', id);
    const data: FirestoreTranscriptRecord = {
      id,
      userId,
      text: record.text,
      model: record.model,
      audioDurationSeconds: record.audioDurationSeconds,
      createdAt: new Date().toISOString(),
    };
    await setDoc(txRef, data);
    return id;
  } catch (error) {
    console.warn('Firestore save transcript record notice:', error);
    return null;
  }
}

/**
 * Fetch speech transcription records from /users/{userId}/transcripts
 */
export async function getTranscriptsFromFirestore(
  userId: string
): Promise<FirestoreTranscriptRecord[]> {
  if (!userId) return [];
  try {
    const collRef = collection(db, 'users', userId, 'transcripts');
    const snapshot = await getDocs(collRef);
    const list: FirestoreTranscriptRecord[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as FirestoreTranscriptRecord);
    });
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.warn('Firestore fetch transcripts notice:', error);
    return [];
  }
}

/**
 * Persist user memory & personal knowledge profile to /users/{userId}/profile/memory
 */
export async function saveUserMemoryToFirestore(
  userId: string,
  memory: UserProfileMemory
): Promise<void> {
  if (!userId) return;
  try {
    const memoryRef = doc(db, 'users', userId, 'profile', 'memory');
    await setDoc(memoryRef, {
      ...memory,
      uid: userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Firestore save user memory notice:', error);
  }
}

/**
 * Fetch user memory & personal knowledge profile from /users/{userId}/profile/memory
 */
export async function getUserMemoryFromFirestore(
  userId: string
): Promise<UserProfileMemory | null> {
  if (!userId) return null;
  try {
    const memoryRef = doc(db, 'users', userId, 'profile', 'memory');
    const snapshot = await getDoc(memoryRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfileMemory;
    }
    return null;
  } catch (error) {
    console.warn('Firestore fetch user memory notice:', error);
    return null;
  }
}
