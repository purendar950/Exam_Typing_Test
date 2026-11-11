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
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelUrl = config?.communityChannelUrl || 'https://t.me/Exam_Typing_Mentor';
  const groupUrl = config?.discussionGroupUrl || 'https://t.me/+Lw-tPbRqOOc2ZTA1';
  const rawSupport = config?.supportUsername || 'purendare';
  const supportUrl = rawSupport.startsWith('http')
    ? rawSupport
    : `https://t.me/${rawSupport.replace(/^@/, '')}`;
  const canUseLiveChat = Boolean(currentUser && !currentUser.isAnonymous);

  // Initialize or fetch Chat Session
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (!currentUser || currentUser.isAnonymous) {
      setChatSession(null);
      return () => {};
    }
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

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSession?.messages, isOpen, activeTab]);

  const handleSendMessage = async (textToSendArg?: string) => {
    const rawText = textToSendArg || inputText;
    if (!rawText.trim() || isSending || !chatSession || !currentUser || currentUser.isAnonymous) return;

    const nameToUse =
      currentUser?.displayName ||
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
      await sendUserLiveMessage(chatSession.id, textToSend, nameToUse, currentUser?.email || undefined, config);
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
              background: 'var(--surface)',
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
                background: 'linear-gradient(135deg, var(--tw-gray-950) 0%, var(--tw-slate-900) 60%, var(--tw-slate-800) 100%)',
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
                    background: 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    flexShrink: 0
                  }}
                >
                  🛡️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
                      Exam Typing Desk
                    </h4>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.18)',
                        color: 'var(--tw-sky-400)',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}
                    >
                      VERIFIED ✓
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--tw-slate-400)',
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
                        background: 'var(--tw-green-500)',
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
                  color: 'var(--tw-slate-400)',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tw-slate-400)')}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tab Bar */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-slate-50)',
                borderBottom: '1px solid var(--bd-slate-200)',
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
                  color: activeTab === 'chat' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)',
                  fontWeight: activeTab === 'chat' ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'chat' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent',
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
                      background: 'var(--tw-red-500)'
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
                  color: activeTab === 'channels' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)',
                  fontWeight: activeTab === 'channels' ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'channels' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent',
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
                  background: 'var(--bg-slate-50)'
                }}
              >
                {!canUseLiveChat && (
                  <div
                    style={{
                      background: 'var(--bg-sky-50)',
                      padding: '8px 14px',
                      borderBottom: '1px solid var(--bd-sky-200)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--fg-sky-700)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      🔐 Sign in to use secure live support.
                    </span>
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
                        background: 'var(--bg-slate-200)',
                        color: 'var(--fg-slate-600)',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
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
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--fg-slate-500)',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {!isUser ? (
                            <span
                              style={{
                                background: 'var(--tw-sky-600)',
                                color: '#ffffff',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                letterSpacing: '0.04em'
                              }}
                            >
                              SUPPORT DESK
                            </span>
                          ) : (
                            <span style={{ color: 'var(--fg-sky-600)', fontWeight: 800 }}>YOU</span>
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
                            background: isUser ? 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)' : 'var(--surface)',
                            color: isUser ? '#ffffff' : 'var(--fg-slate-900)',
                            fontSize: '0.875rem',
                            lineHeight: 1.45,
                            boxShadow: isUser
                              ? '0 3px 10px rgba(2, 132, 199, 0.28)'
                              : '0 2px 8px rgba(15, 23, 42, 0.06)',
                            border: isUser ? 'none' : '1px solid var(--bd-slate-200)',
                            wordBreak: 'break-word'
                          }}
                        >
                          {msg.text}
                          {isUser && (
                            <div style={{ textAlign: 'right', marginTop: '3px', fontSize: '0.75rem', opacity: 0.85 }}>
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
                    background: 'var(--surface)',
                    padding: '8px 12px',
                    borderTop: '1px solid var(--bd-slate-200)',
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
                      disabled={!canUseLiveChat}
                      style={{
                        background: 'var(--bg-slate-100)',
                        border: '1px solid var(--bd-slate-300)',
                        borderRadius: '14px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--fg-slate-700)',
                        cursor: canUseLiveChat ? 'pointer' : 'not-allowed',
                        opacity: canUseLiveChat ? 1 : 0.55,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-sky-100)';
                        e.currentTarget.style.borderColor = 'var(--tw-sky-400)';
                        e.currentTarget.style.color = 'var(--fg-sky-600)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-slate-100)';
                        e.currentTarget.style.borderColor = 'var(--bd-slate-300)';
                        e.currentTarget.style.color = 'var(--fg-slate-700)';
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
                    background: 'var(--surface)',
                    padding: '10px 14px',
                    borderTop: '1px solid var(--bd-slate-100)',
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
                    disabled={isSending || !canUseLiveChat}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '24px',
                      border: '1.5px solid var(--bd-slate-300)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                      background: 'var(--bg-slate-50)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--tw-sky-600)';
                      e.target.style.background = 'var(--surface)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--bd-slate-300)';
                      e.target.style.background = 'var(--bg-slate-50)';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending || !canUseLiveChat}
                    style={{
                      background: inputText.trim() && !isSending && canUseLiveChat ? 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)' : 'var(--bg-slate-300)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: inputText.trim() && !isSending && canUseLiveChat ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: inputText.trim() && !isSending && canUseLiveChat ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none',
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
                    background: 'var(--bg-slate-50)',
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    color: 'var(--fg-slate-500)',
                    textAlign: 'center',
                    borderTop: '1px solid var(--bd-slate-100)',
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
                    background: 'var(--bg-sky-50)',
                    border: '1px solid var(--bd-sky-200)',
                    textDecoration: 'none',
                    color: 'var(--fg-slate-900)'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--tw-sky-600)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}
                  >
                    📢
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--fg-sky-700)' }}>
                      Official Broadcast Channel
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', lineHeight: 1.25 }}>
                      Daily mock alerts, exam cutoffs & special discounts
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fg-sky-600)', fontWeight: 800 }}>Join →</span>
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
                    background: 'var(--bg-slate-50)',
                    border: '1px solid var(--bd-slate-200)',
                    textDecoration: 'none',
                    color: 'var(--fg-slate-900)'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--tw-emerald-500)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}
                  >
                    👥
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--fg-emerald-700)' }}>
                      Aspirants Community Forum
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', lineHeight: 1.25 }}>
                      Ask typing doubts, compare scores & practice together
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fg-emerald-500)', fontWeight: 800 }}>Chat →</span>
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
                    background: 'var(--bg-purple-50)',
                    border: '1px solid var(--bd-purple-200)',
                    textDecoration: 'none',
                    color: 'var(--fg-slate-900)'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--tw-violet-500)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0
                    }}
                  >
                    💬
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--fg-violet-700)' }}>
                      Direct Admin Telegram Chat
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', lineHeight: 1.25 }}>
                      Message Admin Purendar (@purendare) directly in Telegram
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fg-violet-500)', fontWeight: 800 }}>Open →</span>
                </a>

                {/* Pro Plan callout */}
                {onOpenPayment && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, var(--bg-amber-50) 0%, var(--bg-amber-100) 100%)',
                      border: '1px solid var(--bd-amber-200)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginTop: 'auto'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-amber-800)', lineHeight: 1.35 }}>
                      <strong style={{ display: 'block', color: 'var(--fg-amber-900)' }}>👑 Pro Membership Activation</strong>
                      Pay via PhonePe QR & submit your UTR for instant unlock.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenPayment();
                      }}
                      style={{
                        background: 'var(--tw-amber-600)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
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
                background: 'var(--tw-gray-950)',
                padding: '10px 18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--tw-slate-400)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>🔒</span>
                <span>End-to-End Logged</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--tw-sky-400)', fontWeight: 700 }}>
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
            background: 'linear-gradient(135deg, var(--tw-gray-950) 0%, var(--tw-slate-900) 60%, var(--tw-sky-600) 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '28px',
            padding: '11px 20px',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.42)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            fontSize: '0.875rem',
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
              background: 'var(--tw-green-500)',
              boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.4)'
            }}
          />
          {hasUnreadMessages && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--tw-red-500)',
                color: '#ffffff',
                fontSize: '0.75rem',
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
