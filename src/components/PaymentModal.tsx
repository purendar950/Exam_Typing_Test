import React, { useState, useMemo, useEffect } from 'react';
import {
  PaymentPlan,
  getPaymentPlans,
  validatePromoCode,
  submitPaymentRequest,
  getPromoCodes,
  getUpiMerchantConfig,
  syncPricingConfigFromCloud
} from '../services/paymentService';
import { sendTelegramPaymentNotification } from '../services/telegramService';
import { UserProfile } from '../services/firebase';
import { ALL_EXAMS } from '../data/allExams';
import phonePeQrImg from '../assets/phonepe-qr.png';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  initialSelectedExamId?: string;
  initialPlanId?: string;
  onPaymentSubmitted?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialSelectedExamId,
  initialPlanId,
  onPaymentSubmitted
}) => {
  // Bumped whenever the admin's pricing config is refreshed from Firestore
  const [pricingVersion, setPricingVersion] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    syncPricingConfigFromCloud().then((changed) => {
      if (changed && !cancelled) setPricingVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const plans = useMemo(() => getPaymentPlans(), [pricingVersion]);
  const upiConfig = useMemo(() => getUpiMerchantConfig(), [pricingVersion]);
  const availablePromoCodes = useMemo(() => getPromoCodes().filter((c) => c.isActive), [pricingVersion]);

  // Selected Plan state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (initialPlanId) return initialPlanId;
    return plans.find((p) => p.isBestValue)?.id || plans[plans.length - 1]?.id || plans[0]?.id || 'plan_all_exams_12m';
  });

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  // Single exam selection if single_exam plan chosen
  const [selectedExamId, setSelectedExamId] = useState<string>(initialSelectedExamId || '53');

  // Mobile step navigation (1 = Plan, 2 = Pay via UPI, 3 = Confirm UTR)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // Fintech 15-Minute Price Lock Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15:00
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(900);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const formattedTimer = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  // Copy UPI toast
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const handleCopyUpi = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(upiConfig.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  // Sync when initialPlanId or modal opens
  useEffect(() => {
    if (initialPlanId && isOpen) {
      setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId, isOpen]);

  // Sync when initialSelectedExamId or modal opens
  useEffect(() => {
    if (initialSelectedExamId && isOpen) {
      const match = ALL_EXAMS.find(
        (e) =>
          e.id === initialSelectedExamId ||
          e.slug === initialSelectedExamId ||
          e.title.toLowerCase().includes(initialSelectedExamId.toLowerCase())
      );
      if (match) {
        setSelectedExamId(match.id);
      }
    }
  }, [initialSelectedExamId, isOpen]);

  const selectedExam = useMemo(() => {
    return (
      ALL_EXAMS.find((e) => e.id === selectedExamId || e.slug === selectedExamId) ||
      ALL_EXAMS[0]
    );
  }, [selectedExamId]);

  // Promo code states
  const [couponCode, setCouponCode] = useState<string>('WELCOME50');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(() => {
    const val = validatePromoCode('WELCOME50', selectedPlan?.discountedPrice || 199);
    return val.valid ? { code: 'WELCOME50', discountAmount: val.discountAmount, message: val.message } : null;
  });
  const [promoError, setPromoError] = useState<string>('');

  // Re-calculate promo discount if plan changes
  const currentDiscountAmount = useMemo(() => {
    if (!appliedPromo || selectedPlan.id === 'plan_single_15d' || selectedPlan.id === 'plan_exclusive_12') return 0;
    const reval = validatePromoCode(appliedPromo.code, selectedPlan.discountedPrice);
    return reval.valid ? reval.discountAmount : 0;
  }, [appliedPromo, selectedPlan, pricingVersion]);

  const finalPayable = (selectedPlan.id === 'plan_single_15d' || selectedPlan.id === 'plan_exclusive_12')
    ? 12
    : Math.max(9, selectedPlan.discountedPrice - currentDiscountAmount);

  const totalSavings = Math.max(0, selectedPlan.originalPrice - finalPayable);
  const savingsPct = selectedPlan.originalPrice > 0
    ? Math.round((totalSavings / selectedPlan.originalPrice) * 100)
    : 0;

  // Form states
  const [candidateName, setCandidateName] = useState<string>(currentUser?.displayName || '');
  const [candidateEmail, setCandidateEmail] = useState<string>(currentUser?.email || '');
  const [candidatePhone, setCandidatePhone] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle promo apply
  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim();
    if (!code) {
      setPromoError('Please enter a coupon code.');
      return;
    }
    const result = validatePromoCode(code, selectedPlan.discountedPrice);
    if (!result.valid) {
      setPromoError(result.message);
      setAppliedPromo(null);
    } else {
      setPromoError('');
      setAppliedPromo({
        code: result.promo?.code || code,
        discountAmount: result.discountAmount,
        message: result.message
      });
    }
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('That image is larger than 5 MB. Please upload a smaller screenshot.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Mobile UPI Launcher
  const handleLaunchUpi = (app: 'generic' | 'gpay' | 'phonepe' | 'paytm') => {
    const vpa = upiConfig.upiId;
    const name = encodeURIComponent(upiConfig.merchantName);
    const note = encodeURIComponent(`ExamTyping ${selectedPlan.name}`);
    const genericUri = `upi://pay?pa=${vpa}&pn=${name}&am=${finalPayable}&cu=INR&tn=${note}`;

    if (app === 'phonepe') {
      window.location.href = `phonepe://pay?pa=${vpa}&pn=${name}&am=${finalPayable}&cu=INR&tn=${note}`;
      setTimeout(() => { window.location.href = genericUri; }, 1200);
    } else if (app === 'gpay') {
      window.location.href = `tez://upi/pay?pa=${vpa}&pn=${name}&am=${finalPayable}&cu=INR&tn=${note}`;
      setTimeout(() => { window.location.href = genericUri; }, 1200);
    } else if (app === 'paytm') {
      window.location.href = `paytmmp://pay?pa=${vpa}&pn=${name}&am=${finalPayable}&cu=INR&tn=${note}`;
      setTimeout(() => { window.location.href = genericUri; }, 1200);
    } else {
      window.location.href = genericUri;
    }
  };

  // Handle submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!candidateName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!candidateEmail.trim() && !currentUser?.email) {
      setErrorMessage('Please enter your email address for account activation.');
      return;
    }
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      setErrorMessage('Please enter a valid 12-digit UPI / UTR Transaction ID from your payment receipt.');
      return;
    }
    if (!screenshotPreview) {
      setErrorMessage('Please upload a screenshot of your successful UPI payment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submission = await submitPaymentRequest({
        userId: currentUser?.uid || `guest_${Date.now()}`,
        userName: candidateName.trim(),
        userEmail: candidateEmail.trim() || currentUser?.email || 'unregistered@candidate.com',
        userPhone: candidatePhone.trim() || undefined,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planType: selectedPlan.type,
        selectedExamId: selectedPlan.type === 'single_exam' ? selectedExam.id : undefined,
        selectedExamTitle: selectedPlan.type === 'single_exam' ? selectedExam.title : undefined,
        originalAmount: selectedPlan.discountedPrice,
        discountAmount: currentDiscountAmount,
        finalAmount: finalPayable,
        promoCodeApplied: appliedPromo?.code,
        utrNumber: cleanUtr,
        screenshotUrl: screenshotPreview
      });

      // Forward screenshot and UTR alert to Admin Telegram Bot
      sendTelegramPaymentNotification(submission).catch((tErr) => {
        console.warn('Telegram forward notice:', tErr);
      });

      setIsSubmitting(false);
      setSubmitSuccess(true);
      if (onPaymentSubmitted) onPaymentSubmitted();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to submit payment verification. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(9, 13, 22, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          animation: 'fadeInUp 0.22s ease-out'
        }}
      >
        {/* ============================================================
            FINTECH TOP HEADER
            ============================================================ */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, var(--tw-gray-950) 0%, var(--tw-slate-900) 45%, var(--tw-indigo-950) 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            position: 'relative'
          }}
        >
          {/* Left: Brand & Verified Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--tw-sky-400) 0%, var(--tw-blue-600) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: 'var(--shadow-md)',
                flexShrink: 0
              }}
            >
              👑
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--tw-sky-400)',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase'
                  }}
                >
                  EXAM TYPING
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--tw-green-400)',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '0.75rem' }}>●</span> UPI PAYMENT
                </span>
              </div>

              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '2px 0 0 0',
                  letterSpacing: '-0.02em',
                  color: '#ffffff'
                }}
              >
                Fintech Pro Checkout
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--tw-slate-400)', margin: '2px 0 0 0' }}>
                Practice smarter. Improve faster. Get exam-ready.
              </p>
            </div>
          </div>

          {/* Right: Security & Price Lock Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.75rem',
                color: 'var(--tw-slate-200)',
                fontWeight: 600
              }}
            >
              <span>⏱️</span>
              <span>Price locked:</span>
              <strong style={{ color: 'var(--tw-amber-400)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {formattedTimer}
              </strong>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Checkout"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'var(--tw-slate-300)',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ============================================================
            STEPPER PROGRESS BAR (Mobile & Quick Nav)
            ============================================================ */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-slate-50)',
            borderBottom: '1px solid var(--bd-slate-200)',
            padding: '8px 20px',
            gap: '8px',
            overflowX: 'auto'
          }}
        >
          {[
            { step: 1, label: '1. Select Plan Tier', icon: '🎯' },
            { step: 2, label: '2. Scan / 1-Click UPI', icon: '⚡' },
            { step: 3, label: '3. Confirm UTR & Submit', icon: '🛡️' }
          ].map((s) => {
            const isActive = mobileStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setMobileStep(s.step as any)}
                style={{
                  background: isActive ? 'var(--tw-slate-900)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--fg-slate-500)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================
            MODAL BODY: 2-COLUMN FINTECH SPLIT
            ============================================================ */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, background: 'var(--bg-slate-50)' }}>
          {submitSuccess ? (
            /* ============================================================
               SUCCESS / INVOICE RECEIPT SCREEN
               ============================================================ */
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--bg-green-100)',
                  color: 'var(--fg-green-700)',
                  fontSize: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                ✓
              </div>

              <span
                style={{
                  background: 'var(--bg-green-100)',
                  color: 'var(--fg-green-700)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-lg)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                PAYMENT PROOF SUBMITTED SUCCESSFULLY
              </span>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--fg-slate-900)', margin: '12px 0 6px 0' }}>
                Thank you, {candidateName}!
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--fg-slate-600)', maxWidth: '540px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                Your UTR reference <strong>{utrNumber}</strong> and payment screenshot for <strong>{selectedPlan.name} (₹{finalPayable})</strong> have been queued for priority admin verification.
              </p>

              {/* Digital Slip */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1.5px solid var(--bd-slate-300)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  maxWidth: '480px',
                  margin: '0 auto 20px auto',
                  textAlign: 'left',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--bd-slate-300)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                      DIGITAL RECEIPT
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      #ET-PAY-{Date.now().toString().slice(-6)}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-green-600)', fontWeight: 600, background: 'var(--bg-green-50)', padding: '4px 10px', borderRadius: 'var(--radius-md)' }}>
                    ● VERIFICATION QUEUED
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--fg-slate-500)' }}>Plan Tier:</span>
                  <span style={{ fontWeight: 700, color: 'var(--fg-slate-900)' }}>{selectedPlan.name} ({selectedPlan.durationLabel})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--fg-slate-500)' }}>Scope:</span>
                  <span style={{ fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                    {selectedPlan.type === 'all_exams_pass' ? '⭐ All 129 Exams' : selectedExam.title}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--fg-slate-500)' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 700, color: 'var(--fg-green-600)', fontSize: '1.1rem' }}>₹{finalPayable}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--fg-slate-500)' }}>UTR / Reference:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--fg-slate-900)' }}>{utrNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', paddingTop: '8px', borderTop: '1px solid var(--bd-slate-100)' }}>
                  <span style={{ color: 'var(--fg-slate-500)' }}>Activation Time:</span>
                  <span style={{ fontWeight: 700, color: 'var(--fg-blue-600)' }}>Within 15–30 Minutes</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '12px 28px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--tw-slate-900)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Continue Practicing Free Demo Tests →
                </button>
                <a
                  href="https://t.me/purendare"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 20px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    background: '#229ed9',
                    color: '#ffffff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem'
                  }}
                >
                  <span>✈️</span>
                  <span>Instant Telegram Activation (@purendare)</span>
                </a>
              </div>
            </div>
          ) : (
            /* ============================================================
               ACTIVE CHECKOUT FLOW: 2-COLUMN RESPONSIVE GRID
               ============================================================ */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '20px',
                alignItems: 'start'
              }}
            >
              {/* ============================================================
                  LEFT COLUMN: PLAN SELECTION & ORDER INVOICE SLIP
                  ============================================================ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Section 1: Choose Plan Tier */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '18px', border: '1px solid var(--bd-slate-200)', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--tw-sky-600)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        1
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                        Select Subscription Tier
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>5 Plans</span>
                  </div>

                  {/* Plan Cards Stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plans.map((p) => {
                      const isSelected = selectedPlanId === p.id;
                      const planSavings = p.originalPrice > p.discountedPrice
                        ? Math.round(((p.originalPrice - p.discountedPrice) / p.originalPrice) * 100)
                        : 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlanId(p.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-200)',
                            background: isSelected ? 'var(--bg-sky-50)' : 'var(--surface)',
                            boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.12)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Custom Radio Button */}
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: isSelected ? '5px solid var(--tw-sky-600)' : '2px solid var(--bd-slate-300)',
                                background: 'var(--surface)',
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--fg-slate-900)' }}>
                                  {p.name}
                                </span>
                                {p.badge && (
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      padding: '1px 6px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: p.isExclusiveOffer
                                        ? 'var(--bg-amber-100)'
                                        : p.isPopular
                                        ? 'var(--bg-blue-100)'
                                        : p.isBestValue
                                        ? 'var(--bg-purple-100)'
                                        : 'var(--bg-slate-100)',
                                      color: p.isExclusiveOffer
                                        ? 'var(--fg-amber-700)'
                                        : p.isPopular
                                        ? 'var(--fg-blue-700)'
                                        : p.isBestValue
                                        ? 'var(--fg-purple-700)'
                                        : 'var(--fg-slate-600)'
                                    }}
                                  >
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                                {p.type === 'all_exams_pass' ? '⭐ All 129 Exams' : '1 Target Exam'} &bull; {p.durationLabel}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isSelected ? 'var(--fg-sky-600)' : 'var(--fg-slate-900)' }}>
                                ₹{p.discountedPrice}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', textDecoration: 'line-through' }}>
                                ₹{p.originalPrice}
                              </span>
                            </div>
                            {planSavings > 0 && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-green-600)' }}>
                                {planSavings}% SAVED
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Target Exam Dropdown (if single exam plan) */}
                  {selectedPlan.type === 'single_exam' && (
                    <div
                      style={{
                        marginTop: '12px',
                        background: 'var(--bg-slate-50)',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--bd-slate-200)'
                      }}
                    >
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-700)', display: 'block', marginBottom: '4px' }}>
                        🎯 Choose Exam to Unlock (out of 129 exams):
                      </label>
                      <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--bd-slate-300)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--surface)'
                        }}
                      >
                        {ALL_EXAMS.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.title} ({ex.language === 'english' ? 'English' : 'Hindi'} • {ex.targetSpeed} WPM)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Section 2: Promo Code / Coupon */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--bd-slate-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'var(--tw-sky-600)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      2
                    </span>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      Apply Discount Coupon
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME50"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--bd-slate-300)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      style={{
                        background: 'var(--tw-sky-600)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        padding: '0 16px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Apply
                    </button>
                  </div>

                  {promoError && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--fg-red-600)', fontWeight: 500, marginTop: '6px' }}>
                      ⚠️ {promoError}
                    </div>
                  )}

                  {appliedPromo && (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--fg-green-700)',
                        background: 'var(--bg-green-50)',
                        border: '1px solid var(--bd-green-200)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '8px'
                      }}
                    >
                      <span>🎉 {appliedPromo.message}</span>
                      <button
                        type="button"
                        onClick={() => setAppliedPromo(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--fg-red-600)', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Available Coupon Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {availablePromoCodes.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCouponCode(c.code);
                          handleApplyPromo(c.code);
                        }}
                        style={{
                          background: 'var(--bg-slate-50)',
                          border: '1px dashed var(--bd-slate-400)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--fg-sky-600)',
                          cursor: 'pointer'
                        }}
                      >
                        🏷️ {c.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3: Official Fintech Invoice Summary Receipt */}
                <div
                  style={{
                    background: 'var(--bg-slate-50)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px',
                    border: '1.5px solid var(--bd-slate-300)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd-slate-200)', paddingBottom: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ORDER SUMMARY & INVOICE
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--tw-slate-400)' }}>
                      #ET-{selectedPlan.durationDays}D
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--fg-slate-600)', marginBottom: '6px' }}>
                    <span>Plan Item:</span>
                    <span style={{ fontWeight: 700, color: 'var(--fg-slate-900)' }}>{selectedPlan.name} ({selectedPlan.durationLabel})</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--fg-slate-600)', marginBottom: '6px' }}>
                    <span>Base MRP:</span>
                    <span style={{ textDecoration: 'line-through', color: 'var(--tw-slate-400)' }}>₹{selectedPlan.originalPrice}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--fg-green-600)', fontWeight: 600, marginBottom: '6px' }}>
                    <span>Plan Discount:</span>
                    <span>- ₹{selectedPlan.originalPrice - selectedPlan.discountedPrice}</span>
                  </div>

                  {currentDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--fg-green-600)', fontWeight: 600, marginBottom: '6px' }}>
                      <span>Coupon ({appliedPromo?.code}):</span>
                      <span>- ₹{currentDiscountAmount}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--fg-slate-600)', marginBottom: '8px' }}>
                    <span>Payment Gateway Fee:</span>
                    <span style={{ color: 'var(--fg-green-600)', fontWeight: 700 }}>FREE (₹0.00)</span>
                  </div>

                  <div
                    style={{
                      borderTop: '2px solid var(--tw-slate-900)',
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        TOTAL PAYABLE
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-green-600)', fontWeight: 600 }}>
                        🎉 You Save ₹{totalSavings} ({savingsPct}%)
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--fg-sky-600)' }}>
                      ₹{finalPayable}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  RIGHT COLUMN: FINTECH UPI GATEWAY CONSOLE
                  ============================================================ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1-Click Mobile UPI App Launchers */}
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    border: '1px solid var(--bd-slate-200)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚡</span>
                      <span>1-Click Pay on Mobile (Instant UPI)</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--fg-green-600)', fontWeight: 600, background: 'var(--bg-green-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                      ZERO FEE
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('phonepe')}
                      style={{
                        background: '#5f259f',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      <span>🟣</span>
                      <span>PhonePe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('gpay')}
                      style={{
                        background: '#1a73e8',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      <span>🔵</span>
                      <span>Google Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('paytm')}
                      style={{
                        background: '#00b9f1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      <span>🔷</span>
                      <span>Paytm UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchUpi('generic')}
                      style={{
                        background: 'var(--tw-slate-900)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>⚡</span>
                      <span>Any UPI App</span>
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', textAlign: 'center', marginTop: '6px' }}>
                    Tapping opens your installed UPI app with ₹{finalPayable} pre-filled.
                  </div>
                </div>

                {/* PhonePe QR Scanner & Copy UPI Card */}
                <div
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px',
                    border: '1.5px solid var(--bd-slate-200)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-slate-900)', marginBottom: '4px' }}>
                    Or scan the QR code
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginBottom: '12px' }}>
                    Scan using PhonePe, GPay, Paytm, BHIM, CRED or any bank app
                  </div>

                  {/* QR Image Container with Fintech Border */}
                  <div
                    style={{
                      background: '#000000',
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      display: 'inline-block',
                      boxShadow: 'var(--shadow-lg)',
                      maxWidth: '210px',
                      border: '3px solid var(--tw-sky-400)'
                    }}
                  >
                    <img
                      src={phonePeQrImg}
                      alt="PhonePe QR Code - PURENDAR CHAUHAN"
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 'var(--radius-md)',
                        display: 'block'
                      }}
                    />
                  </div>

                  {/* Merchant VPA & Copy Button */}
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div
                      style={{
                        background: 'var(--bg-slate-100)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: 'var(--fg-slate-900)'
                      }}
                    >
                      {upiConfig.upiId}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      style={{
                        background: copiedUpi ? 'var(--bg-green-100)' : 'var(--tw-sky-600)',
                        color: copiedUpi ? 'var(--fg-green-700)' : '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {copiedUpi ? '✓ Copied!' : '📋 Copy UPI ID'}
                    </button>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '6px' }}>
                    Payee: <strong>{upiConfig.merchantName}</strong> &bull; Amount: <strong>₹{finalPayable}</strong>
                  </div>
                </div>

                {/* Step 3: Verification & Activation Form */}
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '18px', border: '1.5px solid var(--tw-sky-600)', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'var(--tw-sky-600)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      3
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      Submit UTR & Activate Membership
                    </h3>
                  </div>

                  <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-700)', display: 'block', marginBottom: '3px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--bd-slate-300)',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-700)', display: 'block', marginBottom: '3px' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={candidateEmail}
                          onChange={(e) => setCandidateEmail(e.target.value)}
                          placeholder="name@gmail.com"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--bd-slate-300)',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-700)', display: 'block', marginBottom: '3px' }}>
                          WhatsApp Mobile
                        </label>
                        <input
                          type="tel"
                          value={candidatePhone}
                          onChange={(e) => setCandidatePhone(e.target.value)}
                          placeholder="10-digit mobile"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--bd-slate-300)',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </div>

                    {/* UTR Input with Smart Counter */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                          12-Digit UPI / UTR Transaction ID *
                        </label>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: utrNumber.trim().length === 12 ? 'var(--fg-green-600)' : 'var(--fg-slate-500)'
                          }}
                        >
                          {utrNumber.trim().length === 12 ? '✓ 12 Digits Verified' : `${utrNumber.trim().length}/12 Digits`}
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.trim())}
                        placeholder="e.g. 423985721904"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: utrNumber.trim().length === 12 ? '2px solid var(--tw-green-600)' : '1.5px solid var(--tw-sky-600)',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          letterSpacing: '0.08em',
                          background: utrNumber.trim().length === 12 ? 'var(--bg-green-50)' : 'var(--surface)'
                        }}
                      />
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
                        Found in your PhonePe / GPay / Paytm payment receipt details.
                      </div>
                    </div>

                    {/* Payment Screenshot Upload */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-700)', display: 'block', marginBottom: '3px' }}>
                        Payment Screenshot *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleImageChange}
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--fg-slate-600)'
                        }}
                      />
                      {screenshotPreview && (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={screenshotPreview}
                            alt="Screenshot Preview"
                            style={{
                              maxHeight: '75px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--bd-slate-300)'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setScreenshotPreview('')}
                            style={{
                              background: 'var(--bg-red-100)',
                              color: 'var(--fg-red-600)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Remove ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {errorMessage && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--fg-red-600)', fontWeight: 600, background: 'var(--bg-red-50)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                        ⚠️ {errorMessage}
                      </div>
                    )}

                    {/* Primary Fintech Pay Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: 'var(--tw-emerald-500)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '13px',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: isSubmitting ? 'wait' : 'pointer',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '4px'
                      }}
                    >
                      <span>{isSubmitting ? '⏳' : '⚡'}</span>
                      <span>
                        {isSubmitting ? 'Submitting Verification...' : `Complete Payment & Activate Pro (₹${finalPayable}) →`}
                      </span>
                    </button>

                    {/* Refund & Security Badges */}
                    <div
                      style={{
                        background: 'var(--bg-rose-50)',
                        border: '1px solid var(--bd-rose-200)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 10px',
                        fontSize: '0.75rem',
                        color: 'var(--fg-rose-800)',
                        lineHeight: 1.35
                      }}
                    >
                      🚫 <strong>Strict No-Refund Policy:</strong> All subscription payments are <strong>strictly non-refundable</strong> once processed. Please verify your typing device using our <strong>7 Free Demo Tests</strong> before paying.
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                      <span>🔒 256-Bit SSL</span>
                      <span>&bull;</span>
                      <span>⏱️ 15–30 Min Activation</span>
                      <span>&bull;</span>
                      <span>🏛️ Exam Grade</span>
                    </div>

                    {/* Admin Telegram Direct Assistance */}
                    <div
                      style={{
                        background: 'var(--bg-sky-50)',
                        border: '1px solid var(--bd-sky-200)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--fg-sky-700)' }}>
                        Facing UPI issues or need instant activation?
                      </span>
                      <a
                        href="https://t.me/purendare"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--fg-sky-600)',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Chat Admin (@purendare) ↗
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
