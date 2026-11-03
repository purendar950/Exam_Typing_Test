import React, { useState } from 'react';
import {
  registerCandidate,
  loginCandidate,
  UserProfile
} from '../services/firebase';

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Roll Number or Candidate Name.');
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
      setErrorMsg(msg);
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
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const guestRoll = `GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
      const user = await registerCandidate('GUEST CANDIDATE', guestRoll, 'up_police_co');
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
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: '2px solid #93c5fd'
              }}
            >
              UP
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>
                UPPRPB Typing Mentor • AR Standard
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                {activeTab === 'login' ? 'Candidate Login' : 'New Registration'}
              </h3>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                {activeTab === 'login' ? 'अभ्यर्थी लॉगिन पोर्टल' : 'नया अभ्यर्थी पंजीकरण'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* 2 Clean Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              marginBottom: '20px'
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: activeTab === 'login' ? '#ffffff' : 'transparent',
                color: activeTab === 'login' ? '#1e3a8a' : '#64748b',
                boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
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
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: activeTab === 'signup' ? '#ffffff' : 'transparent',
                color: activeTab === 'signup' ? '#1e3a8a' : '#64748b',
                boxShadow: activeTab === 'signup' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
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
                marginBottom: '16px',
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
                  Roll Number or Candidate Name (अनुक्रमांक या नाम) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. UP-202601 or PURENDAR"
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
                  Password (पासवर्ड) <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter password if set"
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
                  Candidate Full Name (अभ्यर्थी का पूरा नाम) *
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
                  Roll Number / Reg No (अनुक्रमांक) *
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
                  Target Examination Post (लक्षित पद)
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
                  Password (पासवर्ड) <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Set password to protect your profile"
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
          <div style={{ textAlign: 'center', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
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
