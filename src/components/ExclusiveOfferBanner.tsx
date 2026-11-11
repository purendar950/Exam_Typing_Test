import React from 'react';

interface ExclusiveOfferBannerProps {
  onClaim: () => void;
  onDismiss: () => void;
  userName?: string;
}

export const ExclusiveOfferBanner: React.FC<ExclusiveOfferBannerProps> = ({
  onClaim,
  onDismiss,
  userName
}) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--tw-indigo-950) 0%, var(--tw-indigo-900) 35%, var(--tw-indigo-700) 70%, var(--tw-indigo-500) 100%)',
        color: '#ffffff',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(49, 46, 129, 0.35)',
        position: 'relative',
        zIndex: 50,
        borderBottom: '2px solid var(--tw-amber-400)',
        animation: 'fadeInDown 0.3s ease-out'
      }}
    >
      <div
        className="container"
        style={{
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left Side: Offer Pitch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px', minWidth: 0 }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--tw-amber-400) 0%, var(--tw-amber-500) 100%)',
              color: 'var(--tw-slate-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
              flexShrink: 0
            }}
          >
            ⚡
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span
                style={{
                  background: 'var(--tw-amber-400)',
                  color: 'var(--tw-slate-900)',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                SPECIAL WELCOME OFFER
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--tw-indigo-200)', fontWeight: 600 }}>
                {userName ? `Welcome, ${userName}! ` : ''}Exclusive Candidate Pricing
              </span>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
              <span>Unlock </span>
              <strong style={{ color: 'var(--tw-yellow-300)', textDecoration: 'underline' }}>ANY 1 Exam for 15 Days</strong>
              <span> at just </span>
              <strong style={{ color: 'var(--tw-green-400)', fontSize: '1.1rem' }}>₹12 ONLY</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--tw-slate-300)', marginLeft: '6px' }}>
                (Original <span style={{ textDecoration: 'line-through' }}>₹99</span> &bull; 88% OFF)
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--tw-indigo-100)', marginTop: '2px', opacity: 0.9 }}>
              Select ANY 1 of all 129 exams (UP Police, High Courts, SSC, Beltron, etc.) with all mock series unlocked.
            </div>
          </div>
        </div>

        {/* Right Side: Action Button & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={onClaim}
            style={{
              background: 'linear-gradient(135deg, var(--tw-green-500) 0%, var(--tw-green-600) 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '24px',
              padding: '8px 18px',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(34, 197, 94, 0.45)',
              transition: 'transform 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🚀</span>
            <span>Claim ₹12 Pass Now (अभी लें)</span>
          </button>

          <button
            onClick={onDismiss}
            aria-label="Dismiss Offer Banner"
            title="Dismiss offer"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: 'var(--tw-slate-300)',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
};
