import React, { useState } from 'react';
import { TelegramConfig } from '../services/telegramService';

interface TelegramSupportWidgetProps {
  config: TelegramConfig | null;
  onOpenPayment?: () => void;
}

export const TelegramSupportWidget: React.FC<TelegramSupportWidgetProps> = ({
  config,
  onOpenPayment
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const channelUrl = config?.communityChannelUrl || 'https://t.me/Exam_Typing_Mentor';
  const groupUrl = config?.discussionGroupUrl || 'https://t.me/+Lw-tPbRqO0c2ZTA1';
  const rawSupport = config?.supportUsername || 'purendare';
  const supportUrl = rawSupport.startsWith('http')
    ? rawSupport
    : `https://t.me/${rawSupport.replace(/^@/, '')}`;

  return (
    <>
      {/* Floating Trigger Button */}
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
        {/* Expanded Fintech-style Help & Support Card */}
        {isOpen && (
          <div
            style={{
              width: '340px',
              maxWidth: 'calc(100vw - 32px)',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 12px 36px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              overflow: 'hidden',
              animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                padding: '16px 18px',
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
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>
                    Typing Mentor Support Hub
                  </h4>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      opacity: 0.9,
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
                    Official Telegram Ecosystem & Helpdesk
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

            {/* Body Hub Options */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  color: '#0f172a',
                  transition: 'background 0.15s ease'
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
                    Daily Mock test alerts, exam cutoffs, updates & promo codes
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
                  color: '#0f172a',
                  transition: 'background 0.15s ease'
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

              {/* Option 3: 1-on-1 Help & Support */}
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
                  color: '#0f172a',
                  transition: 'background 0.15s ease'
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
                    Chat directly with Admin (@purendare) for instant payment UTR & activation help
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 700 }}>Chat →</span>
              </a>

              {/* Payment Help Footer Callout */}
              {onOpenPayment && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: '#92400e', lineHeight: 1.25 }}>
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
                      padding: '4px 8px',
                      fontSize: '0.72rem',
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
              <span>Powered by Telegram Cloud</span>
              <span style={{ fontWeight: 700, color: '#0284c7' }}>Verified Community ✓</span>
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
            transition: 'transform 0.15s ease'
          }}
          title="Open Telegram Community, Channel & Helpdesk"
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
        </button>
      </div>
    </>
  );
};
