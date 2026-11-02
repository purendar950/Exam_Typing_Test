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
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'words_desc'>('date_desc');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Today's date string
  const todayStr = '2026-11-02';

  // Distinct dates in the database sorted newest first
  const availableDates = Array.from(
    new Set(passages.map((p) => p.date).filter(Boolean))
  ).sort().reverse();

  // Helper date formatter
  const formatDateLabel = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [year, month, day] = dStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      return `${day} ${monthNames[mIdx]} ${year}`;
    } catch {
      return dStr;
    }
  };

  // Filter passages
  const filteredPassages = passages
    .filter((p) => {
      if (p.language !== selectedLanguage) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;
      if (selectedDate !== 'all') {
        if (selectedDate === 'today' && p.date !== todayStr) return false;
        if (selectedDate !== 'today' && p.date !== selectedDate) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id);
      }
      if (sortBy === 'date_asc') {
        return (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id);
      }
      if (sortBy === 'words_desc') {
        return b.wordCount - a.wordCount;
      }
      return 0;
    });

  // Check how many tests match today for this language
  const todayCountForLang = passages.filter(
    (p) => p.language === selectedLanguage && p.date === todayStr
  ).length;

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
              UPPRPB Official Exam Standard
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
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              📅 Date-Wise Daily Tests
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
            UP Police Computer Operator & ASI Typing Test Portal
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', maxWidth: '850px', marginBottom: '16px' }}>
            Exclusively tailored for Uttar Pradesh Police Computer Operator Grade-A and Assistant Sub-Inspector (Clerk/Accounts) recruitment. Daily date-wise official mock passages in Hindi (Mangal & Kruti Dev) and English.
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
              <strong>Official Fonts:</strong> Mangal (Inscript) / Kruti Dev 010
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
          marginBottom: '20px',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => {
            setSelectedLanguage('hindi_mangal');
            setSelectedDate('all');
          }}
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
          onClick={() => {
            setSelectedLanguage('hindi_kruti');
            setSelectedDate('all');
          }}
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
          onClick={() => {
            setSelectedLanguage('english');
            setSelectedDate('all');
          }}
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

      {/* Date-wise Quick Banner if today's tests exist */}
      {todayCountForLang > 0 && selectedDate !== 'today' && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <div>
              <strong style={{ color: '#065f46', fontSize: '0.95rem' }}>
                Today's Daily Mock Tests ({formatDateLabel(todayStr)}) are available!
              </strong>
              <div style={{ color: '#047857', fontSize: '0.825rem' }}>
                {todayCountForLang} new UP Police exam passage(s) added for today.
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedDate('today')}
            className="btn btn-sm"
            style={{
              background: '#059669',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none'
            }}
          >
            View Today's Tests ({todayCountForLang})
          </button>
        </div>
      )}

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

        {/* Date, Exam Category & Difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
                background: selectedDate !== 'all' ? '#e0f2fe' : '#ffffff',
                fontWeight: selectedDate !== 'all' ? 600 : 400
              }}
            >
              <option value="all">All Dates ({availableDates.length} Days)</option>
              {availableDates.includes(todayStr) && (
                <option value="today">⭐ Today ({formatDateLabel(todayStr)})</option>
              )}
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatDateLabel(d)} {d === todayStr ? '(Today)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Post Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Post:</span>
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
              <option value="all">All (UP Police CO & ASI)</option>
              <option value="up_police_co">UP Police Computer Operator</option>
              <option value="up_police_asi">UP Police ASI (Clerk/Acct)</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            >
              <option value="date_desc">📅 Newest Date First</option>
              <option value="date_asc">📅 Oldest Date First</option>
              <option value="words_desc">📝 Word Count (High to Low)</option>
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
              Highlight Words (Disabled in Official Exam)
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

      {/* Active Filter Summary Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>
          Showing <strong>{filteredPassages.length}</strong> official tests{' '}
          {selectedDate !== 'all' && (
            <span>
              for date <strong>{selectedDate === 'today' ? formatDateLabel(todayStr) : formatDateLabel(selectedDate)}</strong>
            </span>
          )}
        </div>
        {selectedDate !== 'all' && (
          <button
            onClick={() => setSelectedDate('all')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            Clear Date Filter
          </button>
        )}
      </div>

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
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '12px' }}>
              No passages found for the selected date and filters.
            </p>
            <button onClick={() => setSelectedDate('all')} className="btn btn-secondary btn-sm">
              View All Dates
            </button>
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
                height: '100%',
                border: passage.date === todayStr ? '1px solid #38bdf8' : undefined
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className={`badge ${
                        passage.category === 'up_police_co' ? 'badge-blue' : 'badge-amber'
                      }`}
                    >
                      {passage.category === 'up_police_co' ? 'UP Police CO' : 'UP Police ASI'}
                    </span>
                    {passage.date && (
                      <span
                        style={{
                          background: passage.date === todayStr ? '#ecfdf5' : '#f1f5f9',
                          color: passage.date === todayStr ? '#059669' : '#475569',
                          border: passage.date === todayStr ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        📅 {formatDateLabel(passage.date)}
                        {passage.date === todayStr ? ' (TODAY)' : ''}
                      </span>
                    )}
                  </div>
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
