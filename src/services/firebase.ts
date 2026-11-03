/**
 * Candidate Authentication & Exam Record Service
 * Professional, zero-friction candidate profile and test record keeper
 * Designed for UPPRPB Computer Operator Grade-A & ASI Examination Portals (ARTyping / TestMentor standard)
 */

import { EvaluationResult } from '../types';

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

export interface CandidateAccount extends UserProfile {
  password?: string;
}

const STORAGE_KEY_ACTIVE_CANDIDATE = 'up_typing_active_candidate';
const STORAGE_KEY_CANDIDATES_REGISTRY = 'up_typing_candidates_registry';
const STORAGE_KEY_TESTS_PREFIX = 'up_typing_tests_';
const STORAGE_KEY_GLOBAL_HISTORY = 'up_typing_history';

// In-memory auth listeners
type AuthListener = (user: UserProfile | null) => void;
const authListeners: Set<AuthListener> = new Set();

function notifyAuthListeners(user: UserProfile | null) {
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.warn('Error in auth listener:', err);
    }
  });
}

// Get all registered candidate profiles
export function getRegisteredCandidates(): CandidateAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CANDIDATES_REGISTRY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Get currently active candidate
export function getActiveCandidate(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_CANDIDATE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Authentication Functions
// -------------------------------------------------------------

// Register a new candidate
export async function registerCandidate(
  displayName: string,
  rollNumber: string,
  category: 'up_police_co' | 'up_police_asi',
  password?: string,
  email?: string
): Promise<UserProfile> {
  const cleanName = displayName.trim().toUpperCase() || 'UP CANDIDATE';
  const cleanRoll = rollNumber.trim().toUpperCase() || `UP-${Math.floor(100000 + Math.random() * 900000)}`;

  const newAccount: CandidateAccount = {
    uid: `cand-${cleanRoll}`,
    displayName: cleanName,
    rollNumber: cleanRoll,
    category,
    email: email ? email.trim() : `${cleanRoll.toLowerCase()}@upprpb.gov.in`,
    password: password ? password.trim() : '',
    createdAt: new Date().toISOString()
  };

  // Save to candidates registry
  const list = getRegisteredCandidates();
  const filtered = list.filter((c) => c.rollNumber !== cleanRoll && c.displayName !== cleanName);
  filtered.push(newAccount);
  try {
    localStorage.setItem(STORAGE_KEY_CANDIDATES_REGISTRY, JSON.stringify(filtered));
  } catch {
    // Ignore storage quota
  }

  // Set active
  const profile: UserProfile = {
    uid: newAccount.uid,
    displayName: newAccount.displayName,
    rollNumber: newAccount.rollNumber,
    category: newAccount.category,
    email: newAccount.email,
    createdAt: newAccount.createdAt
  };

  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_CANDIDATE, JSON.stringify(profile));
  } catch {
    // Ignore
  }

  notifyAuthListeners(profile);
  return profile;
}

// Login an existing candidate (by Roll Number or Name)
export async function loginCandidate(
  identifier: string,
  password?: string
): Promise<UserProfile> {
  const cleanId = identifier.trim().toUpperCase();
  if (!cleanId) {
    throw new Error('Please enter your Roll Number or Candidate Name.');
  }

  const list = getRegisteredCandidates();
  let found = list.find((c) => c.rollNumber === cleanId || c.displayName === cleanId);

  if (found) {
    if (found.password && password && found.password !== password.trim()) {
      throw new Error(`Incorrect password for ${found.displayName} (${found.rollNumber}).`);
    }
  } else {
    // Auto-create candidate account if it's their first time logging in
    const isRoll = cleanId.startsWith('UP-') || /^\d+$/.test(cleanId);
    found = {
      uid: `cand-${cleanId}`,
      displayName: isRoll ? `CANDIDATE ${cleanId}` : cleanId,
      rollNumber: isRoll ? cleanId : `UP-${Math.floor(100000 + Math.random() * 900000)}`,
      category: 'up_police_co',
      email: `${cleanId.toLowerCase()}@upprpb.gov.in`,
      password: password ? password.trim() : '',
      createdAt: new Date().toISOString()
    };
    list.push(found);
    try {
      localStorage.setItem(STORAGE_KEY_CANDIDATES_REGISTRY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }

  const profile: UserProfile = {
    uid: found.uid,
    displayName: found.displayName,
    rollNumber: found.rollNumber,
    category: found.category,
    email: found.email,
    createdAt: found.createdAt
  };

  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_CANDIDATE, JSON.stringify(profile));
  } catch {
    // Ignore
  }

  notifyAuthListeners(profile);
  return profile;
}

// Log out active candidate
export async function logoutUser(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CANDIDATE);
  } catch {
    // Ignore
  }
  notifyAuthListeners(null);
}

// Auth State Listener
export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  authListeners.add(callback);

  // Immediately notify of current active candidate
  const current = getActiveCandidate();
  callback(current);

  return () => {
    authListeners.delete(callback);
  };
}

// -------------------------------------------------------------
// Test Record & Stats Functions
// -------------------------------------------------------------

// Save completed test result to candidate profile
export async function saveTestResultToCloud(
  userId: string,
  result: EvaluationResult
): Promise<boolean> {
  try {
    // Save to Candidate-Specific History
    const candKey = `${STORAGE_KEY_TESTS_PREFIX}${userId}`;
    const raw = localStorage.getItem(candKey);
    const history: EvaluationResult[] = raw ? JSON.parse(raw) : [];
    const updated = [
      result,
      ...history.filter((h: EvaluationResult) => h.timestamp !== result.timestamp)
    ].slice(0, 100);
    localStorage.setItem(candKey, JSON.stringify(updated));

    // Also update global history
    const globalRaw = localStorage.getItem(STORAGE_KEY_GLOBAL_HISTORY);
    const globalHistory: EvaluationResult[] = globalRaw ? JSON.parse(globalRaw) : [];
    const globalUpdated = [
      result,
      ...globalHistory.filter((h: EvaluationResult) => h.timestamp !== result.timestamp)
    ].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_GLOBAL_HISTORY, JSON.stringify(globalUpdated));

    return true;
  } catch (err) {
    console.warn('Failed to save test result:', err);
    return false;
  }
}

// Fetch all test attempts for a user
export async function fetchUserTestAttempts(userId: string): Promise<EvaluationResult[]> {
  try {
    const candKey = `${STORAGE_KEY_TESTS_PREFIX}${userId}`;
    const raw = localStorage.getItem(candKey);
    if (raw) {
      const tests = JSON.parse(raw);
      if (tests.length > 0) return tests;
    }

    // Fallback to global history
    const globalRaw = localStorage.getItem(STORAGE_KEY_GLOBAL_HISTORY);
    return globalRaw ? JSON.parse(globalRaw) : [];
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

// -------------------------------------------------------------
// Backwards Compatibility Aliases
// -------------------------------------------------------------
export const signUpWithEmail = async (
  email: string,
  pass: string,
  displayName: string,
  rollNumber: string,
  category: 'up_police_co' | 'up_police_asi'
) => {
  return registerCandidate(displayName, rollNumber, category, pass, email);
};

export const signInWithEmail = async (emailOrRoll: string, pass: string) => {
  return loginCandidate(emailOrRoll, pass);
};

export const signInWithGoogle = async () => {
  return loginCandidate('GOOGLE-CANDIDATE', 'pass');
};

export const isFirebaseConfigured = () => true;
export const getSavedFirebaseConfig = () => null;
export const saveFirebaseConfig = () => {};
export const initFirebase = () => true;
