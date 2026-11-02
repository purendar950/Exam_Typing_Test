import React, { useState, useEffect } from 'react';
import { Passage, TestSettings, EvaluationResult } from './types';
import { PASSAGES } from './data/passages';
import { Header } from './components/Header';
import { ChooseTest } from './components/ChooseTest';
import { StartTest } from './components/StartTest';
import { ResultScreen } from './components/ResultScreen';
import { LearnScreen } from './components/LearnScreen';
import { RulesModal } from './components/RulesModal';
import { HistoryModal } from './components/HistoryModal';
import { audioEngine } from './utils/audioEngine';

const DEFAULT_SETTINGS: TestSettings = {
  highlightEnabled: true,
  autoScroll: true,
  soundEnabled: true,
  backspaceEnabled: true,
  fullScreenEnabled: false,
  fontSize: 18,
  autoStartTimer: true
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'choose' | 'test' | 'result' | 'learn'>('choose');
  const [activeTab, setActiveTab] = useState<'tests' | 'learn'>('tests');
  const [selectedPassage, setSelectedPassage] = useState<Passage>(PASSAGES[0]);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(15);
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);

  // Settings
  const [settings, setSettings] = useState<TestSettings>(() => {
    try {
      const saved = localStorage.getItem('up_typing_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
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

  // Save settings
  const handleUpdateSettings = (newSettings: Partial<TestSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('up_typing_settings', JSON.stringify(updated));
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
  const handleFinishTest = (result: EvaluationResult) => {
    setCurrentResult(result);
    setCurrentView('result');
    // Save to history
    setHistory((prev) => {
      const updated = [result, ...prev].slice(0, 50);
      try {
        localStorage.setItem('up_typing_history', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Retake
  const handleRetakeTest = () => {
    if (selectedPassage) {
      setCurrentView('test');
    }
  };

  // Practice mistyped words drill
  const handlePracticeWrongWords = (words: string[]) => {
    if (words.length === 0) return;
    const drillText = Array(4).fill(words.join(' ')).join(' ');
    const drillPassage: Passage = {
      id: `drill-${Date.now()}`,
      title: `Focused Drill: ${words.slice(0, 3).join(', ')}...`,
      language: selectedPassage.language,
      category: selectedPassage.category,
      duration: 5,
      wordCount: drillText.split(/\s+/).length,
      difficulty: 'medium',
      text: drillText
    };
    setSelectedPassage(drillPassage);
    setSelectedDurationMinutes(5);
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
      <Header
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'learn') {
            setCurrentView('learn');
          } else {
            setCurrentView('choose');
          }
        }}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        settings={settings}
        onToggleSound={toggleSound}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'choose' && (
          <ChooseTest
            passages={PASSAGES}
            onStartTest={handleStartTest}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentView === 'test' && selectedPassage && (
          <StartTest
            passage={selectedPassage}
            durationMinutes={selectedDurationMinutes}
            settings={settings}
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
          />
        )}

        {currentView === 'learn' && (
          <LearnScreen onBackToTests={() => setCurrentView('choose')} />
        )}
      </main>

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
        </div>
      </footer>

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};
