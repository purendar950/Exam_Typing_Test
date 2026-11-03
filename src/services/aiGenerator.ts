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
    defaultModel: 'llama-3.3-70b-versatile',
    model: 'llama-3.3-70b-versatile',
    info: 'Ultra-fast inference (500+ tok/s) with generous free tier for Llama 3.3.',
    popularModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Top Quality)', isFree: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra Fast)', isFree: true },
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
    subType: 'English Hard #1',
    topic: 'Cyber Security Operations, Ransomware Threat Intelligence & Police Digital Forensics'
  },
  {
    slot: 4,
    language: 'english',
    difficulty: 'hard',
    category: 'up_police_asi',
    subType: 'English Hard #2',
    topic: 'Indian Judicial Administration, High Court Procedural Jurisprudence & Official Evidence Laws'
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
    subType: 'Hindi Mangal Hard #1',
    topic: 'साइबर अपराध जांच, डिजिटल साक्ष्य अधिनियम एवं पुलिस प्रशासनिक चुनौतियाँ'
  },
  {
    slot: 8,
    language: 'hindi_kruti',
    difficulty: 'hard',
    category: 'up_police_asi',
    subType: 'Hindi Kruti/Mangal Hard #2',
    topic: 'शासकीय राजभाषा परिपत्र, विभागीय अधिसूचनाएं एवं संवैधानिक विधिक व्यवस्था'
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

// 5. Generate Single Passage from AI
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
    userPrompt = `Generate an official competitive examination typing passage in standard English.
Topic: ${slot.topic}
Difficulty: ${isHard ? 'HARD (high vocabulary complexity, legal/forensic/technical terms, acronyms, dates, numbers, quotes, hyphens, and multi-clause sentences matching AR Typing hard level)' : 'MEDIUM (standard editorial prose, balanced vocabulary, commas, periods, clear sentence structure)'}
Target word count: Exactly 520 to 580 words. (Crucial: Must be between 500 and 600 words for a 15-minute exam).
Rules:
- Continuous paragraph prose suitable for live typing test.
- Absolutely NO bullet points, NO numbered lists, NO asterisks, and NO markdown formatting inside the text.
- Return ONLY valid JSON format:
{
  "title": "A clear official title for the test (max 7-9 words)",
  "text": "The full continuous passage text..."
}`;
  } else {
    // Hindi
    systemPrompt =
      'आप उत्तर प्रदेश पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB) और एआर टाइपिंग (AR Typing) पोर्टल के मुख्य टंकण सामग्री निर्माता हैं।';
    userPrompt = `दिए गए विषय पर मानक खड़ी बोली हिंदी (देवनागरी यूनिकोड) में आधिकारिक 15-मिनट की परीक्षा सामग्री तैयार करें।
विषय: ${slot.topic}
कठिनाई स्तर: ${isHard ? 'कठिन (HARD) - उच्च स्तरीय प्रशासनिक, विधिक एवं तकनीकी शब्दावली, संयुक्त व्यंजन (जैसे प्र, द्वा, ष्ट, द्ध, र्, ज्ञ, त्र), उद्धरण चिह्न और संख्याएं।' : 'मध्यम (MEDIUM) - संतुलित शब्दावली, स्पष्ट वाक्य संरचना, पूर्ण विराम, अल्पविराम, मंगल इनस्क्रिप्ट कीबोर्ड के अनुकूल।'}
लक्षित शब्द संख्या: ठीक 520 से 580 शब्द (15 मिनट की परीक्षा के लिए 500 से 600 शब्दों के बीच अनिवार्य)।
नियम:
- निरंतर पैराग्राफ गद्यांश जो आधिकारिक टाइपिंग टेस्ट में उपयुक्त हो।
- कोई बुलेट पॉइंट, क्रमांकित सूची, स्टार चिह्न (*) या मार्कडाउन फॉर्मेटिंग न लगाएं।
- शुद्ध देवनागरी यूनिकोड (NFC)।
- केवल वैध JSON प्रारूप में उत्तर दें:
{
  "title": "परीक्षण का आधिकारिक शीर्षक (अधिकतम 7-9 शब्द)",
  "text": "पूर्ण गद्यांश..."
}`;
  }

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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AI Request Failed (${res.status}): ${errorText.slice(0, 100)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '';

  // Extract JSON
  let parsed: { title: string; text: string };
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in AI response');
    }
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    throw new Error(`Failed to parse AI output as JSON: ${parseErr}`);
  }

  const cleanText = parsed.text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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
