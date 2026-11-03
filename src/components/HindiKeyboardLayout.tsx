import React, { useState, useEffect } from 'react';
import {
  MANGAL_INSCRIPT_KEYS,
  KRUTI_DEV_KEYS,
  OFFICIAL_ALT_CODES,
  KeyMapping,
  AltCodeItem
} from '../utils/hindiEngine';

interface HindiKeyboardLayoutProps {
  layout?: 'mangal' | 'kruti';
  onInsertChar?: (char: string) => void;
  isCompact?: boolean;
  onClose?: () => void;
}

// Keyboard rows definition
const KEYBOARD_ROWS = [
  // Row 0
  [
    { code: 'Backquote', width: '1fr', devanagariDigit: '' },
    { code: 'Digit1', width: '1fr', devanagariDigit: '१' },
    { code: 'Digit2', width: '1fr', devanagariDigit: '२' },
    { code: 'Digit3', width: '1fr', devanagariDigit: '३' },
    { code: 'Digit4', width: '1fr', devanagariDigit: '४' },
    { code: 'Digit5', width: '1fr', devanagariDigit: '५' },
    { code: 'Digit6', width: '1fr', devanagariDigit: '६' },
    { code: 'Digit7', width: '1fr', devanagariDigit: '७' },
    { code: 'Digit8', width: '1fr', devanagariDigit: '८' },
    { code: 'Digit9', width: '1fr', devanagariDigit: '९' },
    { code: 'Digit0', width: '1fr', devanagariDigit: '०' },
    { code: 'Minus', width: '1fr', devanagariDigit: '' },
    { code: 'Equal', width: '1fr', devanagariDigit: '' },
    { code: 'Backspace', width: '1.6fr', label: 'Back', isSpecial: true }
  ],
  // Row 1
  [
    { code: 'Tab', width: '1.5fr', label: 'Tab', isSpecial: true },
    { code: 'KeyQ', width: '1fr' },
    { code: 'KeyW', width: '1fr' },
    { code: 'KeyE', width: '1fr' },
    { code: 'KeyR', width: '1fr' },
    { code: 'KeyT', width: '1fr' },
    { code: 'KeyY', width: '1fr' },
    { code: 'KeyU', width: '1fr' },
    { code: 'KeyI', width: '1fr' },
    { code: 'KeyO', width: '1fr' },
    { code: 'KeyP', width: '1fr' },
    { code: 'BracketLeft', width: '1fr' },
    { code: 'BracketRight', width: '1fr' },
    { code: 'Backslash', width: '1fr' }
  ],
  // Row 2
  [
    { code: 'CapsLock', width: '1.75fr', label: 'Caps', isSpecial: true },
    { code: 'KeyA', width: '1fr' },
    { code: 'KeyS', width: '1fr' },
    { code: 'KeyD', width: '1fr' },
    { code: 'KeyF', width: '1fr' },
    { code: 'KeyG', width: '1fr' },
    { code: 'KeyH', width: '1fr' },
    { code: 'KeyJ', width: '1fr' },
    { code: 'KeyK', width: '1fr' },
    { code: 'KeyL', width: '1fr' },
    { code: 'Semicolon', width: '1fr' },
    { code: 'Quote', width: '1fr' },
    { code: 'Enter', width: '1.8fr', label: 'Enter', isSpecial: true }
  ],
  // Row 3
  [
    { code: 'ShiftLeft', width: '2.2fr', label: 'Shift', isSpecial: true },
    { code: 'KeyZ', width: '1fr' },
    { code: 'KeyX', width: '1fr' },
    { code: 'KeyC', width: '1fr' },
    { code: 'KeyV', width: '1fr' },
    { code: 'KeyB', width: '1fr' },
    { code: 'KeyN', width: '1fr' },
    { code: 'KeyM', width: '1fr' },
    { code: 'Comma', width: '1fr' },
    { code: 'Period', width: '1fr' },
    { code: 'Slash', width: '1fr' },
    { code: 'ShiftRight', width: '2.4fr', label: 'Shift', isSpecial: true }
  ],
  // Row 4
  [
    { code: 'ControlLeft', width: '1.4fr', label: 'Ctrl', isSpecial: true },
    { code: 'AltLeft', width: '1.4fr', label: 'Alt', isSpecial: true },
    { code: 'Space', width: '6.5fr', label: 'Inscript Keyboard Layout (Space)', isSpecial: false },
    { code: 'AltRight', width: '1.4fr', label: 'Alt', isSpecial: true },
    { code: 'ControlRight', width: '1.4fr', label: 'Ctrl', isSpecial: true }
  ]
];

// Finger colors matching the user's diagram
const FINGER_COLORS: Record<string, { bg: string; border: string }> = {
  'left-pinky':   { bg: '#f3e8ff', border: '#d8b4fe' }, // Purple
  'left-ring':    { bg: '#e0f2fe', border: '#7dd3fc' }, // Sky
  'left-middle':  { bg: '#fef9c3', border: '#fde047' }, // Yellow
  'left-index':   { bg: '#dcfce7', border: '#86efac' }, // Green
  'right-index':  { bg: '#dcfce7', border: '#86efac' }, // Green
  'right-middle': { bg: '#fef9c3', border: '#fde047' }, // Yellow
  'right-ring':   { bg: '#e0f2fe', border: '#7dd3fc' }, // Sky
  'right-pinky':  { bg: '#f3e8ff', border: '#d8b4fe' }, // Purple
  'thumb':        { bg: '#f8fafc', border: '#cbd5e1' }
};

export const HindiKeyboardLayout: React.FC<HindiKeyboardLayoutProps> = ({
  layout = 'mangal',
  onInsertChar,
  isCompact = false,
  onClose
}) => {
  const [activeLayout, setActiveLayout] = useState<'mangal' | 'kruti'>(layout);
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  const [showAltCodes, setShowAltCodes] = useState<boolean>(false);
  const [altSearch, setAltSearch] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const currentKeyMap = activeLayout === 'mangal' ? MANGAL_INSCRIPT_KEYS : KRUTI_DEV_KEYS;

  // Track physical key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setActiveKeyCode(e.code);
      if (e.shiftKey) {
        setIsShiftActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeyCode(null);
      if (!e.shiftKey) {
        setIsShiftActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleKeyClick = (keyData: KeyMapping, code: string) => {
    let charToInsert: string;
    if (activeLayout === 'kruti') {
      charToInsert = isShiftActive ? keyData.enShift : keyData.enNormal;
    } else {
      charToInsert = isShiftActive ? keyData.shift : keyData.normal;
    }
    if (onInsertChar) {
      onInsertChar(charToInsert);
    }
    setActiveKeyCode(code);
    setTimeout(() => setActiveKeyCode(null), 150);
  };

  const handleCopyAltCode = (item: AltCodeItem) => {
    try {
      navigator.clipboard.writeText(item.char);
      setCopiedCode(item.code);
      setTimeout(() => setCopiedCode(null), 1500);
      if (onInsertChar) {
        onInsertChar(item.char);
      }
    } catch {
      // Fallback
    }
  };

  const filteredAltCodes = OFFICIAL_ALT_CODES.filter((item) => {
    if (!altSearch.trim()) return true;
    const q = altSearch.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.char.includes(q) ||
      item.name.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        background: '#ffffff',
        border: '2px solid #0284c7',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: isCompact ? '8px 12px' : '14px 18px',
        width: '100%',
        maxWidth: '1020px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        userSelect: 'none'
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '10px',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>⌨️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: isCompact ? '0.95rem' : '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {activeLayout === 'mangal' ? 'Mangal Font Inscript Keyboard Layout' : 'Kruti Dev 010 (Remington) Keyboard Layout'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeKeyCode ? '#22c55e' : '#94a3b8'
                }}
              />
              <span>
                {activeKeyCode
                  ? `Active Key: ${activeKeyCode} (${isShiftActive ? 'Shift' : 'Normal'})`
                  : 'Type on your physical English keyboard to highlight keys live'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Shift Toggle */}
          <button
            type="button"
            onClick={() => setIsShiftActive(!isShiftActive)}
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: isShiftActive ? '#2563eb' : '#cbd5e1',
              background: isShiftActive ? '#dbeafe' : '#f8fafc',
              color: isShiftActive ? '#1e40af' : '#475569',
              cursor: 'pointer'
            }}
          >
            Shift: {isShiftActive ? 'ON' : 'OFF'}
          </button>

          {/* Layout Switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setActiveLayout('mangal')}
              style={{
                border: 'none',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '4px',
                cursor: 'pointer',
                background: activeLayout === 'mangal' ? '#0284c7' : 'transparent',
                color: activeLayout === 'mangal' ? '#ffffff' : '#475569'
              }}
            >
              Mangal Inscript
            </button>
            <button
              type="button"
              onClick={() => setActiveLayout('kruti')}
              style={{
                border: 'none',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '4px',
                cursor: 'pointer',
                background: activeLayout === 'kruti' ? '#0284c7' : 'transparent',
                color: activeLayout === 'kruti' ? '#ffffff' : '#475569'
              }}
            >
              Kruti Dev 010
            </button>
          </div>

          {/* Alt Codes Toggle */}
          <button
            type="button"
            onClick={() => setShowAltCodes(!showAltCodes)}
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #f59e0b',
              background: showAltCodes ? '#fef3c7' : '#fffbeb',
              color: '#b45309',
              cursor: 'pointer'
            }}
          >
            📋 {showAltCodes ? 'Hide Alt Codes' : 'Alt Codes Table'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontWeight: 800
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Keyboard Grid */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          background: '#0f172a',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
        }}
      >
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: 'flex',
              gap: '4px',
              width: '100%'
            }}
          >
            {row.map((keyDef) => {
              const keyData = currentKeyMap[keyDef.code];
              const isPressed = activeKeyCode === keyDef.code;
              const fingerColor = keyData
                ? FINGER_COLORS[keyData.finger] || FINGER_COLORS['thumb']
                : { bg: '#e2e8f0', border: '#cbd5e1' };

              if (keyDef.isSpecial || !keyData) {
                // Special keys (Tab, Caps, Shift, Back, Enter, Ctrl, Alt)
                const isSpecialShift =
                  (keyDef.code === 'ShiftLeft' || keyDef.code === 'ShiftRight') && isShiftActive;
                return (
                  <div
                    key={keyDef.code}
                    style={{
                      flex: keyDef.width,
                      height: isCompact ? '38px' : '46px',
                      background: isPressed || isSpecialShift ? '#93c5fd' : '#e2e8f0',
                      border: '1px solid #94a3b8',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      boxShadow: isPressed ? 'none' : '0 2px 0 #94a3b8',
                      transform: isPressed ? 'translateY(2px)' : 'none',
                      transition: 'all 0.08s ease'
                    }}
                  >
                    {keyDef.label || keyDef.code}
                  </div>
                );
              }

              // Normal character keys
              return (
                <div
                  key={keyDef.code}
                  onClick={() => handleKeyClick(keyData, keyDef.code)}
                  style={{
                    flex: keyDef.width,
                    height: isCompact ? '38px' : '46px',
                    background: isPressed ? '#bfdbfe' : fingerColor.bg,
                    border: `1px solid ${isPressed ? '#2563eb' : fingerColor.border}`,
                    borderRadius: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '2px 4px',
                    cursor: 'pointer',
                    boxShadow: isPressed ? 'none' : '0 2px 0 #94a3b8',
                    transform: isPressed ? 'translateY(2px)' : 'none',
                    transition: 'all 0.06s ease',
                    position: 'relative'
                  }}
                  title={`English: ${keyData.enNormal} / ${keyData.enShift}\nHindi Normal: ${keyData.normal}\nHindi Shift: ${keyData.shift}`}
                >
                  {/* Top Row inside Key: English letter (Left) + Shift Hindi Char (Right) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      lineHeight: 1
                    }}
                  >
                    <span
                      style={{
                        fontSize: isCompact ? '0.62rem' : '0.72rem',
                        fontWeight: 700,
                        color: '#64748b'
                      }}
                    >
                      {keyData.enNormal}
                    </span>
                    <span
                      style={{
                        fontSize: isCompact ? '0.8rem' : '0.98rem',
                        fontWeight: isShiftActive ? 800 : 700,
                        color: isShiftActive ? '#dc2626' : '#0369a1',
                        backgroundColor: isShiftActive ? '#fef08a' : 'transparent',
                        borderRadius: '2px',
                        padding: '0 1px'
                      }}
                    >
                      {keyData.shift}
                    </span>
                  </div>

                  {/* Bottom Row inside Key: Devanagari Digit (Left if any) + Normal Hindi Char (Right) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: keyDef.devanagariDigit ? 'space-between' : 'flex-end',
                      alignItems: 'flex-end',
                      lineHeight: 1
                    }}
                  >
                    {keyDef.devanagariDigit && (
                      <span
                        style={{
                          fontSize: isCompact ? '0.65rem' : '0.75rem',
                          color: '#64748b',
                          fontWeight: 600
                        }}
                      >
                        {keyDef.devanagariDigit}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: isCompact ? '0.85rem' : '1.05rem',
                        fontWeight: !isShiftActive ? 800 : 600,
                        color: !isShiftActive ? '#0f172a' : '#475569'
                      }}
                    >
                      {keyData.normal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 3. Spacebar Note & Finger Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '10px',
          fontSize: '0.76rem',
          color: '#475569'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>Finger Guide:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '2px' }} />
            Pinky (कनिष्ठिका)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '2px' }} />
            Ring (अनामिका)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '2px' }} />
            Middle (मध्यमा)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '2px' }} />
            Index (तर्जनी)
          </span>
        </div>

        <div style={{ fontWeight: 600, color: '#0369a1' }}>
          💡 Halant Rule: Press <strong>D</strong> (्) between consonants to create half-letters (e.g., क + D + ष = क्ष)
        </div>
      </div>

      {/* 4. Alt Codes Drawer (From User's Image Table) */}
      {showAltCodes && (
        <div
          style={{
            marginTop: '12px',
            borderTop: '2px solid #e2e8f0',
            paddingTop: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#b45309' }}>
                Official Alt Codes Reference Table (Alt + Numpad)
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Hold Left Alt and type numbers on Numpad, or click any card to copy/insert.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search Alt code, symbol or name..."
              value={altSearch}
              onChange={(e) => setAltSearch(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                outline: 'none',
                width: '240px'
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
              gap: '6px',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px'
            }}
          >
            {filteredAltCodes.map((item) => {
              const isCopied = copiedCode === item.code;
              return (
                <div
                  key={item.code}
                  onClick={() => handleCopyAltCode(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: isCopied ? '#dcfce7' : '#f8fafc',
                    border: `1px solid ${isCopied ? '#16a34a' : '#e2e8f0'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    transition: 'all 0.1s ease'
                  }}
                  title={`${item.name} - Click to copy/insert`}
                >
                  <span style={{ fontWeight: 700, color: '#334155' }}>{item.code}</span>
                  <span
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: isCopied ? '#15803d' : '#0284c7',
                      background: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {isCopied ? '✓' : item.char}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
