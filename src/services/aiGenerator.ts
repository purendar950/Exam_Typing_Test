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

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  autoDaily: boolean;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  apiKey: '',
  model: 'gemini-2.5-flash',
  autoDaily: true
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
      { id: 'google/gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', isFree: false },
      { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o Mini', isFree: false }
    ]
  },
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
  topic: string;
  subType: string;
}

export const DAILY_8_SLOTS: DailySlotPlan[] = [
  {
    slot: 1,
    language: 'english',
    difficulty: 'medium',
    category: 'up_police_co',
    subType: 'English Medium #1',
    topic: 'Digital India, E-Governance & Public Service Delivery Systems'
  },
  {
    slot: 2,
    language: 'english',
    difficulty: 'medium',
    category: 'up_police_co',
    subType: 'English Medium #2',
    topic: 'India Space Programme, ISRO Milestones & Advanced Telecommunications'
  },
  {
    slot: 3,
    language: 'english',
    difficulty: 'hard',
    category: 'up_police_co',
    subType: 'English Hard #1 (Long Words)',
    topic: 'Cyber Security Operations, Ransomware Threat Intelligence, Infrastructure Vulnerabilities & Police Digital Forensics'
  },
  {
    slot: 4,
    language: 'english',
    difficulty: 'hard',
    category: 'up_police_asi',
    subType: 'English Hard #2 (Long Words)',
    topic: 'Indian Judicial Administration, High Court Procedural Jurisprudence, Constitutionalism & Official Evidence Laws'
  },
  {
    slot: 5,
    language: 'hindi_mangal',
    difficulty: 'medium',
    category: 'up_police_co',
    subType: 'Hindi Mangal Medium #1',
    topic: 'भारतीय संस्कृति, राष्ट्रीय विरासत एवं सामाजिक समरसता'
  },
  {
    slot: 6,
    language: 'hindi_mangal',
    difficulty: 'medium',
    category: 'up_police_asi',
    subType: 'Hindi Mangal Medium #2',
    topic: 'पर्यावरण संरक्षण, नवीकरणीय ऊर्जा एवं सतत विकास'
  },
  {
    slot: 7,
    language: 'hindi_mangal',
    difficulty: 'hard',
    category: 'up_police_co',
    subType: 'Hindi Mangal Hard #1 (दीर्घ शब्द)',
    topic: 'साइबर अपराध जांच, डिजिटल साक्ष्य प्रमाणीकरण, उत्तरदायित्व एवं पुलिस प्रशासनिक चुनौतियाँ'
  },
  {
    slot: 8,
    language: 'hindi_mangal',
    difficulty: 'hard',
    category: 'up_police_asi',
    subType: 'Hindi Mangal Hard #2 (दीर्घ शब्द)',
    topic: 'शासकीय राजभाषा परिपत्र, अंतर-विभागीय अधिसूचनाएं एवं संवैधानिक विधिक व्यवस्था'
  }
];

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
        autoDaily: typeof cloudData.autoDaily === 'boolean' ? cloudData.autoDaily : true
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
export async function saveAiConfig(config: AiConfig, saveToFirestore: boolean = true): Promise<void> {
  const sanitized: AiConfig = {
    baseUrl: cleanBaseUrl(config.baseUrl),
    apiKey: config.apiKey.trim(),
    model: config.model.trim() || 'gemini-2.5-flash',
    autoDaily: !!config.autoDaily
  };

  localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(sanitized));

  if (saveToFirestore) {
    try {
      const docRef = doc(db, 'system_settings', 'ai_config');
      await setDoc(docRef, { ...sanitized, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Cloud save for AI config skipped (offline or permissions):', err);
    }
  }
}

// 3. Test AI Connection
export async function testAiConnection(config: AiConfig): Promise<{ success: boolean; message: string }> {
  const baseUrl = cleanBaseUrl(config.baseUrl);
  const apiKey = config.apiKey.trim();
  const model = config.model.trim() || 'gemini-2.5-flash';

  if (!apiKey) {
    return { success: false, message: 'API Key is missing. Please provide a valid API key.' };
  }

  try {
    const endpoint = `${baseUrl}/chat/completions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an AI assistant.' },
          { role: 'user', content: 'Say "OK" if connected.' }
        ],
        max_tokens: 10
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, message: `API Error (${res.status}): ${errorText.slice(0, 150)}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'OK';
    return { success: true, message: `Connected successfully! Response: "${reply.trim()}"` };
  } catch (err: any) {
    return { success: false, message: `Network error: ${err?.message || 'Unable to reach endpoint'}` };
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

// 6. Generate Single Passage from AI calibrated to AR Typing Standards
async function generateSinglePassage(
  slot: DailySlotPlan,
  dateStr: string,
  config: AiConfig
): Promise<Passage> {
  const baseUrl = cleanBaseUrl(config.baseUrl);
  const apiKey = config.apiKey.trim();
  const model = config.model.trim() || 'gemini-2.5-flash';

  const isHindi = slot.language.startsWith('hindi');
  const isHard = slot.difficulty === 'hard';

  let systemPrompt = '';
  let userPrompt = '';

  if (!isHindi) {
    // English
    systemPrompt =
      'You are the principal typing examination evaluator and passage creator for Uttar Pradesh Police Recruitment Board (UPPRPB) and AR Typing portal.';
    if (isHard) {
      userPrompt = `Generate an official competitive examination typing passage in standard English strictly conforming to the AR Typing HARD level standard for UP Police Computer Operator Grade-A and ASI examinations.
Topic: ${slot.topic}
Difficulty: HARD (Official UP Police Examination Standard - LONGER WORDS MANDATE)

CRUCIAL REQUIREMENT — "HARD" IN TYPING EXAMS MEANS MUCH LONGER WORDS:
The defining characteristic of HARD difficulty is a high concentration of LONGER, MULTI-SYLLABIC WORDS (8 to 16+ letters each) and a high Average Word Length (AWL >= 7.0 characters per word). Long words require far more finger travel, sustained memory, shift key usage, and dramatically increase typing difficulty.

Detailed Requirements:
1. Target Word Count: Exactly 520 to 580 words (CRUCIAL: Must be between 510 and 590 words for the 15-minute examination hall test).
2. Longer Words & Vocabulary Architecture (MANDATORY):
   - At least 45% to 55% of all words across the passage MUST be long words of 8 to 16+ letters each.
   - Use high-syllable, polysyllabic words frequently throughout every paragraph. Examples of mandatory word styles:
     * Institutional & Administrative: institutionalization, telecommunications, counter-intelligence, misappropriation, constitutionalism, superintendence, decentralization, implementation, comprehensive, multidisciplinary, democratization, representations, administration, accountability.
     * Legal & Judicial: jurisprudence, proportionality, responsiveness, interoperability, extraterritoriality, circumstantial, corroboration, confidentiality, admissibility, unenforceable, indemnification.
     * Technical & Security: infrastructure, vulnerabilities, authentication, surveillance, microcontroller, interoperability, microprocessors, electronically, forensic.
   - Strictly minimize short 2-to-4 letter monosyllabic words (limit them only to unavoidable prepositions like in, of, to, for).
   - Average Word Length (AWL) across the entire passage MUST be between 7.0 and 8.5 characters per word.
3. Content & Punctuation Complexity:
   - High vocabulary density, official judicial, administrative, legislative and forensic terminology.
   - Include official departmental abbreviations and legal acronyms (e.g. "IPC", "CrPC", "UPPRPB", "CCTNS", "FIR", "IT Act", "CCTV", "AI", "DNA").
   - Include historical dates (e.g. "26 November 2008", "15.08.1947"), statistics, percentages (e.g. "45.8%"), and serial numbers.
   - Include hyphenated compound terms (e.g. "state-of-the-art", "real-time", "multi-agency", "capacity-building", "inter-departmental"), paired quotation marks ("..."), and complex compound-complex sentence clauses.
4. Formatting:
   - Exactly 3 to 4 continuous paragraphs of formal prose.
   - Absolutely NO bullet points, NO numbered lists, NO asterisks, and NO markdown headers/bolding.
5. Output Format:
Return ONLY valid JSON (no surrounding markdown code fences):
{
  "title": "Short descriptive official title (max 7-9 words)",
  "text": "The complete 520-580 word continuous passage text with high concentration of long words here..."
}`;
    } else {
      userPrompt = `Generate an official competitive examination typing passage in standard English strictly conforming to the AR Typing MEDIUM level standard for UP Police Computer Operator Grade-A and ASI examinations.
Topic: ${slot.topic}
Difficulty: MEDIUM (Balanced Editorial Standard)
Requirements:
1. Target Word Count: Exactly 500 to 540 words (for the 15-minute examination hall test).
2. Content & Vocabulary:
   - Balanced editorial, socioeconomic and administrative prose.
   - Clean sentence structure, standard commas, periods, and occasional years or data figures.
   - Fluid vocabulary suitable for candidates targeting 30 to 35 WPM net speed.
3. Formatting:
   - Exactly 3 continuous paragraphs of formal prose.
   - Absolutely NO bullet points, NO numbered lists, NO asterisks, and NO markdown formatting.
4. Output Format:
Return ONLY valid JSON (no surrounding markdown code fences):
{
  "title": "Short descriptive official title (max 7-9 words)",
  "text": "The complete 500-540 word continuous passage text here..."
}`;
    }
  } else {
    // Hindi
    systemPrompt =
      'आप उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB) एवं एआर टाइपिंग (AR Typing) पोर्टल के मुख्य टंकण सामग्री निर्माता एवं वरिष्ठ परीक्षा नियंत्रक हैं।';
    if (isHard) {
      userPrompt = `दिए गए विषय पर उत्तर प्रदेश पुलिस कंप्यूटर ऑपरेटर (ग्रेड-ए) एवं एएसआई टंकण परीक्षा के 'कठिन स्तर' (HARD LEVEL) के अनुसार आधिकारिक 15-मिनट की टंकण सामग्री तैयार करें।
विषय: ${slot.topic}
कठिनाई स्तर: कठिन (HARD LEVEL • आधिकारिक परीक्षा मानक - दीर्घ एवं लंबे शब्द)

अनिवार्य मानक — टंकण परीक्षा में 'कठिन' का अर्थ है: "अधिक से अधिक दीर्घ एवं लंबे शब्द" (LONGER WORDS):
टंकण परीक्षा में कठिन स्तर का मुख्य उद्देश्य परीक्षार्थी की उंगलियों की सहनशीलता, एकाग्रता और कीस्ट्रोक्स की कठिन परीक्षा लेना है। इसके लिए गद्यांश में छोटे शब्दों की तुलना में 'दीर्घ, बहु-अक्षरीय एवं सामासिक शब्दों' (8 से 16 अक्षर/मात्राओं वाले लंबे शब्द) की प्रचुरता अनिवार्य है।

अनिवार्य आवश्यकताएं:
1. लक्षित शब्द संख्या: ठीक 520 से 580 शब्द (15 मिनट की परीक्षा के लिए 510 से 590 शब्दों के बीच अनिवार्य)।
2. दीर्घ शब्द (Long Words) एवं शब्दावली संरचना (अत्यंत अनिवार्य):
   - गद्यांश के प्रत्येक वाक्य में कम से कम 45% से 55% शब्द 8 से 16 अक्षर/मात्रा वाले 'दीर्घ, सामासिक एवं संधि-युक्त शब्द' होने चाहिए।
   - उदाहरण स्वरूप इस प्रकार के लंबे शब्दों का निरंतर प्रयोग करें:
     * प्रशासनिक एवं संवैधानिक: 'संवैधानिकता', 'उत्तरदायित्व', 'कार्यप्रणाली', 'प्रशासनिक', 'दूरसंचार', 'न्यायाधिकरण', 'पुनर्गठन', 'विभागाध्यक्ष', 'अंतर-विभागीय', 'विशेषज्ञता', 'प्रतिबद्धता', 'आत्मनिर्भरता', 'प्रमाणीकरण', 'कार्यकुशलता', 'सार्वभौमिकता', 'परिस्थितिजन्य', 'सुदृढ़ीकरण', 'क्षेत्राधिकार', 'जवाबदेही', 'दूरदर्शितापूर्ण', 'अंतरराज्यीय'।
     * विधिक एवं तकनीकी: 'सूचना-प्रौद्योगिकी', 'अभियोजनपक्ष', 'विशेषाधिकार', 'पुनर्वास', 'सहानुभूतिपूर्वक', 'अधिसूचनाएं', 'कार्यान्वयन', 'गैर-सरकारी', 'विधि-सम्मत', 'अधिनियमित', 'दंडात्मकता'।
   - छोटे सरल शब्दों (था, थे, हैं, से, को, पर, का, की, और, या) का केवल आवश्यक न्यूनतम व्याकरणिक उपयोग करें; गद्यांश को दीर्घ, भारी-भरकम सामासिक शब्दों से समृद्ध रखें ताकि औसत शब्द लंबाई (AWL) अत्यधिक हो।
   - कठिन एवं जटिल संयुक्त व्यंजन प्रचुरता में शामिल करें, जैसे: 'द्ध' (बुद्धि, शुद्ध, प्रतिबद्ध), 'द्व' (द्वार, विद्वान, द्विपक्षीय), 'द्य' (विद्या, उद्योग, औद्योगिकीकरण), 'ष्ट' (दृष्टिकोण, विशिष्ट, स्पष्टीकरण), 'क्त' (शक्ति, संयुक्त, अनासक्त), 'ह्न' (चिह्न), 'हृ' (हृदय), 'त्त' (उत्तरदायित्व, संपत्ति), 'ट्र' (ट्रैफिक, इलेक्ट्रॉनिक, राष्ट्रीय), 'क्र' (क्रम, प्रक्रिया, तकनीकी), 'द्द' (उद्देश्य, मुद्दा), 'ह्म' (ब्रह्म)।
   - शुद्ध नुक्ता युक्त शब्द (जैसे फ़ैसला, ज़िला, ख़ास), अल्पविराम (,), पूर्णविराम (।), उद्धरण चिह्न ('...') और सांख्यिकीय आंकड़े व तिथियां।
3. प्रारूप:
   - 3 से 4 निरंतर पैराग्राफ।
   - कोई बुलेट पॉइंट नहीं, कोई नंबरिंग नहीं, कोई स्टार (*) चिह्न या मार्कडाउन बोल्डिंग नहीं।
   - मानक देवनागरी यूनिकोड (NFC)।
4. उत्तर केवल वैध JSON प्रारूप में दें:
{
  "title": "परीक्षण का आधिकारिक शीर्षक (अधिकतम 7-9 शब्द)",
  "text": "पूर्ण 520 से 580 शब्दों का गद्यांश (दीर्घ एवं लंबे शब्दों से भरपूर)..."
}`;
    } else {
      userPrompt = `दिए गए विषय पर उत्तर प्रदेश पुलिस कंप्यूटर ऑपरेटर एवं एएसआई टंकण परीक्षा के 'मध्यम स्तर' (MEDIUM LEVEL) के अनुसार आधिकारिक 15-मिनट की टंकण सामग्री तैयार करें।
विषय: ${slot.topic}
कठिनाई स्तर: मध्यम (MEDIUM LEVEL • संतुलित मानक)
अनिवार्य आवश्यकताएं:
1. लक्षित शब्द संख्या: ठीक 500 से 540 शब्द (15 मिनट की परीक्षा हेतु)।
2. शब्दावली एवं संरचना:
   - मानक खड़ी बोली हिंदी (देवनागरी यूनिकोड), स्पष्ट वाक्य विन्यास, संतुलित प्रशासनिक एवं सामान्य ज्ञान शब्दावली।
   - सामान्य संयुक्त व्यंजन (प्र, त्र, ज्ञ, श्र, क्ष), अल्पविराम और पूर्णविराम।
   - मंगल इनस्क्रिप्ट कीबोर्ड पर 25 से 30 WPM की गति बनाए रखने के लिए उपयुक्त।
3. प्रारूप:
   - 3 निरंतर पैराग्राफ।
   - कोई बुलेट पॉइंट, नंबरिंग या मार्कडाउन फॉर्मेटिंग न लगाएं।
4. उत्तर केवल वैध JSON प्रारूप में दें:
{
  "title": "परीक्षण का आधिकारिक शीर्षक (अधिकतम 7-9 शब्द)",
  "text": "पूर्ण 500 से 540 शब्दों का गद्यांश..."
}`;
    }
  }

  const endpoint = `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
  if (baseUrl.includes('openrouter')) {
    headers['HTTP-Referer'] = 'https://purendar950.github.io/Typing-computer-operator-/';
    headers['X-Title'] = 'UP Police Typing Exam Suite';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3500
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AI Request Failed (${res.status}): ${errorText.slice(0, 120)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  const parsed = extractPassageFromAiResponse(rawContent, `Live Exam Test #${slot.slot} (${slot.subType})`);

  const cleanText = parsed.text;
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  return {
    id: `ar-live-${dateStr}-slot${slot.slot}`,
    title: parsed.title || `Live Exam Test #${slot.slot} (${slot.subType})`,
    language: slot.language,
    category: slot.category,
    duration: 15,
    wordCount,
    difficulty: slot.difficulty,
    date: dateStr,
    text: cleanText
  };
}

// Reusable single test generator calibrated to AR Typing Medium & Hard standards
export async function generateCustomTest(options: {
  language: Language;
  difficulty: 'medium' | 'hard';
  category: ExamCategory;
  topic: string;
  targetWords?: number;
  config: AiConfig;
}): Promise<Passage> {
  const { language, difficulty, category, topic, targetWords, config } = options;
  const baseUrl = cleanBaseUrl(config.baseUrl);
  const apiKey = config.apiKey.trim();
  const model = config.model.trim() || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('API Key is missing. Please configure your API key in AI Settings.');
  }

  const isHindi = language.startsWith('hindi');
  const isHard = difficulty === 'hard';
  const wordCountTarget = targetWords || (isHard ? 550 : 520);

  let systemPrompt = '';
  let userPrompt = '';

  if (!isHindi) {
    systemPrompt =
      'You are the principal typing examination passage author for Uttar Pradesh Police Recruitment Board (UPPRPB) and AR Typing portal.';
    if (isHard) {
      userPrompt = `Generate an official AR Typing HARD level competitive examination typing passage in standard English on '${topic}'.
Target Word Count: Exactly ${wordCountTarget} words (between 520 and 580 words).
CRUCIAL HARD CRITERIA — MORE LONGER WORDS (MANDATORY):
- High concentration of long, polysyllabic words (8 to 16+ letters each, Average Word Length >= 7.0 to 8.5 characters per word). At least 45% to 55% of all words must be long words such as: telecommunications, institutionalization, counter-intelligence, misappropriation, constitutionalism, superintendence, jurisprudence, proportionality, responsiveness, interoperability, infrastructure, vulnerabilities, democratization, multidisciplinary, administration, accountability, parliamentary, implementation, comprehensive, extraterritoriality, confidentiality.
- Strictly minimize short 2-to-4 letter monosyllabic words.
- High vocabulary complexity, official legal/administrative/police terminology, departmental acronyms (IPC, CrPC, UPPRPB, CCTNS, FIR), quotes, hyphens, and statistical dates. Continuous 3-4 paragraphs, no bullet points, no markdown.
Return ONLY valid JSON:
{
  "title": "Official Title (${topic})",
  "text": "Full continuous passage text with high concentration of long words here..."
}`;
    } else {
      userPrompt = `Generate an official AR Typing MEDIUM level competitive examination typing passage in standard English on '${topic}'.
Target Word Count: Exactly ${wordCountTarget} words (between 500 and 540 words).
Requirements: Balanced vocabulary, clear administrative and general knowledge prose, standard punctuation, continuous 3 paragraphs, no bullet points, no markdown.
Return ONLY valid JSON:
{
  "title": "Official Title (${topic})",
  "text": "Full continuous passage text here..."
}`;
    }
  } else {
    systemPrompt =
      'आप उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB) एवं एआर टाइपिंग (AR Typing) पोर्टल के मुख्य टंकण सामग्री निर्माता हैं।';
    if (isHard) {
      userPrompt = `दिए गए विषय '${topic}' पर आधिकारिक एआर टाइपिंग 'कठिन स्तर' (HARD) मानक के अनुसार 15-मिनट की टंकण सामग्री तैयार करें।
लक्षित शब्द संख्या: ठीक ${wordCountTarget} शब्द (520 से 580 शब्दों के बीच)।
अनिवार्य कठिन मानक — अधिक से अधिक दीर्घ एवं लंबे शब्द (LONGER WORDS MANDATE):
- गद्यांश में 8 से 16 अक्षर/मात्रा वाले 'दीर्घ, बहु-अक्षरीय एवं सामासिक शब्दों' का अनुपात कम से कम 50% होना अनिवार्य है (जैसे: संवैधानिकता, उत्तरदायित्व, कार्यप्रणाली, प्रशासनिक, दूरसंचार, न्यायाधिकरण, पुनर्गठन, विभागाध्यक्ष, अंतर-विभागीय, विशेषज्ञता, प्रतिबद्धता, आत्मनिर्भरता, प्रमाणीकरण, कार्यकुशलता, सार्वभौमिकता, परिस्थितिजन्य, सुदृढ़ीकरण, क्षेत्राधिकार, सूचना-प्रौद्योगिकी, अभियोजनपक्ष, विशेषाधिकार)।
- छोटे सरल शब्दों का न्यूनतम प्रयोग करें ताकि औसत शब्द लंबाई (AWL) अत्यधिक रहे और टंकण की वास्तविक कठिन परीक्षा हो।
- उच्च विधिक एवं प्रशासनिक शब्दावली, कठिन संयुक्त व्यंजन (द्ध, द्व, द्य, ष्ट, क्त, ह्न, हृ, त्त, ट्र, क्र, द्द), नुक्ता शब्द (फ़, ज़), उद्धरण चिह्न, 3-4 निरंतर पैराग्राफ, कोई बुलेट नहीं।
केवल शुद्ध JSON दें:
{
  "title": "आधिकारिक शीर्षक (${topic})",
  "text": "पूर्ण गद्यांश (दीर्घ एवं लंबे शब्दों से युक्त)..."
}`;
    } else {
      userPrompt = `दिए गए विषय '${topic}' पर आधिकारिक एआर टाइपिंग 'मध्यम स्तर' (MEDIUM) मानक के अनुसार 15-मिनट की टंकण सामग्री तैयार करें।
लक्षित शब्द संख्या: ठीक ${wordCountTarget} शब्द (500 से 540 शब्दों के बीच)।
अनिवार्यता: मानक देवनागरी यूनिकोड, संतुलित शब्दावली, मंगल इनस्क्रिप्ट अनुकूल, 3 निरंतर पैराग्राफ, कोई बुलेट नहीं।
केवल शुद्ध JSON दें:
{
  "title": "आधिकारिक शीर्षक (${topic})",
  "text": "पूर्ण गद्यांश..."
}`;
    }
  }

  const endpoint = `${baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
  if (baseUrl.includes('openrouter')) {
    headers['HTTP-Referer'] = 'https://purendar950.github.io/Typing-computer-operator-/';
    headers['X-Title'] = 'UP Police Typing Exam Suite';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3500
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AI Request Failed (${res.status}): ${errorText.slice(0, 120)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  const parsed = extractPassageFromAiResponse(rawContent, `Custom AI Test: ${topic}`);

  const cleanText = parsed.text;
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const todayStr = new Date().toISOString().split('T')[0];

  const newPassage: Passage = {
    id: `custom-ai-${Date.now()}`,
    title: parsed.title || `Custom AI Test: ${topic}`,
    language,
    category,
    duration: 15,
    wordCount,
    difficulty,
    date: todayStr,
    text: cleanText
  };

  await saveCustomPassage(newPassage);
  return newPassage;
}

// 5. Generate All 8 Daily Live Tests
export async function generateAll8DailyLiveTests(
  dateStr: string,
  config: AiConfig,
  onProgress?: (completed: number, total: number, currentSlotTitle: string) => void
): Promise<Passage[]> {
  const results: Passage[] = [];
  const total = DAILY_8_SLOTS.length;

  for (let i = 0; i < total; i++) {
    const slot = DAILY_8_SLOTS[i];
    if (onProgress) {
      onProgress(i, total, `Generating ${slot.subType} (${slot.topic})...`);
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
    onProgress(total, total, 'Completed all 8 Daily Live Tests!');
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
