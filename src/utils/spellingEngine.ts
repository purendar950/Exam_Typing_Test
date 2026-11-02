/**
 * MS Word-Style Client-Side Spell Checking & Typo Engine
 * Provides instant dictionary lookups, affix checking, and typo detection
 * for English, Hindi Mangal, and Hindi Kruti Dev typing.
 */

import { Language } from '../types';

// Core English dictionary words (stems, common vocabulary, exam terms)
const BASE_DICTIONARY = [
  // Common grammatical and everyday words
  "a", "about", "above", "across", "act", "action", "active", "activity", "add", "admit", "adult",
  "after", "again", "against", "age", "agency", "agent", "ago", "agree", "agreement", "ahead", "air",
  "all", "allow", "almost", "alone", "along", "already", "also", "although", "always", "among", "amount",
  "analysis", "and", "animal", "another", "answer", "any", "anyone", "anything", "appear", "apply", "approach",
  "area", "argue", "arm", "around", "arrive", "art", "article", "artist", "as", "ask", "assume", "at",
  "attack", "attention", "attorney", "audience", "author", "authority", "available", "avoid", "away", "baby",
  "back", "bad", "bag", "ball", "bank", "bar", "base", "be", "beat", "beautiful", "because", "become",
  "bed", "before", "begin", "behavior", "behind", "believe", "benefit", "best", "better", "between", "beyond",
  "big", "bill", "billion", "bit", "black", "blood", "blue", "board", "body", "book", "born", "both",
  "box", "boy", "break", "bring", "brother", "budget", "build", "building", "business", "busy", "but", "buy",
  "by", "call", "camera", "campaign", "can", "cancer", "candidate", "capital", "car", "card", "care", "career",
  "carry", "case", "catch", "cause", "cell", "center", "central", "century", "certain", "certainly", "chair",
  "challenge", "chance", "change", "character", "charge", "check", "child", "choice", "choose", "church", "citizen",
  "city", "civil", "claim", "class", "clear", "clearly", "close", "coach", "cold", "collection", "college",
  "color", "come", "commercial", "common", "community", "company", "compare", "computer", "concern", "condition",
  "conference", "congress", "consider", "consumer", "contain", "continue", "control", "cost", "could", "country",
  "couple", "course", "court", "cover", "create", "crime", "cultural", "culture", "cup", "current", "customer",
  "cut", "dark", "data", "daughter", "day", "dead", "deal", "death", "debate", "decade", "decide", "decision",
  "deep", "defense", "degree", "democrat", "democratic", "describe", "design", "despite", "detail", "determine",
  "develop", "development", "die", "difference", "different", "difficult", "dinner", "direction", "director", "discover",
  "discuss", "discussion", "disease", "do", "doctor", "dog", "door", "down", "draw", "dream", "drive", "drop",
  "drug", "during", "each", "early", "east", "easy", "eat", "economic", "economy", "edge", "education", "effect",
  "effort", "eight", "either", "election", "else", "employee", "end", "energy", "enjoy", "enough", "enter", "entire",
  "environment", "environmental", "especially", "establish", "even", "evening", "event", "ever", "every", "everybody",
  "everyone", "everything", "evidence", "exactly", "example", "executive", "exist", "expect", "experience", "expert",
  "explain", "eye", "face", "fact", "factor", "fail", "fall", "family", "far", "fast", "father", "fear", "federal",
  "feel", "feeling", "few", "field", "fight", "figure", "fill", "film", "final", "finally", "financial", "find",
  "fine", "finger", "finish", "fire", "firm", "first", "fish", "five", "floor", "fly", "focus", "follow", "food",
  "foot", "for", "force", "foreign", "forget", "form", "former", "forward", "four", "free", "friend", "from",
  "front", "full", "fund", "future", "game", "garden", "gas", "general", "generation", "get", "girl", "give",
  "glass", "go", "goal", "good", "government", "great", "green", "ground", "group", "grow", "growth", "guess",
  "gun", "guy", "hair", "half", "hand", "hang", "happen", "happy", "hard", "have", "he", "head", "health",
  "hear", "heart", "heat", "heavy", "help", "her", "here", "herself", "high", "him", "himself", "his", "history",
  "hit", "hold", "home", "hope", "hospital", "hot", "hotel", "hour", "house", "how", "however", "huge", "human",
  "hundred", "husband", "i", "idea", "identify", "if", "image", "imagine", "impact", "important", "improve", "in",
  "include", "including", "increase", "indeed", "indicate", "individual", "industry", "information", "inside", "instead",
  "institution", "interest", "interesting", "international", "interview", "into", "investment", "involve", "issue", "it",
  "item", "its", "itself", "job", "join", "just", "keep", "key", "kid", "kill", "kind", "kitchen", "know",
  "knowledge", "land", "language", "large", "last", "late", "later", "laugh", "law", "lawyer", "lay", "lead",
  "leader", "learn", "least", "leave", "left", "leg", "legal", "less", "let", "letter", "level", "lie", "life",
  "light", "like", "likely", "line", "list", "listen", "little", "live", "local", "long", "look", "lose", "loss",
  "lot", "love", "low", "machine", "magazine", "main", "maintain", "major", "majority", "make", "man", "manage",
  "management", "manager", "many", "market", "marriage", "material", "matter", "may", "maybe", "me", "mean",
  "measure", "media", "medical", "meet", "meeting", "member", "memory", "mention", "message", "method", "middle",
  "might", "military", "million", "mind", "minute", "miss", "mission", "model", "modern", "moment", "money", "month",
  "more", "morning", "most", "mother", "mouth", "move", "movement", "movie", "mr", "mrs", "ms", "much", "music",
  "must", "my", "myself", "name", "nation", "national", "natural", "nature", "near", "nearly", "necessary", "need",
  "network", "never", "new", "news", "newspaper", "next", "nice", "night", "no", "none", "nor", "north", "not",
  "note", "nothing", "notice", "now", "number", "occur", "of", "off", "offer", "office", "officer", "official",
  "often", "oh", "oil", "ok", "old", "on", "once", "one", "only", "onto", "open", "operation", "opportunity",
  "option", "or", "order", "organization", "other", "others", "our", "out", "outside", "over", "own", "owner",
  "page", "pain", "painting", "paper", "parent", "part", "participant", "particular", "particularly", "partner", "party",
  "pass", "past", "patient", "pattern", "pay", "peace", "people", "per", "perform", "performance", "perhaps", "period",
  "person", "personal", "phone", "physical", "pick", "picture", "piece", "place", "plan", "plant", "play", "player",
  "point", "police", "policy", "political", "politics", "poor", "popular", "population", "position", "positive", "possible",
  "power", "practice", "prepare", "present", "president", "pressure", "pretty", "prevent", "price", "private", "probably",
  "problem", "process", "produce", "product", "production", "professional", "professor", "program", "project", "property",
  "protect", "prove", "provide", "public", "pull", "purpose", "push", "put", "quality", "question", "quickly", "quite",
  "race", "radio", "raise", "range", "rate", "rather", "reach", "read", "ready", "real", "reality", "realize",
  "really", "reason", "receive", "recent", "recently", "recognize", "record", "red", "reduce", "reflect", "region",
  "relate", "relationship", "religious", "remain", "remember", "remove", "report", "represent", "republican", "require",
  "research", "resource", "respond", "response", "responsibility", "rest", "result", "return", "reveal", "rich", "right",
  "rise", "risk", "road", "rock", "role", "room", "rule", "run", "safe", "same", "save", "say", "scene", "school",
  "science", "scientist", "score", "sea", "season", "seat", "second", "section", "security", "see", "seek", "seem",
  "sell", "send", "senior", "sense", "series", "serious", "serve", "service", "set", "seven", "several", "sex",
  "sexual", "shake", "share", "she", "shoot", "short", "shot", "should", "shoulder", "show", "side", "sign",
  "significant", "similar", "simple", "simply", "since", "sing", "single", "sister", "sit", "site", "situation", "six",
  "size", "skill", "skin", "small", "smile", "so", "social", "society", "soldier", "some", "somebody", "someone",
  "something", "sometimes", "son", "song", "soon", "sort", "sound", "source", "south", "southern", "space", "speak",
  "special", "specific", "speech", "spend", "sport", "spring", "staff", "stage", "stand", "standard", "star", "start",
  "state", "statement", "station", "stay", "step", "still", "stock", "stop", "store", "story", "strategy", "street",
  "strong", "structure", "student", "study", "stuff", "style", "subject", "success", "successful", "such", "suddenly",
  "suffer", "suggest", "summer", "support", "sure", "surface", "system", "table", "take", "talk", "task", "tax",
  "teach", "teacher", "team", "technology", "television", "tell", "ten", "tend", "term", "test", "than", "thank",
  "that", "the", "their", "them", "themselves", "then", "theory", "there", "these", "they", "thing", "think",
  "third", "this", "those", "though", "thought", "thousand", "threat", "three", "through", "throughout", "throw", "thus",
  "time", "to", "today", "together", "tonight", "too", "top", "total", "tough", "toward", "town", "trade", "traditional",
  "training", "travel", "treat", "treatment", "tree", "trial", "trip", "trouble", "true", "truth", "try", "turn",
  "tv", "two", "type", "under", "understand", "unit", "until", "up", "upon", "us", "use", "usually", "value",
  "various", "very", "victim", "view", "violence", "visit", "voice", "vote", "wait", "walk", "wall", "want", "war",
  "watch", "water", "way", "we", "weapon", "wear", "week", "weight", "well", "west", "western", "what", "whatever",
  "when", "where", "whether", "which", "while", "white", "who", "whole", "whom", "whose", "why", "wide", "wife",
  "will", "win", "wind", "window", "wish", "with", "within", "without", "woman", "wonder", "word", "work", "worker",
  "world", "worry", "would", "write", "writer", "wrong", "yard", "yeah", "year", "yes", "yet", "you", "young",
  "your", "yourself",

  // UP Police, Examination, Typing & Law Administration vocabulary
  "operator", "inspector", "subinspector", "constable", "superintendent", "commissioner", "headquarters", "station",
  "jurisdiction", "affidavit", "evidence", "witness", "testimony", "charge", "chargesheet", "prosecution", "prosecutor",
  "judiciary", "judicial", "tribunal", "statutory", "investigation", "forensic", "cyber", "intelligence", "surveillance",
  "bureaucracy", "secretariat", "administration", "governance", "inscript", "mangal", "kruti", "keystroke", "accuracy",
  "speed", "wpm", "net", "gross", "evaluation", "examination", "benchmark", "typing", "keyboard", "cadence", "rhythm",
  "paragraph", "manuscript", "document", "chapter", "edition", "publish", "author", "preface", "index", "volume",
  "lucknow", "uttar", "pradesh", "agra", "varanasi", "prayagraj", "kanpur", "meerut", "bareilly", "gorakhpur", "jhansi",
  "aligarh", "moradabad", "ayodhya", "noida", "ghaziabad", "mathura", "bharat", "india", "indian", "constitution",
  "statute", "adhiniyam", "bhartiya", "nyaya", "sanhita", "sakshya", "suraksha", "cctns", "portal", "digital",
  "network", "server", "database", "infrastructure", "transcription", "typographical", "cadre", "recruitment", "board"
];

// Build an ultra-fast Set for O(1) membership lookups
const DICTIONARY_SET = new Set<string>();

// Populate and add standard suffixes
BASE_DICTIONARY.forEach((w) => {
  const lower = w.toLowerCase();
  DICTIONARY_SET.add(lower);
  // Simple regular plurals and verb forms
  DICTIONARY_SET.add(`${lower}s`);
  DICTIONARY_SET.add(`${lower}es`);
  DICTIONARY_SET.add(`${lower}ed`);
  DICTIONARY_SET.add(`${lower}ing`);
  DICTIONARY_SET.add(`${lower}ly`);
  DICTIONARY_SET.add(`${lower}er`);
  DICTIONARY_SET.add(`${lower}est`);
  DICTIONARY_SET.add(`${lower}'s`);
});

// User custom dictionary (saved to localStorage)
const USER_DICTIONARY_KEY = 'up_typing_user_custom_dict';
let userCustomWords: Set<string> = new Set();

export function loadUserDictionary(): void {
  try {
    const saved = localStorage.getItem(USER_DICTIONARY_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        userCustomWords = new Set(arr.map((w: string) => w.toLowerCase()));
      }
    }
  } catch {
    userCustomWords = new Set();
  }
}

export function addUserWord(word: string): void {
  const clean = word.trim().toLowerCase();
  if (!clean) return;
  userCustomWords.add(clean);
  try {
    localStorage.setItem(USER_DICTIONARY_KEY, JSON.stringify(Array.from(userCustomWords)));
  } catch {
    // Ignore storage issues
  }
}

export function isUserWord(word: string): boolean {
  return userCustomWords.has(word.toLowerCase());
}

// Initialize on module load
if (typeof window !== 'undefined') {
  loadUserDictionary();
}

/**
 * Checks if an English word is valid, or mistyped.
 * Returns true if valid, false if typo/error (should be underlined with red wavy line).
 */
export function checkEnglishWord(rawWord: string): boolean {
  // Strip outer punctuation: quotes, brackets, periods, commas, colons, semicolons
  const clean = rawWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase();

  // If empty or pure number / numeric code (e.g. 1947, 100%, 30.5), it is valid
  if (!clean || /^\d+([.,]\d+)*%?$/.test(clean)) {
    return true;
  }

  // Single characters like 'a', 'i' are valid
  if (clean.length === 1 && (clean === 'a' || clean === 'i')) {
    return true;
  }
  if (clean.length === 1) {
    return false; // Other single letters like 'b', 'c', 'q' alone are usually typos
  }

  // Check in dictionary & user custom dictionary
  if (DICTIONARY_SET.has(clean) || userCustomWords.has(clean)) {
    return true;
  }

  // Check common prefixes: un-, re-, pre-, dis-, non-, over-, under-, sub-, multi-, co-
  const prefixes = ['un', 're', 'pre', 'dis', 'non', 'over', 'under', 'sub', 'multi', 'co', 'auto', 'bi'];
  for (const prefix of prefixes) {
    if (clean.startsWith(prefix) && clean.length > prefix.length + 2) {
      const stem = clean.slice(prefix.length);
      if (DICTIONARY_SET.has(stem) || userCustomWords.has(stem)) {
        return true;
      }
    }
  }

  // Check common suffixes: -tion, -ment, -ness, -able, -ible, -less, -ful, -ity, -ism, -ist
  const suffixes = ['tion', 'tions', 'ment', 'ments', 'ness', 'able', 'ible', 'less', 'ful', 'ity', 'ities', 'ism', 'ist', 'ists', 'ive', 'ize', 'ized'];
  for (const suffix of suffixes) {
    if (clean.endsWith(suffix) && clean.length > suffix.length + 2) {
      const stem = clean.slice(0, -suffix.length);
      if (DICTIONARY_SET.has(stem) || DICTIONARY_SET.has(`${stem}e`)) {
        return true;
      }
    }
  }

  // If word has uppercase mid-word or repeated 3+ identical letters (e.g., 'pleaaase'), it's a typo
  if (/(.)\1{2,}/.test(clean)) {
    return false;
  }

  return false;
}

/**
 * Checks Hindi Mangal Inscript word for obvious structural typos
 * (e.g., standalone matras, invalid halant sequences, double vowel signs)
 */
export function checkHindiMangalWord(rawWord: string): boolean {
  const clean = rawWord.replace(/[.,;!?"':()—–॥।]+/g, '').trim();
  if (!clean || /^\d+$/.test(clean)) return true;

  // Invalid: starts with a vowel sign / matra (ा, ि, ी, ु, ू, ृ, े, ै, ो, ौ, ्)
  if (/^[\u093E-\u094D]/.test(clean)) {
    return false;
  }

  // Invalid: double halant (््)
  if (/\u094D\u094D/.test(clean)) {
    return false;
  }

  // Invalid: consecutive independent vowels or double matras
  if (/[\u093E-\u094C]{2,}/.test(clean)) {
    return false;
  }

  return true;
}

/**
 * Checks Hindi Kruti Dev word
 */
export function checkHindiKrutiWord(rawWord: string): boolean {
  const clean = rawWord.replace(/[.,;!?"':()—–]+/g, '').trim();
  if (!clean) return true;
  // Kruti Dev typing errors: repeated matras or orphaned signs
  if (/[kK]{3,}/.test(clean)) return false;
  return true;
}

/**
 * Universal Word Validator for MS Word Typing Mode
 */
export function isWordCorrect(word: string, language: Language): boolean {
  if (language === 'english') {
    return checkEnglishWord(word);
  }
  if (language === 'hindi_mangal') {
    return checkHindiMangalWord(word);
  }
  return checkHindiKrutiWord(word);
}

/**
 * Generates spelling correction suggestions for an incorrect word
 */
export function getSpellingSuggestions(word: string, language: Language, limit: number = 3): string[] {
  if (language !== 'english') return [];

  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean || clean.length < 2) return [];

  const candidates: { word: string; dist: number }[] = [];

  // Check dictionary words of similar length
  const sampleWords = Array.from(DICTIONARY_SET);
  for (const dictWord of sampleWords) {
    if (Math.abs(dictWord.length - clean.length) <= 2) {
      if (dictWord[0] === clean[0] || dictWord.slice(-2) === clean.slice(-2)) {
        const dist = levenshteinDistance(clean, dictWord);
        if (dist <= 2) {
          candidates.push({ word: dictWord, dist });
          if (candidates.length > 20) break;
        }
      }
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.slice(0, limit).map((c) => c.word);
}

// Levenshtein Distance Algorithm for suggestions
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}
