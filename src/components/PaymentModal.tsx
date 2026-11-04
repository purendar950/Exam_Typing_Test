import React, { useState, useMemo, useEffect } from 'react';
import {
  PaymentPlan,
  getPaymentPlans,
  validatePromoCode,
  submitPaymentRequest,
  getPromoCodes
} from '../services/paymentService';
import { sendTelegramPaymentNotification, getTelegramConfig } from '../services/telegramService';
import { UserProfile } from '../services/firebase';
import { ALL_EXAMS } from '../data/allExams';
import phonePeQrImg from '../assets/phonepe-qr.png';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  initialSelectedExamId?: string;
  onPaymentSubmitted?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialSelectedExamId,
  onPaymentSubmitted
}) => {
  const plans = useMemo(() => getPaymentPlans(), []);
  const availablePromoCodes = useMemo(() => getPromoCodes().filter((c) => c.isActive), []);

  // Selected Plan state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return plans.find((p) => p.isBestValue)?.id || plans[plans.length - 1]?.id || plans[0]?.id || 'plan_all_exams_12m';
  });

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0];
  }, [plans, selectedPlanId]);

  // Single exam selection if single_exam plan chosen
  const [selectedExamId, setSelectedExamId] = useState<string>(initialSelectedExamId || '53');

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
    const val = validatePromoCode('WELCOME50', selectedPlan?.discountedPrice || 799);
    return val.valid ? { code: 'WELCOME50', discountAmount: val.discountAmount, message: val.message } : null;
  });
  const [promoError, setPromoError] = useState<string>('');

  // Re-calculate promo discount if plan changes
  const currentDiscountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    const reval = validatePromoCode(appliedPromo.code, selectedPlan.discountedPrice);
    return reval.valid ? reval.discountAmount : 0;
  }, [appliedPromo, selectedPlan]);

  const finalPayable = Math.max(9, selectedPlan.discountedPrice - currentDiscountAmount);

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
      alert('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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
      setErrorMessage('Please enter your email address for subscription activation.');
      return;
    }
    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid 12-digit UPI / UTR Transaction ID from PhonePe/UPI receipt.');
      return;
    }
    if (!screenshotPreview) {
      setErrorMessage('Please upload a screenshot of your successful PhonePe/UPI payment.');
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
        utrNumber: utrNumber.trim(),
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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
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
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>👑</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Upgrade to Pro Examination Membership
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Instant Access to Authentic Test Series • PhonePe UPI QR Code Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              color: '#ffffff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {submitSuccess ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  fontSize: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Payment Submitted for Verification!
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#475569', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                Thank you, <strong>{candidateName}</strong>! Your UTR number <strong>{utrNumber}</strong> and payment screenshot for <strong>{selectedPlan.name} (₹{finalPayable})</strong> have been received by our admin team.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  maxWidth: '460px',
                  margin: '0 auto 24px auto',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>Plan Chosen:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedPlan.name} ({selectedPlan.durationLabel})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{finalPayable}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>UTR / Txn ID:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{utrNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>Verification Status:</span>
                  <span style={{ fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '2px 8px', borderRadius: '4px' }}>
                    ⏳ Pending Admin Approval
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={onClose}
                  style={{ padding: '12px 32px', fontWeight: 700, borderRadius: '8px' }}
                >
                  Continue Practicing Free
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* STEP 1: SELECT PLAN */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.78rem'
                    }}
                  >
                    1
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Select Your Examination Plan
                  </h3>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        style={{
                          border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none'
                        }}
                      >
                        {p.badge && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-9px',
                              right: '12px',
                              backgroundColor: p.isBestValue ? '#16a34a' : p.isPopular ? '#0284c7' : '#e0f2fe',
                              color: p.isBestValue || p.isPopular ? '#ffffff' : '#0369a1',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              letterSpacing: '0.02em'
                            }}
                          >
                            {p.badge}
                          </span>
                        )}

                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                          Validity: <strong>{p.durationLabel}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284c7' }}>
                            ₹{p.discountedPrice}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            ₹{p.originalPrice}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a' }}>
                            {Math.round(((p.originalPrice - p.discountedPrice) / p.originalPrice) * 100)}% OFF
                          </span>
                        </div>

                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                          {p.features.slice(0, 3).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* If Single Exam selected, let candidate pick which exam */}
                {selectedPlan.type === 'single_exam' && (
                  <div
                    style={{
                      marginTop: '12px',
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Choose Target Examination to Unlock:
                    </label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        backgroundColor: '#ffffff'
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

              {/* STEP 2: PROMO CODE & COUPONS */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.78rem'
                    }}
                  >
                    2
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Apply Coupon / Promo Code
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px', maxWidth: '420px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon (e.g. WELCOME50)"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, padding: '0 18px', borderRadius: '6px' }}
                  >
                    Apply
                  </button>
                </div>

                {promoError && (
                  <div style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600, marginBottom: '8px' }}>
                    ⚠️ {promoError}
                  </div>
                )}

                {appliedPromo && (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#15803d',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    <span>{appliedPromo.message}</span>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Available Coupons Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', alignSelf: 'center' }}>Available Coupons:</span>
                  {availablePromoCodes.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCouponCode(c.code);
                        handleApplyPromo(c.code);
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        padding: '3px 9px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#0284c7',
                        cursor: 'pointer'
                      }}
                    >
                      🏷️ {c.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 3 & 4: SCAN QR & SUBMIT UTR */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  
                  {/* Left: PhonePe QR Card */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        background: '#000000',
                        padding: '16px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        maxWidth: '240px'
                      }}
                    >
                      <img
                        src={phonePeQrImg}
                        alt="PhonePe QR Code - PURENDAR CHAUHAN"
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          display: 'block'
                        }}
                      />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                        PURENDAR CHAUHAN
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Accepted via PhonePe, Google Pay, Paytm, BHIM UPI
                      </div>
                    </div>

                    {/* Payable Summary Box */}
                    <div
                      style={{
                        marginTop: '14px',
                        background: '#eff6ff',
                        border: '1.5px solid #bfdbfe',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569', marginBottom: '4px' }}>
                        <span>Plan Price:</span>
                        <span>₹{selectedPlan.discountedPrice}</span>
                      </div>
                      {currentDiscountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#15803d', fontWeight: 700, marginBottom: '4px' }}>
                          <span>Coupon ({appliedPromo?.code}):</span>
                          <span>- ₹{currentDiscountAmount}</span>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '1.05rem',
                          fontWeight: 900,
                          color: '#0f172a',
                          borderTop: '1px solid #bfdbfe',
                          paddingTop: '6px',
                          marginTop: '4px'
                        }}
                      >
                        <span>Final Amount to Pay:</span>
                        <span style={{ color: '#0284c7' }}>₹{finalPayable}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Verification Form */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.78rem'
                        }}
                      >
                        3
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Submit Payment Verification
                      </h3>
                    </div>

                    <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Candidate Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem'
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
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
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.88rem'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                            WhatsApp / Phone
                          </label>
                          <input
                            type="tel"
                            value={candidatePhone}
                            onChange={(e) => setCandidatePhone(e.target.value)}
                            placeholder="10-digit mobile"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.88rem'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          UPI / UTR Transaction ID (12 Digits) *
                        </label>
                        <input
                          type="text"
                          required
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.trim())}
                          placeholder="e.g. 423985721904"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1.5px solid #0284c7',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            letterSpacing: '0.05em'
                          }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Found in your PhonePe / GPay payment receipt details.
                        </span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Payment Screenshot *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={handleImageChange}
                          style={{
                            fontSize: '0.8rem',
                            color: '#475569'
                          }}
                        />
                        {screenshotPreview && (
                          <div style={{ marginTop: '8px' }}>
                            <img
                              src={screenshotPreview}
                              alt="Screenshot Preview"
                              style={{
                                maxHeight: '100px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {errorMessage && (
                        <div style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                          ⚠️ {errorMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                        style={{
                          marginTop: '6px',
                          padding: '12px',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          borderRadius: '8px',
                          cursor: isSubmitting ? 'wait' : 'pointer'
                        }}
                      >
                        {isSubmitting ? 'Submitting Verification...' : `Submit Payment Proof (₹${finalPayable}) →`}
                      </button>

                      <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
                        🔒 100% Secure • Admin manually approves and activates plan within 15–30 minutes
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
