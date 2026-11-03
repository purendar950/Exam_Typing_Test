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

export const AI_PRESETS = [
  {
    name: 'Google Gemini (Recommended)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.5-flash',
    info: 'Fast & high quality for both English & authentic Hindi Devanagari.'
  },
  {
    name: 'OpenAI (GPT-4o Mini)',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    info: 'Official OpenAI API endpoint with high precision.'
  },
  {
    name: 'Groq Cloud (Fast)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    info: 'Ultra-fast inference (Llama 3.3 70B).'
  },
  {
    name: 'OpenRouter (All Models)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash',
    info: 'Unified access across multiple AI model providers.'
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
function cleanBaseUrl(url: string): string {
  let cleaned = (url || '').trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/chat/completions')) {
    cleaned = cleaned.replace('/chat/completions', '');
  }
  return cleaned;
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

// 4. Generate Single Passage from AI
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
