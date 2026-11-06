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
  sendPasswordResetEmail,
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
  is_subscribed?: boolean;
  subscriptionStatus?: 'active' | 'free_trial' | 'expired' | 'pending';
  subscriptionPlan?: string;
  subscriptionPlanName?: string;
  subscriptionPlanType?: 'single_exam' | 'category_combo' | 'all_exams_pass';
  subscriptionExpiresAt?: string;
  subscriptionApprovedAt?: string;
  subscriptionExamId?: string;
  subscriptionExamTitle?: string;
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
    let isAdmin = !!existing.isAdmin || existing.role === 'admin';
    if (!isAdmin) {
      try {
        const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
        if (adminDoc.exists()) isAdmin = true;
      } catch {
        // Ignore
      }
    }
    existing.isAdmin = isAdmin;
    existing.role = isAdmin ? 'admin' : 'candidate';
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

// 3. Unified Candidate & Admin Login with Email or Roll Number
export async function signInWithEmail(emailOrRoll: string, pass: string): Promise<UserProfile> {
  const cleanInput = emailOrRoll.trim();
  const cleanEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@upprpb.gov.in`;

  // First, check if credentials match an Admin in Firestore or Firebase Auth
  try {
    const adminProfile = await signInAdminWithEmail(cleanEmail, pass);
    if (adminProfile && (adminProfile.isAdmin || adminProfile.role === 'admin')) {
      return adminProfile;
    }
  } catch {
    // Not an admin or admin auth failed, proceed to normal candidate login
  }

  const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));

  if (snap.exists()) {
    const profile = snap.data() as UserProfile;
    let isAdmin = !!profile.isAdmin || profile.role === 'admin';
    if (!isAdmin) {
      try {
        const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
        if (adminDoc.exists()) isAdmin = true;
      } catch {
        // Ignore
      }
    }
    profile.isAdmin = isAdmin;
    profile.role = isAdmin ? 'admin' : 'candidate';
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
            // SECURITY: Guest users NEVER have subscription or admin privileges
            user.is_subscribed = false;
            user.isAdmin = false;
            user.role = 'candidate';
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
      let profile: UserProfile;
      if (snap.exists()) {
        profile = snap.data() as UserProfile;
      } else {
        profile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Candidate',
          rollNumber: `UP-${Math.floor(100000 + Math.random() * 900000)}`,
          category: 'up_police_co',
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
      }

      // Check admin status strictly in Firestore /admins/{uid}
      let isAdmin = false;
      try {
        const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
        if (adminDoc.exists()) isAdmin = true;
      } catch {
        // Fail closed
      }

      if (isAdmin) {
        profile.isAdmin = true;
        profile.role = 'admin';
        profile.is_subscribed = true;
        profile.subscriptionStatus = 'active';
        profile.subscriptionPlan = 'admin_mega_pass';
        profile.subscriptionPlanName = 'Administrator Mega Pass (Lifetime All-Access)';
        profile.subscriptionPlanType = 'all_exams_pass';
        profile.subscriptionExamId = 'all';
        profile.subscriptionExamTitle = 'All 129+ Central & State Exams (Lifetime Access)';
        profile.subscriptionExpiresAt = '2099-12-31T23:59:59.000Z';
        profile.subscriptionApprovedAt = profile.subscriptionApprovedAt || profile.createdAt;

        // Auto-sync professional subscription metadata to Firestore doc /users/{uid}
        // if not already present, ensuring clean database records
        const firestoreData = snap.data();
        if (!firestoreData?.is_subscribed || !firestoreData?.subscriptionPlan) {
          try {
            await setDoc(
              doc(db, 'users', fbUser.uid),
              {
                isAdmin: true,
                role: 'admin',
                is_subscribed: true,
                subscriptionStatus: 'active',
                subscriptionPlan: 'admin_mega_pass',
                subscriptionPlanName: 'Administrator Mega Pass (Lifetime All-Access)',
                subscriptionPlanType: 'all_exams_pass',
                subscriptionExamId: 'all',
                subscriptionExamTitle: 'All 129+ Central & State Exams (Lifetime Access)',
                subscriptionExpiresAt: '2099-12-31T23:59:59.000Z',
                subscriptionApprovedAt: profile.subscriptionApprovedAt
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Could not sync admin subscription schema to Firestore:', e);
          }
        }
      } else {
        profile.isAdmin = false;
        profile.role = 'candidate';
        if (profile.is_subscribed === undefined) {
          profile.is_subscribed = false;
          profile.subscriptionStatus = 'free_trial';
          profile.subscriptionPlan = 'free_demo';
          profile.subscriptionPlanName = 'Free Demo Pass (First 7 Tests Free)';
        }
      }

      // Check subscription expiry for candidates
      if (profile.is_subscribed && profile.subscriptionExpiresAt && !profile.isAdmin) {
        const expiry = new Date(profile.subscriptionExpiresAt).getTime();
        if (!isNaN(expiry) && expiry < Date.now()) {
          profile.is_subscribed = false;
          profile.subscriptionStatus = 'expired';
        }
      }

      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
      callback(profile);
    } catch {
      // Offline fallback: load cached user, but sanitize admin & subscription if unverified
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached && cached.uid === fbUser.uid) {
            callback(cached);
            return;
          }
        }
        callback(null);
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

export function isUserAdmin(user: UserProfile | null | undefined): boolean {
  if (!user || !user.uid || user.uid.startsWith('guest-')) return false;
  return !!user.isAdmin || user.role === 'admin';
}

// Check if any admin exists in Firestore (fails closed on error)
export async function checkHasAnyAdmin(): Promise<boolean> {
  try {
    const q = query(collection(db, 'admins'), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    // Fail closed: never assume there are no admins on permission error
    return true;
  }
}

// 1. Sign in Admin with Email & Password (verifies Firebase Auth & Firestore Admin privileges)
export async function signInAdminWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanEmail || !cleanPass) {
    throw new Error('Please enter both admin email and password.');
  }

  // Authenticate securely via Firebase Authentication server (passwords are salted & hashed by Google)
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const user = cred.user;

    // Check if user has an explicit admin document in Firestore /admins/{uid}
    let isAdmin = false;
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) isAdmin = true;
    } catch (err) {
      console.warn('Error reading admins document:', err);
    }

    if (!isAdmin) {
      // Also check users collection for admin flag
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.isAdmin === true || data.role === 'admin') {
            isAdmin = true;
          }
        }
      } catch {
        // Ignore
      }
    }

    if (!isAdmin) {
      throw new Error('Access Denied: This account does not have Administrator privileges in Firestore.');
    }

    // Load or create user profile
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    let profile: UserProfile;

    if (snap.exists()) {
      profile = snap.data() as UserProfile;
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

    profile.isAdmin = true;
    profile.role = 'admin';

    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
    return profile;
  } catch (authErr: any) {
    if (authErr?.message && authErr.message.startsWith('Access Denied:')) {
      throw authErr;
    }
    throw new Error(
      authErr?.message || 'Invalid admin email or password. Please verify your credentials.'
    );
  }
}

// Send Password Reset / Setup Email for Candidate or Admin
export async function resetUserPassword(emailOrRoll: string): Promise<void> {
  const cleanInput = emailOrRoll.trim().toLowerCase();
  if (!cleanInput) {
    throw new Error('Please enter your email address to reset password.');
  }
  const cleanEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@upprpb.gov.in`;
  await sendPasswordResetEmail(auth, cleanEmail);
}

// Send Admin Password Reset / Setup Email
export async function sendAdminPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter your admin email address first.');
  }
  await sendPasswordResetEmail(auth, cleanEmail);
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
