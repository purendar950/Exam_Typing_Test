import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Passage, TestSettings, EvaluationResult, ExamProfile } from '../types';
import { translateToMangalInscript, translateToKrutiDev, translateEnglishStringToHindi } from '../utils/hindiEngine';
import { audioEngine } from '../utils/audioEngine';
import { evaluateTypingTest } from '../utils/evaluator';
import { HindiHelperModal } from './HindiHelperModal';
import { HindiKeyboardLayout } from './HindiKeyboardLayout';

interface StartTestProps {
  passage: Passage;
  durationMinutes: number;
  settings: TestSettings;
  onUpdateSettings?: (newSettings: Partial<TestSettings>) => void;
  onFinishTest: (result: EvaluationResult) => void;
  onCancelTest: () => void;
  activeExamProfile?: ExamProfile | null;
}

export const StartTest: React.FC<StartTestProps> = ({
  passage,
  durationMinutes,
  settings,
  onUpdateSettings,
  onFinishTest,
  onCancelTest,
  activeExamProfile
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => !!document.fullscreenElement);
  const [inscriptMappingEnabled, setInscriptMappingEnabled] = useState<boolean>(true);
  const isComposingRef = useRef<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passagePaneRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  // Auto-scroll passage view ONLY when typing reaches the bottom visible lines
  useEffect(() => {
    if (!settings.autoScroll || !passagePaneRef.current) return;
    const pane = passagePaneRef.current;

    // At the beginning, keep top aligned
    if (currentWordIndex <= 1) {
      if (pane.scrollTop !== 0) {
        pane.scrollTop = 0;
      }
      return;
    }

    if (!activeWordRef.current) return;
    const word = activeWordRef.current;

    const paneRect = pane.getBoundingClientRect();
    const wordRect = word.getBoundingClientRect();

    // Word position relative to visible viewport of pane
    const wordTopRel = wordRect.top - paneRect.top;
    const wordBottomRel = wordRect.bottom - paneRect.top;

    // Only scroll if active word has actually reached near the bottom of visible viewport (within 40px of bottom)
    if (wordBottomRel > pane.clientHeight - 40) {
      // Gently bring the active word to the middle of the viewport so upcoming text is visible
      const targetScroll = pane.scrollTop + (wordBottomRel - (pane.clientHeight * 0.45));
      pane.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    } else if (wordTopRel < 15 && pane.scrollTop > 0) {
      // If user backspaced above the top visible line
      const targetScroll = Math.max(0, pane.scrollTop + wordTopRel - 30);
      pane.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
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

  // Focus textarea on mount and reset on passage change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.focus();
    }
    setTypedText('');
    setIsTestStarted(false);
    setSecondsRemaining(durationMinutes * 60);
    audioEngine.setSoundEnabled(settings.soundEnabled);
  }, [passage.id, settings.soundEnabled, durationMinutes]);

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

  // Helper to insert character at cursor position cleanly with undo/cursor sync
  const insertCharacter = (char: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = el.value;
    const next = current.substring(0, start) + char + current.substring(end);
    el.value = next;
    const newPos = start + char.length;
    el.selectionStart = el.selectionEnd = newPos;
    setTypedText(next);
  };

  // Helper to delete character before cursor (for Backspace in readOnly mode)
  const deleteCharacter = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const current = el.value;
    if (start === end) {
      if (start > 0) {
        const next = current.substring(0, start - 1) + current.substring(end);
        el.value = next;
        el.selectionStart = el.selectionEnd = start - 1;
        setTypedText(next);
      }
    } else {
      const next = current.substring(0, start) + current.substring(end);
      el.value = next;
      el.selectionStart = el.selectionEnd = start;
      setTypedText(next);
    }
  };

  // Handle key down in typing box
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMangalInscript = passage.language === 'hindi_mangal' && inscriptMappingEnabled;

    if (!isTestStarted && (e.key.length === 1 || e.code === 'Space') && !e.ctrlKey && !e.altKey && !e.metaKey) {
      setIsTestStarted(true);
    }

    // 1. If IME is composing and NOT in Mangal Inscript mapped mode, let the native IME work
    if (!isMangalInscript && (isComposingRef.current || e.nativeEvent.isComposing || e.key === 'Process' || e.keyCode === 229)) {
      return;
    }

    if (e.key === 'Backspace' || e.code === 'Backspace') {
      if (!settings.backspaceEnabled) {
        e.preventDefault();
        return;
      }
      setBackspaceCount((prev) => prev + 1);
      audioEngine.playKeyClick();
      if (isMangalInscript) {
        e.preventDefault();
        deleteCharacter();
      }
      return;
    }

    if (e.key === 'Enter' || e.code === 'Enter') {
      audioEngine.playKeyClick();
      if (isMangalInscript) {
        e.preventDefault();
        insertCharacter('\n');
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }

    if (isMangalInscript) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        audioEngine.playKeyClick();
        insertCharacter(' ');
        return;
      }

      // Check if it's a printable keystroke (character key or standard physical scancode)
      const isPrintable =
        (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) ||
        (Boolean(e.code) && (
          e.code.startsWith('Key') ||
          e.code.startsWith('Digit') ||
          e.code.startsWith('Bracket') ||
          e.code === 'Backquote' ||
          e.code === 'Minus' ||
          e.code === 'Equal' ||
          e.code === 'Semicolon' ||
          e.code === 'Quote' ||
          e.code === 'Comma' ||
          e.code === 'Period' ||
          e.code === 'Slash' ||
          e.code === 'Backslash'
        ));

      if (isPrintable) {
        e.preventDefault();
        audioEngine.playKeyClick();

        // If key is ALREADY a Devanagari character (e.g. native OS Hindi keyboard active), keep it
        if (/^[\u0900-\u097F]$/.test(e.key)) {
          insertCharacter(e.key);
          return;
        }

        const isShift =
          e.shiftKey ||
          (e.key >= 'A' && e.key <= 'Z') ||
          (typeof e.getModifierState === 'function' && e.getModifierState('CapsLock'));
        const hindiChar = translateToMangalInscript(e.key, isShift, e.code);
        insertCharacter(hindiChar);
        return;
      }
    } else {
      // Normal typing (English, Kruti Dev, or Native Hindi IME)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        audioEngine.playKeyClick();
      }
    }
  };

  // Intercept beforeinput (for mobile virtual keyboards in QWERTY Inscript mode)
  const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (!nativeEvent) return;

    if (!isTestStarted && nativeEvent.data) {
      setIsTestStarted(true);
    }

    // In Mangal Inscript mapped mode:
    if (passage.language === 'hindi_mangal' && inscriptMappingEnabled) {
      e.preventDefault();
      if (nativeEvent.data) {
        const translated = translateEnglishStringToHindi(nativeEvent.data, 'mangal');
        insertCharacter(translated);
        audioEngine.playKeyClick();
      }
    }
  };

  // Robust Text Change Handler - strictly updates state with current DOM value without destroying IME buffers
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    let nextVal = el.value;

    if (!isTestStarted && nextVal.length > 0) {
      setIsTestStarted(true);
    }

    // Safeguard for Hindi Mangal with Inscript mapping enabled:
    // If any English ASCII letters exist in the value (e.g. from Android keyboards, Gboard autocomplete,
    // or unintercepted keystrokes), automatically convert them to Inscript!
    if (passage.language === 'hindi_mangal' && inscriptMappingEnabled && /[a-zA-Z]/.test(nextVal)) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      nextVal = translateEnglishStringToHindi(nextVal, 'mangal');
      el.value = nextVal;
      if (start !== null && end !== null) {
        el.setSelectionRange(start, end);
      }
    }

    setTypedText(nextVal);
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
      backspaceCount: backspaceCount,
      targetSpeed: activeExamProfile?.targetSpeed,
      requiredAccuracy: activeExamProfile?.minAccuracy,
      examProfileTitle: activeExamProfile?.title
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
    <div className="ar-test-wrapper">
      
      {/* 1. TOP BLACK EXAM BAR (Screenshot 1) */}
      <div className="ar-exam-topbar">
        <span>{activeExamProfile ? activeExamProfile.title : `UP Police SI/ASI/Computer Operator ${getExamLanguageTitle()} Typing`}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Auto Scroll Toggle in Topbar */}
          <button
            type="button"
            onClick={() => onUpdateSettings?.({ autoScroll: !settings.autoScroll })}
            style={{
              background: settings.autoScroll ? '#16a34a' : 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Toggle Auto Scroll On/Off (Default: OFF)"
          >
            <span>📜 Auto Scroll:</span>
            <span style={{ color: settings.autoScroll ? '#bbf7d0' : '#cbd5e1' }}>
              {settings.autoScroll ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Quick Hindi Keyboard Map Toggle in Topbar */}
          <button
            type="button"
            onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
            style={{
              background: showVirtualKeyboard ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Toggle Visual Hindi Keyboard Layout Map (Inscript / Kruti Dev)"
          >
            <span>⌨️ Layout Map:</span>
            <span style={{ color: showVirtualKeyboard ? '#fef08a' : '#cbd5e1' }}>
              {showVirtualKeyboard ? 'HIDE' : 'SHOW'}
            </span>
          </button>

          <button
            onClick={toggleFullScreen}
            style={{
              background: isFullscreen ? '#0284c7' : 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Edge-to-Edge)'}
          >
            {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      <div className="ar-test-container">
        
        {/* 2. SUB-HEADER / STATUS BAR (Screenshot 1) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
            position: 'relative',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          {/* Left: Quick status / title */}
          <div style={{ minWidth: '110px', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>Words:</span> {typedWords.length} / {originalWords.length}
          </div>

          {/* Center: Large bold countdown timer (Screenshot 1: "Time left:- 14:55") */}
          <div className="ar-timer-center">
            Time left:- {formatTime(secondsRemaining)}
          </div>

          {/* Right: Candidate Avatar Card & Switches (Screenshot 1) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {/* Candidate Frame */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                padding: '3px 10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              {/* Silhouette Avatar */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.3rem'
                }}
              >
                👤
              </div>
              <div className="ar-candidate-name">
                {candidateName}
              </div>
            </div>

            {/* Toggle Switches right below photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Highlight Toggle Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Toggle Word Highlights (Disabled by default)">
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Highlight:</span>
                <label className="ar-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.highlightEnabled}
                    onChange={(e) => onUpdateSettings?.({ highlightEnabled: e.target.checked })}
                  />
                  <span className="ar-toggle-slider" />
                </label>
              </div>

              {/* Auto Scroll Toggle Switch (Default OFF) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Toggle Auto Scroll (Default: OFF)">
                <span style={{ fontSize: '0.72rem', color: settings.autoScroll ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                  Auto Scroll:
                </span>
                <label className="ar-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoScroll}
                    onChange={(e) => onUpdateSettings?.({ autoScroll: e.target.checked })}
                  />
                  <span className="ar-toggle-slider" />
                </label>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: settings.autoScroll ? '#16a34a' : '#94a3b8' }}>
                  {settings.autoScroll ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Inscript QWERTY Key Mapping Toggle Switch (Hindi Mangal only) */}
              {passage.language === 'hindi_mangal' && (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Toggle QWERTY-to-Inscript Key Mapping. Keep ON if typing on standard English keyboard. Turn OFF if using Windows Indic IME or Google Input Tools."
                >
                  <span style={{ fontSize: '0.72rem', color: inscriptMappingEnabled ? '#0284c7' : '#64748b', fontWeight: 700 }}>
                    Inscript:
                  </span>
                  <label className="ar-toggle-switch">
                    <input
                      type="checkbox"
                      checked={inscriptMappingEnabled}
                      onChange={(e) => setInscriptMappingEnabled(e.target.checked)}
                    />
                    <span className="ar-toggle-slider" />
                  </label>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: inscriptMappingEnabled ? '#0284c7' : '#94a3b8' }}>
                    {inscriptMappingEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. TOP BOX: SOURCE PASSAGE DISPLAY (Screenshot 1) */}
        <div
          ref={passagePaneRef}
          className={`ar-source-box ${passage.language === 'hindi_kruti' ? 'font-kruti' : ''}`}
          style={{
            fontFamily: passage.language === 'hindi_kruti'
              ? "'Kruti Dev 010', 'KrutiDev010', sans-serif"
              : passage.language === 'hindi_mangal'
              ? "'Noto Sans Devanagari', 'Mangal', sans-serif"
              : "'Georgia', 'Cambria', serif"
          }}
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
                style={{
                  marginRight: '0.35em',
                  display: 'inline-block',
                  fontFamily: passage.language === 'hindi_kruti'
                    ? "'Kruti Dev 010', 'KrutiDev010', sans-serif"
                    : undefined,
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
            defaultValue=""
            onChange={handleTextChange}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
            readOnly={passage.language === 'hindi_mangal' && inscriptMappingEnabled}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              const el = e.target as HTMLTextAreaElement;
              let val = el.value;
              if (!isTestStarted && val.length > 0) {
                setIsTestStarted(true);
              }
              if (passage.language === 'hindi_mangal' && inscriptMappingEnabled && /[a-zA-Z]/.test(val)) {
                val = translateEnglishStringToHindi(val, 'mangal');
                el.value = val;
              }
              setTypedText(val);
            }}
            onCopy={handlePrevent}
            onPaste={handlePrevent}
            onCut={handlePrevent}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            className={`ar-typing-textarea ${passage.language === 'hindi_kruti' ? 'font-kruti' : ''}`}
            style={{
              fontFamily: passage.language === 'hindi_kruti'
                ? "'Kruti Dev 010', 'KrutiDev010', sans-serif"
                : passage.language === 'hindi_mangal'
                ? "'Noto Sans Devanagari', 'Mangal', sans-serif"
                : 'inherit',
              caretColor: '#000000',
              cursor: 'text'
            }}
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

              {passage.language === 'hindi_mangal' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={inscriptMappingEnabled}
                    onChange={(e) => setInscriptMappingEnabled(e.target.checked)}
                  />
                  <span>
                    QWERTY Inscript Auto-Mapping (Keep ON for US keyboards, turn OFF if using Google Input Tools / Indic IME)
                  </span>
                </label>
              )}
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

      {/* On-Screen Mapped Hindi Virtual Keyboard Modal */}
      {showVirtualKeyboard && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowVirtualKeyboard(false);
            textareaRef.current?.focus();
          }}
          style={{ zIndex: 9999, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '1020px', maxHeight: '92vh', overflowY: 'auto' }}
          >
            <HindiKeyboardLayout
              layout={passage.language === 'hindi_kruti' ? 'kruti' : 'mangal'}
              onInsertChar={(char) => {
                insertCharacter(char);
                textareaRef.current?.focus();
              }}
              onClose={() => {
                setShowVirtualKeyboard(false);
                textareaRef.current?.focus();
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
