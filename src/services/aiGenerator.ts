/**
 * AI Live Test Generator Service
 * Generates official examination passages calibrated to AR Typing standards.
 * Supports OpenAI-compatible endpoints (Google Gemini, OpenAI, Groq, OpenRouter, Local LLMs).
 * Generates 8 Daily Live Tests (4 English [2 Med, 2 Hard] + 4 Hindi [2 Med, 2 Hard]).
 * Features Cloud Firestore synchronization and local offline caching.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Passage, Language, ExamCategory } from '../types';
import { saveCustomPassage } from './adminService';

export interface AiProviderConfig {
  id: string;
  name: string;
  providerPreset?: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  priority: number; // 1 = highest priority (tried first)
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  autoDaily: boolean;
  providers?: AiProviderConfig[]; // Multi-provider failover list configured by admin
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  apiKey: '',
  model: 'gemini-2.0-flash',
  autoDaily: true,
  providers: [
    {
      id: 'prov_gemini',
      name: 'Google Gemini 2.0 Flash (Primary)',
      providerPreset: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: '',
      model: 'gemini-2.0-flash',
      enabled: true,
      priority: 1
    },
    {
      id: 'prov_groq',
      name: 'Groq Cloud Llama 3.3 (Fallback 1)',
      providerPreset: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: '',
      model: 'llama-3.1-8b-instant',
      enabled: false,
      priority: 2
    },
    {
      id: 'prov_openrouter',
      name: 'OpenRouter Free Models (Fallback 2)',
      providerPreset: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      model: 'google/gemini-2.0-flash-exp:free',
      enabled: false,
      priority: 3
    }
  ]
};

export interface DetectedModel {
  id: string;
  name: string;
  isFree: boolean;
  contextLength?: number;
  isReplying?: boolean;
  replyStatus?: 'replying' | 'failed' | 'testing' | 'untested';
}

export interface AiProviderPreset {
  id: string;
  name: string;
  badge: string;
  baseUrl: string;
  defaultModel: string;
  model?: string;
  info: string;
  popularModels: { id: string; name: string; isFree?: boolean }[];
}

export const AI_PRESETS: AiProviderPreset[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: '👑 Official Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.0-flash',
    model: 'gemini-2.0-flash',
    info: 'Native Google AI. High quality for Hindi Devanagari & English passages.',
    popularModels: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended)', isFree: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)', isFree: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (High Reasoning)', isFree: false }
    ]
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: '⚡ Ultra-Fast & Free Tier',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    model: 'llama-3.1-8b-instant',
    info: 'Ultra-fast inference (500+ tok/s) with generous free tier for Llama 3.1 & 3.3.',
    popularModels: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Active & Fast)', isFree: true },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B (High Reasoning)', isFree: true },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', isFree: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32K context)', isFree: true },
      { id: 'gemma2-9b-it', name: 'Google Gemma 2 9B IT', isFree: true }
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '🎁 200+ Models (Free & Paid)',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-exp:free',
    model: 'google/gemini-2.0-flash-exp:free',
    info: 'Unified access across 200+ AI models. Includes dozens of 100% free models.',
    popularModels: [
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash Exp (Free)', isFree: true },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B Instruct (Free)', isFree: true },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 Reasoning (Free)', isFree: true },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', isFree: true },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B Instruct (Free)', isFree: true },
      { id: 'google/gemini-2.0-flash', name: 'Google Gemini 2.0 Flash', isFree: false },
      { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini', isFree: false }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    badge: '🧠 High Precision Low Cost',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    model: 'deepseek-chat',
    info: 'High quality language reasoning and affordable pricing.',
    popularModels: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', isFree: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', isFree: false }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI ChatGPT',
    badge: '⭐ Industry Benchmark',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    model: 'gpt-4o-mini',
    info: 'Official OpenAI GPT-4o-mini and GPT-4o models.',
    popularModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)', isFree: false },
      { id: 'gpt-4o', name: 'GPT-4o (Flagship)', isFree: false }
    ]
  },
  {
    id: 'cerebras',
    name: 'Cerebras Cloud',
    badge: '🚀 1800+ Tokens/Sec',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama3.3-70b',
    model: 'llama3.3-70b',
    info: 'Extreme speed inference hardware.',
    popularModels: [
      { id: 'llama3.3-70b', name: 'Llama 3.3 70B (Fast)', isFree: true },
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B (Instant)', isFree: true }
    ]
  },
  {
    id: 'together',
    name: 'Together AI',
    badge: '🌐 Open-Source Hub',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    info: 'Popular host for open-source AI models.',
    popularModels: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', isFree: true },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', isFree: true }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    badge: '🇪🇺 European Leader',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    model: 'mistral-small-latest',
    info: 'High quality European open weights and API models.',
    popularModels: [
      { id: 'mistral-small-latest', name: 'Mistral Small (Latest)', isFree: true },
      { id: 'codestral-latest', name: 'Codestral (Latest)', isFree: false }
    ]
  },
  {
    id: 'local',
    name: 'Ollama / LocalAI',
    badge: '💻 100% Offline & Free',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    model: 'llama3.2',
    info: 'Run open-source models completely locally on your computer.',
    popularModels: [
      { id: 'llama3.2', name: 'Llama 3.2 (Local)', isFree: true },
      { id: 'mistral', name: 'Mistral 7B (Local)', isFree: true },
      { id: 'qwen2.5', name: 'Qwen 2.5 (Local)', isFree: true }
    ]
  }
];

const STORAGE_KEY_AI_CONFIG = 'up_ai_config';
const STORAGE_KEY_DAILY_PREFIX = 'up_daily_live_tests_';

export interface DailySlotPlan {
  slot: number;
  language: Language;
  difficulty: 'medium' | 'hard';
  category: ExamCategory;
  categoryGroup?: string;
  examTitle?: string;
  duration?: number;
  targetWords?: number;
  topic: string;
  subType: string;
}

/**
 * Balanced Daily Rotation: 10 Core Exam Slots covering:
 * - UP Police & UP Govt (Slots 1 & 2)
 * - High Courts & Judiciary: Allahabad HC & Delhi HC (Slots 3 & 4)
 * - SSC CGL / CHSL DEST (Slots 5 & 6)
 * - Defense & Paramilitary: BSF / CISF / CRPF HCM (Slots 7 & 8)
 * - Bihar Beltron & Railways RRB NTPC (Slots 9 & 10)
 */
export const DAILY_BALANCED_SLOTS: DailySlotPlan[] = [
  // 1 & 2: UP Police & UP Govt
  {
    slot: 1,
    language: 'english',
    difficulty: 'medium',
    category: 'up_police_co',
    categoryGroup: 'up_govt',
    examTitle: 'UP Police Computer Operator & ASI',
    duration: 15,
    targetWords: 540,
    subType: 'UP Police English Medium #1',
    topic: 'Digital India, E-Governance & Police Automation Data Infrastructure'
  },
  {
    slot: 2,
    language: 'hindi_mangal',
    difficulty: 'hard',
    category: 'up_police_co',
    categoryGroup: 'up_govt',
    examTitle: 'UP Police Computer Operator (दीर्घ शब्द)',
    duration: 15,
    targetWords: 430,
    subType: 'UP Police Hindi Mangal Hard #2 (दीर्घ शब्द)',
    topic: 'साइबर अपराध जांच, डिजिटल साक्ष्य प्रमाणीकरण, उत्तरदायित्व एवं पुलिस प्रशासनिक चुनौतियाँ'
  },

  // 3 & 4: Courts & Judiciary
  {
    slot: 3,
    language: 'english',
    difficulty: 'hard',
    category: 'court_ahc',
    categoryGroup: 'judiciary',
    examTitle: 'Allahabad High Court RO / ARO (Legal Judgment)',
    duration: 15,
    targetWords: 520,
    subType: 'High Court Legal English (Citations & Judgment)',
    topic: 'Constitutional Jurisprudence, High Court Writ Jurisdiction, Evidentiary Proportionality & Criminal Appellate Review'
  },
  {
    slot: 4,
    language: 'english',
    difficulty: 'medium',
    category: 'court_delhi',
    categoryGroup: 'judiciary',
    examTitle: 'Delhi High Court Junior Judicial Assistant (JJA)',
    duration: 10,
    targetWords: 380,
    subType: 'Delhi Court English Medium',
    topic: 'Civil Procedure Directives, Subordinate Registry Filings & Statutory Declarations'
  },

  // 5 & 6: SSC CGL / CHSL DEST (Alphanumeric, Shift-key, %, Numbers)
  {
    slot: 5,
    language: 'english',
    difficulty: 'hard',
    category: 'ssc_dest',
    categoryGroup: 'ssc',
    examTitle: 'SSC CGL / CHSL Data Entry Skill Test (DEST)',
    duration: 15,
    targetWords: 380,
    subType: 'SSC CGL DEO Alphanumeric (Codes, %, Figures)',
    topic: 'Union Ministry Financial Allocation, Audit Disclosures, Public Accounts & Expenditure Statistics'
  },
  {
    slot: 6,
    language: 'hindi_mangal',
    difficulty: 'medium',
    category: 'ssc_dest',
    categoryGroup: 'ssc',
    examTitle: 'SSC CHSL Hindi DEST (1500 Key Depressions)',
    duration: 10,
    targetWords: 320,
    subType: 'SSC Hindi Mangal Medium',
    topic: 'केंद्रीय सतर्कता आयोग, राजकोषीय अनुशासन, आर्थिक नीतियां एवं बजट प्रबंधन'
  },

  // 7 & 8: Defense & Paramilitary (BSF / CISF / CRPF HCM)
  {
    slot: 7,
    language: 'english',
    difficulty: 'hard',
    category: 'paramilitary_hcm',
    categoryGroup: 'defense',
    examTitle: 'BSF / CISF / CRPF Head Constable Ministerial (HCM)',
    duration: 10,
    targetWords: 370,
    subType: 'Paramilitary HCM English Hard',
    topic: 'Border Security Surveillance Protocols, Tactical Field Telecommunications & Central Armed Police Orders'
  },
  {
    slot: 8,
    language: 'hindi_mangal',
    difficulty: 'hard',
    category: 'paramilitary_hcm',
    categoryGroup: 'defense',
    examTitle: 'CRPF / SSB Head Constable Ministerial (हिंदी कठिन)',
    duration: 10,
    targetWords: 330,
    subType: 'Paramilitary HCM Hindi Hard',
    topic: 'आंतरिक सुरक्षा प्रबंधन, अग्रिम रक्षा चौकियां एवं सीमा सुरक्षा बल प्रशासनिक नियमावली'
  },

  // 9 & 10: Bihar Beltron & Railways RRB NTPC
  {
    slot: 9,
    language: 'hindi_mangal',
    difficulty: 'medium',
    category: 'bihar_beltron',
    categoryGroup: 'bihar',
    examTitle: 'Bihar Beltron DEO / BSSC Inter Level',
    duration: 10,
    targetWords: 320,
    subType: 'Bihar Beltron Hindi Mangal',
    topic: 'बिहार भूमि राजस्व अभिलेख, लोक शिकायत निवारण अधिकार एवं पंचायती राज प्रशासन'
  },
  {
    slot: 10,
    language: 'english',
    difficulty: 'medium',
    category: 'rrb_ntpc',
    categoryGroup: 'railways',
    examTitle: 'Railways RRB NTPC Senior Clerk cum Typist',
    duration: 10,
    targetWords: 330,
    subType: 'Railways NTPC English Medium',
    topic: 'Indian Railways Dedicated Freight Corridors, Telemetry Signaling & Passenger Traffic Management'
  }
];

// Backward-compatible alias for 8 slots
export const DAILY_8_SLOTS: DailySlotPlan[] = DAILY_BALANCED_SLOTS.slice(0, 8);

// Helper to sanitize base URL
export function cleanBaseUrl(url: string): string {
  let cleaned = (url || '').trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/chat/completions')) {
    cleaned = cleaned.replace('/chat/completions', '');
  }
  if (cleaned.endsWith('/models')) {
    cleaned = cleaned.replace('/models', '');
  }
  return cleaned.replace(/\/+$/, '');
}

/// Helper to get ordered list of active providers (sorted by priority 1 -> 2 -> 3...)
export function getActiveProviders(config: AiConfig): { baseUrl: string; apiKey: string; model: string; name: string }[] {
  const result: { baseUrl: string; apiKey: string; model: string; name: string }[] = [];
  const seen = new Set<string>();

  // 1. First add primary endpoint if it has an API key
  const primaryKey = (config.apiKey || '').trim();
  const primaryUrl = cleanBaseUrl(config.baseUrl);
  const primaryModel = (config.model || '').trim() || 'gemini-2.0-flash';

  if (primaryKey) {
    const sig = `${primaryUrl}|${primaryModel}|${primaryKey}`;
    seen.add(sig);
    result.push({
      baseUrl: primaryUrl,
      apiKey: primaryKey,
      model: primaryModel,
      name: `Active Primary (${primaryModel})`
    });
  }

  // 2. Add enabled providers from providers list in priority order
  if (Array.isArray(config.providers) && config.providers.length > 0) {
    const enabled = config.providers
      .filter((p) => p.enabled && p.apiKey && p.apiKey.trim())
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    for (const p of enabled) {
      const pUrl = cleanBaseUrl(p.baseUrl);
      const pKey = p.apiKey.trim();
      const pModel = (p.model || '').trim() || 'gemini-2.0-flash';
      const sig = `${pUrl}|${pModel}|${pKey}`;

      if (!seen.has(sig)) {
        seen.add(sig);
        result.push({
          baseUrl: pUrl,
          apiKey: pKey,
          model: pModel,
          name: p.name || `Fallback (${pModel})`
        });
      }
    }
  }

  return result;
}

// 1. Fetch AI Configuration (Firestore -> LocalStorage -> Default)
export async function getAiConfig(): Promise<AiConfig> {
  // Check local cache first
  let localConfig: AiConfig | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
    if (raw) {
      localConfig = JSON.parse(raw);
    }
  } catch {
    // Ignore
  }

  // Attempt Firestore fetch
  try {
    const docRef = doc(db, 'system_settings', 'ai_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const cloudData = snap.data() as Partial<AiConfig>;
      const merged: AiConfig = {
        baseUrl: cloudData.baseUrl || localConfig?.baseUrl || DEFAULT_AI_CONFIG.baseUrl,
        apiKey: cloudData.apiKey || localConfig?.apiKey || '',
        model: cloudData.model || localConfig?.model || DEFAULT_AI_CONFIG.model,
        autoDaily: typeof cloudData.autoDaily === 'boolean' ? cloudData.autoDaily : true,
        providers: Array.isArray(cloudData.providers) && cloudData.providers.length > 0
          ? cloudData.providers
          : (localConfig?.providers || DEFAULT_AI_CONFIG.providers)
      };
      localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Could not read cloud AI config, using local cache:', err);
  }

  return localConfig || DEFAULT_AI_CONFIG;
}

// 2. Save AI Configuration
export async function saveAiConfig(
  config: AiConfig,
  saveToFirestore: boolean = true
): Promise<{ success: boolean; cloudSaved: boolean; message: string; error?: string }> {
  const rootBaseUrl = cleanBaseUrl(config.baseUrl);
  const rootApiKey = (config.apiKey || '').trim();
  const rootModel = (config.model || '').trim() || 'gemini-2.0-flash';

  const providersList = Array.isArray(config.providers)
    ? [...config.providers]
    : [...(DEFAULT_AI_CONFIG.providers || [])];

  const sanitized: AiConfig = {
    baseUrl: rootBaseUrl,
    apiKey: rootApiKey,
    model: rootModel,
    autoDaily: typeof config.autoDaily === 'boolean' ? config.autoDaily : true,
    providers: providersList.map((p, idx) => ({
      id: p.id || `prov_${Date.now()}_${idx}`,
      name: p.name || `Provider #${idx + 1}`,
      providerPreset: p.providerPreset || '',
      baseUrl: cleanBaseUrl(p.baseUrl),
      apiKey: (p.apiKey || '').trim(),
      model: (p.model || '').trim() || 'gemini-2.0-flash',
      enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
      priority: typeof p.priority === 'number' ? p.priority : idx + 1
    }))
  };

  localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(sanitized));

  let cloudSaved = false;
  let cloudError: string | undefined = undefined;

  if (saveToFirestore) {
    try {
      const docRef = doc(db, 'system_settings', 'ai_config');
      await setDoc(docRef, { ...sanitized, updatedAt: new Date().toISOString() }, { merge: true });
      cloudSaved = true;
    } catch (err: any) {
      console.warn('Cloud save for AI config skipped (offline or permissions):', err);
      cloudError = err?.message || 'Permission denied or Firestore offline';
    }
  }

  const message = cloudSaved
    ? '✅ AI Configuration successfully saved directly to Firebase Firestore & Local Storage!'
    : cloudError
    ? `⚠️ Saved to Local Storage. Firebase Cloud: ${cloudError}`
    : '✅ AI Configuration saved to Local Storage!';

  return { success: true, cloudSaved, message, error: cloudError };
}

// 3. Test AI Connection (Single or Failover Chain)
export async function testAiConnection(
  config: AiConfig,
  specificProviderId?: string
): Promise<{ success: boolean; message: string; failoverResults?: { name: string; success: boolean; message: string }[] }> {
  // If a specific provider was requested
  if (specificProviderId && Array.isArray(config.providers)) {
    const target = config.providers.find((p) => p.id === specificProviderId);
    if (target) {
      return testSingleProvider(target.baseUrl, target.apiKey, target.model, target.name);
    }
  }

  const activeProviders = getActiveProviders(config);
  if (activeProviders.length === 0) {
    return { success: false, message: 'No AI providers configured with valid API keys. Please add at least one API key.' };
  }

  // Test full failover chain
  const failoverResults: { name: string; success: boolean; message: string }[] = [];
  let atLeastOneWorking = false;

  for (const prov of activeProviders) {
    const res = await testSingleProvider(prov.baseUrl, prov.apiKey, prov.model, prov.name);
    failoverResults.push({ name: prov.name, success: res.success, message: res.message });
    if (res.success) {
      atLeastOneWorking = true;
    }
  }

  const summary = failoverResults.map((r) => `${r.success ? '✅' : '❌'} ${r.name}: ${r.message}`).join(' | ');

  return {
    success: atLeastOneWorking,
    message: atLeastOneWorking ? `Failover Chain Ready: ${summary}` : `All providers failed: ${summary}`,
    failoverResults
  };
}

async function testSingleProvider(
  baseUrl: string,
  apiKey: string,
  model: string,
  name: string
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = cleanBaseUrl(baseUrl);
  const trimmedKey = apiKey.trim();
  const cleanModel = model.trim() || 'gemini-2.0-flash';

  if (!trimmedKey) {
    return { success: false, message: `${name}: API Key is missing` };
  }

  try {
    const endpoint = `${cleanUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${trimmedKey}`
    };
    if (cleanUrl.includes('openrouter')) {
      headers['HTTP-Referer'] = 'https://purendar950.github.io/Exam_Typing_Test/';
      headers['X-Title'] = 'UP Typing Exam Suite';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cleanModel,
        messages: [
          { role: 'system', content: 'You are an AI assistant.' },
          { role: 'user', content: 'Say "OK" if connected.' }
        ],
        max_tokens: 10
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, message: `HTTP ${res.status}: ${errorText.slice(0, 100)}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'OK';
    return { success: true, message: `Connected (${reply.trim().slice(0, 30)})` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

// Quick ping to check if a specific model is replying actively (no 404/auth errors)
export async function verifyModelReplying(
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<{ replying: boolean; message: string }> {
  const cleanUrl = cleanBaseUrl(baseUrl);
  const endpoint = `${cleanUrl}/chat/completions`;
  const trimmedKey = (apiKey || '').trim();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (trimmedKey) {
      headers['Authorization'] = `Bearer ${trimmedKey}`;
    }
    if (cleanUrl.includes('openrouter')) {
      headers['HTTP-Referer'] = 'https://purendar950.github.io/Typing-computer-operator-/';
      headers['X-Title'] = 'UP Typing Exam Suite';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const body = {
      model,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 2,
      temperature: 0.1
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { replying: true, message: 'Model is replying actively and ready!' };
    }
    const errText = await res.text();
    return { replying: false, message: `HTTP ${res.status}: ${errText.slice(0, 140)}` };
  } catch (err: any) {
    return { replying: false, message: err?.message || 'Connection failed' };
  }
}

// 4. Auto-detect models from provider endpoint (/models)
export async function fetchProviderModels(
  baseUrl: string,
  apiKey: string
): Promise<{ success: boolean; models: DetectedModel[]; message?: string }> {
  const cleanUrl = cleanBaseUrl(baseUrl);
  const trimmedKey = (apiKey || '').trim();

  // If baseUrl contains localhost / 127.0.0.1, it's local
  const isLocal = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1');

  // Find if preset has hardcoded fallback models
  const matchingPreset = AI_PRESETS.find(
    (p) => cleanBaseUrl(p.baseUrl) === cleanUrl || cleanUrl.includes(p.id)
  );

  const endpoint = `${cleanUrl}/models`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (trimmedKey) {
      headers['Authorization'] = `Bearer ${trimmedKey}`;
    }
    if (cleanUrl.includes('openrouter')) {
      headers['HTTP-Referer'] = 'https://purendar950.github.io/Typing-computer-operator-/';
      headers['X-Title'] = 'UP Typing Exam Suite';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      // If endpoint returns 404 or auth error, fallback to preset models if available
      if (matchingPreset && matchingPreset.popularModels.length > 0) {
        return {
          success: true,
          models: matchingPreset.popularModels.map((m) => ({
            id: m.id,
            name: m.name,
            isFree: !!m.isFree
          })),
          message: `Endpoint returned HTTP ${res.status}. Loaded ${matchingPreset.popularModels.length} standard models for ${matchingPreset.name}.`
        };
      }
      return {
        success: false,
        models: [],
        message: `HTTP ${res.status}: ${errText.slice(0, 140)}`
      };
    }

    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

    const models: DetectedModel[] = rawList.map((item: any) => {
      const id = typeof item === 'string' ? item : (item.id || item.name || '');
      const name = item.name || id;

      const isFree =
        id.endsWith(':free') ||
        id.includes(':free') ||
        (item.pricing && (item.pricing.prompt === '0' || item.pricing.prompt === 0) && (item.pricing.completion === '0' || item.pricing.completion === 0)) ||
        cleanUrl.includes('groq.com') ||
        isLocal ||
        (cleanUrl.includes('googleapis.com') && (id.includes('flash') || id.includes('flash-lite')));

      return {
        id,
        name: name !== id ? `${name} (${id})` : id,
        isFree,
        contextLength: item.context_length
      };
    }).filter((m: DetectedModel) => !!m.id);

    return {
      success: true,
      models,
      message: `Detected ${models.length} models (${models.filter((m) => m.isFree).length} free)!`
    };
  } catch (err: any) {
    if (matchingPreset && matchingPreset.popularModels.length > 0) {
      return {
        success: true,
        models: matchingPreset.popularModels.map((m) => ({
          id: m.id,
          name: m.name,
          isFree: !!m.isFree
        })),
        message: `Auto-fetch failed (${err?.message || 'Network/CORS'}). Loaded ${matchingPreset.popularModels.length} preset models for ${matchingPreset.name}.`
      };
    }
    return {
      success: false,
      models: [],
      message: `Could not fetch from ${endpoint}: ${err?.message || 'Network error'}`
    };
  }
}

/// 5. Robust AI JSON / Text Extraction Parser
export function extractPassageFromAiResponse(
  rawContent: string,
  defaultTitle: string
): { title: string; text: string } {
  let cleaned = (rawContent || '').trim();

  // Strip Markdown code fences (e.g. ```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // 1. Direct JSON parse
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj.text === 'string' && obj.text.trim()) {
      return {
        title: (obj.title || defaultTitle).trim(),
        text: obj.text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
      };
    }
  } catch {
    // Continue
  }

  // 2. Extract balanced outer { ... } block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidateJson = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const obj = JSON.parse(candidateJson);
      if (obj && typeof obj.text === 'string' && obj.text.trim()) {
        return {
          title: (obj.title || defaultTitle).trim(),
          text: obj.text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
        };
      }
    } catch {
      // Continue to field extraction
    }
  }

  // 3. Regex extraction for "title"
  let extractedTitle = defaultTitle;
  const titleMatch =
    cleaned.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) ||
    cleaned.match(/(?:title|शीर्षक)\s*[:=]\s*["']?([^"\n\r]+)["']?/i);
  if (titleMatch && titleMatch[1]) {
    extractedTitle = titleMatch[1].replace(/\\"/g, '"').trim();
  }

  // 4. Regex extraction for "text"
  let extractedText = '';
  const textMatch = cleaned.match(/"text"\s*:\s*"/i);
  if (textMatch && textMatch.index !== undefined) {
    const startIndex = textMatch.index + textMatch[0].length;
    let endIndex = cleaned.lastIndexOf('"}');
    if (endIndex === -1) {
      endIndex = cleaned.lastIndexOf('"');
    }
    if (endIndex > startIndex) {
      extractedText = cleaned.slice(startIndex, endIndex);
    } else {
      extractedText = cleaned.slice(startIndex);
    }
  }

  // 5. Fallback: if extractedText is still empty or too short, strip JSON wrapping
  if (!extractedText || extractedText.trim().length < 50) {
    extractedText = cleaned
      .replace(/\{[\s\S]*?"title"[\s\S]*?"text"\s*:\s*"?/i, '')
      .replace(/"?\s*\}\s*$/i, '')
      .replace(/^#+\s+.*$/gm, '')
      .replace(/[*_~`]/g, '')
      .trim();
  }

  // Sanitize text: replace escaped characters and multiple whitespaces
  const sanitizedText = extractedText
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: extractedTitle.replace(/[\r\n]+/g, ' ').trim() || defaultTitle,
    text: sanitizedText
  };
}

/**
 * Execute LLM call with Automatic Multi-Provider Failover.
 * Tries Provider #1 (Priority 1). If it fails (rate limit, quota, 404, 503, timeout),
 * it automatically switches to Provider #2, then Provider #3, etc.
 */
export async function executeFailoverAiCall(
  config: AiConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature: number = 0.7,
  maxTokens: number = 3500
): Promise<{ content: string; providerUsed: string; modelUsed: string }> {
  const activeProviders = getActiveProviders(config);
  if (activeProviders.length === 0) {
    throw new Error('No AI providers configured with valid API keys. Please configure an API key in AI Settings.');
  }

  const errors: string[] = [];

  for (let i = 0; i < activeProviders.length; i++) {
    const prov = activeProviders[i];
    try {
      console.log(`[AI Failover] Trying provider ${i + 1}/${activeProviders.length}: "${prov.name}" (${prov.model})...`);
      const endpoint = `${prov.baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${prov.apiKey}`
      };
      if (prov.baseUrl.includes('openrouter')) {
        headers['HTTP-Referer'] = 'https://purendar950.github.io/Exam_Typing_Test/';
        headers['X-Title'] = 'UP Typing Exam Suite';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: prov.model,
          messages,
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText.slice(0, 140)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content || !content.trim()) {
        throw new Error('Empty response from model');
      }

      console.log(`[AI Failover] ✅ Success with provider "${prov.name}"!`);
      return { content, providerUsed: prov.name, modelUsed: prov.model };
    } catch (err: any) {
      console.warn(`[AI Failover] ⚠️ Provider "${prov.name}" failed: ${err.message}. Switching to next provider in failover chain...`);
      errors.push(`${prov.name}: ${err.message}`);
    }
  }

  throw new Error(`All ${activeProviders.length} AI providers failed in failover chain: ${errors.join(' | ')}`);
}

// 6. Generate Single Passage from AI calibrated to exact exam specifications
async function generateSinglePassage(
  slot: DailySlotPlan,
  dateStr: string,
  config: AiConfig
): Promise<Passage> {
  const isHindi = slot.language.startsWith('hindi');
  const isHard = slot.difficulty === 'hard';
  const duration = slot.duration || 15;
  const targetWords = slot.targetWords || (duration === 5 ? 190 : duration === 10 ? 360 : 540);
  const catGroup = slot.categoryGroup || 'up_govt';

  let systemPrompt = '';
  let userPrompt = '';

  if (!isHindi) {
    // English
    if (catGroup === 'judiciary') {
      systemPrompt =
        'You are the Chief Examination Controller and Senior Legal Registrar preparing official typing test passages for High Court and Supreme Court typing examinations (Allahabad HC RO/ARO, Delhi HC JJA).';
      userPrompt = `Generate an official High Court competitive examination typing passage in legal English on '${slot.topic}'.
Target Word Count: Exactly ${targetWords} words (between ${targetWords - 25} and ${targetWords + 25} words for a ${duration}-minute test).
CRITICAL JUDICIARY EXAM REQUIREMENTS:
1. High Legal Jurisprudence: Include authentic statutory references and case citations (e.g. "(2022) 5 SCC 312", "Section 482 Cr.P.C.", "Article 226(2) of the Constitution", "Section 138 of the Negotiable Instruments Act").
2. Latin Maxims & Legal Terms: Use authentic Latin legal terms naturally (e.g. "prima facie", "suo motu", "res judicata", "ultra vires", "inter alia", "ratio decidendi").
3. Complex Sentence Syntax: Long, multi-clause compound sentences, paired quotation marks ("..."), semicolons, and commas to challenge typographical rhythm.
4. Average Word Length: AWL must be between 7.0 and 8.5 letters per word.
5. Format: Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown headers.
Return ONLY valid JSON:
{
  "title": "${slot.examTitle || slot.subType}",
  "text": "The complete legal passage text here..."
}`;
    } else if (catGroup === 'ssc') {
      systemPrompt =
        'You are the Staff Selection Commission (SSC) examination director preparing official Data Entry Skill Test (DEST) typing passages for SSC CGL DEO and CHSL LDC/JSA.';
      userPrompt = `Generate an official SSC DEST competitive examination typing passage in standard English on '${slot.topic}'.
Target Word Count: Exactly ${targetWords} words (between ${targetWords - 20} and ${targetWords + 20} words for a ${duration}-minute test).
CRITICAL SSC DEST REQUIREMENTS:
1. Alphanumeric & Numeric Density: Include realistic monetary amounts (e.g. "₹24,850.50", "Rs. 1,45,000/-"), percentages (e.g. "48.65%"), calendar dates ("26.11.2008", "15th August 1947"), and file references ("Ref: MoF/Exp-2024/09").
2. Uppercase Acronyms (Shift-Key Strain): High frequency of capitalized institutional abbreviations (e.g. "NITI Aayog", "CAG", "GSTN", "UIDAI", "AIIMS", "CBI", "MoF", "FY 2024-25").
3. Vocabulary & Syntax: Economic surveys, public accounts, fiscal policy, administrative audits.
4. Format: Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown bolding.
Return ONLY valid JSON:
{
  "title": "${slot.examTitle || slot.subType}",
  "text": "The complete SSC DEST passage text here..."
}`;
    } else if (catGroup === 'defense') {
      systemPrompt =
        'You are the Central Armed Police Forces (CAPF) board evaluator creating Head Constable Ministerial (HCM) typing test materials for BSF, CISF, CRPF, and SSB.';
      userPrompt = `Generate an official Paramilitary HCM competitive examination typing passage in standard English on '${slot.topic}'.
Target Word Count: Exactly ${targetWords} words (between ${targetWords - 20} and ${targetWords + 20} words for a ${duration}-minute test).
CRITICAL PARAMILITARY HCM REQUIREMENTS:
1. Subject Matter: Border security architecture, tactical surveillance telemetry, logistics supply chains, and central administrative directives.
2. Discipline & Long Words: Average Word Length >= 7.0 letters/word. Words like "telecommunications", "interoperability", "infrastructure", "counter-intelligence", "superintendence", "reconnaissance".
3. Military References: "SOP", "DG CAPF", "BSF HQ", "CCTV", "UAV", "Section 144", "Battalion".
4. Format: Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown.
Return ONLY valid JSON:
{
  "title": "${slot.examTitle || slot.subType}",
  "text": "The complete Paramilitary HCM passage text here..."
}`;
    } else {
      // UP Police & General
      systemPrompt =
        'You are the principal typing examination passage author for Uttar Pradesh Police Recruitment Board (UPPRPB) and state administrative typing examinations.';
      userPrompt = `Generate an official competitive examination typing passage in standard English for ${slot.examTitle || 'UP Police Examination'} on '${slot.topic}'.
Target Word Count: Exactly ${targetWords} words (between ${targetWords - 25} and ${targetWords + 25} words for a ${duration}-minute test).
CRITICAL EXAM REQUIREMENTS:
1. ${isHard ? 'HARD LEVEL (LONGER WORDS MANDATE): At least 45% of words must be 8-16+ letters long (AWL >= 7.2 letters/word). Use high-syllable administrative words: "institutionalization, telecommunications, constitutionalism, misappropriation, jurisprudence, accountability, interoperability, proportionality".' : 'MEDIUM LEVEL: Balanced administrative prose, fluid sentence structure, standard punctuation.'}
2. Departmental Terminology: Include official terms like "CCTNS", "UPPRPB", "FIR", "IT Act", "CrPC", "IPC", percentages, and statistics.
3. Format: Exactly 3 continuous formal paragraphs, NO bullet points, NO markdown headers.
Return ONLY valid JSON:
{
  "title": "${slot.examTitle || slot.subType}",
  "text": "The complete continuous passage text here..."
}`;
    }
  } else {
    // Hindi (Mangal Inscript)
    systemPrompt =
      'आप विभिन्न सरकारी भर्ती आयोगों (UPPRPB, उच्च न्यायालय, एसएससी, अर्धसैनिक बल) के मुख्य टंकण सामग्री नियंत्रक एवं वरिष्ठ हिंदी परीक्षा विशेषज्ञ हैं।';
    userPrompt = `दिए गए विषय पर '${slot.examTitle || 'टंकण परीक्षा'}' के लिए मानक देवनागरी यूनिकोड (मंगल इनस्क्रिप्ट) में आधिकारिक टंकण सामग्री तैयार करें।
विषय: ${slot.topic}
कठिनाई: ${isHard ? 'कठिन (HARD LEVEL - दीर्घ एवं लंबे शब्द, जटिल संयुक्ताक्षर)' : 'मध्यम (MEDIUM LEVEL - संतुलित परीक्षा मानक)'}
लक्षित शब्द संख्या: ठीक ${targetWords} शब्द (अवधि: ${duration} मिनट हेतु ${targetWords - 20} से ${targetWords + 20} शब्दों के बीच)।

अनिवार्य मानक:
1. ${isHard ? 'दीर्घ एवं लंबे शब्द (Long Words): गद्यांश में 8 से 16 अक्षर/मात्रा वाले भारी-भरकम सामासिक शब्दों की प्रचुरता हो (जैसे: संवैधानिकता, उत्तरदायित्व, कार्यप्रणाली, प्रशासनिक, दूरसंचार, न्यायाधिकरण, पुनर्गठन, विभागाध्यक्ष, अंतर-विभागीय, विशेषज्ञता, प्रतिबद्धता, आत्मनिर्भरता, प्रमाणीकरण, कार्यकुशलता, सार्वभौमिकता, परिस्थितिजन्य, सुदृढ़ीकरण)।' : 'संतुलित शब्दावली: मानक खड़ी बोली हिंदी, सामान्य प्रशासनिक व सामान्य ज्ञान शब्दावली।'}
2. कठिन संयुक्ताक्षर (Halant Conjuncts): ${isHard ? 'प्रचुर मात्रा में कठिन संयुक्त व्यंजन शामिल करें: द्ध (बुद्धि, शुद्ध), द्व (विद्वान, द्वार), द्य (उद्योग, विद्या), ष्ट (दृष्टिकोण, विशिष्ट), क्त (शक्ति, संयुक्त), ह्न (चिह्न), हृ (हृदय), त्त (उत्तरदायित्व), ट्र (ट्रैफिक, राष्ट्रीय), क्र (क्रम, प्रक्रिया), द्द (उद्देश्य)।' : 'सामान्य संयुक्त व्यंजन (प्र, त्र, ज्ञ, श्र, क्ष)।'}
3. नुक्ता एवं विराम चिह्न: नुक्ता वाले शब्द (ज़िला, फ़ैसला, क़ानून, ख़ास) जो इनस्क्रिप्ट कीबोर्ड पर ']' कुंजी से टाइप होते हैं, अल्पविराम (,), पूर्णविराम (।), और उद्धरण चिह्न।
4. प्रारूप: ठीक 3 निरंतर पैराग्राफ, कोई बुलेट नहीं, कोई नंबरिंग नहीं, कोई मार्कडाउन नहीं।
केवल शुद्ध JSON दें:
{
  "title": "${slot.examTitle || slot.subType}",
  "text": "पूर्ण गद्यांश..."
}`;
  }

  const { content } = await executeFailoverAiCall(
    config,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    0.7,
    3500
  );

  const parsed = extractPassageFromAiResponse(content, slot.examTitle || `Live Exam Test #${slot.slot} (${slot.subType})`);
  const cleanText = parsed.text;
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  return {
    id: `ar-live-${dateStr}-slot${slot.slot}`,
    title: parsed.title || slot.examTitle || `Live Exam Test #${slot.slot} (${slot.subType})`,
    language: slot.language,
    category: slot.category,
    categoryGroup: slot.categoryGroup || 'up_govt',
    duration,
    wordCount,
    difficulty: slot.difficulty,
    date: dateStr,
    text: cleanText
  };
}

// Reusable single test generator calibrated to exact exam specifications
export async function generateCustomTest(options: {
  language: Language;
  difficulty: 'medium' | 'hard';
  category: ExamCategory;
  categoryGroup?: string;
  topic: string;
  targetWords?: number;
  duration?: number;
  config: AiConfig;
}): Promise<Passage> {
  const { language, difficulty, category, categoryGroup, topic, targetWords, duration, config } = options;
  const isHindi = language.startsWith('hindi');
  const isHard = difficulty === 'hard';
  const dur = duration || 15;
  const wordCountTarget = targetWords || (dur === 5 ? 190 : dur === 10 ? 360 : isHard ? 550 : 520);

  let systemPrompt = '';
  let userPrompt = '';

  if (!isHindi) {
    systemPrompt =
      'You are the principal typing examination evaluator and passage author for official competitive examinations across India.';
    userPrompt = `Generate an official competitive typing examination passage in standard English on '${topic}'.
Category: ${categoryGroup || category}
Target Word Count: Exactly ${wordCountTarget} words (between ${wordCountTarget - 20} and ${wordCountTarget + 20} words for a ${dur}-minute test).
${isHard ? 'CRUCIAL HARD CRITERIA: High Average Word Length (AWL >= 7.2 letters/word). High concentration of 8-16 letter words: telecommunications, institutionalization, counter-intelligence, misappropriation, constitutionalism, jurisprudence, proportionality, interoperability, infrastructure, accountability, administration.' : 'MEDIUM CRITERIA: Balanced editorial and administrative prose.'}
Continuous 3 paragraphs, standard punctuation, no bullet points, no markdown.
Return ONLY valid JSON:
{
  "title": "Official Title: ${topic}",
  "text": "Full continuous passage text here..."
}`;
  } else {
    systemPrompt =
      'आप भारत के विभिन्न सरकारी भर्ती आयोगों के लिए आधिकारिक टंकण परीक्षा गद्यांश निर्माता हैं।';
    userPrompt = `दिए गए विषय '${topic}' पर आधिकारिक टंकण परीक्षा के लिए 15-मिनट की टंकण सामग्री तैयार करें।
कठिनाई: ${isHard ? 'कठिन (HARD LEVEL - दीर्घ एवं लंबे शब्द, कठिन संयुक्ताक्षर)' : 'मध्यम (MEDIUM LEVEL)'}
लक्षित शब्द संख्या: ठीक ${wordCountTarget} शब्द (${dur} मिनट हेतु)।
${isHard ? 'दीर्घ एवं लंबे शब्द (संवैधानिकता, उत्तरदायित्व, कार्यप्रणाली, प्रशासनिक, दूरसंचार, न्यायाधिकरण), कठिन संयुक्ताक्षर (द्ध, द्व, द्य, ष्ट, क्त, ह्न, हृ, त्त, ट्र, क्र), नुक्ता शब्द (फ़, ज़)।' : 'मानक खड़ी बोली हिंदी, सामान्य प्रशासनिक शब्दावली।'}
3 निरंतर पैराग्राफ, कोई बुलेट नहीं, केवल शुद्ध JSON दें:
{
  "title": "आधिकारिक शीर्षक: ${topic}",
  "text": "पूर्ण गद्यांश..."
}`;
  }

  const { content } = await executeFailoverAiCall(
    config,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    0.7,
    3500
  );

  const parsed = extractPassageFromAiResponse(content, `Custom AI Test: ${topic}`);
  const cleanText = parsed.text;
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const todayStr = new Date().toISOString().split('T')[0];

  const newPassage: Passage = {
    id: `custom-ai-${Date.now()}`,
    title: parsed.title || `Custom AI Test: ${topic}`,
    language,
    category,
    categoryGroup: categoryGroup || 'up_govt',
    duration: dur,
    wordCount,
    difficulty,
    date: todayStr,
    text: cleanText
  };

  await saveCustomPassage(newPassage);
  return newPassage;
}

// 5. Generate All Daily Live Tests (10 Balanced Slots)
export async function generateAll8DailyLiveTests(
  dateStr: string,
  config: AiConfig,
  onProgress?: (completed: number, total: number, currentSlotTitle: string) => void,
  slotsToUse: DailySlotPlan[] = DAILY_BALANCED_SLOTS
): Promise<Passage[]> {
  const results: Passage[] = [];
  const total = slotsToUse.length;

  for (let i = 0; i < total; i++) {
    const slot = slotsToUse[i];
    if (onProgress) {
      onProgress(i, total, `Generating #${slot.slot}: ${slot.examTitle || slot.subType}...`);
    }

    try {
      const passage = await generateSinglePassage(slot, dateStr, config);
      results.push(passage);
    } catch (err) {
      console.error(`Failed to generate slot ${slot.slot}:`, err);
      throw err;
    }
  }

  if (onProgress) {
    onProgress(total, total, `Completed all ${total} Daily Live Tests!`);
  }

  // Save to localStorage and Firestore
  await saveDailyLivePassages(dateStr, results);
  return results;
}

// 6. Save Daily Live Passages
export async function saveDailyLivePassages(dateStr: string, passages: Passage[]): Promise<void> {
  try {
    localStorage.setItem(`${STORAGE_KEY_DAILY_PREFIX}${dateStr}`, JSON.stringify(passages));
  } catch {
    // Ignore storage quota
  }

  try {
    const docRef = doc(db, 'daily_live_tests', dateStr);
    await setDoc(
      docRef,
      {
        date: dateStr,
        generatedAt: new Date().toISOString(),
        testsCount: passages.length,
        tests: passages
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not save daily live tests to cloud Firestore (offline or permissions):', err);
  }
}

// 7. Fetch Daily Live Passages (Cache -> Cloud -> Fallback)
export async function fetchDailyLivePassages(
  dateStr: string,
  existingPassagesBank: Passage[] = []
): Promise<Passage[]> {
  // 1. Check local cache
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY_DAILY_PREFIX}${dateStr}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= 8) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  // 2. Check cloud Firestore
  try {
    const docRef = doc(db, 'daily_live_tests', dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.tests) && data.tests.length >= 8) {
        localStorage.setItem(`${STORAGE_KEY_DAILY_PREFIX}${dateStr}`, JSON.stringify(data.tests));
        return data.tests as Passage[];
      }
    }
  } catch (err) {
    console.warn('Could not reach Firestore for daily tests:', err);
  }

  // 3. Fallback to curated seeded tests from existing AR Typing bank
  return getFallbackDailyPassages(dateStr, existingPassagesBank);
}

// 8. Deterministic Fallback Generator
// Picks 8 authentic AR Typing tests (2 EN Med, 2 EN Hard, 2 HI Med, 2 HI Hard) seeded by date
export function getFallbackDailyPassages(dateStr: string, bank: Passage[]): Passage[] {
  if (!bank || bank.length === 0) return [];

  // Numerical hash from date string (e.g. "2026-11-03" -> int)
  const hash = dateStr.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000, 7);

  const enMediumPool = bank.filter((p) => p.language === 'english' && p.difficulty === 'medium');
  const enHardPool = bank.filter((p) => p.language === 'english' && p.difficulty === 'hard');
  const hiMediumPool = bank.filter((p) => p.language.startsWith('hindi') && p.difficulty === 'medium');
  const hiHardPool = bank.filter((p) => p.language.startsWith('hindi') && p.difficulty === 'hard');

  const pick = (pool: Passage[], offset: number, fallbackPool: Passage[]): Passage => {
    const source = pool.length > 0 ? pool : fallbackPool;
    if (source.length === 0) return bank[0];
    const idx = (hash + offset) % source.length;
    return source[idx];
  };

  const selected: Passage[] = [
    // 1 & 2: English Medium
    {
      ...pick(enMediumPool, 1, bank),
      id: `ar-live-${dateStr}-slot1`,
      title: `🔥 Daily Live #1: ${pick(enMediumPool, 1, bank).title}`,
      date: dateStr
    },
    {
      ...pick(enMediumPool, 5, bank),
      id: `ar-live-${dateStr}-slot2`,
      title: `🔥 Daily Live #2: ${pick(enMediumPool, 5, bank).title}`,
      date: dateStr
    },
    // 3 & 4: English Hard
    {
      ...pick(enHardPool, 11, bank),
      id: `ar-live-${dateStr}-slot3`,
      title: `🔥 Daily Live #3: ${pick(enHardPool, 11, bank).title}`,
      date: dateStr
    },
    {
      ...pick(enHardPool, 17, bank),
      id: `ar-live-${dateStr}-slot4`,
      title: `🔥 Daily Live #4: ${pick(enHardPool, 17, bank).title}`,
      date: dateStr
    },
    // 5 & 6: Hindi Medium
    {
      ...pick(hiMediumPool, 23, bank),
      id: `ar-live-${dateStr}-slot5`,
      title: `🔥 दैनिक लाइव #5: ${pick(hiMediumPool, 23, bank).title}`,
      date: dateStr
    },
    {
      ...pick(hiMediumPool, 29, bank),
      id: `ar-live-${dateStr}-slot6`,
      title: `🔥 दैनिक लाइव #6: ${pick(hiMediumPool, 29, bank).title}`,
      date: dateStr
    },
    // 7 & 8: Hindi Hard
    {
      ...pick(hiHardPool, 37, bank),
      id: `ar-live-${dateStr}-slot7`,
      title: `🔥 दैनिक लाइव #7: ${pick(hiHardPool, 37, bank).title}`,
      date: dateStr
    },
    {
      ...pick(hiHardPool, 43, bank),
      id: `ar-live-${dateStr}-slot8`,
      title: `🔥 दैनिक लाइव #8: ${pick(hiHardPool, 43, bank).title}`,
      date: dateStr
    }
  ];

  return selected;
}

// 9. Automatic Daily Live Generation Background Trigger
export async function triggerAutoDailyGenerationIfDue(
  dateStr: string,
  onGenerated?: (passages: Passage[]) => void
): Promise<void> {
  // Check if today already has AI tests in localStorage
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY_DAILY_PREFIX}${dateStr}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= 8) {
        const hasAiLive = parsed.some((p: Passage) => p.id.startsWith(`ar-live-${dateStr}-slot`));
        if (hasAiLive) {
          return;
        }
      }
    }
  } catch {
    // Continue
  }

  const config = await getAiConfig();
  if (!config.apiKey || !config.autoDaily) {
    return;
  }

  console.log('🤖 Auto-Daily: Automatically generating 8 Live Tests for', dateStr);
  try {
    const tests = await generateAll8DailyLiveTests(dateStr, config);
    if (onGenerated && tests && tests.length >= 8) {
      onGenerated(tests);
    }
  } catch (err) {
    console.warn('Auto-daily generation skipped or failed:', err);
  }
}
