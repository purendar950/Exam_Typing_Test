/**
 * Secure Passage Service
 * Handles server-side fetching and cloud synchronization of paid exam passages.
 *
 * Security Model:
 * - Free Demo Tests (#1 to #7) are bundled locally in the client for zero-latency instant trials.
 * - Pro/Paid Tests (#8+) are fetched on-demand from Cloud Firestore (/paid_passages/{id}).
 * - Firestore Security Rules enforce that only authenticated users with active subscriptions
 *   (or administrators) can read documents from /paid_passages.
 */

import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Passage } from '../types';

// In-memory session cache to eliminate duplicate Firestore reads during the same browser session
const sessionPassageCache = new Map<string, string>();

/**
 * Fetch the full text for a paid test passage from Cloud Firestore.
 * Requires an active user subscription or admin privileges in Firestore.
 */
export async function fetchPaidPassageText(passageId: string): Promise<{
  success: boolean;
  text?: string;
  error?: string;
  isPermissionDenied?: boolean;
}> {
  if (!passageId) {
    return { success: false, error: 'Invalid passage ID.' };
  }

  // 1. Check in-memory session cache (0 reads cost)
  if (sessionPassageCache.has(passageId)) {
    return { success: true, text: sessionPassageCache.get(passageId) };
  }

  // 2. Fetch from Firestore
  try {
    const passageDocRef = doc(db, 'paid_passages', passageId);
    const snap = await getDoc(passageDocRef);

    if (!snap.exists()) {
      return {
        success: false,
        error: 'Passage document not found in cloud database.'
      };
    }

    const data = snap.data();
    const text = data?.text || '';

    if (!text) {
      return {
        success: false,
        error: 'Cloud passage document contains empty text.'
      };
    }

    // Cache in memory for this session
    sessionPassageCache.set(passageId, text);
    return { success: true, text };
  } catch (err: any) {
    console.error('Error fetching paid passage from Firestore:', err);
    const isPermission =
      err?.code === 'permission-denied' ||
      err?.message?.includes('permission-denied') ||
      err?.message?.includes('Missing or insufficient permissions');

    if (isPermission) {
      return {
        success: false,
        isPermissionDenied: true,
        error: 'Access Denied: Server security requires an active Pro subscription to load this test.'
      };
    }

    return {
      success: false,
      error: err?.message || 'Network error fetching secure test passage from server.'
    };
  }
}

/**
 * Sync paid passages to Cloud Firestore (/paid_passages collection).
 * Only accessible by administrators (enforced both client-side and via Firestore rules).
 *
 * @param passages Full list of passages
 * @param onProgress Optional callback reporting (completedCount, totalCount)
 */
export async function syncPaidPassagesToFirestore(
  passages: Passage[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; totalSynced: number; error?: string }> {
  // Only sync passages with valid text and testNumber > 7 (or tests intended as Pro)
  const paidPassages = passages.filter(
    (p) => p && p.id && p.text && p.text.trim().length > 0 && ((p.testNumber ?? 0) > 7 || (p.testNumber ?? 0) === 0)
  );

  if (paidPassages.length === 0) {
    return { success: false, totalSynced: 0, error: 'No paid passages with non-empty text found to sync.' };
  }

  const BATCH_SIZE = 350; // Firestore limit is 500 operations per batch
  let completed = 0;
  const total = paidPassages.length;

  try {
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = paidPassages.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((p) => {
        const docRef = doc(db, 'paid_passages', p.id);
        batch.set(
          docRef,
          {
            id: p.id,
            text: p.text,
            title: p.title || '',
            language: p.language || 'english',
            category: p.category || '',
            categoryGroup: p.categoryGroup || '',
            examSlug: p.examSlug || '',
            testNumber: p.testNumber || 0,
            wordCount: p.wordCount || 0,
            duration: p.duration || 15,
            difficulty: p.difficulty || 'medium',
            date: p.date || '',
            syncedAt: new Date().toISOString()
          },
          { merge: true }
        );
      });

      await batch.commit();
      completed += chunk.length;
      if (onProgress) {
        onProgress(completed, total);
      }
    }

    return { success: true, totalSynced: completed };
  } catch (err: any) {
    console.error('Failed to sync passages to Firestore:', err);
    return {
      success: false,
      totalSynced: completed,
      error: err?.message || 'Failed to write passages batch to Firestore.'
    };
  }
}
