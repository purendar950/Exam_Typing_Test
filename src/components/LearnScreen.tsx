import React, { useState } from 'react';
import { MANGAL_LESSONS, ENGLISH_LESSONS } from '../data/passages';
import { translateToMangalInscript, translateEnglishStringToHindi } from '../utils/hindiEngine';
import { audioEngine } from '../utils/audioEngine';
import { HindiHelperModal } from './HindiHelperModal';
import { HindiKeyboardLayout } from './HindiKeyboardLayout';

interface LearnScreenProps {
  onBackToTests: () => void;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({ onBackToTests }) => {
  const [activeTab, setActiveTab] = useState<'hindi' | 'english'>('hindi');
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string>('');
  const [isHindiHelperOpen, setIsHindiHelperOpen] = useState<boolean>(false);

  const currentLessons = activeTab === 'hindi' ? MANGAL_LESSONS : ENGLISH_LESSONS;
  const currentLesson = currentLessons[selectedLessonIndex];
  const targetChars = currentLesson.text;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setActiveKey(e.key);
    setTimeout(() => setActiveKey(''), 100);
    audioEngine.playKeyClick();

    if (e.key === 'Backspace') {
      return;
    }

    if (activeTab === 'hindi' && e.key.length === 1 && !e.ctrlKey && !e.metaKey && e.key !== ' ') {
      const translated = translateToMangalInscript(e.key, e.shiftKey, e.code);
      e.preventDefault();
      setTypedInput((prev) => prev + translated);
    }
  };

  const handleReset = () => {
    setTypedInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    const prevVal = typedInput;

    if (activeTab === 'english') {
      setTypedInput(nextVal);
      return;
    }

    let prefixLen = 0;
    while (
      prefixLen < prevVal.length &&
      prefixLen < nextVal.length &&
      prevVal[prefixLen] === nextVal[prefixLen]
    ) {
      prefixLen++;
    }

    let suffixLen = 0;
    while (
      suffixLen < (prevVal.length - prefixLen) &&
      suffixLen < (nextVal.length - prefixLen) &&
      prevVal[prevVal.length - 1 - suffixLen] === nextVal[nextVal.length - 1 - suffixLen]
    ) {
      suffixLen++;
    }

    const inserted = nextVal.slice(prefixLen, nextVal.length - suffixLen);

    if (!inserted) {
      setTypedInput(nextVal);
      return;
    }

    const translatedInserted = translateEnglishStringToHindi(inserted, 'mangal');
    const finalVal =
      prevVal.slice(0, prefixLen) +
      translatedInserted +
      prevVal.slice(prevVal.length - suffixLen);

    setTypedInput(finalVal);
  };

  // Calculate live progress and accuracy
  const totalTargetLength = targetChars.length;
  let correctCount = 0;
  for (let i = 0; i < typedInput.length; i++) {
    if (typedInput[i] === targetChars[i]) {
      correctCount++;
    }
  }
  const accuracy = typedInput.length > 0 ? Math.round((correctCount / typedInput.length) * 100) : 100;
  const isLessonComplete = typedInput.length >= totalTargetLength;

  return (
    <div className="container" style={{ padding: '28px 16px' }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: 'white',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
              Guided Finger & Muscle Memory Trainer
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
              Master touch-typing on Hindi Mangal Inscript and English QWERTY without looking down at the keyboard.
            </p>
          </div>
          <button onClick={onBackToTests} className="btn btn-secondary btn-sm" style={{ background: 'white' }}>
            ← Back to Mock Tests
          </button>
        </div>
      </div>

      {/* Language switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => {
            setActiveTab('hindi');
            setSelectedLessonIndex(0);
            setTypedInput('');
          }}
          className={`btn ${activeTab === 'hindi' ? 'btn-primary' : 'btn-secondary'}`}
        >
          हिंदी मंगल (Mangal Inscript Lessons)
        </button>
        <button
          onClick={() => {
            setActiveTab('english');
            setSelectedLessonIndex(0);
            setTypedInput('');
          }}
          className={`btn ${activeTab === 'english' ? 'btn-primary' : 'btn-secondary'}`}
        >
          English Touch Typing Lessons
        </button>
        <button
          onClick={() => setIsHindiHelperOpen(true)}
          className="btn"
          style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700 }}
          title="Open Hindi Character & Conjuncts Helper"
        >
          ⌨️ संयुक्ताक्षर गाइड (Hindi Conjuncts)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
        {/* Lesson List */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
            CHOOSE LESSON
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentLessons.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setSelectedLessonIndex(idx);
                  setTypedInput('');
                }}
                className={`btn btn-sm ${selectedLessonIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '10px 12px' }}
              >
                {lesson.title}
              </button>
            ))}
          </div>
        </div>

        {/* Drill Practice Workspace */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{currentLesson.title}</h2>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.9rem' }}>
              <span>Progress: <strong>{typedInput.length}/{totalTargetLength}</strong></span>
              <span>Accuracy: <strong style={{ color: accuracy >= 90 ? '#16a34a' : '#dc2626' }}>{accuracy}%</strong></span>
            </div>
          </div>

          {/* Drill Display Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              fontSize: '1.6rem',
              letterSpacing: '2px',
              lineHeight: 1.8,
              minHeight: '120px',
              userSelect: 'none'
            }}
          >
            {targetChars.split('').map((char, index) => {
              const isTyped = index < typedInput.length;
              const isCorrect = isTyped && typedInput[index] === char;
              const isWrong = isTyped && typedInput[index] !== char;
              const isCurrent = index === typedInput.length;

              return (
                <span
                  key={index}
                  style={{
                    backgroundColor: isCurrent ? '#bae6fd' : isWrong ? '#fee2e2' : 'transparent',
                    color: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isCurrent ? '#0369a1' : '#64748b',
                    borderRadius: '3px',
                    padding: '2px 3px',
                    fontWeight: isCurrent ? 800 : 500,
                    textDecoration: isWrong ? 'underline' : 'none'
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>

          {/* Typing input */}
          <div>
            <input
              type="text"
              value={typedInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={isLessonComplete}
              placeholder={isLessonComplete ? "Lesson Completed! Click Reset or choose the next drill." : "Type the text above here..."}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border-color)',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              autoFocus
            />
          </div>

          {isLessonComplete && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}
            >
              <h4 style={{ color: '#15803d', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>
                Drill Completed! 🎉
              </h4>
              <p style={{ color: '#166534', fontSize: '0.9rem', marginBottom: '12px' }}>
                Final Accuracy: {accuracy}%. Practice makes perfection.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button onClick={handleReset} className="btn btn-secondary btn-sm">
                  Repeat Lesson
                </button>
                {selectedLessonIndex < currentLessons.length - 1 && (
                  <button
                    onClick={() => {
                      setSelectedLessonIndex((prev) => prev + 1);
                      setTypedInput('');
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Next Lesson →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Finger guide hint */}
          <div
            style={{
              padding: '12px 16px',
              background: '#f1f5f9',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            💡 <strong>Finger Guide:</strong> Keep your left fingers lightly resting on <strong>A S D F</strong> and right fingers on <strong>J K L ;</strong>. Always return to the home row after every keystroke.
          </div>
        </div>
      </div>

      {activeTab === 'hindi' && (
        <div style={{ marginTop: '24px' }}>
          <HindiKeyboardLayout
            layout="mangal"
            onInsertChar={(char) => setTypedInput((prev) => prev + char)}
          />
        </div>
      )}

      <HindiHelperModal
        isOpen={isHindiHelperOpen}
        onClose={() => setIsHindiHelperOpen(false)}
        defaultLayout="mangal"
      />
    </div>
  );
};
