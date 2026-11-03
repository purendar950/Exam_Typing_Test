import React, { useState, useEffect } from 'react';
import { Passage, TestSettings, EvaluationResult } from './types';
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
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { audioEngine } from './utils/audioEngine';
import { fetchDailyLivePassages } from './services/aiGenerator';
import { fetchAllCustomPassages } from './services/adminService';
import {
  subscribeToAuth,
  saveTestResultToCloud,
  fetchUserTestAttempts,
  logoutUser,
  UserProfile
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
  const [dailyLivePassages, setDailyLivePassages] = useState<Passage[]>([]);
  const [customPassages, setCustomPassages] = useState<Passage[]>([]);

  // Automatically fetch today's 8 Daily Live Tests and Custom Passages on app load
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
  const handleStartTest = (passage: Passage, customDurationMinutes: number = 15) => {
    setSelectedPassage(passage);
    setSelectedDurationMinutes(customDurationMinutes);
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
      />

      <PwaInstallPrompt />
    </div>
  );
};
