import React, { useState } from 'react';
import { Passage, Language, ExamCategory, TestSettings } from '../types';

interface ChooseTestProps {
  passages: Passage[];
  onStartTest: (passage: Passage, customDurationMinutes?: number) => void;
  settings: TestSettings;
  onUpdateSettings: (newSettings: Partial<TestSettings>) => void;
}

export const ChooseTest: React.FC<ChooseTestProps> = ({
  passages,
  onStartTest,
  settings,
  onUpdateSettings
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('hindi_mangal');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Filter passages
  const filteredPassages = passages.filter((p) => {
    if (p.language !== selectedLanguage) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;
    return true;
  });

  return (
    <div className="container" style={{ padding: '28px 16px' }}>
      {/* Target Exam Info Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          marginBottom: '28px',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              UPPRPB & UPSSSC Exam Standard
            </span>
            <span
              style={{
                background: '#22c55e',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              Official 85% Accuracy Standard
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
            Uttar Pradesh Computer Operator Typing Test Portal
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', maxWidth: '850px', marginBottom: '16px' }}>
            Simulate the exact environment and criteria of UP Police Computer Operator Grade-A, Assistant Sub-Inspector (Clerk/Accounts), and UPSSSC Junior Assistant typing examinations.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <strong>Hindi Speed:</strong> Min 25 Net WPM
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <strong>English Speed:</strong> Min 30 Net WPM
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <strong>Official Font:</strong> Mangal (Inscript) / Kruti Dev 010
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <strong>Duration:</strong> 15 Minutes (Practice 5/10m)
            </div>
          </div>
        </div>
      </div>

      {/* Language Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '24px',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => setSelectedLanguage('hindi_mangal')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: selectedLanguage === 'hindi_mangal' ? '3px solid var(--primary)' : '3px solid transparent',
            color: selectedLanguage === 'hindi_mangal' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '12px 20px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          हिंदी - मंगल (Mangal Inscript)
        </button>
        <button
          onClick={() => setSelectedLanguage('hindi_kruti')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: selectedLanguage === 'hindi_kruti' ? '3px solid var(--primary)' : '3px solid transparent',
            color: selectedLanguage === 'hindi_kruti' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '12px 20px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          हिंदी - कुर्ती देव (Kruti Dev 010)
        </button>
        <button
          onClick={() => setSelectedLanguage('english')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: selectedLanguage === 'english' ? '3px solid var(--primary)' : '3px solid transparent',
            color: selectedLanguage === 'english' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '12px 20px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          English Typing Test
        </button>
      </div>

      {/* Filter and Settings Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        {/* Duration selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Duration:</span>
          {[5, 10, 15].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`btn btn-sm ${selectedDuration === d ? 'btn-primary' : 'btn-secondary'}`}
            >
              {d} Mins {d === 15 ? '(Official)' : ''}
            </button>
          ))}
        </div>

        {/* Category & Difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Exam:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            >
              <option value="all">All Exams</option>
              <option value="up_police_co">UP Police Computer Operator</option>
              <option value="upsssc_ja">UPSSSC Junior Assistant</option>
              <option value="up_police_asi">UP Police ASI (Clerk/Acct)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard (Official)</option>
            </select>
          </div>

          {/* Quick Settings toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="btn btn-secondary btn-sm"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {showSettingsDrawer ? 'Hide Test Settings' : 'Test Settings'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettingsDrawer && (
        <div
          className="card"
          style={{
            marginBottom: '24px',
            backgroundColor: '#f8fafc',
            border: '1px dashed var(--primary)'
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--primary-dark)' }}>
            Exam Simulator Customization
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={settings.highlightEnabled}
                onChange={(e) => onUpdateSettings({ highlightEnabled: e.target.checked })}
              />
              Highlight Current Word
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => onUpdateSettings({ autoScroll: e.target.checked })}
              />
              Auto-Scroll Passage View
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={settings.backspaceEnabled}
                onChange={(e) => onUpdateSettings({ backspaceEnabled: e.target.checked })}
              />
              Allow Backspace Editing
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
              />
              Typewriter Audio Feedback
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Font Size:</span>
              {[16, 18, 20, 22].map((sz) => (
                <button
                  key={sz}
                  onClick={() => onUpdateSettings({ fontSize: sz })}
                  className={`btn btn-sm ${settings.fontSize === sz ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '3px 8px' }}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Passage Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {filteredPassages.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No passages found for the selected filters.</p>
          </div>
        ) : (
          filteredPassages.map((passage) => (
            <div
              key={passage.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span
                    className={`badge ${
                      passage.category === 'up_police_co'
                        ? 'badge-blue'
                        : passage.category === 'upsssc_ja'
                        ? 'badge-green'
                        : 'badge-amber'
                    }`}
                  >
                    {passage.category === 'up_police_co'
                      ? 'UP Police CO'
                      : passage.category === 'upsssc_ja'
                      ? 'UPSSSC JA'
                      : 'UP Police ASI'}
                  </span>
                  <span
                    className={`badge ${
                      passage.difficulty === 'easy'
                        ? 'badge-green'
                        : passage.difficulty === 'medium'
                        ? 'badge-amber'
                        : 'badge-red'
                    }`}
                  >
                    {passage.difficulty}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                  {passage.title}
                </h3>

                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {passage.text}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border-color)',
                    marginBottom: '14px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <span>
                    <strong>{passage.wordCount}</strong> Words
                  </span>
                  <span>
                    Selected Time: <strong>{selectedDuration} Mins</strong>
                  </span>
                </div>

                <button
                  onClick={() => onStartTest(passage, selectedDuration)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Official Test
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
