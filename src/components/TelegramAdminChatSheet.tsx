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

interface QuickActionChip {
  label: string;
  message: string;
}

const QUICK_ACTIONS: QuickActionChip[] = [
  {
    label: '⚡ Pro Pass Active',
    message: '✅ Your Pro Pass is activated! Please refresh your browser to start practicing.'
  },
  {
    label: '🔍 Request UTR',
    message: '🔍 Please share your 12-digit UTR number and payment receipt screenshot so we can verify.'
  },
  {
    label: '⌨️ Font Setup',
    message: '⌨️ Mangal Remington GAIL font is pre-configured on this site. Select it from the font dropdown.'
  },
  {
    label: '⏳ Checking (5 mins)',
    message: '📞 We are checking your account details right now. Please give us 5 minutes.'
  },
  {
    label: '👍 All Resolved',
    message: '👍 Your issue has been resolved. Please check your access and let us know!'
  }
];

export const TelegramAdminChatSheet: React.FC<TelegramAdminChatSheetProps> = ({
  sessionId,
  token,
  currentUser,
  onClose
}) => {
  // 1. Immediately read URL parameters for instant 0ms rendering
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const paramName = urlParams.get('c_name') || urlParams.get('name') || '';
  const paramEmail = urlParams.get('c_email') || urlParams.get('email') || '';
  const paramMsg = urlParams.get('c_msg') || urlParams.get('msg') || '';

  // 2. Initialise conversation state immediately from URL params and local storage
  const [session, setSession] = useState<SupportChatSession>(() => {
    const candidateName = paramName.trim() || 'Candidate';
    const candidateEmail = paramEmail.trim() || '';
    const initialMessages: ChatMessage[] = [];

    // Candidate initial message if passed in URL
    if (paramMsg.trim()) {
      initialMessages.push({
        id: `msg_init_${sessionId}`,
        sender: 'user',
        senderName: candidateName,
        text: paramMsg.trim(),
        timestamp: new Date().toISOString()
      });
    }

    // Load any previously saved admin replies for this ticket
    try {
      const savedKey = `up_ticket_replies_${sessionId}`;
      const savedReplies: ChatMessage[] = JSON.parse(localStorage.getItem(savedKey) || '[]');
      savedReplies.forEach((r) => initialMessages.push(r));
    } catch {}

    return {
      id: sessionId,
      userName: candidateName,
      userEmail: candidateEmail,
      status: 'open',
      messages: initialMessages,
      lastMessage: initialMessages[initialMessages.length - 1]?.text || 'Ticket open',
      lastMessageAt: new Date().toISOString(),
      unreadByAdmin: false,
      unreadByUser: false,
      createdAt: new Date().toISOString()
    };
  });

  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true); // Default authorized if secret token in URL or fallback
  const [authError, setAuthError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Telegram WebApp SDK & Viewport
  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        if (tg.enableClosingConfirmation) {
          tg.enableClosingConfirmation();
        }
        if (tg.setHeaderColor) tg.setHeaderColor('#0f172a');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#090d16');
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

      if (hasValidToken || isFirebaseAdmin || !token) {
        setIsAuthorized(true);
        setAuthError('');
      } else {
        setIsAuthorized(false);
        setAuthError('Invalid Admin Secret Token');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token, manualToken, currentUser]);

  // Subscribe to live chat session (merges with URL seeded messages)
  useEffect(() => {
    if (!sessionId) return;

    const unsub = subscribeToChatSession(sessionId, (updated) => {
      if (updated && updated.messages && updated.messages.length > 0) {
        setSession((prev) => {
          // Merge messages to ensure no candidate message or reply is missed
          const msgMap = new Map<string, ChatMessage>();
          (prev?.messages || []).forEach((m) => msgMap.set(m.id, m));
          (updated.messages || []).forEach((m) => msgMap.set(m.id, m));

          const merged = Array.from(msgMap.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          return {
            ...updated,
            userName: updated.userName !== 'Candidate' ? updated.userName : (prev?.userName || 'Candidate'),
            userEmail: updated.userEmail || prev?.userEmail || '',
            messages: merged
          };
        });
      }
      setLoading(false);
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
      setAuthError('❌ Incorrect secret token. Please check your Telegram alert link.');
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

    // 1. Optimistic UI update
    setSession((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), optimisticMessage],
      lastMessage: textToSend,
      lastMessageAt: now
    }));

    // 2. Persist locally under ticket replies
    try {
      const savedKey = `up_ticket_replies_${sessionId}`;
      const savedReplies: ChatMessage[] = JSON.parse(localStorage.getItem(savedKey) || '[]');
      savedReplies.push(optimisticMessage);
      localStorage.setItem(savedKey, JSON.stringify(savedReplies));
    } catch {}

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
  const shortId = sessionId.substring(sessionId.length - 8).toUpperCase();
  const ticketId = `#TK-${shortId}`;
  const candidateInitials = (session?.userName || 'Candidate')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'C';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#090d16',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#f8fafc'
      }}
    >
      {/* Optimized Compact Header */}
      <header
        style={{
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
            }}
          >
            💬
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  whiteSpace: 'nowrap'
                }}
              >
                Helpdesk Reply
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  background: '#064e3b',
                  color: '#34d399',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.3px',
                  lineHeight: 1
                }}
              >
                LIVE
              </span>
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '1px'
              }}
            >
              <b style={{ color: '#38bdf8' }}>{session?.userName || 'Candidate'}</b>{' '}
              <span style={{ opacity: 0.5 }}>•</span> <span style={{ color: '#cbd5e1' }}>{ticketId}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          aria-label="Close sheet"
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#e2e8f0',
            borderRadius: '7px',
            padding: '6px 10px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0
          }}
        >
          <span>✕</span>
          <span>Close</span>
        </button>
      </header>

      {/* Candidate Email Sub-strip (if available) */}
      {session?.userEmail && (
        <div
          style={{
            background: '#0b1329',
            padding: '4px 14px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            flexShrink: 0
          }}
        >
          <span>📧</span>
          <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.userEmail}
          </span>
        </div>
      )}

      {/* Security Gate if token failed */}
      {!isAuthorized ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              maxWidth: '360px',
              width: '100%',
              background: '#131d31',
              borderRadius: '14px',
              padding: '24px 20px',
              border: '1px solid #1e293b'
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>🔒</div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
              Admin Verification
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Enter your Admin Secret Token or use the one-tap link in your Telegram bot message.
            </p>

            <form onSubmit={handleManualAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="password"
                placeholder="Enter Secret Token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: authError ? '1px solid #ef4444' : '1px solid #334155',
                  background: '#090d16',
                  color: '#ffffff',
                  fontSize: '16px',
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
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                Unlock & Open
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Conversation Stream */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
            position: 'relative'
          }}
        >
          {/* Scrollable Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#070b14'
            }}
          >
            {/* Ticket Info Card */}
            <div
              style={{
                alignSelf: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.72rem',
                color: '#94a3b8',
                textAlign: 'center',
                margin: '2px 0 6px 0'
              }}
            >
              <span>Ticket </span>
              <b style={{ color: '#38bdf8' }}>{ticketId}</b>
              <span> • Direct 1-on-1 Admin Session</span>
            </div>

            {/* Message Bubbles */}
            {session.messages && session.messages.length > 0 ? (
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
                      maxWidth: '88%',
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
                      {isAdmin ? '🛡️ You (Admin)' : `👤 ${msg.senderName || session.userName}`}
                    </span>

                    {/* Bubble */}
                    <div
                      style={{
                        padding: '9px 13px',
                        borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isAdmin
                          ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)'
                          : '#1e293b',
                        color: '#ffffff',
                        fontSize: '0.86rem',
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                        boxShadow: isAdmin
                          ? '0 2px 8px rgba(2, 132, 199, 0.3)'
                          : '0 2px 6px rgba(0, 0, 0, 0.3)',
                        border: isAdmin
                          ? '1px solid rgba(255, 255, 255, 0.15)'
                          : '1px solid rgba(255, 255, 255, 0.08)'
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
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '0.82rem',
                  textAlign: 'center',
                  padding: '20px'
                }}
              >
                <span>Ready to reply to {session.userName}. Tap a quick response below or type a message.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Reply Smart Action Chips (Compact horizontal scroll) */}
          <div
            style={{
              background: '#0c1220',
              borderTop: '1px solid #1e293b',
              padding: '7px 10px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              flexShrink: 0
            }}
          >
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (replyText.trim() === action.message.trim()) {
                    handleSendReply(action.message);
                  } else {
                    setReplyText(action.message);
                    inputRef.current?.focus();
                  }
                }}
                style={{
                  whiteSpace: 'nowrap',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  borderRadius: '14px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Message Input & Send Bar */}
          <div
            style={{
              background: '#0f172a',
              borderTop: '1px solid #1e293b',
              padding: '8px 12px',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={`Reply to ${session.userName}...`}
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
                background: '#070b14',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#ffffff',
                fontSize: '16px', // 16px prevents iOS/Android webview auto-zoom
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
                borderRadius: '8px',
                padding: '9px 14px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: !replyText.trim() || isSending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                opacity: !replyText.trim() || isSending ? 0.6 : 1,
                flexShrink: 0
              }}
            >
              <span>{isSending ? '...' : 'Send'}</span>
              <span>✈️</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
