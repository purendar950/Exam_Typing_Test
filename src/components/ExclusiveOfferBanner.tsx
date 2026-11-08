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
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 70%, #6366f1 100%)',
        color: '#ffffff',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(49, 46, 129, 0.35)',
        position: 'relative',
        zIndex: 50,
        borderBottom: '2px solid #fbbf24',
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
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#0f172a',
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
                  background: '#fbbf24',
                  color: '#0f172a',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                SPECIAL WELCOME OFFER
              </span>
              <span style={{ fontSize: '0.75rem', color: '#c7d2fe', fontWeight: 600 }}>
                {userName ? `Welcome, ${userName}! ` : ''}Exclusive Candidate Pricing
              </span>
            </div>

            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
              <span>Unlock </span>
              <strong style={{ color: '#fde047', textDecoration: 'underline' }}>ANY 1 Exam for 15 Days</strong>
              <span> at just </span>
              <strong style={{ color: '#4ade80', fontSize: '1.15rem' }}>₹12 ONLY</strong>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', marginLeft: '6px' }}>
                (Original <span style={{ textDecoration: 'line-through' }}>₹99</span> &bull; 88% OFF)
              </span>
            </div>

            <div style={{ fontSize: '0.76rem', color: '#e0e7ff', marginTop: '2px', opacity: 0.9 }}>
              Select ANY 1 of all 129 exams (UP Police, High Courts, SSC, Beltron, etc.) with all mock series unlocked.
            </div>
          </div>
        </div>

        {/* Right Side: Action Button & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={onClaim}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '24px',
              padding: '8px 18px',
              fontSize: '0.86rem',
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
              color: '#cbd5e1',
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
