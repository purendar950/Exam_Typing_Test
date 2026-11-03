import React, { useState, useMemo, useEffect } from 'react';
import { Passage, Language, ExamCategory, TestSettings, EvaluationResult } from '../types';
import { UserProfile } from '../services/firebase';

interface ChooseTestProps {
  passages: Passage[];
  onStartTest: (passage: Passage, customDurationMinutes?: number) => void;
  settings: TestSettings;
  onUpdateSettings: (newSettings: Partial<TestSettings>) => void;
  currentUser?: UserProfile | null;
  history?: EvaluationResult[];
  onOpenAuth?: () => void;
  onOpenDashboard?: () => void;
}

export const ChooseTest: React.FC<ChooseTestProps> = ({
  passages,
  onStartTest,
  settings,
  onUpdateSettings,
  currentUser,
  history = [],
  onOpenAuth,
  onOpenDashboard
}) => {
  // Mode: 'portal' (Fintech/EdTech Exam Series Portal) vs 'classic_form' (Legacy Date-wise Form)
  const [viewMode, setViewMode] = useState<'portal' | 'classic_form'>('portal');

  // Portal Filter States
  const [selectedExamTrack, setSelectedExamTrack] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [visibleCount, setVisibleCount] = useState<number>(18);

  // Classic Form States (Screenshots 2 & 3)
  const [classicLanguage, setClassicLanguage] = useState<Language>('english');
  const [classicDate, setClassicDate] = useState<string>('2026-10-26');
  const [classicPassageId, setClassicPassageId] = useState<string>('');
  const [classicDuration, setClassicDuration] = useState<number>(15);
  const [classicInputLimit, setClassicInputLimit] = useState<string>('Words');
  const [isClassicDropdownOpen, setIsClassicDropdownOpen] = useState<boolean>(false);
  const [isLoadingPassages, setIsLoadingPassages] = useState<boolean>(false);

  // Date converters
  const toDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Performance KPI calculations for Candidate Banner
  const kpiStats = useMemo(() => {
    const totalAttempted = history.length;
    if (totalAttempted === 0) {
      return {
        totalAttempted: 0,
        bestSpeed: 0,
        avgAccuracy: 0,
        isQualified: false,
        passedTestsCount: 0
      };
    }

    const speeds = history.map((h) => h.netWpm || 0);
    const bestSpeed = Math.round(Math.max(...speeds) * 10) / 10;
    const avgAccuracy = Math.round(
      history.reduce((sum, h) => sum + (h.accuracy || 0), 0) / totalAttempted
    );
    const passedTestsCount = history.filter((h) => h.isQualified).length;
    const isQualified = passedTestsCount > 0;

    return {
      totalAttempted,
      bestSpeed,
      avgAccuracy,
      isQualified,
      passedTestsCount
    };
  }, [history]);

  // Lookup map for test history by passage id or title
  const pastAttemptsMap = useMemo(() => {
    const map = new Map<string, { bestSpeed: number; bestAcc: number; isQualified: boolean; count: number }>();
    history.forEach((h) => {
      const key = h.testId || h.testTitle;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          bestSpeed: h.netWpm,
          bestAcc: h.accuracy,
          isQualified: h.isQualified,
          count: 1
        });
      } else {
        existing.bestSpeed = Math.max(existing.bestSpeed, h.netWpm);
        existing.bestAcc = Math.max(existing.bestAcc, h.accuracy);
        if (h.isQualified) existing.isQualified = true;
        existing.count += 1;
      }
    });
    return map;
  }, [history]);

  // Filtered passages for Portal Grid
  const filteredPortalPassages = useMemo(() => {
    return passages.filter((p) => {
      // Exam Track Filter
      if (selectedExamTrack === 'up_police_co' && p.category !== 'up_police_co') return false;
      if (selectedExamTrack === 'up_police_asi' && p.category !== 'up_police_asi') return false;
      if (selectedExamTrack === 'drills' && (p.duration > 5 && p.wordCount > 250)) return false;
      if (selectedExamTrack === 'mock15' && p.duration < 15 && p.wordCount < 400) return false;

      // Language Filter
      if (selectedLanguage !== 'all' && p.language !== selectedLanguage) return false;

      // Difficulty Filter
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = p.title.toLowerCase().includes(q);
        const textMatch = p.text.toLowerCase().includes(q);
        const dateMatch = p.date ? p.date.includes(q) : false;
        if (!titleMatch && !textMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [passages, selectedExamTrack, selectedLanguage, selectedDifficulty, searchQuery]);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(18);
  }, [selectedExamTrack, selectedLanguage, selectedDifficulty, searchQuery]);

  // Classic Form data helpers
  const classicLanguagePassages = useMemo(() => {
    return passages.filter((p) => p.language === classicLanguage);
  }, [passages, classicLanguage]);

  const classicAvailableDates = useMemo(() => {
    return Array.from(new Set(classicLanguagePassages.map((p) => p.date).filter(Boolean)))
      .sort()
      .reverse();
  }, [classicLanguagePassages]);

  useEffect(() => {
    if (classicAvailableDates.length > 0 && !classicAvailableDates.includes(classicDate)) {
      setClassicDate(classicAvailableDates[0]);
    }
  }, [classicAvailableDates, classicDate]);

  const classicActiveList = useMemo(() => {
    return classicLanguagePassages.filter((p) => p.date === classicDate);
  }, [classicLanguagePassages, classicDate]);

  const currentClassicSelectedPassage = useMemo(() => {
    if (!classicPassageId) return null;
    return classicActiveList.find((p) => p.id === classicPassageId) || null;
  }, [classicPassageId, classicActiveList]);

  const handleClassicLanguageChange = (newLang: Language) => {
    setIsLoadingPassages(true);
    setClassicLanguage(newLang);
    setClassicPassageId('');
    setTimeout(() => setIsLoadingPassages(false), 160);
  };

  const handleClassicDateChange = (newDate: string) => {
    setIsLoadingPassages(true);
    setClassicDate(newDate);
    setClassicPassageId('');
    setTimeout(() => setIsLoadingPassages(false), 160);
  };

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

  return (
    <div className="exam-portal-wrapper">
      <div className="container">

        {/* ========================================================
            VIEW MODE 1: MODERN FINTECH / EDTECH EXAM PORTAL
            ======================================================== */}
        {viewMode === 'portal' && (
          <div>
            {/* Candidate Overview & Performance KPI Strip */}
            <section className="exam-hero-banner">
              <div className="exam-hero-top">
                <div>
                  <h1 className="exam-hero-title">
                    <span>👮</span>
                    {currentUser ? (
                      <>Welcome, {currentUser.displayName}</>
                    ) : (
                      <>UP Police Typing Examination Portal</>
                    )}
                  </h1>
                  <div className="exam-hero-sub">
                    {currentUser ? (
                      <>
                        <span className="exam-hero-badge">Roll: {currentUser.rollNumber}</span>
                        <span>•</span>
                        <span>Post: {currentUser.category === 'up_police_asi' ? 'UP Police ASI' : 'UP Police Computer Operator'}</span>
                        <span>•</span>
                        <span
                          style={{ textDecoration: 'underline', cursor: 'pointer', color: '#bfdbfe' }}
                          onClick={onOpenDashboard}
                        >
                          View Dossier & Leaderboard →
                        </span>
                      </>
                    ) : (
                      <>
                        <span>UPPRPB Benchmark: Hindi 25 WPM (Mangal/Kruti) | English 30 WPM | 85% Accuracy</span>
                        <span>•</span>
                        <button
                          onClick={onOpenAuth}
                          style={{
                            background: '#ffffff',
                            color: '#0f2c59',
                            border: 'none',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Candidate Login / Sign-up 👤
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Switch to Classic AR Typing Form */}
                <button
                  onClick={() => setViewMode('classic_form')}
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Switch to Date-wise Dropdown Form"
                >
                  <span>📅</span> Classic Date Selector ☰
                </button>
              </div>

              {/* KPI Strip */}
              <div className="exam-kpi-grid">
                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Tests Attempted</div>
                  <div className="exam-kpi-value">{kpiStats.totalAttempted}</div>
                  <div className="exam-kpi-hint">
                    {kpiStats.totalAttempted > 0 ? `${kpiStats.passedTestsCount} passed` : 'Start your first mock test'}
                  </div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Top Net Speed</div>
                  <div className="exam-kpi-value">
                    {kpiStats.bestSpeed > 0 ? `${kpiStats.bestSpeed} WPM` : '--'}
                  </div>
                  <div className="exam-kpi-hint">Pass Target: 25 Hindi / 30 Eng</div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Avg. Accuracy</div>
                  <div className="exam-kpi-value">
                    {kpiStats.avgAccuracy > 0 ? `${kpiStats.avgAccuracy}%` : '--'}
                  </div>
                  <div className="exam-kpi-hint">Min. Benchmark: ≥ 85.0%</div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">UPPRPB Status</div>
                  <div
                    className="exam-kpi-value"
                    style={{
                      fontSize: '1.25rem',
                      color: kpiStats.isQualified ? '#86efac' : '#fde047'
                    }}
                  >
                    {kpiStats.isQualified ? 'QUALIFIED 🟢' : kpiStats.totalAttempted > 0 ? 'PREPARING 🟡' : 'READY TO TEST'}
                  </div>
                  <div className="exam-kpi-hint">
                    {kpiStats.isQualified ? 'Meets official standards' : 'Requires 85% Acc + Speed'}
                  </div>
                </div>
              </div>
            </section>

            {/* Exam Track Segmented Tabs */}
            <div className="exam-track-tabs">
              <button
                className={`exam-track-tab ${selectedExamTrack === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedExamTrack('all')}
              >
                <span>🎯</span> All Test Series
                <span className="exam-track-count">{passages.length}</span>
              </button>
              <button
                className={`exam-track-tab ${selectedExamTrack === 'up_police_co' ? 'active' : ''}`}
                onClick={() => setSelectedExamTrack('up_police_co')}
              >
                <span>👮</span> UP Police Computer Operator
                <span className="exam-track-count">
                  {passages.filter((p) => p.category === 'up_police_co').length}
                </span>
              </button>
              <button
                className={`exam-track-tab ${selectedExamTrack === 'up_police_asi' ? 'active' : ''}`}
                onClick={() => setSelectedExamTrack('up_police_asi')}
              >
                <span>📑</span> UP Police ASI (Clerk/Acct)
                <span className="exam-track-count">
                  {passages.filter((p) => p.category === 'up_police_asi').length}
                </span>
              </button>
              <button
                className={`exam-track-tab ${selectedExamTrack === 'mock15' ? 'active' : ''}`}
                onClick={() => setSelectedExamTrack('mock15')}
              >
                <span>⏱️</span> 15-Min Official Mocks
                <span className="exam-track-count">
                  {passages.filter((p) => p.duration >= 15 || p.wordCount >= 400).length}
                </span>
              </button>
              <button
                className={`exam-track-tab ${selectedExamTrack === 'drills' ? 'active' : ''}`}
                onClick={() => setSelectedExamTrack('drills')}
              >
                <span>⚡</span> Rapid Drills (2-5 Min)
                <span className="exam-track-count">
                  {passages.filter((p) => p.duration <= 5 || p.wordCount <= 300).length}
                </span>
              </button>
            </div>

            {/* Fintech Filter Toolbar */}
            <div className="exam-toolbar">
              {/* Row 1: Language & Difficulty Filters */}
              <div className="exam-toolbar-row">
                {/* Language Pills */}
                <div className="exam-filter-group">
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
                    Language:
                  </span>
                  <button
                    className={`exam-filter-chip ${selectedLanguage === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage('all')}
                  >
                    All Languages
                  </button>
                  <button
                    className={`exam-filter-chip ${selectedLanguage === 'english' ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage('english')}
                  >
                    🇬🇧 English (30 WPM)
                  </button>
                  <button
                    className={`exam-filter-chip ${selectedLanguage === 'hindi_mangal' ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage('hindi_mangal')}
                  >
                    🇮🇳 हिंदी मंगल (25 WPM)
                  </button>
                  <button
                    className={`exam-filter-chip ${selectedLanguage === 'hindi_kruti' ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage('hindi_kruti')}
                  >
                    🇮🇳 कुर्ती देव 010 (25 WPM)
                  </button>
                </div>

                {/* Duration Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                    Timer:
                  </span>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value={15}>15 Min (UPPRPB Exam Standard)</option>
                    <option value={10}>10 Min</option>
                    <option value={5}>5 Min (Speed Drill)</option>
                    <option value={2}>2 Min (Sprint)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Difficulty Chips & Live Search Box */}
              <div className="exam-toolbar-row">
                {/* Difficulty Chips */}
                <div className="exam-filter-group">
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
                    Difficulty:
                  </span>
                  <button
                    className={`exam-filter-chip ${selectedDifficulty === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('all')}
                  >
                    All
                  </button>
                  <button
                    className={`exam-filter-chip ${selectedDifficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('easy')}
                  >
                    🟢 Easy
                  </button>
                  <button
                    className={`exam-filter-chip ${selectedDifficulty === 'medium' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('medium')}
                  >
                    🟡 Moderate
                  </button>
                  <button
                    className={`exam-filter-chip ${selectedDifficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setSelectedDifficulty('hard')}
                  >
                    🔴 Hard
                  </button>
                </div>

                {/* Instant Search Box */}
                <div className="exam-search-box">
                  <svg
                    className="exam-search-icon"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="exam-search-input"
                    placeholder="Search mock test by topic, title or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: '0.9rem'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Test Cards Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                Available Examination Tests ({filteredPortalPassages.length})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Showing {Math.min(visibleCount, filteredPortalPassages.length)} of {filteredPortalPassages.length}
              </div>
            </div>

            {/* Test Cards Grid */}
            {filteredPortalPassages.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  No matching tests found
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>
                  Try resetting your filters or search keywords to view all available tests.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedExamTrack('all');
                    setSelectedLanguage('all');
                    setSelectedDifficulty('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="exam-grid">
                {filteredPortalPassages.slice(0, visibleCount).map((passage, idx) => {
                  const past = pastAttemptsMap.get(passage.id) || pastAttemptsMap.get(passage.title);
                  const simulatedCandidates = 14200 + ((idx * 843) % 19500);

                  return (
                    <div
                      key={passage.id}
                      className="exam-test-card"
                      onClick={() => onStartTest(passage, selectedDuration)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        {/* Badges Row */}
                        <div className="exam-card-badges">
                          <span
                            className={`exam-tag ${
                              passage.category === 'up_police_asi' ? 'exam-tag-asi' : 'exam-tag-co'
                            }`}
                          >
                            {passage.category === 'up_police_asi' ? 'UP Police ASI' : 'UP Police CO'}
                          </span>

                          <span
                            className={`exam-tag ${
                              passage.language === 'english' ? 'exam-tag-lang-en' : 'exam-tag-lang-hi'
                            }`}
                          >
                            {passage.language === 'english'
                              ? 'English'
                              : passage.language === 'hindi_mangal'
                              ? 'मंगल'
                              : 'कुर्ती देव'}
                          </span>

                          <span
                            className={`exam-tag ${
                              passage.difficulty === 'easy'
                                ? 'exam-tag-diff-easy'
                                : passage.difficulty === 'hard'
                                ? 'exam-tag-diff-hard'
                                : 'exam-tag-diff-medium'
                            }`}
                          >
                            {passage.difficulty.toUpperCase()}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="exam-card-title" title={passage.title}>
                          {passage.title}
                        </h3>

                        {/* Date */}
                        <div className="exam-card-date">
                          📅 {toDisplayDate(passage.date || '2026-10-26')} • UPPRPB Pattern Mock
                        </div>

                        {/* Stats Row */}
                        <div className="exam-card-stats">
                          <div className="exam-card-stat">
                            <div className="exam-card-stat-label">Duration</div>
                            <div className="exam-card-stat-val">{selectedDuration}:00m</div>
                          </div>
                          <div className="exam-card-stat">
                            <div className="exam-card-stat-label">Words</div>
                            <div className="exam-card-stat-val">{passage.wordCount}</div>
                          </div>
                          <div className="exam-card-stat">
                            <div className="exam-card-stat-label">Min. Acc</div>
                            <div className="exam-card-stat-val">85%</div>
                          </div>
                        </div>

                        {/* Past Performance Chip */}
                        {past ? (
                          <div
                            className={`exam-card-past-score ${
                              past.isQualified ? 'exam-score-passed' : 'exam-score-failed'
                            }`}
                          >
                            <span>
                              ✓ {past.isQualified ? 'Qualified' : 'Attempted'} • Best: {past.bestSpeed} WPM ({past.bestAcc}%)
                            </span>
                            <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                              {past.count} {past.count === 1 ? 'try' : 'tries'}
                            </span>
                          </div>
                        ) : (
                          <div className="exam-card-past-score exam-score-not-attempted">
                            <span>○ Not yet attempted</span>
                            <span style={{ fontSize: '0.68rem' }}>Ready to test</span>
                          </div>
                        )}
                      </div>

                      {/* Footer & CTA */}
                      <div className="exam-card-footer">
                        <div className="exam-card-attempts">
                          <span>👥</span> {simulatedCandidates.toLocaleString()}
                        </div>
                        <button
                          className="exam-start-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTest(passage, selectedDuration);
                          }}
                        >
                          {past ? 'Retest ↺' : 'Start Test →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < filteredPortalPassages.length && (
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setVisibleCount((prev) => prev + 18)}
                  style={{
                    fontWeight: 700,
                    padding: '10px 28px',
                    borderRadius: '8px'
                  }}
                >
                  Load More Tests ({filteredPortalPassages.length - visibleCount} remaining) ↓
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            VIEW MODE 2: CLASSIC DATE-WISE FORM (AR TYPING REPLICA)
            ======================================================== */}
        {viewMode === 'classic_form' && (
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setViewMode('portal')}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>←</span> Back to Exam Series Portal
              </button>
            </div>

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
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                  onClick={() => setViewMode('portal')}
                  className="btn"
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    padding: '12px 28px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  View All Exam Test Cards (Fintech Grid)
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                  margin: '20px 0',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ padding: '0 16px' }}>CLASSIC DATE-WISE PASSAGE SELECTOR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              {/* Difficulty Legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '24px',
                  fontSize: '0.85rem',
                  color: '#475569',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-b">B</span> - Basic
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-e">E</span> - Easy
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-m">M</span> - Moderate
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="ar-badge-difficulty ar-badge-h">H</span> - Hard
                </span>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Select Language */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                    Select Language:
                  </label>
                  <select
                    value={classicLanguage}
                    onChange={(e) => handleClassicLanguageChange(e.target.value as Language)}
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
                    <option value="english">English (UP Police CO & ASI - 30+ WPM)</option>
                    <option value="hindi_mangal">हिंदी - मंगल इनस्क्रिप्ट (Mangal Inscript - 25+ WPM)</option>
                    <option value="hindi_kruti">हिंदी - कुर्ती देव (Kruti Dev 010 - 25+ WPM)</option>
                  </select>
                </div>

                {/* 2. Select Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                    Select Date:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={classicDate}
                      onChange={(e) => handleClassicDateChange(e.target.value)}
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
                        flex: '1 1 180px'
                      }}
                    />
                    <select
                      value={classicDate}
                      onChange={(e) => handleClassicDateChange(e.target.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        backgroundColor: '#f8fafc',
                        outline: 'none',
                        fontWeight: 600,
                        color: '#1e293b',
                        flex: '1 1 200px'
                      }}
                    >
                      {classicAvailableDates.map((d, idx) => (
                        <option key={d} value={d}>
                          {toDisplayDate(d)} {idx === 0 ? '(Latest Passage)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Select Passage */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'flex-start', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', paddingTop: '10px' }}>
                    Select Passage:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div
                      onClick={() => !isLoadingPassages && setIsClassicDropdownOpen(!isClassicDropdownOpen)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        backgroundColor: isLoadingPassages ? '#f1f5f9' : '#ffffff',
                        cursor: isLoadingPassages ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: currentClassicSelectedPassage ? 700 : 500,
                        color: currentClassicSelectedPassage ? '#0f172a' : '#64748b',
                        boxShadow: isClassicDropdownOpen ? '0 0 0 2px rgba(2, 132, 199, 0.2)' : 'none'
                      }}
                    >
                      <span>
                        {isLoadingPassages
                          ? 'Loading passages...'
                          : currentClassicSelectedPassage
                          ? `${currentClassicSelectedPassage.title} (${currentClassicSelectedPassage.wordCount} words)`
                          : `Select Passage (${classicActiveList.length} available)`}
                      </span>
                      <span>▼</span>
                    </div>

                    {isClassicDropdownOpen && !isLoadingPassages && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          zIndex: 50,
                          maxHeight: '260px',
                          overflowY: 'auto'
                        }}
                      >
                        {classicActiveList.map((p) => {
                          const badge = getDifficultyBadge(p.difficulty);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setClassicPassageId(p.id);
                                setIsClassicDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 14px',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: classicPassageId === p.id ? '#f0f9ff' : 'transparent'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`ar-badge-difficulty ${badge.cls}`}>{badge.label}</span>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.title}</span>
                              </div>
                              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                {p.wordCount} words
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Select Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                    Select Duration:
                  </label>
                  <select
                    value={classicDuration}
                    onChange={(e) => setClassicDuration(Number(e.target.value))}
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
                    <option value={15}>15:00 min (Official UP Police Benchmark)</option>
                    <option value={10}>10:00 min</option>
                    <option value={5}>05:00 min (Quick Drill)</option>
                  </select>
                </div>

                {/* 5. Input Limit */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                    Input Limit:
                  </label>
                  <select
                    value={classicInputLimit}
                    onChange={(e) => setClassicInputLimit(e.target.value)}
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

                {/* Start Button */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const passToStart = currentClassicSelectedPassage || classicActiveList[0];
                      if (passToStart) {
                        onStartTest(passToStart, classicDuration);
                      }
                    }}
                    disabled={classicActiveList.length === 0}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 36px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '8px'
                    }}
                  >
                    {classicPassageId ? 'Start Typing Test →' : 'Start Latest Test →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
