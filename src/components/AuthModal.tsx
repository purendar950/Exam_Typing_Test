import React, { useState } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  saveFirebaseConfig,
  getSavedFirebaseConfig,
  initFirebase,
  isFirebaseConfigured,
  UserProfile,
  FirebaseConfig
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'config'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [category, setCategory] = useState<'up_police_co' | 'up_police_asi'>('up_police_co');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Firebase Config Tab state
  const [configJson, setConfigJson] = useState(() => {
    const existing = getSavedFirebaseConfig();
    return existing ? JSON.stringify(existing, null, 2) : '';
  });
  const [configSavedToast, setConfigSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await signInWithEmail(email.trim(), password);
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
    if (!email || !password || !displayName) {
      setErrorMsg('Please fill in your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await signUpWithEmail(email.trim(), password, displayName.trim(), rollNumber.trim(), category);
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed.';
      setErrorMsg(msg.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed.';
      setErrorMsg(msg.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    try {
      const parsed: FirebaseConfig = JSON.parse(configJson);
      if (!parsed.apiKey || !parsed.projectId) {
        setErrorMsg('Invalid config. Make sure "apiKey" and "projectId" are present.');
        return;
      }
      saveFirebaseConfig(parsed);
      initFirebase(parsed);
      setConfigSavedToast(true);
      setErrorMsg('');
      setTimeout(() => setConfigSavedToast(false), 3000);
    } catch {
      setErrorMsg('Invalid JSON format. Please paste the valid Firebase config object.');
    }
  };

  const isConnected = isFirebaseConfigured();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '95%', padding: '24px', borderRadius: '12px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {activeTab === 'login' ? 'Candidate Login' : activeTab === 'signup' ? 'Candidate Registration' : 'Firebase Cloud Setup'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              {activeTab === 'config'
                ? 'Connect your Firebase project to sync records across all your devices'
                : 'Save your test attempts, track speed progression, and sync records'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
          >
            &times;
          </button>
        </div>

        {/* Tab navigation */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '18px'
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeTab === 'signup' ? '#ffffff' : 'transparent',
              color: activeTab === 'signup' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('config'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeTab === 'config' ? '#ffffff' : 'transparent',
              color: activeTab === 'config' ? '#0284c7' : '#64748b',
              boxShadow: activeTab === 'config' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            ⚙️ Cloud Setup
          </button>
        </div>

        {/* Cloud Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isConnected ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${isConnected ? '#86efac' : '#fde68a'}`,
            borderRadius: '6px',
            padding: '6px 12px',
            marginBottom: '16px',
            fontSize: '0.78rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#16a34a' : '#d97706' }} />
            <span style={{ fontWeight: 700, color: isConnected ? '#15803d' : '#b45309' }}>
              {isConnected ? 'Firebase Cloud Active' : 'Local Storage Mode'}
            </span>
          </div>
          <span style={{ color: '#64748b' }}>
            {isConnected ? 'Syncing to Cloud' : 'Saved on this browser'}
          </span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              marginBottom: '14px'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* 1. LOGIN TAB */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="candidate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.95rem',
                fontWeight: 800,
                backgroundColor: '#0284c7',
                marginTop: '4px'
              }}
            >
              {loading ? 'Logging in...' : 'Log In to My Account'}
            </button>

            {isConnected && (
              <>
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0' }}>
                  — OR —
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '9px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}
          </form>
        )}

        {/* 2. SIGNUP TAB */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Full Name (अभ्यर्थी का नाम)
              </label>
              <input
                type="text"
                placeholder="e.g. PURENDAR KUMAR"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Roll / Reg Number
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Target Exam Post
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'up_police_co' | 'up_police_asi')}
                  style={{
                    width: '100%',
                    padding: '9px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="up_police_co">Computer Operator</option>
                  <option value="up_police_asi">ASI (Clerk/Accounts)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="candidate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Password (min 6 characters)
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.95rem',
                fontWeight: 800,
                backgroundColor: '#0284c7',
                marginTop: '4px'
              }}
            >
              {loading ? 'Creating Account...' : 'Register Candidate Account'}
            </button>
          </form>
        )}

        {/* 3. FIREBASE CONFIG TAB */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
              <strong>How to connect your Firebase Project (Free):</strong>
              <ol style={{ margin: '6px 0 0', paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700 }}>console.firebase.google.com</a> and click <strong>Add Project</strong>.</li>
                <li>Under <strong>Authentication</strong>, enable <strong>Email/Password</strong> and <strong>Google</strong>.</li>
                <li>Under <strong>Firestore Database</strong>, click <strong>Create database</strong>.</li>
                <li>Go to <strong>Project Settings</strong>, click <strong>Web App (&lt;/&gt;)</strong>, and copy the <code>firebaseConfig</code> object.</li>
                <li>Paste it into the box below and click <strong>Save & Connect</strong>.</li>
              </ol>
            </div>

            {configSavedToast && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                ✓ Firebase Config Saved & Connected!
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Firebase Config JSON:
              </label>
              <textarea
                rows={6}
                placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-project.firebaseapp.com",\n  "projectId": "my-project"\n}'}
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="btn btn-primary"
              style={{ width: '100%', padding: '9px', fontWeight: 700, backgroundColor: '#0284c7' }}
            >
              Save & Connect Cloud
            </button>
          </div>
        )}

        {/* Footer info */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Skip for now (Continue Practice as Guest)
          </button>
        </div>
      </div>
    </div>
  );
};
