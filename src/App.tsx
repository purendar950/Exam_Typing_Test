import React, { useState, useEffect } from 'react';
import { Passage, TestSettings, EvaluationResult, ExamProfile } from './types';
import { PASSAGES } from './data/passages';
import { Header } from './components/Header';
import { ChooseTest } from './components/ChooseTest';
import { StartTest } from './components/StartTest';
import { ResultScreen } from './components/ResultScreen';
import { LearnScreen } from './components/LearnScreen';
import { WordDocumentScreen } from './components/WordDocumentScreen';
import { RulesModal } from './components/RulesModal';
import { HistoryModal } from './components/HistoryModal';
import { HindiHelperModal } from './components/HindiHelperModal';
import { AuthModal } from './components/AuthModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { PaymentModal } from './components/PaymentModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { audioEngine } from './utils/audioEngine';
import { fetchDailyLivePassages, triggerAutoDailyGenerationIfDue } from './services/aiGenerator';
import { fetchAllCustomPassages } from './services/adminService';
import {
  handleTelegramApprovalFromUrl,
  getTelegramConfig,
  TelegramConfig
} from './services/telegramService';
import { isTestLocked } from './services/paymentService';
import {
  subscribeToAuth,
  saveTestResultToCloud,
  fetchUserTestAttempts,
  logoutUser,
  UserProfile,
  isUserAdmin
} from './services/firebase';

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
  const [currentView, setCurrentView] = useState<'choose' | 'test' | 'result' | 'learn' | 'book'>('choose');
  const [activeTab, setActiveTab] = useState<'tests' | 'learn' | 'book'>('tests');
  const [selectedPassage, setSelectedPassage] = useState<Passage>(PASSAGES[0]);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(15);
  const [selectedExamProfile, setSelectedExamProfile] = useState<ExamProfile | null>(null);
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);

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
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isHindiHelperOpen, setIsHindiHelperOpen] = useState<boolean>(false);
  // Active Authenticated / Candidate User
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('up_typing_active_user');
      return raw ? JSON.parse(raw) : null;
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
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [paymentInitialExamId, setPaymentInitialExamId] = useState<string | undefined>(undefined);
  const [dailyLivePassages, setDailyLivePassages] = useState<Passage[]>([]);

  const handleOpenPayment = (examId?: string) => {
    setPaymentInitialExamId(examId);
    setIsPaymentOpen(true);
  };
  const [customPassages, setCustomPassages] = useState<Passage[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);
  const [telegramToast, setTelegramToast] = useState<{ success: boolean; message: string } | null>(null);

  // Automatically fetch today's 8 Daily Live Tests, Custom Passages and handle Telegram 1-click approvals
  useEffect(() => {
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

  // Start test
  const handleStartTest = (passage: Passage, customDurationMinutes?: number, examProfile?: ExamProfile | null) => {
    // Pro Paywall Guard: First 7 tests of each exam are free demo.
    // Tests #8+ require Pro subscription or Admin privileges.
    const examId = examProfile?.id || passage.examSlug;
    const catGroup = examProfile?.categoryGroup || passage.categoryGroup;
    const access = isTestLocked(passage.testNumber, 0, currentUser, examId, catGroup);

    if (access.isLocked) {
      handleOpenPayment(examId);
      return;
    }

    setSelectedPassage(passage);
    if (examProfile !== undefined) {
      setSelectedExamProfile(examProfile);
    }
    const finalDuration = customDurationMinutes || examProfile?.durationMinutes || passage.duration || 15;
    setSelectedDurationMinutes(finalDuration);
    setCurrentView('test');
  };

  // Finish test
  const handleFinishTest = async (result: EvaluationResult) => {
    setCurrentResult(result);
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
        await saveTestResultToCloud(currentUser.uid, result);
      } catch (err) {
        console.warn('Failed cloud test sync:', err);
      }
    }
  };

  // Retake
  const handleRetakeTest = () => {
    if (selectedPassage) {
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
              setCurrentView('learn');
            } else if (tab === 'book') {
              setCurrentView('book');
            } else {
              setCurrentView('choose');
            }
          }}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenHindiHelper={() => setIsHindiHelperOpen(true)}
          onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenPayment={() => handleOpenPayment()}
          settings={settings}
          onToggleSound={toggleSound}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
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
          />
        )}

        {currentView === 'test' && selectedPassage && (
          <StartTest
            passage={selectedPassage}
            durationMinutes={selectedDurationMinutes}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onFinishTest={handleFinishTest}
            onCancelTest={() => setCurrentView('choose')}
            activeExamProfile={selectedExamProfile}
          />
        )}

        {currentView === 'result' && currentResult && (
          <ResultScreen
            result={currentResult}
            onRetakeTest={handleRetakeTest}
            onChooseAnother={() => setCurrentView('choose')}
            onPracticeWrongWords={handlePracticeWrongWords}
            onOpenDashboard={() => {
              if (currentUser) {
                setIsDashboardOpen(true);
              } else {
                setIsAuthOpen(true);
              }
            }}
          />
        )}

        {currentView === 'learn' && (
          <LearnScreen onBackToTests={() => setCurrentView('choose')} />
        )}

        {currentView === 'book' && (
          <WordDocumentScreen
            onBackToTests={() => {
              setActiveTab('tests');
              setCurrentView('choose');
            }}
          />
        )}
      </main>

      {currentView !== 'book' && currentView !== 'test' && (
        <footer
          style={{
            background: '#ffffff',
            borderTop: '1px solid var(--border-color)',
            padding: '20px 0',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}
        >
          <div className="container">
            <p>
              <strong>Uttar Pradesh Police & UPSSSC Computer Operator Typing Mentor</strong> &bull; Based on UPPRPB Official Standards (Hindi 25 WPM Mangal/Kruti, English 30 WPM, 85% Accuracy).
            </p>
            {currentUser && isUserAdmin(currentUser) && (
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsAdminOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>🛡️</span>
                  <span>Examination Authority Admin Portal</span>
                </button>
              </div>
            )}
          </div>
        </footer>
      )}

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />

      <HindiHelperModal
        isOpen={isHindiHelperOpen}
        onClose={() => setIsHindiHelperOpen(false)}
        defaultLayout={selectedPassage?.language === 'hindi_kruti' ? 'kruti' : 'mangal'}
      />

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
          setSettings((prev) => ({
            ...prev,
            candidateName: user.displayName
          }));
          if (isUserAdmin(user)) {
            setIsAdminOpen(true);
          }
        }}
      />

      {currentUser && (
        <UserDashboardModal
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          user={currentUser}
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
        />
      )}

      <AiGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onPassagesGenerated={(tests) => {
          setDailyLivePassages(tests);
        }}
        existingPassages={PASSAGES}
      />

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
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentInitialExamId(undefined);
        }}
        currentUser={currentUser}
        initialSelectedExamId={paymentInitialExamId}
      />

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

      {/* Floating Telegram Channel Action Button (like MockMatrixHub) */}
      {currentView !== 'test' && (
        <a
          href={telegramConfig?.communityChannelUrl || 'https://t.me/SSC_PYQ_COMPILATIONS'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2aabee 0%, #229ed9 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(34, 158, 217, 0.45)',
            zIndex: 999,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'transform 0.15s ease'
          }}
          title="Join Official Telegram Channel for PYQs, Live Tests & Alerts"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </a>
      )}

      <PwaInstallPrompt />
    </div>
  );
};
