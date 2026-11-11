import React, { useState, useEffect } from 'react';
import { EmojiIco } from './Ico';
import {
  UserProfile,
  UserStats,
  UserStreak,
  computeUserStats,
  computeStreak,
  fetchUserTestAttempts,
  logoutUser
} from '../services/firebase';
import { EvaluationResult } from '../types';
import { PaymentSubmission, fetchUserPaymentSubmissions } from '../services/paymentService';
import { openPurchasedCourse, resolveCourseDestination } from '../utils/courseNavigation';
import { WpmProgressChart } from './WpmProgressChart';
import { KeyboardHeatmap } from './KeyboardHeatmap';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout: () => void;
  onViewScorecard?: (result: EvaluationResult) => void;
  onPracticeWrongWords?: (words: string[]) => void;
  onOpenPayment?: (examId?: string) => void;
  initialTab?: 'overview' | 'history' | 'heatmap' | 'courses' | 'admitCard';
  onNavigateToCourse?: (course: PaymentSubmission) => void;
  onOpenLeaderboard?: () => void;
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onViewScorecard,
  onPracticeWrongWords,
  onOpenPayment,
  initialTab = 'overview',
  onNavigateToCourse,
  onOpenLeaderboard
}) => {
  const [attempts, setAttempts] = useState<EvaluationResult[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'heatmap' | 'courses' | 'admitCard'>(initialTab);
  const [courses, setCourses] = useState<PaymentSubmission[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetchUserTestAttempts(user.uid)
      .then((data) => {
        if (!isMounted) return;
        setAttempts(data);
        setStats(computeUserStats(data));
        setStreak(computeStreak(data));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user.uid]);

  // Fetch user's course/payment submissions when courses tab opens
  useEffect(() => {
    if (!isOpen || activeTab !== 'courses') return;
    let isMounted = true;
    setCoursesLoading(true);
    fetchUserPaymentSubmissions(user.uid)
      .then((data) => { if (isMounted) setCourses(data); })
      .finally(() => { if (isMounted) setCoursesLoading(false); });
    return () => { isMounted = false; };
  }, [isOpen, activeTab, user.uid]);


  if (!isOpen) return null;

  const handlePrintDossier = () => {
    window.print();
  };

  const isLocalOnly = user.uid.startsWith('local-');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}
      >
        {/* 1. Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--tw-slate-900) 0%, var(--tw-blue-900) 100%)',
            color: '#ffffff',
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '2px solid var(--tw-sky-400)',
                  boxShadow: 'var(--shadow-md)',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--tw-sky-600)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {user.displayName}
                </h2>
                <span
                  style={{
                    background: 'var(--bg-green-100)',
                    color: 'var(--fg-green-700)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {user.isAnonymous ? '⚡ Guest Profile' : '☁️ Cloud Synced'}
                </span>
                <span
                  style={{
                    background: user.isAdmin
                      ? 'var(--tw-violet-600)'
                      : user.is_subscribed
                      ? 'var(--tw-emerald-600)'
                      : 'var(--bg-slate-100)',
                    color: user.isAdmin || user.is_subscribed ? '#ffffff' : 'var(--fg-slate-500)',
                    padding: '2px 9px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {user.isAdmin
                    ? '🛡️ Admin (Lifetime)'
                    : user.is_subscribed
                    ? '👑 Pro Member'
                    : '🆓 Free Tier'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', opacity: 0.9, marginTop: '2px', flexWrap: 'wrap' }}>
                <span>Roll No: <strong>{user.rollNumber}</strong></span>
                <span>Post: <strong>{user.category === 'up_police_asi' ? 'ASI (Clerk/Accounts)' : 'Computer Operator Grade-A'}</strong></span>
                <span>Plan: <strong>{user.subscriptionPlanName || (user.isAdmin ? 'All 129+ Exams Mega Pass' : user.is_subscribed ? 'Active Pro' : 'Free Demo (Tests 1-7)')}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handlePrintDossier}
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              🖨️ Print report
            </button>
            <button
              onClick={() => {
                logoutUser();
                onLogout();
                onClose();
              }}
              className="btn btn-sm"
              style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--tw-red-300)', border: '1px solid rgba(239,68,68,0.4)', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Log Out
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--tw-slate-300)', fontSize: '1.4rem', cursor: 'pointer', marginLeft: '4px' }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-slate-50)', borderBottom: '1px solid var(--bd-slate-200)', padding: '0 20px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: activeTab === 'overview' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)',
              borderBottom: activeTab === 'overview' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent'
            }}
          >
            📊 Performance Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: activeTab === 'history' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)',
              borderBottom: activeTab === 'history' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent'
            }}
          >
            📜 Test Attempt History ({attempts.length})
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: activeTab === 'heatmap' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)',
              borderBottom: activeTab === 'heatmap' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent'
            }}
          >
            ⌨️ Key Heatmap
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: activeTab === 'courses' ? 'var(--fg-violet-600)' : 'var(--fg-slate-500)',
              borderBottom: activeTab === 'courses' ? '2.5px solid var(--tw-violet-600)' : '2.5px solid transparent',
              position: 'relative'
            }}
          >
            🎓 My Courses
            {courses.some(c => c.status === 'pending') && (
              <span style={{
                position: 'absolute', top: '8px', right: '6px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--tw-amber-500)', display: 'inline-block'
              }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('admitCard')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: activeTab === 'admitCard' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)',
              borderBottom: activeTab === 'admitCard' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent'
            }}
          >
            🎫 Simulated Admit Card
          </button>
        </div>


        {/* 3. Tab Contents */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--fg-slate-500)' }}>
              Loading your records...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && stats && (
                <div>
                  {/* Daily Practice Streak Banner */}
                  {streak && streak.currentStreak > 0 && (
                    <div
                      style={{
                        background: streak.currentStreak >= 7
                          ? 'linear-gradient(135deg, var(--tw-orange-600) 0%, var(--tw-red-600) 100%)'
                          : streak.currentStreak >= 3
                          ? 'linear-gradient(135deg, var(--tw-amber-500) 0%, var(--tw-orange-600) 100%)'
                          : 'var(--tw-sky-600)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 18px',
                        marginBottom: '16px',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2.1rem' }}>
                          {streak.currentStreak >= 30 ? '🏆' : streak.currentStreak >= 7 ? '🔥' : '⚡'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '0.3px' }}>
                            {streak.currentStreak} Day Practice Streak! {streak.currentStreak >= 7 ? '🔥' : ''}
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.95 }}>
                            {streak.todayCompleted
                              ? '✓ Today\'s practice target complete! Consistency builds qualifying speed.'
                              : 'Keep the chain going! Complete a mock test today.'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{streak.currentStreak}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Best: {streak.longestStreak} days</div>
                      </div>
                    </div>
                  )}

                  {/* Hero Metric Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px',
                      marginBottom: '20px'
                    }}
                  >
                    <div style={{ background: 'var(--bg-slate-50)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Total Tests
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                        {stats.totalTests}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--fg-sky-600)' }}>
                        {stats.hindiTestsCount} Hindi &bull; {stats.englishTestsCount} English
                      </span>
                    </div>

                    <div style={{ background: stats.passRate >= 80 ? 'var(--bg-green-50)' : 'var(--bg-amber-50)', border: `1px solid ${stats.passRate >= 80 ? 'var(--bd-green-300)' : 'var(--bd-amber-200)'}`, borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: stats.passRate >= 80 ? 'var(--fg-green-800)' : 'var(--fg-amber-800)', textTransform: 'uppercase' }}>
                        Qualification Rate
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stats.passRate >= 80 ? 'var(--fg-green-700)' : 'var(--fg-amber-700)' }}>
                        {stats.passRate}%
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                        {stats.qualifiedTests} / {stats.totalTests} Met Cutoffs
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-slate-50)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Avg Net Speed
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-sky-600)' }}>
                        {stats.avgNetWpm} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>WPM</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                        Best: {stats.bestNetWpm} WPM
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-slate-50)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Avg Accuracy
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stats.avgAccuracy >= 85 ? 'var(--fg-green-700)' : 'var(--fg-red-600)' }}>
                        {stats.avgAccuracy}%
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                        Cutoff Threshold: 85%
                      </span>
                    </div>
                  </div>

                  {/* WPM Speed Progress Trajectory Chart */}
                  {attempts.length >= 2 && (
                    <div
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--bd-slate-200)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        marginBottom: '20px'
                      }}
                    >
                      <WpmProgressChart
                        attempts={attempts}
                        targetWpm={user.category === 'up_police_asi' ? 25 : 30}
                      />
                    </div>
                  )}

                  {/* Cutoff Standards Checklist */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      UP Police cutoff readiness
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'var(--bg-slate-50)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Hindi Typing (Mangal/Kruti)</span>
                          <span style={{ fontWeight: 600, color: stats.avgNetWpm >= 25 ? 'var(--fg-green-600)' : 'var(--fg-red-600)', fontSize: '0.8rem' }}>
                            {stats.avgNetWpm >= 25 ? '✓ Ready (25+ WPM)' : 'Needs Practice (< 25 WPM)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '4px' }}>
                          Required: 25 WPM (15 mins, 400 words, 85% accuracy)
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-slate-50)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>English Typing</span>
                          <span style={{ fontWeight: 600, color: stats.avgNetWpm >= 30 ? 'var(--fg-green-600)' : 'var(--fg-red-600)', fontSize: '0.8rem' }}>
                            {stats.avgNetWpm >= 30 ? '✓ Ready (30+ WPM)' : 'Needs Practice (< 30 WPM)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '4px' }}>
                          Required: 30 WPM (15 mins, 500 words, 85% accuracy)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent 3 Attempts */}
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      Recent Test Attempts
                    </h3>
                    {attempts.length === 0 ? (
                      <p style={{ color: 'var(--fg-slate-500)', fontSize: '0.875rem' }}>
                        No test attempts recorded yet. Take your first test to start building your record!
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {attempts.slice(0, 3).map((a, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--bg-slate-50)',
                              border: '1px solid var(--bd-slate-200)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div>
                              <strong style={{ color: 'var(--fg-slate-900)' }}>{a.testTitle}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                                {new Date(a.timestamp).toLocaleDateString()} &bull; {a.language.replace('_', ' ').toUpperCase()}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--fg-sky-600)' }}>{a.netWpm} WPM</span>
                              <span style={{ fontWeight: 700, color: a.accuracy >= 85 ? 'var(--fg-green-600)' : 'var(--fg-red-600)' }}>{a.accuracy}%</span>
                              <span
                                style={{
                                  background: a.isQualified ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                                  color: a.isQualified ? 'var(--fg-green-700)' : 'var(--fg-red-600)',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {a.isQualified ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: FULL TEST HISTORY */}
              {activeTab === 'history' && (
                <div>
                  {attempts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--fg-slate-500)' }}>
                      No test attempts found. Complete mock tests to see full records here.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-slate-100)', borderBottom: '2px solid var(--bd-slate-300)' }}>
                            <th style={{ padding: '8px 12px' }}>Date</th>
                            <th style={{ padding: '8px 12px' }}>Test Passage</th>
                            <th style={{ padding: '8px 12px' }}>Language</th>
                            <th style={{ padding: '8px 12px' }}>Net WPM</th>
                            <th style={{ padding: '8px 12px' }}>Accuracy</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                            <th style={{ padding: '8px 12px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempts.map((a, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--bd-slate-200)' }}>
                              <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: 'var(--fg-slate-500)' }}>
                                {new Date(a.timestamp).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                                {a.testTitle}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ background: 'var(--bg-sky-100)', color: 'var(--fg-sky-700)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
                                  {a.language.startsWith('hindi') ? 'Hindi' : 'English'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--fg-sky-600)' }}>
                                {a.netWpm}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: a.accuracy >= 85 ? 'var(--fg-green-600)' : 'var(--fg-red-600)' }}>
                                {a.accuracy}%
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span
                                  style={{
                                    background: a.isQualified ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                                    color: a.isQualified ? 'var(--fg-green-700)' : 'var(--fg-red-600)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}
                                >
                                  {a.isQualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {onViewScorecard && (
                                    <button
                                      onClick={() => {
                                        onViewScorecard(a);
                                        onClose();
                                      }}
                                      className="btn btn-sm"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem', background: 'var(--bg-slate-200)', color: 'var(--fg-slate-700)' }}
                                    >
                                      Scorecard
                                    </button>
                                  )}
                                  {onPracticeWrongWords && a.wrongWordsList && a.wrongWordsList.length > 0 && (
                                    <button
                                      onClick={() => {
                                        onPracticeWrongWords(a.wrongWordsList);
                                        onClose();
                                      }}
                                      className="btn btn-sm btn-primary"
                                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                    >
                                      2-Min Drill
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: KEYBOARD HEATMAP */}
              {activeTab === 'heatmap' && (
                <div>
                  <KeyboardHeatmap
                    attempts={attempts}
                    onPracticeWords={(words) => {
                      if (onPracticeWrongWords) {
                        onClose();
                        onPracticeWrongWords(words);
                      }
                    }}
                  />
                </div>
              )}

              {/* TAB 3: MY COURSES */}
              {activeTab === 'courses' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>🎓 My Purchased Courses</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                        All exam plans you have submitted for activation
                      </p>
                    </div>
                    {onOpenPayment && (
                      <button
                        onClick={() => { onOpenPayment(); onClose(); }}
                        style={{
                          background: 'linear-gradient(135deg, var(--tw-violet-600), var(--tw-indigo-600))',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        ➕ Buy New Plan
                      </button>
                    )}
                  </div>

                  {coursesLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--fg-slate-500)' }}>Loading your courses...</div>
                  ) : courses.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '48px 24px',
                      background: 'var(--bg-slate-50)',
                      border: '2px dashed var(--bd-slate-200)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎓</div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-slate-900)', marginBottom: '6px' }}>
                        No Courses Purchased Yet
                      </div>
                      <div style={{ color: 'var(--fg-slate-500)', fontSize: '0.875rem', marginBottom: '20px' }}>
                        Purchase an exam plan to unlock full typing test access, mock tests, and AI-generated passages.
                      </div>
                      {onOpenPayment && (
                        <button
                          onClick={() => { onOpenPayment(); onClose(); }}
                          style={{
                            background: 'linear-gradient(135deg, var(--tw-violet-600), var(--tw-indigo-600))',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 24px',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          🛒 View Plans & Purchase
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {courses.map((course) => {
                        const now = Date.now();
                        const isApproved = course.status === 'approved';
                        const isPending = course.status === 'pending';
                        const isRejected = course.status === 'rejected';

                        let isExpired = false;
                        let daysRemaining: number | null = null;
                        if (isApproved && course.expiresAt) {
                          const exp = new Date(course.expiresAt).getTime();
                          if (!isNaN(exp)) {
                            if (exp < now) {
                              isExpired = true;
                              daysRemaining = 0;
                            } else {
                              daysRemaining = Math.max(1, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
                            }
                          }
                        }

                        const dest = resolveCourseDestination(course);

                        const statusColor = isApproved
                          ? isExpired
                            ? { bg: 'var(--bg-red-100)', border: 'var(--bd-red-300)', text: 'var(--fg-red-800)', label: '⌛ EXPIRED' }
                            : { bg: 'var(--bg-green-50)', border: 'var(--bd-green-300)', text: 'var(--fg-green-700)', label: '✅ ACTIVE & UNLOCKED' }
                          : isRejected
                          ? { bg: 'var(--bg-red-50)', border: 'var(--bd-red-300)', text: 'var(--fg-red-600)', label: '❌ REJECTED' }
                          : { bg: 'var(--bg-amber-50)', border: 'var(--bd-amber-200)', text: 'var(--fg-amber-800)', label: '⏳ PENDING APPROVAL' };

                        const submittedDate = new Date(course.submittedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        });
                        const reviewedDate = course.reviewedAt
                          ? new Date(course.reviewedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : null;
                        const expiryDateFormatted = course.expiresAt
                          ? new Date(course.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : null;

                        const handleDirectOpen = () => {
                          openPurchasedCourse(course, {
                            onBeforeNavigate: () => onClose(),
                            onAfterNavigate: () => {
                              if (onNavigateToCourse) onNavigateToCourse(course);
                            }
                          });
                        };

                        return (
                          <div
                            key={course.id}
                            style={{
                              background: statusColor.bg,
                              border: `1.5px solid ${statusColor.border}`,
                              borderRadius: 'var(--radius-md)',
                              padding: '16px 18px',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {/* Top row: Emblem + Titles + Status Badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.6rem' }}><EmojiIco e={dest.emblemEmoji} /></span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--fg-slate-900)' }}>
                                    {dest.examTitle || course.planName}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
                                    Plan: <strong>{course.planName}</strong>
                                    {dest.postTitle && dest.postTitle !== dest.examTitle && (
                                      <span> &bull; Post: <strong>{dest.postTitle}</strong></span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                <span
                                  style={{
                                    background: statusColor.border,
                                    color: statusColor.text,
                                    padding: '3px 10px',
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  {statusColor.label}
                                </span>
                                {isApproved && !isExpired && daysRemaining !== null && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-green-600)', fontWeight: 600 }}>
                                    ⏳ {daysRemaining} days left {expiryDateFormatted ? `(till ${expiryDateFormatted})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '0.8rem' }}>
                              <div>
                                <span style={{ color: 'var(--fg-slate-500)' }}>Amount Paid:</span>{' '}
                                <strong style={{ color: 'var(--fg-slate-900)' }}>₹{course.finalAmount || course.finalAmountPaid || course.originalAmount}</strong>
                                {course.promoCodeUsed || course.promoCodeApplied
                                  ? <span style={{ color: 'var(--fg-green-600)', fontSize: '0.75rem', marginLeft: '4px' }}>({course.promoCodeUsed || course.promoCodeApplied})</span>
                                  : null}
                              </div>
                              <div>
                                <span style={{ color: 'var(--fg-slate-500)' }}>UTR Number:</span>{' '}
                                <strong style={{ color: 'var(--fg-slate-900)', fontFamily: 'monospace' }}>{course.utrNumber}</strong>
                              </div>
                              <div>
                                <span style={{ color: 'var(--fg-slate-500)' }}>Submitted:</span>{' '}
                                <strong style={{ color: 'var(--fg-slate-900)' }}>{submittedDate}</strong>
                              </div>
                              {reviewedDate && (
                                <div>
                                  <span style={{ color: 'var(--fg-slate-500)' }}>Reviewed:</span>{' '}
                                  <strong style={{ color: 'var(--fg-slate-900)' }}>{reviewedDate}</strong>
                                </div>
                              )}
                            </div>

                            {/* Rejection reason */}
                            {isRejected && course.rejectionReason && (
                              <div style={{
                                background: 'var(--bg-red-50)',
                                border: '1px solid var(--bd-red-300)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                color: 'var(--fg-red-600)'
                              }}>
                                <strong>Rejection Reason:</strong> {course.rejectionReason}
                              </div>
                            )}

                            {/* Pending message */}
                            {isPending && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--fg-amber-800)' }}>
                                ⏱️ Admin typically approves within <strong>15–30 minutes</strong> during business hours. You will receive access immediately after approval.
                              </div>
                            )}

                            {/* 🚀 ACTION BUTTONS: DIRECT COURSE OPENING */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
                              {isApproved && !isExpired ? (
                                <>
                                  <button
                                    onClick={handleDirectOpen}
                                    style={{
                                      background: 'var(--tw-green-600)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '9px 18px',
                                      fontSize: '0.875rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: 'var(--shadow-md)'
                                    }}
                                  >
                                    <span>🚀</span>
                                    <span>Open Course & Start Practice (कोर्स खोलें)</span>
                                  </button>
                                  <button
                                    onClick={handleDirectOpen}
                                    style={{
                                      background: 'var(--surface)',
                                      border: '1.5px solid var(--tw-sky-600)',
                                      color: 'var(--fg-sky-600)',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '9px 14px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <span>🎯</span>
                                    <span>Browse Mock Tests</span>
                                  </button>
                                </>
                              ) : isExpired ? (
                                onOpenPayment && (
                                  <button
                                    onClick={() => {
                                      onOpenPayment(course.selectedExamId);
                                      onClose();
                                    }}
                                    style={{
                                      background: 'var(--tw-amber-500)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '8px 16px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <span>🔄</span>
                                    <span>Renew Plan</span>
                                  </button>
                                )
                              ) : isRejected ? (
                                onOpenPayment && (
                                  <button
                                    onClick={() => {
                                      onOpenPayment(course.selectedExamId);
                                      onClose();
                                    }}
                                    style={{
                                      background: 'var(--tw-red-600)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 'var(--radius-sm)',
                                      padding: '6px 14px',
                                      fontSize: '0.8rem',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                  >
                                    <span>🔄</span>
                                    <span>Re-submit Verification</span>
                                  </button>
                                )
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ADMIT CARD VIEW */}
              {activeTab === 'admitCard' && (
                <div style={{ maxWidth: '650px', margin: '0 auto', border: '2px solid var(--tw-slate-900)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--surface)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid var(--tw-slate-900)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--fg-slate-500)' }}>
                      UTTAR PRADESH POLICE RECRUITMENT & PROMOTION BOARD
                    </div>
                    <h2 style={{ margin: '4px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                      TYPING TEST RECORD
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--fg-sky-600)', fontWeight: 600 }}>
                      Computer Operator (Grade-A) / ASI (Clerk/Accounts) Exam 2024-2025
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                      <div>Name: <strong>{user.displayName}</strong></div>
                      <div>Roll Number: <strong>{user.rollNumber}</strong></div>
                      <div>Post Applied: <strong>{user.category === 'up_police_asi' ? 'Assistant Sub-Inspector (Clerk/Accounts)' : 'Computer Operator Grade-A'}</strong></div>
                      <div>Account Email: <strong>{user.email || 'Guest'}</strong></div>
                      <div>Profile Status: <strong>{isLocalOnly ? 'Local Offline Mode' : 'Cloud Registered'}</strong></div>
                    </div>

                    <div style={{ width: '110px', height: '120px', border: '1.5px solid var(--bd-slate-300)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-slate-50)' }}>
                      <span style={{ fontSize: '2.5rem' }}>👤</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>PHOTO</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-slate-50)', border: '1px solid var(--bd-slate-300)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    <strong>Performance summary:</strong>
                    <div>Total Practice Tests Completed: <strong>{attempts.length}</strong></div>
                    <div>Overall Qualification Rate: <strong>{stats?.passRate || 0}%</strong></div>
                    <div>Average Typing Speed: <strong>{stats?.avgNetWpm || 0} Net WPM</strong> &bull; Accuracy: <strong>{stats?.avgAccuracy || 0}%</strong></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
