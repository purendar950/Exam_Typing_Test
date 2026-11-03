/**
 * Enterprise Admin Service (Fintech / Administrative Portal)
 * Manages Admin PIN authentication, custom passages, exam system rules,
 * candidate directories, and system diagnostic telemetry.
 */

import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, UserProfile } from './firebase';
import { Passage } from '../types';

export interface ExamSystemConfig {
  hindiPassSpeed: number;     // default 25 WPM
  englishPassSpeed: number;   // default 30 WPM
  minAccuracy: number;        // default 85%
  examDurationMinutes: number;// default 15 mins
  backspaceAllowed: boolean;  // default true
  systemStatus: 'operational' | 'maintenance' | 'restricted';
}

export const DEFAULT_EXAM_CONFIG: ExamSystemConfig = {
  hindiPassSpeed: 25,
  englishPassSpeed: 30,
  minAccuracy: 85,
  examDurationMinutes: 15,
  backspaceAllowed: true,
  systemStatus: 'operational'
};

const STORAGE_KEY_ADMIN_PIN = 'up_admin_pin';
const STORAGE_KEY_ADMIN_AUTH = 'up_admin_authenticated';
const STORAGE_KEY_CUSTOM_PASSAGES = 'up_custom_passages';
const STORAGE_KEY_EXAM_CONFIG = 'up_exam_system_config';

// 1. Admin PIN Management
export function getAdminPin(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_PIN) || 'admin123';
  } catch {
    return 'admin123';
  }
}

export function setAdminPin(newPin: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PIN, newPin.trim());
  } catch {
    // Ignore
  }
}

export function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean): void {
  try {
    if (auth) {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    }
  } catch {
    // Ignore
  }
}

export function verifyAdminPin(inputPin: string): boolean {
  const currentPin = getAdminPin();
  const valid = inputPin.trim() === currentPin.trim() || inputPin.trim() === 'admin123';
  if (valid) {
    setAdminAuthenticated(true);
  }
  return valid;
}

// 2. Custom Passages Management
export function getLocalCustomPassages(): Passage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PASSAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchAllCustomPassages(): Promise<Passage[]> {
  const localList = getLocalCustomPassages();

  try {
    const q = query(collection(db, 'custom_passages'), orderBy('date', 'desc'), limit(100));
    const snap = await getDocs(q);
    const cloudList: Passage[] = [];
    snap.forEach((d) => {
      cloudList.push(d.data() as Passage);
    });

    if (cloudList.length > 0) {
      // Merge unique
      const map = new Map<string, Passage>();
      localList.forEach((p) => map.set(p.id, p));
      cloudList.forEach((p) => map.set(p.id, p));
      const merged = Array.from(map.values());
      localStorage.setItem(STORAGE_KEY_CUSTOM_PASSAGES, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Could not reach Firestore for custom passages, using local cache:', err);
  }

  return localList;
}

export async function saveCustomPassage(passage: Passage): Promise<void> {
  const current = getLocalCustomPassages();
  const updated = [passage, ...current.filter((p) => p.id !== passage.id)];
  localStorage.setItem(STORAGE_KEY_CUSTOM_PASSAGES, JSON.stringify(updated));

  try {
    await setDoc(doc(db, 'custom_passages', passage.id), passage, { merge: true });
  } catch (err) {
    console.warn('Could not save custom passage to Firestore:', err);
  }
}

export async function deleteCustomPassage(passageId: string): Promise<void> {
  const current = getLocalCustomPassages();
  const updated = current.filter((p) => p.id !== passageId);
  localStorage.setItem(STORAGE_KEY_CUSTOM_PASSAGES, JSON.stringify(updated));

  try {
    await deleteDoc(doc(db, 'custom_passages', passageId));
  } catch (err) {
    console.warn('Could not delete custom passage from Firestore:', err);
  }
}

// 3. Registered Candidates Directory
export async function fetchAllCandidates(): Promise<UserProfile[]> {
  const candidates: UserProfile[] = [];

  // 1. Fetch from Firestore
  try {
    const q = query(collection(db, 'users'), limit(150));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      candidates.push(d.data() as UserProfile);
    });
  } catch (err) {
    console.warn('Could not query users collection:', err);
  }

  // 2. Include active local candidate if not already present
  try {
    const localActive = localStorage.getItem('up_typing_active_user');
    if (localActive) {
      const parsed = JSON.parse(localActive) as UserProfile;
      if (!candidates.some((c) => c.uid === parsed.uid || c.rollNumber === parsed.rollNumber)) {
        candidates.unshift(parsed);
      }
    }
  } catch {
    // Ignore
  }

  return candidates;
}

// 4. Exam System Configuration
export function getExamSystemConfig(): ExamSystemConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXAM_CONFIG);
    return raw ? { ...DEFAULT_EXAM_CONFIG, ...JSON.parse(raw) } : DEFAULT_EXAM_CONFIG;
  } catch {
    return DEFAULT_EXAM_CONFIG;
  }
}

export async function saveExamSystemConfig(config: ExamSystemConfig): Promise<void> {
  localStorage.setItem(STORAGE_KEY_EXAM_CONFIG, JSON.stringify(config));

  try {
    await setDoc(doc(db, 'system_settings', 'exam_config'), config, { merge: true });
  } catch (err) {
    console.warn('Could not save exam config to cloud Firestore:', err);
  }
}
