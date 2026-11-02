import { EvaluationResult, Language, ExamCategory } from '../types';
import { normalizeHindiText } from './hindiEngine';

export interface EvaluateInput {
  testId: string;
  testTitle: string;
  language: Language;
  category: ExamCategory;
  originalText: string;
  typedText: string;
  timeAllowedMinutes: number;
  timeTakenSeconds: number;
  backspaceCount: number;
}

export function evaluateTypingTest(input: EvaluateInput): EvaluationResult {
  const isHindi = input.language.startsWith('hindi');

  // Normalize texts
  const normOriginal = isHindi ? normalizeHindiText(input.originalText) : input.originalText.trim();
  const normTyped = isHindi ? normalizeHindiText(input.typedText) : input.typedText.trim();

  const originalWords = normOriginal.split(/\s+/).filter(Boolean);
  const typedWords = normTyped.split(/\s+/).filter(Boolean);

  const totalKeystrokes = normTyped.length;
  const timeTakenMinutes = Math.max(0.1, input.timeTakenSeconds / 60);

  let correctWords = 0;
  let fullMistakes = 0;
  let halfMistakes = 0;
  const wrongWordsList: string[] = [];
  const diffParts: string[] = [];

  const maxLen = Math.max(originalWords.length, typedWords.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = originalWords[i] || '';
    const typed = typedWords[i] || '';

    if (!orig && typed) {
      // Extra word typed
      fullMistakes++;
      wrongWordsList.push(typed);
      diffParts.push(`<span class="diff-extra" title="Extra word">${typed}</span>`);
    } else if (orig && !typed) {
      // Skipped word
      fullMistakes++;
      diffParts.push(`<span class="diff-missing" title="Skipped word">${orig}</span>`);
    } else if (orig === typed) {
      // Exact match
      correctWords++;
      diffParts.push(`<span class="diff-correct">${orig}</span>`);
    } else {
      // Check for half mistake vs full mistake
      const isCaseOrPunctMismatch = !isHindi && orig.toLowerCase() === typed.toLowerCase();

      if (isCaseOrPunctMismatch) {
        halfMistakes++;
        wrongWordsList.push(orig);
        diffParts.push(`<span class="diff-half" title="Case/Punctuation mismatch">${orig} (${typed})</span>`);
      } else {
        fullMistakes++;
        wrongWordsList.push(orig);
        diffParts.push(`<span class="diff-wrong" title="Wrong word"><del>${orig}</del> <ins>${typed}</ins></span>`);
      }
    }
  }

  const equivalentErrors = fullMistakes + halfMistakes * 0.5;

  // Standard Gross WPM (5 characters = 1 word)
  const grossWpm = Math.round((totalKeystrokes / 5 / timeTakenMinutes) * 10) / 10;

  // Net WPM
  const penaltyWpm = equivalentErrors / timeTakenMinutes;
  const netWpm = Math.max(0, Math.round((grossWpm - penaltyWpm) * 10) / 10);

  // Accuracy calculation
  const totalEvaluatedWords = Math.max(1, typedWords.length);
  const accuracy = Math.max(
    0,
    Math.min(100, Math.round(((totalEvaluatedWords - equivalentErrors) / totalEvaluatedWords) * 1000) / 10)
  );

  // Official UP Police Computer Operator Grade-A Cutoff Rules:
  // Hindi: 25 WPM, 85% accuracy
  // English: 30 WPM, 85% accuracy
  const requiredSpeed = isHindi ? 25 : 30;
  const requiredAccuracy = 85.0;

  const isQualified = netWpm >= requiredSpeed && accuracy >= requiredAccuracy;

  return {
    testId: input.testId,
    testTitle: input.testTitle,
    language: input.language,
    category: input.category,
    timeAllowedMinutes: input.timeAllowedMinutes,
    timeTakenSeconds: input.timeTakenSeconds,
    totalKeystrokes,
    backspaceCount: input.backspaceCount,
    totalOriginalWords: originalWords.length,
    totalTypedWords: typedWords.length,
    correctWords,
    incorrectWords: fullMistakes,
    skippedWords: Math.max(0, originalWords.length - typedWords.length),
    grossWpm,
    netWpm,
    accuracy,
    fullMistakes,
    halfMistakes,
    errorPercentage: Math.round((equivalentErrors / Math.max(1, originalWords.length)) * 1000) / 10,
    isQualified,
    qualificationCriteria: {
      requiredSpeed,
      requiredAccuracy,
      achievedSpeed: netWpm,
      achievedAccuracy: accuracy
    },
    wrongWordsList: Array.from(new Set(wrongWordsList)),
    diffHtml: diffParts.join(' '),
    originalText: input.originalText,
    typedText: input.typedText,
    timestamp: new Date().toISOString()
  };
}
