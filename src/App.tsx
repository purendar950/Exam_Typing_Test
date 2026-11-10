import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Passage, TestSettings, EvaluationResult, ExamProfile } from './types';
import { PASSAGES } from './data/passages';
import { ALL_EXAMS } from './data/allExams';
import { Header } from './components/Header';
import { ChooseTest } from './components/ChooseTest';
import { StartTest } from './components/StartTest';
import { HindiHelperModal } from './components/HindiHelperModal';
import { ExclusiveOfferBanner } from './components/ExclusiveOfferBanner';
import type { LegalTab } from './components/LegalPolicyModal';
import { TelegramSupportWidget } from './components/TelegramSupportWidget';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import { audioEngine } from './utils/audioEngine';
import appLogo from './assets/logo.webp';
import { fetchDailyLivePassages, triggerAutoDailyGenerationIfDue } from './services/aiGenerator';
import { fetchAllCustomPassages } from './services/adminService';
import {
  handleTelegramApprovalFromUrl,
  getTelegramConfig,
  TelegramConfig
} from './services/telegramService';
import { isTestLocked, syncPricingConfigFromCloud } from './services/paymentService';
import { fetchPaidPassageText } from './services/passageService';
import {
  subscribeToAuth,
  saveTestResultToCloud,
  fetchUserTestAttempts,
  logoutUser,
  UserProfile,
  isUserAdmin
} from './services/firebase';

// After a new deploy the old chunk files no longer exist on the server. If a chunk fails
// to load, reload once to pick up the new version instead of showing an error screen.
const CHUNK_RELOAD_KEY = 'up_chunk_reload_at';
function loadChunk<T>(importer: () => Promise<T>): Promise<T> {
  return importer().catch((err) => {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (navigator.onLine && Date.now() - last > 60000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
      window.location.reload();
      return new Promise<T>(() => {});
    }
    throw err;
  });
}

// Screens and dialogs that are not needed for the first paint are loaded on demand
const ResultScreen = lazy(() => loadChunk(() => import('./components/ResultScreen')).then((m) => ({ default: m.ResultScreen })));
const LearnScreen = lazy(() => loadChunk(() => import('./components/LearnScreen')).then((m) => ({ default: m.LearnScreen })));
const WordDocumentScreen = lazy(() => loadChunk(() => import('./components/WordDocumentScreen')).then((m) => ({ default: m.WordDocumentScreen })));
const RulesModal = lazy(() => loadChunk(() => import('./components/RulesModal')).then((m) => ({ default: m.RulesModal })));
const HistoryModal = lazy(() => loadChunk(() => import('./components/HistoryModal')).then((m) => ({ default: m.HistoryModal })));
const AuthModal = lazy(() => loadChunk(() => import('./components/AuthModal')).then((m) => ({ default: m.AuthModal })));
const UserDashboardModal = lazy(() => loadChunk(() => import('./components/UserDashboardModal')).then((m) => ({ default: m.UserDashboardModal })));
const LeaderboardModal = lazy(() => loadChunk(() => import('./components/LeaderboardModal')).then((m) => ({ default: m.LeaderboardModal })));
const MyCoursesModal = lazy(() => loadChunk(() => import('./components/MyCoursesModal')).then((m) => ({ default: m.MyCoursesModal })));
const AiGeneratorModal = lazy(() => loadChunk(() => import('./components/AiGeneratorModal')).then((m) => ({ default: m.AiGeneratorModal })));
const AdminPanelModal = lazy(() => loadChunk(() => import('./components/AdminPanelModal')).then((m) => ({ default: m.AdminPanelModal })));
const PaymentModal = lazy(() => loadChunk(() => import('./components/PaymentModal')).then((m) => ({ default: m.PaymentModal })));
const TelegramAdminChatSheet = lazy(() => loadChunk(() => import('./components/TelegramAdminChatSheet')).then((m) => ({ default: m.TelegramAdminChatSheet })));
const LegalPolicyModal = lazy(() => loadChunk(() => import('./components/LegalPolicyModal')).then((m) => ({ default: m.LegalPolicyModal })));

// Mounts its children the first time `when` becomes true and keeps them mounted afterwards,
// so a dialog's code is only downloaded once it is actually opened.
const LazyMount: React.FC<{ when: boolean; children: React.ReactNode }> = ({ when, children }) => {
  const [activated, setActivated] = useState(when);
  useEffect(() => {
    if (when) setActivated(true);
  }, [when]);
  if (!activated && !when) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
};

const ScreenLoader: React.FC = () => (
  <div role="status" style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
    Loading…
  </div>
);

const DEFAULT_SETTINGS: TestSettings = {
  highlightEnabled: false,
  autoScroll: false, // Default OFF
  soundEnabled: true,
  backspaceEnabled: true,
  fullScreenEnabled: false,
  fontSize: 18,
  autoStartTimer: true,
  candidateName: 'PURENDAR'
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'choose' | 'test' | 'result' | 'learn' | 'book'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/learn')) return 'learn';
      if (hash.startsWith('#/book')) return 'book';
      if (hash.startsWith('#/result')) {
        try {
          const savedResult = sessionStorage.getItem('up_latest_result');
          const savedHistory = localStorage.getItem('up_typing_history');
          if (savedResult || (savedHistory && JSON.parse(savedHistory).length > 0)) {
            return 'result';
          }
        } catch {}
      }
      if (hash.startsWith('#/test')) {
        try {
          const savedTest = sessionStorage.getItem('up_active_test_session');
          if (savedTest) return 'test';
        } catch {}
      }
    }
    return 'choose';
  });

  const [activeTab, setActiveTab] = useState<'tests' | 'learn' | 'book'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/learn')) return 'learn';
      if (hash.startsWith('#/book')) return 'book';
    }
    return 'tests';
  });

  const [selectedPassage, setSelectedPassage] = useState<Passage>(() => {
    try {
      const saved = sessionStorage.getItem('up_active_test_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.passage) return parsed.passage;
      }
    } catch {}
    return PASSAGES[0];
  });

  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('up_active_test_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.durationMinutes) return parsed.durationMinutes;
      }
    } catch {}
    return 15;
  });

  const [selectedExamProfile, setSelectedExamProfile] = useState<ExamProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('up_active_test_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.examProfile) return parsed.examProfile;
      }
    } catch {}
    return null;
  });

  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(() => {
    try {
      const saved = sessionStorage.getItem('up_latest_result');
      if (saved) return JSON.parse(saved);
      const hist = localStorage.getItem('up_typing_history');
      if (hist) {
        const parsed = JSON.parse(hist);
        if (parsed.length > 0) return parsed[0];
      }
    } catch {}
    return null;
  });

  // Settings (Default autoScroll is OFF)
  const [settings, setSettings] = useState<TestSettings>(() => {
    try {
      const saved = localStorage.getItem('up_typing_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasExplicit = localStorage.getItem('up_autoscroll_explicit') === 'true';
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          highlightEnabled: parsed.highlightEnabled ?? false,
          autoScroll: hasExplicit ? !!parsed.autoScroll : false
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // History
  const [history, setHistory] = useState<EvaluationResult[]>(() => {
    try {
      const saved = localStorage.getItem('up_typing_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [rulesTargetExamId, setRulesTargetExamId] = useState<string | undefined>(undefined);
  const [rulesTargetGroup, setRulesTargetGroup] = useState<string | undefined>(undefined);

  const openRulesModal = (examId?: string, categoryGroup?: string) => {
    setRulesTargetExamId(examId || selectedExamProfile?.id);
    setRulesTargetGroup(categoryGroup || selectedExamProfile?.categoryGroup);
    setIsRulesOpen(true);
  };

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isHindiHelperOpen, setIsHindiHelperOpen] = useState<boolean>(false);
  // Active Authenticated / Candidate User
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('up_typing_active_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed) {
        // SECURITY: Guest users or unverified sessions must not have active subscription or admin rights
        if (!parsed.uid || parsed.uid.startsWith('guest-')) {
          parsed.is_subscribed = false;
          parsed.isAdmin = false;
          parsed.role = 'candidate';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Automatically open login modal if user is not logged in on site visit
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('up_typing_active_user');
      const dismissed = sessionStorage.getItem('up_auth_dismissed') === 'true';
      return !savedUser && !dismissed;
    } catch {
      return false;
    }
  });
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'overview' | 'history' | 'heatmap' | 'courses' | 'admitCard'>('overview');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isMyCoursesOpen, setIsMyCoursesOpen] = useState<boolean>(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('up_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isLoadingPassage, setIsLoadingPassage] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('up_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('up_theme', 'light');
      }
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      return ['#/terms', '#/privacy', '#/refund', '#/copyright', '#/disclaimer', '#/contact'].some((h) => hash.startsWith(h));
    }
    return false;
  });
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/privacy')) return 'privacy';
      if (hash.startsWith('#/refund')) return 'refund';
      if (hash.startsWith('#/copyright')) return 'copyright';
      if (hash.startsWith('#/disclaimer')) return 'disclaimer';
      if (hash.startsWith('#/contact')) return 'contact';
    }
    return 'terms';
  });

  const openLegalModal = (tab: LegalTab = 'terms') => {
    setLegalInitialTab(tab);
    setIsLegalOpen(true);
    window.location.hash = `#/${tab}`;
  };
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [paymentInitialExamId, setPaymentInitialExamId] = useState<string | undefined>(undefined);
  const [paymentInitialPlanId, setPaymentInitialPlanId] = useState<string | undefined>(undefined);
  const [showOfferBanner, setShowOfferBanner] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('up_offer_banner_dismissed') === 'true';
      return !dismissed;
    }
    return true;
  });
  const [dailyLivePassages, setDailyLivePassages] = useState<Passage[]>([]);

  const handleOpenPayment = (examId?: string, planId?: string) => {
    setPaymentInitialExamId(examId);
    setPaymentInitialPlanId(planId);
    setIsPaymentOpen(true);
  };
  const [customPassages, setCustomPassages] = useState<Passage[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);
  const [telegramToast, setTelegramToast] = useState<{ success: boolean; message: string } | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'live_chat' | 'ai_engine' | 'passages' | 'candidates' | 'payments' | 'pricing' | 'settings' | undefined>(undefined);
  const [adminInitialChatId, setAdminInitialChatId] = useState<string | undefined>(undefined);
  const [telegramAdminChatSessionId, setTelegramAdminChatSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('admin_chat');
    }
    return null;
  });
  const [telegramAdminChatToken, setTelegramAdminChatToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('token');
    }
    return null;
  });

  // Automatically fetch today's 8 Daily Live Tests, Custom Passages and handle Telegram 1-click approvals
  useEffect(() => {
    // Warm the pricing cache so the checkout opens with the admin's current plans
    syncPricingConfigFromCloud();

    const todayIso = new Date().toISOString().split('T')[0];
    fetchDailyLivePassages(todayIso, PASSAGES).then((tests) => {
      if (tests && tests.length > 0) {
        setDailyLivePassages(tests);
      }
    });

    fetchAllCustomPassages().then((cps) => {
      if (cps && cps.length > 0) {
        setCustomPassages(cps);
      }
    });

    // Auto-generate today's 8 Daily Live Tests if due and API key configured
    triggerAutoDailyGenerationIfDue(todayIso, (newTests) => {
      if (newTests && newTests.length > 0) {
        setDailyLivePassages(newTests);
      }
    });

    // Check for 1-click tokenized approval links from Telegram bot
    handleTelegramApprovalFromUrl().then((res) => {
      if (res.handled) {
        setTelegramToast({ success: res.success, message: res.message });
        if (res.action === 'portal' || res.action === 'approve') {
          setIsAdminOpen(true);
        }
        setTimeout(() => setTelegramToast(null), 10000);
      }
    });

    // Check for direct live chat deep-link from Telegram notification
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const chatParam = urlParams.get('admin_chat');
      const tokenParam = urlParams.get('token');
      if (chatParam) {
        setTelegramAdminChatSessionId(chatParam);
        if (tokenParam) {
          setTelegramAdminChatToken(tokenParam);
        }
      }
    } catch {}

    // Load Telegram configuration for floating action button
    getTelegramConfig().then((cfg) => setTelegramConfig(cfg));
  }, []);

  // Combined Passages (Custom Passages + Live Tests + Bank)
  const allPassages = React.useMemo(() => {
    const basePool = [...customPassages, ...PASSAGES];
    if (dailyLivePassages.length > 0) {
      const liveIds = new Set(dailyLivePassages.map((p) => p.id));
      const remaining = basePool.filter((p) => !liveIds.has(p.id));
      return [...dailyLivePassages, ...remaining];
    }
    return basePool;
  }, [customPassages, dailyLivePassages]);

  // Subscribe to Firebase Auth and Local User session
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        // If already logged in, open directly to main page!
        setIsAuthOpen(false);
        sessionStorage.removeItem('up_auth_dismissed');
        if (user.displayName) {
          setSettings((prev) => ({
            ...prev,
            candidateName: user.displayName
          }));
        }
        // Fetch actual tests from Firestore
        fetchUserTestAttempts(user.uid)
          .then((cloudAttempts) => {
            if (cloudAttempts && cloudAttempts.length > 0) {
              setHistory(cloudAttempts);
            }
          })
          .catch((err) => {
            console.warn('Error fetching cloud test attempts:', err);
          });
      } else {
        // If not logged in and not dismissed in this session, auto-open login modal
        const dismissed = sessionStorage.getItem('up_auth_dismissed') === 'true';
        if (!dismissed) {
          setIsAuthOpen(true);
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Save settings
  const handleUpdateSettings = (newSettings: Partial<TestSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('up_typing_settings', JSON.stringify(updated));
        if (typeof newSettings.autoScroll === 'boolean') {
          localStorage.setItem('up_autoscroll_explicit', 'true');
        }
      } catch {
        // Ignore storage errors
      }
      if (typeof updated.soundEnabled === 'boolean') {
        audioEngine.setSoundEnabled(updated.soundEnabled);
      }
      return updated;
    });
  };

  const toggleSound = () => {
    handleUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  // Synchronize App view with browser URL hash changes (Back/Forward buttons)
  useEffect(() => {
    const handleAppHashChange = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/privacy')) {
        setLegalInitialTab('privacy');
        setIsLegalOpen(true);
      } else if (hash.startsWith('#/terms')) {
        setLegalInitialTab('terms');
        setIsLegalOpen(true);
      } else if (hash.startsWith('#/refund')) {
        setLegalInitialTab('refund');
        setIsLegalOpen(true);
      } else if (hash.startsWith('#/copyright')) {
        setLegalInitialTab('copyright');
        setIsLegalOpen(true);
      } else if (hash.startsWith('#/disclaimer')) {
        setLegalInitialTab('disclaimer');
        setIsLegalOpen(true);
      } else if (hash.startsWith('#/contact')) {
        setLegalInitialTab('contact');
        setIsLegalOpen(true);
      } else if (hash.startsWith('#/learn')) {
        setCurrentView('learn');
        setActiveTab('learn');
      } else if (hash.startsWith('#/book')) {
        setCurrentView('book');
        setActiveTab('book');
      } else if (hash.startsWith('#/result')) {
        setCurrentView('result');
      } else if (hash.startsWith('#/test')) {
        setCurrentView('test');
      } else {
        setCurrentView('choose');
        setActiveTab('tests');
      }
    };

    window.addEventListener('hashchange', handleAppHashChange);
    return () => window.removeEventListener('hashchange', handleAppHashChange);
  }, []);

  const returnToExamOrHome = () => {
    try {
      sessionStorage.removeItem('up_active_test_session');
      const savedRoute = sessionStorage.getItem('up_exam_nav_route');
      if (savedRoute) {
        const parsed = JSON.parse(savedRoute);
        if (parsed.level === 3 && parsed.examId && parsed.modeId) {
          window.location.hash = `#/exam/${parsed.examId}/${parsed.modeId}`;
        } else if (parsed.level === 2 && parsed.examId) {
          window.location.hash = `#/exam/${parsed.examId}`;
        } else if (parsed.level === 'classic_form') {
          window.location.hash = '#/classic';
        } else {
          window.location.hash = '#/';
        }
      } else {
        window.location.hash = '#/';
      }
    } catch {
      window.location.hash = '#/';
    }
    setActiveTab('tests');
    setCurrentView('choose');
  };

  // Start test
  const handleStartTest = async (passage: Passage, customDurationMinutes?: number, examProfile?: ExamProfile | null) => {
    // Pro Paywall Guard: First 7 tests of each exam are free demo.
    // Tests #8+ require Pro subscription or Admin privileges.
    const examId = examProfile?.id || passage.examSlug;
    const catGroup = examProfile?.categoryGroup || passage.categoryGroup;
    const access = isTestLocked(passage.testNumber, 0, currentUser, examId, catGroup);

    if (access.isLocked) {
      handleOpenPayment(examId);
      return;
    }

    let finalPassage = passage;
    const isPaidTest = (passage.testNumber ?? 0) > 7;

    // Server-Side Verification & Content Delivery for Paid Tests (#8+)
    if (isPaidTest) {
      setIsLoadingPassage(true);
      try {
        const fetchRes = await fetchPaidPassageText(passage.id);
        if (fetchRes.success && fetchRes.text && fetchRes.text.trim().length > 0) {
          finalPassage = { ...passage, text: fetchRes.text };
        } else if (fetchRes.isPermissionDenied) {
          setIsLoadingPassage(false);
          alert('🔒 Server Security Verification: Active Pro subscription required for Test #' + (passage.testNumber || '') + '. Please upgrade or renew.');
          handleOpenPayment(examId);
          return;
        } else {
          // Hard security failure — NEVER proceed without verified server content
          setIsLoadingPassage(false);
          alert('⚠️ ' + (fetchRes.error || 'Access Denied: Unable to load secure test passage from server. Active Pro subscription required.'));
          return;
        }
      } catch (err) {
        console.error('Paid passage security fetch error:', err);
        setIsLoadingPassage(false);
        alert('⚠️ Security Verification Failed: Unable to verify access to this Pro test. Please check internet connection.');
        return;
      } finally {
        setIsLoadingPassage(false);
      }
    }

    setSelectedPassage(finalPassage);
    let resolvedProfile: ExamProfile | null = examProfile || null;
    if (!resolvedProfile) {
      if (finalPassage.examSlug) {
        resolvedProfile = ALL_EXAMS.find((p) => p.slug === finalPassage.examSlug) || null;
      }
      if (!resolvedProfile && finalPassage.categoryGroup) {
        resolvedProfile = ALL_EXAMS.find((p) => p.categoryGroup === finalPassage.categoryGroup && p.language === finalPassage.language) || null;
      }
      if (!resolvedProfile && finalPassage.category) {
        resolvedProfile = ALL_EXAMS.find((p) => (p.slug.includes(finalPassage.category) || p.id === finalPassage.category) && p.language === finalPassage.language) || null;
      }
    }
    setSelectedExamProfile(resolvedProfile);

    const finalDuration = customDurationMinutes || resolvedProfile?.durationMinutes || finalPassage.duration || 15;
    setSelectedDurationMinutes(finalDuration);

    // Save active test session so page refresh stays right here
    try {
      sessionStorage.setItem('up_active_test_session', JSON.stringify({
        passage: finalPassage,
        durationMinutes: finalDuration,
        examProfile: resolvedProfile,
        timestamp: Date.now()
      }));
    } catch {}

    window.location.hash = '#/test';
    setCurrentView('test');
  };

  // Finish test
  const handleFinishTest = async (result: EvaluationResult) => {
    setCurrentResult(result);
    try {
      sessionStorage.setItem('up_latest_result', JSON.stringify(result));
      sessionStorage.removeItem('up_active_test_session');
    } catch {}
    window.location.hash = '#/result';
    setCurrentView('result');

    // Save to local history
    setHistory((prev) => {
      const updated = [result, ...prev].slice(0, 50);
      try {
        localStorage.setItem('up_typing_history', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    // Cloud Firestore Sync (if user is logged in or offline-synced)
    if (currentUser) {
      try {
        await saveTestResultToCloud(currentUser.uid, result, currentUser.displayName);
      } catch (err) {
        console.warn('Failed cloud test sync:', err);
      }
    }
  };

  // Retake
  const handleRetakeTest = () => {
    if (selectedPassage) {
      window.location.hash = '#/test';
      setCurrentView('test');
    }
  };

  // Practice mistyped words 2-minute booster drill
  const handlePracticeWrongWords = (words: string[]) => {
    if (words.length === 0) return;
    // Repeat words naturally to create ~80-100 word 2-minute booster drill
    const repeats = Math.max(3, Math.ceil(80 / words.length));
    const drillText = Array(repeats).fill(words.join(' ')).join(' ');
    const drillPassage: Passage = {
      id: `drill-${Date.now()}`,
      title: `🎯 2-Min Weak Keys & Mistakes Drill (${words.slice(0, 3).join(', ')}...)`,
      language: selectedPassage.language,
      category: selectedPassage.category,
      duration: 2,
      wordCount: drillText.split(/\s+/).length,
      difficulty: 'hard',
      date: new Date().toISOString().split('T')[0],
      text: drillText
    };
    setSelectedPassage(drillPassage);
    setSelectedDurationMinutes(2);
    try {
      sessionStorage.setItem('up_active_test_session', JSON.stringify({
        passage: drillPassage,
        durationMinutes: 2,
        examProfile: selectedExamProfile,
        timestamp: Date.now()
      }));
    } catch {}
    window.location.hash = '#/test';
    setCurrentView('test');
  };

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('up_typing_history');
    } catch {
      // Ignore
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {currentView !== 'test' && (
        <Header
          currentTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'learn') {
              window.location.hash = '#/learn';
              setCurrentView('learn');
            } else if (tab === 'book') {
              window.location.hash = '#/book';
              setCurrentView('book');
            } else {
              returnToExamOrHome();
            }
          }}
          onOpenRules={() => openRulesModal()}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenHindiHelper={() => setIsHindiHelperOpen(true)}
          onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenPayment={() => handleOpenPayment()}
          onOpenMyCourses={() => setIsMyCoursesOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          settings={settings}
          onToggleSound={toggleSound}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenDashboard={() => {
            setDashboardInitialTab('overview');
            setIsDashboardOpen(true);
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

      )}

      {/* ⚡ EXCLUSIVE ₹12 FOR 15 DAYS WELCOME OFFER BANNER (Shown when user logs in) */}
      {showOfferBanner && currentUser && !currentUser.is_subscribed && currentView !== 'test' && (
        <ExclusiveOfferBanner
          userName={currentUser.displayName}
          onClaim={() => {
            handleOpenPayment(undefined, 'plan_single_15d');
          }}
          onDismiss={() => {
            setShowOfferBanner(false);
            sessionStorage.setItem('up_offer_banner_dismissed', 'true');
          }}
        />
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'choose' && (
          <ChooseTest
            passages={allPassages}
            dailyLivePassages={dailyLivePassages}
            onStartTest={handleStartTest}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            currentUser={currentUser}
            history={history}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenDashboard={() => setIsDashboardOpen(true)}
            onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenPayment={handleOpenPayment}
            onOpenRules={openRulesModal}
          />
        )}

        {currentView === 'test' && selectedPassage && (
          <ErrorBoundary fallbackTitle="Exam Session Error" onReset={returnToExamOrHome}>
            <StartTest
              passage={selectedPassage}
              durationMinutes={selectedDurationMinutes}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onFinishTest={handleFinishTest}
              onCancelTest={returnToExamOrHome}
              activeExamProfile={selectedExamProfile}
              onOpenRules={openRulesModal}
            />
          </ErrorBoundary>
        )}

        {currentView === 'result' && currentResult && (
          <Suspense fallback={<ScreenLoader />}>
            <ResultScreen
              result={currentResult}
              onRetakeTest={handleRetakeTest}
              onChooseAnother={returnToExamOrHome}
              onPracticeWrongWords={handlePracticeWrongWords}
              onOpenRules={openRulesModal}
              onOpenDashboard={() => {
                if (currentUser) {
                  setIsDashboardOpen(true);
                } else {
                  setIsAuthOpen(true);
                }
              }}
            />
          </Suspense>
        )}

        {currentView === 'learn' && (
          <Suspense fallback={<ScreenLoader />}>
            <LearnScreen onBackToTests={returnToExamOrHome} />
          </Suspense>
        )}

        {currentView === 'book' && (
          <Suspense fallback={<ScreenLoader />}>
            <WordDocumentScreen
              onBackToTests={returnToExamOrHome}
            />
          </Suspense>
        )}
      </main>

      {currentView !== 'book' && currentView !== 'test' && (
        <footer
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderTop: '1px solid #e2e8f0',
            padding: '40px 0 24px 0',
            color: '#475569',
            fontSize: '0.88rem',
            marginTop: 'auto'
          }}
        >
          <div className="container" style={{ margin: '0 auto', padding: '0 20px' }}>
            {/* Top Multi-Column Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '32px',
                marginBottom: '32px'
              }}
            >
              {/* Col 1: Brand & Gov Standard */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <img
                    src={appLogo}
                    alt="Exam Typing Mentor"
                    style={{ height: '36px', width: 'auto', borderRadius: '6px' }}
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>
                      Exam Typing Mentor
                    </h3>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0284c7' }}>
                      Official Exam Speed & Accuracy Simulator
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                  Crafted strictly per official recruitment benchmarks: <strong>UP Police Computer Operator</strong> (Hindi 25 WPM, English 30 WPM, 85% Accuracy), <strong>UP Police ASI</strong>, <strong>UPSSSC Junior Assistant</strong>, <strong>Allahabad High Court</strong>, and <strong>SSC CGL/CHSL</strong>.
                </p>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45, background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                  <strong>Disclaimer:</strong> Independent educational preparation tool. Not affiliated with UPPRPB, UPSSSC, SSC, or any government recruiting board.
                </div>
              </div>

              {/* Col 2: Legal, Trust & Policies */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                  ⚖️ Trust & Policies
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>
                    <button
                      onClick={() => openLegalModal('terms')}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#334155', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>📜</span>
                      <span style={{ textDecoration: 'underline' }}>Terms & Conditions</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openLegalModal('privacy')}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#334155', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>🔒</span>
                      <span style={{ textDecoration: 'underline' }}>Privacy Policy</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openLegalModal('refund')}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#334155', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>🚫</span>
                      <span style={{ textDecoration: 'underline' }}>Strict No-Refund Policy</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openLegalModal('copyright')}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#334155', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>©️</span>
                      <span style={{ textDecoration: 'underline' }}>Copyright & IP Notice</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openLegalModal('disclaimer')}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#334155', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>🛡️</span>
                      <span style={{ textDecoration: 'underline' }}>Non-Affiliation Disclaimer</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Community & Support */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                  💬 Community & Support
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li>
                    <a
                      href="https://t.me/Exam_Typing_Mentor"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>📢</span>
                      <span>Official Telegram Channel ↗</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://t.me/+Lw-tPbRqOOc2ZTA1"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>👥</span>
                      <span>Aspirants Discussion Group ↗</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://t.me/purendare"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>💬</span>
                      <span>1-on-1 Admin Support (@purendare) ↗</span>
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => openLegalModal('contact')}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#334155', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>📞</span>
                      <span style={{ textDecoration: 'underline' }}>Contact & Grievance Redressal</span>
                    </button>
                  </li>
                  {currentUser && isUserAdmin(currentUser) && (
                    <li style={{ marginTop: '4px' }}>
                      <button
                        onClick={() => setIsAdminOpen(true)}
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🛡️</span>
                        <span>Examination Authority Admin Portal</span>
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Bottom Row: Copyright Bar */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.78rem',
                color: '#94a3b8'
              }}
            >
              <div>
                &copy; 2026 <strong>Exam Typing Mentor</strong>. All Rights Reserved.
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span onClick={() => openLegalModal('terms')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Terms</span>
                <span onClick={() => openLegalModal('privacy')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Privacy</span>
                <span onClick={() => openLegalModal('refund')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>No Refunds</span>
                <span onClick={() => openLegalModal('copyright')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Copyright</span>
                <span onClick={() => openLegalModal('disclaimer')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Disclaimer</span>
                <span onClick={() => openLegalModal('contact')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Contact</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      <LazyMount when={isRulesOpen}>
        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          initialExamId={rulesTargetExamId || selectedExamProfile?.id}
          initialCategoryGroup={rulesTargetGroup || selectedExamProfile?.categoryGroup}
        />
      </LazyMount>

      <LazyMount when={isHistoryOpen}>
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onClearHistory={handleClearHistory}
        />
      </LazyMount>

      <HindiHelperModal
        isOpen={isHindiHelperOpen}
        onClose={() => setIsHindiHelperOpen(false)}
        defaultLayout={selectedPassage?.language === 'hindi_kruti' ? 'kruti' : 'mangal'}
      />

      <LazyMount when={isAuthOpen}>
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            sessionStorage.setItem('up_auth_dismissed', 'true');
          }}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthOpen(false);
            sessionStorage.removeItem('up_auth_dismissed');
            sessionStorage.removeItem('up_offer_banner_dismissed');
            setShowOfferBanner(true);
            setSettings((prev) => ({
              ...prev,
              candidateName: user.displayName
            }));
            if (isUserAdmin(user)) {
              setIsAdminOpen(true);
            }
          }}
        />
      </LazyMount>

      {currentUser && (
        <LazyMount when={isDashboardOpen}>
          <UserDashboardModal
            isOpen={isDashboardOpen}
            onClose={() => setIsDashboardOpen(false)}
            user={currentUser}
            initialTab={dashboardInitialTab}
            onLogout={async () => {
              await logoutUser();
              setCurrentUser(null);
              setIsDashboardOpen(false);
              sessionStorage.removeItem('up_auth_dismissed');
              setIsAuthOpen(true);
            }}
            onViewScorecard={(res) => {
              setCurrentResult(res);
              setCurrentView('result');
              setIsDashboardOpen(false);
            }}
            onPracticeWrongWords={(words) => {
              setIsDashboardOpen(false);
              handlePracticeWrongWords(words);
            }}
            onOpenPayment={(examId) => {
              setIsDashboardOpen(false);
              handleOpenPayment(examId);
            }}
            onNavigateToCourse={() => {
              setCurrentView('choose');
            }}
            onOpenLeaderboard={() => {
              setIsDashboardOpen(false);
              setIsLeaderboardOpen(true);
            }}
          />
        </LazyMount>
      )}

      <LazyMount when={isLeaderboardOpen}>
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          isSubscribed={currentUser?.is_subscribed ?? false}
          currentUserId={currentUser?.uid}
          onOpenPayment={() => {
            setIsLeaderboardOpen(false);
            handleOpenPayment();
          }}
        />
      </LazyMount>

      <LazyMount when={isMyCoursesOpen}>
        <MyCoursesModal
          isOpen={isMyCoursesOpen}
          onClose={() => setIsMyCoursesOpen(false)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPayment={(examId) => handleOpenPayment(examId)}
          onNavigateToCourse={() => {
            setCurrentView('choose');
          }}
        />
      </LazyMount>



      <LazyMount when={isAiGeneratorOpen}>
        <AiGeneratorModal
          isOpen={isAiGeneratorOpen}
          onClose={() => setIsAiGeneratorOpen(false)}
          onPassagesGenerated={(tests) => {
            setDailyLivePassages(tests);
          }}
          existingPassages={PASSAGES}
        />
      </LazyMount>

      <LazyMount when={isAdminOpen}>
        <AdminPanelModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          passages={allPassages}
          onPassagesUpdated={(updated) => {
            setCustomPassages(updated.filter((p) => p.id.startsWith('custom-')));
          }}
          onDailyLiveGenerated={(tests) => {
            setDailyLivePassages(tests);
          }}
          currentUser={currentUser}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          initialTab={adminInitialTab}
          initialChatId={adminInitialChatId}
        />
      </LazyMount>

      <LazyMount when={isPaymentOpen}>
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setPaymentInitialExamId(undefined);
            setPaymentInitialPlanId(undefined);
          }}
          currentUser={currentUser}
          initialSelectedExamId={paymentInitialExamId}
          initialPlanId={paymentInitialPlanId}
        />
      </LazyMount>

      <LazyMount when={isLegalOpen}>
        <LegalPolicyModal
          isOpen={isLegalOpen}
          initialTab={legalInitialTab}
          onClose={() => {
            setIsLegalOpen(false);
            const hash = window.location.hash || '';
            if (['#/terms', '#/privacy', '#/refund', '#/copyright', '#/disclaimer', '#/contact'].some((h) => hash.startsWith(h))) {
              returnToExamOrHome();
            }
          }}
        />
      </LazyMount>

      {/* Floating Telegram Alert Toast from 1-Click Link */}
      {telegramToast && (
        <div
          style={{
            position: 'fixed',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100001,
            background: telegramToast.success ? '#0f172a' : '#991b1b',
            color: '#ffffff',
            padding: '12px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            border: telegramToast.success ? '1.5px solid #38bdf8' : '1.5px solid #f87171'
          }}
        >
          <span>{telegramToast.success ? '⚡' : '⚠️'}</span>
          <span>{telegramToast.message}</span>
          <button
            onClick={() => setTelegramToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Fintech-style Telegram Community & Support Hub */}
      {currentView !== 'test' && (
        <TelegramSupportWidget
          config={telegramConfig}
          currentUser={currentUser}
          onOpenPayment={() => handleOpenPayment()}
        />
      )}

      {/* Native Telegram In-App Admin Chat Reply Sheet */}
      {telegramAdminChatSessionId && (
        <LazyMount when={true}>
          <TelegramAdminChatSheet
            sessionId={telegramAdminChatSessionId}
            token={telegramAdminChatToken}
            currentUser={currentUser}
            onClose={() => {
              setTelegramAdminChatSessionId(null);
              try {
                const u = new URL(window.location.href);
                u.searchParams.delete('admin_chat');
                u.searchParams.delete('token');
                window.history.replaceState({}, document.title, u.pathname + (u.search ? u.search : ''));
              } catch {}
            }}
          />
        </LazyMount>
      )}

      {/* Secure Test Loading Overlay */}
      {isLoadingPassage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <h3 style={{ margin: '18px 0 6px 0', fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
            🔒 Verifying Security & Loading Test...
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
            क्लाउड सर्वर से सुरक्षित टेस्ट डेटा लोड किया जा रहा है...
          </p>
        </div>
      )}

      <PwaInstallPrompt />
    </div>
  );
};

