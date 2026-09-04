import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  idToken: string | undefined;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInDemo: (demoEmail?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase Auth is configured, subscribe to auth state
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          localStorage.setItem('lifeos_auth_token', token);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'LifeOS User',
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
          });
        } else {
          setUser(null);
          setIdToken(undefined);
          localStorage.removeItem('lifeos_auth_token');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // Dev / Sandbox fallback session persistence
    const savedUser = localStorage.getItem('lifeos_dev_user');
    const savedToken = localStorage.getItem('lifeos_auth_token');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIdToken(savedToken || 'dev-mock-token-user-1');
      } catch {
        setUser(null);
      }
    } else {
      // Auto-initialize demo profile for immediate out-of-the-box exploration
      const initialDevUser: UserProfile = {
        uid: 'dev-explorer-alpha',
        email: 'commander@gemini-lifeos.ai',
        displayName: 'Commander Nova',
        createdAt: new Date().toISOString(),
      };
      setUser(initialDevUser);
      setIdToken('dev-mock-token-dev-explorer-alpha');
      localStorage.setItem('lifeos_dev_user', JSON.stringify(initialDevUser));
      localStorage.setItem('lifeos_auth_token', 'dev-mock-token-dev-explorer-alpha');
    }
    setLoading(false);
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, pass);
      return;
    }
    // Sandbox fallback
    const mockUid = `usr_${btoa(email).replace(/=/g, '').slice(0, 10)}`;
    const devUser: UserProfile = {
      uid: mockUid,
      email,
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    const token = `dev-mock-token-${mockUid}`;
    setUser(devUser);
    setIdToken(token);
    localStorage.setItem('lifeos_dev_user', JSON.stringify(devUser));
    localStorage.setItem('lifeos_auth_token', token);
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (isFirebaseConfigured && auth) {
      await createUserWithEmailAndPassword(auth, email, pass);
      return;
    }
    const mockUid = `usr_${btoa(email).replace(/=/g, '').slice(0, 10)}`;
    const devUser: UserProfile = {
      uid: mockUid,
      email,
      displayName: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    const token = `dev-mock-token-${mockUid}`;
    setUser(devUser);
    setIdToken(token);
    localStorage.setItem('lifeos_dev_user', JSON.stringify(devUser));
    localStorage.setItem('lifeos_auth_token', token);
  };

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured && auth) {
      await signInWithPopup(auth, googleProvider);
      return;
    }
    const devUser: UserProfile = {
      uid: 'google-sandbox-user-88',
      email: 'alex.chen@gmail.com',
      displayName: 'Alex Chen',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };
    setUser(devUser);
    setIdToken('dev-mock-token-google-sandbox-user-88');
    localStorage.setItem('lifeos_dev_user', JSON.stringify(devUser));
    localStorage.setItem('lifeos_auth_token', 'dev-mock-token-google-sandbox-user-88');
  };

  const signOutUser = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
    setIdToken(undefined);
    localStorage.removeItem('lifeos_dev_user');
    localStorage.removeItem('lifeos_auth_token');
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`[Dev Sandbox] Password reset email simulated for: ${email}`);
    }
  };

  const signInDemo = (demoEmail = 'alex.explorer@lifeos.internal') => {
    const demoUser: UserProfile = {
      uid: 'demo-user-nova',
      email: demoEmail,
      displayName: 'Alex Nova',
      createdAt: new Date().toISOString(),
    };
    setUser(demoUser);
    setIdToken('dev-mock-token-demo-user-nova');
    localStorage.setItem('lifeos_dev_user', JSON.stringify(demoUser));
    localStorage.setItem('lifeos_auth_token', 'dev-mock-token-demo-user-nova');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOutUser,
        resetPassword,
        signInDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
