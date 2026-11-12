import React, { useState } from 'react';
import { UserProfile, upgradeLegacyAccount } from '../services/firebase';
import { Ico } from './Ico';

interface AccountUpgradeModalProps {
  user: UserProfile;
  onUpgraded: (user: UserProfile) => void;
  onLogout: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--fg-slate-800)',
  display: 'block',
  marginBottom: '4px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--bd-slate-300)',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box'
};

export const AccountUpgradeModal: React.FC<AccountUpgradeModalProps> = ({ user, onUpgraded, onLogout }) => {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState<{ profile: UserProfile; emailPending: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter your own email address.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Please choose a new password with at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('The two new passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      setDone(await upgradeLegacyAccount(email, newPassword, currentPassword));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update your account. Please try again.';
      setErrorMsg(msg.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10001 }}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-upgrade-title"
        style={{
          maxWidth: '460px',
          width: '95%',
          padding: '0',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--bd-slate-200)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, var(--tw-blue-900) 0%, var(--tw-sky-700) 100%)',
            color: '#ffffff',
            padding: '20px 24px'
          }}
        >
          <h2 id="account-upgrade-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
            <Ico n="shield-check" /> Secure your account
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.45 }}>
            Roll number {user.rollNumber} was registered the old way, without your own email.
            Add your email and a new password to keep using this account.
          </p>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {done ? (
            <div>
              <div
                style={{
                  background: 'var(--bg-green-50)',
                  border: '1px solid var(--bd-green-200)',
                  color: 'var(--fg-green-800)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  marginBottom: '16px'
                }}
              >
                <Ico n="check-circle" /> Your new password is saved.{' '}
                {done.emailPending
                  ? `We sent a confirmation link to ${email.trim()}. Open it to finish adding your email (check Spam too). Until you open it, log in with your roll number and the new password; after that, log in with your email.`
                  : `From now on, log in with ${email.trim()} and your new password. Your roll number no longer works as a login.`}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onUpgraded(done.profile)}
                style={{ width: '100%', padding: '12px', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-md)' }}
              >
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errorMsg && (
                <div
                  role="alert"
                  style={{
                    background: 'var(--bg-red-50)',
                    border: '1px solid var(--bd-red-200)',
                    color: 'var(--fg-red-700)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    lineHeight: 1.4
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="upgrade-email" style={labelStyle}>Your email *</label>
                <input
                  id="upgrade-email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="upgrade-current" style={labelStyle}>Current password</label>
                <input
                  id="upgrade-current"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Leave empty if you never set one"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="upgrade-new" style={labelStyle}>New password (min 8 characters) *</label>
                <input
                  id="upgrade-new"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="upgrade-confirm" style={labelStyle}>Repeat new password *</label>
                <input
                  id="upgrade-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <label style={{ fontSize: '0.8rem', color: 'var(--fg-slate-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                Show passwords
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, var(--tw-blue-900) 0%, var(--tw-sky-600) 100%)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: loading ? 'wait' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : 'Save email and password'}
              </button>

              <button
                type="button"
                onClick={onLogout}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg-slate-600)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px'
                }}
              >
                Log out instead
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
