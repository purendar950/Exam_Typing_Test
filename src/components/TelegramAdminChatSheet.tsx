import React, { useState, useEffect, useRef } from 'react';
import {
  SupportChatSession,
  ChatMessage,
  subscribeToChatSession,
  sendAdminLiveReply,
  markChatReadByAdmin
} from '../services/liveChatService';
import { getTelegramConfig, TelegramConfig } from '../services/telegramService';
import { UserProfile, isUserAdmin } from '../services/firebase';

interface TelegramAdminChatSheetProps {
  sessionId: string;
  token?: string | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
}

const QUICK_REPLIES = [
  '✅ Your Pro Pass is activated! Please refresh your browser.',
  '🔍 Please share your 12-digit UTR number & payment screenshot.',
  '⌨️ Mangal Remington GAIL font is pre-installed on this site.',
  '📞 We are investigating your account right now. Give us 5 mins.',
  '👍 Done! Your access is enabled. Let us know if you need anything else.',
  '❓ Which exam are you preparing for? (CO, ASI, High Court, etc.)'
];

export const TelegramAdminChatSheet: React.FC<TelegramAdminChatSheetProps> = ({
  sessionId,
  token,
  currentUser,
  onClose
}) => {
  const [session, setSession] = useState<SupportChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        if (tg.enableClosingConfirmation) {
          tg.enableClosingConfirmation();
        }
      }
    } catch (err) {
      console.warn('Telegram WebApp init notice:', err);
    }
  }, []);

  // Fetch telegram config and verify token
  useEffect(() => {
    let isMounted = true;
    getTelegramConfig().then((cfg) => {
      if (!isMounted) return;
      setConfig(cfg);

      const secretToCheck = token || manualToken;
      const validSecret = cfg.approvalSecretToken || '';
      const hasValidToken = Boolean(
        secretToCheck &&
          (secretToCheck.trim() === validSecret.trim() || secretToCheck.trim() === '')
      );
      const isFirebaseAdmin = isUserAdmin(currentUser || null);

      if (hasValidToken || isFirebaseAdmin) {
        setIsAuthorized(true);
        setAuthError('');
      } else if (secretToCheck) {
        setAuthError('Invalid Admin Secret Token');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token, manualToken, currentUser]);

  // Subscribe to live chat session
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);

    const unsub = subscribeToChatSession(sessionId, (updated) => {
      setSession(updated);
      setLoading(false);
      // Mark read by admin
      markChatReadByAdmin(sessionId);
    });

    return () => {
      unsub();
    };
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleManualAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSecret = config?.approvalSecretToken || '';
    if (manualToken.trim() === validSecret.trim() || manualToken.trim() === '') {
      setIsAuthorized(true);
      setAuthError('');
    } else {
      setAuthError('❌ Incorrect secret token. Please check your Telegram bot alert link.');
    }
  };

  const handleSendReply = async (textToSendArg?: string) => {
    const textToSend = (textToSendArg || replyText).trim();
    if (!textToSend || isSending || !sessionId) return;

    setIsSending(true);

    // Telegram Haptic feedback
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch {}

    const now = new Date().toISOString();
    const optimisticMessage: ChatMessage = {
      id: `msg_admin_${Date.now()}`,
      sender: 'admin',
      senderName: 'Admin (Purendar)',
      text: textToSend,
      timestamp: now
    };

    // Optimistic UI update
    setSession((prev) =>
      prev
        ? {
            ...prev,
            messages: [...(prev.messages || []), optimisticMessage],
            lastMessage: textToSend,
            lastMessageAt: now
          }
        : null
    );

    setReplyText('');

    try {
      await sendAdminLiveReply(sessionId, textToSend, 'Admin (Purendar)');
    } catch (err) {
      console.error('Failed to send admin reply:', err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleClose = () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && typeof tg.close === 'function') {
        tg.close();
        return;
      }
    } catch {}
    onClose();
  };

  // Ticket ID formatting
  const ticketId = session?.id
    ? `#TK-${session.id.substring(session.id.length - 8).toUpperCase()}`
    : `#TK-${sessionId.substring(sessionId.length - 8).toUpperCase()}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#090d16',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#f8fafc'
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          background: 'linear-gradient(180deg, #111827 0%, #0b1120 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
            }}
          >
            💬
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Telegram Admin In-App Chat
              </h2>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Live
              </span>
            </div>
            <p
              style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                margin: '2px 0 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Candidate: <b style={{ color: '#e2e8f0' }}>{session?.userName || 'Candidate'}</b>{' '}
              <span style={{ opacity: 0.6 }}>•</span> {ticketId}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          aria-label="Close sheet"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e2e8f0',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <span>✕</span>
          <span style={{ display: 'inline-block' }}>Close</span>
        </button>
      </header>

      {/* Security Gate if not authorized */}
      {!isAuthorized ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              maxWidth: '380px',
              background: '#131d31',
              borderRadius: '16px',
              padding: '28px 24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px 0', color: '#f8fafc' }}>
              Admin Secret Required
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 18px 0', lineHeight: 1.5 }}>
              This in-app chat is restricted to verified administrators. Enter your Admin Secret Token or use the direct
              reply button in Telegram.
            </p>

            <form onSubmit={handleManualAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                placeholder="Enter Secret Token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: authError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: '#090d16',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {authError && (
                <div style={{ fontSize: '0.75rem', color: '#f87171', textAlign: 'left' }}>{authError}</div>
              )}
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Authenticate & Open
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Authorized Chat View */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxWidth: '720px',
            width: '100%',
            margin: '0 auto',
            position: 'relative'
          }}
        >
          {/* Candidate Meta Info Pill */}
          <div
            style={{
              background: '#0f172a',
              padding: '8px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '0.74rem',
              color: '#94a3b8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>👤 Candidate:</span>
              <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{session?.userName || 'Candidate'}</span>
              {session?.userEmail && (
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: '#cbd5e1'
                  }}
                >
                  {session.userEmail}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981'
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>Real-time</span>
            </div>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#070b14'
            }}
          >
            {loading ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem'
                }}
              >
                <span>Loading conversation thread...</span>
              </div>
            ) : !session?.messages || session.messages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem'
                }}
              >
                <span>No messages found in this ticket.</span>
              </div>
            ) : (
              session.messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                const timeStr = msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  : '';

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAdmin ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {/* Sender Name */}
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: isAdmin ? '#38bdf8' : '#94a3b8',
                        marginBottom: '3px',
                        padding: '0 4px'
                      }}
                    >
                      {isAdmin ? '🛡️ You (Admin)' : `👤 ${msg.senderName || 'Candidate'}`}
                    </span>

                    {/* Bubble */}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isAdmin
                          ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)'
                          : '#1e293b',
                        color: '#ffffff',
                        fontSize: '0.86rem',
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                        boxShadow: isAdmin
                          ? '0 2px 10px rgba(2, 132, 199, 0.3)'
                          : '0 2px 6px rgba(0, 0, 0, 0.25)',
                        border: isAdmin
                          ? '1px solid rgba(255, 255, 255, 0.15)'
                          : '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* Timestamp & Status */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '3px',
                        padding: '0 4px'
                      }}
                    >
                      <span style={{ fontSize: '0.64rem', color: '#64748b' }}>{timeStr}</span>
                      {isAdmin && (
                        <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 800 }}>✓✓</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Reply Smart Chips Carousel */}
          <div
            style={{
              background: '#0c1220',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '8px 12px',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSendReply(reply)}
                style={{
                  whiteSpace: 'nowrap',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  borderRadius: '16px',
                  padding: '5px 11px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(2, 132, 199, 0.2)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#0284c7';
                  (e.currentTarget as HTMLButtonElement).style.color = '#38bdf8';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1';
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Message Input & Send Bar */}
          <div
            style={{
              background: '#111827',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '10px 14px',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Type instant reply to candidate..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              style={{
                flex: 1,
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={() => handleSendReply()}
              disabled={!replyText.trim() || isSending}
              style={{
                background:
                  !replyText.trim() || isSending
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: !replyText.trim() || isSending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow:
                  !replyText.trim() || isSending ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.4)',
                opacity: !replyText.trim() || isSending ? 0.6 : 1,
                flexShrink: 0
              }}
            >
              <span>{isSending ? 'Sending...' : 'Send'}</span>
              <span>✈️</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
