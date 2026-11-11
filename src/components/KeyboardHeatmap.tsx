import React, { useMemo, useState } from 'react';
import { EvaluationResult, WeakKeyStat } from '../types';

interface KeyboardHeatmapProps {
  attempts: EvaluationResult[];
  onPracticeWords?: (words: string[]) => void;
}

interface KeyMistakeInfo {
  key: string;
  count: number;
  hindiChars?: string[];
  finger?: string;
  keyCombo?: string;
}

const DIGIT_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const ROW_1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW_2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ROW_3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

export const KeyboardHeatmap: React.FC<KeyboardHeatmapProps> = ({
  attempts,
  onPracticeWords
}) => {
  const [selectedKey, setSelectedKey] = useState<KeyMistakeInfo | null>(null);

  // Aggregate mistakes across all historical attempts
  const { keyMap, weakCharsList, totalErrorsAnalyzed } = useMemo(() => {
    const errorMap = new Map<string, KeyMistakeInfo>();
    const charMap = new Map<string, { count: number; finger?: string; keyCombo?: string }>();
    let totalErrors = 0;

    for (const attempt of attempts) {
      // 1. Weak keys from evaluator
      if (attempt.weakKeys && attempt.weakKeys.length > 0) {
        for (const wk of attempt.weakKeys) {
          totalErrors += wk.mistakeCount;
          const char = wk.character;

          // Track character aggregate
          const existingChar = charMap.get(char) || { count: 0, finger: wk.fingerHint, keyCombo: wk.keyCombo };
          existingChar.count += wk.mistakeCount;
          if (wk.fingerHint) existingChar.finger = wk.fingerHint;
          if (wk.keyCombo) existingChar.keyCombo = wk.keyCombo;
          charMap.set(char, existingChar);

          // Map to physical QWERTY key
          let physicalKey = '';
          if (wk.keyCombo) {
            // E.g., 'Shift + K' -> 'k', 'd' -> 'd'
            const match = wk.keyCombo.match(/([a-zA-Z0-9])$/);
            if (match) physicalKey = match[1].toLowerCase();
          }
          if (!physicalKey && /^[a-zA-Z0-9]$/.test(char)) {
            physicalKey = char.toLowerCase();
          }

          if (physicalKey) {
            const cur = errorMap.get(physicalKey) || {
              key: physicalKey,
              count: 0,
              hindiChars: [],
              finger: wk.fingerHint,
              keyCombo: wk.keyCombo
            };
            cur.count += wk.mistakeCount;
            if (wk.fingerHint && !cur.finger) cur.finger = wk.fingerHint;
            if (char !== physicalKey && !cur.hindiChars?.includes(char)) {
              cur.hindiChars?.push(char);
            }
            errorMap.set(physicalKey, cur);
          }
        }
      } else if (attempt.wrongWordsList && attempt.wrongWordsList.length > 0) {
        // Fallback: estimate from wrong words
        for (const word of attempt.wrongWordsList) {
          for (const ch of word.slice(0, 10)) {
            const lower = ch.toLowerCase();
            if (/^[a-z0-9]$/.test(lower)) {
              totalErrors += 1;
              const cur = errorMap.get(lower) || { key: lower, count: 0 };
              cur.count += 1;
              errorMap.set(lower, cur);

              const existingChar = charMap.get(ch) || { count: 0 };
              existingChar.count += 1;
              charMap.set(ch, existingChar);
            }
          }
        }
      }
    }

    const weakChars = Array.from(charMap.entries())
      .map(([character, info]) => ({
        character,
        mistakeCount: info.count,
        fingerHint: info.finger,
        keyCombo: info.keyCombo
      }))
      .sort((a, b) => b.mistakeCount - a.mistakeCount)
      .slice(0, 10);

    return {
      keyMap: errorMap,
      weakCharsList: weakChars,
      totalErrorsAnalyzed: totalErrors
    };
  }, [attempts]);

  const maxMistakes = useMemo(() => {
    let max = 1;
    keyMap.forEach((v) => {
      if (v.count > max) max = v.count;
    });
    return max;
  }, [keyMap]);

  const getKeyBgColor = (key: string): string => {
    const info = keyMap.get(key);
    if (!info || info.count === 0) return 'var(--surface)';
    const ratio = info.count / maxMistakes;
    if (ratio > 0.75) return 'var(--tw-red-500)'; // Red (hot)
    if (ratio > 0.45) return 'var(--tw-orange-500)'; // Orange
    if (ratio > 0.2) return 'var(--tw-amber-400)';  // Yellow-amber
    return 'var(--bg-yellow-200)';                   // Light yellow
  };

  const getKeyTextColor = (key: string): string => {
    const info = keyMap.get(key);
    if (!info || info.count === 0) return 'var(--fg-slate-700)';
    const ratio = info.count / maxMistakes;
    return ratio > 0.45 ? '#ffffff' : 'var(--fg-slate-900)';
  };

  const renderKey = (k: string, width = '38px') => {
    const info = keyMap.get(k);
    const count = info?.count || 0;
    const isSelected = selectedKey?.key === k;

    return (
      <button
        key={k}
        type="button"
        onClick={() => setSelectedKey(info || { key: k, count: 0 })}
        title={`${k.toUpperCase()}: ${count} mistake${count === 1 ? '' : 's'}${info?.finger ? ` (${info.finger})` : ''}`}
        style={{
          width,
          height: '38px',
          borderRadius: '6px',
          border: isSelected ? '2px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
          background: getKeyBgColor(k),
          color: getKeyTextColor(k),
          fontWeight: 800,
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isSelected ? '0 0 0 2px #38bdf8' : '0 1px 2px rgba(0,0,0,0.06)',
          transition: 'all 0.15s ease',
          padding: 0
        }}
      >
        <span>{k.toUpperCase()}</span>
        {count > 0 && (
          <span style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1 }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  const handlePracticeWeak = () => {
    if (!onPracticeWords || weakCharsList.length === 0) return;
    const words = weakCharsList.map((w) => w.character);
    onPracticeWords(words);
  };

  return (
    <div>
      {/* Heatmap Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>⌨️</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--fg-slate-900)' }}>
              Keyboard Error Heatmap (गलतियों का नक्शा)
            </h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
              Red keys indicate high error frequency across your tests
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
          <span>Low</span>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--surface)', border: '1px solid var(--bd-slate-300)' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--bg-yellow-200)' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--tw-amber-400)' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--tw-orange-500)' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--tw-red-500)' }} />
          <span>High Mistakes</span>
        </div>
      </div>

      {/* Visual QWERTY Layout */}
      <div
        style={{
          background: 'var(--bg-slate-100)',
          padding: '16px 12px',
          borderRadius: '10px',
          border: '1px solid var(--bd-slate-200)',
          overflowX: 'auto',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '5px', minWidth: '460px', width: '100%', alignItems: 'center' }}>
          {/* Numbers Row */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {DIGIT_ROW.map((k) => renderKey(k, '36px'))}
          </div>

          {/* Row 1: QWERTY */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {ROW_1.map((k) => renderKey(k, '38px'))}
          </div>

          {/* Row 2: ASDF */}
          <div style={{ display: 'flex', gap: '4px', paddingLeft: '14px' }}>
            {ROW_2.map((k) => renderKey(k, '38px'))}
          </div>

          {/* Row 3: ZXCV */}
          <div style={{ display: 'flex', gap: '4px', paddingLeft: '28px' }}>
            {ROW_3.map((k) => renderKey(k, '38px'))}
          </div>

          {/* Space bar */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
            <div
              style={{
                width: '180px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid var(--bd-slate-300)',
                background: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: 'var(--tw-slate-400)',
                fontWeight: 700
              }}
            >
              SPACEBAR
            </div>
          </div>
        </div>
      </div>

      {/* Selected Key Details Banner */}
      {selectedKey && (
        <div
          style={{
            background: 'var(--bg-slate-50)',
            border: '1.5px solid var(--tw-sky-600)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: 'var(--tw-sky-600)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem'
              }}
            >
              {selectedKey.key.toUpperCase()}
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--fg-slate-900)' }}>
                Key <strong>{selectedKey.key.toUpperCase()}</strong>: {selectedKey.count} Recorded Mistake{selectedKey.count === 1 ? '' : 's'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                {selectedKey.finger && <span>Finger: <strong>{selectedKey.finger}</strong> &bull; </span>}
                {selectedKey.keyCombo && <span>Combo: <code>{selectedKey.keyCombo}</code> &bull; </span>}
                {selectedKey.hindiChars && selectedKey.hindiChars.length > 0 && (
                  <span>Associated Hindi: <strong>{selectedKey.hindiChars.join(', ')}</strong></span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedKey(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg-slate-500)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: '2px 6px'
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Weakest Characters Ranking */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--fg-slate-900)' }}>
            🎯 Top Focus Characters ({weakCharsList.length})
          </h5>
          {onPracticeWords && weakCharsList.length > 0 && (
            <button
              type="button"
              onClick={handlePracticeWeak}
              style={{
                background: 'linear-gradient(135deg, var(--tw-sky-600) 0%, var(--tw-sky-700) 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ Practice Drill ({weakCharsList.length} Keys)
            </button>
          )}
        </div>

        {weakCharsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--fg-slate-500)', fontSize: '0.8rem' }}>
            No character mistakes recorded yet. Keep taking mock tests!
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '8px'
            }}
          >
            {weakCharsList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-slate-50)',
                  border: '1px solid var(--bd-slate-200)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: idx < 3 ? 'var(--bg-red-100)' : 'var(--bg-slate-100)',
                    color: idx < 3 ? 'var(--fg-red-600)' : 'var(--fg-slate-900)',
                    fontWeight: 900,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {item.character}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--fg-slate-900)' }}>
                    {item.mistakeCount} error{item.mistakeCount === 1 ? '' : 's'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.fingerHint || item.keyCombo || 'Character'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
