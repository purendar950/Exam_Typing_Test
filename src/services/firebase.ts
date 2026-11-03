/**
 * Firebase Authentication & Cloud Firestore Service
 * Integrated directly with Project: upp-typing
 * Provides: 1-Click Google Sign-In, Email/Password, Cross-Device Sync, Offline Persistence
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  deleteDoc,
  Firestore,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { EvaluationResult } from '../types';
import { FIREBASE_CONFIG } from './firebaseConfig';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  rollNumber: string;
  category: 'up_police_co' | 'up_police_asi';
  photoURL?: string;
  isAnonymous?: boolean;
  isAdmin?: boolean;
  role?: 'admin' | 'candidate';
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

const STORAGE_KEY_ACTIVE_USER = 'up_typing_active_user';
const STORAGE_KEY_LOCAL_HISTORY = 'up_typing_history';

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(FIREBASE_CONFIG);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Enable offline IndexedDB persistence
try {
  enableIndexedDbPersistence(db).catch(() => {
    // Graceful fallback if multiple tabs are open
  });
} catch {
  // Ignore
}

// -------------------------------------------------------------
// Authentication Functions
// -------------------------------------------------------------

// 1. One-Click Google Sign-In
export async function signInWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;

  // Check if profile document already exists in Firestore
  const userDocRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(existing));
    return existing;
  }

  // Generate roll number for new candidate
  const cleanRoll = `UP-${Math.floor(100000 + Math.random() * 900000)}`;
  const newProfile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || 'UP Candidate',
    rollNumber: cleanRoll,
    category: 'up_police_co',
    photoURL: fbUser.photoURL || undefined,
    createdAt: new Date().toISOString()
  };

  await setDoc(userDocRef, newProfile, { merge: true });
  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(newProfile));
  return newProfile;
}

// 2. Candidate Sign Up with Email & Details
export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string,
  rollNumber: string,
  category: 'up_police_co' | 'up_police_asi'
): Promise<UserProfile> {
  const cleanEmail = email.includes('@') ? email.trim() : `${email.trim().toLowerCase()}@upprpb.gov.in`;
  const cleanRoll = rollNumber.trim().toUpperCase() || `UP-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanName = displayName.trim().toUpperCase() || 'UP CANDIDATE';

  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  await updateProfile(cred.user, { displayName: cleanName });

  const profile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cleanName,
    rollNumber: cleanRoll,
    category,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile, { merge: true });
  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
  return profile;
}

// 3. Candidate Login with Email or Roll Number
export async function signInWithEmail(emailOrRoll: string, pass: string): Promise<UserProfile> {
  const cleanInput = emailOrRoll.trim();
  const cleanEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@upprpb.gov.in`;

  const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));

  if (snap.exists()) {
    const profile = snap.data() as UserProfile;
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
    return profile;
  }

  const fallback: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || cleanInput.toUpperCase(),
    rollNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
    category: 'up_police_co',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', cred.user.uid), fallback, { merge: true });
  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(fallback));
  return fallback;
}

// 4. Guest Practice Account
export async function createGuestCandidate(): Promise<UserProfile> {
  const guestRoll = `GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
  const guestProfile: UserProfile = {
    uid: `guest-${Date.now()}`,
    email: null,
    displayName: 'GUEST CANDIDATE',
    rollNumber: guestRoll,
    category: 'up_police_co',
    isAnonymous: true,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(guestProfile));
  return guestProfile;
}

// 5. Sign Out
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore
  }
  localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
}

// 6. Subscribe to Auth Changes
export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser: User | null) => {
    if (!fbUser) {
      // Check for guest user in localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
        if (raw) {
          const user = JSON.parse(raw);
          if (user.uid && user.uid.startsWith('guest-')) {
            callback(user);
            return;
          }
        }
      } catch {
        // Ignore
      }
      callback(null);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        let isAdmin = !!profile.isAdmin || profile.role === 'admin';
        if (!isAdmin) {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
            if (adminDoc.exists()) isAdmin = true;
          } catch {
            // Ignore
          }
        }
        profile.isAdmin = isAdmin;
        profile.role = isAdmin ? 'admin' : 'candidate';
        localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
        callback(profile);
        return;
      }

      const freshProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || 'Candidate',
        rollNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
        category: 'up_police_co',
        photoURL: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', fbUser.uid), freshProfile, { merge: true });
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(freshProfile));
      callback(freshProfile);
    } catch {
      // Offline fallback
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
        callback(raw ? JSON.parse(raw) : null);
      } catch {
        callback(null);
      }
    }
  });
}

// -------------------------------------------------------------
// Cloud Test Record & Cross-Device Sync
// -------------------------------------------------------------

// Save completed test result to Cloud Firestore & Local Backup
export async function saveTestResultToCloud(
  userId: string,
  result: EvaluationResult
): Promise<boolean> {
  // 1. Always save to LocalStorage immediately
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_HISTORY);
    const history: EvaluationResult[] = raw ? JSON.parse(raw) : [];
    const updated = [
      result,
      ...history.filter((h: EvaluationResult) => h.timestamp !== result.timestamp)
    ].slice(0, 100);
    localStorage.setItem(STORAGE_KEY_LOCAL_HISTORY, JSON.stringify(updated));
  } catch {
    // Ignore
  }

  // If guest, local is sufficient
  if (!userId || userId.startsWith('guest-')) {
    return true;
  }

  // 2. Sync to Cloud Firestore for cross-device persistence
  try {
    const testDocId = `${Date.now()}-${result.testId}`;
    await setDoc(doc(db, 'users', userId, 'test_attempts', testDocId), {
      ...result,
      userId
    });
    return true;
  } catch (err) {
    console.warn('Firestore cloud sync pending/offline:', err);
    return false;
  }
}

// Fetch all test attempts for candidate across all their devices
export async function fetchUserTestAttempts(userId: string): Promise<EvaluationResult[]> {
  // If registered cloud user, fetch from Cloud Firestore
  if (userId && !userId.startsWith('guest-')) {
    try {
      const q = query(
        collection(db, 'users', userId, 'test_attempts'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const results: EvaluationResult[] = [];
      snap.forEach((d) => {
        results.push(d.data() as EvaluationResult);
      });
      if (results.length > 0) {
        // Cache to local storage
        localStorage.setItem(STORAGE_KEY_LOCAL_HISTORY, JSON.stringify(results));
        return results;
      }
    } catch (err) {
      console.warn('Could not reach cloud Firestore, using local cache:', err);
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

// Calculate Lifetime User Stats
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

// Backwards compatibility aliases
export const registerCandidate = async (
  displayName: string,
  rollNumber: string,
  category: 'up_police_co' | 'up_police_asi',
  password?: string
) => {
  return signUpWithEmail(
    `${rollNumber.toLowerCase()}@upprpb.gov.in`,
    password || 'pass1234',
    displayName,
    rollNumber,
    category
  );
};

export const loginCandidate = async (identifier: string, pass?: string) => {
  return signInWithEmail(identifier, pass || 'pass1234');
};

// -------------------------------------------------------------
// Firebase Admin Authentication & Authorization Functions
// -------------------------------------------------------------

export function isUserAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return !!user.isAdmin || user.role === 'admin';
}

// Check if any admin exists in Firestore (for first-time auto-bootstrap)
export async function checkHasAnyAdmin(): Promise<boolean> {
  try {
    const q = query(collection(db, 'admins'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return true;

    // Check users collection for any isAdmin === true
    const userQ = query(collection(db, 'users'), limit(50));
    const userSnap = await getDocs(userQ);
    let found = false;
    userSnap.forEach((d) => {
      const data = d.data();
      if (data.isAdmin === true || data.role === 'admin') found = true;
    });
    return found;
  } catch {
    return false;
  }
}

// 1. Sign in Admin with Email & Password via Firebase Auth
export async function signInAdminWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const user = cred.user;

  // Verify Admin authorization in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  let isAdmin = false;
  let profile: UserProfile;

  if (snap.exists()) {
    profile = snap.data() as UserProfile;
    isAdmin = !!profile.isAdmin || profile.role === 'admin';
  } else {
    profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'ADMIN OFFICER',
      rollNumber: 'ADMIN-01',
      category: 'up_police_co',
      createdAt: new Date().toISOString()
    };
  }

  // Check admins collection
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (adminDoc.exists()) isAdmin = true;
  } catch {
    // Ignore
  }

  // If no admin has ever been created in Firestore, auto-bootstrap the first login as Super Admin
  if (!isAdmin) {
    const hasAny = await checkHasAnyAdmin();
    if (!hasAny) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    throw new Error('Access Denied: This Firebase account does not have Administrator privileges. Please contact system authority.');
  }

  profile.isAdmin = true;
  profile.role = 'admin';

  await setDoc(userDocRef, profile, { merge: true });
  try {
    await setDoc(doc(db, 'admins', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'super_admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch {
    // Ignore
  }

  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
  return profile;
}

// 2. Create New Admin Account directly in Firebase
export async function createAdminAccountWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim().toUpperCase() || 'UP ADMIN OFFICER';

  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  await updateProfile(cred.user, { displayName: cleanName });

  const adminProfile: UserProfile = {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cleanName,
    rollNumber: `ADMIN-${Math.floor(100 + Math.random() * 900)}`,
    category: 'up_police_co',
    isAdmin: true,
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', cred.user.uid), adminProfile, { merge: true });
  try {
    await setDoc(doc(db, 'admins', cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cleanName,
      role: 'super_admin',
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch {
    // Ignore
  }

  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(adminProfile));
  return adminProfile;
}

// 3. 1-Click Google Sign In as Admin
export async function signInAdminWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;

  const userDocRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userDocRef);

  let profile: UserProfile;
  let isAdmin = false;

  if (snap.exists()) {
    profile = snap.data() as UserProfile;
    isAdmin = !!profile.isAdmin || profile.role === 'admin';
  } else {
    profile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || 'ADMIN OFFICER',
      rollNumber: `ADMIN-${Math.floor(100 + Math.random() * 900)}`,
      category: 'up_police_co',
      photoURL: fbUser.photoURL || undefined,
      createdAt: new Date().toISOString()
    };
  }

  try {
    const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
    if (adminDoc.exists()) isAdmin = true;
  } catch {
    // Ignore
  }

  // If no admin exists yet in database, first Google account is granted Super Admin!
  if (!isAdmin) {
    const hasAny = await checkHasAnyAdmin();
    if (!hasAny) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    throw new Error('Access Denied: This Google account is not registered as an Administrator in Firestore.');
  }

  profile.isAdmin = true;
  profile.role = 'admin';

  await setDoc(userDocRef, profile, { merge: true });
  try {
    await setDoc(doc(db, 'admins', fbUser.uid), {
      uid: fbUser.uid,
      email: fbUser.email,
      role: 'super_admin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch {
    // Ignore
  }

  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
  return profile;
}

// 4. Toggle User Admin Role in Firestore
export async function toggleUserAdminRole(targetUid: string, makeAdmin: boolean): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  await setDoc(userRef, {
    isAdmin: makeAdmin,
    role: makeAdmin ? 'admin' : 'candidate'
  }, { merge: true });

  const adminRef = doc(db, 'admins', targetUid);
  if (makeAdmin) {
    await setDoc(adminRef, {
      uid: targetUid,
      role: 'admin',
      promotedAt: new Date().toISOString()
    }, { merge: true });
  } else {
    try {
      await deleteDoc(adminRef);
    } catch {
      // Ignore
    }
  }
}

export const isFirebaseConfigured = () => true;
export const getSavedFirebaseConfig = () => FIREBASE_CONFIG;
export const saveFirebaseConfig = () => {};
export const initFirebase = () => true;
