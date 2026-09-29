import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleAuthProvider, testFirestoreConnection } from '../lib/firebase';
import {
  syncUserProfileToFirestore,
  saveConversationToFirestore,
} from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  idToken: string | null;
  accessToken: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  getOrRequestAccessToken: () => Promise<string | null>;
  saveConversationToCloud: (data: {
    title?: string;
    voiceModel: string;
    durationSeconds: number;
    turns: Array<{ role: 'user' | 'model'; text: string }>;
  }) => Promise<boolean>;
}

// In-memory cache for OAuth access token (never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);

          // Synchronize user to Cloud SQL
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoUrl: currentUser.photoURL,
            }),
          }).catch((err) => console.warn('Cloud SQL user sync:', err));

          // Synchronize user profile into Firestore database
          await syncUserProfileToFirestore({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          });
        } catch (err) {
          console.warn('User database synchronization notice:', err);
        }
      } else {
        cachedAccessToken = null;
        setAccessToken(null);
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (error: any) {
      const isPopupDismissed =
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.code === 'auth/popup-blocked' ||
        String(error?.message || '').includes('popup-closed-by-user') ||
        String(error?.message || '').includes('cancelled-popup-request');

      if (isPopupDismissed) {
        console.log('[Auth] Google Sign-In popup was dismissed or closed by the user.');
        return null;
      }

      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const getOrRequestAccessToken = async (): Promise<string | null> => {
    if (cachedAccessToken) {
      return cachedAccessToken;
    }
    // Re-prompt via popup to retrieve fresh access token with Drive & Classroom scopes
    return await signInWithGoogle();
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      cachedAccessToken = null;
      setAccessToken(null);
      setUser(null);
      setIdToken(null);
    } catch (error) {
      console.error('Sign-Out failed:', error);
    }
  };

  const saveConversationToCloud = async (data: {
    title?: string;
    voiceModel: string;
    durationSeconds: number;
    turns: Array<{ role: 'user' | 'model'; text: string }>;
  }) => {
    if (!user) return false;
    try {
      // 1. Direct Firestore Persistence
      await saveConversationToFirestore(user.uid, {
        title: data.title || 'Voice Conversation',
        voiceModel: data.voiceModel,
        durationSeconds: data.durationSeconds,
        totalTurns: data.turns.length,
        turns: data.turns,
        createdAt: new Date().toISOString(),
      });

      // 2. Cloud SQL Persistence
      const token = idToken || (await user.getIdToken());
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.warn('Notice: Cloud SQL conversation save returned non-200, Firestore preserved data');
      }
      return true;
    } catch (err) {
      console.warn('Could not save conversation to database:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        accessToken,
        loading,
        signInWithGoogle,
        signOut,
        getOrRequestAccessToken,
        saveConversationToCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
