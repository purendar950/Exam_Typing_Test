import React, { useState, useEffect, useRef } from 'react';
import { TelegramConfig } from '../services/telegramService';
import { UserProfile } from '../services/firebase';
import {
  SupportChatSession,
  ChatMessage,
  getOrCreateChatSession,
  subscribeToChatSession,
  sendUserLiveMessage,
  markChatReadByUser
} from '../services/liveChatService';

interface TelegramSupportWidgetProps {
  config: TelegramConfig | null;
  currentUser?: UserProfile | null;
  onOpenPayment?: () => void;
}

export const TelegramSupportWidget: React.FC<TelegramSupportWidgetProps> = ({
  config,
  currentUser,
  onOpenPayment
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'channels'>('chat');
  const [chatSession, setChatSession] = useState<SupportChatSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [candidateNameInput, setCandidateNameInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelUrl = config?.communityChannelUrl || 'https://t.me/Exam_Typing_Mentor';
  const groupUrl = config?.discussionGroupUrl || 'https://t.me/+Lw-tPbRqO0c2ZTA1';
  const rawSupport = config?.supportUsername || 'purendare';
  const supportUrl = rawSupport.startsWith('http')
    ? rawSupport
    : `https://t.me/${rawSupport.replace(/^@/, '')}`;

  // Initialize or fetch Chat Session
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    getOrCreateChatSession(currentUser).then((session) => {
      setChatSession(session);
      unsubscribe = subscribeToChatSession(session.id, (updated) => {
        if (updated) {
          setChatSession(updated);
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Mark as read when widget is opened
  useEffect(() => {
    if (isOpen && chatSession?.id && chatSession.unreadByUser) {
      markChatReadByUser(chatSession.id);
    }
  }, [isOpen, chatSession?.unreadByUser]);

  // Sync any newly saved admin replies
  useEffect(() => {
    if (!chatSession?.id) return;
    const interval = setInterval(() => {
      try {
        const savedKey = `up_ticket_replies_${chatSession.id}`;
        const savedReplies: ChatMessage[] = JSON.parse(localStorage.getItem(savedKey) || '[]');
        if (savedReplies.length > 0) {
          setChatSession((prev) => {
            if (!prev) return prev;
            const existingIds = new Set((prev.messages || []).map((m) => m.id));
            const newReplies = savedReplies.filter((r) => !existingIds.has(r.id));
            if (newReplies.length > 0) {
              return {
                ...prev,
                messages: [...(prev.messages || []), ...newReplies],
                lastMessage: newReplies[newReplies.length - 1].text,
                lastMessageAt: newReplies[newReplies.length - 1].timestamp,
                unreadByUser: true
              };
            }
            return prev;
          });
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [chatSession?.id]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSession?.messages, isOpen, activeTab]);

  const handleSendMessage = async (textToSendArg?: string) => {
    const rawText = textToSendArg || inputText;
    if (!rawText.trim() || isSending || !chatSession) return;

    const nameToUse =
      currentUser?.displayName ||
      candidateNameInput.trim() ||
      chatSession.userName ||
      'Candidate';

    const textToSend = rawText.trim();
    const now = new Date().toISOString();

    const optimisticMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      senderName: nameToUse,
      text: textToSend,
      timestamp: now
    };

    // 1. Immediately render candidate message bubble in chatbox (zero lag)
    setChatSession((prev) =>
      prev
        ? {
            ...prev,
            messages: [...(prev.messages || []), optimisticMsg],
            lastMessage: textToSend,
            lastMessageAt: now
          }
        : null
    );

    setIsSending(true);
    if (!textToSendArg) setInputText('');

    try {
      await sendUserLiveMessage(chatSession.id, textToSend, nameToUse, currentUser?.email, config);
    } catch (err) {
      console.error('Failed to send live message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const hasUnreadMessages = Boolean(chatSession?.unreadByUser);

  const QUICK_PROMPTS = [
    { label: '💳 Pro Pass Verification', text: 'Hi Admin, I have completed payment for Pro Pass. Please verify and activate.' },
    { label: '🔍 Check UTR Status', text: 'Hi, I submitted my UTR number. Could you please check the activation status?' },
    { label: '⌨️ Font Setup Help', text: 'Hi, I need assistance setting up Mangal Inscript / Kruti Dev font on my computer.' },
    { label: '💬 Talk to Admin', text: 'Hi Admin, I have a quick question regarding the typing examination format.' }
  ];

  return (
    <>
      {/* Floating Widget Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '22px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* Expanded Fintech Support Card */}
        {isOpen && (
          <div
            style={{
              width: '380px',
              maxWidth: 'calc(100vw - 32px)',
              height: '560px',
              maxHeight: 'calc(100vh - 100px)',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.32), 0 0 0 1px rgba(226, 232, 240, 0.9)',
              overflow: 'hidden',
              animation: 'fadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Fintech Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #090d16 0%, #0f172a 60%, #1e293b 100%)',
                padding: '16px 18px',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    flexShrink: 0
                  }}
                >
                  🛡️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
                      Exam Typing Desk
                    </h4>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.18)',
                        color: '#38bdf8',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}
                    >
                      VERIFIED ✓
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '3px'
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        boxShadow: '0 0 8px #22c55e',
                        display: 'inline-block'
                      }}
                    />
                    <span>Active Helpdesk • Telegram Alerts Synced</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#94a3b8',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tab Bar */}
            <div
              style={{
                display: 'flex',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                padding: '0 10px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'chat' ? '#0284c7' : '#64748b',
                  fontWeight: activeTab === 'chat' ? 800 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'chat' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>💬</span>
                <span>Live Chat with Admin</span>
                {hasUnreadMessages && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444'
                    }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('channels')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'channels' ? '#0284c7' : '#64748b',
                  fontWeight: activeTab === 'channels' ? 800 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'channels' ? '2.5px solid #0284c7' : '2.5px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>📢</span>
                <span>Official Channels</span>
              </button>
            </div>

            {/* Tab 1: Live Chat Content */}
            {activeTab === 'chat' && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  background: '#f8fafc'
                }}
              >
                {/* Guest name input if not logged in */}
                {!currentUser && (!chatSession?.userName || chatSession.userName === 'Candidate') && (
                  <div
                    style={{
                      background: '#f0f9ff',
                      padding: '8px 14px',
                      borderBottom: '1px solid #bae6fd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      👤 Your Name:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={candidateNameInput}
                      onChange={(e) => setCandidateNameInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #7dd3fc',
                        fontSize: '0.78rem',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                )}

                {/* Messages Scroll Area */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Security Header Banner */}
                  <div style={{ textAlign: 'center', margin: '4px 0 8px 0' }}>
                    <span
                      style={{
                        background: '#e2e8f0',
                        color: '#475569',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>🔒</span>
                      <span>256-Bit SSL Encrypted Live Session</span>
                    </span>
                  </div>

                  {chatSession?.messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isUser ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            color: '#64748b',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {!isUser ? (
                            <span
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.60rem',
                                fontWeight: 800,
                                letterSpacing: '0.04em'
                              }}
                            >
                              SUPPORT DESK
                            </span>
                          ) : (
                            <span style={{ color: '#0284c7', fontWeight: 800 }}>YOU</span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div
                          style={{
                            maxWidth: '85%',
                            padding: '10px 14px',
                            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isUser ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                            color: isUser ? '#ffffff' : '#0f172a',
                            fontSize: '0.85rem',
                            lineHeight: 1.45,
                            boxShadow: isUser
                              ? '0 3px 10px rgba(2, 132, 199, 0.28)'
                              : '0 2px 8px rgba(15, 23, 42, 0.06)',
                            border: isUser ? 'none' : '1px solid #e2e8f0',
                            wordBreak: 'break-word'
                          }}
                        >
                          {msg.text}
                          {isUser && (
                            <div style={{ textAlign: 'right', marginTop: '3px', fontSize: '0.62rem', opacity: 0.85 }}>
                              Delivered ✓✓
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestion Chips */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '8px 12px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                  }}
                >
                  {QUICK_PROMPTS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(p.text)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '14px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e0f2fe';
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.color = '#0284c7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  style={{
                    background: '#ffffff',
                    padding: '10px 14px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type your query to Admin..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '24px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      background: '#f8fafc'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0284c7';
                      e.target.style.background = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.background = '#f8fafc';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    style={{
                      background: inputText.trim() && !isSending ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: inputText.trim() && !isSending ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: inputText.trim() && !isSending ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    title="Send message to Admin"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>

                {/* Footer status text */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '6px 14px',
                    fontSize: '0.68rem',
                    color: '#64748b',
                    textAlign: 'center',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>⚡</span>
                  <span>Dispatched instantly to Administrator Telegram Bot with 1-click reply.</span>
                </div>
              </div>
            )}

            {/* Tab 2: Channels & Links Content */}
            {activeTab === 'channels' && (
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  overflowY: 'auto'
                }}
              >
                {/* Option 1: Official Channel */}
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    textDecoration: 'none',
                    color: '#0f172a'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}
                  >
                    📢
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0369a1' }}>
                      Official Broadcast Channel
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.25 }}>
                      Daily mock alerts, exam cutoffs & special discounts
                    </div>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 800 }}>Join →</span>
                </a>

                {/* Option 2: Discussion Group */}
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    color: '#0f172a'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}
                  >
                    👥
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#047857' }}>
                      Aspirants Community Forum
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.25 }}>
                      Ask typing doubts, compare scores & practice together
                    </div>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 800 }}>Chat →</span>
                </a>

                {/* Option 3: Direct 1-on-1 Admin Chat */}
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    textDecoration: 'none',
                    color: '#0f172a'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#8b5cf6',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}
                  >
                    💬
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#6d28d9' }}>
                      Direct Admin Telegram Chat
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.25 }}>
                      Message Admin Purendar (@purendare) directly in Telegram
                    </div>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#8b5cf6', fontWeight: 800 }}>Open →</span>
                </a>

                {/* Pro Plan callout */}
                {onOpenPayment && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      border: '1px solid #fde68a',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginTop: 'auto'
                    }}
                  >
                    <div style={{ fontSize: '0.76rem', color: '#92400e', lineHeight: 1.35 }}>
                      <strong style={{ display: 'block', color: '#78350f' }}>👑 Pro Membership Activation</strong>
                      Pay via PhonePe QR & submit your UTR for instant unlock.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenPayment();
                      }}
                      style={{
                        background: '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      View Plans
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Fintech Footer */}
            <div
              style={{
                background: '#090d16',
                padding: '10px 18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.70rem',
                color: '#94a3b8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>🔒</span>
                <span>End-to-End Logged</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontWeight: 700 }}>
                <span>Telegram Bot v2.4</span>
                <span>•</span>
                <span>Verified Desk</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'linear-gradient(135deg, #090d16 0%, #0f172a 60%, #0284c7 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '28px',
            padding: '11px 20px',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.42)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            fontSize: '0.88rem',
            fontWeight: 800,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            position: 'relative'
          }}
          title="Open Fintech Live Chat & Support Desk"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          <span>Community & Help</span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.4)'
            }}
          />
          {hasUnreadMessages && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)'
              }}
            >
              1
            </span>
          )}
        </button>
      </div>
    </>
  );
};
