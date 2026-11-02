import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Passage, TestSettings, EvaluationResult } from '../types';
import { translateToMangalInscript, translateToKrutiDev } from '../utils/hindiEngine';
import { audioEngine } from '../utils/audioEngine';
import { evaluateTypingTest } from '../utils/evaluator';

interface StartTestProps {
  passage: Passage;
  durationMinutes: number;
  settings: TestSettings;
  onFinishTest: (result: EvaluationResult) => void;
  onCancelTest: () => void;
}

export const StartTest: React.FC<StartTestProps> = ({
  passage,
  durationMinutes,
  settings,
  onFinishTest,
  onCancelTest
}) => {
  const totalSeconds = durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);
  const [isTestStarted, setIsTestStarted] = useState<boolean>(false);
  const [typedText, setTypedText] = useState<string>('');
  const [backspaceCount, setBackspaceCount] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(false);
  const [activeKeyPressed, setActiveKeyPressed] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passagePaneRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Split original passage into words
  const originalWords = useMemo(() => {
    return passage.text.trim().split(/\s+/).filter(Boolean);
  }, [passage.text]);

  const typedWords = useMemo(() => {
    return typedText.trim().split(/\s+/).filter(Boolean);
  }, [typedText]);

  // Current active word index
  const currentWordIndex = useMemo(() => {
    if (typedText.endsWith(' ')) {
      return typedWords.length;
    }
    return Math.max(0, typedWords.length - 1);
  }, [typedText, typedWords]);

  // Auto-scroll passage view to keep active word in view
  useEffect(() => {
    if (settings.autoScroll && activeWordRef.current && passagePaneRef.current) {
      const pane = passagePaneRef.current;
      const word = activeWordRef.current;
      const wordTop = word.offsetTop;
      const paneHeight = pane.clientHeight;
      if (wordTop > pane.scrollTop + paneHeight - 60 || wordTop < pane.scrollTop + 30) {
        pane.scrollTo({
          top: Math.max(0, wordTop - paneHeight / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [currentWordIndex, settings.autoScroll]);

  // Timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTestStarted && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
            handleCompleteSubmission();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTestStarted, secondsRemaining]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    audioEngine.setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Fullscreen support
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Submission handler
  const handleCompleteSubmission = () => {
    audioEngine.playCompletionBell();
    const timeTakenSeconds = totalSeconds - secondsRemaining;
    const result = evaluateTypingTest({
      testId: passage.id,
      testTitle: passage.title,
      language: passage.language,
      category: passage.category,
      originalText: passage.text,
      typedText,
      timeAllowedMinutes: durationMinutes,
      timeTakenSeconds: Math.max(1, timeTakenSeconds),
      backspaceCount
    });
    onFinishTest(result);
  };

  // Keystroke handler with Hindi transliteration & anti-cheat
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isTestStarted) {
      setIsTestStarted(true);
    }

    setActiveKeyPressed(e.key);
    setTimeout(() => setActiveKeyPressed(''), 120);

    // Play typewriter click
    audioEngine.playKeyClick();

    // Check Backspace restriction
    if (e.key === 'Backspace') {
      if (!settings.backspaceEnabled) {
        e.preventDefault();
        return;
      }
      setBackspaceCount((b) => b + 1);
      return;
    }

    // Ignore special control keys
    if (
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      e.key === 'Shift' ||
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown'
    ) {
      return;
    }

    // Handle spacebar
    if (e.key === ' ') {
      return;
    }

    // Virtual transliteration for Hindi layouts if physical key pressed is ASCII
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (passage.language === 'hindi_mangal') {
        const translatedChar = translateToMangalInscript(e.key, e.shiftKey);
        if (translatedChar !== e.key) {
          e.preventDefault();
          const target = e.currentTarget;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const newText = typedText.substring(0, start) + translatedChar + typedText.substring(end);
          setTypedText(newText);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + translatedChar.length;
          }, 0);
        }
      } else if (passage.language === 'hindi_kruti') {
        const translatedChar = translateToKrutiDev(e.key);
        if (translatedChar !== e.key) {
          e.preventDefault();
          const target = e.currentTarget;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const newText = typedText.substring(0, start) + translatedChar + typedText.substring(end);
          setTypedText(newText);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + translatedChar.length;
          }, 0);
        }
      }
    }
  };

  // Anti-cheat handlers
  const handlePrevent = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Live Gross WPM & Accuracy calculation
  const elapsedMinutes = Math.max(0.01, (totalSeconds - secondsRemaining) / 60);
  const liveGrossWpm = Math.round(((typedText.length / 5) / elapsedMinutes) * 10) / 10;

  let liveMatches = 0;
  for (let i = 0; i < typedWords.length; i++) {
    if (originalWords[i] === typedWords[i]) {
      liveMatches++;
    }
  }
  const liveAccuracy =
    typedWords.length > 0 ? Math.round((liveMatches / typedWords.length) * 100) : 100;

  return (
    <div className="container test-container">
      {/* Top Bar with Title, Timer & Controls */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-blue">
              {passage.language === 'hindi_mangal'
                ? 'Hindi Mangal Inscript'
                : passage.language === 'hindi_kruti'
                ? 'Hindi Kruti Dev'
                : 'English'}
            </span>
            <span className="badge badge-amber">Official {durationMinutes} Mins</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{passage.title}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
            className="btn btn-secondary btn-sm"
            title="Toggle On-Screen Keyboard"
          >
            ⌨️ {showVirtualKeyboard ? 'Hide Keyboard' : 'Show Keyboard'}
          </button>
          <button onClick={toggleFullScreen} className="btn btn-secondary btn-sm" title="Toggle Fullscreen">
            ⛶ Fullscreen
          </button>
          <button onClick={() => setShowSubmitModal(true)} className="btn btn-danger btn-sm">
            Submit Test
          </button>
        </div>
      </div>

      {/* Real-time KPI Stats Ribbon */}
      <div className="test-top-stats">
        <div className="stat-chip">
          <span className="stat-chip-label">Time Remaining</span>
          <span className={`stat-chip-val time ${secondsRemaining < 60 ? 'warning' : ''}`}>
            {formatTime(secondsRemaining)}
          </span>
        </div>

        <div className="stat-chip">
          <span className="stat-chip-label">Gross Speed</span>
          <span className="stat-chip-val">{liveGrossWpm} <small style={{ fontSize: '0.75rem' }}>WPM</small></span>
        </div>

        <div className="stat-chip">
          <span className="stat-chip-label">Accuracy</span>
          <span className="stat-chip-val" style={{ color: liveAccuracy >= 85 ? '#16a34a' : '#dc2626' }}>
            {liveAccuracy}%
          </span>
        </div>

        <div className="stat-chip">
          <span className="stat-chip-label">Keystrokes</span>
          <span className="stat-chip-val">{typedText.length}</span>
        </div>

        <div className="stat-chip">
          <span className="stat-chip-label">Backspaces</span>
          <span className="stat-chip-val">{backspaceCount}</span>
        </div>
      </div>

      {/* Test Passage Viewer */}
      <div
        ref={passagePaneRef}
        className="passage-pane"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        {originalWords.map((word, idx) => {
          const isCurrent = idx === currentWordIndex;
          const isCompleted = idx < currentWordIndex;
          const isCorrect = isCompleted && typedWords[idx] === word;
          const isWrong = isCompleted && typedWords[idx] !== word;

          return (
            <span
              key={idx}
              ref={isCurrent ? activeWordRef : null}
              className={`passage-word ${
                isCurrent && settings.highlightEnabled
                  ? 'active'
                  : isCorrect
                  ? 'completed-correct'
                  : isWrong
                  ? 'completed-wrong'
                  : ''
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Candidate Typing Input Textarea */}
      <div>
        <textarea
          ref={textareaRef}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onKeyDown={handleKeyDown}
          onCopy={handlePrevent}
          onPaste={handlePrevent}
          onCut={handlePrevent}
          onContextMenu={handlePrevent}
          onDrop={handlePrevent}
          placeholder="Start typing the passage above... (Timer begins automatically upon typing)"
          className="typing-textarea"
          style={{ fontSize: `${settings.fontSize}px` }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>🔒 Anti-Cheat Active: Copy, Paste & Context-Menu disabled</span>
          <span>{passage.language.startsWith('hindi') ? '✨ Inscript / Kruti Transliteration Active' : 'English QWERTY'}</span>
        </div>
      </div>

      {/* On-Screen Keyboard */}
      {showVirtualKeyboard && (
        <div className="keyboard-layout">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textAlign: 'center', marginBottom: '4px' }}>
            {passage.language === 'hindi_mangal'
              ? 'Mangal Inscript Layout (Shift layer indicated in upper-left)'
              : 'Standard QWERTY Layout'}
          </div>

          <div className="keyboard-row">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map((k) => (
              <div key={k} className={`key-cap ${activeKeyPressed === k ? 'active' : ''}`}>
                <span className="key-sub-char">{k}</span>
              </div>
            ))}
          </div>

          <div className="keyboard-row">
            {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'].map((k) => (
              <div key={k} className={`key-cap ${activeKeyPressed.toLowerCase() === k ? 'active' : ''}`}>
                <span className="key-hindi-char">
                  {passage.language === 'hindi_mangal' ? translateToMangalInscript(k, false) : k.toUpperCase()}
                </span>
                <span className="key-sub-char">{k}</span>
              </div>
            ))}
          </div>

          <div className="keyboard-row">
            {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"].map((k) => (
              <div key={k} className={`key-cap ${activeKeyPressed.toLowerCase() === k ? 'active' : ''}`}>
                <span className="key-hindi-char">
                  {passage.language === 'hindi_mangal' ? translateToMangalInscript(k, false) : k.toUpperCase()}
                </span>
                <span className="key-sub-char">{k}</span>
              </div>
            ))}
          </div>

          <div className="keyboard-row">
            {['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'].map((k) => (
              <div key={k} className={`key-cap ${activeKeyPressed.toLowerCase() === k ? 'active' : ''}`}>
                <span className="key-hindi-char">
                  {passage.language === 'hindi_mangal' ? translateToMangalInscript(k, false) : k.toUpperCase()}
                </span>
                <span className="key-sub-char">{k}</span>
              </div>
            ))}
          </div>

          <div className="keyboard-row">
            <div className={`key-cap space ${activeKeyPressed === ' ' ? 'active' : ''}`}>
              Space
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '12px' }}>
              Confirm Test Submission
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              You still have <strong>{formatTime(secondsRemaining)}</strong> remaining. Are you sure you want to finalize your typing test and view the diagnostic evaluation?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
              >
                Continue Typing
              </button>
              <button
                onClick={handleCompleteSubmission}
                className="btn btn-danger"
              >
                Submit Test Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
