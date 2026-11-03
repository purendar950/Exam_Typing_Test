import React, { useState, useMemo, useEffect } from 'react';
import { Passage, Language, ExamCategory, TestSettings, EvaluationResult } from '../types';
import { UserProfile } from '../services/firebase';
import appLogo from '../assets/logo.png';

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

// Level 1: Exam Definition Interface
interface ExamCourse {
  id: string;
  title: string;
  shortTitle: string;
  emblemEmoji: string;
  badge: string;
  passingBenchmark: string;
  categoryFilter?: ExamCategory | 'all' | 'drills' | 'mock15';
  description: string;
}

// Level 2: Mode Definition Interface
interface ExamMode {
  id: string;
  title: string;
  icon: string;
  bg: string;
  border: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  languageFilter?: Language | 'all';
  durationFilter?: number;
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
  // Navigation: 1 (All Exams), 2 (Medium / Mode Selection), 3 (Test Material Grid), or 'classic_form'
  const [navLevel, setNavLevel] = useState<1 | 2 | 3 | 'classic_form'>(1);
  const [activeExamId, setActiveExamId] = useState<string>('up_police_co');
  const [activeModeId, setActiveModeId] = useState<string>('english');

  // Level 3 Filter states
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [visibleCount, setVisibleCount] = useState<number>(18);

  // Classic Form states
  const [classicLanguage, setClassicLanguage] = useState<Language>('english');
  const [classicDate, setClassicDate] = useState<string>('2026-10-26');
  const [classicPassageId, setClassicPassageId] = useState<string>('');
  const [classicDuration, setClassicDuration] = useState<number>(15);
  const [classicInputLimit, setClassicInputLimit] = useState<string>('Words');
  const [isClassicDropdownOpen, setIsClassicDropdownOpen] = useState<boolean>(false);
  const [isLoadingPassages, setIsLoadingPassages] = useState<boolean>(false);

  // Date converter
  const toDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Dynamic actual passage statistics from database
  const coCount = useMemo(() => passages.filter((p) => p.category === 'up_police_co').length, [passages]);
  const asiCount = useMemo(() => passages.filter((p) => p.category === 'up_police_asi').length, [passages]);
  const engCount = useMemo(() => passages.filter((p) => p.language === 'english').length, [passages]);
  const mangalCount = useMemo(() => passages.filter((p) => p.language === 'hindi_mangal').length, [passages]);
  const krutiCount = useMemo(() => passages.filter((p) => p.language === 'hindi_kruti').length, [passages]);
  const mock15Count = useMemo(() => passages.filter((p) => p.duration >= 15 || p.wordCount >= 400).length, [passages]);
  const drillsCount = useMemo(() => passages.filter((p) => p.duration <= 5 || p.wordCount <= 300).length, [passages]);

  // Exam Courses (Matching TestMentor Screenshot with Actual Data)
  const EXAM_COURSES: ExamCourse[] = useMemo(
    () => [
      {
        id: 'up_police_co',
        title: 'UP Police (UPPRPB) SI, ASI, Computer Operator Typing Tests',
        shortTitle: 'UP Police Computer Operator',
        emblemEmoji: '👮',
        badge: `${coCount} Tests Available`,
        passingBenchmark: 'Hindi 25 WPM • English 30 WPM • 85% Acc',
        categoryFilter: 'up_police_co',
        description: 'Official Grade-A & ASI test series on Mangal Inscript, Kruti Dev & English.'
      },
      {
        id: 'up_police_asi',
        title: 'UP Police ASI (Clerk, Accounts & Confidential) Typing Tests',
        shortTitle: 'UP Police ASI Ministerial',
        emblemEmoji: '📑',
        badge: `${asiCount} Tests Available`,
        passingBenchmark: 'Hindi 25 WPM • English 30 WPM • 85% Acc',
        categoryFilter: 'up_police_asi',
        description: 'Special administrative, legal and police clerical test passages.'
      },
      {
        id: 'upsssc',
        title: 'UPSSSC Junior Assistant Typing Skill Test Series',
        shortTitle: 'UPSSSC Junior Assistant',
        emblemEmoji: '🏛️',
        badge: `${mangalCount + engCount} Tests Available`,
        passingBenchmark: 'Hindi 25 WPM • English 30 WPM • 85% Acc',
        categoryFilter: 'all',
        description: 'Government Secretariat & Departmental clerical typing passages.'
      },
      {
        id: 'allahabad_hc',
        title: 'ALLAHABAD HC JA & Paid Apprentices & Steno Typing Tests',
        shortTitle: 'Allahabad High Court (RO/ARO/JA)',
        emblemEmoji: '⚖️',
        badge: `${krutiCount + engCount} Tests Available`,
        passingBenchmark: '25 WPM Hindi • 30 WPM English',
        categoryFilter: 'all',
        description: 'High Court legal judgment & gazette editorial typing practice.'
      },
      {
        id: 'ssc_chsl',
        title: 'SSC CHSL 2024-2025 Typing Test Series',
        shortTitle: 'SSC CHSL / CGL Tier-II',
        emblemEmoji: '🏢',
        badge: `${engCount} Tests Available`,
        passingBenchmark: '35 WPM English • 30 WPM Hindi',
        categoryFilter: 'all',
        description: 'Staff Selection Commission standard 10-min & 15-min speed test modules.'
      },
      {
        id: 'delhi_police',
        title: 'Delhi Police Typing Course Test Series',
        shortTitle: 'Delhi Police HCM / AWO',
        emblemEmoji: '🛡️',
        badge: `${passages.length} Tests Available`,
        passingBenchmark: '30 WPM English • 25 WPM Hindi',
        categoryFilter: 'all',
        description: 'Head Constable Ministerial & Wireless Operator typing evaluation.'
      },
      {
        id: 'mock15',
        title: 'UP Police Full Length 15-Minute Official Mocks',
        shortTitle: '15-Min Official Exam Mocks',
        emblemEmoji: '⏱️',
        badge: `${mock15Count} Full Mocks`,
        passingBenchmark: '15:00 Strict Timer • 85% Accuracy',
        categoryFilter: 'mock15',
        description: 'Official 15-minute simulated exam hall environment with real evaluation.'
      },
      {
        id: 'drills',
        title: '2-Min & 5-Min Rapid Weak-Keys & Speed Booster Drills',
        shortTitle: 'Speed & Accuracy Drills',
        emblemEmoji: '⚡',
        badge: `${drillsCount > 0 ? drillsCount : 24} Speed Drills`,
        passingBenchmark: 'High-frequency weak keys & error correction',
        categoryFilter: 'drills',
        description: 'Quick sprint drills designed to eliminate typos and boost finger agility.'
      }
    ],
    [coCount, asiCount, engCount, mangalCount, krutiCount, mock15Count, drillsCount, passages.length]
  );

  // Active Exam Object
  const currentExam = useMemo(() => {
    return EXAM_COURSES.find((e) => e.id === activeExamId) || EXAM_COURSES[0];
  }, [EXAM_COURSES, activeExamId]);

  // Level 2 Modes (English, Hindi Mangal, Hindi Kruti, Live Simulation, Practice Drills, Study Material)
  const EXAM_MODES: ExamMode[] = useMemo(
    () => [
      {
        id: 'english',
        title: 'English Typing Tests',
        icon: '🇬🇧',
        bg: '#eff6ff',
        border: '#bfdbfe',
        badge: `${engCount} Tests • 30 WPM`,
        badgeColor: '#1d4ed8',
        badgeBg: '#dbeafe',
        description: 'Standard 30 WPM UPPRPB qualifying passages on English QWERTY keyboard.',
        languageFilter: 'english',
        durationFilter: 15
      },
      {
        id: 'hindi_mangal',
        title: 'हिंदी मंगल (Mangal Inscript)',
        icon: '🇮🇳',
        bg: '#fef3c7',
        border: '#fde68a',
        badge: `${mangalCount} Tests • 25 WPM`,
        badgeColor: '#b45309',
        badgeBg: '#fef3c7',
        description: 'Official 25 WPM benchmark with Inscript layout & halant conjunct rules.',
        languageFilter: 'hindi_mangal',
        durationFilter: 15
      },
      {
        id: 'hindi_kruti',
        title: 'हिंदी कुर्ती देव (Kruti Dev 010)',
        icon: '🇮🇳',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        badge: `${krutiCount} Tests • 25 WPM`,
        badgeColor: '#15803d',
        badgeBg: '#dcfce7',
        description: 'Traditional Remington Hindi layout with authentic character codes.',
        languageFilter: 'hindi_kruti',
        durationFilter: 15
      },
      {
        id: 'live_mock',
        title: 'Live Exam Hall Simulation',
        icon: '🔴',
        bg: '#fef2f2',
        border: '#fecaca',
        badge: `${mock15Count} Tests • 15:00 Strict`,
        badgeColor: '#b91c1c',
        badgeBg: '#fee2e2',
        description: 'Full 15-minute countdown, strict UP Police evaluation formula & full-screen mode.',
        languageFilter: 'all',
        durationFilter: 15
      },
      {
        id: 'drills',
        title: 'Daily Practice & Speed Boosters',
        icon: '⚡',
        bg: '#faf5ff',
        border: '#e9d5ff',
        badge: `${drillsCount > 0 ? drillsCount : 24} Drills • 2 & 5 Min`,
        badgeColor: '#7e22ce',
        badgeBg: '#f3e8ff',
        description: 'Short targeted drills focusing on weak keys, punctuation, and number rows.',
        languageFilter: 'all',
        durationFilter: 5
      },
      {
        id: 'study',
        title: 'Study Material & Special Key Codes',
        icon: '📖',
        bg: '#f8fafc',
        border: '#cbd5e1',
        badge: 'Official Rules & ALT Codes',
        badgeColor: '#334155',
        badgeBg: '#e2e8f0',
        description: 'Official UPPRPB evaluation formula, Mangal/Kruti shortcuts & finger guides.',
        languageFilter: 'all',
        durationFilter: 15
      }
    ],
    [engCount, mangalCount, krutiCount, mock15Count, drillsCount]
  );

  // Active Mode Object
  const currentMode = useMemo(() => {
    return EXAM_MODES.find((m) => m.id === activeModeId) || EXAM_MODES[0];
  }, [EXAM_MODES, activeModeId]);

  // Overall KPI statistics
  const kpiStats = useMemo(() => {
    const totalAttempted = history.length;
    if (totalAttempted === 0) {
      return { totalAttempted: 0, bestSpeed: 0, avgAccuracy: 0, isQualified: false, passedTestsCount: 0 };
    }
    const speeds = history.map((h) => h.netWpm || 0);
    const bestSpeed = Math.round(Math.max(...speeds) * 10) / 10;
    const avgAccuracy = Math.round(history.reduce((sum, h) => sum + (h.accuracy || 0), 0) / totalAttempted);
    const passedTestsCount = history.filter((h) => h.isQualified).length;
    return { totalAttempted, bestSpeed, avgAccuracy, isQualified: passedTestsCount > 0, passedTestsCount };
  }, [history]);

  // Past Attempts Map
  const pastAttemptsMap = useMemo(() => {
    const map = new Map<string, { bestSpeed: number; bestAcc: number; isQualified: boolean; count: number }>();
    history.forEach((h) => {
      const key = h.testId || h.testTitle;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { bestSpeed: h.netWpm, bestAcc: h.accuracy, isQualified: h.isQualified, count: 1 });
      } else {
        existing.bestSpeed = Math.max(existing.bestSpeed, h.netWpm);
        existing.bestAcc = Math.max(existing.bestAcc, h.accuracy);
        if (h.isQualified) existing.isQualified = true;
        existing.count += 1;
      }
    });
    return map;
  }, [history]);

  // Filtered passages for Level 3
  const filteredLevel3Passages = useMemo(() => {
    return passages.filter((p) => {
      // 1. Exam Filter
      if (currentExam.categoryFilter === 'up_police_co' && p.category !== 'up_police_co') return false;
      if (currentExam.categoryFilter === 'up_police_asi' && p.category !== 'up_police_asi') return false;
      if (currentExam.categoryFilter === 'drills' && (p.duration > 5 && p.wordCount > 250)) return false;
      if (currentExam.categoryFilter === 'mock15' && p.duration < 15 && p.wordCount < 400) return false;

      // 2. Mode Filter
      if (currentMode.languageFilter && currentMode.languageFilter !== 'all') {
        if (p.language !== currentMode.languageFilter) return false;
      }
      if (currentMode.id === 'drills' && p.duration > 5 && p.wordCount > 300) {
        return false;
      }

      // 3. Difficulty Filter
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = p.title.toLowerCase().includes(q);
        const textMatch = p.text.toLowerCase().includes(q);
        const dateMatch = p.date ? p.date.includes(q) : false;
        if (!titleMatch && !textMatch && dateMatch === false) return false;
      }

      return true;
    });
  }, [passages, currentExam, currentMode, selectedDifficulty, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(18);
  }, [activeExamId, activeModeId, selectedDifficulty, searchQuery]);

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
            TOP BRAND & STATS BAR (TestMentor Style Replica)
            ======================================================== */}
        <div className="testmentor-trust-bar">
          <div className="testmentor-brand-info">
            <img
              src={appLogo}
              alt="Exam Typing"
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 3px 10px rgba(2, 132, 199, 0.35)',
                border: '2px solid #38bdf8',
                flexShrink: 0
              }}
            />
            <div>
              <div className="testmentor-brand-title">Exam Typing</div>
              <div className="testmentor-brand-sub">
                Typing Practice for Competitive Exams • UP Police & Government Aspirants
              </div>
            </div>
          </div>

          <div className="testmentor-metrics-row">
            <div className="testmentor-metric-pill">
              <span style={{ fontSize: '1.2rem' }}>📚</span>
              <div>
                <div className="testmentor-metric-val">{passages.length} Official Tests</div>
                <div className="testmentor-metric-lbl">Passage Bank Available</div>
              </div>
            </div>

            <div className="testmentor-metric-pill">
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <div>
                <div className="testmentor-metric-val">
                  {kpiStats.totalAttempted > 0 ? `${kpiStats.totalAttempted} Attempted` : '85% Accuracy'}
                </div>
                <div className="testmentor-metric-lbl">
                  {kpiStats.totalAttempted > 0 ? `${kpiStats.passedTestsCount} Tests Passed` : 'UPPRPB Benchmark'}
                </div>
              </div>
            </div>

            <div className="testmentor-metric-pill">
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <div>
                <div className="testmentor-metric-val">
                  {kpiStats.bestSpeed > 0 ? `${kpiStats.bestSpeed} WPM Best` : '25 / 30 WPM'}
                </div>
                <div className="testmentor-metric-lbl">
                  {kpiStats.bestSpeed > 0 ? `Avg: ${kpiStats.avgAccuracy}% Accuracy` : 'Hindi & English Pass'}
                </div>
              </div>
            </div>

            {/* Candidate profile or login trigger */}
            {currentUser ? (
              <div
                className="testmentor-metric-pill"
                onClick={onOpenDashboard}
                style={{ cursor: 'pointer', background: '#f0fdf4', borderColor: '#86efac' }}
                title="Click to view candidate statistics & examination dossier"
              >
                <span style={{ fontSize: '1.2rem' }}>👤</span>
                <div>
                  <div className="testmentor-metric-val" style={{ color: '#166534' }}>
                    {currentUser.displayName}
                  </div>
                  <div className="testmentor-metric-lbl" style={{ color: '#15803d' }}>
                    Roll: {currentUser.rollNumber} • Dossier →
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn btn-sm btn-primary"
                style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: 700 }}
              >
                Candidate Login 👤
              </button>
            )}

            {/* Classic Date Selector Toggle */}
            <button
              onClick={() => setNavLevel(navLevel === 'classic_form' ? 1 : 'classic_form')}
              className="btn btn-sm btn-secondary"
              style={{ borderRadius: '10px', padding: '8px 14px', fontWeight: 600, fontSize: '0.8rem' }}
              title="Toggle classic date-wise passage selector"
            >
              {navLevel === 'classic_form' ? '← Back to Courses' : '📅 Classic Date Selector ☰'}
            </button>
          </div>
        </div>

        {/* ========================================================
            LEVEL 1: "ALL COURSES" EXAM GRID (TestMentor Screen)
            ======================================================== */}
        {navLevel === 1 && (
          <div>
            {/* Candidate Performance KPI Strip */}
            <section className="exam-hero-banner" style={{ padding: '22px 26px', marginBottom: '24px' }}>
              <div className="exam-hero-top" style={{ marginBottom: '14px' }}>
                <div>
                  <h2 className="exam-hero-title" style={{ fontSize: '1.25rem' }}>
                    <span>🎯</span> Examination Performance Overview
                  </h2>
                  <div className="exam-hero-sub">
                    <span>Target: UP Police Computer Operator Grade-A & ASI (2024-2026)</span>
                  </div>
                </div>
              </div>

              <div className="exam-kpi-grid">
                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Tests Attempted</div>
                  <div className="exam-kpi-value">{kpiStats.totalAttempted}</div>
                  <div className="exam-kpi-hint">
                    {kpiStats.totalAttempted > 0 ? `${kpiStats.passedTestsCount} qualified` : 'Start your first exam series'}
                  </div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Top Net Speed</div>
                  <div className="exam-kpi-value">
                    {kpiStats.bestSpeed > 0 ? `${kpiStats.bestSpeed} WPM` : '--'}
                  </div>
                  <div className="exam-kpi-hint">Target: 25 Hindi / 30 English</div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">Avg. Accuracy</div>
                  <div className="exam-kpi-value">
                    {kpiStats.avgAccuracy > 0 ? `${kpiStats.avgAccuracy}%` : '--'}
                  </div>
                  <div className="exam-kpi-hint">Passing standard: ≥ 85.0%</div>
                </div>

                <div className="exam-kpi-card">
                  <div className="exam-kpi-label">UPPRPB Status</div>
                  <div
                    className="exam-kpi-value"
                    style={{
                      fontSize: '1.15rem',
                      color: kpiStats.isQualified ? '#86efac' : '#fde047'
                    }}
                  >
                    {kpiStats.isQualified ? 'QUALIFIED 🟢' : kpiStats.totalAttempted > 0 ? 'PREPARING 🟡' : 'READY TO TEST'}
                  </div>
                  <div className="exam-kpi-hint">Official UPPRPB benchmark</div>
                </div>
              </div>
            </section>

            {/* "All Courses" Header (TestMentor Replica) */}
            <div className="testmentor-courses-header">
              <h2 className="testmentor-courses-title">
                <span>📚</span> All Courses & Typing Test Series
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                Select an exam course to explore Hindi, English, Live Mocks & Drills
              </span>
            </div>

            {/* TestMentor Multi-column Exam Grid */}
            <div className="testmentor-grid">
              {EXAM_COURSES.map((course) => (
                <div
                  key={course.id}
                  className="testmentor-exam-card"
                  onClick={() => {
                    setActiveExamId(course.id);
                    setNavLevel(2);
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="testmentor-emblem-wrap">
                      <span>{course.emblemEmoji}</span>
                    </div>
                    <div className="testmentor-exam-title">{course.title}</div>
                  </div>

                  <div style={{ width: '100%', marginTop: '8px' }}>
                    <div className="testmentor-exam-badge">{course.badge}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Yearly Pass / Feature Banner (TestMentor Screen Bottom) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1.5px solid #86efac',
                borderRadius: '16px',
                padding: '28px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#166534',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}
                >
                  🏆 UP POLICE COMPUTER OPERATOR (GRADE-A) TYPING PASS
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#14532d', marginBottom: '6px' }}>
                  Complete Exam Hall Typing Preparation
                </h3>
                <p style={{ color: '#166534', fontSize: '0.9rem', maxWidth: '640px', lineHeight: 1.5 }}>
                  Practice real exam-hall passages in Hindi (Mangal Inscript & Kruti Dev 010) and English with instant
                  evaluation of Gross Speed, Net Speed, Full/Half Mistakes, and 85% Accuracy check.
                </p>
              </div>

              <button
                className="btn btn-success"
                onClick={() => {
                  setActiveExamId('up_police_co');
                  setNavLevel(2);
                }}
                style={{ padding: '12px 28px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                Explore UP Police CO Series →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            LEVEL 2: EXAM HUB & MODE SELECTION (English, Hindi, Live, Practice)
            ======================================================== */}
        {navLevel === 2 && (
          <div>
            {/* Breadcrumb Bar */}
            <div className="level-breadcrumb-bar">
              <span className="level-breadcrumb-link" onClick={() => setNavLevel(1)}>
                🏠 All Courses
              </span>
              <span className="level-breadcrumb-sep">/</span>
              <span className="level-breadcrumb-current">{currentExam.shortTitle}</span>
            </div>

            {/* Exam Hero Card */}
            <div className="level2-hero-card">
              <div className="level2-exam-info">
                <div className="level2-exam-emblem">
                  <span>{currentExam.emblemEmoji}</span>
                </div>
                <div>
                  <h2 className="level2-exam-title">{currentExam.title}</h2>
                  <div className="level2-exam-benchmarks">
                    <span className="level2-bench-badge">🎯 {currentExam.passingBenchmark}</span>
                    <span className="level2-bench-badge">⏱️ 15 Mins Exam Duration</span>
                    <span className="level2-bench-badge">📝 85% Accuracy Mandatory</span>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setNavLevel(1)}
                style={{ fontWeight: 700, borderRadius: '8px', padding: '8px 16px' }}
              >
                ← Back to All Courses
              </button>
            </div>

            {/* Modes Header */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                Select Medium or Practice Mode
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Choose whether you want to practice in English, Hindi Mangal, Hindi Kruti, Live Simulation, or Drills.
              </p>
            </div>

            {/* 6 Mode Cards Grid */}
            <div className="level2-mode-grid">
              {EXAM_MODES.map((mode) => (
                <div
                  key={mode.id}
                  className="level2-mode-card"
                  onClick={() => {
                    setActiveModeId(mode.id);
                    if (mode.id === 'drills') {
                      setSelectedDuration(5);
                    } else if (mode.id === 'live_mock') {
                      setSelectedDuration(15);
                    }
                    setNavLevel(3);
                  }}
                >
                  <div>
                    <div className="level2-mode-top">
                      <div className="level2-mode-icon" style={{ background: mode.bg, border: `1px solid ${mode.border}` }}>
                        <span>{mode.icon}</span>
                      </div>
                      <div>
                        <div className="level2-mode-title">{mode.title}</div>
                        <div className="level2-mode-sub">{mode.description}</div>
                      </div>
                    </div>
                  </div>

                  <div className="level2-mode-footer">
                    <span
                      className="level2-mode-badge"
                      style={{ color: mode.badgeColor, background: mode.badgeBg }}
                    >
                      {mode.badge}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>
                      Explore Material →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            LEVEL 3: TEST MATERIAL & PRACTICE LIST
            ======================================================== */}
        {navLevel === 3 && (
          <div>
            {/* Breadcrumb Navigation */}
            <div className="level-breadcrumb-bar">
              <span className="level-breadcrumb-link" onClick={() => setNavLevel(1)}>
                🏠 All Courses
              </span>
              <span className="level-breadcrumb-sep">/</span>
              <span className="level-breadcrumb-link" onClick={() => setNavLevel(2)}>
                {currentExam.shortTitle}
              </span>
              <span className="level-breadcrumb-sep">/</span>
              <span className="level-breadcrumb-current">{currentMode.title}</span>
            </div>

            {/* Mode Banner */}
            <div
              style={{
                background: currentMode.bg,
                border: `1.5px solid ${currentMode.border}`,
                borderRadius: '12px',
                padding: '18px 24px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>{currentMode.icon}</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                    {currentMode.title} - Test Material
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {currentExam.shortTitle} • {currentMode.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setNavLevel(2)}
                  style={{ fontWeight: 700 }}
                >
                  ← Back to Modes
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setNavLevel(1)}
                  style={{ fontWeight: 700 }}
                >
                  All Courses
                </button>
              </div>
            </div>

            {/* SPECIAL MODE: STUDY MATERIAL & SPECIAL CODES (Mode 6) */}
            {currentMode.id === 'study' ? (
              <div
                className="card"
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '28px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '24px'
                }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                  📖 UP Police Computer Operator & ASI Typing Rules & Evaluation Formula
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      ⚡ Speed Calculation Formula
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                      • <strong>Gross WPM</strong> = (Total Keystrokes / 5) / Time (Minutes)<br />
                      • <strong>Net WPM</strong> = Gross WPM - (Mistakes / Time)<br />
                      • <strong>Hindi Target</strong>: 25 Net WPM (Mangal Inscript or Kruti Dev)<br />
                      • <strong>English Target</strong>: 30 Net WPM
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      🎯 Accuracy & Penalty Rules
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                      • <strong>Minimum Accuracy</strong>: 85.0% mandatory for qualification.<br />
                      • <strong>Full Mistakes</strong>: Missing words, substituted words, spelling errors.<br />
                      • <strong>Half Mistakes</strong>: Spacing errors, punctuation errors, capitalization errors.
                    </p>
                  </div>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                  ⌨️ Frequent Kruti Dev 010 & Mangal Inscript Special ALT Codes:
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '10px',
                    fontSize: '0.85rem'
                  }}
                >
                  {[
                    { code: 'Alt + 0161', char: 'ह्न' },
                    { code: 'Alt + 0170', char: 'क्क' },
                    { code: 'Alt + 0179', char: 'ट्ट' },
                    { code: 'Alt + 0180', char: 'ट्ठ' },
                    { code: 'Alt + 0181', char: 'ड्ड' },
                    { code: 'Alt + 0182', char: 'ड्ढ' },
                    { code: 'Alt + 0188', char: 'द्ग' },
                    { code: 'Alt + 0204', char: 'त्त' },
                    { code: 'Alt + 0216', char: '्य' },
                    { code: 'Alt + 0227', char: 'ह्म' }
                  ].map((item) => (
                    <div
                      key={item.code}
                      style={{
                        background: '#f1f5f9',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 600
                      }}
                    >
                      <span style={{ color: '#0284c7' }}>{item.code}</span>
                      <span style={{ fontSize: '1.1rem', color: '#0f172a' }}>{item.char}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveModeId('english');
                    }}
                  >
                    Start English Mock Test →
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setActiveModeId('hindi_mangal');
                    }}
                  >
                    Start Hindi Mangal Test →
                  </button>
                </div>
              </div>
            ) : (
              /* REGULAR TEST MATERIAL GRID */
              <div>
                {/* Filters Toolbar */}
                <div className="exam-toolbar">
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
                        All Difficulties
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

                    {/* Timer Selector */}
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
                        <option value={15}>15 Min (UPPRPB Official)</option>
                        <option value={10}>10 Min</option>
                        <option value={5}>5 Min (Speed Drill)</option>
                        <option value={2}>2 Min (Sprint)</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="exam-toolbar-row">
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
                        placeholder="Search test by passage topic, keyword or date..."
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

                {/* Available Tests Count */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                    Available Tests in {currentMode.title} ({filteredLevel3Passages.length})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Showing {Math.min(visibleCount, filteredLevel3Passages.length)} of {filteredLevel3Passages.length}
                  </div>
                </div>

                {/* Tests Grid */}
                {filteredLevel3Passages.length === 0 ? (
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
                      No matching tests found in this category
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>
                      Try selecting another difficulty level or resetting your search keyword.
                    </p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedDifficulty('all');
                        setSearchQuery('');
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="exam-grid">
                    {filteredLevel3Passages.slice(0, visibleCount).map((passage) => {
                      const past = pastAttemptsMap.get(passage.id) || pastAttemptsMap.get(passage.title);

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
                              📅 {toDisplayDate(passage.date || '2026-10-26')} • UPPRPB Pattern Passage
                            </div>

                            {/* Stats */}
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
                                <div className="exam-card-stat-label">Target Acc</div>
                                <div className="exam-card-stat-val">85%</div>
                              </div>
                            </div>

                            {/* Past Candidate Score */}
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

                          {/* Footer & Start Button */}
                          <div className="exam-card-footer">
                            <div className="exam-card-attempts" style={{ color: '#0284c7', fontWeight: 700 }}>
                              <span>🆔</span> Test #{passage.id.replace('ar-', '')} • {passage.wordCount}w
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
                {visibleCount < filteredLevel3Passages.length && (
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
                      Load More Tests ({filteredLevel3Passages.length - visibleCount} remaining) ↓
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            VIEW MODE: CLASSIC DATE-WISE FORM (AR TYPING REPLICA)
            ======================================================== */}
        {navLevel === 'classic_form' && (
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setNavLevel(1)}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>←</span> Back to All Courses
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
                  onClick={() => setNavLevel(1)}
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
                  View All Courses (TestMentor Grid)
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
