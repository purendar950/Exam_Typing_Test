import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Passage, TestSettings, EvaluationResult, ExamProfile } from './types';
import { PASSAGES } from './data/passages';
import { ALL_EXAMS } from './data/allExams';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
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
  isUserAdmin,
  needsAccountUpgrade
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
const AccountUpgradeModal = lazy(() => loadChunk(() => import('./components/AccountUpgradeModal')).then((m) => ({ default: m.AccountUpgradeModal })));
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
  <div role="status" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--fg-slate-500)', fontWeight: 600 }}>
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

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
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
  // Full text of the free demo tests lives in a lazy chunk (data-free-text) so the
  // site paints before it downloads. Hydrated after first paint, on demand at start.
  const [freePassageText, setFreePassageText] = useState<Record<string, string>>({});

  const handleOpenPayment = (examId?: string, planId?: string) => {
    setPaymentInitialExamId(examId);
    setPaymentInitialPlanId(planId);
    setIsPaymentOpen(true);
  };
  const [customPassages, setCustomPassages] = useState<Passage[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);
  const [telegramToast, setTelegramToast] = useState<{ success: boolean; message: string } | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const showNotice = (message: string, success = false) => {
    window.clearTimeout(noticeTimer.current);
    setTelegramToast({ success, message });
    noticeTimer.current = window.setTimeout(() => setTelegramToast(null), 6000);
  };
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

  // Load the free-demo texts after the site has painted (idle), so the boot
  // bundle stays small while content search keeps working.
  useEffect(() => {
    const idle = (window as typeof window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    const later = (cb: () => void) => (idle ? idle(cb) : window.setTimeout(cb, 2000));
    later(() => {
      import('./data/passagesFreeText')
        .then((m) => setFreePassageText(m.FREE_PASSAGE_TEXT))
        .catch(() => {});
    });
  }, []);

  // Plan expiry countdown for the renewal banner
  const planExpiry = React.useMemo(() => {
    const u = currentUser;
    if (!u || !u.is_subscribed || u.isAdmin || !u.subscriptionExpiresAt) return null;
    const raw = u.subscriptionExpiresAt;
    // Firestore stores UTC times sometimes without a trailing 'Z'
    const iso = /Z$|[+-]\d\d:?\d\d$/.test(raw) ? raw : raw + 'Z';
    const ms = new Date(iso).getTime() - Date.now();
    if (isNaN(ms)) return null;
    return { days: Math.ceil(ms / 86400000) };
  }, [currentUser]);

  // Combined Passages (Custom Passages + Live Tests + Bank)
  const allPassages = React.useMemo(() => {
    const bank = freePassageText && Object.keys(freePassageText).length > 0
      ? PASSAGES.map((p) => (p.text ? p : { ...p, text: freePassageText[p.id] || p.text }))
      : PASSAGES;
    const basePool = [...customPassages, ...bank];
    if (dailyLivePassages.length > 0) {
      const liveIds = new Set(dailyLivePassages.map((p) => p.id));
      const remaining = basePool.filter((p) => !liveIds.has(p.id));
      return [...dailyLivePassages, ...remaining];
    }
    return basePool;
  }, [customPassages, dailyLivePassages, freePassageText]);

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
      showNotice(`Test #${access.testNumber} is a Pro test. Pick a plan to unlock it.`, true);
      handleOpenPayment(examId);
      return;
    }

    let finalPassage = passage;
    const isPaidTest = (passage.testNumber ?? 0) > 7;

    // Free demo: the text may not have arrived with the pool yet (slow device) —
    // fetch it from the lazy text chunk right here.
    if (!isPaidTest && !passage.text?.trim()) {
      let text = freePassageText[passage.id];
      if (!text) {
        try {
          const m = await import('./data/passagesFreeText');
          text = m.FREE_PASSAGE_TEXT[passage.id];
          if (text) setFreePassageText((prev) => ({ ...prev, [passage.id]: text as string }));
        } catch {}
      }
      if (!text || !text.trim()) {
        showNotice('Could not load this test. Please check your internet connection and try again.');
        return;
      }
      finalPassage = { ...passage, text };
    }

    // Server-Side Verification & Content Delivery for Paid Tests (#8+)
    if (isPaidTest) {
      setIsLoadingPassage(true);
      try {
        const fetchRes = await fetchPaidPassageText(passage.id);
        if (fetchRes.success && fetchRes.text && fetchRes.text.trim().length > 0) {
          finalPassage = { ...passage, text: fetchRes.text };
        } else if (fetchRes.isPermissionDenied) {
          setIsLoadingPassage(false);
          showNotice(`Test #${passage.testNumber || ''} needs an active Pro plan. Pick or renew a plan to unlock it.`, true);
          handleOpenPayment(examId);
          return;
        } else {
          // Hard security failure — NEVER proceed without verified server content
          setIsLoadingPassage(false);
          showNotice(fetchRes.error || 'Could not load this test. Please try again.');
          return;
        }
      } catch (err) {
        console.error('Paid passage security fetch error:', err);
        setIsLoadingPassage(false);
        showNotice('Could not load this test. Check your internet connection and try again.');
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

  const selectTab = (tab: 'tests' | 'learn' | 'book') => {
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
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {currentView !== 'test' && (
        <Header
          currentTab={activeTab}
          onSelectTab={selectTab}
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

      {currentView !== 'test' && (
        <BottomNav
          currentTab={activeTab}
          isLoggedIn={!!currentUser}
          onSelectTab={selectTab}
          onOpenMyCourses={() => setIsMyCoursesOpen(true)}
          onOpenAccount={() => {
            if (!currentUser) {
              setIsAuthOpen(true);
              return;
            }
            setDashboardInitialTab('overview');
            setIsDashboardOpen(true);
          }}
          onOpenPayment={() => handleOpenPayment()}
          onOpenHindiHelper={() => setIsHindiHelperOpen(true)}
          onOpenRules={() => openRulesModal()}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
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

      {/* ⏳ PLAN EXPIRY REMINDER (7 days before expiry, and after it expires) */}
      {planExpiry && planExpiry.days <= 7 && currentView !== 'test' &&
        sessionStorage.getItem('up_expiry_banner_dismissed') !== new Date().toISOString().split('T')[0] && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '8px 16px 0',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: planExpiry.days < 0 ? 'var(--bg-red-50)' : 'var(--bg-amber-50)',
            border: `1px solid ${planExpiry.days < 0 ? 'var(--bd-red-200)' : 'var(--bd-amber-200)'}`,
            color: planExpiry.days < 0 ? 'var(--fg-red-700)' : 'var(--fg-amber-800)',
            fontSize: '0.875rem',
            fontWeight: 500,
            flexWrap: 'wrap'
          }}
          role="status"
        >
          <span style={{ flex: 1, minWidth: '200px' }}>
            {planExpiry.days < 0
              ? '⏳ Your plan has expired. Renew now to keep full access to all Pro tests.'
              : planExpiry.days === 0
                ? '⏳ Your plan expires today. Renew now to keep full access to all Pro tests.'
                : `⏳ Your plan expires in ${planExpiry.days} day${planExpiry.days === 1 ? '' : 's'}. Renew now to keep full access to all Pro tests.`}
          </span>
          <button
            onClick={() => handleOpenPayment(currentUser?.subscriptionExamId !== 'all' ? currentUser?.subscriptionExamId : undefined)}
            style={{
              background: 'linear-gradient(135deg, var(--tw-blue-900), var(--tw-sky-600))',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Renew now
          </button>
          <button
            aria-label="Dismiss expiry reminder"
            onClick={() => sessionStorage.setItem('up_expiry_banner_dismissed', new Date().toISOString().split('T')[0])}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.1rem', padding: '2px 6px' }}
          >
            ×
          </button>
        </div>
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
        <footer className="site-footer">
          <div className="container site-footer-inner">
            <div className="site-footer-grid">
              <div className="site-footer-brand">
                <div className="site-footer-logo">
                  <img
                    src={appLogo}
                    alt=""
                    width={32}
                    height={32}
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                  <span>Exam Typing</span>
                </div>
                <p>
                  Typing practice for government exams: UP Police Computer Operator and ASI, UPSSSC, Allahabad High Court, SSC CGL/CHSL and more.
                </p>
                <p className="site-footer-note">
                  An independent practice tool. Not affiliated with UPPRPB, UPSSSC, SSC or any recruitment board.
                </p>
              </div>

              <nav aria-label="Support" className="site-footer-col">
                <h4>Support</h4>
                <a href="https://t.me/Exam_Typing_Mentor" target="_blank" rel="noopener noreferrer">Telegram channel</a>
                <a href="https://t.me/+Lw-tPbRqOOc2ZTA1" target="_blank" rel="noopener noreferrer">Student group</a>
                <a href="https://t.me/purendare" target="_blank" rel="noopener noreferrer">Message us on Telegram</a>
                <button type="button" onClick={() => openLegalModal('contact')}>Contact</button>
                {currentUser && isUserAdmin(currentUser) && (
                  <button type="button" onClick={() => setIsAdminOpen(true)}>Admin panel</button>
                )}
              </nav>

              <nav aria-label="Legal" className="site-footer-col">
                <h4>Legal</h4>
                <button type="button" onClick={() => openLegalModal('terms')}>Terms of use</button>
                <button type="button" onClick={() => openLegalModal('privacy')}>Privacy policy</button>
                <button type="button" onClick={() => openLegalModal('refund')}>Refund policy</button>
                <button type="button" onClick={() => openLegalModal('copyright')}>Copyright</button>
                <button type="button" onClick={() => openLegalModal('disclaimer')}>Disclaimer</button>
              </nav>
            </div>

            <div className="site-footer-bottom">&copy; {new Date().getFullYear()} Exam Typing</div>
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

      {currentUser && needsAccountUpgrade(currentUser) && (
        <Suspense fallback={null}>
          <AccountUpgradeModal
            user={currentUser}
            onUpgraded={(user) => setCurrentUser({ ...currentUser, ...user })}
            onLogout={async () => {
              await logoutUser();
              setCurrentUser(null);
            }}
          />
        </Suspense>
      )}

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
            maxWidth: 'calc(100vw - 24px)',
            background: telegramToast.success ? 'var(--tw-slate-900)' : 'var(--tw-red-800)',
            color: '#ffffff',
            padding: '12px 22px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: telegramToast.success ? '1.5px solid var(--tw-sky-400)' : '1.5px solid var(--tw-red-400)'
          }}
        >
          <span>{telegramToast.success ? '⚡' : '⚠️'}</span>
          <span>{telegramToast.message}</span>
          <button
            aria-label="Dismiss"
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
              borderTopColor: 'var(--tw-sky-400)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <h3 style={{ margin: '18px 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--tw-slate-50)' }}>
            🔒 Verifying Security & Loading Test...
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--tw-slate-400)' }}>
            क्लाउड सर्वर से सुरक्षित टेस्ट डेटा लोड किया जा रहा है...
          </p>
        </div>
      )}

      <PwaInstallPrompt />
    </div>
  );
};

