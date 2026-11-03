import React, { useState, useEffect, useMemo } from 'react';
import { Passage, Language, ExamCategory } from '../types';
import { UserProfile } from '../services/firebase';
import {
  AiConfig,
  AI_PRESETS,
  getAiConfig,
  saveAiConfig,
  testAiConnection,
  generateAll8DailyLiveTests,
  saveDailyLivePassages,
  DAILY_8_SLOTS
} from '../services/aiGenerator';
import {
  isAdminAuthenticated,
  verifyAdminPin,
  setAdminAuthenticated,
  getAdminPin,
  setAdminPin,
  fetchAllCustomPassages,
  saveCustomPassage,
  deleteCustomPassage,
  fetchAllCandidates,
  getExamSystemConfig,
  saveExamSystemConfig,
  ExamSystemConfig
} from '../services/adminService';
import appLogo from '../assets/logo.png';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  passages: Passage[];
  onPassagesUpdated: (updatedPassages: Passage[]) => void;
  onDailyLiveGenerated: (tests: Passage[]) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  passages,
  onPassagesUpdated,
  onDailyLiveGenerated
}) => {
  // Authentication Guard State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPinInput, setShowPinInput] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'ai_engine' | 'passages' | 'candidates' | 'settings'>('overview');

  // AI Config State
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey: '',
    model: 'gemini-2.5-flash',
    autoDaily: true
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [aiTestStatus, setAiTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });
  const [aiSaveStatus, setAiSaveStatus] = useState<string>('');

  // Daily Live Generator in Admin
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isGeneratingDaily, setIsGeneratingDaily] = useState<boolean>(false);
  const [dailyProgress, setDailyProgress] = useState<{ completed: number; total: number; message: string }>({
    completed: 0,
    total: 8,
    message: ''
  });

  // Custom Passage Single Generator State
  const [customTopic, setCustomTopic] = useState<string>('');
  const [customLanguage, setCustomLanguage] = useState<Language>('english');
  const [customDifficulty, setCustomDifficulty] = useState<'medium' | 'hard'>('medium');
  const [customCategory, setCustomCategory] = useState<ExamCategory>('up_police_co');
  const [customTargetWords, setCustomTargetWords] = useState<number>(550);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState<boolean>(false);
  const [customGenMessage, setCustomGenMessage] = useState<string>('');

  // Manual Passage Creator State
  const [isCreatingManual, setIsCreatingManual] = useState<boolean>(false);
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualText, setManualText] = useState<string>('');
  const [manualLanguage, setManualLanguage] = useState<Language>('english');
  const [manualDifficulty, setManualDifficulty] = useState<'medium' | 'hard'>('medium');
  const [manualCategory, setManualCategory] = useState<ExamCategory>('up_police_co');

  // Passage Studio Search & Filters
  const [passageSearch, setPassageSearch] = useState<string>('');
  const [passageLangFilter, setPassageLangFilter] = useState<string>('all');
  const [customPassagesList, setCustomPassagesList] = useState<Passage[]>([]);

  // Candidates Directory State
  const [candidatesList, setCandidatesList] = useState<UserProfile[]>([]);
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [isLoadingCandidates, setIsLoadingCandidates] = useState<boolean>(false);

  // Exam Config State
  const [examConfig, setExamConfig] = useState<ExamSystemConfig>(getExamSystemConfig());
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeStatus, setPinChangeStatus] = useState<string>('');
  const [configSaveStatus, setConfigSaveStatus] = useState<string>('');

  // Initial load
  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(isAdminAuthenticated());
      setEnteredPin('');
      setPinError('');

      // Load AI Config
      getAiConfig().then((loaded) => setAiConfig(loaded));

      // Load Custom Passages
      fetchAllCustomPassages().then((cps) => setCustomPassagesList(cps));

      // Load Candidates
      setIsLoadingCandidates(true);
      fetchAllCandidates()
        .then((cands) => setCandidatesList(cands))
        .finally(() => setIsLoadingCandidates(false));

      // Load Exam Config
      setExamConfig(getExamSystemConfig());
    }
  }, [isOpen]);

  // Handle PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(enteredPin)) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('❌ Invalid Admin PIN. Please check and try again.');
    }
  };

  const handleAdminSignOut = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setEnteredPin('');
  };

  // AI Handlers
  const handleApplyPreset = (preset: (typeof AI_PRESETS)[0]) => {
    setAiConfig((prev) => ({
      ...prev,
      baseUrl: preset.baseUrl,
      model: preset.model
    }));
    setAiTestStatus({ loading: false, message: `Loaded preset: ${preset.name}` });
  };

  const handleTestConnection = async () => {
    setAiTestStatus({ loading: true });
    const res = await testAiConnection(aiConfig);
    setAiTestStatus({ loading: false, success: res.success, message: res.message });
  };

  const handleSaveAiConfig = async () => {
    await saveAiConfig(aiConfig, true);
    setAiSaveStatus('✅ AI Configuration successfully synchronized to Cloud & Local Storage!');
    setTimeout(() => setAiSaveStatus(''), 4000);
  };

  // Generate 8 Live Tests
  const handleGenerateDaily = async () => {
    if (!aiConfig.apiKey.trim()) {
      setActiveTab('ai_engine');
      setAiTestStatus({ loading: false, success: false, message: 'Please enter a valid API Key first.' });
      return;
    }

    setIsGeneratingDaily(true);
    setDailyProgress({ completed: 0, total: 8, message: 'Initializing daily live generator...' });

    try {
      await saveAiConfig(aiConfig, true);
      const tests = await generateAll8DailyLiveTests(selectedDate, aiConfig, (completed, total, message) => {
        setDailyProgress({ completed, total, message });
      });

      onDailyLiveGenerated(tests);
      setDailyProgress({ completed: 8, total: 8, message: '🎉 All 8 Live Tests Generated & Synced!' });
    } catch (err: any) {
      setDailyProgress({
        completed: 0,
        total: 8,
        message: `❌ Generation Error: ${err?.message || 'Failed to complete generation'}`
      });
    } finally {
      setIsGeneratingDaily(false);
    }
  };

  // Generate Custom Single Passage with AI
  const handleGenerateCustomPassage = async () => {
    if (!aiConfig.apiKey.trim()) {
      setCustomGenMessage('❌ Please enter API Key in AI Engine tab first.');
      return;
    }
    if (!customTopic.trim()) {
      setCustomGenMessage('❌ Please enter a topic for the passage.');
      return;
    }

    setIsGeneratingCustom(true);
    setCustomGenMessage('Generating custom passage using AI model...');

    try {
      const isHindi = customLanguage.startsWith('hindi');
      const isHard = customDifficulty === 'hard';

      let sys = isHindi
        ? 'आप उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB) के मुख्य टंकण सामग्री निर्माता हैं।'
        : 'You are the principal typing test creator for UP Police Recruitment Board and AR Typing portal.';

      let prompt = isHindi
        ? `दिए गए विषय '${customTopic}' पर शुद्ध मानक खड़ी बोली हिंदी (देवनागरी यूनिकोड) में ${customTargetWords} शब्दों का ${isHard ? 'कठिन (Hard)' : 'मध्यम (Medium)'} गद्यांश तैयार करें। निरंतर पैराग्राफ, कोई बुलेट नहीं। केवल JSON दें: {"title": "...", "text": "..."}`
        : `Generate an official typing examination passage in standard English on '${customTopic}'. Words: ${customTargetWords}. Difficulty: ${customDifficulty.toUpperCase()}. Continuous text, no bullet points. Return ONLY JSON: {"title": "...", "text": "..."}`;

      const res = await fetch(`${aiConfig.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: aiConfig.model.trim() || 'gemini-2.5-flash',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (!res.ok) {
        throw new Error(`AI error (${res.status}): ${(await res.text()).slice(0, 80)}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No valid JSON returned from model');
      const parsed = JSON.parse(match[0]);

      const cleanText = parsed.text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

      const newPassage: Passage = {
        id: `custom-ai-${Date.now()}`,
        title: parsed.title || `Custom AI Test: ${customTopic}`,
        language: customLanguage,
        category: customCategory,
        duration: 15,
        wordCount,
        difficulty: customDifficulty,
        date: new Date().toISOString().split('T')[0],
        text: cleanText
      };

      await saveCustomPassage(newPassage);
      const updatedCustom = [newPassage, ...customPassagesList];
      setCustomPassagesList(updatedCustom);
      onPassagesUpdated([newPassage, ...passages]);

      setCustomGenMessage(`🎉 Successfully created test: "${newPassage.title}" (${wordCount} words)!`);
      setCustomTopic('');
    } catch (err: any) {
      setCustomGenMessage(`❌ Failed: ${err?.message || 'Error generating passage'}`);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  // Manual Passage Creation
  const handleSaveManualPassage = async () => {
    if (!manualTitle.trim() || !manualText.trim()) {
      alert('Please fill out both title and text.');
      return;
    }

    const cleanText = manualText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    const newPassage: Passage = {
      id: `custom-manual-${Date.now()}`,
      title: manualTitle.trim(),
      language: manualLanguage,
      category: manualCategory,
      duration: 15,
      wordCount,
      difficulty: manualDifficulty,
      date: new Date().toISOString().split('T')[0],
      text: cleanText
    };

    await saveCustomPassage(newPassage);
    const updatedCustom = [newPassage, ...customPassagesList];
    setCustomPassagesList(updatedCustom);
    onPassagesUpdated([newPassage, ...passages]);

    setIsCreatingManual(false);
    setManualTitle('');
    setManualText('');
  };

  // Delete Custom Passage
  const handleDeleteCustomPassage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom passage?')) return;
    await deleteCustomPassage(id);
    const updated = customPassagesList.filter((p) => p.id !== id);
    setCustomPassagesList(updated);
    onPassagesUpdated(passages.filter((p) => p.id !== id));
  };

  // Save Exam System Settings
  const handleSaveExamConfig = async () => {
    await saveExamSystemConfig(examConfig);
    setConfigSaveStatus('✅ Exam System Rules Saved!');
    setTimeout(() => setConfigSaveStatus(''), 3000);
  };

  // Change PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.trim().length < 4) {
      setPinChangeStatus('❌ PIN must be at least 4 characters long.');
      return;
    }
    setAdminPin(newPin.trim());
    setNewPin('');
    setPinChangeStatus('✅ Admin PIN updated successfully!');
    setTimeout(() => setPinChangeStatus(''), 3000);
  };

  // Filtered passages for Studio
  const studioPassages = useMemo(() => {
    return passages.filter((p) => {
      if (passageLangFilter !== 'all' && p.language !== passageLangFilter) return false;
      if (passageSearch.trim()) {
        const q = passageSearch.toLowerCase().trim();
        return p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.date && p.date.includes(q));
      }
      return true;
    });
  }, [passages, passageLangFilter, passageSearch]);

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    if (!candidateSearch.trim()) return candidatesList;
    const q = candidateSearch.toLowerCase().trim();
    return candidatesList.filter(
      (c) =>
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        (c.rollNumber && c.rollNumber.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [candidatesList, candidateSearch]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
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
          maxWidth: '1080px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1px solid #334155'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            FINTECH EXECUTIVE HEADER
            ========================================================= */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
            borderBottom: '1px solid #1e293b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={appLogo}
              alt=""
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1.5px solid #38bdf8',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  UPPRPB Examination Control Suite
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#0369a1',
                    color: '#e0f2fe',
                    border: '1px solid #38bdf8'
                  }}
                >
                  ENTERPRISE ADMIN
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Database Operational
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>•</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>AR-Typing Benchmark Engine</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAuthenticated && (
              <button
                onClick={handleAdminSignOut}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔒 Lock Admin
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
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
        </div>

        {/* =========================================================
            SECURITY PIN GATE (IF NOT AUTHENTICATED)
            ========================================================= */}
        {!isAuthenticated ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#090d16',
              padding: '20px'
            }}
          >
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '36px',
                maxWidth: '440px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 18px auto',
                  boxShadow: '0 8px 16px rgba(2, 132, 199, 0.3)'
                }}
              >
                🛡️
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                Restricted Admin Access
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Enter the master administrative PIN to unlock AI models, question bank, and examination controls.
              </p>

              <form onSubmit={handleVerifyPin}>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <input
                    type={showPinInput ? 'text' : 'password'}
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    placeholder="Enter Master PIN (Default: admin123)"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 16px',
                      background: '#1e293b',
                      border: pinError ? '1.5px solid #ef4444' : '1.5px solid #334155',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      outline: 'none',
                      textAlign: 'center',
                      letterSpacing: showPinInput ? 'normal' : '4px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {showPinInput ? '🙈' : '👁️'}
                  </button>
                </div>

                {pinError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      marginBottom: '16px'
                    }}
                  >
                    {pinError}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  Authorize & Unlock Panel →
                </button>
              </form>

              <div style={{ marginTop: '16px', fontSize: '0.72rem', color: '#64748b' }}>
                Default Access PIN: <code style={{ color: '#38bdf8' }}>admin123</code> (Changeable inside settings)
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================
             AUTHENTICATED ADMIN WORKSPACE
             ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Fintech Tab Navigation Strip */}
            <div
              style={{
                display: 'flex',
                background: '#0f172a',
                borderBottom: '1px solid #1e293b',
                padding: '0 16px',
                overflowX: 'auto'
              }}
            >
              {[
                { id: 'overview', label: '📊 Overview & KPIs' },
                { id: 'ai_engine', label: '⚡ AI Engine & Daily Generator' },
                { id: 'passages', label: `📚 Passage Studio (${passages.length})` },
                { id: 'candidates', label: `👥 Candidates (${candidatesList.length})` },
                { id: 'settings', label: '⚙️ Governance & Security' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    borderBottom: activeTab === tab.id ? '2.5px solid #38bdf8' : '2.5px solid transparent',
                    color: activeTab === tab.id ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
              {/* --------------------------------------------------
                  TAB 1: OVERVIEW & KPIS
                  -------------------------------------------------- */}
              {activeTab === 'overview' && (
                <div>
                  {/* KPI Cards Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '16px',
                      marginBottom: '24px'
                    }}
                  >
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Question Bank Pool
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                        {passages.length} Tests
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                        234 Core + {customPassagesList.length} Custom Tests
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Registered Candidates
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                        {candidatesList.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        UP Police CO & ASI Registered
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Active AI Model
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                        {aiConfig.model}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: aiConfig.apiKey ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                        {aiConfig.apiKey ? '● Key Configured & Ready' : '⚠️ Missing API Key'}
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Passing Standard
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                        25 HI / 30 EN
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                        Mandatory ≥ {examConfig.minAccuracy}% Accuracy
                      </div>
                    </div>
                  </div>

                  {/* System Diagnostics Table */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}
                  >
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      ⚙️ System Infrastructure & Diagnostic Telemetry
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>DATABASE BACKEND</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                          Firebase Firestore (Project: upp-typing)
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>
                          Status: Active with IndexedDB Local Persistence
                        </div>
                      </div>

                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>AI PROVIDER ENDPOINT</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '2px', wordBreak: 'break-all' }}>
                          {aiConfig.baseUrl}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '4px' }}>
                          OpenAI Compatible Specification
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Strip */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveTab('ai_engine')}
                      style={{
                        padding: '10px 18px',
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Configure AI & Generate Live Tests
                    </button>
                    <button
                      onClick={() => setActiveTab('passages')}
                      style={{
                        padding: '10px 18px',
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      📚 Manage Question Passages
                    </button>
                    <button
                      onClick={() => setActiveTab('candidates')}
                      style={{
                        padding: '10px 18px',
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      👥 View Candidate Directory
                    </button>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------
                  TAB 2: AI ENGINE & DAILY GENERATOR
                  -------------------------------------------------- */}
              {activeTab === 'ai_engine' && (
                <div>
                  {/* AI Provider Config Form */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px'
                    }}
                  >
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      ⚡ AI Endpoint & Authentication Credentials
                    </h3>

                    {/* Presets */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                        1-Click Provider Presets:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                        {AI_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => handleApplyPreset(p)}
                            style={{
                              padding: '8px 12px',
                              textAlign: 'left',
                              background: aiConfig.baseUrl === p.baseUrl ? '#e0f2fe' : '#f8fafc',
                              border: aiConfig.baseUrl === p.baseUrl ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.model}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Base URL (OpenAI-compatible):
                        </label>
                        <input
                          type="text"
                          value={aiConfig.baseUrl}
                          onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                          placeholder="https://generativelanguage.googleapis.com/v1beta/openai/"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          API Key:
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={aiConfig.apiKey}
                            onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                            placeholder="Enter AI API Key (AIzaSy... or sk-...)"
                            style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            {showApiKey ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Model Identifier:
                        </label>
                        <input
                          type="text"
                          value={aiConfig.model}
                          onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                          placeholder="gemini-2.5-flash or gpt-4o-mini"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      {aiTestStatus.message && (
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            background: aiTestStatus.success ? '#dcfce7' : '#fee2e2',
                            color: aiTestStatus.success ? '#15803d' : '#991b1b',
                            border: aiTestStatus.success ? '1px solid #86efac' : '1px solid #fca5a5'
                          }}
                        >
                          {aiTestStatus.message}
                        </div>
                      )}

                      {aiSaveStatus && (
                        <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
                          {aiSaveStatus}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          onClick={handleTestConnection}
                          disabled={aiTestStatus.loading}
                          style={{ padding: '10px 16px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          {aiTestStatus.loading ? 'Testing...' : '🔌 Test Connection'}
                        </button>
                        <button
                          onClick={handleSaveAiConfig}
                          style={{ flex: 1, padding: '10px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          💾 Save AI Configuration
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 8 Daily Live Tests Section */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #86efac',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#14532d' }}>
                          🔥 Daily 8 Live Tests Generator (AR-Typing Level)
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#166534' }}>
                          Generates 4 English (2 Med, 2 Hard) + 4 Hindi (2 Med, 2 Hard) passages for the portal.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Target Date:</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>
                    </div>

                    {isGeneratingDaily && (
                      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                          <span>Generating Daily Tests ({dailyProgress.completed} / {dailyProgress.total})</span>
                          <span>{Math.round((dailyProgress.completed / dailyProgress.total) * 100)}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#fde68a', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ width: `${(dailyProgress.completed / dailyProgress.total) * 100}%`, height: '100%', background: '#d97706', transition: 'width 0.3s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#78350f' }}>{dailyProgress.message}</div>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateDaily}
                      disabled={isGeneratingDaily}
                      style={{
                        padding: '12px 20px',
                        background: isGeneratingDaily ? '#94a3b8' : 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: isGeneratingDaily ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isGeneratingDaily ? 'Generating 8 Tests in Progress...' : `⚡ Generate & Publish 8 Live Tests for ${selectedDate}`}
                    </button>
                  </div>

                  {/* Single Custom Passage Generator */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px'
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      ✨ Generate Custom AI Passage (Any Topic)
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Prompt the AI model to create an authentic 15-minute exam passage on a specific subject.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Language:</label>
                        <select
                          value={customLanguage}
                          onChange={(e) => setCustomLanguage(e.target.value as Language)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        >
                          <option value="english">English (QWERTY)</option>
                          <option value="hindi_mangal">Hindi Mangal (Inscript)</option>
                          <option value="hindi_kruti">Hindi Kruti Dev 010</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Difficulty:</label>
                        <select
                          value={customDifficulty}
                          onChange={(e) => setCustomDifficulty(e.target.value as 'medium' | 'hard')}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        >
                          <option value="medium">Medium (Standard)</option>
                          <option value="hard">Hard (Technical / Legal)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Category:</label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value as ExamCategory)}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        >
                          <option value="up_police_co">UP Police Computer Operator</option>
                          <option value="up_police_asi">UP Police ASI / Clerk</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Target Words:</label>
                        <input
                          type="number"
                          value={customTargetWords}
                          onChange={(e) => setCustomTargetWords(Number(e.target.value))}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Custom Subject / Topic:
                      </label>
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="e.g. Cyber Forensics in Uttar Pradesh Police or UPI Payment Architecture"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    {customGenMessage && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          marginBottom: '12px',
                          background: customGenMessage.includes('🎉') ? '#dcfce7' : '#fee2e2',
                          color: customGenMessage.includes('🎉') ? '#15803d' : '#991b1b'
                        }}
                      >
                        {customGenMessage}
                      </div>
                    )}

                    <button
                      onClick={handleGenerateCustomPassage}
                      disabled={isGeneratingCustom}
                      style={{
                        padding: '10px 18px',
                        background: isGeneratingCustom ? '#94a3b8' : '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: isGeneratingCustom ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isGeneratingCustom ? 'Generating...' : '✨ Generate & Save to Question Bank'}
                    </button>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------
                  TAB 3: PASSAGE STUDIO & BANK
                  -------------------------------------------------- */}
              {activeTab === 'passages' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={passageSearch}
                        onChange={(e) => setPassageSearch(e.target.value)}
                        placeholder="🔍 Search passages by title or ID..."
                        style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '260px' }}
                      />
                      <select
                        value={passageLangFilter}
                        onChange={(e) => setPassageLangFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="all">All Languages</option>
                        <option value="english">English Only</option>
                        <option value="hindi_mangal">Hindi Mangal Only</option>
                        <option value="hindi_kruti">Hindi Kruti Only</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setIsCreatingManual(!isCreatingManual)}
                        style={{
                          padding: '8px 14px',
                          background: isCreatingManual ? '#64748b' : '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isCreatingManual ? 'Cancel' : '➕ Add Manual Passage'}
                      </button>
                    </div>
                  </div>

                  {/* Manual Creation Drawer */}
                  {isCreatingManual && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #0284c7',
                        borderRadius: '12px',
                        padding: '18px',
                        marginBottom: '20px'
                      }}
                    >
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0369a1' }}>
                        ➕ Create New Official Examination Passage
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Language:</label>
                          <select
                            value={manualLanguage}
                            onChange={(e) => setManualLanguage(e.target.value as Language)}
                            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                          >
                            <option value="english">English</option>
                            <option value="hindi_mangal">Hindi Mangal</option>
                            <option value="hindi_kruti">Hindi Kruti Dev</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Difficulty:</label>
                          <select
                            value={manualDifficulty}
                            onChange={(e) => setManualDifficulty(e.target.value as 'medium' | 'hard')}
                            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                          >
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Category:</label>
                          <select
                            value={manualCategory}
                            onChange={(e) => setManualCategory(e.target.value as ExamCategory)}
                            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                          >
                            <option value="up_police_co">UP Police Computer Operator</option>
                            <option value="up_police_asi">UP Police ASI</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          placeholder="Passage Title..."
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
                        />
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <textarea
                          rows={6}
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          placeholder="Type or paste the complete passage text here..."
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'inherit' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                          Word Count: {manualText.split(/\s+/).filter(Boolean).length} words
                        </div>
                      </div>

                      <button
                        onClick={handleSaveManualPassage}
                        style={{ padding: '8px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        💾 Save Passage to Database
                      </button>
                    </div>
                  )}

                  {/* Passages Table */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                      <span>Showing {studioPassages.length} of {passages.length} Total Passages</span>
                      <span>Target: 15-Minute Exam Hall Standard</span>
                    </div>

                    <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '10px 14px' }}>ID</th>
                            <th style={{ padding: '10px 14px' }}>Title</th>
                            <th style={{ padding: '10px 14px' }}>Language</th>
                            <th style={{ padding: '10px 14px' }}>Difficulty</th>
                            <th style={{ padding: '10px 14px' }}>Words</th>
                            <th style={{ padding: '10px 14px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studioPassages.slice(0, 50).map((p) => {
                            const isCustom = p.id.startsWith('custom-');
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>{p.id}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.title}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: p.language === 'english' ? '#dbeafe' : '#fef3c7', color: p.language === 'english' ? '#1e40af' : '#b45309' }}>
                                    {p.language}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: p.difficulty === 'hard' ? '#fee2e2' : '#f0fdf4', color: p.difficulty === 'hard' ? '#991b1b' : '#166534' }}>
                                    {p.difficulty.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.wordCount}w</td>
                                <td style={{ padding: '10px 14px' }}>
                                  {isCustom ? (
                                    <button
                                      onClick={() => handleDeleteCustomPassage(p.id)}
                                      style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Core Test</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------
                  TAB 4: CANDIDATE DIRECTORY
                  -------------------------------------------------- */}
              {activeTab === 'candidates' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <input
                      type="text"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="🔍 Search candidate by name, roll number, or email..."
                      style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '320px' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {filteredCandidates.length} Candidates Listed
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 14px' }}>Roll Number</th>
                          <th style={{ padding: '10px 14px' }}>Candidate Name</th>
                          <th style={{ padding: '10px 14px' }}>Category</th>
                          <th style={{ padding: '10px 14px' }}>Registration Email / UID</th>
                          <th style={{ padding: '10px 14px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCandidates.map((c) => (
                          <tr key={c.uid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                              {c.rollNumber}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                              {c.displayName || 'Candidate'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
                                {c.category === 'up_police_co' ? 'Computer Operator' : 'ASI Ministerial'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.78rem' }}>
                              {c.email || c.uid}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.75rem' }}>
                              {c.createdAt ? c.createdAt.split('T')[0] : '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------
                  TAB 5: GOVERNANCE & SECURITY
                  -------------------------------------------------- */}
              {activeTab === 'settings' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {/* Passing Benchmark Rules */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      📋 Official Exam Benchmarks
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Hindi Passing Speed (Net WPM):
                        </label>
                        <input
                          type="number"
                          value={examConfig.hindiPassSpeed}
                          onChange={(e) => setExamConfig({ ...examConfig, hindiPassSpeed: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          English Passing Speed (Net WPM):
                        </label>
                        <input
                          type="number"
                          value={examConfig.englishPassSpeed}
                          onChange={(e) => setExamConfig({ ...examConfig, englishPassSpeed: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Minimum Qualifying Accuracy (%):
                        </label>
                        <input
                          type="number"
                          value={examConfig.minAccuracy}
                          onChange={(e) => setExamConfig({ ...examConfig, minAccuracy: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      {configSaveStatus && (
                        <div style={{ padding: '8px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {configSaveStatus}
                        </div>
                      )}

                      <button
                        onClick={handleSaveExamConfig}
                        style={{ padding: '10px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginTop: '6px' }}
                      >
                        💾 Update Examination Benchmarks
                      </button>
                    </div>
                  </div>

                  {/* Change Admin PIN */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      🔐 Security & Master Admin PIN
                    </h3>
                    <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Update the authorization passphrase used to access this Fintech admin suite.
                    </p>

                    <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Current Active PIN:
                        </label>
                        <input
                          type="text"
                          disabled
                          value={getAdminPin()}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '0.85rem', color: '#64748b' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          New Admin PIN / Passphrase:
                        </label>
                        <input
                          type="password"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          placeholder="Enter at least 4 characters..."
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      {pinChangeStatus && (
                        <div
                          style={{
                            padding: '8px',
                            background: pinChangeStatus.includes('✅') ? '#dcfce7' : '#fee2e2',
                            color: pinChangeStatus.includes('✅') ? '#15803d' : '#991b1b',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          {pinChangeStatus}
                        </div>
                      )}

                      <button
                        type="submit"
                        style={{ padding: '10px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        🔑 Update Admin PIN
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
