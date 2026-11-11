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

interface KeyDef {
  code: string;
  weight: number;
  label?: string;
  isSpecial?: boolean;
  devanagariDigit?: string;
}

// Keyboard rows definition with proportional flex weights
const KEYBOARD_ROWS: KeyDef[][] = [
  // Row 0 (Total weight: ~14.6)
  [
    { code: 'Backquote', weight: 1, devanagariDigit: '' },
    { code: 'Digit1', weight: 1, devanagariDigit: '१' },
    { code: 'Digit2', weight: 1, devanagariDigit: '२' },
    { code: 'Digit3', weight: 1, devanagariDigit: '३' },
    { code: 'Digit4', weight: 1, devanagariDigit: '४' },
    { code: 'Digit5', weight: 1, devanagariDigit: '५' },
    { code: 'Digit6', weight: 1, devanagariDigit: '६' },
    { code: 'Digit7', weight: 1, devanagariDigit: '७' },
    { code: 'Digit8', weight: 1, devanagariDigit: '८' },
    { code: 'Digit9', weight: 1, devanagariDigit: '९' },
    { code: 'Digit0', weight: 1, devanagariDigit: '०' },
    { code: 'Minus', weight: 1, devanagariDigit: '' },
    { code: 'Equal', weight: 1, devanagariDigit: '' },
    { code: 'Backspace', weight: 1.6, label: 'Backspace', isSpecial: true }
  ],
  // Row 1 (Total weight: ~14.5)
  [
    { code: 'Tab', weight: 1.5, label: 'Tab', isSpecial: true },
    { code: 'KeyQ', weight: 1 },
    { code: 'KeyW', weight: 1 },
    { code: 'KeyE', weight: 1 },
    { code: 'KeyR', weight: 1 },
    { code: 'KeyT', weight: 1 },
    { code: 'KeyY', weight: 1 },
    { code: 'KeyU', weight: 1 },
    { code: 'KeyI', weight: 1 },
    { code: 'KeyO', weight: 1 },
    { code: 'KeyP', weight: 1 },
    { code: 'BracketLeft', weight: 1 },
    { code: 'BracketRight', weight: 1 },
    { code: 'Backslash', weight: 1 }
  ],
  // Row 2 (Total weight: ~14.55)
  [
    { code: 'CapsLock', weight: 1.75, label: 'Caps Lock', isSpecial: true },
    { code: 'KeyA', weight: 1 },
    { code: 'KeyS', weight: 1 },
    { code: 'KeyD', weight: 1 },
    { code: 'KeyF', weight: 1 },
    { code: 'KeyG', weight: 1 },
    { code: 'KeyH', weight: 1 },
    { code: 'KeyJ', weight: 1 },
    { code: 'KeyK', weight: 1 },
    { code: 'KeyL', weight: 1 },
    { code: 'Semicolon', weight: 1 },
    { code: 'Quote', weight: 1 },
    { code: 'Enter', weight: 1.8, label: 'Enter ↵', isSpecial: true }
  ],
  // Row 3 (Total weight: ~14.6)
  [
    { code: 'ShiftLeft', weight: 2.2, label: 'Shift ⇧', isSpecial: true },
    { code: 'KeyZ', weight: 1 },
    { code: 'KeyX', weight: 1 },
    { code: 'KeyC', weight: 1 },
    { code: 'KeyV', weight: 1 },
    { code: 'KeyB', weight: 1 },
    { code: 'KeyN', weight: 1 },
    { code: 'KeyM', weight: 1 },
    { code: 'Comma', weight: 1 },
    { code: 'Period', weight: 1 },
    { code: 'Slash', weight: 1 },
    { code: 'ShiftRight', weight: 2.4, label: 'Shift ⇧', isSpecial: true }
  ],
  // Row 4 (Total weight: ~14.5)
  [
    { code: 'ControlLeft', weight: 1.5, label: 'Ctrl', isSpecial: true },
    { code: 'AltLeft', weight: 1.5, label: 'Alt', isSpecial: true },
    { code: 'Space', weight: 8.5, label: 'Space Bar', isSpecial: false },
    { code: 'AltRight', weight: 1.5, label: 'Alt', isSpecial: true },
    { code: 'ControlRight', weight: 1.5, label: 'Ctrl', isSpecial: true }
  ]
];

// Finger colors matching the user's diagram
const FINGER_COLORS: Record<string, { bg: string; border: string }> = {
  'left-pinky':   { bg: 'var(--bg-purple-100)', border: 'var(--bd-purple-300)' }, // Purple
  'left-ring':    { bg: 'var(--bg-sky-100)', border: 'var(--bd-sky-300)' }, // Sky
  'left-middle':  { bg: 'var(--bg-yellow-100)', border: 'var(--bd-yellow-300)' }, // Yellow
  'left-index':   { bg: 'var(--bg-green-100)', border: 'var(--bd-green-300)' }, // Green
  'right-index':  { bg: 'var(--bg-green-100)', border: 'var(--bd-green-300)' }, // Green
  'right-middle': { bg: 'var(--bg-yellow-100)', border: 'var(--bd-yellow-300)' }, // Yellow
  'right-ring':   { bg: 'var(--bg-sky-100)', border: 'var(--bd-sky-300)' }, // Sky
  'right-pinky':  { bg: 'var(--bg-purple-100)', border: 'var(--bd-purple-300)' }, // Purple
  'thumb':        { bg: 'var(--bg-slate-50)', border: 'var(--bd-slate-300)' }
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
        background: 'var(--surface)',
        border: '2px solid var(--tw-sky-600)',
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
          borderBottom: '2px solid var(--bd-slate-200)',
          paddingBottom: '10px',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>⌨️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: isCompact ? '0.95rem' : '1.15rem', fontWeight: 800, color: 'var(--fg-slate-900)' }}>
              {activeLayout === 'mangal' ? 'Mangal Font Inscript Keyboard Layout' : 'Kruti Dev 010 (Remington) Keyboard Layout'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeKeyCode ? 'var(--tw-green-500)' : 'var(--tw-slate-400)'
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
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: isShiftActive ? 'var(--tw-blue-600)' : 'var(--bd-slate-300)',
              background: isShiftActive ? 'var(--bg-blue-100)' : 'var(--bg-slate-50)',
              color: isShiftActive ? 'var(--fg-blue-800)' : 'var(--fg-slate-600)',
              cursor: 'pointer'
            }}
          >
            Shift: {isShiftActive ? 'ON' : 'OFF'}
          </button>

          {/* Layout Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-slate-100)', borderRadius: '6px', padding: '2px' }}>
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
                background: activeLayout === 'mangal' ? 'var(--tw-sky-600)' : 'transparent',
                color: activeLayout === 'mangal' ? '#ffffff' : 'var(--fg-slate-600)'
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
                background: activeLayout === 'kruti' ? 'var(--tw-sky-600)' : 'transparent',
                color: activeLayout === 'kruti' ? '#ffffff' : 'var(--fg-slate-600)'
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
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid var(--tw-amber-500)',
              background: showAltCodes ? 'var(--bg-amber-100)' : 'var(--bg-amber-50)',
              color: 'var(--fg-amber-700)',
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
                background: 'var(--bg-slate-100)',
                border: 'none',
                color: 'var(--fg-slate-500)',
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
          background: 'var(--tw-slate-900)',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          overflowX: 'auto'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', minWidth: '650px' }}>
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
                : { bg: 'var(--bg-slate-200)', border: 'var(--bd-slate-300)' };

              if (keyDef.isSpecial || !keyData) {
                // Special keys (Tab, Caps, Shift, Back, Enter, Ctrl, Alt)
                const isSpecialShift =
                  (keyDef.code === 'ShiftLeft' || keyDef.code === 'ShiftRight') && isShiftActive;
                return (
                  <div
                    key={keyDef.code}
                    style={{
                      flex: `${keyDef.weight} 1 0%`,
                      minWidth: 0,
                      boxSizing: 'border-box',
                      height: isCompact ? '40px' : '48px',
                      background: isPressed || isSpecialShift ? 'var(--bg-blue-300)' : 'var(--bg-slate-200)',
                      border: isPressed || isSpecialShift ? '1.5px solid var(--tw-blue-600)' : '1px solid var(--bd-slate-400)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isCompact ? '0.72rem' : '0.8rem',
                      fontWeight: 700,
                      color: isPressed || isSpecialShift ? 'var(--fg-blue-900)' : 'var(--fg-slate-800)',
                      boxShadow: isPressed ? 'none' : '0 2px 0 #94a3b8',
                      transform: isPressed ? 'translateY(2px)' : 'none',
                      transition: 'all 0.08s ease',
                      userSelect: 'none'
                    }}
                  >
                    {keyDef.label || keyDef.code}
                  </div>
                );
              }

              // Space Bar
              if (keyDef.code === 'Space') {
                return (
                  <div
                    key={keyDef.code}
                    onClick={() => handleKeyClick(keyData, keyDef.code)}
                    style={{
                      flex: `${keyDef.weight} 1 0%`,
                      minWidth: 0,
                      boxSizing: 'border-box',
                      height: isCompact ? '40px' : '48px',
                      background: isPressed ? 'var(--bg-blue-200)' : 'var(--bg-slate-50)',
                      border: `1.5px solid ${isPressed ? 'var(--tw-blue-600)' : 'var(--bd-slate-300)'}`,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isPressed ? 'none' : '0 2px 0 #94a3b8',
                      transform: isPressed ? 'translateY(2px)' : 'none',
                      transition: 'all 0.06s ease',
                      fontSize: isCompact ? '0.72rem' : '0.82rem',
                      fontWeight: 700,
                      color: 'var(--fg-slate-600)',
                      letterSpacing: '0.04em',
                      userSelect: 'none'
                    }}
                    title="Space Bar"
                  >
                    {activeLayout === 'mangal' ? 'Mangal Inscript Space Bar' : 'Kruti Dev 010 Space Bar'}
                  </div>
                );
              }

              // Normal character keys
              return (
                <div
                  key={keyDef.code}
                  onClick={() => handleKeyClick(keyData, keyDef.code)}
                  style={{
                    flex: `${keyDef.weight} 1 0%`,
                    minWidth: 0,
                    boxSizing: 'border-box',
                    height: isCompact ? '40px' : '48px',
                    background: isPressed ? 'var(--bg-blue-200)' : fingerColor.bg,
                    border: `1.5px solid ${isPressed ? 'var(--tw-blue-600)' : fingerColor.border}`,
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '3px 5px',
                    cursor: 'pointer',
                    boxShadow: isPressed ? 'none' : '0 2px 0 #94a3b8',
                    transform: isPressed ? 'translateY(2px)' : 'none',
                    transition: 'all 0.06s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    userSelect: 'none'
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
                        color: 'var(--fg-slate-500)'
                      }}
                    >
                      {keyData.enNormal}
                    </span>
                    <span
                      style={{
                        fontSize: isCompact ? '0.82rem' : '0.98rem',
                        fontWeight: isShiftActive ? 800 : 700,
                        color: isShiftActive ? 'var(--fg-red-600)' : 'var(--fg-sky-700)',
                        backgroundColor: isShiftActive ? 'var(--bg-yellow-200)' : 'transparent',
                        borderRadius: '2px',
                        padding: '0 2px'
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
                          color: 'var(--fg-slate-500)',
                          fontWeight: 600
                        }}
                      >
                        {keyDef.devanagariDigit}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: isCompact ? '0.88rem' : '1.08rem',
                        fontWeight: !isShiftActive ? 800 : 600,
                        color: !isShiftActive ? 'var(--fg-slate-900)' : 'var(--fg-slate-500)'
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
          fontSize: '0.75rem',
          color: 'var(--fg-slate-600)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>Finger Guide:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--bg-purple-100)', border: '1px solid var(--bd-purple-300)', borderRadius: '2px' }} />
            Pinky (कनिष्ठिका)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--bg-sky-100)', border: '1px solid var(--bd-sky-300)', borderRadius: '2px' }} />
            Ring (अनामिका)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--bg-yellow-100)', border: '1px solid var(--bd-yellow-300)', borderRadius: '2px' }} />
            Middle (मध्यमा)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--bg-green-100)', border: '1px solid var(--bd-green-300)', borderRadius: '2px' }} />
            Index (तर्जनी)
          </span>
        </div>

        <div style={{ fontWeight: 600, color: 'var(--fg-sky-700)' }}>
          💡 Halant Rule: Press <strong>D</strong> (्) between consonants to create half-letters (e.g., क + D + ष = क्ष)
        </div>
      </div>

      {/* 4. Alt Codes Drawer (From User's Image Table) */}
      {showAltCodes && (
        <div
          style={{
            marginTop: '12px',
            borderTop: '2px solid var(--bd-slate-200)',
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
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--fg-amber-700)' }}>
                Official Alt Codes Reference Table (Alt + Numpad)
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
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
                border: '1px solid var(--bd-slate-300)',
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
                    background: isCopied ? 'var(--bg-green-100)' : 'var(--bg-slate-50)',
                    border: `1px solid ${isCopied ? 'var(--tw-green-600)' : 'var(--bd-slate-200)'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.1s ease'
                  }}
                  title={`${item.name} - Click to copy/insert`}
                >
                  <span style={{ fontWeight: 700, color: 'var(--fg-slate-700)' }}>{item.code}</span>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: isCopied ? 'var(--fg-green-700)' : 'var(--fg-sky-600)',
                      background: 'var(--surface)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      border: '1px solid var(--bd-slate-300)'
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
