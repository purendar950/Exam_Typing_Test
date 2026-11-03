import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  UserStats,
  computeUserStats,
  fetchUserTestAttempts,
  logoutUser
} from '../services/firebase';
import { EvaluationResult } from '../types';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout: () => void;
  onViewScorecard?: (result: EvaluationResult) => void;
  onPracticeWrongWords?: (words: string[]) => void;
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onViewScorecard,
  onPracticeWrongWords
}) => {
  const [attempts, setAttempts] = useState<EvaluationResult[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'admitCard'>('overview');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetchUserTestAttempts(user.uid)
      .then((data) => {
        if (!isMounted) return;
        setAttempts(data);
        setStats(computeUserStats(data));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user.uid]);

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
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {/* 1. Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
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
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {user.displayName}
                </h2>
                <span
                  style={{
                    background: isLocalOnly ? '#fef3c7' : '#dcfce7',
                    color: isLocalOnly ? '#b45309' : '#15803d',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {isLocalOnly ? '⚡ Local Profile' : '☁️ Cloud Synced'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', opacity: 0.9, marginTop: '2px' }}>
                <span>Roll No: <strong>{user.rollNumber}</strong></span>
                <span>Post: <strong>{user.category === 'up_police_asi' ? 'ASI (Clerk/Accounts)' : 'Computer Operator Grade-A'}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handlePrintDossier}
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              🖨️ Print Dossier
            </button>
            <button
              onClick={() => {
                logoutUser();
                onLogout();
                onClose();
              }}
              className="btn btn-sm"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Log Out
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '1.4rem', cursor: 'pointer', marginLeft: '4px' }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0 20px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              color: activeTab === 'overview' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'overview' ? '2.5px solid #0284c7' : '2.5px solid transparent'
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
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              color: activeTab === 'history' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'history' ? '2.5px solid #0284c7' : '2.5px solid transparent'
            }}
          >
            📜 Test Attempt History ({attempts.length})
          </button>
          <button
            onClick={() => setActiveTab('admitCard')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              color: activeTab === 'admitCard' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'admitCard' ? '2.5px solid #0284c7' : '2.5px solid transparent'
            }}
          >
            🎫 Simulated Admit Card
          </button>
        </div>

        {/* 3. Tab Contents */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading candidate records...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && stats && (
                <div>
                  {/* Hero Metric Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px',
                      marginBottom: '20px'
                    }}
                  >
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Total Tests
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                        {stats.totalTests}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#0284c7' }}>
                        {stats.hindiTestsCount} Hindi &bull; {stats.englishTestsCount} English
                      </span>
                    </div>

                    <div style={{ background: stats.passRate >= 80 ? '#f0fdf4' : '#fffbeb', border: `1px solid ${stats.passRate >= 80 ? '#86efac' : '#fde68a'}`, borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stats.passRate >= 80 ? '#166534' : '#92400e', textTransform: 'uppercase' }}>
                        Qualification Rate
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.passRate >= 80 ? '#15803d' : '#b45309' }}>
                        {stats.passRate}%
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {stats.qualifiedTests} / {stats.totalTests} Met Cutoffs
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Avg Net Speed
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>
                        {stats.avgNetWpm} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>WPM</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Best: {stats.bestNetWpm} WPM
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Avg Accuracy
                      </span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.avgAccuracy >= 85 ? '#15803d' : '#dc2626' }}>
                        {stats.avgAccuracy}%
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Cutoff Threshold: 85%
                      </span>
                    </div>
                  </div>

                  {/* Cutoff Standards Checklist */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Official UPPRPB Cutoff Readiness Tracker
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Hindi Typing (Mangal/Kruti)</span>
                          <span style={{ fontWeight: 800, color: stats.avgNetWpm >= 25 ? '#16a34a' : '#dc2626', fontSize: '0.82rem' }}>
                            {stats.avgNetWpm >= 25 ? '✓ Ready (25+ WPM)' : 'Needs Practice (< 25 WPM)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          Required: 25 WPM (15 mins, 400 words, 85% accuracy)
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>English Typing</span>
                          <span style={{ fontWeight: 800, color: stats.avgNetWpm >= 30 ? '#16a34a' : '#dc2626', fontSize: '0.82rem' }}>
                            {stats.avgNetWpm >= 30 ? '✓ Ready (30+ WPM)' : 'Needs Practice (< 30 WPM)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          Required: 30 WPM (15 mins, 500 words, 85% accuracy)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent 3 Attempts */}
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Recent Test Attempts
                    </h3>
                    {attempts.length === 0 ? (
                      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
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
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div>
                              <strong style={{ color: '#0f172a' }}>{a.testTitle}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {new Date(a.timestamp).toLocaleDateString()} &bull; {a.language.replace('_', ' ').toUpperCase()}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: 700, color: '#0284c7' }}>{a.netWpm} WPM</span>
                              <span style={{ fontWeight: 700, color: a.accuracy >= 85 ? '#16a34a' : '#dc2626' }}>{a.accuracy}%</span>
                              <span
                                style={{
                                  background: a.isQualified ? '#dcfce7' : '#fee2e2',
                                  color: a.isQualified ? '#15803d' : '#dc2626',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
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
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No test attempts found. Complete mock tests to see full records here.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
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
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: '#64748b' }}>
                                {new Date(a.timestamp).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                                {a.testTitle}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  {a.language.startsWith('hindi') ? 'Hindi' : 'English'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0284c7' }}>
                                {a.netWpm}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: a.accuracy >= 85 ? '#16a34a' : '#dc2626' }}>
                                {a.accuracy}%
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span
                                  style={{
                                    background: a.isQualified ? '#dcfce7' : '#fee2e2',
                                    color: a.isQualified ? '#15803d' : '#dc2626',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800
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
                                      style={{ padding: '3px 8px', fontSize: '0.75rem', background: '#e2e8f0', color: '#334155' }}
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

              {/* TAB 3: ADMIT CARD VIEW */}
              {activeTab === 'admitCard' && (
                <div style={{ maxWidth: '650px', margin: '0 auto', border: '2px solid #0f172a', borderRadius: '8px', padding: '20px', background: '#ffffff' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', color: '#64748b' }}>
                      UTTAR PRADESH POLICE RECRUITMENT & PROMOTION BOARD
                    </div>
                    <h2 style={{ margin: '4px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                      CANDIDATE TYPING SKILL TEST RECORD DOSSIER
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700 }}>
                      Computer Operator (Grade-A) / ASI (Clerk/Accounts) Exam 2024-2025
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div>Candidate Name: <strong>{user.displayName}</strong></div>
                      <div>Roll Number: <strong>{user.rollNumber}</strong></div>
                      <div>Post Applied: <strong>{user.category === 'up_police_asi' ? 'Assistant Sub-Inspector (Clerk/Accounts)' : 'Computer Operator Grade-A'}</strong></div>
                      <div>Account Email: <strong>{user.email || 'Guest Candidate'}</strong></div>
                      <div>Profile Status: <strong>{isLocalOnly ? 'Local Offline Mode' : 'Cloud Registered'}</strong></div>
                    </div>

                    <div style={{ width: '110px', height: '120px', border: '1.5px solid #cbd5e1', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                      <span style={{ fontSize: '2.5rem' }}>👤</span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>PHOTO</span>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    <strong>Verified Performance Summary:</strong>
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
