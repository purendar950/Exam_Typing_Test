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

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSession?.messages, isOpen, activeTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || !chatSession) return;

    const nameToUse =
      currentUser?.displayName ||
      candidateNameInput.trim() ||
      chatSession.userName ||
      'Candidate';

    const textToSend = inputText.trim();
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
    setInputText('');

    try {
      await sendUserLiveMessage(chatSession.id, textToSend, nameToUse, currentUser?.email, config);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const hasUnreadMessages = Boolean(chatSession?.unreadByUser);

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
          gap: '10px'
        }}
      >
        {/* Expanded Support Card */}
        {isOpen && (
          <div
            style={{
              width: '360px',
              maxWidth: 'calc(100vw - 32px)',
              height: '520px',
              maxHeight: 'calc(100vh - 110px)',
              background: '#ffffff',
              borderRadius: '18px',
              boxShadow: '0 16px 42px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(226, 232, 240, 0.9)',
              overflow: 'hidden',
              animation: 'fadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                padding: '14px 16px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}
                >
                  💬
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>
                    Exam Typing Live Desk
                  </h4>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      opacity: 0.92,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#4ade80',
                        display: 'inline-block'
                      }}
                    />
                    Admin Live • Telegram Alerts Synced
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem'
                }}
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
                padding: '0 8px'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
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
                      width: '7px',
                      height: '7px',
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
                  padding: '9px 12px',
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
                <span>Telegram Links</span>
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
                  background: '#f1f5f9'
                }}
              >
                {/* Name prompt for guest users */}
                {!currentUser && (!chatSession?.userName || chatSession.userName === 'Candidate') && (
                  <div
                    style={{
                      background: '#e0f2fe',
                      padding: '8px 12px',
                      borderBottom: '1px solid #bae6fd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Your Name:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={candidateNameInput}
                      onChange={(e) => setCandidateNameInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #7dd3fc',
                        fontSize: '0.76rem',
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
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
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
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#64748b',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {!isUser && (
                            <span
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.62rem',
                                fontWeight: 800
                              }}
                            >
                              ADMIN
                            </span>
                          )}
                          <span>{msg.senderName}</span>
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
                            padding: '9px 13px',
                            borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            background: isUser ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                            color: isUser ? '#ffffff' : '#0f172a',
                            fontSize: '0.84rem',
                            lineHeight: 1.4,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            wordBreak: 'break-word',
                            border: isUser ? 'none' : '1px solid #e2e8f0'
                          }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    background: '#ffffff',
                    padding: '10px 12px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type your message to Admin..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '22px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    style={{
                      background: inputText.trim() && !isSending ? '#0284c7' : '#94a3b8',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      cursor: inputText.trim() && !isSending ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s ease'
                    }}
                    title="Send message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>

                {/* Live Chat Footer note */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '6px 12px',
                    fontSize: '0.68rem',
                    color: '#64748b',
                    textAlign: 'center',
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  ⚡ Admin receives your message instantly on Telegram & replies here in real time.
                </div>
              </div>
            )}

            {/* Tab 2: Channels & Links Content */}
            {activeTab === 'channels' && (
              <div
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
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
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    textDecoration: 'none',
                    color: '#0f172a'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0
                    }}
                  >
                    📢
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0369a1' }}>
                      Official Telegram Channel
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.25 }}>
                      Daily Mock alerts, exam cutoffs, typing updates & promo codes
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700 }}>Join →</span>
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
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    color: '#0f172a'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0
                    }}
                  >
                    👥
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#047857' }}>
                      Aspirants Discussion Group
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.25 }}>
                      Ask keyboard questions, doubts & share practice scores
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>Chat →</span>
                </a>

                {/* Option 3: Direct Admin Telegram */}
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    textDecoration: 'none',
                    color: '#0f172a'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#8b5cf6',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0
                    }}
                  >
                    💬
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#6d28d9' }}>
                      1-on-1 Direct Admin Chat
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.25 }}>
                      Chat directly with Admin (@purendare) on Telegram app
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 700 }}>Chat →</span>
                </a>

                {/* Pro Plan callout */}
                {onOpenPayment && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginTop: 'auto'
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', color: '#92400e', lineHeight: 1.25 }}>
                      <span style={{ fontWeight: 700 }}>Pro Pass Activation:</span> Need quick unlock? Pay via QR & send UTR.
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
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.74rem',
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

            {/* Card Footer */}
            <div
              style={{
                background: '#f8fafc',
                padding: '8px 16px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: '#64748b'
              }}
            >
              <span>Powered by Firestore & Telegram</span>
              <span style={{ fontWeight: 700, color: '#0284c7' }}>Verified Desk ✓</span>
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '28px',
            padding: '10px 18px',
            boxShadow: '0 6px 20px rgba(2, 132, 199, 0.38)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            fontWeight: 800,
            transition: 'transform 0.15s ease',
            position: 'relative'
          }}
          title="Open Live Chat & Support Desk"
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
              background: '#4ade80',
              boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.4)'
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
