/**
 * Firebase Authentication & Cloud Firestore Service
 * Provides secure user sessions, cross-device sync, and offline persistence.
 * Includes graceful offline & simulated fallback if Firebase keys are not yet configured.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Firestore,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { EvaluationResult } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  rollNumber: string;
  category: 'up_police_co' | 'up_police_asi';
  photoURL?: string;
  isAnonymous?: boolean;
  createdAt: string;
}

export interface UserStats {
  totalTests: number;
  qualifiedTests: number;
  passRate: number;
  avgGrossWpm: number;
  avgNetWpm: number;
  avgAccuracy: number;
  bestNetWpm: number;
  hindiTestsCount: number;
  englishTestsCount: number;
}

const STORAGE_KEY_FIREBASE_CONFIG = 'up_typing_firebase_config';
const STORAGE_KEY_LOCAL_USER = 'up_typing_local_user';
const STORAGE_KEY_LOCAL_HISTORY = 'up_typing_history';

// Default / saved Firebase configuration
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

// Global Firebase instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase(customConfig?: FirebaseConfig): boolean {
  try {
    const config = customConfig || getSavedFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }

    auth = getAuth(app);
    db = getFirestore(app);

    // Try enabling offline persistence
    enableIndexedDbPersistence(db).catch(() => {
      // Multiple tabs or unsupported, fallback gracefully
    });

    return true;
  } catch (err) {
    console.warn('Firebase initialization error:', err);
    return false;
  }
}

// Auto-initialize on import if config exists
initFirebase();

export function isFirebaseConfigured(): boolean {
  return !!auth && !!db;
}

// -------------------------------------------------------------
// Authentication Functions
// -------------------------------------------------------------

// Sign Up with Email and Password
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string,
  rollNumber: string,
  category: 'up_police_co' | 'up_police_asi'
): Promise<UserProfile> {
  if (!auth || !db) {
    // Simulated Local Account Mode
    const localUser: UserProfile = {
      uid: `local-${Date.now()}`,
      email,
      displayName,
      rollNumber: rollNumber || `UP-${Math.floor(100000 + Math.random() * 900000)}`,
      category,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_LOCAL_USER, JSON.stringify(localUser));
    return localUser;
  }

  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName });

  const profile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName,
    rollNumber: rollNumber || `UP-${Math.floor(100000 + Math.random() * 900000)}`,
    category,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile, { merge: true });
  return profile;
}

// Sign In with Email and Password
export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (!auth || !db) {
    // Check local storage for mock account
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_USER);
    if (raw) {
      const user = JSON.parse(raw);
      if (user.email === email) return user;
    }
    // Create or return guest account
    const guestUser: UserProfile = {
      uid: `local-${Date.now()}`,
      email,
      displayName: email.split('@')[0].toUpperCase(),
      rollNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
      category: 'up_police_co',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_LOCAL_USER, JSON.stringify(guestUser));
    return guestUser;
  }

  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }

  const fallbackProfile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || email.split('@')[0].toUpperCase(),
    rollNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
    category: 'up_police_co',
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'users', cred.user.uid), fallbackProfile, { merge: true });
  return fallbackProfile;
}

// Sign In with Google
export async function signInWithGoogle(): Promise<UserProfile> {
  if (!auth || !db) {
    throw new Error('Firebase is not configured. Please enter your Firebase project keys.');
  }

  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);

  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }

  const newProfile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || 'UP Candidate',
    rollNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
    category: 'up_police_co',
    photoURL: cred.user.photoURL || undefined,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', cred.user.uid), newProfile, { merge: true });
  return newProfile;
}

// Log Out
export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem(STORAGE_KEY_LOCAL_USER);
}

// Auth State Listener
export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  if (!auth || !db) {
    // Return local user if any
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_USER);
    if (raw) {
      try {
        callback(JSON.parse(raw));
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      if (db) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as UserProfile);
          return;
        }
      }

      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Candidate',
        rollNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
        category: 'up_police_co',
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date().toISOString()
      });
    } catch {
      callback(null);
    }
  });
}

// -------------------------------------------------------------
// Cloud Test Record & Stats Functions
// -------------------------------------------------------------

// Save completed test result to Cloud Firestore
export async function saveTestResultToCloud(
  userId: string,
  result: EvaluationResult
): Promise<boolean> {
  // Always save to LocalStorage backup first
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_HISTORY);
    const history = raw ? JSON.parse(raw) : [];
    const updated = [result, ...history.filter((h: EvaluationResult) => h.timestamp !== result.timestamp)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_LOCAL_HISTORY, JSON.stringify(updated));
  } catch {
    // Ignore local error
  }

  if (!db || !userId || userId.startsWith('local-')) {
    return false;
  }

  try {
    const testDocId = `${Date.now()}-${result.testId}`;
    await setDoc(doc(db, 'users', userId, 'test_attempts', testDocId), {
      ...result,
      userId
    });
    return true;
  } catch (err) {
    console.warn('Failed to sync test to Cloud Firestore:', err);
    return false;
  }
}

// Fetch all test attempts for a user
export async function fetchUserTestAttempts(userId: string): Promise<EvaluationResult[]> {
  // Check cloud first if connected
  if (db && userId && !userId.startsWith('local-')) {
    try {
      const q = query(
        collection(db, 'users', userId, 'test_attempts'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const results: EvaluationResult[] = [];
      snap.forEach((d) => {
        results.push(d.data() as EvaluationResult);
      });
      if (results.length > 0) {
        return results;
      }
    } catch (err) {
      console.warn('Could not fetch cloud tests, falling back to local:', err);
    }
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Calculate Lifetime User Stats from test attempts
export function computeUserStats(attempts: EvaluationResult[]): UserStats {
  if (!attempts || attempts.length === 0) {
    return {
      totalTests: 0,
      qualifiedTests: 0,
      passRate: 0,
      avgGrossWpm: 0,
      avgNetWpm: 0,
      avgAccuracy: 0,
      bestNetWpm: 0,
      hindiTestsCount: 0,
      englishTestsCount: 0
    };
  }

  let totalGross = 0;
  let totalNet = 0;
  let totalAccuracy = 0;
  let qualified = 0;
  let bestNet = 0;
  let hindiCount = 0;
  let englishCount = 0;

  attempts.forEach((a) => {
    totalGross += a.grossWpm || 0;
    totalNet += a.netWpm || 0;
    totalAccuracy += a.accuracy || 0;
    if (a.isQualified) qualified++;
    if ((a.netWpm || 0) > bestNet) bestNet = a.netWpm;
    if (a.language.startsWith('hindi')) {
      hindiCount++;
    } else {
      englishCount++;
    }
  });

  const count = attempts.length;

  return {
    totalTests: count,
    qualifiedTests: qualified,
    passRate: Math.round((qualified / count) * 1000) / 10,
    avgGrossWpm: Math.round((totalGross / count) * 10) / 10,
    avgNetWpm: Math.round((totalNet / count) * 10) / 10,
    avgAccuracy: Math.round((totalAccuracy / count) * 10) / 10,
    bestNetWpm: bestNet,
    hindiTestsCount: hindiCount,
    englishTestsCount: englishCount
  };
}
