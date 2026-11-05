import React from 'react';
import { TestSettings } from '../types';
import { UserProfile, isUserAdmin } from '../services/firebase';
import appLogo from '../assets/logo.png';

interface HeaderProps {
  currentTab: 'tests' | 'learn' | 'book';
  onSelectTab: (tab: 'tests' | 'learn' | 'book') => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenHindiHelper: () => void;
  onOpenAiGenerator?: () => void;
  onOpenAdmin?: () => void;
  onOpenPayment?: () => void;
  onOpenMyCourses?: () => void;
  settings: TestSettings;
  onToggleSound: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenRules,
  onOpenHistory,
  onOpenHindiHelper,
  onOpenAiGenerator,
  onOpenAdmin,
  onOpenPayment,
  onOpenMyCourses,
  settings,
  onToggleSound,
  currentUser,
  onOpenAuth,
  onOpenDashboard,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  return (
    <header className="app-header">
      <div className="container header-container">
        {/* Top row on mobile / unified row on desktop */}
        <div className="header-top-row">
          <div className="logo-area" onClick={() => onSelectTab('tests')}>
            <img
              src={appLogo}
              alt="Exam Typing"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                border: '1.5px solid #38bdf8',
                flexShrink: 0
              }}
            />
            <div>
              <div className="logo-title">Exam Typing</div>
              <div className="logo-subtitle">Typing Practice for Competitive Exams</div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="nav-btn sound-btn"
              onClick={onToggleSound}
              title={settings.soundEnabled ? 'Key sound enabled' : 'Key sound muted'}
            >
              {settings.soundEnabled ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {onToggleDarkMode && (
              <button
                className="nav-btn theme-toggle-btn"
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'Switch to Light Mode (लाइट मोड चालू करें)' : 'Switch to Dark Mode (डार्क मोड चालू करें)'}
                aria-label="Toggle Dark Mode"
                style={{
                  fontSize: '1rem',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid transparent'
                }}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            )}

            {currentUser && isUserAdmin(currentUser) && onOpenAdmin && (
              <button
                className="nav-btn admin-portal-btn"
                onClick={onOpenAdmin}
                title="Administrative Control Suite"
              >
                <span>🛡️</span>
                <span className="admin-portal-text">Admin Suite</span>
              </button>
            )}

            {onOpenPayment && (
              <button
                className="nav-btn header-plan-btn"
                onClick={onOpenPayment}
                style={{
                  background: currentUser?.is_subscribed
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                  whiteSpace: 'nowrap'
                }}
                title={currentUser?.is_subscribed ? 'Pro Member Active • View Subscription' : 'Upgrade to Pro • Single Exam / All 129 Pass'}
              >
                <span>👑</span>
                <span className="header-text-full">{currentUser?.is_subscribed ? 'Pro Active' : 'Plans & Pricing'}</span>
                <span className="header-text-short">{currentUser?.is_subscribed ? 'Pro' : 'Plans'}</span>
              </button>
            )}

            {currentUser && onOpenMyCourses && (
              <button
                className="nav-btn header-courses-btn"
                onClick={onOpenMyCourses}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="My Purchased Courses — View plan status & validity"
              >
                <span>🎓</span>
                <span className="header-text-full">My Courses</span>
                <span className="header-text-short">Courses</span>
              </button>
            )}

            {currentUser ? (
              <button
                className={`nav-btn candidate-profile-btn ${isUserAdmin(currentUser) ? 'is-admin' : ''}`}
                onClick={onOpenDashboard}
                title={`User: ${currentUser.displayName} (${currentUser.rollNumber}) • View Stats & Examination Dossier`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="candidate-avatar"
                  />
                ) : (
                  <span className="candidate-avatar-placeholder">{isUserAdmin(currentUser) ? '🛡️' : '👤'}</span>
                )}
                <span className="candidate-name">
                  {currentUser.displayName}
                </span>
                <span className={`candidate-badge ${isUserAdmin(currentUser) ? 'admin-badge' : 'candidate-roll-badge'}`}>
                  {isUserAdmin(currentUser) ? 'ADMIN' : currentUser.rollNumber}
                </span>
              </button>
            ) : (
              <button
                className="nav-btn login-header-btn"
                onClick={onOpenAuth}
                title="Login / Sign In (लॉगिन)"
              >
                <span style={{ fontSize: '0.95rem' }}>🔑</span>
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable nav bar on mobile */}
        <nav className="nav-links">
          <button
            className={`nav-btn ${currentTab === 'tests' ? 'active' : ''}`}
            onClick={() => onSelectTab('tests')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Mock Tests
          </button>

          <button
            className={`nav-btn ${currentTab === 'book' ? 'active' : ''}`}
            onClick={() => onSelectTab('book')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h6M8 11h6" />
            </svg>
            Book (MS Word)
          </button>

          <button
            className={`nav-btn ${currentTab === 'learn' ? 'active' : ''}`}
            onClick={() => onSelectTab('learn')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Learn & Drills
          </button>

          <button
            className="nav-btn"
            onClick={onOpenHindiHelper}
            title="Hindi Character & Conjuncts Helper (संयुक्ताक्षर गाइड)"
            style={{ color: '#d97706', fontWeight: 600 }}
          >
            <span style={{ fontSize: '0.95rem', marginRight: '4px' }}>⌨️</span>
            Hindi Keys
          </button>

          <button className="nav-btn" onClick={onOpenRules}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Exam Rules
          </button>

          <button className="nav-btn" onClick={onOpenHistory}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </nav>
      </div>
    </header>
  );
};
