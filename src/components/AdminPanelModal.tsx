import React, { useState, useEffect, useMemo } from 'react';
import { Passage, Language, ExamCategory } from '../types';
import {
  UserProfile,
  signInAdminWithEmail,
  signInAdminWithGoogle,
  toggleUserAdminRole,
  isUserAdmin,
  sendAdminPasswordReset
} from '../services/firebase';
import {
  AiConfig,
  AI_PRESETS,
  AiProviderPreset,
  DetectedModel,
  fetchProviderModels,
  verifyModelReplying,
  cleanBaseUrl,
  getAiConfig,
  saveAiConfig,
  testAiConnection,
  generateAll8DailyLiveTests,
  generateCustomTest,
  DAILY_8_SLOTS
} from '../services/aiGenerator';
import {
  isAdminAuthenticated,
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
import {
  PaymentSubmission,
  PromoCode,
  fetchAllPaymentSubmissions,
  approvePaymentSubmission,
  rejectPaymentSubmission,
  getPromoCodes,
  savePromoCodes
} from '../services/paymentService';
import {
  TelegramConfig,
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramPing,
  DEFAULT_TELEGRAM_CONFIG
} from '../services/telegramService';
import {
  SupportChatSession,
  subscribeToAllLiveChats,
  sendAdminLiveReply,
  markChatReadByAdmin
} from '../services/liveChatService';
import appLogo from '../assets/logo.png';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  passages: Passage[];
  onPassagesUpdated: (updatedPassages: Passage[]) => void;
  onDailyLiveGenerated: (tests: Passage[]) => void;
  currentUser?: UserProfile | null;
  onLoginSuccess?: (user: UserProfile) => void;
  initialTab?: 'overview' | 'live_chat' | 'ai_engine' | 'passages' | 'candidates' | 'payments' | 'settings';
  initialChatId?: string;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  passages,
  onPassagesUpdated,
  onDailyLiveGenerated,
  currentUser,
  onLoginSuccess,
  initialTab,
  initialChatId
}) => {
  // Authentication Guard State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeAdminUser, setActiveAdminUser] = useState<UserProfile | null>(currentUser || null);

  // Firebase Admin Login States
  const [fbEmail, setFbEmail] = useState<string>(currentUser?.email || '');
  const [fbPassword, setFbPassword] = useState<string>('');
  const [fbAuthLoading, setFbAuthLoading] = useState<boolean>(false);
  const [fbAuthError, setFbAuthError] = useState<string>('');
  const [fbAuthSuccess, setFbAuthSuccess] = useState<string>('');
  const [isSendingReset, setIsSendingReset] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'live_chat' | 'ai_engine' | 'passages' | 'candidates' | 'payments' | 'settings'>(initialTab || 'overview');

  // Live Support Chat State
  const [liveChatsList, setLiveChatsList] = useState<SupportChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [liveChatSearch, setLiveChatSearch] = useState<string>('');

  // Payments & Subscriptions State
  const [paymentsList, setPaymentsList] = useState<PaymentSubmission[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(false);
  const [promoCodesList, setPromoCodesList] = useState<PromoCode[]>([]);
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [paymentActionLoadingId, setPaymentActionLoadingId] = useState<string | null>(null);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Promo Code Form State
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoDiscount, setNewPromoDiscount] = useState<number>(20);
  const [newPromoType, setNewPromoType] = useState<'percentage' | 'flat'>('percentage');
  const [newPromoDesc, setNewPromoDesc] = useState<string>('');
  const [newPromoMinOrder, setNewPromoMinOrder] = useState<number>(0);
  const [newPromoMaxDiscount, setNewPromoMaxDiscount] = useState<number>(100);

  // Telegram Bot State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(DEFAULT_TELEGRAM_CONFIG);
  const [telegramStatus, setTelegramStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false
  });
  const [showTelegramToken, setShowTelegramToken] = useState<boolean>(false);

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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [detectedModels, setDetectedModels] = useState<DetectedModel[]>([]);
  const [isDetectingModels, setIsDetectingModels] = useState<boolean>(false);
  const [detectStatus, setDetectStatus] = useState<string>('');
  const [modelFilterType, setModelFilterType] = useState<'all' | 'free' | 'replying'>('all');
  const [isVerifyingModels, setIsVerifyingModels] = useState<boolean>(false);
  const [activeModelVerified, setActiveModelVerified] = useState<{ replying?: boolean; message?: string } | null>(null);
  const [previewPassage, setPreviewPassage] = useState<Passage | null>(null);

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

  // Initial load & Auth synchronization
  useEffect(() => {
    if (isOpen) {
      if (currentUser && isUserAdmin(currentUser)) {
        setIsAuthenticated(true);
        setActiveAdminUser(currentUser);
      } else if (isAdminAuthenticated()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      setFbAuthError('');
      setFbAuthSuccess('');
      setFbEmail(currentUser?.email || '');
      setFbPassword('');

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

      // Load Payments & Promo Codes
      loadPaymentsAndPromos();

      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialChatId) {
        setActiveTab('live_chat');
        setSelectedChatId(initialChatId);
      }
    }
  }, [isOpen, currentUser, initialTab, initialChatId]);

  // Subscribe to real-time candidate live chat conversations
  useEffect(() => {
    if (isAuthenticated) {
      const unsub = subscribeToAllLiveChats((chats) => {
        setLiveChatsList(chats);
        if (chats.length > 0 && !selectedChatId) {
          setSelectedChatId(chats[0].id);
        }
      });
      return () => unsub();
    }
  }, [isAuthenticated, selectedChatId]);

  // 1. Firebase Admin Email/Password Sign-In
  const handleFirebaseAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbEmail.trim() || !fbPassword.trim()) {
      setFbAuthError('Please enter both Admin Email and Password.');
      return;
    }
    setFbAuthLoading(true);
    setFbAuthError('');
    setFbAuthSuccess('');
    try {
      const adminProf = await signInAdminWithEmail(fbEmail, fbPassword);
      setActiveAdminUser(adminProf);
      setIsAuthenticated(true);
      setAdminAuthenticated(true);
      if (onLoginSuccess) onLoginSuccess(adminProf);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setFbAuthError('Invalid email or password. If you haven\'t set a password yet, click "Set or Reset Password via Email" below or tap "Sign in with Google Admin".');
      } else {
        setFbAuthError(err?.message || 'Failed to authenticate admin account.');
      }
    } finally {
      setFbAuthLoading(false);
    }
  };

  // 2. Send Password Setup / Reset Email
  const handleSendPasswordReset = async () => {
    if (!fbEmail.trim()) {
      setFbAuthError('Please enter your Admin Email address above first.');
      return;
    }
    setIsSendingReset(true);
    setFbAuthError('');
    setFbAuthSuccess('');
    try {
      await sendAdminPasswordReset(fbEmail);
      setFbAuthSuccess(`✅ A password setup link has been sent to ${fbEmail.trim()}. Check your inbox or spam to set your Admin password, then log in here!`);
    } catch (err: any) {
      setFbAuthError(err?.message || 'Failed to send password setup email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  // 3. Firebase Admin 1-Click Google Sign-In
  const handleFirebaseGoogleLogin = async () => {
    setFbAuthLoading(true);
    setFbAuthError('');
    setFbAuthSuccess('');
    try {
      const adminProf = await signInAdminWithGoogle();
      setActiveAdminUser(adminProf);
      setIsAuthenticated(true);
      setAdminAuthenticated(true);
      if (onLoginSuccess) onLoginSuccess(adminProf);
    } catch (err: any) {
      setFbAuthError(err?.message || 'Google Admin authentication failed.');
    } finally {
      setFbAuthLoading(false);
    }
  };

  const handleAdminSignOut = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setActiveAdminUser(null);
    setFbPassword('');
  };

  // 5. Toggle User Admin Role in Firestore
  const handleToggleAdminRole = async (targetUid: string, currentAdminStatus: boolean) => {
    const makeAdmin = !currentAdminStatus;
    const confirmMsg = makeAdmin
      ? 'Grant official Administrator privileges to this candidate in Firebase Firestore?'
      : 'Revoke Administrator privileges for this user in Firebase Firestore?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleUserAdminRole(targetUid, makeAdmin);
      setCandidatesList((prev) =>
        prev.map((c) =>
          c.uid === targetUid ? { ...c, isAdmin: makeAdmin, role: makeAdmin ? 'admin' : 'candidate' } : c
        )
      );
    } catch (err: any) {
      alert(`Error updating admin role: ${err?.message || 'Failed to update Firestore'}`);
    }
  };

  // Payments & Subscriptions Handlers
  const loadPaymentsAndPromos = async () => {
    setIsLoadingPayments(true);
    try {
      const subs = await fetchAllPaymentSubmissions();
      setPaymentsList(subs);
      const promos = getPromoCodes();
      setPromoCodesList(promos);
      const tg = await getTelegramConfig();
      setTelegramConfig(tg);
    } catch (err) {
      console.error('Failed to load payments or telegram config:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleSaveTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveTelegramConfig(telegramConfig);
      setPaymentFeedback({ type: 'success', message: '✅ Telegram Bot configuration saved to Cloud!' });
    } catch (err: any) {
      setPaymentFeedback({ type: 'error', message: err?.message || 'Failed to save Telegram config' });
    }
  };

  const handleTestTelegramPing = async () => {
    setTelegramStatus({ loading: true, message: 'Sending test ping to Telegram...' });
    const res = await testTelegramPing(telegramConfig);
    setTelegramStatus({ loading: false, success: res.success, message: res.message });
  };

  const pendingPaymentsCount = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'pending').length;
  }, [paymentsList]);

  const unreadLiveChatsCount = useMemo(() => {
    return liveChatsList.filter((c) => c.unreadByAdmin).length;
  }, [liveChatsList]);

  const approvedPaymentsRevenue = useMemo(() => {
    return paymentsList
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + (p.finalAmount || p.finalAmountPaid || 0), 0);
  }, [paymentsList]);

  const filteredPayments = useMemo(() => {
    if (paymentFilterStatus === 'all') return paymentsList;
    return paymentsList.filter((p) => p.status === paymentFilterStatus);
  }, [paymentsList, paymentFilterStatus]);

  const handleApprovePayment = async (sub: PaymentSubmission) => {
    const amount = sub.finalAmount || sub.finalAmountPaid || 0;
    const examName = sub.selectedExamTitle || sub.examTitle || 'All 129 Exams Combo';
    const confirmApprove = window.confirm(
      `Approve ₹${amount} payment from candidate ${sub.userName || sub.userEmail} for ${sub.planName} (${examName})?\n\nThis will immediately activate their Pro subscription!`
    );
    if (!confirmApprove) return;

    setPaymentActionLoadingId(sub.id);
    setPaymentFeedback(null);
    try {
      const res = await approvePaymentSubmission(sub.id, activeAdminUser?.email || 'admin@examtyping.in');
      if (res.success) {
        setPaymentFeedback({
          type: 'success',
          message: `✅ Payment ${sub.id} approved! Pro subscription activated for ${sub.userName || sub.userEmail}.`
        });
        await loadPaymentsAndPromos();
        fetchAllCandidates().then((cands) => setCandidatesList(cands));
      } else {
        setPaymentFeedback({ type: 'error', message: `Failed to approve: ${res.message || 'Unknown error'}` });
      }
    } catch (err: any) {
      setPaymentFeedback({ type: 'error', message: err?.message || 'Approval error' });
    } finally {
      setPaymentActionLoadingId(null);
    }
  };

  const handleRejectPayment = async (sub: PaymentSubmission) => {
    const reason = window.prompt(
      `Enter rejection reason for payment from ${sub.userName || sub.userEmail}:`,
      'Invalid UTR or screenshot verification failed'
    );
    if (reason === null) return;

    setPaymentActionLoadingId(sub.id);
    setPaymentFeedback(null);
    try {
      const res = await rejectPaymentSubmission(sub.id, reason, activeAdminUser?.email || 'admin@examtyping.in');
      if (res.success) {
        setPaymentFeedback({ type: 'success', message: `Payment ${sub.id} marked as rejected.` });
        await loadPaymentsAndPromos();
      } else {
        setPaymentFeedback({ type: 'error', message: `Failed to reject: ${res.message || 'Unknown error'}` });
      }
    } catch (err: any) {
      setPaymentFeedback({ type: 'error', message: err?.message || 'Rejection error' });
    } finally {
      setPaymentActionLoadingId(null);
    }
  };

  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newPromoCode.trim().toUpperCase();
    if (!code) return;
    if (promoCodesList.some((p) => p.code === code)) {
      alert(`Promo code ${code} already exists!`);
      return;
    }
    const updated: PromoCode[] = [
      ...promoCodesList,
      {
        code,
        discountType: newPromoType,
        discountValue: Number(newPromoDiscount),
        description: newPromoDesc || (newPromoType === 'percentage' ? `${newPromoDiscount}% OFF` : `₹${newPromoDiscount} Flat OFF`),
        minOrderValue: Number(newPromoMinOrder) || 0,
        minOrderAmount: Number(newPromoMinOrder) || 0,
        maxDiscount: newPromoType === 'percentage' ? Number(newPromoMaxDiscount) : undefined,
        maxDiscountAmount: newPromoType === 'percentage' ? Number(newPromoMaxDiscount) : undefined,
        isActive: true
      }
    ];
    savePromoCodes(updated);
    setPromoCodesList(updated);
    setNewPromoCode('');
    setNewPromoDesc('');
    alert(`Promo code ${code} created successfully!`);
  };

  const handleTogglePromoStatus = (code: string) => {
    const updated = promoCodesList.map((p) => (p.code === code ? { ...p, isActive: !p.isActive } : p));
    savePromoCodes(updated);
    setPromoCodesList(updated);
  };

  const handleDeletePromoCode = (code: string) => {
    if (!window.confirm(`Delete promo code ${code}?`)) return;
    const updated = promoCodesList.filter((p) => p.code !== code);
    savePromoCodes(updated);
    setPromoCodesList(updated);
  };

  // AI Handlers
  const handleApplyPreset = (preset: AiProviderPreset) => {
    setAiConfig((prev) => ({
      ...prev,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel
    }));
    if (preset.popularModels && preset.popularModels.length > 0) {
      setDetectedModels(
        preset.popularModels.map((m) => ({ id: m.id, name: m.name, isFree: !!m.isFree }))
      );
    }
    setAiTestStatus({ loading: false, message: `Loaded preset: ${preset.name} (Default: ${preset.defaultModel})` });
    setDetectStatus('');
  };

  const handleAutoDetectModels = async () => {
    if (!aiConfig.baseUrl.trim()) {
      setDetectStatus('Please enter a Base URL first.');
      return;
    }
    setIsDetectingModels(true);
    setDetectStatus('Detecting models from provider endpoint...');
    const res = await fetchProviderModels(aiConfig.baseUrl, aiConfig.apiKey);
    setIsDetectingModels(false);
    if (res.success && res.models.length > 0) {
      setDetectedModels(res.models);
      setDetectStatus(`✅ ${res.message}`);
      const match = res.models.find((m) => m.id === aiConfig.model);
      if (!match) {
        const freeOne = res.models.find((m) => m.isFree);
        const chosen = freeOne ? freeOne.id : res.models[0].id;
        setAiConfig((prev) => ({ ...prev, model: chosen }));
      }
    } else {
      setDetectStatus(`⚠️ ${res.message || 'No models detected'}`);
    }
  };

  const handleVerifyReplyingModels = async () => {
    if (!aiConfig.baseUrl.trim()) {
      setDetectStatus('Please enter a Base URL first.');
      return;
    }
    if (!aiConfig.apiKey.trim()) {
      setDetectStatus('⚠️ Please enter an API Key to verify replying models.');
      return;
    }

    setIsVerifyingModels(true);
    setDetectStatus('⚡ Testing models with your API key to find replying models...');

    const baseList: DetectedModel[] = detectedModels.length > 0
      ? [...detectedModels]
      : (AI_PRESETS.find((p) => cleanBaseUrl(p.baseUrl) === cleanBaseUrl(aiConfig.baseUrl))?.popularModels.map((m) => ({
          id: m.id,
          name: m.name,
          isFree: !!m.isFree
        })) || []);

    const updated = [...baseList];
    let replyingCount = 0;

    // Verify first 8 models to avoid rate limiting
    for (let i = 0; i < Math.min(updated.length, 8); i++) {
      const item = { ...updated[i] };
      const pingRes = await verifyModelReplying(aiConfig.baseUrl, aiConfig.apiKey, item.id);
      item.isReplying = pingRes.replying;
      item.replyStatus = pingRes.replying ? 'replying' : 'failed';
      if (pingRes.replying) replyingCount++;
      updated[i] = item;
    }

    setDetectedModels(updated);
    setIsVerifyingModels(false);

    if (replyingCount > 0) {
      setDetectStatus(`✅ Found ${replyingCount} replying model(s) with green tick mark!`);
      setModelFilterType('replying');
      const firstReplying = updated.find((m) => m.isReplying);
      if (firstReplying) {
        setAiConfig((prev) => ({ ...prev, model: firstReplying.id }));
        setActiveModelVerified({ replying: true, message: `Model '${firstReplying.id}' is verified and replying!` });
      }
    } else {
      setDetectStatus('⚠️ None of the tested models replied. Check API key permissions or try another provider.');
    }
  };

  const displayedModels = useMemo(() => {
    let list: DetectedModel[] = [];
    if (detectedModels.length > 0) {
      list = detectedModels;
    } else {
      const matching = AI_PRESETS.find(
        (p) => cleanBaseUrl(p.baseUrl) === cleanBaseUrl(aiConfig.baseUrl)
      );
      if (matching && matching.popularModels) {
        list = matching.popularModels.map((m) => ({
          id: m.id,
          name: m.name,
          isFree: !!m.isFree
        }));
      }
    }
    if (modelFilterType === 'free') return list.filter((m) => m.isFree);
    if (modelFilterType === 'replying') return list.filter((m) => m.isReplying);
    return list;
  }, [detectedModels, modelFilterType, aiConfig.baseUrl]);

  const handleTestConnection = async () => {
    setAiTestStatus({ loading: true });
    const res = await testAiConnection(aiConfig);
    setAiTestStatus({ loading: false, success: res.success, message: res.message });
    if (res.success) {
      setActiveModelVerified({ replying: true, message: `Active model '${aiConfig.model}' is verified & replying!` });
      setDetectedModels((prev) =>
        prev.map((m) => (m.id === aiConfig.model ? { ...m, isReplying: true, replyStatus: 'replying' } : m))
      );
    } else {
      setActiveModelVerified({ replying: false, message: res.message });
    }
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

  // Generate Custom Single Passage with AI (AR Typing Medium & Hard Calibrated)
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
    setCustomGenMessage('Generating AR Typing calibrated passage using AI model...');

    try {
      const newPassage = await generateCustomTest({
        language: customLanguage,
        difficulty: customDifficulty,
        category: customCategory,
        topic: customTopic,
        targetWords: customTargetWords,
        config: aiConfig
      });

      const updatedCustom = [newPassage, ...customPassagesList];
      setCustomPassagesList(updatedCustom);
      onPassagesUpdated([newPassage, ...passages]);

      setCustomGenMessage(`🎉 Successfully created test: "${newPassage.title}" (${newPassage.wordCount} words • ${customDifficulty.toUpperCase()})!`);
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
        backgroundColor: isFullscreen ? '#090d16' : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: isFullscreen ? 'none' : 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: isFullscreen ? 0 : '16px',
          width: isFullscreen ? '100vw' : '100%',
          maxWidth: isFullscreen ? '100vw' : '1080px',
          height: isFullscreen ? '100vh' : '92vh',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isFullscreen ? 'none' : '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: isFullscreen ? 'none' : '1px solid #334155'
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
                  FIREBASE ENTERPRISE ADMIN
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Firebase Online
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>•</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>AR-Typing Benchmark Portal</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAuthenticated && (
              <>
                {activeAdminUser && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      color: '#38bdf8',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      padding: '4px 10px',
                      borderRadius: '16px'
                    }}
                  >
                    <span>🛡️</span>
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeAdminUser.displayName}
                    </span>
                  </div>
                )}
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
                  🔒 Lock
                </button>
              </>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Restore Window Size' : 'Expand to Fullscreen'}
              style={{
                background: isFullscreen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid ' + (isFullscreen ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'),
                borderRadius: '6px',
                padding: '5px 10px',
                color: isFullscreen ? '#38bdf8' : '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>{isFullscreen ? '🗗' : '⛶'}</span>
              <span>{isFullscreen ? 'Restore' : 'Fullscreen'}</span>
            </button>

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
            FIREBASE ADMIN AUTHENTICATION GATEWAY (IF NOT AUTHENTICATED)
            ========================================================= */}
        {!isAuthenticated ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#090d16',
              padding: '24px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 8px 16px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  🛡️
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  Firebase Admin Authentication
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Restricted Access • Authenticate via Firebase Cloud Services
                </p>
              </div>

              {/* Alert Messages */}
              {fbAuthError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                    lineHeight: 1.4
                  }}
                >
                  {fbAuthError}
                </div>
              )}

              {fbAuthSuccess && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#6ee7b7',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                    lineHeight: 1.4
                  }}
                >
                  {fbAuthSuccess}
                </div>
              )}

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleFirebaseGoogleLogin}
                disabled={fbAuthLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: fbAuthLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google Admin</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#334155' }} />
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                  OR OFFICIAL ADMIN PASSWORD
                </span>
                <div style={{ flex: 1, height: '1px', background: '#334155' }} />
              </div>

              {/* Email & Password Admin Form */}
              <form onSubmit={handleFirebaseAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '5px' }}>
                    Admin Email Address:
                  </label>
                  <input
                    type="email"
                    value={fbEmail}
                    onChange={(e) => setFbEmail(e.target.value)}
                    placeholder="admin@upprpb.gov.in"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      background: '#1e293b',
                      border: '1.5px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1' }}>
                      Admin Password:
                    </label>
                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      disabled={isSendingReset}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: isSendingReset ? 'not-allowed' : 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {isSendingReset ? 'Sending link...' : 'Set / Reset Password via Email'}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={fbPassword}
                      onChange={(e) => setFbPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '11px 40px 11px 12px',
                        background: '#1e293b',
                        border: '1.5px solid #334155',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '4px'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={fbAuthLoading}
                  style={{
                    padding: '12px',
                    background: fbAuthLoading ? '#64748b' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: fbAuthLoading ? 'not-allowed' : 'pointer',
                    marginTop: '6px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {fbAuthLoading ? 'Verifying Admin Credentials...' : '🔒 Authorize Admin Session →'}
                </button>
              </form>
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
                {
                  id: 'live_chat',
                  label: `💬 Live Support Desk (${unreadLiveChatsCount > 0 ? `🚨 ${unreadLiveChatsCount} NEW` : liveChatsList.length})`
                },
                { id: 'ai_engine', label: '⚡ AI Engine & Daily Generator' },
                { id: 'passages', label: `📚 Passage Studio (${passages.length})` },
                { id: 'candidates', label: `👥 Candidates & Firebase Roles (${candidatesList.length})` },
                {
                  id: 'payments',
                  label: `💳 Payments & Subscriptions (${pendingPaymentsCount > 0 ? `🚨 ${pendingPaymentsCount} PENDING` : paymentsList.length})`
                },
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
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '16px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
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

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
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

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
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

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Firebase Admin Status
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
                        AUTHENTICATED 🛡️
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        {activeAdminUser?.email || 'Cloud Master Admin'}
                      </div>
                    </div>
                  </div>

                  {/* System Diagnostics Table */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      ⚙️ Firebase Cloud Infrastructure & Diagnostic Telemetry
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>FIREBASE PROJECT ID</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                          upp-typing (Official UP Police Typing Mentor)
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>
                          Auth & Cloud Firestore Connected
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
                </div>
              )}

              {/* --------------------------------------------------
                  TAB: LIVE SUPPORT DESK (REAL-TIME ASPIRANT CHAT)
                  -------------------------------------------------- */}
              {activeTab === 'live_chat' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                        💬 Live Support Desk & Candidate Helpdesk
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Real-time bidirectional chat with candidates. Candidates message from the website, you reply directly here. Telegram alerts are automatically dispatched.
                      </div>
                    </div>
                    {unreadLiveChatsCount > 0 && (
                      <span
                        style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)'
                        }}
                      >
                        🚨 {unreadLiveChatsCount} UNREAD CONVERSATION{unreadLiveChatsCount > 1 ? 'S' : ''}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '18px',
                      height: '620px',
                      maxHeight: 'calc(100vh - 240px)',
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Left Panel: Chat Sessions List */}
                    <div
                      style={{
                        width: '320px',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#f8fafc'
                      }}
                    >
                      {/* Search / Filter header */}
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                        <input
                          type="text"
                          placeholder="Search candidate name or email..."
                          value={liveChatSearch}
                          onChange={(e) => setLiveChatSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Sessions List */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                        {liveChatsList.length === 0 ? (
                          <div style={{ padding: '30px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                            No active support conversations yet. When candidates send a message from the widget, it appears here.
                          </div>
                        ) : (
                          liveChatsList
                            .filter((c) => {
                              if (!liveChatSearch.trim()) return true;
                              const q = liveChatSearch.toLowerCase();
                              return (
                                c.userName?.toLowerCase().includes(q) ||
                                c.userEmail?.toLowerCase().includes(q) ||
                                c.lastMessage?.toLowerCase().includes(q)
                              );
                            })
                            .map((chat) => {
                              const isSelected = selectedChatId === chat.id;
                              return (
                                <div
                                  key={chat.id}
                                  onClick={() => {
                                    setSelectedChatId(chat.id);
                                    if (chat.unreadByAdmin) {
                                      markChatReadByAdmin(chat.id);
                                    }
                                  }}
                                  style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    marginBottom: '6px',
                                    cursor: 'pointer',
                                    background: isSelected ? '#e0f2fe' : chat.unreadByAdmin ? '#fef2f2' : '#ffffff',
                                    border: isSelected ? '1.5px solid #0284c7' : chat.unreadByAdmin ? '1.5px solid #f87171' : '1px solid #e2e8f0',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: isSelected ? '#0369a1' : '#0f172a' }}>
                                      {chat.userName || 'Candidate'}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                      {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      fontSize: '0.74rem',
                                      color: chat.unreadByAdmin ? '#b91c1c' : '#64748b',
                                      fontWeight: chat.unreadByAdmin ? 700 : 400,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {chat.lastMessage || 'No messages'}
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                    <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                                      {chat.userEmail ? chat.userEmail : `#${chat.id.substring(chat.id.length - 6)}`}
                                    </span>
                                    {chat.unreadByAdmin && (
                                      <span
                                        style={{
                                          background: '#ef4444',
                                          color: '#ffffff',
                                          padding: '1px 6px',
                                          borderRadius: '8px',
                                          fontSize: '0.62rem',
                                          fontWeight: 800
                                        }}
                                      >
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Chat Thread */}
                    {(() => {
                      const activeChat = liveChatsList.find((c) => c.id === selectedChatId);
                      if (!activeChat) {
                        return (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8', gap: '8px' }}>
                            <div style={{ fontSize: '2.5rem' }}>💬</div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Select a candidate conversation</div>
                            <div style={{ fontSize: '0.8rem' }}>Click any candidate on the left to review their messages and send replies.</div>
                          </div>
                        );
                      }

                      return (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          {/* Thread Header */}
                          <div
                            style={{
                              padding: '14px 18px',
                              borderBottom: '1px solid #e2e8f0',
                              background: '#ffffff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                                  {activeChat.userName || 'Candidate'}
                                </h4>
                                <span
                                  style={{
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700
                                  }}
                                >
                                  Active Thread
                                </span>
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                                {activeChat.userEmail ? `Email: ${activeChat.userEmail} • ` : ''}Session ID: <code>#{activeChat.id}</code>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                markChatReadByAdmin(activeChat.id);
                              }}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#475569'
                              }}
                            >
                              Mark Read ✓
                            </button>
                          </div>

                          {/* Message List */}
                          <div
                            style={{
                              flex: 1,
                              overflowY: 'auto',
                              padding: '16px 20px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              background: '#f8fafc'
                            }}
                          >
                            {activeChat.messages?.map((msg) => {
                              const isAdminMsg = msg.sender === 'admin';
                              return (
                                <div
                                  key={msg.id}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isAdminMsg ? 'flex-end' : 'flex-start'
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: '#64748b',
                                      marginBottom: '3px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px'
                                    }}
                                  >
                                    <span
                                      style={{
                                        background: isAdminMsg ? '#0284c7' : '#64748b',
                                        color: '#ffffff',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        fontSize: '0.62rem',
                                        fontWeight: 800
                                      }}
                                    >
                                      {isAdminMsg ? 'YOU (ADMIN)' : 'CANDIDATE'}
                                    </span>
                                    <span>{msg.senderName}</span>
                                    <span>•</span>
                                    <span>
                                      {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      maxWidth: '75%',
                                      padding: '10px 14px',
                                      borderRadius: isAdminMsg ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                      background: isAdminMsg ? '#0f172a' : '#ffffff',
                                      color: isAdminMsg ? '#ffffff' : '#0f172a',
                                      fontSize: '0.86rem',
                                      lineHeight: 1.45,
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                      border: isAdminMsg ? 'none' : '1px solid #e2e8f0',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {msg.text}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick Canned Responses */}
                          <div
                            style={{
                              background: '#ffffff',
                              padding: '8px 16px',
                              borderTop: '1px solid #e2e8f0',
                              display: 'flex',
                              gap: '6px',
                              overflowX: 'auto',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>
                              ⚡ Quick Replies:
                            </span>
                            {[
                              { label: '✅ Pro Activated', text: '✅ Your Pro access has been approved & activated! Please refresh your browser to start practicing.' },
                              { label: '🔍 Ask UTR', text: '🔍 Please provide your 12-digit UTR transaction number or UPI payment screenshot so we can verify.' },
                              { label: '⌨️ Font Help', text: '⌨️ For Mangal Inscript: Enable Hindi (Traditional) in Windows Language Settings. Press Alt+Shift to toggle.' },
                              { label: '👋 Greeting', text: '👋 Namaste! Thank you for contacting Exam Typing Support Desk. How can we assist you today?' }
                            ].map((canned, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setAdminReplyText(canned.text)}
                                style={{
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '14px',
                                  padding: '4px 9px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#334155',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {canned.label}
                              </button>
                            ))}
                          </div>

                          {/* Reply Input Form */}
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!selectedChatId || !adminReplyText.trim() || isSendingReply) return;
                              setIsSendingReply(true);
                              const textToSend = adminReplyText.trim();
                              setAdminReplyText('');
                              try {
                                const ok = await sendAdminLiveReply(
                                  selectedChatId,
                                  textToSend,
                                  activeAdminUser?.displayName || activeAdminUser?.email || 'Support Admin'
                                );
                                if (!ok) {
                                  setAdminReplyText(textToSend);
                                  alert('⚠️ Reply NOT delivered. Check Firestore rules / internet and try again.');
                                }
                              } catch (err) {
                                console.error('Failed to send admin reply:', err);
                              } finally {
                                setIsSendingReply(false);
                              }
                            }}
                            style={{
                              background: '#ffffff',
                              padding: '12px 18px',
                              borderTop: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Type your reply to candidate (Press Enter to send)..."
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              disabled={isSendingReply}
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '0.86rem',
                                outline: 'none'
                              }}
                              onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                            />
                            <button
                              type="submit"
                              disabled={!adminReplyText.trim() || isSendingReply}
                              style={{
                                background: adminReplyText.trim() && !isSendingReply ? '#0284c7' : '#94a3b8',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 18px',
                                fontSize: '0.86rem',
                                fontWeight: 800,
                                cursor: adminReplyText.trim() && !isSendingReply ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>Send Reply</span>
                              <span>✈️</span>
                            </button>
                          </form>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* --------------------------------------------------
                  TAB 2: AI ENGINE & DAILY GENERATOR
                  -------------------------------------------------- */}
              {activeTab === 'ai_engine' && (
                <div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      ⚡ AI Endpoint & Authentication Credentials
                    </h3>

                    {/* Presets */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                          1-Click AI Provider Presets (Auto-configures Base URL & Default Model):
                        </label>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {AI_PRESETS.length} Providers Available
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px' }}>
                        {AI_PRESETS.map((p) => {
                          const isSelected = cleanBaseUrl(aiConfig.baseUrl) === cleanBaseUrl(p.baseUrl);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleApplyPreset(p)}
                              style={{
                                padding: '10px 12px',
                                textAlign: 'left',
                                background: isSelected ? '#eff6ff' : '#f8fafc',
                                border: isSelected ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                                {isSelected && (
                                  <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#dbeafe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    Active
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 600, marginBottom: '3px' }}>
                                {p.badge}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Default: {p.defaultModel}
                              </div>
                            </button>
                          );
                        })}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                            Model Identifier & Auto-Detection:
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* 3-Option Filter Toggle: All vs. Free vs. Replying */}
                            <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setModelFilterType('all')}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  borderRadius: '5px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: modelFilterType === 'all' ? '#0f172a' : 'transparent',
                                  color: modelFilterType === 'all' ? '#ffffff' : '#64748b',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                🌐 All Models
                              </button>
                              <button
                                type="button"
                                onClick={() => setModelFilterType('free')}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  borderRadius: '5px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: modelFilterType === 'free' ? '#16a34a' : 'transparent',
                                  color: modelFilterType === 'free' ? '#ffffff' : '#64748b',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                🎁 Free Only
                              </button>
                              <button
                                type="button"
                                onClick={() => setModelFilterType('replying')}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  borderRadius: '5px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: modelFilterType === 'replying' ? '#0284c7' : 'transparent',
                                  color: modelFilterType === 'replying' ? '#ffffff' : '#64748b',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                ✅ Replying Only
                              </button>
                            </div>

                            {/* Auto-Detect Button */}
                            <button
                              type="button"
                              onClick={handleAutoDetectModels}
                              disabled={isDetectingModels}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                background: isDetectingModels ? '#94a3b8' : '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: isDetectingModels ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <span>{isDetectingModels ? '⏳' : '🔍'}</span>
                              <span>{isDetectingModels ? 'Detecting...' : 'Auto-Detect'}</span>
                            </button>

                            {/* Verify Replying Models Button */}
                            <button
                              type="button"
                              onClick={handleVerifyReplyingModels}
                              disabled={isVerifyingModels || !aiConfig.apiKey.trim()}
                              title={!aiConfig.apiKey.trim() ? 'Enter API Key first' : 'Test which models actively reply'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                background: isVerifyingModels ? '#94a3b8' : (!aiConfig.apiKey.trim() ? '#cbd5e1' : '#059669'),
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: isVerifyingModels || !aiConfig.apiKey.trim() ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <span>{isVerifyingModels ? '⏳' : '⚡'}</span>
                              <span>{isVerifyingModels ? 'Pinging...' : 'Verify Replying'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Detect Status Banner */}
                        {detectStatus && (
                          <div
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              marginBottom: '8px',
                              background: detectStatus.startsWith('✅') ? '#f0fdf4' : '#fffbeb',
                              color: detectStatus.startsWith('✅') ? '#166534' : '#92400e',
                              border: detectStatus.startsWith('✅') ? '1px solid #bbf7d0' : '1px solid #fde68a'
                            }}
                          >
                            {detectStatus}
                          </div>
                        )}

                        {/* Model Dropdown from Auto-Detected / Preset List */}
                        {displayedModels.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '3px' }}>
                              Choose from {modelFilterType === 'replying' ? '✅ Verified Replying' : (modelFilterType === 'free' ? '🎁 Free-Tier' : 'Available')} Models ({displayedModels.length} available):
                            </label>
                            <select
                              value={displayedModels.some((m) => m.id === aiConfig.model) ? aiConfig.model : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setAiConfig({ ...aiConfig, model: e.target.value });
                                  const sel = displayedModels.find((m) => m.id === e.target.value);
                                  if (sel?.isReplying) {
                                    setActiveModelVerified({ replying: true, message: `Model '${e.target.value}' is verified and replying!` });
                                  } else {
                                    setActiveModelVerified(null);
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #0284c7',
                                background: '#f8fafc',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#0f172a'
                              }}
                            >
                              <option value="">-- Select from {displayedModels.length} {modelFilterType === 'replying' ? 'Replying' : (modelFilterType === 'free' ? 'Free' : 'Detected')} Models --</option>
                              {displayedModels.map((m) => {
                                const statusPrefix = m.isReplying
                                  ? '✅ [REPLYING] '
                                  : m.replyStatus === 'failed'
                                  ? '❌ [404/ERR] '
                                  : m.isFree
                                  ? '🎁 [FREE] '
                                  : '⭐ [PRO] ';
                                return (
                                  <option key={m.id} value={m.id}>
                                    {statusPrefix}{m.name || m.id} ({m.id})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        {/* Active Model Verified Tick Mark Banner */}
                        {activeModelVerified && (
                          <div
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: activeModelVerified.replying ? '#ecfdf5' : '#fef2f2',
                              color: activeModelVerified.replying ? '#047857' : '#b91c1c',
                              border: activeModelVerified.replying ? '1px solid #a7f3d0' : '1px solid #fecaca'
                            }}
                          >
                            <span>{activeModelVerified.replying ? '✅' : '⚠️'}</span>
                            <span>{activeModelVerified.message}</span>
                          </div>
                        )}

                        {/* Custom / Active Model Input */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '3px' }}>
                            Active Model Identifier (Custom or Selected):
                          </label>
                          <input
                            type="text"
                            value={aiConfig.model}
                            onChange={(e) => {
                              setAiConfig({ ...aiConfig, model: e.target.value });
                              setActiveModelVerified(null);
                            }}
                            placeholder="e.g. llama-3.1-8b-instant, gemini-2.0-flash, or gpt-4o-mini"
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontSize: '0.85rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                          💡 Tip: Click <b>⚡ Verify Replying</b> to ping models with your API key. Working models get a green tick mark (✅) so you can safely generate tests without 404 errors!
                        </div>
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
                  <div style={{ background: '#ffffff', border: '1.5px solid #86efac', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#14532d' }}>
                          🔥 Daily 8 Live Tests Generator (AR-Typing Level)
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#166534' }}>
                          Generates 4 English (2 Med, 2 Hard) + 4 Hindi (2 Med, 2 Hard) passages for all candidates.
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
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
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
                          <option value="medium">Medium (Standard 500–540w)</option>
                          <option value="hard">Hard (Longer Words 8–16+ letters, AWL ≥ 7.0)</option>
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

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        style={{
                          padding: '8px 14px',
                          background: isFullscreen ? 'rgba(2, 132, 199, 0.15)' : '#f1f5f9',
                          border: isFullscreen ? '1px solid #0284c7' : '1px solid #cbd5e1',
                          color: isFullscreen ? '#0284c7' : '#334155',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{isFullscreen ? '🗗' : '⛶'}</span>
                        <span>{isFullscreen ? 'Exit Full Screen Studio' : 'Full Screen Studio'}</span>
                      </button>

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
                    <div style={{ background: '#ffffff', border: '1.5px solid #0284c7', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
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
                            <option value="hard">Hard (Long Words)</option>
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

                    <div style={{ maxHeight: isFullscreen ? 'calc(100vh - 290px)' : '420px', overflowY: 'auto' }}>
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
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPassage(p)}
                                      style={{
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1d4ed8',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      👁️ Preview
                                    </button>
                                    {isCustom ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCustomPassage(p.id)}
                                        style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                      >
                                        Delete
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Core Test</span>
                                    )}
                                  </div>
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
                  TAB 4: CANDIDATE DIRECTORY & FIREBASE ROLES
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
                      {filteredCandidates.length} Registered Accounts in Firebase
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 14px' }}>Roll Number</th>
                          <th style={{ padding: '10px 14px' }}>Candidate Name</th>
                          <th style={{ padding: '10px 14px' }}>Category</th>
                          <th style={{ padding: '10px 14px' }}>Firebase Role</th>
                          <th style={{ padding: '10px 14px' }}>Email / UID</th>
                          <th style={{ padding: '10px 14px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCandidates.map((c) => {
                          const isCandAdmin = !!c.isAdmin || c.role === 'admin';
                          return (
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
                              <td style={{ padding: '10px 14px' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: isCandAdmin ? '#eff6ff' : '#f1f5f9',
                                    color: isCandAdmin ? '#1d4ed8' : '#64748b',
                                    border: isCandAdmin ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                                  }}
                                >
                                  {isCandAdmin ? '🛡️ ADMIN' : 'CANDIDATE'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.78rem' }}>
                                {c.email || c.uid}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdminRole(c.uid, isCandAdmin)}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: isCandAdmin ? '1px solid #fca5a5' : '1px solid #86efac',
                                    background: isCandAdmin ? '#fee2e2' : '#f0fdf4',
                                    color: isCandAdmin ? '#991b1b' : '#166534'
                                  }}
                                >
                                  {isCandAdmin ? 'Revoke Admin' : '🛡️ Make Admin'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --------------------------------------------------
                  TAB: PAYMENTS & SUBSCRIPTIONS
                  -------------------------------------------------- */}
              {activeTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Feedback Notification */}
                  {paymentFeedback && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: paymentFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${paymentFeedback.type === 'success' ? '#86efac' : '#fecaca'}`,
                        color: paymentFeedback.type === 'success' ? '#166534' : '#991b1b',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{paymentFeedback.message}</span>
                      <button
                        onClick={() => setPaymentFeedback(null)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Payment KPIs */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Total Submissions
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                        {paymentsList.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>QR UPI Candidate Transactions</div>
                    </div>

                    <div
                      style={{
                        background: pendingPaymentsCount > 0 ? '#fffbeb' : '#ffffff',
                        border: pendingPaymentsCount > 0 ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '18px'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: pendingPaymentsCount > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase' }}>
                        Pending Approvals
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: pendingPaymentsCount > 0 ? '#d97706' : '#0f172a', margin: '4px 0' }}>
                        {pendingPaymentsCount}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: pendingPaymentsCount > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>
                        {pendingPaymentsCount > 0 ? '🚨 Action Required: Review UTR' : 'All transactions reviewed'}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Approved Pro Subscriptions
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>
                        {paymentsList.filter((p) => p.status === 'approved').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>Active Subscribed Candidates</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Total Verified Revenue
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
                        ₹{approvedPaymentsRevenue}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>From Approved QR Payments</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Active Promo Codes
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6', margin: '4px 0' }}>
                        {promoCodesList.filter((p) => p.isActive).length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>Discount Coupons Live</div>
                    </div>
                  </div>

                  {/* Submissions Management Section */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '16px'
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          💳 Candidate Payment Submissions & Approvals
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                          Review candidate 12-digit UTR numbers and receipt screenshots to activate Pro exam memberships.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Status Filter Pills */}
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setPaymentFilterStatus(st)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: paymentFilterStatus === st ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              background: paymentFilterStatus === st ? '#e0f2fe' : '#ffffff',
                              color: paymentFilterStatus === st ? '#0284c7' : '#475569',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textTransform: 'uppercase'
                            }}
                          >
                            {st === 'pending' && pendingPaymentsCount > 0 ? `⏳ PENDING (${pendingPaymentsCount})` : st}
                          </button>
                        ))}

                        <button
                          onClick={loadPaymentsAndPromos}
                          disabled={isLoadingPayments}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Refresh payment submissions"
                        >
                          🔄 Refresh
                        </button>
                      </div>
                    </div>

                    {/* Submissions Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '10px 12px' }}>Date / Request ID</th>
                            <th style={{ padding: '10px 12px' }}>Candidate</th>
                            <th style={{ padding: '10px 12px' }}>Plan & Target Exam</th>
                            <th style={{ padding: '10px 12px' }}>Amount & Coupon</th>
                            <th style={{ padding: '10px 12px' }}>UTR / Txn ID</th>
                            <th style={{ padding: '10px 12px' }}>Payment Screenshot</th>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Admin Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💳</div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No payment submissions found</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                  When candidates pay via PhonePe QR code and submit their UTR transaction ID, they will appear here for review.
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredPayments.map((sub) => {
                              const isPending = sub.status === 'pending';
                              const isApproved = sub.status === 'approved';
                              const isRejected = sub.status === 'rejected';
                              const isActing = paymentActionLoadingId === sub.id;

                              return (
                                <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9', background: isPending ? '#fffdf7' : 'transparent' }}>
                                  {/* Date & ID */}
                                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                      {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      {new Date(sub.submittedAt).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                      #{sub.id.substring(0, 8)}
                                    </div>
                                  </td>

                                  {/* Candidate */}
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                      {sub.userName || 'Candidate'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>
                                      {sub.userEmail}
                                    </div>
                                    {sub.userPhone && (
                                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        📞 {sub.userPhone}
                                      </div>
                                    )}
                                  </td>

                                  {/* Plan & Exam */}
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ display: 'inline-block', fontWeight: 800, color: '#4338ca', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', marginBottom: '2px' }}>
                                      {sub.planName}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                                      {sub.selectedExamTitle || sub.examTitle || 'All 129 Exams Combo'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                      Duration: {sub.durationMonths || 1} Month{(sub.durationMonths || 1) > 1 ? 's' : ''}
                                    </div>
                                  </td>

                                  {/* Amount */}
                                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                      ₹{sub.finalAmount || sub.finalAmountPaid || 0}
                                    </div>
                                    {sub.discountAmount && sub.discountAmount > 0 ? (
                                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>
                                        🎟️ {sub.promoCodeApplied || sub.promoCodeUsed} (-₹{sub.discountAmount})
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                        No coupon
                                      </div>
                                    )}
                                  </td>

                                  {/* UTR */}
                                  <td style={{ padding: '10px 12px' }}>
                                    <div
                                      onClick={() => {
                                        navigator.clipboard.writeText(sub.utrNumber);
                                        alert(`Copied UTR: ${sub.utrNumber}`);
                                      }}
                                      style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        color: '#0f172a',
                                        background: '#f1f5f9',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        border: '1px solid #cbd5e1'
                                      }}
                                      title="Click to copy UTR"
                                    >
                                      {sub.utrNumber} 📋
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                                      PhonePe / UPI Ref
                                    </div>
                                  </td>

                                  {/* Screenshot Proof */}
                                  <td style={{ padding: '10px 12px' }}>
                                    {sub.screenshotUrl ? (
                                      <div
                                        onClick={() => setSelectedScreenshotUrl(sub.screenshotUrl)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          cursor: 'pointer'
                                        }}
                                        title="Click to zoom screenshot"
                                      >
                                        <img
                                          src={sub.screenshotUrl}
                                          alt="Payment receipt proof"
                                          style={{
                                            width: '42px',
                                            height: '42px',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            border: '1.5px solid #0284c7',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                          }}
                                        />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                                          View 🔍
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                        No image
                                      </span>
                                    )}
                                  </td>

                                  {/* Status */}
                                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    {isPending && (
                                      <span
                                        style={{
                                          padding: '4px 10px',
                                          borderRadius: '20px',
                                          background: '#fffbeb',
                                          color: '#b45309',
                                          fontWeight: 800,
                                          fontSize: '0.72rem',
                                          border: '1px solid #fde68a',
                                          display: 'inline-block'
                                        }}
                                      >
                                        ⏳ PENDING
                                      </span>
                                    )}
                                    {isApproved && (
                                      <div>
                                        <span
                                          style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            background: '#f0fdf4',
                                            color: '#166534',
                                            fontWeight: 800,
                                            fontSize: '0.72rem',
                                            border: '1px solid #bbf7d0',
                                            display: 'inline-block'
                                          }}
                                        >
                                          ✅ APPROVED
                                        </span>
                                        {(sub.reviewedAt || sub.approvedAt) && (
                                          <div style={{ fontSize: '0.68rem', color: '#15803d', marginTop: '2px' }}>
                                            {new Date(sub.reviewedAt || sub.approvedAt!).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {isRejected && (
                                      <div>
                                        <span
                                          style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            background: '#fef2f2',
                                            color: '#991b1b',
                                            fontWeight: 800,
                                            fontSize: '0.72rem',
                                            border: '1px solid #fecaca',
                                            display: 'inline-block'
                                          }}
                                        >
                                          ❌ REJECTED
                                        </span>
                                        {sub.rejectionReason && (
                                          <div style={{ fontSize: '0.68rem', color: '#b91c1c', marginTop: '2px', maxWidth: '120px' }}>
                                            {sub.rejectionReason}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    {isPending && (
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <button
                                          onClick={() => handleApprovePayment(sub)}
                                          disabled={isActing}
                                          style={{
                                            background: '#16a34a',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            cursor: isActing ? 'not-allowed' : 'pointer'
                                          }}
                                          title="Verify payment and activate Pro subscription"
                                        >
                                          {isActing ? '...' : '✅ Approve'}
                                        </button>

                                        <button
                                          onClick={() => handleRejectPayment(sub)}
                                          disabled={isActing}
                                          style={{
                                            background: '#ef4444',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            cursor: isActing ? 'not-allowed' : 'pointer'
                                          }}
                                          title="Reject payment submission"
                                        >
                                          {isActing ? '...' : '❌ Reject'}
                                        </button>
                                      </div>
                                    )}

                                    {isApproved && (
                                      <button
                                        onClick={() => handleRejectPayment(sub)}
                                        disabled={isActing}
                                        style={{
                                          background: 'transparent',
                                          color: '#dc2626',
                                          border: '1px solid #fca5a5',
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                          fontSize: '0.7rem',
                                          cursor: isActing ? 'not-allowed' : 'pointer'
                                        }}
                                        title="Revoke Pro subscription"
                                      >
                                        Revoke Pro
                                      </button>
                                    )}

                                    {isRejected && (
                                      <button
                                        onClick={() => handleApprovePayment(sub)}
                                        disabled={isActing}
                                        style={{
                                          background: 'transparent',
                                          color: '#16a34a',
                                          border: '1px solid #86efac',
                                          padding: '4px 8px',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                          fontSize: '0.7rem',
                                          cursor: isActing ? 'not-allowed' : 'pointer'
                                        }}
                                        title="Re-approve this payment"
                                      >
                                        Re-approve
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Promo Codes Management Suite */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                      gap: '20px'
                    }}
                  >
                    {/* Active Promo Codes List */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                            🎟️ Live Discount Promo Codes ({promoCodesList.length})
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Candidates enter these codes during payment for instant discounts.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {promoCodesList.map((promo) => (
                          <div
                            key={promo.code}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: promo.isActive ? '#f8fafc' : '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              opacity: promo.isActive ? 1 : 0.65
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: '0.88rem',
                                    color: '#4338ca',
                                    background: '#e0e7ff',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {promo.code}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: promo.discountType === 'percentage' ? '#047857' : '#0369a1',
                                    background: promo.discountType === 'percentage' ? '#d1fae5' : '#e0f2fe',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} FLAT OFF`}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                                {promo.description} &bull; Min Order: ₹{promo.minOrderValue || promo.minOrderAmount || 0}
                                {(promo.maxDiscount || promo.maxDiscountAmount) ? ` &bull; Max: ₹${promo.maxDiscount || promo.maxDiscountAmount}` : ''}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                onClick={() => handleTogglePromoStatus(promo.code)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  background: promo.isActive ? '#dcfce7' : '#fee2e2',
                                  color: promo.isActive ? '#15803d' : '#991b1b'
                                }}
                              >
                                {promo.isActive ? 'Active' : 'Disabled'}
                              </button>

                              <button
                                onClick={() => handleDeletePromoCode(promo.code)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #fecaca',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  background: '#ffffff',
                                  color: '#dc2626'
                                }}
                                title="Delete promo code"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Create New Promo Code Form */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        ➕ Create New Promo Code
                      </h3>

                      <form onSubmit={handleCreatePromoCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Promo Code Name (Uppercase):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. POLICE2026, SUMMER50"
                            value={newPromoCode}
                            onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                            required
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                              fontFamily: 'monospace',
                              fontWeight: 700
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Discount Type:
                            </label>
                            <select
                              value={newPromoType}
                              onChange={(e) => setNewPromoType(e.target.value as any)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem'
                              }}
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="flat">Flat Rupee (₹)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Discount Value:
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={newPromoDiscount}
                              onChange={(e) => setNewPromoDiscount(Number(e.target.value))}
                              required
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontWeight: 700
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                              Min Order Amount (₹):
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={newPromoMinOrder}
                              onChange={(e) => setNewPromoMinOrder(Number(e.target.value))}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem'
                              }}
                            />
                          </div>

                          {newPromoType === 'percentage' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                                Max Discount Cap (₹):
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={newPromoMaxDiscount}
                                onChange={(e) => setNewPromoMaxDiscount(Number(e.target.value))}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.85rem'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Description:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Special candidate festival discount"
                            value={newPromoDesc}
                            onChange={(e) => setNewPromoDesc(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          style={{
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            marginTop: '6px'
                          }}
                        >
                          ➕ Create & Publish Promo Code
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Telegram Bot Integration Suite */}
                  <div style={{ background: '#ffffff', border: '1.5px solid #38bdf8', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(56, 189, 248, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #2aabee 0%, #229ed9 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            boxShadow: '0 4px 10px rgba(34, 158, 217, 0.35)'
                          }}
                        >
                          ✈️
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            🤖 Telegram Admin Bot & 1-Click Instant Approvals
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Forward payment receipts, screenshots & UTRs straight to your Telegram phone with instant <b>[✅ Approve Pro Access]</b> buttons.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                          <input
                            type="checkbox"
                            checked={telegramConfig.enabled}
                            onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
                          />
                          <span>Alerts Enabled</span>
                        </label>
                      </div>
                    </div>

                    {telegramStatus.message && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          marginBottom: '16px',
                          background: telegramStatus.success ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${telegramStatus.success ? '#86efac' : '#fecaca'}`,
                          color: telegramStatus.success ? '#166534' : '#991b1b',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        {telegramStatus.message}
                      </div>
                    )}

                    <form onSubmit={handleSaveTelegramConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {/* Bot Token */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Telegram Bot Token (from @BotFather):
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type={showTelegramToken ? 'text' : 'password'}
                              placeholder="e.g. 7123456789:AAHk..."
                              value={telegramConfig.botToken}
                              onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value.trim() })}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowTelegramToken(!showTelegramToken)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              {showTelegramToken ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>

                        {/* Admin Chat ID */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Admin Chat ID / Channel ID (from @userinfobot):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 123456789 or -100123456789"
                            value={telegramConfig.adminChatId}
                            onChange={(e) => setTelegramConfig({ ...telegramConfig, adminChatId: e.target.value.trim() })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {/* Approval Secret Token */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            1-Click Approval Security Secret:
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              value={telegramConfig.approvalSecretToken}
                              onChange={(e) => setTelegramConfig({ ...telegramConfig, approvalSecretToken: e.target.value.trim() })}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setTelegramConfig({ ...telegramConfig, approvalSecretToken: 'adm_' + Math.random().toString(36).substring(2, 12) })}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                              title="Generate new secret token"
                            >
                              🎲 New
                            </button>
                          </div>
                        </div>

                        {/* Community Broadcast Channel URL */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            📢 Official Telegram Broadcast Channel:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. https://t.me/Exam_Typing_Mentor"
                            value={telegramConfig.communityChannelUrl}
                            onChange={(e) => setTelegramConfig({ ...telegramConfig, communityChannelUrl: e.target.value.trim() })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>

                        {/* Discussion Group URL */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            👥 Telegram Aspirants Discussion Group:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. https://t.me/+Lw-tPbRqO0c2ZTA1"
                            value={telegramConfig.discussionGroupUrl || ''}
                            onChange={(e) => setTelegramConfig({ ...telegramConfig, discussionGroupUrl: e.target.value.trim() })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>

                        {/* Support Username */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            💬 1-on-1 Direct Support Admin Telegram Username (without @):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. purendare"
                            value={telegramConfig.supportUsername || ''}
                            onChange={(e) => setTelegramConfig({ ...telegramConfig, supportUsername: e.target.value.trim().replace(/^@/, '') })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="submit"
                          style={{
                            padding: '9px 18px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          💾 Save Telegram Bot Settings
                        </button>

                        <button
                          type="button"
                          onClick={handleTestTelegramPing}
                          disabled={telegramStatus.loading}
                          style={{
                            padding: '9px 18px',
                            background: '#f0fdf4',
                            color: '#166534',
                            border: '1.5px solid #86efac',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: telegramStatus.loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>⚡</span>
                          <span>{telegramStatus.loading ? 'Testing...' : 'Test Telegram Ping to My Phone'}</span>
                        </button>
                      </div>
                    </form>

                    {/* Step-by-Step Guide */}
                    <div style={{ marginTop: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', marginBottom: '6px' }}>
                        📋 1-Minute Setup Guide for Telegram Alerts:
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                        <li>Open Telegram app and search for <code>@BotFather</code>.</li>
                        <li>Send <code>/newbot</code>, give it a name (e.g. <i>Exam Typing Admin</i>), then copy the <b>HTTP API Token</b> and paste it above.</li>
                        <li>Open Telegram, search for <code>@userinfobot</code>, tap Start, and copy your numerical <b>Id</b> (Chat ID).</li>
                        <li>Start a conversation with your new bot by tapping its link and pressing <b>Start</b>.</li>
                        <li>Paste both above and click <b>"Test Telegram Ping"</b>. Whenever a candidate pays, you get their screenshot and 1-click Approve link right on your phone!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Screenshot Lightbox Modal */}
              {selectedScreenshotUrl && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 100000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}
                  onClick={() => setSelectedScreenshotUrl(null)}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '520px',
                      width: '100%',
                      maxHeight: '90vh',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        padding: '16px 20px',
                        background: '#0f172a',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        🧾 Payment Receipt Proof
                      </div>
                      <button
                        onClick={() => setSelectedScreenshotUrl(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '1.2rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ padding: '16px', flex: 1, overflowY: 'auto', textAlign: 'center', background: '#f8fafc' }}>
                      <img
                        src={selectedScreenshotUrl}
                        alt="Candidate payment screenshot"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '65vh',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1'
                        }}
                      />
                    </div>

                    <div
                      style={{
                        padding: '14px 20px',
                        background: '#ffffff',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <a
                        href={selectedScreenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          color: '#0284c7',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        Open Original in New Tab ↗
                      </a>

                      <button
                        onClick={() => setSelectedScreenshotUrl(null)}
                        style={{
                          padding: '8px 18px',
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Close Preview
                      </button>
                    </div>
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

                  {/* Change Master PIN */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      🔐 Security & Master PIN
                    </h3>
                    <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Update the backup authorization passphrase used to verify admin actions.
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
                          New Master PIN / Passphrase:
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
                        🔑 Update Master PIN
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Modal for Passage Studio */}
        {previewPassage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 10005,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setPreviewPassage(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                maxWidth: '750px',
                width: '100%',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                overflow: 'hidden',
                border: '1px solid #334155'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{previewPassage.title}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span>ID: {previewPassage.id}</span>
                    <span>•</span>
                    <span>{previewPassage.language.toUpperCase()}</span>
                    <span>•</span>
                    <span>{previewPassage.wordCount} words</span>
                    <span>•</span>
                    <span>{previewPassage.difficulty.toUpperCase()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPassage(null)}
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

              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  fontSize: '0.98rem',
                  lineHeight: '1.8',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                  fontFamily: previewPassage.language === 'hindi_kruti'
                    ? "'Kruti Dev 010', 'KrutiDev010', sans-serif"
                    : previewPassage.language.includes('hindi')
                    ? "'Mangal', 'Noto Sans Devanagari', sans-serif"
                    : 'inherit'
                }}
              >
                {previewPassage.text}
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Target Speed: {previewPassage.language === 'english' ? '30 WPM (85% Accuracy)' : '25 WPM (85% Accuracy)'}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPassage(null)}
                  style={{
                    padding: '8px 18px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
