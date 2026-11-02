import React from 'react';
import { TestSettings } from '../types';

interface HeaderProps {
  currentTab: 'tests' | 'learn';
  onSelectTab: (tab: 'tests' | 'learn') => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  settings: TestSettings;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenRules,
  onOpenHistory,
  settings,
  onToggleSound
}) => {
  return (
    <header className="app-header">
      <div className="container header-container">
        <div className="logo-area" onClick={() => onSelectTab('tests')}>
          <div className="logo-icon">UP</div>
          <div>
            <div className="logo-title">UP Typing Mentor</div>
            <div className="logo-subtitle">Computer Operator & UPSSSC Portal</div>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${currentTab === 'tests' ? 'active' : ''}`}
            onClick={() => onSelectTab('tests')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Mock Tests
          </button>

          <button
            className={`nav-btn ${currentTab === 'learn' ? 'active' : ''}`}
            onClick={() => onSelectTab('learn')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Learn & Drills
          </button>

          <button className="nav-btn" onClick={onOpenRules}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Exam Rules
          </button>

          <button className="nav-btn" onClick={onOpenHistory}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>

          <button
            className="nav-btn"
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
        </nav>
      </div>
    </header>
  );
};
