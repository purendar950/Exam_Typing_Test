import React, { useState, useEffect } from 'react';
import {
  AiConfig,
  AI_PRESETS,
  getAiConfig,
  saveAiConfig,
  testAiConnection,
  generateAll8DailyLiveTests,
  generateCustomTest,
  fetchDailyLivePassages,
  DAILY_8_SLOTS,
  DAILY_BALANCED_SLOTS,
  getActiveProviders,
  EXAM_CATEGORY_OPTIONS,
  EXAM_RECOMMENDED_TOPICS
} from '../services/aiGenerator';
import { Passage, Language, ExamCategory } from '../types';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPassagesGenerated: (passages: Passage[]) => void;
  existingPassages: Passage[];
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onPassagesGenerated,
  existingPassages
}) => {
  const [config, setConfig] = useState<AiConfig>({
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey: '',
    model: 'gemini-2.0-flash',
    autoDaily: true
  });

  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Daily generation states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{
    completed: number;
    total: number;
    message: string;
  }>({ completed: 0, total: 8, message: '' });
  const [generatedPassages, setGeneratedPassages] = useState<Passage[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'single' | 'settings'>('generate');

  // Single test generator state
  const [singleTopic, setSingleTopic] = useState<string>('');
  const [singleLanguage, setSingleLanguage] = useState<Language>('english');
  const [singleDifficulty, setSingleDifficulty] = useState<'medium' | 'hard'>('medium');
  const [singleCategory, setSingleCategory] = useState<ExamCategory>('up_police_co');
  const [singleWords, setSingleWords] = useState<number>(540);
  const [isGeneratingSingle, setIsGeneratingSingle] = useState<boolean>(false);
  const [singleResult, setSingleResult] = useState<Passage | null>(null);
  const [singleMessage, setSingleMessage] = useState<string>('');

  const selectedCatOption = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === singleCategory);
  const currentSuggestedTopics = EXAM_RECOMMENDED_TOPICS[singleCategory] || EXAM_RECOMMENDED_TOPICS.all || [];

  const handleSingleCategoryChange = (newCat: string) => {
    setSingleCategory(newCat as ExamCategory);
    const meta = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === newCat);
    if (meta) {
      const isHi = singleLanguage.startsWith('hindi');
      setSingleWords(isHi ? meta.defaultHindiWords : meta.defaultEnglishWords);
    }
  };

  const handleSingleLanguageChange = (newLang: Language) => {
    setSingleLanguage(newLang);
    const meta = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === singleCategory);
    if (meta) {
      const isHi = newLang.startsWith('hindi');
      setSingleWords(isHi ? meta.defaultHindiWords : meta.defaultEnglishWords);
    }
  };

  // Load config on open
  useEffect(() => {
    if (isOpen) {
      getAiConfig().then((loaded) => {
        setConfig(loaded);
      });
      // Also check if today's tests already exist
      fetchDailyLivePassages(selectedDate, existingPassages).then((tests) => {
        if (tests && tests.length > 0) {
          setGeneratedPassages(tests);
        }
      });
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof AI_PRESETS)[0]) => {
    setConfig((prev) => ({
      ...prev,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel || (preset as any).model || ''
    }));
    setTestStatus({ loading: false, message: `Loaded ${preset.name} preset` });
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    const res = await testAiConnection(config);
    setTestStatus({ loading: false, success: res.success, message: res.message });
  };

  const handleSaveConfig = async () => {
    await saveAiConfig(config, true);
    setSaveStatus('✅ Configuration saved successfully to Portal & Local Storage!');
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const handleStartGeneration = async () => {
    const active = getActiveProviders(config);
    if (active.length === 0) {
      setActiveTab('settings');
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter your API Key first in AI Settings / Providers.'
      });
      return;
    }

    const totalSlots = DAILY_BALANCED_SLOTS.length;
    setIsGenerating(true);
    setGenerationProgress({
      completed: 0,
      total: totalSlots,
      message: 'Initializing AI Generator for 10 Daily Live Tests...'
    });

    try {
      // First save current config
      await saveAiConfig(config, true);

      const tests = await generateAll8DailyLiveTests(
        selectedDate,
        config,
        (completed, total, message) => {
          setGenerationProgress({ completed, total, message });
        },
        DAILY_BALANCED_SLOTS
      );

      setGeneratedPassages(tests);
      onPassagesGenerated(tests);
      setGenerationProgress({
        completed: totalSlots,
        total: totalSlots,
        message: `🎉 Successfully generated all ${totalSlots} Live Tests!`
      });
    } catch (err: any) {
      setGenerationProgress({
        completed: 0,
        total: totalSlots,
        message: `❌ Generation Error: ${err?.message || 'Unknown error occurred'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSingleTest = async () => {
    if (!config.apiKey.trim()) {
      setActiveTab('settings');
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter your API Key first in AI Settings.'
      });
      return;
    }
    if (!singleTopic.trim()) {
      setSingleMessage('❌ Please enter a passage topic or select one of the suggested topics below.');
      return;
    }

    setIsGeneratingSingle(true);
    setSingleMessage('⏳ Generating AR Typing calibrated test passage with AI...');
    setSingleResult(null);

    try {
      await saveAiConfig(config, true);
      const newPassage = await generateCustomTest({
        language: singleLanguage,
        difficulty: singleDifficulty,
        category: singleCategory,
        topic: singleTopic,
        targetWords: singleWords,
        config
      });

      setSingleResult(newPassage);
      onPassagesGenerated([newPassage, ...existingPassages]);
      setSingleMessage(`🎉 Successfully created test: "${newPassage.title}" (${newPassage.wordCount} words • ${singleDifficulty.toUpperCase()})!`);
    } catch (err: any) {
      setSingleMessage(`❌ Error: ${err?.message || 'Failed to generate test'}`);
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'var(--tw-sky-600)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>⚡</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                AI Live Test Generator (AR Typing Standard)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--tw-sky-100)' }}>
                Generate 8 Daily Practice Tests • 4 English & 4 Hindi (Medium & Hard) • 520–580 Words
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--bd-slate-200)',
            background: 'var(--bg-slate-50)',
            padding: '0 16px'
          }}
        >
          <button
            onClick={() => setActiveTab('generate')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              borderBottom: activeTab === 'generate' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent',
              color: activeTab === 'generate' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)'
            }}
          >
            🔥 8 Daily Live Tests Generator
          </button>
          <button
            onClick={() => setActiveTab('single')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              borderBottom: activeTab === 'single' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent',
              color: activeTab === 'single' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)'
            }}
          >
            ⚡ Single Test Generator (AR Typing)
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              borderBottom: activeTab === 'settings' ? '2.5px solid var(--tw-sky-600)' : '2.5px solid transparent',
              color: activeTab === 'settings' ? 'var(--fg-sky-600)' : 'var(--fg-slate-500)'
            }}
          >
            ⚙️ AI Provider & API Settings
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'generate' ? (
            <div>
              {/* Daily Pool Overview Card */}
              <div
                style={{
                  background: 'var(--bg-sky-50)',
                  border: '1px solid var(--bd-sky-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-sky-700)' }}>
                      📅 Daily Live Exam Schedule
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-sky-600)' }}>
                      8 Tests daily calibrated to official UP Police CO & ASI hall benchmark.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--fg-slate-700)' }}>Exam Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1.5px solid var(--bd-slate-300)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    />
                  </div>
                </div>

                {/* Slots Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '8px',
                    marginTop: '12px'
                  }}
                >
                  {DAILY_8_SLOTS.map((slot) => {
                    const isHard = slot.difficulty === 'hard';
                    const isHindi = slot.language.startsWith('hindi');
                    return (
                      <div
                        key={slot.slot}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--bd-slate-200)',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 10px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--fg-slate-800)' }}>
                            {isHindi ? '🇮🇳' : '🇬🇧'} #{slot.slot}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 600,
                              background: isHard ? 'var(--bg-red-100)' : 'var(--bg-blue-100)',
                              color: isHard ? 'var(--fg-red-800)' : 'var(--fg-blue-800)'
                            }}
                          >
                            {isHard ? 'HARD • Long Words' : 'MED'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--fg-slate-600)', fontWeight: 500, lineHeight: 1.2 }}>{slot.subType}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Box if Generating */}
              {isGenerating && (
                <div
                  style={{
                    background: 'var(--bg-amber-100)',
                    border: '1px solid var(--bd-amber-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-amber-800)' }}>
                      ⚡ Generating Tests ({generationProgress.completed} / {generationProgress.total})
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--fg-amber-800)' }}>
                      {Math.round((generationProgress.completed / generationProgress.total) * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'var(--bg-amber-200)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(generationProgress.completed / generationProgress.total) * 100}%`,
                        background: 'var(--tw-amber-600)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--fg-amber-900)' }}>{generationProgress.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleStartGeneration}
                  disabled={isGenerating}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    background: isGenerating ? 'var(--tw-slate-400)' : 'var(--tw-sky-600)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 20px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <span>⚡</span>
                  <span>{isGenerating ? 'Generating Tests with AI...' : `Generate 8 Live Tests for ${selectedDate}`}</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  style={{
                    background: 'var(--bg-slate-50)',
                    color: 'var(--fg-slate-700)',
                    border: '1.5px solid var(--bd-slate-300)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 18px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>⚙️</span>
                  <span>API Settings</span>
                </button>
              </div>

              {/* Current Active Tests Preview */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-slate-700)' }}>
                  📋 Tests for {selectedDate} ({generatedPassages.length} Available)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {generatedPassages.map((p, idx) => {
                    const isHindi = p.language.startsWith('hindi');
                    const isHard = p.difficulty === 'hard';
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-slate-50)',
                          border: '1px solid var(--bd-slate-200)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>{isHindi ? '🇮🇳' : '🇬🇧'}</span>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--fg-slate-800)' }}>
                              #{idx + 1}. {p.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                              {p.wordCount} words • 15 Minutes •{' '}
                              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{p.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isHard ? 'var(--bg-red-50)' : 'var(--bg-blue-50)',
                            color: isHard ? 'var(--fg-red-600)' : 'var(--fg-blue-600)'
                          }}
                        >
                          {p.language === 'english' ? 'English' : p.language === 'hindi_mangal' ? 'Mangal' : 'Kruti Dev'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'single' ? (
            <div>
              {/* Header card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--bg-green-50) 0%, var(--bg-emerald-50) 100%)',
                  border: '1.5px solid var(--bd-green-300)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  marginBottom: '20px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-green-900)' }}>
                  ⚡ AR Typing Single Test Generator (Medium & Hard Calibrated)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-green-800)', lineHeight: 1.4 }}>
                  Generate on-demand 15-minute exam tests calibrated strictly to official UP Police CO & ASI standards.
                  Medium passages provide balanced 500–540 word administrative prose; Hard passages feature 520–580 words of legal, forensic, and high-vocabulary complexity.
                </p>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                {/* Language */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '6px' }}>
                    Language & Keyboard Layout:
                  </label>
                  <select
                    value={singleLanguage}
                    onChange={(e) => handleSingleLanguageChange(e.target.value as Language)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--bd-slate-300)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      background: 'var(--surface)',
                      color: 'var(--fg-slate-900)'
                    }}
                  >
                    <option value="english">🇬🇧 English (QWERTY • 30–35 WPM)</option>
                    <option value="hindi_mangal">🇮🇳 हिंदी मंगल (Mangal Inscript • 25–30 WPM)</option>
                    <option value="hindi_kruti">🇮🇳 हिंदी कुर्ती देव (Kruti Dev 010 • 25–30 WPM)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '6px' }}>
                    Difficulty Standard (AR Typing):
                  </label>
                  <select
                    value={singleDifficulty}
                    onChange={(e) => {
                      const diff = e.target.value as 'medium' | 'hard';
                      setSingleDifficulty(diff);
                      const meta = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === singleCategory);
                      const base = singleLanguage.startsWith('hindi') ? (meta?.defaultHindiWords || 430) : (meta?.defaultEnglishWords || 520);
                      setSingleWords(diff === 'hard' ? base + 20 : base);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: singleDifficulty === 'hard' ? '1.5px solid var(--tw-red-400)' : '1.5px solid var(--bd-slate-300)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: singleDifficulty === 'hard' ? 'var(--bg-red-50)' : 'var(--surface)',
                      color: singleDifficulty === 'hard' ? 'var(--fg-red-700)' : 'var(--fg-slate-900)'
                    }}
                  >
                    <option value="medium">🟡 MEDIUM (Balanced Exam Standard)</option>
                    <option value="hard">🔴 HARD (AR Typing Kathin: Longer Words 8–16+ letters, AWL ≥ 7.2)</option>
                  </select>
                </div>

                {/* Exam Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '6px' }}>
                    Target Exam Series:
                  </label>
                  <select
                    value={singleCategory}
                    onChange={(e) => handleSingleCategoryChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--bd-slate-300)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      background: 'var(--surface)',
                      color: 'var(--fg-slate-900)'
                    }}
                  >
                    {EXAM_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {selectedCatOption && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '0.75rem',
                        lineHeight: '1.35',
                        color: 'var(--fg-sky-700)',
                        background: 'var(--bg-sky-50)',
                        border: '1px solid var(--bd-sky-200)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '5px 8px'
                      }}
                    >
                      🎯 <strong>Standard:</strong> {selectedCatOption.platformNotes}
                    </div>
                  )}
                </div>

                {/* Word Count */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '6px' }}>
                    Target Words: <span style={{ color: 'var(--fg-sky-600)' }}>{singleWords} words</span>
                  </label>
                  <input
                    type="range"
                    min={150}
                    max={600}
                    step={10}
                    value={singleWords}
                    onChange={(e) => setSingleWords(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#0284c7', marginTop: '6px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                    <span>150w (5m)</span>
                    <span>350w (10m)</span>
                    <span>540w (15m)</span>
                    <span>600w</span>
                  </div>
                </div>
              </div>

              {/* Topic Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '6px' }}>
                  Passage Topic / Theme:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Security, Bharatiya Nyaya Sanhita, Emergency Dial 112, High Court Judgments..."
                  value={singleTopic}
                  onChange={(e) => setSingleTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--bd-slate-300)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    boxSizing: 'border-box'
                  }}
                />

                {/* Topic Suggestion Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', alignSelf: 'center' }}>
                    Suggested ({selectedCatOption?.label.split(' ')[1] || 'Exam'}):
                  </span>
                  {currentSuggestedTopics.map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setSingleTopic(sugg)}
                      style={{
                        background: 'var(--bg-slate-100)',
                        border: '1px solid var(--bd-slate-300)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '3px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--fg-slate-700)',
                        cursor: 'pointer'
                      }}
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & Action */}
              {singleMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '14px',
                    background: singleMessage.includes('❌') ? 'var(--bg-red-50)' : singleMessage.includes('⏳') ? 'var(--bg-amber-100)' : 'var(--bg-green-50)',
                    color: singleMessage.includes('❌') ? 'var(--fg-red-700)' : singleMessage.includes('⏳') ? 'var(--fg-amber-800)' : 'var(--fg-green-700)',
                    border: singleMessage.includes('❌') ? '1px solid var(--bd-red-200)' : singleMessage.includes('⏳') ? '1px solid var(--bd-amber-200)' : '1px solid var(--bd-green-200)'
                  }}
                >
                  {singleMessage}
                </div>
              )}

              <button
                onClick={handleGenerateSingleTest}
                disabled={isGeneratingSingle}
                style={{
                  background: isGeneratingSingle ? 'var(--tw-slate-400)' : 'var(--tw-sky-600)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: isGeneratingSingle ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: '20px'
                }}
              >
                <span>{isGeneratingSingle ? '⏳' : '⚡'}</span>
                <span>{isGeneratingSingle ? 'Generating AR Typing Test with AI...' : `Generate ${singleDifficulty.toUpperCase()} Test (${singleWords}w)`}</span>
              </button>

              {/* Result Preview Box if generated */}
              {singleResult && (
                <div
                  style={{
                    background: 'var(--bg-slate-50)',
                    border: '1.5px solid var(--bd-slate-300)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    marginTop: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{singleResult.language.startsWith('hindi') ? '🇮🇳' : '🇬🇧'}</span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                        {singleResult.title}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: singleResult.difficulty === 'hard' ? 'var(--bg-red-100)' : 'var(--bg-green-50)',
                          color: singleResult.difficulty === 'hard' ? 'var(--fg-red-700)' : 'var(--fg-green-700)'
                        }}
                      >
                        {singleResult.difficulty === 'hard' ? 'HARD • LONG WORDS' : 'MEDIUM'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-sky-100)', color: 'var(--fg-sky-700)' }}>
                        {singleResult.wordCount} words
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-slate-100)', color: 'var(--fg-slate-600)' }}>
                        ⏱️ 15:00
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: '12px',
                      background: 'var(--surface)',
                      border: '1px solid var(--bd-slate-200)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--fg-slate-700)'
                    }}
                  >
                    {singleResult.text}
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--fg-green-700)', fontWeight: 500 }}>
                    ✅ Test has been added to your local library and synced. You can find it in the test list!
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Presets Row */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '8px' }}>
                  ⚡ Quick Provider Presets:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  {AI_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '8px 12px',
                        background: config.baseUrl === preset.baseUrl ? 'var(--bg-sky-100)' : 'var(--bg-slate-50)',
                        border: config.baseUrl === preset.baseUrl ? '1.5px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-200)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: config.baseUrl === preset.baseUrl ? 'var(--fg-sky-700)' : 'var(--fg-slate-700)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{preset.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>{preset.defaultModel || (preset as any).model}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '4px' }}>
                    API Base URL (OpenAI-Compatible endpoint):
                  </label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                    placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1.5px solid var(--bd-slate-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                    Works with Google Gemini, OpenAI, OpenRouter, Groq, Ollama, etc.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '4px' }}>
                    API Key:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="Paste your API Key here (e.g., AIzaSy... or sk-...)"
                      style={{
                        width: '100%',
                        padding: '8px 45px 8px 12px',
                        border: '1.5px solid var(--bd-slate-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: 'var(--fg-slate-500)'
                      }}
                    >
                      {showApiKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                    Stored securely in your Cloud Firestore system config and synced locally.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '4px' }}>
                    AI Model Identifier:
                  </label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    placeholder="gemini-2.5-flash or gpt-4o-mini"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1.5px solid var(--bd-slate-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Test Connection Status Banner */}
                {testStatus.message && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      background: testStatus.success ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                      color: testStatus.success ? 'var(--fg-green-700)' : 'var(--fg-red-800)',
                      border: testStatus.success ? '1px solid var(--bd-green-300)' : '1px solid var(--bd-red-300)'
                    }}
                  >
                    {testStatus.message}
                  </div>
                )}

                {saveStatus && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      background: 'var(--bg-green-100)',
                      color: 'var(--fg-green-700)',
                      border: '1px solid var(--bd-green-300)'
                    }}
                  >
                    {saveStatus}
                  </div>
                )}

                {/* Settings Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus.loading}
                    style={{
                      padding: '10px 16px',
                      background: 'var(--bg-slate-100)',
                      border: '1.5px solid var(--bd-slate-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    {testStatus.loading ? 'Testing...' : '🔌 Test API Connection'}
                  </button>

                  <button
                    onClick={handleSaveConfig}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'var(--tw-sky-600)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💾 Save AI Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
