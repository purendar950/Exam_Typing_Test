import React, { useState } from 'react';
import {
  signInWithGoogle,
  registerCandidate,
  loginCandidate,
  createGuestCandidate,
  UserProfile
} from '../services/firebase';
import appLogo from '../assets/logo.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rollNumber, setRollNumber] = useState(`UP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [category, setCategory] = useState<'up_police_co' | 'up_police_asi'>('up_police_co');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // 1-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Sign-in cancelled.');
      } else if (msg.includes('unauthorized-domain')) {
        setErrorMsg('Please ensure purendar950.github.io is in Firebase Authorized Domains.');
      } else if (msg.includes('configuration-not-found') || msg.includes('auth/operation-not-allowed')) {
        setErrorMsg('Please enable Google provider in your Firebase Console Authentication tab.');
      } else {
        setErrorMsg(msg.replace('Firebase:', '').trim());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Roll Number or Email.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await loginCandidate(identifier.trim(), password);
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMsg(msg.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please enter candidate full name.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await registerCandidate(displayName.trim(), rollNumber.trim(), category, password);
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMsg(msg.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const user = await createGuestCandidate();
      onLoginSuccess(user);
      onClose();
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '95%',
          padding: '0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Official Header Banner like ARTyping / TestMentor */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              color: '#ffffff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            &times;
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={appLogo}
              alt="Exam Typing"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '2px solid #93c5fd',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>
                Exam Typing • UP Police & Competitive Exams
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                Candidate Portal
              </h3>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                1-Click Google Sign-In & Cross-Device Sync
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* 1-Click Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontWeight: 700,
              fontSize: '0.94rem',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
              marginBottom: '16px',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (1-Click Sync)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Or use Roll Number / Email
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* 2 Clean Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              marginBottom: '16px'
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'login' ? '#ffffff' : 'transparent',
                color: activeTab === 'login' ? '#1e3a8a' : '#64748b',
                boxShadow: activeTab === 'login' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🔑 Candidate Login
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                background: activeTab === 'signup' ? '#ffffff' : 'transparent',
                color: activeTab === 'signup' ? '#1e3a8a' : '#64748b',
                boxShadow: activeTab === 'signup' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📝 New Registration
            </button>
          </div>

          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px',
                fontWeight: 600
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* TAB 1: CANDIDATE LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                  Roll Number or Email *
                </label>
                <input
                  type="text"
                  placeholder="e.g. UP-202601 or name@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  cursor: loading ? 'wait' : 'pointer',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Logging In...' : '🚀 Enter Exam Portal (लॉगिन करें)'}
              </button>
            </form>
          )}

          {/* TAB 2: CANDIDATE REGISTRATION */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Purendar Kumar"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                  Roll Number / Reg No *
                </label>
                <input
                  type="text"
                  placeholder="e.g. UP-202601"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                  Target Examination Post
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'up_police_co' | 'up_police_asi')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                    outline: 'none',
                    fontWeight: 600,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="up_police_co">👮 UP Police Computer Operator Grade-A (25 WPM Hindi / 30 WPM English)</option>
                  <option value="up_police_asi">📑 UP Police ASI (Assistant Sub-Inspector Clerk/Accounts)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                  Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  cursor: loading ? 'wait' : 'pointer',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Creating Profile...' : '✓ Register & Save Profile (पंजीकरण करें)'}
              </button>
            </form>
          )}

          {/* Guest Practice Footer */}
          <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={handleGuestLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Continue as Guest Candidate (बिना लॉगिन अभ्यास करें)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
