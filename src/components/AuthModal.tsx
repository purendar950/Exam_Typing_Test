import React, { useState, useRef, useEffect } from 'react';
import {
  signInWithGoogle,
  registerCandidate,
  loginCandidate,
  createGuestCandidate,
  resetUserPassword,
  UserProfile
} from '../services/firebase';
import appLogo from '../assets/logo.webp';

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
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState(`UP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [category, setCategory] = useState<'up_police_co' | 'up_police_asi'>('up_police_co');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  // Login throttle: after 5 failed attempts, wait 60 seconds before trying again.
  const failCountRef = useRef(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!lockUntil) return;
    const t = window.setInterval(() => {
      setNowTick(Date.now());
      if (Date.now() >= lockUntil) {
        setLockUntil(0);
        failCountRef.current = 0;
      }
    }, 500);
    return () => window.clearInterval(t);
  }, [lockUntil]);

  const secondsLeft = lockUntil ? Math.max(1, Math.ceil((lockUntil - nowTick) / 1000)) : 0;

  if (!isOpen) return null;

  // 1-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
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
    if (lockUntil && Date.now() < lockUntil) {
      setErrorMsg(`Too many failed attempts. Please wait ${secondsLeft}s and try again.`);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const user = await loginCandidate(identifier.trim(), password);
      failCountRef.current = 0;
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      msg = msg.replace('Firebase:', '').trim();
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        failCountRef.current += 1;
        if (failCountRef.current >= 5) {
          setLockUntil(Date.now() + 60000);
          msg = 'Too many failed attempts. Please wait 60 seconds before trying again.';
        } else {
          msg = `Wrong password or roll number (${failCountRef.current}/5). New users: log in with the email you registered with. Old roll-number accounts: use the same password you chose at registration.`;
        }
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Email in the "Roll Number or Email" box above first.');
      return;
    }
    setResetLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await resetUserPassword(identifier.trim());
      setSuccessMsg(`✅ Password reset link sent to ${identifier.trim()}! Please check your email inbox (and Spam folder) to set your password.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email.';
      setErrorMsg(msg.replace('Firebase:', '').trim());
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please enter full name.');
      return;
    }
    if (!email.trim() || !email.trim().includes('@')) {
      setErrorMsg('Please enter a valid email address. You will use it to log in.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Please choose a password with at least 8 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await registerCandidate(displayName.trim(), email.trim(), password, rollNumber.trim(), category);
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
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--bd-slate-200)'
        }}
      >
        {/* Portal Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--tw-blue-900) 0%, var(--tw-sky-700) 100%)',
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
              fontSize: '1.25rem',
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
                boxShadow: 'var(--shadow-md)',
                border: '2px solid var(--bd-blue-300)',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 600 }}>
                Exam Typing • UP Police & Competitive Exams
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 700 }}>
                Student Login
              </h3>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
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
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--bd-slate-300)',
              background: 'var(--surface)',
              color: 'var(--fg-slate-800)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)',
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
            <div style={{ flex: 1, height: '1px', background: 'var(--bg-slate-200)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Or use Roll Number / Email
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--bg-slate-200)' }} />
          </div>

          {/* 2 Clean Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-slate-100)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              marginBottom: '16px'
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: activeTab === 'login' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'login' ? 'var(--fg-blue-900)' : 'var(--fg-slate-500)',
                boxShadow: activeTab === 'login' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🔑 Login (लॉगिन)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: activeTab === 'signup' ? 'var(--surface)' : 'transparent',
                color: activeTab === 'signup' ? 'var(--fg-blue-900)' : 'var(--fg-slate-500)',
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
                background: 'var(--bg-red-50)',
                border: '1px solid var(--bd-red-200)',
                color: 'var(--fg-red-700)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '14px',
                fontWeight: 500,
                lineHeight: 1.4
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'var(--bg-green-50)',
                border: '1px solid var(--bd-green-200)',
                color: 'var(--fg-green-700)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '14px',
                fontWeight: 500,
                lineHeight: 1.4
              }}
            >
              {successMsg}
            </div>
          )}

          {/* TAB 1: CANDIDATE & ADMIN LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-800)', display: 'block', marginBottom: '4px' }}>
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
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--bd-slate-300)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-800)' }}>
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--fg-sky-600)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: resetLoading ? 'wait' : 'pointer',
                      padding: '0',
                      textDecoration: 'underline'
                    }}
                  >
                    {resetLoading ? 'Sending link...' : 'Forgot / Set Password? (पासवर्ड रीसेट)'}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--bd-slate-300)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password (पासवर्ड छिपाएं)' : 'Show password (पासवर्ड देखें)'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--fg-slate-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? (
                      /* Eye Slash / Hide SVG */
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      /* Eye Open / Show SVG */
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (!!lockUntil && Date.now() < lockUntil)}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, var(--tw-blue-900) 0%, var(--tw-sky-600) 100%)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  cursor: loading || (!!lockUntil && Date.now() < lockUntil) ? 'wait' : 'pointer',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Logging In...' : secondsLeft ? `Please wait ${secondsLeft}s` : 'Log in (लॉगिन करें)'}
              </button>
            </form>
          )}

          {/* TAB 2: CANDIDATE REGISTRATION */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-800)', display: 'block', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Purendar Kumar"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--bd-slate-300)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-800)', display: 'block', marginBottom: '4px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="e.g. name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--bd-slate-300)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-800)', display: 'block', marginBottom: '4px' }}>
                  Exam you are preparing for
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'up_police_co' | 'up_police_asi')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--bd-slate-300)',
                    fontSize: '0.875rem',
                    background: 'var(--surface)',
                    outline: 'none',
                    fontWeight: 500,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="up_police_co">👮 UP Police Computer Operator Grade-A (25 WPM Hindi / 30 WPM English)</option>
                  <option value="up_police_asi">📑 UP Police ASI (Assistant Sub-Inspector Clerk/Accounts)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-800)', display: 'block', marginBottom: '4px' }}>
                  Password (min 8 characters) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--bd-slate-300)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--fg-slate-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--tw-green-600)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  cursor: loading ? 'wait' : 'pointer',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Creating Profile...' : '✓ Register & Save Profile (पंजीकरण करें)'}
              </button>
            </form>
          )}

          {/* Guest Practice Footer */}
          <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--bd-slate-100)' }}>
            <button
              onClick={handleGuestLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--fg-slate-500)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 500,
                textDecoration: 'underline'
              }}
            >
              Continue as guest (बिना लॉगिन अभ्यास करें)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
