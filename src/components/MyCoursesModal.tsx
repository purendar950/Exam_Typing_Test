import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../services/firebase';
import { PaymentSubmission, fetchUserPaymentSubmissions } from '../services/paymentService';
import { resolveCourseDestination, openPurchasedCourse } from '../utils/courseNavigation';
import { getTelegramConfig, TelegramConfig } from '../services/telegramService';

interface MyCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenPayment: (examId?: string) => void;
  onNavigateToCourse?: (course: PaymentSubmission) => void;
}

export const MyCoursesModal: React.FC<MyCoursesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onOpenPayment,
  onNavigateToCourse
}) => {
  const [courses, setCourses] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);

  useEffect(() => {
    if (!isOpen || !currentUser) {
      if (!currentUser) setCourses([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getTelegramConfig()
      .then((cfg) => {
        if (isMounted) setTelegramConfig(cfg);
      })
      .catch(() => {});

    fetchUserPaymentSubmissions(currentUser.uid)
      .then((data) => {
        if (isMounted) setCourses(data);
      })
      .catch((err) => {
        console.warn('Failed to fetch user courses:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  // Compute status helpers
  const categorizedCourses = useMemo(() => {
    const now = Date.now();
    return courses.map((course) => {
      const isApproved = course.status === 'approved';
      const isPending = course.status === 'pending';
      const isRejected = course.status === 'rejected';

      let isExpired = false;
      let daysRemaining: number | null = null;

      if (isApproved && course.expiresAt) {
        const expiryTime = new Date(course.expiresAt).getTime();
        if (!isNaN(expiryTime)) {
          if (expiryTime < now) {
            isExpired = true;
            daysRemaining = 0;
          } else {
            daysRemaining = Math.max(1, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)));
          }
        }
      }

      const destination = resolveCourseDestination(course);

      return {
        ...course,
        destination,
        isApproved,
        isPending,
        isRejected,
        isExpired,
        daysRemaining
      };
    });
  }, [courses]);

  const activeCount = useMemo(
    () => categorizedCourses.filter((c) => c.isApproved && !c.isExpired).length,
    [categorizedCourses]
  );
  const pendingCount = useMemo(
    () => categorizedCourses.filter((c) => c.isPending).length,
    [categorizedCourses]
  );
  const expiredCount = useMemo(
    () => categorizedCourses.filter((c) => c.isExpired || c.isRejected).length,
    [categorizedCourses]
  );

  const filteredList = useMemo(() => {
    if (filterTab === 'active') return categorizedCourses.filter((c) => c.isApproved && !c.isExpired);
    if (filterTab === 'pending') return categorizedCourses.filter((c) => c.isPending);
    if (filterTab === 'expired') return categorizedCourses.filter((c) => c.isExpired || c.isRejected);
    return categorizedCourses;
  }, [categorizedCourses, filterTab]);

  if (!isOpen) return null;

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard?.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleDirectOpenCourse = (course: PaymentSubmission) => {
    openPurchasedCourse(course, {
      onBeforeNavigate: () => {
        onClose();
      },
      onAfterNavigate: () => {
        if (onNavigateToCourse) {
          onNavigateToCourse(course);
        }
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.45)',
          background: '#ffffff'
        }}
      >
        {/* 1. Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.6rem' }}>🎓</span>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
                  My Enrolled Courses & Test Series
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#c7d2fe', lineHeight: 1.4 }}>
                {currentUser
                  ? `Candidate: ${currentUser.displayName} (${currentUser.rollNumber}) • Access your purchased exam passes & mock tests`
                  : 'Sign in to access your purchased typing courses & test series'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPayment();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '7px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>➕</span>
                  <span>Explore Plans</span>
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>
          </div>

          {/* Metric Bar */}
          {currentUser && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginTop: '16px',
                background: 'rgba(15, 23, 42, 0.45)',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>{courses.length}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Orders
                </div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4ade80' }}>{activeCount}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Passes
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#facc15' }}>{pendingCount}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Pending Verification
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Filter Pills Bar */}
        {currentUser && courses.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              overflowX: 'auto'
            }}
          >
            <button
              onClick={() => setFilterTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filterTab === 'all' ? '#4f46e5' : '#cbd5e1',
                background: filterTab === 'all' ? '#e0e7ff' : '#ffffff',
                color: filterTab === 'all' ? '#3730a3' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              All Passes ({courses.length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filterTab === 'active' ? '#16a34a' : '#cbd5e1',
                background: filterTab === 'active' ? '#dcfce7' : '#ffffff',
                color: filterTab === 'active' ? '#166534' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🟢 Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filterTab === 'pending' ? '#d97706' : '#cbd5e1',
                background: filterTab === 'pending' ? '#fef3c7' : '#ffffff',
                color: filterTab === 'pending' ? '#92400e' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⏳ Pending ({pendingCount})
            </button>
            {expiredCount > 0 && (
              <button
                onClick={() => setFilterTab('expired')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: filterTab === 'expired' ? '#dc2626' : '#cbd5e1',
                  background: filterTab === 'expired' ? '#fee2e2' : '#ffffff',
                  color: filterTab === 'expired' ? '#991b1b' : '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ⌛ Expired / Other ({expiredCount})
              </button>
            )}
          </div>
        )}

        {/* 3. Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f8fafc' }}>
          {/* Guest State */}
          {!currentUser ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: '#ffffff',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '12px'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Please Sign In to View Your Courses
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                Your purchases, mock test series passes, and payment verification records are linked to your candidate account.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                }}
              >
                🔑 Login / Sign In (लॉगिन करें)
              </button>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Loading your courses and passes...</div>
            </div>
          ) : courses.length === 0 ? (
            /* Empty State */
            <div
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                background: '#ffffff',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ fontSize: '3.2rem', marginBottom: '12px' }}>🎯</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                No Enrolled Courses Found
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748b', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                You have not purchased any examination passes yet. Unlock official mock test series, bilingual typing simulators, and benchmark accuracy grading.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenPayment();
                }}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🛒</span>
                <span>View Plans & Purchase Exam Pass</span>
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No passes found under the <strong>{filterTab}</strong> filter.
            </div>
          ) : (
            /* Course Cards Grid */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredList.map((c) => {
                const dest = c.destination;

                // Status styling
                let statusBadge = {
                  bg: '#fef3c7',
                  border: '#fde68a',
                  text: '#92400e',
                  label: '⏳ VERIFICATION PENDING'
                };

                if (c.isApproved) {
                  if (c.isExpired) {
                    statusBadge = {
                      bg: '#fee2e2',
                      border: '#fca5a5',
                      text: '#991b1b',
                      label: '⌛ EXPIRED'
                    };
                  } else {
                    statusBadge = {
                      bg: '#dcfce7',
                      border: '#86efac',
                      text: '#15803d',
                      label: '✅ ACTIVE & UNLOCKED'
                    };
                  }
                } else if (c.isRejected) {
                  statusBadge = {
                    bg: '#fee2e2',
                    border: '#fca5a5',
                    text: '#991b1b',
                    label: '❌ REJECTED'
                  };
                }

                const submittedDate = new Date(c.submittedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });

                const expiryFormatted = c.expiresAt
                  ? new Date(c.expiresAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : null;

                return (
                  <div
                    key={c.id}
                    style={{
                      background: '#ffffff',
                      border: c.isApproved && !c.isExpired ? '2px solid #86efac' : '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      boxShadow: c.isApproved && !c.isExpired
                        ? '0 4px 16px rgba(34, 197, 94, 0.12)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    {/* Top Row: Emblem + Titles + Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: c.isApproved && !c.isExpired ? '#f0fdf4' : '#f8fafc',
                            border: `1.5px solid ${c.isApproved && !c.isExpired ? '#86efac' : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            flexShrink: 0
                          }}
                        >
                          {dest.emblemEmoji}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                              {dest.examTitle || c.planName}
                            </h3>
                            {dest.badge && (
                              <span
                                style={{
                                  background: '#e0f2fe',
                                  color: '#0284c7',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                {dest.badge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                            Plan: <strong>{c.planName}</strong>
                            {dest.postTitle && dest.postTitle !== dest.examTitle && (
                              <span> &bull; Post: <strong>{dest.postTitle}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span
                          style={{
                            background: statusBadge.bg,
                            border: `1px solid ${statusBadge.border}`,
                            color: statusBadge.text,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.74rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                          }}
                        >
                          {statusBadge.label}
                        </span>
                        {c.isApproved && !c.isExpired && c.daysRemaining !== null && (
                          <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700 }}>
                            ⏳ {c.daysRemaining} days left {expiryFormatted ? `(till ${expiryFormatted})` : ''}
                          </span>
                        )}
                        {c.isExpired && expiryFormatted && (
                          <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                            Expired on {expiryFormatted}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Features checklist strip */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px 16px',
                        background: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        color: '#475569'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Full Mock Test Series
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Official Accuracy & Net WPM Grading
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> AI-Calibrated Passages
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 900 }}>✓</span> Instant Scorecard & Keystroke Audit
                      </span>
                    </div>

                    {/* Order Details & UTR */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '8px',
                        fontSize: '0.78rem',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '8px'
                      }}
                    >
                      <div>
                        <span style={{ color: '#94a3b8' }}>Amount Paid:</span>{' '}
                        <strong style={{ color: '#0f172a' }}>
                          ₹{c.finalAmount || c.finalAmountPaid || c.originalAmount}
                        </strong>
                        {c.promoCodeUsed || c.promoCodeApplied ? (
                          <span style={{ color: '#16a34a', fontSize: '0.7rem', marginLeft: '4px' }}>
                            ({c.promoCodeUsed || c.promoCodeApplied})
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <span style={{ color: '#94a3b8' }}>UTR No:</span>{' '}
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{c.utrNumber}</strong>
                        <button
                          onClick={() => handleCopyUtr(c.utrNumber)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            color: copiedUtr === c.utrNumber ? '#16a34a' : '#0284c7',
                            marginLeft: '4px'
                          }}
                          title="Copy UTR number"
                        >
                          {copiedUtr === c.utrNumber ? '✓ Copied' : '📋'}
                        </button>
                      </div>

                      <div>
                        <span style={{ color: '#94a3b8' }}>Order Date:</span>{' '}
                        <strong style={{ color: '#0f172a' }}>{submittedDate}</strong>
                      </div>
                    </div>

                    {/* Rejected Reason Alert */}
                    {c.isRejected && c.rejectionReason && (
                      <div
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fca5a5',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          color: '#b91c1c'
                        }}
                      >
                        <strong>Rejection Reason:</strong> {c.rejectionReason}
                      </div>
                    )}

                    {/* Pending Advice Alert */}
                    {c.isPending && (
                      <div
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          color: '#92400e',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div>
                          ⏱️ <strong>Under Verification:</strong> Admin usually reviews payment screenshot & UTR within <strong>15–30 minutes</strong> during working hours.
                        </div>
                        {telegramConfig?.enabled && telegramConfig.supportUsername && (
                          <a
                            href={`https://t.me/${telegramConfig.supportUsername.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#2563eb',
                              color: '#ffffff',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            💬 Instant Activation Help
                          </a>
                        )}
                      </div>
                    )}

                    {/* 🚀 PRIMARY ACTION BAR (THE CORE FEATURE!) */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                      {c.isApproved && !c.isExpired ? (
                        <>
                          <button
                            onClick={() => handleDirectOpenCourse(c)}
                            style={{
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '11px 22px',
                              fontSize: '0.92rem',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                              flex: '1 1 200px',
                              justifyContent: 'center'
                            }}
                          >
                            <span>🚀</span>
                            <span>Open Course & Start Practice (कोर्स खोलें)</span>
                          </button>

                          <button
                            onClick={() => handleDirectOpenCourse(c)}
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid #0284c7',
                              color: '#0284c7',
                              borderRadius: '10px',
                              padding: '11px 18px',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              justifyContent: 'center'
                            }}
                          >
                            <span>🎯</span>
                            <span>Browse Mock Series</span>
                          </button>
                        </>
                      ) : c.isExpired ? (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPayment(c.selectedExamId);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>🔄</span>
                          <span>Renew Subscription (योजना रिन्यू करें)</span>
                        </button>
                      ) : c.isRejected ? (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPayment(c.selectedExamId);
                          }}
                          style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>🔄</span>
                          <span>Re-submit Payment Proof</span>
                        </button>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                          Course access unlocks automatically as soon as admin approves the UTR.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            🔒 All purchases include dedicated exam scoring benchmarks & AI drills.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
