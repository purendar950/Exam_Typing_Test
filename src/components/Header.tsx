import React from 'react';
import { TestSettings } from '../types';
import { UserProfile } from '../services/firebase';
import appLogo from '../assets/logo.png';

interface HeaderProps {
  currentTab: 'tests' | 'learn' | 'book';
  onSelectTab: (tab: 'tests' | 'learn' | 'book') => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenHindiHelper: () => void;
  onOpenAiGenerator?: () => void;
  settings: TestSettings;
  onToggleSound: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenRules,
  onOpenHistory,
  onOpenHindiHelper,
  onOpenAiGenerator,
  settings,
  onToggleSound,
  currentUser,
  onOpenAuth,
  onOpenDashboard
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
              style={{ padding: '6px 8px' }}
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

            {onOpenAiGenerator && (
              <button
                className="nav-btn ai-generator-btn"
                onClick={onOpenAiGenerator}
                title="AI Live Test Generator & Settings (AR Typing Standard)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>⚡</span>
                <span>AI Live Tests</span>
              </button>
            )}

            {currentUser ? (
              <button
                className="nav-btn candidate-profile-btn"
                onClick={onOpenDashboard}
                title={`Candidate: ${currentUser.displayName} (${currentUser.rollNumber}) • View Stats & Examination Dossier`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontWeight: 600,
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '0.95rem' }}>👤</span>
                )}
                <span style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.displayName}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    fontWeight: 700
                  }}
                >
                  {currentUser.rollNumber}
                </span>
              </button>
            ) : (
              <button
                className="nav-btn"
                onClick={onOpenAuth}
                title="Candidate Login & Registration (अभ्यर्थी लॉगिन)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  fontWeight: 600,
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '0.95rem' }}>🔑</span>
                <span>Candidate Login</span>
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

          {onOpenAiGenerator && (
            <button
              className="nav-btn"
              onClick={onOpenAiGenerator}
              title="Daily Live AI Tests (AR Typing Medium & Hard Benchmark)"
              style={{ color: '#0284c7', fontWeight: 700 }}
            >
              <span style={{ fontSize: '0.95rem', marginRight: '4px' }}>⚡</span>
              AI Live Tests
            </button>
          )}

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
