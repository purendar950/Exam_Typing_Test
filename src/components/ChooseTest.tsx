import React, { useState, useMemo, useEffect } from 'react';
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
  // Mode: 'ar_form' (Screenshots 2 & 3) vs 'special_cards' (Screenshot 4)
  const [viewMode, setViewMode] = useState<'ar_form' | 'special_cards'>('ar_form');

  // Form states matching Screenshots 2 & 3
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-25');
  const [selectedPassageId, setSelectedPassageId] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [inputLimit, setInputLimit] = useState<string>('Words');
  const [isPassageDropdownOpen, setIsPassageDropdownOpen] = useState<boolean>(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Convert date format YYYY-MM-DD to DD/MM/YYYY for AR Typing display
  const toDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD
  const toIsoDate = (displayDate: string) => {
    const parts = displayDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return displayDate;
  };

  // Passages matching selected language
  const languagePassages = useMemo(() => {
    return passages.filter((p) => p.language === selectedLanguage);
  }, [passages, selectedLanguage]);

  // Available unique dates for the current language
  const availableIsoDates = useMemo(() => {
    return Array.from(new Set(languagePassages.map((p) => p.date).filter(Boolean))).sort().reverse();
  }, [languagePassages]);

  // Passages matching current language and date (guarantees different passages per date)
  const activePassageList = useMemo(() => {
    const exactMatches = languagePassages.filter((p) => p.date === selectedDate);
    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // If an arbitrary date is chosen that doesn't have explicit entries,
    // deterministically partition/rotate languagePassages so ANY date picked returns a unique set!
    if (!selectedDate || languagePassages.length === 0) {
      return languagePassages.slice(0, 4);
    }

    const hash = selectedDate.split('-').reduce((acc, part) => (acc * 37 + parseInt(part, 10)) >>> 0, 0);
    const chunkSize = Math.min(4, languagePassages.length);
    const offset = hash % languagePassages.length;
    const rotated = [];
    for (let i = 0; i < chunkSize; i++) {
      rotated.push(languagePassages[(offset + i) % languagePassages.length]);
    }
    return rotated;
  }, [languagePassages, selectedDate]);

  // When selectedDate or selectedLanguage changes, immediately auto-select the first passage of that date!
  useEffect(() => {
    if (activePassageList.length > 0) {
      setSelectedPassageId(activePassageList[0].id);
    } else {
      setSelectedPassageId('');
    }
  }, [selectedDate, selectedLanguage, activePassageList]);

  // Currently selected passage object
  const currentSelectedPassage = useMemo(() => {
    return activePassageList.find((p) => p.id === selectedPassageId) || activePassageList[0];
  }, [selectedPassageId, activePassageList]);

  // Difficulty badge letter
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return { label: 'E', cls: 'ar-badge-e' };
      case 'hard':
        return { label: 'H', cls: 'ar-badge-h' };
      case 'medium':
      default:
        return { label: 'M', cls: 'ar-badge-m' };
    }
  };

  // Special passages list (Screenshot 4)
  const specialPassages = useMemo(() => {
    return passages.filter((p) => {
      if (p.language !== selectedLanguage) return false;
      if (selectedCategoryTab !== 'all' && p.category !== selectedCategoryTab) return false;
      return true;
    });
  }, [passages, selectedLanguage, selectedCategoryTab]);

  return (
    <div style={{ backgroundColor: '#faf8f5', minHeight: 'calc(100vh - 70px)', padding: '24px 16px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        
        {/* VIEW 1: AR TYPING FORM SELECTOR (Screenshots 2 & 3) */}
        {viewMode === 'ar_form' && (
          <div
            className="card"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px 28px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Top Teal Action Button: Click for Special Passages */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => setViewMode('special_cards')}
                className="btn"
                style={{
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Click for Special Passages
              </button>
            </div>

            {/* OR Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                margin: '18px 0 28px',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ padding: '0 16px', letterSpacing: '1px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Difficulty Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}
            >
              <span><span className="ar-badge-difficulty ar-badge-b" style={{ marginRight: '4px' }}>B</span> - Basic</span>
              <span><span className="ar-badge-difficulty ar-badge-e" style={{ marginRight: '4px' }}>E</span> - Easy</span>
              <span><span className="ar-badge-difficulty ar-badge-m" style={{ marginRight: '4px' }}>M</span> - Moderate</span>
              <span><span className="ar-badge-difficulty ar-badge-h" style={{ marginRight: '4px' }}>H</span> - Hard</span>
            </div>

            {/* Form Fields Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', margin: '0 auto' }}>
              
              {/* 1. Select Language */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                  Select Language:
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value as Language);
                    setSelectedPassageId('');
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  <option value="english">English</option>
                  <option value="hindi_mangal">हिंदी - मंगल (Mangal Inscript)</option>
                  <option value="hindi_kruti">हिंदी - कुर्ती देव (Kruti Dev 010)</option>
                </select>
              </div>

              {/* 2. Select Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                  Select Date:
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedPassageId('');
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      fontWeight: 600,
                      color: '#0f172a',
                      flex: 1
                    }}
                  />
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedPassageId('');
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      backgroundColor: '#f8fafc',
                      outline: 'none',
                      color: '#475569'
                    }}
                  >
                    {availableIsoDates.map((d) => (
                      <option key={d} value={d}>
                        {toDisplayDate(d)} {d === '2026-10-25' ? '(AR Screenshot)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Select Passage (Custom Dropdown matching Screenshot 2) */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginTop: '10px' }}>
                  Select Passage:
                </label>
                
                <div style={{ position: 'relative', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => setIsPassageDropdownOpen(!isPassageDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: isPassageDropdownOpen ? '2px solid #000000' : '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      backgroundColor: selectedPassageId ? '#f0fdf4' : '#000000',
                      color: selectedPassageId ? '#0f172a' : '#ffffff',
                      fontWeight: 700,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                      {selectedPassageId ? currentSelectedPassage?.title : 'Select passage for typing'}
                    </span>
                    <span style={{ fontSize: '0.8rem' }}>▼</span>
                  </button>

                  {/* Dropdown Menu Popup (Screenshot 2) */}
                  {isPassageDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        zIndex: 50,
                        maxHeight: '280px',
                        overflowY: 'auto'
                      }}
                    >
                      {activePassageList.map((p) => {
                        const badge = getDifficultyBadge(p.difficulty);
                        const isSelected = p.id === selectedPassageId;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPassageId(p.id);
                              setIsPassageDropdownOpen(false);
                            }}
                            style={{
                              padding: '12px 14px',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f0fdf4' : 'transparent')}
                          >
                            <div style={{ flex: 1, paddingRight: '12px' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                                {p.title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                {p.wordCount} words • {p.category === 'up_police_co' ? 'UP Police CO' : 'UP Police ASI'}
                              </div>
                            </div>
                            <span className={`ar-badge-difficulty ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                        );
                      })}

                      {/* Clear Selection */}
                      <div
                        onClick={() => {
                          setSelectedPassageId('');
                          setIsPassageDropdownOpen(false);
                        }}
                        style={{
                          padding: '12px 14px',
                          color: '#dc2626',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: '#fff5f5'
                        }}
                      >
                        Clear Selection
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Time Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                  Time Duration:
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value, 10))}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  <option value={15}>15:00 min (Official UP Police)</option>
                  <option value={10}>10:00 min</option>
                  <option value={5}>05:00 min</option>
                </select>
              </div>

              {/* 5. Input Limit */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                  Input Limit:
                </label>
                <select
                  value={inputLimit}
                  onChange={(e) => setInputLimit(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  <option value="Words">Words (Official Exam Mode)</option>
                  <option value="Full Passage">Full Passage</option>
                </select>
              </div>

              {/* Action Button: Next (Screenshot 3) */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => {
                    const passToStart = currentSelectedPassage || activePassageList[0];
                    if (passToStart) {
                      onStartTest(passToStart, selectedDuration);
                    }
                  }}
                  className="btn"
                  style={{
                    backgroundColor: selectedPassageId ? '#0d9488' : '#94a3b8',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    padding: '12px 36px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: selectedPassageId ? '0 2px 6px rgba(13, 148, 136, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {selectedPassageId ? 'Start Typing Test' : 'Next'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: SPECIAL PASSAGES CARDS (Screenshot 4) */}
        {viewMode === 'special_cards' && (
          <div>
            {/* Top Navigation Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => setViewMode('ar_form')}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>←</span> Back to Date-wise Passages
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSelectedLanguage('english')}
                  className={`btn btn-sm ${selectedLanguage === 'english' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  English
                </button>
                <button
                  onClick={() => setSelectedLanguage('hindi_mangal')}
                  className={`btn btn-sm ${selectedLanguage === 'hindi_mangal' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  हिंदी मंगल
                </button>
                <button
                  onClick={() => setSelectedLanguage('hindi_kruti')}
                  className={`btn btn-sm ${selectedLanguage === 'hindi_kruti' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  कुर्ती देव
                </button>
              </div>
            </div>

            {/* Post Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setSelectedCategoryTab('all')}
                className={`btn btn-sm ${selectedCategoryTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All Special Passages ({specialPassages.length})
              </button>
              <button
                onClick={() => setSelectedCategoryTab('up_police_co')}
                className={`btn btn-sm ${selectedCategoryTab === 'up_police_co' ? 'btn-primary' : 'btn-secondary'}`}
              >
                UP Police Computer Operator
              </button>
              <button
                onClick={() => setSelectedCategoryTab('up_police_asi')}
                className={`btn btn-sm ${selectedCategoryTab === 'up_police_asi' ? 'btn-primary' : 'btn-secondary'}`}
              >
                UP Police ASI (Clerk/Acct)
              </button>
            </div>

            {/* Special Cards Grid (Screenshot 4) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '20px'
              }}
            >
              {specialPassages.map((passage, idx) => {
                const simulatedCount = 1000000 + ((idx * 137482) % 1500000);
                return (
                  <div
                    key={passage.id}
                    className="ar-special-card"
                    onClick={() => onStartTest(passage, selectedDuration)}
                  >
                    <div>
                      {/* Created Date */}
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        CREATED- {toDisplayDate(passage.date || '2026-10-25').toUpperCase()}
                      </div>

                      {/* Main Police Exam Header */}
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', lineHeight: 1.3 }}>
                        UP Police SI/ASI/Computer Oper...
                      </h3>

                      {/* Specific Topic Title */}
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0284c7', marginBottom: '16px' }}>
                        {passage.title}
                      </div>
                    </div>

                    <div>
                      {/* Words & Duration Row (Screenshot 4) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.9rem',
                          color: '#334155',
                          fontWeight: 600,
                          marginBottom: '16px'
                        }}
                      >
                        <span>{passage.wordCount} words</span>
                        <span>{passage.duration || 15}:00 min.</span>
                      </div>

                      {/* User Count Pill & Start Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div
                          style={{
                            background: '#000000',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>👤</span> {simulatedCount.toLocaleString()}
                        </div>

                        <button
                          className="btn btn-sm btn-primary"
                          style={{ fontWeight: 700 }}
                        >
                          Start Test →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
