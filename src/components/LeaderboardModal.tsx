import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, fetchLeaderboard } from '../services/firebase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed?: boolean;
  currentUserId?: string;
  onOpenPayment?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  isSubscribed = false,
  currentUserId,
  onOpenPayment
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [category, setCategory] = useState<'all' | 'hindi' | 'english'>('all');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const maxResults = isSubscribed ? 20 : 3;

    fetchLeaderboard(category, maxResults)
      .then((data) => {
        if (!isMounted) return;
        const enriched = data.map((item) => ({
          ...item,
          isCurrentUser: !!(currentUserId && item.userId === currentUserId)
        }));
        setEntries(enriched);
      })
      .catch((err) => {
        console.warn('Leaderboard error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, category, isSubscribed, currentUserId]);

  if (!isOpen) return null;

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10005 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid var(--bd-slate-200)',
            paddingBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🏅</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--fg-slate-900)' }}>
                Official Typing Skill Hall of Fame
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                Verified Qualified Candidates Ranked by Net Speed (WPM)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.6rem',
              color: 'var(--tw-slate-400)',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {(['all', 'hindi', 'english'] as const).map((cat) => {
            const isActive = category === cat;
            const label =
              cat === 'all'
                ? '🌐 All Tests'
                : cat === 'hindi'
                ? '🇮🇳 Hindi (25+ WPM Cutoff)'
                : '🔤 English (30+ WPM Cutoff)';

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isActive ? '1.5px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
                  background: isActive ? 'var(--tw-sky-600)' : 'var(--surface)',
                  color: isActive ? '#ffffff' : 'var(--fg-slate-600)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Entries List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-slate-500)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <div>Fetching live examination scores...</div>
            </div>
          ) : entries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--fg-slate-500)',
                background: 'var(--bg-slate-50)',
                borderRadius: '8px',
                border: '1px dashed var(--bd-slate-300)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎯</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--fg-slate-900)', marginBottom: '4px' }}>
                No qualified scores yet!
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Take a mock test, qualify the cutoff, and be the first name on the board!
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entries.map((item, idx) => {
                const isTop3 = idx < 3;
                const isUser = item.isCurrentUser;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: isUser
                        ? 'var(--bg-blue-50)'
                        : isTop3
                        ? 'var(--bg-yellow-50)'
                        : 'var(--surface)',
                      border: isUser
                        ? '1.5px solid var(--tw-blue-500)'
                        : isTop3
                        ? '1px solid var(--bd-yellow-300)'
                        : '1px solid var(--bd-slate-200)',
                      boxShadow: isTop3 ? '0 1px 3px rgba(234, 179, 8, 0.15)' : 'none'
                    }}
                  >
                    {/* Rank Indicator */}
                    <div
                      style={{
                        width: '36px',
                        textAlign: 'center',
                        fontSize: isTop3 ? '1.4rem' : '0.9rem',
                        fontWeight: 900,
                        color: isTop3 ? 'var(--fg-yellow-600)' : 'var(--fg-slate-500)',
                        flexShrink: 0
                      }}
                    >
                      {isTop3 ? MEDALS[idx] : `#${item.rank}`}
                    </div>

                    {/* Candidate Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--fg-slate-900)' }}>
                          {item.displayName}
                        </span>
                        {isUser && (
                          <span
                            style={{
                              background: 'var(--tw-blue-500)',
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
                        <span>{item.language.startsWith('hindi') ? '🇮🇳 Hindi' : '🔤 English'}</span>
                        <span> &bull; </span>
                        <span>{item.examTitle}</span>
                      </div>
                    </div>

                    {/* Speed & Accuracy */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--fg-sky-600)' }}>
                        {item.netWpm}{' '}
                        <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', fontWeight: 700 }}>
                          WPM
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-green-600)', fontWeight: 700 }}>
                        {item.accuracy}% acc &bull; QUALIFIED
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Free Plan Upgrade Teaser */}
        {!isSubscribed && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--bg-green-50) 0%, var(--bg-green-100) 100%)',
              border: '1px solid var(--bd-green-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--fg-green-700)' }}>
                🔒 Showing Top 3 Free Rankers
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--fg-green-800)' }}>
                Upgrade to Pro to see the complete Top 20 All-India leaderboard.
              </div>
            </div>

            {onOpenPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment();
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--tw-green-600) 0%, var(--tw-green-700) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                👑 Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
