import React, { useState, useEffect, useMemo } from 'react';
import { EmojiIco } from './Ico';
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
          background: 'var(--surface)'
        }}
      >
        {/* 1. Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--tw-slate-900) 0%, var(--tw-indigo-950) 50%, var(--tw-indigo-900) 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.6rem' }}>🎓</span>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
                  My Enrolled Courses & Test Series
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--tw-indigo-200)', lineHeight: 1.4 }}>
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
                    background: 'linear-gradient(135deg, var(--tw-amber-500) 0%, var(--tw-amber-600) 100%)',
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
                  fontSize: '1.25rem',
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
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--tw-sky-400)' }}>{courses.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Orders
                </div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--tw-green-400)' }}>{activeCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Passes
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--tw-yellow-400)' }}>{pendingCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>
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
              background: 'var(--bg-slate-50)',
              borderBottom: '1px solid var(--bd-slate-200)',
              overflowX: 'auto'
            }}
          >
            <button
              onClick={() => setFilterTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filterTab === 'all' ? 'var(--tw-indigo-600)' : 'var(--bd-slate-300)',
                background: filterTab === 'all' ? 'var(--bg-indigo-100)' : 'var(--surface)',
                color: filterTab === 'all' ? 'var(--fg-indigo-800)' : 'var(--fg-slate-600)',
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
                borderColor: filterTab === 'active' ? 'var(--tw-green-600)' : 'var(--bd-slate-300)',
                background: filterTab === 'active' ? 'var(--bg-green-100)' : 'var(--surface)',
                color: filterTab === 'active' ? 'var(--fg-green-800)' : 'var(--fg-slate-600)',
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
                borderColor: filterTab === 'pending' ? 'var(--tw-amber-600)' : 'var(--bd-slate-300)',
                background: filterTab === 'pending' ? 'var(--bg-amber-100)' : 'var(--surface)',
                color: filterTab === 'pending' ? 'var(--fg-amber-800)' : 'var(--fg-slate-600)',
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
                  borderColor: filterTab === 'expired' ? 'var(--tw-red-600)' : 'var(--bd-slate-300)',
                  background: filterTab === 'expired' ? 'var(--bg-red-100)' : 'var(--surface)',
                  color: filterTab === 'expired' ? 'var(--fg-red-800)' : 'var(--fg-slate-600)',
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--bg-slate-50)' }}>
          {/* Guest State */}
          {!currentUser ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--surface)',
                border: '1.5px dashed var(--bd-slate-300)',
                borderRadius: '12px'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--fg-slate-900)' }}>
                Please Sign In to View Your Courses
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--fg-slate-500)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                Your purchases, mock test series passes, and payment verification records are linked to your candidate account.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                }}
              >
                🔑 Login / Sign In (लॉगिन करें)
              </button>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--fg-slate-500)' }}>
              <div style={{ fontSize: '2.1rem', marginBottom: '10px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Loading your courses and passes...</div>
            </div>
          ) : courses.length === 0 ? (
            /* Empty State */
            <div
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                background: 'var(--surface)',
                border: '1.5px dashed var(--bd-slate-300)',
                borderRadius: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 900, color: 'var(--fg-slate-900)' }}>
                No Enrolled Courses Found
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--fg-slate-500)', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                You have not purchased any examination passes yet. Unlock official mock test series, bilingual typing simulators, and benchmark accuracy grading.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenPayment();
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--tw-violet-600) 0%, var(--tw-indigo-600) 100%)',
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
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--fg-slate-500)' }}>
              No passes found under the <strong>{filterTab}</strong> filter.
            </div>
          ) : (
            /* Course Cards Grid */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredList.map((c) => {
                const dest = c.destination;

                // Status styling
                let statusBadge = {
                  bg: 'var(--bg-amber-100)',
                  border: 'var(--bd-amber-200)',
                  text: 'var(--fg-amber-800)',
                  label: '⏳ VERIFICATION PENDING'
                };

                if (c.isApproved) {
                  if (c.isExpired) {
                    statusBadge = {
                      bg: 'var(--bg-red-100)',
                      border: 'var(--bd-red-300)',
                      text: 'var(--fg-red-800)',
                      label: '⌛ EXPIRED'
                    };
                  } else {
                    statusBadge = {
                      bg: 'var(--bg-green-100)',
                      border: 'var(--bd-green-300)',
                      text: 'var(--fg-green-700)',
                      label: '✅ ACTIVE & UNLOCKED'
                    };
                  }
                } else if (c.isRejected) {
                  statusBadge = {
                    bg: 'var(--bg-red-100)',
                    border: 'var(--bd-red-300)',
                    text: 'var(--fg-red-800)',
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
                      background: 'var(--surface)',
                      border: c.isApproved && !c.isExpired ? '2px solid var(--bd-green-300)' : '1px solid var(--bd-slate-200)',
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
                            background: c.isApproved && !c.isExpired ? 'var(--bg-green-50)' : 'var(--bg-slate-50)',
                            border: `1.5px solid ${c.isApproved && !c.isExpired ? 'var(--bd-green-300)' : 'var(--bd-slate-300)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            flexShrink: 0
                          }}
                        >
                          <EmojiIco e={dest.emblemEmoji} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--fg-slate-900)' }}>
                              {dest.examTitle || c.planName}
                            </h3>
                            {dest.badge && (
                              <span
                                style={{
                                  background: 'var(--bg-sky-100)',
                                  color: 'var(--fg-sky-600)',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                {dest.badge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
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
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                          }}
                        >
                          {statusBadge.label}
                        </span>
                        {c.isApproved && !c.isExpired && c.daysRemaining !== null && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--fg-green-600)', fontWeight: 700 }}>
                            ⏳ {c.daysRemaining} days left {expiryFormatted ? `(till ${expiryFormatted})` : ''}
                          </span>
                        )}
                        {c.isExpired && expiryFormatted && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--fg-red-600)', fontWeight: 700 }}>
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
                        background: 'var(--bg-slate-50)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--fg-slate-600)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: 'var(--fg-green-600)', fontWeight: 900 }}>✓</span> Full Mock Test Series
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: 'var(--fg-green-600)', fontWeight: 900 }}>✓</span> Official Accuracy & Net WPM Grading
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: 'var(--fg-green-600)', fontWeight: 900 }}>✓</span> AI-Calibrated Passages
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: 'var(--fg-green-600)', fontWeight: 900 }}>✓</span> Instant Scorecard & Keystroke Audit
                      </span>
                    </div>

                    {/* Order Details & UTR */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '8px',
                        fontSize: '0.8rem',
                        borderTop: '1px solid var(--bd-slate-100)',
                        paddingTop: '8px'
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--tw-slate-400)' }}>Amount Paid:</span>{' '}
                        <strong style={{ color: 'var(--fg-slate-900)' }}>
                          ₹{c.finalAmount || c.finalAmountPaid || c.originalAmount}
                        </strong>
                        {c.promoCodeUsed || c.promoCodeApplied ? (
                          <span style={{ color: 'var(--fg-green-600)', fontSize: '0.75rem', marginLeft: '4px' }}>
                            ({c.promoCodeUsed || c.promoCodeApplied})
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <span style={{ color: 'var(--tw-slate-400)' }}>UTR No:</span>{' '}
                        <strong style={{ color: 'var(--fg-slate-900)', fontFamily: 'monospace' }}>{c.utrNumber}</strong>
                        <button
                          onClick={() => handleCopyUtr(c.utrNumber)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: copiedUtr === c.utrNumber ? 'var(--fg-green-600)' : 'var(--fg-sky-600)',
                            marginLeft: '4px'
                          }}
                          title="Copy UTR number"
                        >
                          {copiedUtr === c.utrNumber ? '✓ Copied' : '📋'}
                        </button>
                      </div>

                      <div>
                        <span style={{ color: 'var(--tw-slate-400)' }}>Order Date:</span>{' '}
                        <strong style={{ color: 'var(--fg-slate-900)' }}>{submittedDate}</strong>
                      </div>
                    </div>

                    {/* Rejected Reason Alert */}
                    {c.isRejected && c.rejectionReason && (
                      <div
                        style={{
                          background: 'var(--bg-red-50)',
                          border: '1px solid var(--bd-red-300)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          color: 'var(--fg-red-700)'
                        }}
                      >
                        <strong>Rejection Reason:</strong> {c.rejectionReason}
                      </div>
                    )}

                    {/* Pending Advice Alert */}
                    {c.isPending && (
                      <div
                        style={{
                          background: 'var(--bg-amber-50)',
                          border: '1px solid var(--bd-amber-200)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          color: 'var(--fg-amber-800)',
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
                              background: 'var(--tw-blue-600)',
                              color: '#ffffff',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '0.75rem',
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
                              background: 'linear-gradient(135deg, var(--tw-green-600) 0%, var(--tw-green-700) 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '11px 22px',
                              fontSize: '0.95rem',
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
                              background: 'var(--surface)',
                              border: '1.5px solid var(--tw-sky-600)',
                              color: 'var(--fg-sky-600)',
                              borderRadius: '10px',
                              padding: '11px 18px',
                              fontSize: '0.875rem',
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
                            background: 'linear-gradient(135deg, var(--tw-amber-500) 0%, var(--tw-amber-600) 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontSize: '0.875rem',
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
                            background: 'var(--tw-red-600)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontSize: '0.875rem',
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
                        <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)', fontStyle: 'italic' }}>
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
            background: 'var(--surface)',
            borderTop: '1px solid var(--bd-slate-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
            🔒 All purchases include dedicated exam scoring benchmarks & AI drills.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-slate-100)',
                border: '1px solid var(--bd-slate-300)',
                color: 'var(--fg-slate-700)',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.875rem',
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
