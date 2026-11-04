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
  reviewedBy?: string; // admin email / uid
}

export const DEFAULT_PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'plan_single_1m',
    name: 'Single Exam Pass',
    badge: 'Focused Prep',
    type: 'single_exam',
    durationDays: 30,
    durationLabel: '1 Month',
    originalPrice: 299,
    discountedPrice: 149,
    features: [
      'Access to 1 Selected Examination (e.g. UP Police or High Court)',
      'All Official Benchmark Speed & Accuracy Modes',
      'Instant AR Typing Evaluation & Result Analytics',
      'Daily Practice & Typing Drills',
      '1 Month Complete Access'
    ]
  },
  {
    id: 'plan_single_3m',
    name: 'Single Exam Pro',
    badge: 'Most Chosen for 1 Exam',
    type: 'single_exam',
    durationDays: 90,
    durationLabel: '3 Months',
    originalPrice: 499,
    discountedPrice: 249,
    features: [
      'Full Access to 1 Selected Examination',
      'Includes All Series & Live Mock Tests for this Exam',
      'In-Depth Backspace & Net WPM Audit Reports',
      'Priority Speed Booster Exercises',
      '3 Months Extended Validity'
    ]
  },
  {
    id: 'plan_category_combo',
    name: 'Category Combo Pass',
    badge: 'Multi-Exam Sector',
    type: 'category_combo',
    durationDays: 90,
    durationLabel: '3 Months',
    originalPrice: 699,
    discountedPrice: 349,
    features: [
      'Access to Entire Sector (e.g. All Courts/Judiciary OR All Police/Defense)',
      'Over 150+ Dedicated Mock Test Series',
      'Both Hindi (Mangal/Kruti) & English Modules',
      'National Percentile & Leaderboard Tracking',
      '3 Months Validity'
    ]
  },
  {
    id: 'plan_all_exams_6m',
    name: 'All 129 Exams Pass (6 Months)',
    badge: 'Popular',
    type: 'all_exams_pass',
    durationDays: 180,
    durationLabel: '6 Months',
    originalPrice: 1199,
    discountedPrice: 599,
    isPopular: true,
    features: [
      '⭐ UNLIMITED Access to ALL 129 Government Examinations',
      '⭐ Complete 877+ Authentic Test Series',
      'UP Police, High Courts, Supreme Court, SSC CGL/CHSL, Delhi Police, BSF, Beltron',
      'Daily 8 Live Simulation Tests (Every Day New)',
      'Detailed Printable Result Sheets with AR Typing Formula',
      '6 Months Complete Freedom'
    ]
  },
  {
    id: 'plan_all_exams_12m',
    name: 'Mega All-Access VIP Pass (1 Year)',
    badge: '🔥 BEST VALUE',
    type: 'all_exams_pass',
    durationDays: 365,
    durationLabel: '1 Full Year (12 Months)',
    originalPrice: 1999,
    discountedPrice: 799,
    isBestValue: true,
    features: [
      '👑 Complete VIP Access to ALL 129 Examinations',
      '👑 ALL 877+ Tests + ALL Future Exam Series Included',
      'All Languages: Hindi Mangal, Kruti Dev 010 & English',
      'Unlimited Re-attempts & Full Exam Hall Simulation',
      'Personal Error Analytics & Finger Weakness Telemetry',
      'Full 12 Months Unconditional Validity'
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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

// 3. Payment Submissions Management
export async function submitPaymentRequest(
  submission: Omit<PaymentSubmission, 'id' | 'status' | 'submittedAt'>
): Promise<PaymentSubmission> {
  const newSubmission: PaymentSubmission = {
    ...submission,
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

  // 2. Sync to Firebase Firestore
  try {
    const docRef = doc(db, 'payment_submissions', newSubmission.id);
    await setDoc(docRef, newSubmission);
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
  target.reviewedBy = adminEmail;

  // Compute expiry date based on plan
  const plan = getPaymentPlans().find((p) => p.id === target.planId);
  const durationDays = plan?.durationDays || 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  // Update in local storage
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

  // Sync to Firestore
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
  } catch (err) {
    console.warn('Could not sync approval to Firestore:', err);
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

  // Update in local storage
  const localList = getAllLocalSubmissions().map((s) => (s.id === submissionId ? target : s));
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(localList));

  // Sync to Firestore
  try {
    const payRef = doc(db, 'payment_submissions', submissionId);
    await setDoc(payRef, target, { merge: true });
  } catch (err) {
    console.warn('Could not sync rejection to Firestore:', err);
  }

  return { success: true, submission: target };
}
