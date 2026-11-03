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
  DAILY_8_SLOTS
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
    model: 'gemini-2.5-flash',
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
    if (!config.apiKey.trim()) {
      setActiveTab('settings');
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter your API Key first in AI Settings.'
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({
      completed: 0,
      total: 8,
      message: 'Initializing AI Generator for 8 Daily Live Tests...'
    });

    try {
      // First save current config
      await saveAiConfig(config, true);

      const tests = await generateAll8DailyLiveTests(
        selectedDate,
        config,
        (completed, total, message) => {
          setGenerationProgress({ completed, total, message });
        }
      );

      setGeneratedPassages(tests);
      onPassagesGenerated(tests);
      setGenerationProgress({
        completed: 8,
        total: 8,
        message: '🎉 Successfully generated all 8 Live Tests!'
      });
    } catch (err: any) {
      setGenerationProgress({
        completed: 0,
        total: 8,
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
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.75rem' }}>⚡</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                AI Live Test Generator (AR Typing Standard)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#e0f2fe' }}>
                Generate 8 Daily Official Tests • 4 English & 4 Hindi (Medium & Hard) • 520–580 Words
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
              fontSize: '1.2rem',
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
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '0 16px'
          }}
        >
          <button
            onClick={() => setActiveTab('generate')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'generate' ? '2.5px solid #0284c7' : '2.5px solid transparent',
              color: activeTab === 'generate' ? '#0284c7' : '#64748b'
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
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'single' ? '2.5px solid #0284c7' : '2.5px solid transparent',
              color: activeTab === 'single' ? '#0284c7' : '#64748b'
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
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === 'settings' ? '2.5px solid #0284c7' : '2.5px solid transparent',
              color: activeTab === 'settings' ? '#0284c7' : '#64748b'
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
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0369a1' }}>
                      📅 Daily Live Examination Schedule
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#0284c7' }}>
                      8 Tests daily calibrated to official UP Police CO & ASI hall benchmark.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Exam Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600
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
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>
                            {isHindi ? '🇮🇳' : '🇬🇧'} #{slot.slot}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              background: isHard ? '#fee2e2' : '#dbeafe',
                              color: isHard ? '#991b1b' : '#1e40af'
                            }}
                          >
                            {isHard ? 'HARD • Long Words' : 'MED'}
                          </span>
                        </div>
                        <div style={{ color: '#475569', fontWeight: 500, lineHeight: 1.2 }}>{slot.subType}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Box if Generating */}
              {isGenerating && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                      ⚡ Generating Tests ({generationProgress.completed} / {generationProgress.total})
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
                      {Math.round((generationProgress.completed / generationProgress.total) * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: '#fde68a',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(generationProgress.completed / generationProgress.total) * 100}%`,
                        background: '#d97706',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f' }}>{generationProgress.message}</p>
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
                    background: isGenerating ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <span>⚡</span>
                  <span>{isGenerating ? 'Generating Tests with AI...' : `Generate 8 Live Tests for ${selectedDate}`}</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  style={{
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '12px 18px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
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
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
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
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{isHindi ? '🇮🇳' : '🇬🇧'}</span>
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                              #{idx + 1}. {p.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {p.wordCount} words • 15 Minutes •{' '}
                              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{p.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isHard ? '#fef2f2' : '#eff6ff',
                            color: isHard ? '#dc2626' : '#2563eb'
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
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '20px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#14532d' }}>
                  ⚡ AR Typing Single Test Generator (Medium & Hard Calibrated)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#166534', lineHeight: 1.4 }}>
                  Generate on-demand 15-minute examination tests calibrated strictly to official UP Police CO & ASI standards.
                  Medium passages provide balanced 500–540 word administrative prose; Hard passages feature 520–580 words of legal, forensic, and high-vocabulary complexity.
                </p>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                {/* Language */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Language & Keyboard Layout:
                  </label>
                  <select
                    value={singleLanguage}
                    onChange={(e) => setSingleLanguage(e.target.value as Language)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                  >
                    <option value="english">🇬🇧 English (30 WPM Benchmark)</option>
                    <option value="hindi_mangal">🇮🇳 हिंदी मंगल (Inscript • 25 WPM)</option>
                    <option value="hindi_kruti">🇮🇳 हिंदी कुर्ती देव (Kruti Dev 010 • 25 WPM)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Difficulty Standard (AR Typing):
                  </label>
                  <select
                    value={singleDifficulty}
                    onChange={(e) => {
                      const diff = e.target.value as 'medium' | 'hard';
                      setSingleDifficulty(diff);
                      setSingleWords(diff === 'hard' ? 550 : 520);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: singleDifficulty === 'hard' ? '1.5px solid #f87171' : '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      background: singleDifficulty === 'hard' ? '#fef2f2' : '#ffffff',
                      color: singleDifficulty === 'hard' ? '#b91c1c' : '#0f172a'
                    }}
                  >
                    <option value="medium">🟡 MEDIUM (500–540w • Balanced Editorial)</option>
                    <option value="hard">🔴 HARD (520–580w • Longer Words 8–16+ letters, AWL ≥ 7.0)</option>
                  </select>
                </div>

                {/* Exam Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Target Examination Series:
                  </label>
                  <select
                    value={singleCategory}
                    onChange={(e) => setSingleCategory(e.target.value as ExamCategory)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                  >
                    <option value="up_police_co">👮 UP Police Computer Operator (Grade-A)</option>
                    <option value="up_police_asi">📑 UP Police ASI (Clerk & Accounts)</option>
                    <option value="all">🏛️ General Secretariat & Judiciary</option>
                  </select>
                </div>

                {/* Word Count */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Target Words: <span style={{ color: '#0284c7' }}>{singleWords} words</span>
                  </label>
                  <input
                    type="range"
                    min={480}
                    max={600}
                    step={10}
                    value={singleWords}
                    onChange={(e) => setSingleWords(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#0284c7', marginTop: '6px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                    <span>480w</span>
                    <span>540w (AR Standard)</span>
                    <span>600w</span>
                  </div>
                </div>
              </div>

              {/* Topic Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Passage Topic / Theme:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Security, Bharatiya Nyaya Sanhita, Emergency Dial 112, Artificial Intelligence..."
                  value={singleTopic}
                  onChange={(e) => setSingleTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    boxSizing: 'border-box'
                  }}
                />

                {/* Topic Suggestion Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', alignSelf: 'center' }}>
                    Suggested:
                  </span>
                  {[
                    'Cyber Crime & Digital Forensics',
                    'Bharatiya Nyaya Sanhita (BNS)',
                    'Emergency Response & Dial 112',
                    'E-Governance & Digital India',
                    'Women Safety & Special Task Forces',
                    'National Highway Logistics & Safety'
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setSingleTopic(sugg)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '16px',
                        padding: '3px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: '#334155',
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
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    marginBottom: '14px',
                    background: singleMessage.includes('❌') ? '#fef2f2' : singleMessage.includes('⏳') ? '#fef3c7' : '#f0fdf4',
                    color: singleMessage.includes('❌') ? '#b91c1c' : singleMessage.includes('⏳') ? '#92400e' : '#15803d',
                    border: singleMessage.includes('❌') ? '1px solid #fecaca' : singleMessage.includes('⏳') ? '1px solid #fde68a' : '1px solid #bbf7d0'
                  }}
                >
                  {singleMessage}
                </div>
              )}

              <button
                onClick={handleGenerateSingleTest}
                disabled={isGeneratingSingle}
                style={{
                  background: isGeneratingSingle ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isGeneratingSingle ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.25)',
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
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '18px',
                    marginTop: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>{singleResult.language.startsWith('hindi') ? '🇮🇳' : '🇬🇧'}</span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {singleResult.title}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: singleResult.difficulty === 'hard' ? '#fee2e2' : '#f0fdf4',
                          color: singleResult.difficulty === 'hard' ? '#b91c1c' : '#15803d'
                        }}
                      >
                        {singleResult.difficulty === 'hard' ? 'HARD • LONG WORDS' : 'MEDIUM'}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1' }}>
                        {singleResult.wordCount} words
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569' }}>
                        ⏱️ 15:00
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: '12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      color: '#334155'
                    }}
                  >
                    {singleResult.text}
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                    ✅ Test has been added to your local library and synced. You can find it in the test list!
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Presets Row */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  ⚡ Quick Provider Presets:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  {AI_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '8px 12px',
                        background: config.baseUrl === preset.baseUrl ? '#e0f2fe' : '#f8fafc',
                        border: config.baseUrl === preset.baseUrl ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: config.baseUrl === preset.baseUrl ? '#0369a1' : '#334155',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{preset.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{preset.defaultModel || (preset as any).model}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
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
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Works with Google Gemini, OpenAI, OpenRouter, Groq, Ollama, etc.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
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
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
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
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}
                    >
                      {showApiKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Stored securely in your Cloud Firestore system config and synced locally.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
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
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                {/* Test Connection Status Banner */}
                {testStatus.message && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      background: testStatus.success ? '#dcfce7' : '#fee2e2',
                      color: testStatus.success ? '#15803d' : '#991b1b',
                      border: testStatus.success ? '1px solid #86efac' : '1px solid #fca5a5'
                    }}
                  >
                    {testStatus.message}
                  </div>
                )}

                {saveStatus && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac'
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
                      background: '#f1f5f9',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
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
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
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
