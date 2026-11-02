import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Passage, TestSettings, EvaluationResult } from '../types';
import { translateToMangalInscript, translateToKrutiDev } from '../utils/hindiEngine';
import { audioEngine } from '../utils/audioEngine';
import { evaluateTypingTest } from '../utils/evaluator';
import { HindiHelperModal } from './HindiHelperModal';

interface StartTestProps {
  passage: Passage;
  durationMinutes: number;
  settings: TestSettings;
  onUpdateSettings?: (newSettings: Partial<TestSettings>) => void;
  onFinishTest: (result: EvaluationResult) => void;
  onCancelTest: () => void;
}

export const StartTest: React.FC<StartTestProps> = ({
  passage,
  durationMinutes,
  settings,
  onUpdateSettings,
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
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHindiHelper, setShowHindiHelper] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>(settings.candidateName || 'PURENDAR');

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
    let timer: ReturnType<typeof setInterval> | null = null;
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

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Fullscreen support
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Handle key down in typing box
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isTestStarted && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      setIsTestStarted(true);
    }

    if (e.key === 'Backspace') {
      if (!settings.backspaceEnabled) {
        e.preventDefault();
        return;
      }
      setBackspaceCount((prev) => prev + 1);
      audioEngine.playKeyClick();
      return;
    }

    if (e.key === 'Enter') {
      audioEngine.playKeyClick();
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      audioEngine.playKeyClick();

      // Transliteration for Hindi
      if (passage.language === 'hindi_mangal') {
        e.preventDefault();
        const hindiChar = translateToMangalInscript(e.key, e.shiftKey);
        insertCharacter(hindiChar);
      } else if (passage.language === 'hindi_kruti') {
        e.preventDefault();
        const krutiChar = translateToKrutiDev(e.key);
        insertCharacter(krutiChar);
      }
    }
  };

  // Helper to insert character at cursor position
  const insertCharacter = (char: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = typedText;
    const next = current.substring(0, start) + char + current.substring(end);
    setTypedText(next);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + char.length;
        textareaRef.current.selectionEnd = start + char.length;
      }
    }, 0);
  };

  // Prevent paste, cut, copy
  const handlePrevent = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  // Complete submission
  const handleCompleteSubmission = () => {
    const timeTaken = totalSeconds - secondsRemaining;
    const result = evaluateTypingTest({
      testId: passage.id,
      testTitle: passage.title,
      language: passage.language,
      category: passage.category,
      originalText: passage.text,
      typedText: typedText,
      timeAllowedMinutes: durationMinutes,
      timeTakenSeconds: timeTaken,
      backspaceCount: backspaceCount
    });
    onFinishTest(result);
  };

  // Language display title for top black bar (Screenshot 1)
  const getExamLanguageTitle = () => {
    if (passage.language === 'english') return 'English';
    if (passage.language === 'hindi_mangal') return 'Hindi Mangal (Inscript)';
    return 'Hindi Kruti Dev';
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP BLACK EXAM BAR (Screenshot 1) */}
      <div className="ar-exam-topbar">
        <span>UP Police SI/ASI/Computer Operator {getExamLanguageTitle()} Typing</span>
        <button
          onClick={toggleFullScreen}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
          title="Toggle Fullscreen"
        >
          ⛶ Fullscreen
        </button>
      </div>

      <div className="container" style={{ maxWidth: '1020px', flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 2. SUB-HEADER / STATUS BAR (Screenshot 1) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
            position: 'relative'
          }}
        >
          {/* Left: Quick status / title */}
          <div style={{ width: '120px', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>Words:</span> {typedWords.length} / {originalWords.length}
          </div>

          {/* Center: Large bold countdown timer (Screenshot 1: "Time left:- 14:55") */}
          <div className="ar-timer-center">
            Time left:- {formatTime(secondsRemaining)}
          </div>

          {/* Right: Candidate Avatar Card & Highlight Switch (Screenshot 1) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {/* Candidate Frame */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '4px 10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              {/* Silhouette Avatar */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.4rem'
                }}
              >
                👤
              </div>
              <div className="ar-candidate-name">
                {candidateName}
              </div>
            </div>

            {/* Highlight Toggle Switch right below photo (Screenshot 1) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Toggle Word Highlights (Disabled by default)">
              <label className="ar-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.highlightEnabled}
                  onChange={(e) => onUpdateSettings?.({ highlightEnabled: e.target.checked })}
                />
                <span className="ar-toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* 3. TOP BOX: SOURCE PASSAGE DISPLAY (Screenshot 1) */}
        <div ref={passagePaneRef} className="ar-source-box">
          {originalWords.map((word, idx) => {
            const isCurrent = idx === currentWordIndex;
            const isCompleted = idx < currentWordIndex;
            const isCorrect = isCompleted && typedWords[idx] === word;
            const isWrong = isCompleted && typedWords[idx] !== word;

            return (
              <span
                key={idx}
                ref={isCurrent ? activeWordRef : null}
                style={{
                  marginRight: '0.35em',
                  display: 'inline-block',
                  backgroundColor: settings.highlightEnabled
                    ? isCurrent
                      ? '#fef08a'
                      : isCorrect
                      ? '#dcfce7'
                      : isWrong
                      ? '#fee2e2'
                      : 'transparent'
                    : 'transparent',
                  color: settings.highlightEnabled
                    ? isWrong
                      ? '#dc2626'
                      : '#000000'
                    : '#000000',
                  fontWeight: isCurrent && settings.highlightEnabled ? 700 : 400
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* 4. BOTTOM BOX: LIME-GREEN TYPING INPUT BOX (Screenshot 1) */}
        <div className="ar-typing-box">
          <textarea
            ref={textareaRef}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            onKeyDown={handleKeyDown}
            onCopy={handlePrevent}
            onPaste={handlePrevent}
            onCut={handlePrevent}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="ar-typing-textarea"
            placeholder={isTestStarted ? '' : 'Click here and start typing...'}
          />

          {/* Floating Purple Settings Button (Screenshot 1: bottom-right purple gear) */}
          <button
            type="button"
            className="ar-floating-gear"
            onClick={() => setShowSettingsModal(true)}
            title="Typing Settings"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* 5. BOTTOM ACTION BUTTONS BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <button
            onClick={onCancelTest}
            className="btn btn-danger"
            style={{ fontWeight: 700, padding: '10px 24px', backgroundColor: '#dc2626' }}
          >
            Cancel / Exit Test
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
              className="btn btn-secondary btn-sm"
            >
              ⌨️ {showVirtualKeyboard ? 'Hide Keymap' : 'On-Screen Keys'}
            </button>
            {passage.language.includes('hindi') && (
              <button
                type="button"
                onClick={() => setShowHindiHelper(true)}
                className="btn btn-sm"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700 }}
                title="Look up keystrokes for Hindi Conjuncts (संयुक्ताक्षर) & special characters"
              >
                ⌨️ Hindi Keys
              </button>
            )}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '10px 32px', backgroundColor: '#0284c7' }}
            >
              Submit Test
            </button>
          </div>
        </div>

      </div>

      {/* Floating Settings Modal (triggered by purple gear icon) */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Test Preferences & Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Candidate Name Input */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Candidate Name (Appears on Screen):
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => {
                    const name = e.target.value.toUpperCase();
                    setCandidateName(name);
                    onUpdateSettings?.({ candidateName: name });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              {/* Toggles */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={settings.highlightEnabled}
                  onChange={(e) => onUpdateSettings?.({ highlightEnabled: e.target.checked })}
                />
                <span>Word Highlights (Disabled by default in UP Police exam)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => onUpdateSettings?.({ autoScroll: e.target.checked })}
                />
                <span>Auto-Scroll Source Passage</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={settings.backspaceEnabled}
                  onChange={(e) => onUpdateSettings?.({ backspaceEnabled: e.target.checked })}
                />
                <span>Allow Backspace Editing</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings?.({ soundEnabled: e.target.checked })}
                />
                <span>Mechanical Typewriter Key Sounds</span>
              </label>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button onClick={() => setShowSettingsModal(false)} className="btn btn-primary" style={{ fontWeight: 700 }}>
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>
              Submit Official Test?
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to end your test now? Your Net WPM, accuracy, and mistake breakdown will be calculated according to official UPPRPB guidelines.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setShowSubmitModal(false)} className="btn btn-secondary">
                Continue Typing
              </button>
              <button onClick={handleCompleteSubmission} className="btn btn-primary" style={{ backgroundColor: '#0284c7', fontWeight: 700 }}>
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hindi Character & Conjuncts Helper Modal */}
      <HindiHelperModal
        isOpen={showHindiHelper}
        onClose={() => {
          setShowHindiHelper(false);
          textareaRef.current?.focus();
        }}
        defaultLayout={passage.language === 'hindi_kruti' ? 'kruti' : 'mangal'}
      />

    </div>
  );
};
