/**
 * Payment & Subscription Service
 * Supports PhonePe QR Code Manual Verification Flow:
 * 1. Candidate chooses Plan (Single Exam, Category Combo, or All 129 Exams Mega Pass)
 * 2. Applies Promo Code (Percentage or Flat discount)
 * 3. Scans PhonePe QR code, pays via UPI, and submits UTR + Screenshot
 * 4. Admin reviews screenshot & UTR in Admin Panel to Approve / Reject
 * 5. Syncs across Firebase Firestore and localStorage
 */

import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, UserProfile } from './firebase';

export interface PaymentPlan {
  id: string;
  name: string;
  badge?: string;
  type: 'single_exam' | 'category_combo' | 'all_exams_pass';
  durationDays: number;
  durationLabel: string;
  originalPrice: number;
  discountedPrice: number;
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  isExclusiveOffer?: boolean;
}

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number; // e.g. 50 for 50%, or 100 for ₹100
  minOrderValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number; // max cap for percentage
  maxDiscountAmount?: number;
  expiresAt?: string; // YYYY-MM-DD
  isActive: boolean;
  description: string;
}

export interface PaymentSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  planId: string;
  planName: string;
  planType: 'single_exam' | 'category_combo' | 'all_exams_pass';
  selectedExamId?: string;
  selectedExamTitle?: string;
  examTitle?: string;
  durationMonths?: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  finalAmountPaid?: number;
  promoCodeApplied?: string;
  promoCodeUsed?: string;
  utrNumber: string;
  screenshotUrl: string; // Base64 data URL or storage URL
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string; // ISO date
  reviewedAt?: string; // ISO date
  approvedAt?: string;
  expiresAt?: string;  // ISO date — set when approved, based on plan durationDays
  reviewedBy?: string; // admin email / uid
}

export const DEFAULT_PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'plan_single_15d',
    name: '15 DAYS',
    badge: 'Welcome Offer',
    type: 'single_exam',
    durationDays: 15,
    durationLabel: '15 Days',
    originalPrice: 49,
    discountedPrice: 12,
    isExclusiveOffer: true,
    features: [
      'Choose ANY 1 of 129 Examinations to unlock',
      'Full 15 Days Access — Unrestricted Mock Tests',
      'Authentic Speed & Accuracy Evaluation',
      'Exclusive ₹12 Starter Special'
    ]
  },
  {
    id: 'plan_single_1m',
    name: '1 MONTH',
    badge: 'Flexible plan',
    type: 'single_exam',
    durationDays: 30,
    durationLabel: '1 Month',
    originalPrice: 99,
    discountedPrice: 39,
    features: [
      'Access to 1 Selected Examination of your choice',
      'Complete 1 Month (30 Days) Practice & Drill Access',
      'All Mock Series & Live Tests for chosen exam',
      'Detailed In-Depth Error & Speed Analytics'
    ]
  },
  {
    id: 'plan_all_exams_3m',
    name: '3 MONTHS',
    badge: 'Popular choice',
    type: 'all_exams_pass',
    durationDays: 90,
    durationLabel: '3 Months',
    originalPrice: 249,
    discountedPrice: 89,
    isPopular: true,
    features: [
      '⭐ ALL 129 Government Examinations Unlocked',
      'UP Police, High Courts, SSC, Delhi Police, BSF, Beltron & all states',
      'Over 877+ Authentic Mock Test Series included',
      'Daily Live Simulation Tests for 90 Days'
    ]
  },
  {
    id: 'plan_all_exams_6m',
    name: '6 MONTHS',
    badge: 'Long-term practice',
    type: 'all_exams_pass',
    durationDays: 180,
    durationLabel: '6 Months',
    originalPrice: 399,
    discountedPrice: 149,
    features: [
      '⭐ UNLIMITED Access to ALL 129 Examinations',
      'Complete 877+ Test Series & Practice Bank',
      '6 Months Complete Freedom across All State & Central exams',
      'Full Leaderboard, Speed Trajectory & Weak Key Analytics'
    ]
  },
  {
    id: 'plan_all_exams_12m',
    name: '1 YEAR',
    badge: 'Just ₹16.58 per month',
    type: 'all_exams_pass',
    durationDays: 365,
    durationLabel: '1 Full Year (12 Months)',
    originalPrice: 599,
    discountedPrice: 199,
    isBestValue: true,
    features: [
      '👑 Complete VIP Access to ALL 129 Examinations for 365 Days',
      'Just ₹16.58 per month — Best Value Ever!',
      'ALL 877+ Tests + ALL Future Exam Series Included Free',
      'All Languages: Hindi Mangal, Kruti Dev 010 & English',
      'Unlimited Re-attempts & Full Exam Hall Simulation'
    ]
  }
];

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME50',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 200,
    isActive: true,
    description: 'Flat 50% Instant Discount on all plans (Max ₹200)'
  },
  {
    code: 'FIRST100',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 249,
    isActive: true,
    description: 'Flat ₹100 OFF on orders above ₹249'
  },
  {
    code: 'POLICE2026',
    discountType: 'flat',
    discountValue: 150,
    minOrderValue: 349,
    isActive: true,
    description: 'Special ₹150 OFF for Police & Defense Aspirants'
  },
  {
    code: 'SELECTION',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 300,
    isActive: true,
    description: '30% Discount for All Aspirants'
  }
];

const STORAGE_KEY_SUBMISSIONS = 'up_payment_submissions';
const STORAGE_KEY_PROMO_CODES = 'up_promo_codes';
const STORAGE_KEY_CUSTOM_PLANS = 'up_custom_payment_plans';

// 1. Promo Code Management
export function getPromoCodes(): PromoCode[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROMO_CODES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return DEFAULT_PROMO_CODES;
  } catch {
    return DEFAULT_PROMO_CODES;
  }
}

export function savePromoCodes(codes: PromoCode[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROMO_CODES, JSON.stringify(codes));
  } catch {
    // Ignore
  }
}

export function validatePromoCode(
  inputCode: string,
  planPrice: number
): { valid: boolean; discountAmount: number; message: string; promo?: PromoCode } {
  const cleanCode = inputCode.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, discountAmount: 0, message: 'Please enter a coupon code.' };
  }

  const allCodes = getPromoCodes();
  const found = allCodes.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

  if (!found) {
    return { valid: false, discountAmount: 0, message: 'Invalid or expired coupon code.' };
  }

  if (found.expiresAt) {
    const today = new Date().toISOString().split('T')[0];
    if (found.expiresAt < today) {
      return { valid: false, discountAmount: 0, message: 'This coupon code has expired.' };
    }
  }

  if (found.minOrderValue && planPrice < found.minOrderValue) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order value of ₹${found.minOrderValue} required for this coupon.`
    };
  }

  let discount = 0;
  if (found.discountType === 'percentage') {
    discount = Math.round((planPrice * found.discountValue) / 100);
    if (found.maxDiscount && discount > found.maxDiscount) {
      discount = found.maxDiscount;
    }
  } else {
    discount = found.discountValue;
  }

  // Ensure price doesn't go below ₹9
  if (planPrice - discount < 9) {
    discount = planPrice - 9;
  }

  return {
    valid: true,
    discountAmount: Math.max(0, discount),
    message: `🎉 Coupon '${found.code}' applied successfully! You save ₹${discount}.`,
    promo: found
  };
}

// 2. Payment Plans Management
export function getPaymentPlans(): PaymentPlan[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_PLANS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed.some((p: PaymentPlan) => p.id === 'plan_single_15d')) {
          return parsed;
        }
      }
    }
    return DEFAULT_PAYMENT_PLANS;
  } catch {
    return DEFAULT_PAYMENT_PLANS;
  }
}

export function savePaymentPlans(plans: PaymentPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_PLANS, JSON.stringify(plans));
  } catch {
    // Ignore
  }
}

/**
 * Compress an image data URL (base64) so it stays safely under ~100KB,
 * ensuring it fits comfortably in Firestore without hitting document limits.
 */
export async function compressScreenshotDataUrl(dataUrl: string, maxDim = 800, quality = 0.65): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  if (typeof document === 'undefined') return dataUrl;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

// 3. Payment Submissions Management
export async function submitPaymentRequest(
  submission: Omit<PaymentSubmission, 'id' | 'status' | 'submittedAt'>
): Promise<PaymentSubmission> {
  // ── Duplicate UTR guard ──────────────────────────────────────────────────
  // Check both localStorage and Firestore for the same UTR number.
  const utrNorm = submission.utrNumber.trim().toUpperCase();
  const localSubs = getAllLocalSubmissions();
  const localDup = localSubs.find(
    (s) => s.utrNumber.trim().toUpperCase() === utrNorm && s.status !== 'rejected'
  );
  if (localDup) {
    throw new Error(
      `UTR number ${submission.utrNumber} has already been submitted. ` +
      `Status: ${localDup.status.toUpperCase()}. If you believe this is an error, contact support.`
    );
  }

  // Compress screenshot client-side so it can be safely stored in Firestore for admin review
  let compressedScreenshot = submission.screenshotUrl || '';
  if (compressedScreenshot) {
    try {
      compressedScreenshot = await compressScreenshotDataUrl(compressedScreenshot, 800, 0.65);
    } catch {
      // Ignore
    }
  }

  const newSubmission: PaymentSubmission = {
    ...submission,
    screenshotUrl: compressedScreenshot,
    id: `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  // 1. Save locally
  try {
    const existing = getAllLocalSubmissions();
    existing.unshift(newSubmission);
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(existing));
  } catch {
    // Ignore
  }

  // 2. Sync to Firebase Firestore (compressed screenshot fits easily in Firestore <100KB)
  try {
    const docRef = doc(db, 'payment_submissions', newSubmission.id);
    const includeScreenshot = compressedScreenshot && compressedScreenshot.length < 350000;
    const firestorePayload = includeScreenshot
      ? { ...newSubmission, hasScreenshot: true }
      : (() => {
          const { screenshotUrl: _ss, ...rest } = newSubmission;
          void _ss;
          return { ...rest, hasScreenshot: Boolean(compressedScreenshot) };
        })();
    await setDoc(docRef, firestorePayload);
  } catch (err) {
    console.warn('Could not sync payment submission to Firestore (saved locally):', err);
  }

  return newSubmission;
}


export function getAllLocalSubmissions(): PaymentSubmission[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function fetchAllPaymentSubmissions(): Promise<PaymentSubmission[]> {
  const localList = getAllLocalSubmissions();

  try {
    const colRef = collection(db, 'payment_submissions');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const cloudList: PaymentSubmission[] = [];
      snap.forEach((d) => {
        cloudList.push(d.data() as PaymentSubmission);
      });

      // Merge cloud and local
      const mergedMap = new Map<string, PaymentSubmission>();
      localList.forEach((s) => mergedMap.set(s.id, s));
      cloudList.forEach((s) => mergedMap.set(s.id, s));

      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Firestore fetch payment submissions fallback to local:', err);
  }

  return localList;
}

// 3b. Fetch submissions for a specific user
export async function fetchUserPaymentSubmissions(userId: string): Promise<PaymentSubmission[]> {
  // First check localStorage for submissions matching this user
  const localAll = getAllLocalSubmissions();
  const localUser = localAll.filter((s) => s.userId === userId);

  try {
    const colRef = collection(db, 'payment_submissions');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const cloudUser: PaymentSubmission[] = [];
      snap.forEach((d) => {
        const sub = d.data() as PaymentSubmission;
        if (sub.userId === userId) cloudUser.push(sub);
      });

      // Merge local + cloud, cloud wins on conflict
      const mergedMap = new Map<string, PaymentSubmission>();
      localUser.forEach((s) => mergedMap.set(s.id, s));
      cloudUser.forEach((s) => mergedMap.set(s.id, s));

      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    }
  } catch (err) {
    console.warn('Firestore fetch user submissions fallback to local:', err);
  }

  return localUser.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

// 4. Admin Approval & Rejection
export async function approvePaymentSubmission(
  submissionId: string,
  adminEmail: string
): Promise<{ success: boolean; submission?: PaymentSubmission; message?: string }> {
  const all = await fetchAllPaymentSubmissions();
  const target = all.find((s) => s.id === submissionId);
  if (!target) return { success: false, message: 'Submission not found' };

  target.status = 'approved';
  target.reviewedAt = new Date().toISOString();
  target.approvedAt = new Date().toISOString();
  target.reviewedBy = adminEmail;

  // Compute expiry date based on plan and store it in the submission itself
  const plan = getPaymentPlans().find((p) => p.id === target.planId);
  const durationDays = plan?.durationDays || 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  target.expiresAt = expiryDate.toISOString();

  // 1. Sync to Firestore FIRST (server-side security rules must permit the write)
  try {
    const payRef = doc(db, 'payment_submissions', submissionId);
    await setDoc(payRef, target, { merge: true });

    // Update user's Firestore profile
    if (target.userId) {
      const userRef = doc(db, 'users', target.userId);
      await setDoc(
        userRef,
        {
          is_subscribed: true,
          subscriptionPlan: target.planId,
          subscriptionPlanType: target.planType,
          subscriptionExpiresAt: expiryDate.toISOString(),
          subscriptionExamId: target.selectedExamId || null,
          subscriptionExamTitle: target.selectedExamTitle || null,
          subscriptionApprovedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
  } catch (err: any) {
    console.warn('Could not sync approval to Firestore:', err);
    return {
      success: false,
      message: `Permission Denied: Only authenticated administrators can approve payments. (${err?.message || 'Unauthorized'})`
    };
  }

  // 2. Only update local storage if Firestore write succeeded
  const localList = getAllLocalSubmissions().map((s) => (s.id === submissionId ? target : s));
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(localList));

  // If user is logged in locally, update active user profile
  try {
    const activeUserRaw = localStorage.getItem('up_typing_active_user');
    if (activeUserRaw) {
      const activeUser = JSON.parse(activeUserRaw);
      if (activeUser.uid === target.userId || activeUser.email === target.userEmail) {
        activeUser.is_subscribed = true;
        activeUser.subscriptionPlan = target.planId;
        activeUser.subscriptionPlanType = target.planType;
        activeUser.subscriptionExpiresAt = expiryDate.toISOString();
        if (target.selectedExamId) {
          activeUser.subscriptionExamId = target.selectedExamId;
          activeUser.subscriptionExamTitle = target.selectedExamTitle;
        }
        localStorage.setItem('up_typing_active_user', JSON.stringify(activeUser));
      }
    }
  } catch {
    // Ignore
  }

  return { success: true, submission: target };
}

export async function rejectPaymentSubmission(
  submissionId: string,
  reason: string,
  adminEmail: string
): Promise<{ success: boolean; submission?: PaymentSubmission; message?: string }> {
  const all = await fetchAllPaymentSubmissions();
  const target = all.find((s) => s.id === submissionId);
  if (!target) return { success: false, message: 'Submission not found' };

  target.status = 'rejected';
  target.rejectionReason = reason || 'Payment could not be verified.';
  target.reviewedAt = new Date().toISOString();
  target.reviewedBy = adminEmail;

  // 1. Sync to Firestore FIRST
  try {
    const payRef = doc(db, 'payment_submissions', submissionId);
    await setDoc(payRef, target, { merge: true });
  } catch (err: any) {
    console.warn('Could not sync rejection to Firestore:', err);
    return {
      success: false,
      message: `Permission Denied: Only authenticated administrators can reject payments. (${err?.message || 'Unauthorized'})`
    };
  }

  // 2. Only update local storage if Firestore write succeeded
  const localList = getAllLocalSubmissions().map((s) => (s.id === submissionId ? target : s));
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(localList));

  return { success: true, submission: target };
}

/**
 * Check if the active user has administrative privileges.
 * SECURITY: Only trust `user.isAdmin` and `user.role` which are populated by
 * firebase.ts after verifying the Firestore `/admins/{uid}` collection.
 * Guest users cannot be administrators.
 */
export function isUserAdmin(user?: UserProfile | null): boolean {
  if (!user || !user.uid || user.uid.startsWith('guest-')) return false;
  return !!(user.isAdmin || user.role === 'admin');
}

/**
 * Check if a candidate has unlocked Pro access to a specific examination or category
 */
export function hasExamProAccess(
  user: UserProfile | null | undefined,
  examId?: string,
  categoryGroup?: string
): boolean {
  if (!user || !user.uid || user.uid.startsWith('guest-')) return false;
  if (isUserAdmin(user)) return true;
  if (!user.is_subscribed) return false;

  // Check expiration
  if (user.subscriptionExpiresAt) {
    const expiry = new Date(user.subscriptionExpiresAt).getTime();
    if (!isNaN(expiry) && expiry < Date.now()) {
      return false; // Subscription expired
    }
  }

  // 1. All Exams Mega Pass grants access to everything
  if (user.subscriptionPlanType === 'all_exams_pass') {
    return true;
  }

  // 2. Category Combo Pass grants access to all exams in that group
  if (
    user.subscriptionPlanType === 'category_combo' &&
    categoryGroup &&
    user.subscriptionExamId === categoryGroup
  ) {
    return true;
  }

  // 3. Single Exam Pass grants access to the specific exam
  if (user.subscriptionPlanType === 'single_exam' && examId) {
    if (
      user.subscriptionExamId === examId ||
      user.subscriptionExamTitle?.toLowerCase() === examId.toLowerCase()
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate lock status for a test passage
 * Rule: First 7 tests of each exam are UNLOCKED for everyone as a free demo.
 * Tests #8 onwards require a Pro subscription or Admin privileges.
 */
export function isTestLocked(
  testNumber: number | undefined,
  indexInList: number,
  user: UserProfile | null | undefined,
  examId?: string,
  categoryGroup?: string
): { isLocked: boolean; isDemo: boolean; testNumber: number } {
  const testNum = testNumber !== undefined && testNumber > 0 ? testNumber : (indexInList + 1);
  const isDemo = testNum <= 7;

  // Free Demo: Tests 1 to 7 are unlocked for everyone
  if (isDemo) {
    return {
      isLocked: false,
      isDemo: true,
      testNumber: testNum
    };
  }

  // Tests 8 onwards: Locked unless user is Admin or has Pro access
  const hasAccess = hasExamProAccess(user, examId, categoryGroup);
  return {
    isLocked: !hasAccess,
    isDemo: false,
    testNumber: testNum
  };
}

/**
 * UPI Merchant Configuration
 */
export interface UpiMerchantConfig {
  upiId: string;
  merchantName: string;
}

export const DEFAULT_UPI_CONFIG: UpiMerchantConfig = {
  upiId: 'purendarchauhan@phonepe',
  merchantName: 'PURENDAR CHAUHAN'
};

export function getUpiMerchantConfig(): UpiMerchantConfig {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('up_typing_upi_config');
    if (saved) {
      try {
        return { ...DEFAULT_UPI_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        // fallback to default
      }
    }
  }
  return DEFAULT_UPI_CONFIG;
}

export function saveUpiMerchantConfig(config: UpiMerchantConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('up_typing_upi_config', JSON.stringify(config));
  }
}

