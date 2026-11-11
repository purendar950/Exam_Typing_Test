import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  DEFAULT_AI_CONFIG,
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
  DAILY_8_SLOTS,
  DAILY_BALANCED_SLOTS,
  AiProviderConfig,
  getActiveProviders,
  EXAM_CATEGORY_OPTIONS,
  EXAM_RECOMMENDED_TOPICS
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
  PaymentPlan,
  fetchAllPaymentSubmissions,
  approvePaymentSubmission,
  rejectPaymentSubmission,
  getPromoCodes,
  savePromoCodes,
  getPaymentPlans,
  savePaymentPlans,
  DEFAULT_PAYMENT_PLANS,
  UpiMerchantConfig,
  getUpiMerchantConfig,
  saveUpiMerchantConfig,
  syncPricingConfigFromCloud,
  backfillSubscriptionScopes,
  DEFAULT_UPI_CONFIG
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
import { syncPaidPassagesToFirestore } from '../services/passageService';
import appLogo from '../assets/logo.webp';

const PRICING_CLOUD_SAVE_FAILED =
  '⚠️ Saved on this device only. Could not save to the cloud, so candidates still see the old pricing. Check that you are signed in as admin and online, then save again.';
const PROMO_CLOUD_SAVE_FAILED =
  'Saved on this device only. Could not save promo codes to the cloud, so candidates still see the old list. Check that you are signed in as admin and online, then try again.';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  passages: Passage[];
  onPassagesUpdated: (updatedPassages: Passage[]) => void;
  onDailyLiveGenerated: (tests: Passage[]) => void;
  currentUser?: UserProfile | null;
  onLoginSuccess?: (user: UserProfile) => void;
  initialTab?: 'overview' | 'live_chat' | 'ai_engine' | 'passages' | 'candidates' | 'payments' | 'pricing' | 'settings';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'live_chat' | 'ai_engine' | 'passages' | 'candidates' | 'payments' | 'pricing' | 'settings'>(initialTab || 'overview');

  // Pricing Plans & UPI Merchant State
  const [pricingPlansList, setPricingPlansList] = useState<PaymentPlan[]>(() => getPaymentPlans());
  const [upiMerchantConfig, setUpiMerchantConfig] = useState<UpiMerchantConfig>(() => getUpiMerchantConfig());
  const [pricingSaveMessage, setPricingSaveMessage] = useState<string | null>(null);

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
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showProviderKeys, setShowProviderKeys] = useState<Record<string, boolean>>({});
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [providerTestResults, setProviderTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
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

  // Daily Live Generator in Admin (10 Exam-Calibrated Slots)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isGeneratingDaily, setIsGeneratingDaily] = useState<boolean>(false);
  const [dailyProgress, setDailyProgress] = useState<{ completed: number; total: number; message: string }>({
    completed: 0,
    total: 10,
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

  const selectedAdminCatOption = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === customCategory);
  const adminSuggestedTopics = EXAM_RECOMMENDED_TOPICS[customCategory] || EXAM_RECOMMENDED_TOPICS.all || [];

  const handleAdminCategoryChange = (newCat: string) => {
    setCustomCategory(newCat as ExamCategory);
    const meta = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === newCat);
    if (meta) {
      const isHi = customLanguage.startsWith('hindi');
      setCustomTargetWords(isHi ? meta.defaultHindiWords : meta.defaultEnglishWords);
    }
  };

  const handleAdminLanguageChange = (newLang: Language) => {
    setCustomLanguage(newLang);
    const meta = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === customCategory);
    if (meta) {
      const isHi = newLang.startsWith('hindi');
      setCustomTargetWords(isHi ? meta.defaultHindiWords : meta.defaultEnglishWords);
    }
  };

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
  const [isSyncingPaidPassages, setIsSyncingPaidPassages] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [syncProgressCount, setSyncProgressCount] = useState<{ done: number; total: number } | null>(null);

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
      } else {
        setIsAuthenticated(false);
      }

      setFbAuthError('');
      setFbAuthSuccess('');
      setFbEmail(currentUser?.email || '');
      setFbPassword('');

      // Load AI Config
      getAiConfig().then((loaded) => {
        if (!loaded.providers || loaded.providers.length === 0) {
          loaded.providers = DEFAULT_AI_CONFIG.providers;
        }
        setAiConfig(loaded);
      });

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

      // Load the shared pricing config so this panel edits what candidates actually see
      if (await syncPricingConfigFromCloud()) {
        setPricingPlansList(getPaymentPlans());
        setUpiMerchantConfig(getUpiMerchantConfig());
      }
      const promos = getPromoCodes();
      setPromoCodesList(promos);

      // One-time repair: older single-exam approvals did not store the exam scope
      // that the Firestore paywall rules now require.
      if (!localStorage.getItem('up_subscription_scope_backfill_v1')) {
        try {
          await backfillSubscriptionScopes(subs);
          localStorage.setItem('up_subscription_scope_backfill_v1', new Date().toISOString());
        } catch (err) {
          console.warn('Subscription scope backfill failed, will retry next time:', err);
        }
      }
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
    setPromoCodesList(updated);
    setNewPromoCode('');
    setNewPromoDesc('');
    savePromoCodes(updated).then((ok) => {
      alert(ok ? `Promo code ${code} created successfully!` : PROMO_CLOUD_SAVE_FAILED);
    });
  };

  const handleTogglePromoStatus = (code: string) => {
    const updated = promoCodesList.map((p) => (p.code === code ? { ...p, isActive: !p.isActive } : p));
    setPromoCodesList(updated);
    savePromoCodes(updated).then((ok) => {
      if (!ok) alert(PROMO_CLOUD_SAVE_FAILED);
    });
  };

  const handleDeletePromoCode = (code: string) => {
    if (!window.confirm(`Delete promo code ${code}?`)) return;
    const updated = promoCodesList.filter((p) => p.code !== code);
    setPromoCodesList(updated);
    savePromoCodes(updated).then((ok) => {
      if (!ok) alert(PROMO_CLOUD_SAVE_FAILED);
    });
  };

  // Pricing Plans Handlers
  const handleUpdatePlan = (index: number, field: keyof PaymentPlan, value: any) => {
    setPricingPlansList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleUpdatePlanFeatures = (index: number, featuresText: string) => {
    const features = featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    setPricingPlansList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], features };
      return copy;
    });
  };

  const handleSavePricingPlans = async () => {
    const results = await Promise.all([
      savePaymentPlans(pricingPlansList),
      saveUpiMerchantConfig(upiMerchantConfig)
    ]);
    setPricingSaveMessage(
      results.every(Boolean)
        ? '✅ Pricing plans and UPI Merchant settings saved successfully! All checkout modals will reflect these updated details.'
        : PRICING_CLOUD_SAVE_FAILED
    );
    setTimeout(() => setPricingSaveMessage(null), 6000);
  };

  const handleResetPricingPlans = () => {
    if (!window.confirm('Reset all 5 pricing tiers and UPI settings to factory defaults?')) return;
    setPricingPlansList(DEFAULT_PAYMENT_PLANS);
    setUpiMerchantConfig(DEFAULT_UPI_CONFIG);
    Promise.all([
      savePaymentPlans(DEFAULT_PAYMENT_PLANS),
      saveUpiMerchantConfig(DEFAULT_UPI_CONFIG)
    ]).then((results) => {
      setPricingSaveMessage(
        results.every(Boolean)
          ? '🔄 Pricing plans and UPI settings reset to factory defaults.'
          : PRICING_CLOUD_SAVE_FAILED
      );
      setTimeout(() => setPricingSaveMessage(null), 6000);
    });
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

  const handleAddProvider = (presetId?: string) => {
    const preset = AI_PRESETS.find((p) => p.id === presetId) || AI_PRESETS[0];
    const newProv: AiProviderConfig = {
      id: `prov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${preset.name} (Fallback #${(aiConfig.providers?.length || 0) + 1})`,
      providerPreset: preset.id,
      baseUrl: preset.baseUrl,
      apiKey: '',
      model: preset.defaultModel,
      enabled: true,
      priority: (aiConfig.providers?.length || 0) + 1
    };
    const current = aiConfig.providers || [];
    setAiConfig({ ...aiConfig, providers: [...current, newProv] });
  };

  const handleRemoveProvider = (id: string) => {
    const filtered = (aiConfig.providers || []).filter((p) => p.id !== id);
    const reindexed = filtered.map((p, idx) => ({ ...p, priority: idx + 1 }));
    setAiConfig({ ...aiConfig, providers: reindexed });
  };

  const handleMoveProvider = (index: number, direction: 'up' | 'down') => {
    const list = [...(aiConfig.providers || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    const reindexed = list.map((p, idx) => ({ ...p, priority: idx + 1 }));
    setAiConfig({ ...aiConfig, providers: reindexed });
  };

  const handleToggleProvider = (id: string) => {
    const updated = (aiConfig.providers || []).map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    setAiConfig({ ...aiConfig, providers: updated });
  };

  const handleUpdateProvider = (id: string, field: keyof AiProviderConfig, value: any) => {
    const updated = (aiConfig.providers || []).map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setAiConfig({ ...aiConfig, providers: updated });
  };

  const handleTestSingleProvider = async (providerId: string) => {
    setTestingProviderId(providerId);
    try {
      const res = await testAiConnection(aiConfig, providerId);
      setProviderTestResults((prev) => ({
        ...prev,
        [providerId]: { success: res.success, message: res.message }
      }));
    } catch (err: any) {
      setProviderTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, message: err?.message || 'Connection failed' }
      }));
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleTestActiveModel = async () => {
    if (!aiConfig.apiKey.trim()) {
      setAiTestStatus({ loading: false, success: false, message: 'Please enter an API Key first to test active model.' });
      return;
    }
    setAiTestStatus({ loading: true });
    const res = await testAiConnection({
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      autoDaily: aiConfig.autoDaily
    });
    setAiTestStatus({ loading: false, success: res.success, message: res.message });
    if (res.success) {
      setActiveModelVerified({ replying: true, message: `Active Model '${aiConfig.model}' is verified and actively replying!` });
      setDetectedModels((prev) =>
        prev.map((m) => (m.id === aiConfig.model ? { ...m, isReplying: true, replyStatus: 'replying' } : m))
      );
    } else {
      setActiveModelVerified({ replying: false, message: res.message });
    }
  };

  const handleTestConnection = async () => {
    setAiTestStatus({ loading: true });
    const res = await testAiConnection(aiConfig);
    setAiTestStatus({ loading: false, success: res.success, message: res.message });
    if (res.success) {
      setActiveModelVerified({ replying: true, message: `Failover chain verified & ready!` });
    } else {
      setActiveModelVerified({ replying: false, message: res.message });
    }
  };

  const handleAddActiveModelToFailover = () => {
    if (!aiConfig.apiKey.trim()) {
      setAiTestStatus({ loading: false, success: false, message: 'Please enter an API Key first before adding to failover chain.' });
      return;
    }
    const current = aiConfig.providers || [];
    const newProv: AiProviderConfig = {
      id: `prov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${aiConfig.model || 'Model'} (Backup #${current.length + 1})`,
      providerPreset: '',
      baseUrl: cleanBaseUrl(aiConfig.baseUrl),
      apiKey: aiConfig.apiKey.trim(),
      model: aiConfig.model.trim() || 'gemini-2.0-flash',
      enabled: true,
      priority: current.length + 1
    };
    setAiConfig({ ...aiConfig, providers: [...current, newProv] });
    setAiSaveStatus(`✅ Added "${newProv.name}" to failover chain! Remember to click "Save AI Configuration" to save in Firebase.`);
    setTimeout(() => setAiSaveStatus(''), 5000);
  };

  const handleSaveAiConfig = async () => {
    setAiSaveStatus('⏳ Synchronizing AI configuration directly to Firebase Firestore & Local Storage...');
    try {
      const res = await saveAiConfig(aiConfig, true);
      setAiSaveStatus(res.message);
      setTimeout(() => setAiSaveStatus(''), 6000);
    } catch (err: any) {
      setAiSaveStatus(`❌ Save error: ${err?.message || 'Could not save'}`);
      setTimeout(() => setAiSaveStatus(''), 6000);
    }
  };

  // Generate Daily Balanced Live Tests (10 Multi-Exam Slots)
  const handleGenerateDaily = async () => {
    const active = getActiveProviders(aiConfig);
    if (active.length === 0) {
      setActiveTab('ai_engine');
      setAiTestStatus({ loading: false, success: false, message: 'Please enter at least one active API Key in AI Providers.' });
      return;
    }

    const totalSlots = DAILY_BALANCED_SLOTS.length;
    setIsGeneratingDaily(true);
    setDailyProgress({ completed: 0, total: totalSlots, message: 'Initializing daily live generator with multi-provider failover...' });

    try {
      await saveAiConfig(aiConfig, true);
      const tests = await generateAll8DailyLiveTests(
        selectedDate,
        aiConfig,
        (completed, total, message) => {
          setDailyProgress({ completed, total, message });
        },
        DAILY_BALANCED_SLOTS
      );

      onDailyLiveGenerated(tests);
      setDailyProgress({ completed: totalSlots, total: totalSlots, message: `🎉 All ${totalSlots} Live Tests Generated & Synced!` });
    } catch (err: any) {
      setDailyProgress({
        completed: 0,
        total: totalSlots,
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

  const syncFileInputRef = useRef<HTMLInputElement>(null);

  // Sync Paid Passages to Cloud Firestore
  const handleSyncPaidPassages = async (passagesToUpload?: Passage[]) => {
    let targetPassages = passagesToUpload || passages;
    const totalToSync = targetPassages.filter((p) => (p.testNumber ?? 0) > 7 && p.text?.trim()).length;

    if (totalToSync === 0) {
      // In production, paid passages text is stripped from the client bundle for security.
      // Prompt admin to select the private master passages JSON file.
      if (syncFileInputRef.current) {
        alert(
          'ℹ️ Secure Paywall Architecture:\n\n' +
          'Paid test passages are stored exclusively in Cloud Firestore and are not bundled in public client code.\n\n' +
          'Please select your master passages JSON file (e.g. "master-paid-passages.private.json") to upload directly to Cloud Firestore.'
        );
        syncFileInputRef.current.click();
        return;
      }
    }

    if (!window.confirm(`Sync ${totalToSync} Paid Passages (Tests #8+) to Cloud Firestore?\n\nThis will upload all test content securely into the /paid_passages collection on Firebase. Only candidates with active Pro subscriptions will be able to read them.`)) {
      return;
    }

    setIsSyncingPaidPassages(true);
    setSyncStatusMsg('⏳ Initializing Cloud Sync...');
    setSyncProgressCount(null);

    const res = await syncPaidPassagesToFirestore(targetPassages, (done, total) => {
      setSyncProgressCount({ done, total });
      setSyncStatusMsg(`⏳ Uploading to Cloud Firestore: ${done} / ${total} (${Math.round((done / total) * 100)}%)`);
    });

    setIsSyncingPaidPassages(false);
    if (res.success) {
      setSyncStatusMsg(`🎉 Success! All ${res.totalSynced} paid passages are now securely synced to Cloud Firestore.`);
    } else {
      setSyncStatusMsg(`❌ Cloud Sync Error: ${res.error}`);
    }
  };

  const handleFileSelectedForSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data)) {
          alert('Invalid format: Selected JSON must be an array of passages.');
          return;
        }
        await handleSyncPaidPassages(data as Passage[]);
      } catch (err: any) {
        alert('Failed to parse JSON file: ' + err.message);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
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
        backgroundColor: isFullscreen ? 'var(--tw-gray-950)' : 'rgba(15, 23, 42, 0.85)',
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
          backgroundColor: 'var(--surface)',
          borderRadius: isFullscreen ? 0 : '16px',
          width: isFullscreen ? '100vw' : '100%',
          maxWidth: isFullscreen ? '100vw' : '1080px',
          height: isFullscreen ? '100vh' : '92vh',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isFullscreen ? 'none' : '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: isFullscreen ? 'none' : '1px solid var(--tw-slate-700)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            FINTECH EXECUTIVE HEADER
            ========================================================= */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, var(--tw-gray-950) 0%, var(--tw-slate-900) 100%)',
            borderBottom: '1px solid var(--tw-slate-800)',
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
                border: '1.5px solid var(--tw-sky-400)',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--tw-slate-50)', letterSpacing: '-0.3px' }}>
                  UPPRPB Examination Control Suite
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--tw-sky-700)',
                    color: 'var(--tw-sky-100)',
                    border: '1px solid var(--tw-sky-400)'
                  }}
                >
                  FIREBASE ENTERPRISE ADMIN
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--fg-emerald-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tw-emerald-500)', display: 'inline-block' }} />
                  Firebase Online
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>•</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)' }}>AR-Typing Benchmark Portal</span>
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
                      fontSize: '0.8rem',
                      color: 'var(--tw-sky-400)',
                      background: 'var(--tw-slate-800)',
                      border: '1px solid var(--tw-slate-700)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-lg)'
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
                    border: '1px solid var(--tw-red-500)',
                    color: 'var(--tw-red-300)',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
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
                border: '1px solid ' + (isFullscreen ? 'var(--tw-sky-400)' : 'rgba(255, 255, 255, 0.2)'),
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
                color: isFullscreen ? 'var(--tw-sky-400)' : '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 500,
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
              background: 'var(--tw-gray-950)',
              padding: '24px',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                background: 'var(--tw-slate-900)',
                border: '1px solid var(--tw-slate-800)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--tw-sky-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    margin: '0 auto 14px auto',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                >
                  🛡️
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--tw-slate-50)' }}>
                  Firebase Admin Authentication
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--tw-slate-400)' }}>
                  Restricted Access • Authenticate via Firebase Cloud Services
                </p>
              </div>

              {/* Alert Messages */}
              {fbAuthError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--tw-red-500)',
                    color: 'var(--tw-red-300)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
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
                    border: '1px solid var(--tw-emerald-500)',
                    color: 'var(--tw-emerald-300)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
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
                  background: 'var(--surface)',
                  color: 'var(--fg-slate-900)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: fbAuthLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                  boxShadow: 'var(--shadow-md)'
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
                <div style={{ flex: 1, height: '1px', background: 'var(--tw-slate-700)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', fontWeight: 600, letterSpacing: '0.5px' }}>
                  OR OFFICIAL ADMIN PASSWORD
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--tw-slate-700)' }} />
              </div>

              {/* Email & Password Admin Form */}
              <form onSubmit={handleFirebaseAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-slate-300)', marginBottom: '5px' }}>
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
                      background: 'var(--tw-slate-800)',
                      border: '1.5px solid var(--tw-slate-700)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tw-slate-300)' }}>
                      Admin Password:
                    </label>
                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      disabled={isSendingReset}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--tw-sky-400)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
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
                        background: 'var(--tw-slate-800)',
                        border: '1.5px solid var(--tw-slate-700)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
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
                        color: 'var(--tw-slate-400)',
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
                    background: fbAuthLoading ? 'var(--tw-slate-500)' : 'var(--tw-sky-600)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: fbAuthLoading ? 'not-allowed' : 'pointer',
                    marginTop: '6px',
                    boxShadow: 'var(--shadow-md)'
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
                background: 'var(--tw-slate-900)',
                borderBottom: '1px solid var(--tw-slate-800)',
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
                {
                  id: 'pricing',
                  label: `🏷️ Pricing & Promos (${promoCodesList.length} Promos)`
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
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    borderBottom: activeTab === tab.id ? '2.5px solid var(--tw-sky-400)' : '2.5px solid transparent',
                    color: activeTab === tab.id ? 'var(--tw-sky-400)' : 'var(--tw-slate-400)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-slate-50)' }}>
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
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Question Bank Pool
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-slate-900)', margin: '4px 0' }}>
                        {passages.length} Tests
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-sky-600)', fontWeight: 500 }}>
                        234 Core + {customPassagesList.length} Custom Tests
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Registered Candidates
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-slate-900)', margin: '4px 0' }}>
                        {candidatesList.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-emerald-500)', fontWeight: 500 }}>
                        UP Police CO & ASI Registered
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Active AI Model
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg-slate-900)', margin: '8px 0' }}>
                        {aiConfig.model}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: aiConfig.apiKey ? 'var(--fg-emerald-500)' : 'var(--fg-amber-500)', fontWeight: 500 }}>
                        {aiConfig.apiKey ? '● Key Configured & Ready' : '⚠️ Missing API Key'}
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Firebase Admin Status
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg-slate-900)', margin: '8px 0' }}>
                        AUTHENTICATED 🛡️
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-emerald-500)', fontWeight: 500 }}>
                        {activeAdminUser?.email || 'Cloud Master Admin'}
                      </div>
                    </div>
                  </div>

                  {/* System Diagnostics Table */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      ⚙️ Firebase Cloud Infrastructure & Diagnostic Telemetry
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '12px', background: 'var(--bg-slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-slate-200)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', fontWeight: 600 }}>FIREBASE PROJECT ID</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-slate-900)', marginTop: '2px' }}>
                          upp-typing (Official UP Police Typing Mentor)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-emerald-500)', marginTop: '4px' }}>
                          Auth & Cloud Firestore Connected
                        </div>
                      </div>

                      <div style={{ padding: '12px', background: 'var(--bg-slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-slate-200)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', fontWeight: 600 }}>AI PROVIDER ENDPOINT</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-slate-900)', marginTop: '2px', wordBreak: 'break-all' }}>
                          {aiConfig.baseUrl}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-sky-600)', marginTop: '4px' }}>
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
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                        💬 Live Support Desk & Candidate Helpdesk
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
                        Real-time bidirectional chat with candidates. Candidates message from the website, you reply directly here. Telegram alerts are automatically dispatched.
                      </div>
                    </div>
                    {unreadLiveChatsCount > 0 && (
                      <span
                        style={{
                          background: 'var(--tw-red-500)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          boxShadow: 'var(--shadow-md)'
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
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--bd-slate-200)',
                      boxShadow: 'var(--shadow-lg)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Left Panel: Chat Sessions List */}
                    <div
                      style={{
                        width: '320px',
                        borderRight: '1px solid var(--bd-slate-200)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-slate-50)'
                      }}
                    >
                      {/* Search / Filter header */}
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bd-slate-200)', background: 'var(--surface)' }}>
                        <input
                          type="text"
                          placeholder="Search candidate name or email..."
                          value={liveChatSearch}
                          onChange={(e) => setLiveChatSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--bd-slate-300)',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Sessions List */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                        {liveChatsList.length === 0 ? (
                          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--tw-slate-400)', fontSize: '0.8rem' }}>
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
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '6px',
                                    cursor: 'pointer',
                                    background: isSelected ? 'var(--bg-sky-100)' : chat.unreadByAdmin ? 'var(--bg-red-50)' : 'var(--surface)',
                                    border: isSelected ? '1.5px solid var(--tw-sky-600)' : chat.unreadByAdmin ? '1.5px solid var(--tw-red-400)' : '1px solid var(--bd-slate-200)',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? 'var(--fg-sky-700)' : 'var(--fg-slate-900)' }}>
                                      {chat.userName || 'Candidate'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)' }}>
                                      {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  <div
                                    style={{
                                      fontSize: '0.75rem',
                                      color: chat.unreadByAdmin ? 'var(--fg-red-700)' : 'var(--fg-slate-500)',
                                      fontWeight: chat.unreadByAdmin ? 600 : 400,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {chat.lastMessage || 'No messages'}
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)' }}>
                                      {chat.userEmail ? chat.userEmail : `#${chat.id.substring(chat.id.length - 6)}`}
                                    </span>
                                    {chat.unreadByAdmin && (
                                      <span
                                        style={{
                                          background: 'var(--tw-red-500)',
                                          color: '#ffffff',
                                          padding: '1px 6px',
                                          borderRadius: 'var(--radius-md)',
                                          fontSize: '0.75rem',
                                          fontWeight: 600
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
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--tw-slate-400)', gap: '8px' }}>
                            <div style={{ fontSize: '2.5rem' }}>💬</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Select a candidate conversation</div>
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
                              borderBottom: '1px solid var(--bd-slate-200)',
                              background: 'var(--surface)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                                  {activeChat.userName || 'Candidate'}
                                </h4>
                                <span
                                  style={{
                                    background: 'var(--bg-green-100)',
                                    color: 'var(--fg-green-700)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}
                                >
                                  Active Thread
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
                                {activeChat.userEmail ? `Email: ${activeChat.userEmail} • ` : ''}Session ID: <code>#{activeChat.id}</code>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                markChatReadByAdmin(activeChat.id);
                              }}
                              style={{
                                background: 'var(--bg-slate-100)',
                                border: '1px solid var(--bd-slate-300)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                color: 'var(--fg-slate-600)'
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
                              background: 'var(--bg-slate-50)'
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
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: 'var(--fg-slate-500)',
                                      marginBottom: '3px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px'
                                    }}
                                  >
                                    <span
                                      style={{
                                        background: isAdminMsg ? 'var(--tw-sky-600)' : 'var(--tw-slate-500)',
                                        color: '#ffffff',
                                        padding: '1px 5px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
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
                                      background: isAdminMsg ? 'var(--tw-slate-900)' : 'var(--surface)',
                                      color: isAdminMsg ? '#ffffff' : 'var(--fg-slate-900)',
                                      fontSize: '0.875rem',
                                      lineHeight: 1.45,
                                      boxShadow: 'var(--shadow-md)',
                                      border: isAdminMsg ? 'none' : '1px solid var(--bd-slate-200)',
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
                              background: 'var(--surface)',
                              padding: '8px 16px',
                              borderTop: '1px solid var(--bd-slate-200)',
                              display: 'flex',
                              gap: '6px',
                              overflowX: 'auto',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', whiteSpace: 'nowrap' }}>
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
                                  background: 'var(--bg-slate-100)',
                                  border: '1px solid var(--bd-slate-300)',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: '4px 9px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--fg-slate-700)',
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
                              background: 'var(--surface)',
                              padding: '12px 18px',
                              borderTop: '1px solid var(--bd-slate-200)',
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
                                borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--bd-slate-300)',
                                fontSize: '0.875rem',
                                outline: 'none'
                              }}
                              onFocus={(e) => (e.target.style.borderColor = 'var(--tw-sky-600)')}
                              onBlur={(e) => (e.target.style.borderColor = 'var(--bd-slate-300)')}
                            />
                            <button
                              type="submit"
                              disabled={!adminReplyText.trim() || isSendingReply}
                              style={{
                                background: adminReplyText.trim() && !isSendingReply ? 'var(--tw-sky-600)' : 'var(--tw-slate-400)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                padding: '10px 18px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
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
                  {/* SECTION 1: Active AI Provider & Model Discovery (Directly in Admin Panel & Saved to Firebase) */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-300)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                          ⚡ Primary AI Provider Endpoint &amp; Model Discovery
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                          Directly configure your active AI credentials. Click <b>Auto-Detect</b> or <b>Verify Replying</b> to discover working models, and save directly to Firebase Firestore.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: 'var(--bg-sky-100)', color: 'var(--fg-sky-700)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                        🔥 Saves to Firebase Cloud
                      </span>
                    </div>

                    {/* Presets Grid */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)' }}>
                          1-Click AI Provider Presets (Auto-configures Base URL &amp; Default Model):
                        </label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
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
                                background: isSelected ? 'var(--bg-blue-50)' : 'var(--bg-slate-50)',
                                border: isSelected ? '1.5px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>{p.name}</div>
                                {isSelected && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--fg-sky-600)', background: 'var(--bg-blue-100)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                                    Active
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--fg-sky-700)', fontWeight: 500, marginBottom: '3px' }}>
                                {p.badge}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Default: {p.defaultModel}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Base URL and API Key Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '4px' }}>
                          Base URL (OpenAI-compatible Endpoint):
                        </label>
                        <input
                          type="text"
                          value={aiConfig.baseUrl}
                          onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                          placeholder="https://generativelanguage.googleapis.com/v1beta/openai/ or https://api.groq.com/openai/v1"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--bd-slate-300)', fontSize: '0.875rem', fontFamily: 'monospace' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '4px' }}>
                          API Key:
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={aiConfig.apiKey}
                            onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                            placeholder="Enter AI API Key (AIzaSy... or sk-...)"
                            style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--bd-slate-300)', fontSize: '0.875rem', fontFamily: 'monospace' }}
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

                      {/* Model Identifier & Auto-Detection Tools */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)' }}>
                            Model Identifier &amp; Auto-Detection:
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Filter: All vs Free vs Replying */}
                            <div style={{ display: 'inline-flex', background: 'var(--bg-slate-200)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                              <button
                                type="button"
                                onClick={() => setModelFilterType('all')}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-sm)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: modelFilterType === 'all' ? 'var(--tw-slate-900)' : 'transparent',
                                  color: modelFilterType === 'all' ? '#ffffff' : 'var(--fg-slate-500)'
                                }}
                              >
                                🌐 All Models
                              </button>
                              <button
                                type="button"
                                onClick={() => setModelFilterType('free')}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-sm)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: modelFilterType === 'free' ? 'var(--tw-green-600)' : 'transparent',
                                  color: modelFilterType === 'free' ? '#ffffff' : 'var(--fg-slate-500)'
                                }}
                              >
                                🎁 Free Only
                              </button>
                              <button
                                type="button"
                                onClick={() => setModelFilterType('replying')}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-sm)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: modelFilterType === 'replying' ? 'var(--tw-sky-600)' : 'transparent',
                                  color: modelFilterType === 'replying' ? '#ffffff' : 'var(--fg-slate-500)'
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
                                background: isDetectingModels ? 'var(--tw-slate-400)' : 'var(--tw-sky-600)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
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
                                background: isVerifyingModels ? 'var(--tw-slate-400)' : (!aiConfig.apiKey.trim() ? 'var(--bg-slate-300)' : 'var(--tw-emerald-600)'),
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
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
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              marginBottom: '8px',
                              background: detectStatus.startsWith('✅') ? 'var(--bg-green-50)' : 'var(--bg-amber-50)',
                              color: detectStatus.startsWith('✅') ? 'var(--fg-green-800)' : 'var(--fg-amber-800)',
                              border: detectStatus.startsWith('✅') ? '1px solid var(--bd-green-200)' : '1px solid var(--bd-amber-200)'
                            }}
                          >
                            {detectStatus}
                          </div>
                        )}

                        {/* Model Dropdown from Auto-Detected / Preset List */}
                        {displayedModels.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--fg-slate-500)', fontWeight: 500, marginBottom: '3px' }}>
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
                                borderRadius: 'var(--radius-md)',
                                border: '1.5px solid var(--tw-sky-600)',
                                background: 'var(--bg-slate-50)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: 'var(--fg-slate-900)'
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

                        {/* Active Model Verified Banner */}
                        {activeModelVerified && (
                          <div
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: activeModelVerified.replying ? 'var(--bg-emerald-50)' : 'var(--bg-red-50)',
                              color: activeModelVerified.replying ? 'var(--fg-emerald-700)' : 'var(--fg-red-700)',
                              border: activeModelVerified.replying ? '1px solid var(--bd-emerald-200)' : '1px solid var(--bd-red-200)'
                            }}
                          >
                            <span>{activeModelVerified.replying ? '✅' : '⚠️'}</span>
                            <span>{activeModelVerified.message}</span>
                          </div>
                        )}

                        {/* Custom / Active Model Input */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--fg-slate-500)', fontWeight: 500, marginBottom: '3px' }}>
                            Active Model Identifier (Custom or Selected):
                          </label>
                          <input
                            type="text"
                            value={aiConfig.model}
                            onChange={(e) => {
                              setAiConfig({ ...aiConfig, model: e.target.value });
                              setActiveModelVerified(null);
                            }}
                            placeholder="e.g. gemini-2.0-flash, llama-3.3-70b-versatile, or gpt-4o-mini"
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: '1.5px solid var(--bd-slate-300)',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      </div>

                      {/* Primary Actions Row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={handleTestActiveModel}
                          disabled={aiTestStatus.loading}
                          style={{
                            padding: '9px 15px',
                            background: 'var(--bg-slate-100)',
                            border: '1.5px solid var(--bd-slate-300)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {aiTestStatus.loading ? 'Testing...' : '🔌 Test Active Model'}
                        </button>

                        <button
                          type="button"
                          onClick={handleAddActiveModelToFailover}
                          style={{
                            padding: '9px 15px',
                            background: 'var(--bg-blue-50)',
                            color: 'var(--fg-blue-700)',
                            border: '1.5px solid var(--bd-blue-300)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          ➕ Add This Model to Failover Chain
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveAiConfig}
                          style={{
                            flex: 1,
                            minWidth: '220px',
                            padding: '9px 18px',
                            background: 'var(--tw-sky-600)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          💾 Save Directly to Firebase &amp; LocalStorage
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Multi-Model Failover Backup Chain (Automatic Failover if on Fail) */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                          🛡️ Multi-Model Failover Backup Chain (Auto-Switch On Failure)
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                          Add fallback AI models using Base URL &amp; API Key. If your primary active model encounters an HTTP 429 rate limit, quota exhaustion, or error, the generator automatically switches to these fallback models in order of priority.
                        </p>
                      </div>
                    </div>

                    {/* Live Failover Pipeline Breadcrumbs */}
                    <div style={{ background: 'var(--bg-slate-50)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Active Failover Route:
                      </span>
                      {/* Active Primary Chip */}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: aiConfig.apiKey ? 'var(--bg-blue-100)' : 'var(--bg-slate-100)',
                          color: aiConfig.apiKey ? 'var(--fg-blue-800)' : 'var(--tw-slate-400)',
                          border: aiConfig.apiKey ? '1px solid var(--bd-blue-300)' : '1px dashed var(--bd-slate-300)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>👑</span>
                        <span>Primary: {aiConfig.model || 'Active Model'}</span>
                        {!aiConfig.apiKey && <span style={{ fontSize: '0.75rem', color: 'var(--fg-amber-500)' }}>(No Key)</span>}
                      </span>

                      {/* Fallback Chips */}
                      {(aiConfig.providers || []).map((p, idx) => {
                        const isReady = p.enabled && p.apiKey.trim().length > 0;
                        return (
                          <React.Fragment key={p.id}>
                            <span style={{ color: 'var(--tw-slate-400)', fontSize: '0.8rem', fontWeight: 600 }}>➔</span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: isReady ? 'var(--bg-green-50)' : 'var(--bg-slate-100)',
                                color: isReady ? 'var(--fg-green-800)' : 'var(--tw-slate-400)',
                                border: isReady ? '1px solid var(--bd-green-300)' : '1px dashed var(--bd-slate-300)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>🛡️</span>
                              <span>Backup #{idx + 1}: {p.name || p.model}</span>
                              {!p.enabled && <span style={{ fontSize: '0.75rem', color: 'var(--fg-red-500)' }}>(Disabled)</span>}
                              {p.enabled && !p.apiKey.trim() && <span style={{ fontSize: '0.75rem', color: 'var(--fg-amber-500)' }}>(No Key)</span>}
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Providers List Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      {(aiConfig.providers || []).map((p, index) => {
                        return (
                          <div
                            key={p.id}
                            style={{
                              background: p.enabled ? 'var(--surface)' : 'var(--bg-slate-50)',
                              border: p.enabled ? '1.5px solid var(--bd-slate-300)' : '1.5px dashed var(--bd-slate-300)',
                              borderRadius: 'var(--radius-md)',
                              padding: '16px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {/* Card Header: Priority, Name, Status, Order buttons, Delete */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    background: 'var(--tw-slate-600)',
                                    color: '#ffffff',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    letterSpacing: '0.04em'
                                  }}
                                >
                                  FALLBACK #{index + 1}
                                </span>
                                <input
                                  type="text"
                                  value={p.name}
                                  onChange={(e) => handleUpdateProvider(p.id, 'name', e.target.value)}
                                  placeholder="Provider Name (e.g. Groq Cloud Llama 3.3)"
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    color: 'var(--fg-slate-900)',
                                    border: '1px solid transparent',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '2px 6px',
                                    background: 'transparent'
                                  }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {/* Enable / Disable Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleProvider(p.id)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: p.enabled ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                                    color: p.enabled ? 'var(--fg-green-700)' : 'var(--fg-red-800)'
                                  }}
                                >
                                  {p.enabled ? '🟢 Enabled' : '⚪ Disabled'}
                                </button>

                                {/* Move Up */}
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveProvider(index, 'up')}
                                  title="Move up in priority"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--bd-slate-300)',
                                    background: index === 0 ? 'var(--bg-slate-100)' : 'var(--surface)',
                                    color: index === 0 ? 'var(--tw-slate-400)' : 'var(--fg-slate-800)',
                                    cursor: index === 0 ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  ▲
                                </button>

                                {/* Move Down */}
                                <button
                                  type="button"
                                  disabled={index === (aiConfig.providers?.length || 0) - 1}
                                  onClick={() => handleMoveProvider(index, 'down')}
                                  title="Move down in priority"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--bd-slate-300)',
                                    background: index === (aiConfig.providers?.length || 0) - 1 ? 'var(--bg-slate-100)' : 'var(--surface)',
                                    color: index === (aiConfig.providers?.length || 0) - 1 ? 'var(--tw-slate-400)' : 'var(--fg-slate-800)',
                                    cursor: index === (aiConfig.providers?.length || 0) - 1 ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  ▼
                                </button>

                                {/* Remove Provider */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Remove provider "${p.name}" from failover chain?`)) {
                                      handleRemoveProvider(p.id);
                                    }
                                  }}
                                  title="Delete provider"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--bd-red-200)',
                                    background: 'var(--bg-rose-50)',
                                    color: 'var(--fg-rose-700)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Card Inputs Grid: Base URL, Model, API Key */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '3px' }}>
                                  Base URL (OpenAI-compatible):
                                </label>
                                <input
                                  type="text"
                                  value={p.baseUrl}
                                  onChange={(e) => handleUpdateProvider(p.id, 'baseUrl', e.target.value)}
                                  placeholder="https://api.groq.com/openai/v1"
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.8rem', fontFamily: 'monospace' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '3px' }}>
                                  Model Identifier:
                                </label>
                                <input
                                  type="text"
                                  value={p.model}
                                  onChange={(e) => handleUpdateProvider(p.id, 'model', e.target.value)}
                                  placeholder="e.g. llama-3.3-70b-versatile, gemini-2.0-flash"
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.8rem', fontFamily: 'monospace' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '3px' }}>
                                  API Key:
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type={showProviderKeys[p.id] ? 'text' : 'password'}
                                    value={p.apiKey}
                                    onChange={(e) => handleUpdateProvider(p.id, 'apiKey', e.target.value)}
                                    placeholder="Enter API Key (sk-... or AIzaSy...)"
                                    style={{ width: '100%', padding: '7px 32px 7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.8rem', fontFamily: 'monospace' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowProviderKeys({ ...showProviderKeys, [p.id]: !showProviderKeys[p.id] })}
                                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                  >
                                    {showProviderKeys[p.id] ? '🙈' : '👁️'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Preset Selector & Test Single Provider */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--bd-slate-100)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>Quick Preset:</span>
                                <select
                                  value={p.providerPreset || ''}
                                  onChange={(e) => {
                                    const pr = AI_PRESETS.find((x) => x.id === e.target.value);
                                    if (pr) {
                                      handleUpdateProvider(p.id, 'providerPreset', pr.id);
                                      handleUpdateProvider(p.id, 'baseUrl', pr.baseUrl);
                                      handleUpdateProvider(p.id, 'model', pr.defaultModel);
                                      if (!p.name || p.name.includes('Fallback') || p.name.includes('Backup')) {
                                        handleUpdateProvider(p.id, 'name', `${pr.name} (Backup #${index + 1})`);
                                      }
                                    }
                                  }}
                                  style={{ padding: '3px 8px', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', background: 'var(--surface)', color: 'var(--fg-slate-700)' }}
                                >
                                  <option value="">-- Apply Preset --</option>
                                  {AI_PRESETS.map((pr) => (
                                    <option key={pr.id} value={pr.id}>{pr.name} ({pr.defaultModel})</option>
                                  ))}
                                </select>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {providerTestResults[p.id] && (
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      padding: '2px 8px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: providerTestResults[p.id].success ? 'var(--bg-emerald-50)' : 'var(--bg-red-50)',
                                      color: providerTestResults[p.id].success ? 'var(--fg-emerald-700)' : 'var(--fg-red-700)',
                                      border: providerTestResults[p.id].success ? '1px solid var(--bd-emerald-200)' : '1px solid var(--bd-red-200)'
                                    }}
                                  >
                                    {providerTestResults[p.id].message}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  disabled={testingProviderId === p.id || !p.apiKey.trim()}
                                  onClick={() => handleTestSingleProvider(p.id)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--tw-sky-600)',
                                    background: testingProviderId === p.id ? 'var(--tw-slate-400)' : 'var(--bg-sky-50)',
                                    color: 'var(--fg-sky-700)',
                                    cursor: testingProviderId === p.id || !p.apiKey.trim() ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {testingProviderId === p.id ? '⏳ Testing...' : '⚡ Test This Model'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Provider Preset Bar */}
                    <div style={{ background: 'var(--bg-slate-50)', border: '1.5px dashed var(--bd-slate-300)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)', marginBottom: '8px' }}>
                        ➕ Add Fallback Model / Endpoint using Base URL &amp; API Key:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleAddProvider('groq')}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', background: 'var(--surface)', color: 'var(--fg-slate-800)', cursor: 'pointer' }}
                        >
                          + Groq Cloud (Llama 3.3)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddProvider('openrouter')}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', background: 'var(--surface)', color: 'var(--fg-slate-800)', cursor: 'pointer' }}
                        >
                          + OpenRouter (Free/Pro)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddProvider('gemini')}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', background: 'var(--surface)', color: 'var(--fg-slate-800)', cursor: 'pointer' }}
                        >
                          + Google Gemini
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddProvider('openai')}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', background: 'var(--surface)', color: 'var(--fg-slate-800)', cursor: 'pointer' }}
                        >
                          + OpenAI (GPT-4o)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddProvider('deepseek')}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', background: 'var(--surface)', color: 'var(--fg-slate-800)', cursor: 'pointer' }}
                        >
                          + DeepSeek AI
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddProvider()}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--tw-sky-600)', background: 'var(--bg-sky-50)', color: 'var(--fg-sky-700)', cursor: 'pointer' }}
                        >
                          + Custom Endpoint (Base URL + Key)
                        </button>
                      </div>
                    </div>

                    {/* Chain Testing and Save Status Banners */}
                    {aiTestStatus.message && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginBottom: '10px',
                          background: aiTestStatus.success ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                          color: aiTestStatus.success ? 'var(--fg-green-700)' : 'var(--fg-red-800)',
                          border: aiTestStatus.success ? '1px solid var(--bd-green-300)' : '1px solid var(--bd-red-300)'
                        }}
                      >
                        {aiTestStatus.message}
                      </div>
                    )}

                    {aiSaveStatus && (
                      <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '10px', background: 'var(--bg-green-100)', color: 'var(--fg-green-700)', border: '1px solid var(--bd-green-300)' }}>
                        {aiSaveStatus}
                      </div>
                    )}

                    {/* Master Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={aiTestStatus.loading}
                        style={{ padding: '10px 16px', background: 'var(--bg-slate-100)', border: '1.5px solid var(--bd-slate-300)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                      >
                        {aiTestStatus.loading ? 'Testing Chain...' : '🔌 Test Full Failover Chain'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAiConfig}
                        style={{ flex: 1, padding: '10px 16px', background: 'var(--tw-sky-600)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                      >
                        💾 Save All to Firebase Firestore &amp; Cloud Sync
                      </button>
                    </div>
                  </div>

                  {/* 10 Daily Balanced Multi-Exam Live Tests Section */}
                  <div style={{ background: 'var(--surface)', border: '1.5px solid var(--bd-green-300)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-green-900)' }}>
                          🔥 Daily Multi-Exam Live Tests Generator (10 Balanced Slots)
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-green-800)' }}>
                          Generates 10 exam-calibrated live tests covering UP Police, High Courts (Legal Judgment &amp; Latin Maxims), Delhi HC, SSC CGL/CHSL DEST, Paramilitary HCM, Bihar Beltron, and Railways NTPC.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-700)' }}>Target Date:</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--bd-slate-300)', fontSize: '0.875rem', fontWeight: 500 }}
                        />
                      </div>
                    </div>

                    {/* Visual Schedule of 10 Slots */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                      {DAILY_BALANCED_SLOTS.map((slot) => (
                        <div
                          key={slot.slot}
                          style={{
                            background: 'var(--bg-slate-50)',
                            border: '1px solid var(--bd-slate-200)',
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 10px',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--fg-slate-900)' }}>Slot #{slot.slot}: {slot.examTitle}</span>
                            <span
                              style={{
                                padding: '1px 5px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: slot.difficulty === 'hard' ? 'var(--bg-red-100)' : 'var(--bg-amber-100)',
                                color: slot.difficulty === 'hard' ? 'var(--fg-red-700)' : 'var(--fg-amber-800)'
                              }}
                            >
                              {slot.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ color: 'var(--fg-slate-500)', fontSize: '0.75rem' }}>
                            {slot.language === 'english' ? 'English (QWERTY)' : 'Hindi Mangal (Inscript)'} • {slot.duration} min • ~{slot.targetWords} words
                          </div>
                        </div>
                      ))}
                    </div>

                    {isGeneratingDaily && (
                      <div style={{ background: 'var(--bg-amber-100)', border: '1px solid var(--bd-amber-200)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-amber-800)', marginBottom: '6px' }}>
                          <span>Generating Daily Tests ({dailyProgress.completed} / {dailyProgress.total})</span>
                          <span>{Math.round((dailyProgress.completed / dailyProgress.total) * 100)}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-amber-200)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '6px' }}>
                          <div style={{ width: `${(dailyProgress.completed / dailyProgress.total) * 100}%`, height: '100%', background: 'var(--tw-amber-600)', transition: 'width 0.3s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--fg-amber-900)' }}>{dailyProgress.message}</div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateDaily}
                      disabled={isGeneratingDaily}
                      style={{
                        padding: '12px 20px',
                        background: isGeneratingDaily ? 'var(--tw-slate-400)' : 'var(--tw-green-800)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: isGeneratingDaily ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isGeneratingDaily ? 'Generating 10 Multi-Exam Tests in Progress...' : `⚡ Generate & Publish All 10 Exam Tests for ${selectedDate}`}
                    </button>
                  </div>

                  {/* Single Custom Passage Generator */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      ✨ Generate Custom AI Passage (Any Topic)
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                      Prompt the AI model to create an authentic 15-minute exam passage on a specific subject.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>Language & Layout:</label>
                        <select
                          value={customLanguage}
                          onChange={(e) => handleAdminLanguageChange(e.target.value as Language)}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        >
                          <option value="english">🇬🇧 English (QWERTY)</option>
                          <option value="hindi_mangal">🇮🇳 हिंदी मंगल (Mangal Inscript)</option>
                          <option value="hindi_kruti">🇮🇳 हिंदी कुर्ती देव (Kruti Dev 010)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>Difficulty Standard:</label>
                        <select
                          value={customDifficulty}
                          onChange={(e) => {
                            const diff = e.target.value as 'medium' | 'hard';
                            setCustomDifficulty(diff);
                            const meta = EXAM_CATEGORY_OPTIONS.find((opt) => opt.id === customCategory);
                            const base = customLanguage.startsWith('hindi') ? (meta?.defaultHindiWords || 430) : (meta?.defaultEnglishWords || 520);
                            setCustomTargetWords(diff === 'hard' ? base + 20 : base);
                          }}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        >
                          <option value="medium">🟡 Medium (Balanced Standard)</option>
                          <option value="hard">🔴 Hard (AR Typing Kathin: AWL ≥ 7.2)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>Target Examination Series:</label>
                        <select
                          value={customCategory}
                          onChange={(e) => handleAdminCategoryChange(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        >
                          {EXAM_CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {selectedAdminCatOption && (
                          <div
                            style={{
                              marginTop: '5px',
                              fontSize: '0.75rem',
                              lineHeight: '1.3',
                              color: 'var(--fg-sky-700)',
                              background: 'var(--bg-sky-50)',
                              border: '1px solid var(--bd-sky-200)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '4px 6px'
                            }}
                          >
                            🎯 <strong>Standard:</strong> {selectedAdminCatOption.platformNotes}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>Target Words:</label>
                        <input
                          type="number"
                          value={customTargetWords}
                          onChange={(e) => setCustomTargetWords(Number(e.target.value))}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                        Custom Subject / Topic:
                      </label>
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="e.g. Cyber Forensics in Uttar Pradesh Police or High Court Writ Jurisdiction..."
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                      />

                      {/* Topic Recommendation Chips */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', alignSelf: 'center' }}>
                          Suggested:
                        </span>
                        {adminSuggestedTopics.map((sugg) => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => setCustomTopic(sugg)}
                            style={{
                              background: 'var(--bg-slate-100)',
                              border: '1px solid var(--bd-slate-300)',
                              borderRadius: 'var(--radius-lg)',
                              padding: '2px 8px',
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

                    {customGenMessage && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          marginBottom: '12px',
                          background: customGenMessage.includes('🎉') ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                          color: customGenMessage.includes('🎉') ? 'var(--fg-green-700)' : 'var(--fg-red-800)'
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
                        background: isGeneratingCustom ? 'var(--tw-slate-400)' : 'var(--tw-sky-600)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
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
                        style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem', width: '260px' }}
                      />
                      <select
                        value={passageLangFilter}
                        onChange={(e) => setPassageLangFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
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
                          background: isFullscreen ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-slate-100)',
                          border: isFullscreen ? '1px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
                          color: isFullscreen ? 'var(--fg-sky-600)' : 'var(--fg-slate-700)',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{isFullscreen ? '🗗' : '⛶'}</span>
                        <span>{isFullscreen ? 'Exit Full Screen Studio' : 'Full Screen Studio'}</span>
                      </button>

                      <input
                        type="file"
                        ref={syncFileInputRef}
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleFileSelectedForSync}
                      />
                      <button
                        type="button"
                        onClick={() => handleSyncPaidPassages()}
                        disabled={isSyncingPaidPassages}
                        style={{
                          padding: '8px 14px',
                          background: isSyncingPaidPassages ? 'var(--tw-slate-400)' : 'var(--tw-emerald-600)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: isSyncingPaidPassages ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      >
                        <span>{isSyncingPaidPassages ? '⏳' : '☁️'}</span>
                        <span>{isSyncingPaidPassages ? 'Syncing...' : 'Sync Paid Passages to Cloud'}</span>
                      </button>

                      <button
                        onClick={() => setIsCreatingManual(!isCreatingManual)}
                        style={{
                          padding: '8px 14px',
                          background: isCreatingManual ? 'var(--tw-slate-500)' : 'var(--tw-sky-600)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isCreatingManual ? 'Cancel' : '➕ Add Manual Passage'}
                      </button>
                    </div>
                  </div>

                  {/* Cloud Sync Status Banner */}
                  {syncStatusMsg && (
                    <div style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: syncStatusMsg.startsWith('❌') ? 'var(--bg-red-50)' : syncStatusMsg.startsWith('🎉') ? 'var(--bg-green-50)' : 'var(--bg-blue-50)',
                      border: syncStatusMsg.startsWith('❌') ? '1px solid var(--tw-red-400)' : syncStatusMsg.startsWith('🎉') ? '1px solid var(--bd-green-300)' : '1px solid var(--bd-blue-300)',
                      color: syncStatusMsg.startsWith('❌') ? 'var(--fg-red-800)' : syncStatusMsg.startsWith('🎉') ? 'var(--fg-green-800)' : 'var(--fg-blue-800)',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>{syncStatusMsg}</span>
                      <button
                        onClick={() => setSyncStatusMsg(null)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Manual Creation Drawer */}
                  {isCreatingManual && (
                    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--tw-sky-600)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--fg-sky-700)' }}>
                        ➕ Create New Official Examination Passage
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)' }}>Language:</label>
                          <select
                            value={manualLanguage}
                            onChange={(e) => setManualLanguage(e.target.value as Language)}
                            style={{ width: '100%', padding: '7px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.8rem' }}
                          >
                            <option value="english">English</option>
                            <option value="hindi_mangal">Hindi Mangal</option>
                            <option value="hindi_kruti">Hindi Kruti Dev</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)' }}>Difficulty:</label>
                          <select
                            value={manualDifficulty}
                            onChange={(e) => setManualDifficulty(e.target.value as 'medium' | 'hard')}
                            style={{ width: '100%', padding: '7px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.8rem' }}
                          >
                            <option value="medium">Medium</option>
                            <option value="hard">Hard (Long Words)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)' }}>Category:</label>
                          <select
                            value={manualCategory}
                            onChange={(e) => setManualCategory(e.target.value as ExamCategory)}
                            style={{ width: '100%', padding: '7px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.8rem' }}
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
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem', fontWeight: 500 }}
                        />
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <textarea
                          rows={6}
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          placeholder="Type or paste the complete passage text here..."
                          style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', textAlign: 'right' }}>
                          Word Count: {manualText.split(/\s+/).filter(Boolean).length} words
                        </div>
                      </div>

                      <button
                        onClick={handleSaveManualPassage}
                        style={{ padding: '8px 16px', background: 'var(--tw-sky-600)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        💾 Save Passage to Database
                      </button>
                    </div>
                  )}

                  {/* Passages Table */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: 'var(--bg-slate-50)', borderBottom: '1px solid var(--bd-slate-200)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-500)' }}>
                      <span>Showing {studioPassages.length} of {passages.length} Total Passages</span>
                      <span>Target: 15-Minute Exam Hall Standard</span>
                    </div>

                    <div style={{ maxHeight: isFullscreen ? 'calc(100vh - 290px)' : '420px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-slate-100)', color: 'var(--fg-slate-600)', borderBottom: '1px solid var(--bd-slate-200)' }}>
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
                              <tr key={p.id} style={{ borderBottom: '1px solid var(--bd-slate-100)' }}>
                                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--fg-sky-600)', fontWeight: 600 }}>{p.id}</td>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--fg-slate-800)', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.title}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: p.language === 'english' ? 'var(--bg-blue-100)' : 'var(--bg-amber-100)', color: p.language === 'english' ? 'var(--fg-blue-800)' : 'var(--fg-amber-700)' }}>
                                    {p.language}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: p.difficulty === 'hard' ? 'var(--bg-red-100)' : 'var(--bg-green-50)', color: p.difficulty === 'hard' ? 'var(--fg-red-800)' : 'var(--fg-green-800)' }}>
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
                                        background: 'var(--bg-blue-50)',
                                        border: '1px solid var(--bd-blue-200)',
                                        color: 'var(--fg-blue-700)',
                                        padding: '3px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      👁️ Preview
                                    </button>
                                    {isCustom ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCustomPassage(p.id)}
                                        style={{ background: 'var(--bg-red-100)', border: '1px solid var(--bd-red-300)', color: 'var(--fg-red-800)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                      >
                                        Delete
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)' }}>Core Test</span>
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
                      style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem', width: '320px' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                      {filteredCandidates.length} Registered Accounts in Firebase
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-slate-50)', color: 'var(--fg-slate-600)', borderBottom: '1px solid var(--bd-slate-200)' }}>
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
                            <tr key={c.uid} style={{ borderBottom: '1px solid var(--bd-slate-100)' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--fg-sky-700)', fontFamily: 'monospace' }}>
                                {c.rollNumber}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                                {c.displayName || 'Candidate'}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-green-100)', color: 'var(--fg-green-700)' }}>
                                  {c.category === 'up_police_co' ? 'Computer Operator' : 'ASI Ministerial'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-md)',
                                    background: isCandAdmin ? 'var(--bg-blue-50)' : 'var(--bg-slate-100)',
                                    color: isCandAdmin ? 'var(--fg-blue-700)' : 'var(--fg-slate-500)',
                                    border: isCandAdmin ? '1px solid var(--bd-blue-200)' : '1px solid var(--bd-slate-300)'
                                  }}
                                >
                                  {isCandAdmin ? '🛡️ ADMIN' : 'CANDIDATE'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', color: 'var(--fg-slate-500)', fontSize: '0.8rem' }}>
                                {c.email || c.uid}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdminRole(c.uid, isCandAdmin)}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: isCandAdmin ? '1px solid var(--bd-red-300)' : '1px solid var(--bd-green-300)',
                                    background: isCandAdmin ? 'var(--bg-red-100)' : 'var(--bg-green-50)',
                                    color: isCandAdmin ? 'var(--fg-red-800)' : 'var(--fg-green-800)'
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
                        borderRadius: 'var(--radius-md)',
                        background: paymentFeedback.type === 'success' ? 'var(--bg-green-50)' : 'var(--bg-red-50)',
                        border: `1px solid ${paymentFeedback.type === 'success' ? 'var(--bd-green-300)' : 'var(--bd-red-200)'}`,
                        color: paymentFeedback.type === 'success' ? 'var(--fg-green-800)' : 'var(--fg-red-800)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
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
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Total Submissions
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-slate-900)', margin: '4px 0' }}>
                        {paymentsList.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>QR UPI Candidate Transactions</div>
                    </div>

                    <div
                      style={{
                        background: pendingPaymentsCount > 0 ? 'var(--bg-amber-50)' : 'var(--surface)',
                        border: pendingPaymentsCount > 0 ? '1.5px solid var(--tw-amber-500)' : '1px solid var(--bd-slate-200)',
                        borderRadius: 'var(--radius-md)',
                        padding: '18px'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: pendingPaymentsCount > 0 ? 'var(--fg-amber-700)' : 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Pending Approvals
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: pendingPaymentsCount > 0 ? 'var(--fg-amber-600)' : 'var(--fg-slate-900)', margin: '4px 0' }}>
                        {pendingPaymentsCount}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: pendingPaymentsCount > 0 ? 'var(--fg-amber-700)' : 'var(--fg-slate-500)', fontWeight: 500 }}>
                        {pendingPaymentsCount > 0 ? '🚨 Action Required: Review UTR' : 'All transactions reviewed'}
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Approved Pro Subscriptions
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-green-600)', margin: '4px 0' }}>
                        {paymentsList.filter((p) => p.status === 'approved').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-green-700)', fontWeight: 500 }}>Active Subscribed Candidates</div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Total Verified Revenue
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-sky-600)', margin: '4px 0' }}>
                        ₹{approvedPaymentsRevenue}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-sky-700)', fontWeight: 500 }}>From Approved QR Payments</div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)', textTransform: 'uppercase' }}>
                        Active Promo Codes
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--fg-violet-500)', margin: '4px 0' }}>
                        {promoCodesList.filter((p) => p.isActive).length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-violet-600)', fontWeight: 500 }}>Discount Coupons Live</div>
                    </div>
                  </div>

                  {/* Submissions Management Section */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
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
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                          💳 Candidate Payment Submissions & Approvals
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: paymentFilterStatus === st ? '2px solid var(--tw-sky-600)' : '1px solid var(--bd-slate-300)',
                              background: paymentFilterStatus === st ? 'var(--bg-sky-100)' : 'var(--surface)',
                              color: paymentFilterStatus === st ? 'var(--fg-sky-600)' : 'var(--fg-slate-600)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
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
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--bd-slate-300)',
                            background: 'var(--bg-slate-50)',
                            color: 'var(--fg-slate-700)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-slate-50)', borderBottom: '2px solid var(--bd-slate-200)', textAlign: 'left', color: 'var(--fg-slate-600)' }}>
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
                              <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--fg-slate-500)' }}>
                                <div style={{ fontSize: '2.1rem', marginBottom: '8px' }}>💳</div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No payment submissions found</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--tw-slate-400)' }}>
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
                                <tr key={sub.id} style={{ borderBottom: '1px solid var(--bd-slate-100)', background: isPending ? 'var(--bg-stone-50)' : 'transparent' }}>
                                  {/* Date & ID */}
                                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                                      {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                                      {new Date(sub.submittedAt).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', fontFamily: 'monospace' }}>
                                      #{sub.id.substring(0, 8)}
                                    </div>
                                  </td>

                                  {/* Candidate */}
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                                      {sub.userName || 'Candidate'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-sky-600)' }}>
                                      {sub.userEmail}
                                    </div>
                                    {sub.userPhone && (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                                        📞 {sub.userPhone}
                                      </div>
                                    )}
                                  </td>

                                  {/* Plan & Exam */}
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ display: 'inline-block', fontWeight: 600, color: 'var(--fg-indigo-700)', background: 'var(--bg-indigo-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', marginBottom: '2px' }}>
                                      {sub.planName}
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--fg-slate-700)', fontSize: '0.8rem' }}>
                                      {sub.selectedExamTitle || sub.examTitle || 'All 129 Exams Combo'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                                      Duration: {sub.durationMonths || 1} Month{(sub.durationMonths || 1) > 1 ? 's' : ''}
                                    </div>
                                  </td>

                                  {/* Amount */}
                                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                                      ₹{sub.finalAmount || sub.finalAmountPaid || 0}
                                    </div>
                                    {sub.discountAmount && sub.discountAmount > 0 ? (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--fg-green-600)', fontWeight: 600 }}>
                                        🎟️ {sub.promoCodeApplied || sub.promoCodeUsed} (-₹{sub.discountAmount})
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)' }}>
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
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: 'var(--fg-slate-900)',
                                        background: 'var(--bg-slate-100)',
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        border: '1px solid var(--bd-slate-300)'
                                      }}
                                      title="Click to copy UTR"
                                    >
                                      {sub.utrNumber} 📋
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '2px' }}>
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
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1.5px solid var(--tw-sky-600)',
                                            boxShadow: 'var(--shadow-sm)'
                                          }}
                                        />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-sky-600)' }}>
                                          View 🔍
                                        </span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', fontStyle: 'italic' }}>
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
                                          borderRadius: 'var(--radius-lg)',
                                          background: 'var(--bg-amber-50)',
                                          color: 'var(--fg-amber-700)',
                                          fontWeight: 600,
                                          fontSize: '0.75rem',
                                          border: '1px solid var(--bd-amber-200)',
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
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-green-50)',
                                            color: 'var(--fg-green-800)',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            border: '1px solid var(--bd-green-200)',
                                            display: 'inline-block'
                                          }}
                                        >
                                          ✅ APPROVED
                                        </span>
                                        {(sub.reviewedAt || sub.approvedAt) && (
                                          <div style={{ fontSize: '0.75rem', color: 'var(--fg-green-700)', marginTop: '2px' }}>
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
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-red-50)',
                                            color: 'var(--fg-red-800)',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            border: '1px solid var(--bd-red-200)',
                                            display: 'inline-block'
                                          }}
                                        >
                                          ❌ REJECTED
                                        </span>
                                        {sub.rejectionReason && (
                                          <div style={{ fontSize: '0.75rem', color: 'var(--fg-red-700)', marginTop: '2px', maxWidth: '120px' }}>
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
                                            background: 'var(--tw-green-600)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontWeight: 600,
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
                                            background: 'var(--tw-red-500)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '6px 10px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontWeight: 600,
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
                                          color: 'var(--fg-red-600)',
                                          border: '1px solid var(--bd-red-300)',
                                          padding: '4px 8px',
                                          borderRadius: 'var(--radius-sm)',
                                          fontWeight: 500,
                                          fontSize: '0.75rem',
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
                                          color: 'var(--fg-green-600)',
                                          border: '1px solid var(--bd-green-300)',
                                          padding: '4px 8px',
                                          borderRadius: 'var(--radius-sm)',
                                          fontWeight: 500,
                                          fontSize: '0.75rem',
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

                  {/* Quick Shortcut to Dedicated Pricing & Promos Studio */}
                  <div
                    style={{
                      background: 'var(--bg-blue-50)',
                      border: '1.5px solid var(--bd-blue-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--fg-blue-800)' }}>
                        🏷️ Dedicated Pricing Plans & Promos Studio Active
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-600)' }}>
                        Adjust subscription rates (15 Days ₹12, 1 Month ₹39, 3 Months ₹89, 6 Months ₹149, 1 Year ₹199) and manage coupons in the dedicated studio tab.
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('pricing' as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--tw-blue-600)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      Open Pricing & Promos Studio →
                    </button>
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
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                            🎟️ Live Discount Promo Codes ({promoCodesList.length})
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
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
                              borderRadius: 'var(--radius-md)',
                              background: promo.isActive ? 'var(--bg-slate-50)' : 'var(--bg-slate-100)',
                              border: '1px solid var(--bd-slate-200)',
                              opacity: promo.isActive ? 1 : 0.65
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    color: 'var(--fg-indigo-700)',
                                    background: 'var(--bg-indigo-100)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)'
                                  }}
                                >
                                  {promo.code}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: promo.discountType === 'percentage' ? 'var(--fg-emerald-700)' : 'var(--fg-sky-700)',
                                    background: promo.discountType === 'percentage' ? 'var(--bg-emerald-100)' : 'var(--bg-sky-100)',
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)'
                                  }}
                                >
                                  {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} FLAT OFF`}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-600)', marginTop: '4px' }}>
                                {promo.description} &bull; Min Order: ₹{promo.minOrderValue || promo.minOrderAmount || 0}
                                {(promo.maxDiscount || promo.maxDiscountAmount) ? ` &bull; Max: ₹${promo.maxDiscount || promo.maxDiscountAmount}` : ''}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                onClick={() => handleTogglePromoStatus(promo.code)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  background: promo.isActive ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                                  color: promo.isActive ? 'var(--fg-green-700)' : 'var(--fg-red-800)'
                                }}
                              >
                                {promo.isActive ? 'Active' : 'Disabled'}
                              </button>

                              <button
                                onClick={() => handleDeletePromoCode(promo.code)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--bd-red-200)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  background: 'var(--surface)',
                                  color: 'var(--fg-red-600)'
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
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                        ➕ Create New Promo Code
                      </h3>

                      <form onSubmit={handleCreatePromoCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              fontWeight: 600
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                              Discount Type:
                            </label>
                            <select
                              value={newPromoType}
                              onChange={(e) => setNewPromoType(e.target.value as any)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem'
                              }}
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="flat">Flat Rupee (₹)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>

                          {newPromoType === 'percentage' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--bd-slate-300)',
                                  fontSize: '0.875rem'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          style={{
                            padding: '10px 16px',
                            background: 'var(--tw-sky-600)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
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
                  <div style={{ background: 'var(--surface)', border: '1.5px solid var(--tw-sky-400)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, #2aabee 0%, #229ed9 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            boxShadow: 'var(--shadow-md)'
                          }}
                        >
                          ✈️
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                            🤖 Telegram Admin Bot & 1-Click Instant Approvals
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                            Forward payment receipts, screenshots & UTRs straight to your Telegram phone with instant <b>[✅ Approve Pro Access]</b> buttons.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
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
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '16px',
                          background: telegramStatus.success ? 'var(--bg-green-50)' : 'var(--bg-red-50)',
                          border: `1px solid ${telegramStatus.success ? 'var(--bd-green-300)' : 'var(--bd-red-200)'}`,
                          color: telegramStatus.success ? 'var(--fg-green-800)' : 'var(--fg-red-800)',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      >
                        {telegramStatus.message}
                      </div>
                    )}

                    <form onSubmit={handleSaveTelegramConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {/* Bot Token */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowTelegramToken(!showTelegramToken)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                background: 'var(--bg-slate-50)',
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
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {/* Approval Secret Token */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setTelegramConfig({ ...telegramConfig, approvalSecretToken: 'adm_' + Math.random().toString(36).substring(2, 12) })}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                background: 'var(--bg-slate-50)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                              title="Generate new secret token"
                            >
                              🎲 New
                            </button>
                          </div>
                        </div>

                        {/* Community Broadcast Channel URL */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>

                        {/* Discussion Group URL */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                            👥 Telegram Aspirants Discussion Group:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. https://t.me/+Lw-tPbRqOOc2ZTA1"
                            value={telegramConfig.discussionGroupUrl || ''}
                            onChange={(e) => setTelegramConfig({ ...telegramConfig, discussionGroupUrl: e.target.value.trim() })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>

                        {/* Support Username */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="submit"
                          style={{
                            padding: '9px 18px',
                            background: 'var(--tw-sky-600)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
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
                            background: 'var(--bg-green-50)',
                            color: 'var(--fg-green-800)',
                            border: '1.5px solid var(--bd-green-300)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
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
                    <div style={{ marginTop: '16px', background: 'var(--bg-slate-50)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--fg-slate-900)', marginBottom: '6px' }}>
                        📋 1-Minute Setup Guide for Telegram Alerts:
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--fg-slate-600)', lineHeight: 1.6 }}>
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
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-lg)',
                      maxWidth: '520px',
                      width: '100%',
                      maxHeight: '90vh',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        padding: '16px 20px',
                        background: 'var(--tw-slate-900)',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        🧾 Payment Receipt Proof
                      </div>
                      <button
                        onClick={() => setSelectedScreenshotUrl(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '1.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ padding: '16px', flex: 1, overflowY: 'auto', textAlign: 'center', background: 'var(--bg-slate-50)' }}>
                      <img
                        src={selectedScreenshotUrl}
                        alt="Candidate payment screenshot"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '65vh',
                          objectFit: 'contain',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--bd-slate-300)'
                        }}
                      />
                    </div>

                    <div
                      style={{
                        padding: '14px 20px',
                        background: 'var(--surface)',
                        borderTop: '1px solid var(--bd-slate-200)',
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
                          color: 'var(--fg-sky-600)',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        Open Original in New Tab ↗
                      </a>

                      <button
                        onClick={() => setSelectedScreenshotUrl(null)}
                        style={{
                          padding: '8px 18px',
                          background: 'var(--tw-slate-900)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 600,
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
                  TAB: PRICING & PROMOTIONS STUDIO
                  -------------------------------------------------- */}
              {activeTab === 'pricing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Studio Header & Action Bar */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, var(--tw-slate-900) 0%, var(--tw-slate-800) 100%)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px',
                      color: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--tw-amber-500)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.6rem',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      >
                        🏷️
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--tw-sky-400)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                          COMMERCIAL CONTROL CENTER
                        </div>
                        <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                          Pricing Plans & Promo Codes Studio
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--tw-slate-400)' }}>
                          Live control over candidate subscription tiers, promotional banners, and discount coupon campaigns.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleResetPricingPlans}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'var(--tw-slate-200)',
                          padding: '9px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Reset Factory Defaults
                      </button>
                      <button
                        onClick={handleSavePricingPlans}
                        style={{
                          background: 'var(--tw-emerald-500)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '9px 20px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      >
                        💾 Save All Pricing Changes
                      </button>
                    </div>
                  </div>

                  {/* Success / Feedback Banner */}
                  {pricingSaveMessage && (
                    <div
                      style={{
                        background: 'var(--bg-green-100)',
                        border: '1.5px solid var(--bd-green-300)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 18px',
                        color: 'var(--fg-green-700)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>✅</span>
                      <span>{pricingSaveMessage}</span>
                    </div>
                  )}

                  {/* Section 1: Live Pricing Plans (5 Tiers) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg-slate-900)' }}>
                          🎯 5-Tier Subscription Ladder ({pricingPlansList.length} Active Plans)
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                          Changes made here directly update the candidate checkout modal and welcome banner across the platform.
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                        gap: '16px'
                      }}
                    >
                      {pricingPlansList.map((plan, idx) => {
                        const discountPct = plan.originalPrice > plan.discountedPrice
                          ? Math.round(((plan.originalPrice - plan.discountedPrice) / plan.originalPrice) * 100)
                          : 0;
                        return (
                          <div
                            key={plan.id}
                            style={{
                              background: 'var(--surface)',
                              border: plan.isExclusiveOffer
                                ? '2px solid var(--tw-amber-500)'
                                : plan.isPopular
                                ? '2px solid var(--tw-sky-600)'
                                : plan.isBestValue
                                ? '2px solid var(--tw-violet-500)'
                                : '1px solid var(--bd-slate-200)',
                              borderRadius: 'var(--radius-md)',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              boxShadow: plan.isPopular || plan.isExclusiveOffer ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                              position: 'relative'
                            }}
                          >
                            {/* Card Header & Badges */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    color: 'var(--fg-slate-500)',
                                    background: 'var(--bg-slate-100)',
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: 600
                                  }}
                                >
                                  ID: {plan.id}
                                </span>
                                <div style={{ marginTop: '6px' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)' }}>Plan Tier Name:</label>
                                  <input
                                    type="text"
                                    value={plan.name}
                                    onChange={(e) => handleUpdatePlan(idx, 'name', e.target.value)}
                                    style={{
                                      width: '100%',
                                      fontWeight: 600,
                                      fontSize: '1rem',
                                      color: 'var(--fg-slate-900)',
                                      border: '1px solid var(--bd-slate-300)',
                                      borderRadius: 'var(--radius-sm)',
                                      padding: '4px 8px',
                                      marginTop: '2px'
                                    }}
                                  />
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: 'var(--radius-md)',
                                    background: plan.type === 'all_exams_pass' ? 'var(--bg-blue-100)' : 'var(--bg-amber-100)',
                                    color: plan.type === 'all_exams_pass' ? 'var(--fg-blue-800)' : 'var(--fg-amber-800)',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {plan.type === 'all_exams_pass' ? 'All 129 Exams' : 'Single Exam'}
                                </span>
                                {discountPct > 0 && (
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-green-600)', marginTop: '4px' }}>
                                    {discountPct}% OFF
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Badge Label Input */}
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)' }}>Badge Tagline:</label>
                              <input
                                type="text"
                                value={plan.badge || ''}
                                onChange={(e) => handleUpdatePlan(idx, 'badge', e.target.value)}
                                placeholder="e.g. Welcome Offer, Flexible plan, Popular choice"
                                style={{
                                  width: '100%',
                                  fontSize: '0.8rem',
                                  border: '1px solid var(--bd-slate-300)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '4px 8px',
                                  marginTop: '2px'
                                }}
                              />
                            </div>

                            {/* Price Row: Discounted (Payable) & Original */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ background: 'var(--bg-green-50)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-green-200)' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-green-800)' }}>
                                  Payable Price (₹):
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={plan.discountedPrice}
                                  onChange={(e) => handleUpdatePlan(idx, 'discountedPrice', Number(e.target.value))}
                                  style={{
                                    width: '100%',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: 'var(--fg-green-700)',
                                    background: 'var(--surface)',
                                    border: '1px solid var(--bd-green-300)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 8px',
                                    marginTop: '2px'
                                  }}
                                />
                              </div>

                              <div style={{ background: 'var(--bg-slate-50)', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--bd-slate-200)' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-500)' }}>
                                  Original Price (₹):
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={plan.originalPrice}
                                  onChange={(e) => handleUpdatePlan(idx, 'originalPrice', Number(e.target.value))}
                                  style={{
                                    width: '100%',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    color: 'var(--fg-slate-500)',
                                    background: 'var(--surface)',
                                    border: '1px solid var(--bd-slate-300)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 8px',
                                    marginTop: '2px'
                                  }}
                                />
                              </div>
                            </div>

                            {/* Validity & Exam Type Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)' }}>
                                  Validity (Days):
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={plan.durationDays}
                                  onChange={(e) => handleUpdatePlan(idx, 'durationDays', Number(e.target.value))}
                                  style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    border: '1px solid var(--bd-slate-300)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 8px',
                                    marginTop: '2px'
                                  }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)' }}>
                                  Access Scope:
                                </label>
                                <select
                                  value={plan.type}
                                  onChange={(e) => handleUpdatePlan(idx, 'type', e.target.value as any)}
                                  style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    border: '1px solid var(--bd-slate-300)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '4px 6px',
                                    marginTop: '2px',
                                    background: 'var(--surface)'
                                  }}
                                >
                                  <option value="single_exam">Single Exam</option>
                                  <option value="all_exams_pass">All 129 Exams</option>
                                </select>
                              </div>
                            </div>

                            {/* Features List (Multiline) */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '2px' }}>
                                Features (1 per line):
                              </label>
                              <textarea
                                rows={3}
                                value={plan.features.join('\n')}
                                onChange={(e) => handleUpdatePlanFeatures(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  fontSize: '0.75rem',
                                  border: '1px solid var(--bd-slate-300)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '6px 8px',
                                  fontFamily: 'inherit',
                                  resize: 'vertical'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Promo Codes & Coupon Studio */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                      gap: '20px'
                    }}
                  >
                    {/* Active Promo Codes List */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                            🎟️ Live Discount Promo Codes ({promoCodesList.length})
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                            Candidates enter these codes during payment for instant discounts.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {promoCodesList.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--tw-slate-400)', fontSize: '0.875rem' }}>
                            No promo codes created yet. Use the form on the right to create your first coupon!
                          </div>
                        ) : (
                          promoCodesList.map((promo) => (
                            <div
                              key={promo.code}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                background: promo.isActive ? 'var(--bg-slate-50)' : 'var(--bg-slate-100)',
                                border: '1px solid var(--bd-slate-200)',
                                opacity: promo.isActive ? 1 : 0.65
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                      color: 'var(--fg-indigo-700)',
                                      background: 'var(--bg-indigo-100)',
                                      padding: '2px 8px',
                                      borderRadius: 'var(--radius-sm)'
                                    }}
                                  >
                                    {promo.code}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: promo.discountType === 'percentage' ? 'var(--fg-emerald-700)' : 'var(--fg-sky-700)',
                                      background: promo.discountType === 'percentage' ? 'var(--bg-emerald-100)' : 'var(--bg-sky-100)',
                                      padding: '2px 6px',
                                      borderRadius: 'var(--radius-sm)'
                                    }}
                                  >
                                    {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} FLAT OFF`}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-600)', marginTop: '4px' }}>
                                  {promo.description} &bull; Min Order: ₹{promo.minOrderValue || promo.minOrderAmount || 0}
                                  {(promo.maxDiscount || promo.maxDiscountAmount) ? ` &bull; Max: ₹${promo.maxDiscount || promo.maxDiscountAmount}` : ''}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleTogglePromoStatus(promo.code)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    background: promo.isActive ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                                    color: promo.isActive ? 'var(--fg-green-700)' : 'var(--fg-red-800)'
                                  }}
                                >
                                  {promo.isActive ? 'Active' : 'Disabled'}
                                </button>

                                <button
                                  onClick={() => handleDeletePromoCode(promo.code)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--bd-red-200)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    background: 'var(--surface)',
                                    color: 'var(--fg-red-600)'
                                  }}
                                  title="Delete promo code"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Create New Promo Code Form */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                        ➕ Create New Promo Code
                      </h3>

                      <form onSubmit={handleCreatePromoCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem',
                              fontFamily: 'monospace',
                              fontWeight: 600
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                              Discount Type:
                            </label>
                            <select
                              value={newPromoType}
                              onChange={(e) => setNewPromoType(e.target.value as any)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem'
                              }}
                            >
                              <option value="percentage">Percentage (%)</option>
                              <option value="flat">Flat Rupee (₹)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bd-slate-300)',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>

                          {newPromoType === 'percentage' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--bd-slate-300)',
                                  fontSize: '0.875rem'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
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
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--bd-slate-300)',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          style={{
                            padding: '10px 16px',
                            background: 'var(--tw-sky-600)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            marginTop: '6px'
                          }}
                        >
                          ➕ Create & Publish Promo Code
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Section 3: Fintech UPI Receiver & Merchant Configuration */}
                  <div
                    style={{
                      background: 'var(--bg-slate-50)',
                      border: '1.5px solid var(--tw-sky-400)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>🏦</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                            Fintech UPI Receiver & Merchant Configuration
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                            Configure your PhonePe / UPI VPA and Merchant Name used for 1-Click Pay deep linking and instant QR scan.
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-sky-700)', background: 'var(--bg-sky-100)', padding: '3px 10px', borderRadius: 'var(--radius-md)' }}>
                        ● ZERO GATEWAY FEE (0%)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                          Merchant UPI ID (VPA):
                        </label>
                        <input
                          type="text"
                          value={upiMerchantConfig.upiId}
                          onChange={(e) => setUpiMerchantConfig({ ...upiMerchantConfig, upiId: e.target.value.trim() })}
                          placeholder="e.g. purendarchauhan@phonepe"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid var(--bd-slate-300)',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: 'var(--fg-slate-900)'
                          }}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '3px' }}>
                          Candidate UPI apps will send funds directly to this VPA.
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                          Payee / Merchant Display Name:
                        </label>
                        <input
                          type="text"
                          value={upiMerchantConfig.merchantName}
                          onChange={(e) => setUpiMerchantConfig({ ...upiMerchantConfig, merchantName: e.target.value })}
                          placeholder="e.g. PURENDAR CHAUHAN"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid var(--bd-slate-300)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--fg-slate-900)'
                          }}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)', marginTop: '3px' }}>
                          Shown on candidates' Google Pay, PhonePe & Paytm confirmation screen.
                        </div>
                      </div>
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
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      📋 Official Exam Benchmarks
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                          Hindi Passing Speed (Net WPM):
                        </label>
                        <input
                          type="number"
                          value={examConfig.hindiPassSpeed}
                          onChange={(e) => setExamConfig({ ...examConfig, hindiPassSpeed: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                          English Passing Speed (Net WPM):
                        </label>
                        <input
                          type="number"
                          value={examConfig.englishPassSpeed}
                          onChange={(e) => setExamConfig({ ...examConfig, englishPassSpeed: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                          Minimum Qualifying Accuracy (%):
                        </label>
                        <input
                          type="number"
                          value={examConfig.minAccuracy}
                          onChange={(e) => setExamConfig({ ...examConfig, minAccuracy: Number(e.target.value) })}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        />
                      </div>

                      {configSaveStatus && (
                        <div style={{ padding: '8px', background: 'var(--bg-green-100)', color: 'var(--fg-green-700)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {configSaveStatus}
                        </div>
                      )}

                      <button
                        onClick={handleSaveExamConfig}
                        style={{ padding: '10px', background: 'var(--tw-sky-600)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginTop: '6px' }}
                      >
                        💾 Update Examination Benchmarks
                      </button>
                    </div>
                  </div>

                  {/* Change Master PIN */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--bd-slate-200)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--fg-slate-900)' }}>
                      🔐 Security & Master PIN
                    </h3>
                    <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--fg-slate-500)' }}>
                      Update the backup authorization passphrase used to verify admin actions.
                    </p>

                    <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                          Current Active PIN:
                        </label>
                        <input
                          type="text"
                          disabled
                          value={getAdminPin()}
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-200)', background: 'var(--bg-slate-100)', fontSize: '0.875rem', color: 'var(--fg-slate-500)' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-slate-600)', marginBottom: '4px' }}>
                          New Master PIN / Passphrase:
                        </label>
                        <input
                          type="password"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          placeholder="Enter at least 4 characters..."
                          style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bd-slate-300)', fontSize: '0.875rem' }}
                        />
                      </div>

                      {pinChangeStatus && (
                        <div
                          style={{
                            padding: '8px',
                            background: pinChangeStatus.includes('✅') ? 'var(--bg-green-100)' : 'var(--bg-red-100)',
                            color: pinChangeStatus.includes('✅') ? 'var(--fg-green-700)' : 'var(--fg-red-800)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          {pinChangeStatus}
                        </div>
                      )}

                      <button
                        type="submit"
                        style={{ padding: '10px', background: 'var(--tw-slate-900)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
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
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '750px',
                width: '100%',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                border: '1px solid var(--tw-slate-700)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, var(--tw-gray-950) 0%, var(--tw-slate-900) 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>{previewPassage.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tw-slate-400)', display: 'flex', gap: '8px', marginTop: '4px' }}>
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

              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  fontSize: '1rem',
                  lineHeight: '1.8',
                  color: 'var(--fg-slate-800)',
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
                  background: 'var(--bg-slate-50)',
                  borderTop: '1px solid var(--bd-slate-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--fg-slate-500)' }}>
                  Target Speed: {previewPassage.language === 'english' ? '30 WPM (85% Accuracy)' : '25 WPM (85% Accuracy)'}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPassage(null)}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--tw-sky-600)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
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
      </div>
    </div>
  );
};
