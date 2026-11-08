import { EvaluationResult, Language, ExamCategory, WeakKeyStat, CalculationModel } from '../types';
import { normalizeHindiText, MANGAL_INSCRIPT_KEYS, KRUTI_DEV_KEYS } from './hindiEngine';

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
  targetSpeed?: number;
  requiredAccuracy?: number;
  examProfileTitle?: string;
  calculationModel?: CalculationModel;
  inputType?: 'word' | 'character';
  inputLimit?: number;
  limitErrorPercentage?: number;
}

/**
 * Computes Levenshtein edit distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = new Int32Array(n + 1);
  let currRow = new Int32Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const bChar = b.charCodeAt(j - 1);
      if (aChar === bChar) {
        currRow[j] = prevRow[j - 1];
      } else {
        const insertCost = currRow[j - 1] + 1;
        const deleteCost = prevRow[j] + 1;
        const replaceCost = prevRow[j - 1] + 1;
        currRow[j] = Math.min(insertCost, deleteCost, replaceCost);
      }
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

type AlignmentMatch = 'correct' | 'half' | 'full';

interface SimilarityResult {
  score: number;
  type: AlignmentMatch;
}

/**
 * Evaluates similarity between original word and typed word
 */
function evaluateWordSimilarity(orig: string, typed: string, isEnglish: boolean): SimilarityResult {
  if (orig === typed) {
    return { score: 10, type: 'correct' };
  }

  // English case mismatch (e.g. 'Police' vs 'police') -> Half Mistake
  if (isEnglish && orig.toLowerCase() === typed.toLowerCase()) {
    return { score: 8, type: 'half' };
  }

  // Punctuation difference (e.g. 'है?' vs 'है' or 'लॉस,' vs 'लॉस') -> Half Mistake
  const cleanRegex = /[।,?!.:;"'()\-–—]/g;
  const origClean = orig.replace(cleanRegex, '');
  const typedClean = typed.replace(cleanRegex, '');
  if (origClean.length > 0 && origClean === typedClean) {
    return { score: 7, type: 'half' };
  }

  // Levenshtein edit distance for typo detection
  const dist = levenshteinDistance(orig, typed);
  const maxLen = Math.max(orig.length, typed.length);

  // Single character typo or minor transposition -> Half Mistake
  if (dist === 1 || (maxLen >= 4 && dist <= 2)) {
    return { score: 5, type: 'half' };
  }

  // Close typo substitution -> Full Mistake with positive alignment incentive
  if (dist <= Math.floor(maxLen * 0.5)) {
    return { score: 2, type: 'full' };
  }

  // Distinct word substitution
  return { score: -2, type: 'full' };
}

interface AlignedToken {
  type: 'correct' | 'half' | 'full' | 'omitted' | 'extra';
  orig: string;
  typed: string;
}

interface AlignmentResult {
  alignment: AlignedToken[];
  skippedWords: string[];
}

/**
 * Aligns typed words against original words using Semi-Global Sequence Alignment.
 * This guarantees:
 * 1. Resynchronization after missing or extra words (no cascading false mistakes).
 * 2. Trailing unattempted words are cleanly identified as "Skipped" (cost 0)
 *    and not penalized as errors against typing speed or accuracy.
 */
function alignWords(originalWords: string[], typedWords: string[], isEnglish: boolean): AlignmentResult {
  const M = originalWords.length;
  const N = typedWords.length;

  if (N === 0) {
    return {
      alignment: [],
      skippedWords: originalWords
    };
  }

  // Flat 1D typed arrays for optimal memory and cache locality
  const stride = N + 1;
  const totalCells = (M + 1) * (N + 1);
  const dp = new Int32Array(totalCells);
  const tb = new Uint8Array(totalCells); // 0: diag (match/sub), 1: up (omitted orig), 2: left (extra typed)

  // Gap penalty
  const GAP_PENALTY = -3;

  for (let i = 1; i <= M; i++) {
    dp[i * stride] = i * GAP_PENALTY;
    tb[i * stride] = 1;
  }
  for (let j = 1; j <= N; j++) {
    dp[j] = j * GAP_PENALTY;
    tb[j] = 2;
  }

  for (let i = 1; i <= M; i++) {
    const origWord = originalWords[i - 1];
    const rowOffset = i * stride;
    const prevRowOffset = (i - 1) * stride;

    for (let j = 1; j <= N; j++) {
      const typedWord = typedWords[j - 1];
      const sim = evaluateWordSimilarity(origWord, typedWord, isEnglish);

      const scoreDiag = dp[prevRowOffset + (j - 1)] + sim.score;
      const scoreUp = dp[prevRowOffset + j] + GAP_PENALTY;
      const scoreLeft = dp[rowOffset + (j - 1)] + GAP_PENALTY;

      let bestScore = scoreDiag;
      let bestDir = 0;

      if (scoreUp > bestScore) {
        bestScore = scoreUp;
        bestDir = 1;
      }
      if (scoreLeft > bestScore) {
        bestScore = scoreLeft;
        bestDir = 2;
      }

      dp[rowOffset + j] = bestScore;
      tb[rowOffset + j] = bestDir;
    }
  }

  // Semi-Global: Find optimal index in originalWords where typedWords ends
  // Trailing words in originalWords are free end-gaps (Skipped words)
  let bestI = M;
  let maxEndScore = -Infinity;
  for (let i = 0; i <= M; i++) {
    const score = dp[i * stride + N];
    if (score > maxEndScore) {
      maxEndScore = score;
      bestI = i;
    }
  }

  // Backtrack from (bestI, N)
  let i = bestI;
  let j = N;
  const alignment: AlignedToken[] = [];

  while (i > 0 || j > 0) {
    const currDir = tb[i * stride + j];
    if (i > 0 && j > 0 && currDir === 0) {
      const origWord = originalWords[i - 1];
      const typedWord = typedWords[j - 1];
      const sim = evaluateWordSimilarity(origWord, typedWord, isEnglish);
      alignment.push({ type: sim.type, orig: origWord, typed: typedWord });
      i--;
      j--;
    } else if (i > 0 && (j === 0 || currDir === 1)) {
      alignment.push({ type: 'omitted', orig: originalWords[i - 1], typed: '' });
      i--;
    } else {
      alignment.push({ type: 'extra', orig: '', typed: typedWords[j - 1] });
      j--;
    }
  }

  alignment.reverse();
  const skippedWords = originalWords.slice(bestI);

  return { alignment, skippedWords };
}

function extractWeakKeys(wrongWords: string[], language: Language): WeakKeyStat[] {
  const charErrorCounts: Record<string, number> = {};

  wrongWords.forEach((word) => {
    // Check known special conjuncts first
    const knownConjuncts = ['क्ष', 'त्र', 'ज्ञ', 'श्र', 'द्व', 'द्य', 'द्ध', 'त्त', 'क्त', 'ष्ट', 'ह्न', 'हृ'];
    let remaining = word;
    for (const conj of knownConjuncts) {
      if (remaining.includes(conj)) {
        charErrorCounts[conj] = (charErrorCounts[conj] || 0) + 1;
        remaining = remaining.split(conj).join('');
      }
    }

    // Process remaining characters
    for (const ch of remaining) {
      if (ch === ' ' || ch === '\t' || ch === '\n') continue;
      charErrorCounts[ch] = (charErrorCounts[ch] || 0) + 1;
    }
  });

  const sortedChars = Object.entries(charErrorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const keyMap = language === 'hindi_kruti' ? KRUTI_DEV_KEYS : MANGAL_INSCRIPT_KEYS;

  return sortedChars.map(([ch, count]) => {
    let keyCombo = '';
    let fingerHint = '';

    if (language.startsWith('hindi')) {
      for (const item of Object.values(keyMap)) {
        if (item.shift === ch) {
          keyCombo = `Shift + ${item.enShift}`;
          fingerHint = item.finger.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          break;
        } else if (item.normal === ch) {
          keyCombo = item.enNormal;
          fingerHint = item.finger.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          break;
        }
      }

      if (ch === 'क्ष') {
        keyCombo = language === 'hindi_kruti' ? 'Shift + K' : 'Shift + 7';
        fingerHint = 'Right Index';
      } else if (ch === 'त्र') {
        keyCombo = language === 'hindi_kruti' ? 'Shift + 1' : 'Shift + 6';
        fingerHint = 'Right Index';
      } else if (ch === 'ज्ञ') {
        keyCombo = language === 'hindi_kruti' ? 'Shift + K' : 'Shift + 5';
        fingerHint = 'Left Index';
      } else if (ch === 'श्र') {
        keyCombo = language === 'hindi_kruti' ? 'Shift + Z' : 'Shift + 8';
        fingerHint = 'Right Middle';
      } else if (ch === '।') {
        keyCombo = 'Shift + .';
        fingerHint = 'Right Ring';
      }
    } else {
      keyCombo = ch;
      fingerHint = 'Touch Typing';
    }

    return {
      character: ch,
      mistakeCount: count,
      keyCombo,
      fingerHint
    };
  });
}

export function evaluateTypingTest(input: EvaluateInput): EvaluationResult {
  const isEnglish = input.language === 'english';
  const isHindiUnicode = input.language === 'hindi_mangal';

  // Normalize texts (NFKC & Nukta canonicalization only for Unicode Mangal Hindi; Kruti Dev is exact ASCII font encoding)
  const normOriginal = isHindiUnicode ? normalizeHindiText(input.originalText) : input.originalText.trim();
  const normTyped = isHindiUnicode ? normalizeHindiText(input.typedText) : input.typedText.trim();

  const originalWords = normOriginal.split(/\s+/).filter(Boolean);
  const typedWords = normTyped.split(/\s+/).filter(Boolean);

  const totalKeystrokes = normTyped.length;
  const timeTakenMinutes = Math.max(0.1, input.timeTakenSeconds / 60);

  // Run dynamic sequence alignment algorithm
  const { alignment, skippedWords } = alignWords(originalWords, typedWords, isEnglish);

  let correctWords = 0;
  let fullMistakes = 0;
  let halfMistakes = 0;
  const wrongWordsList: string[] = [];
  const diffParts: string[] = [];

  alignment.forEach((item) => {
    if (item.type === 'correct') {
      correctWords++;
      diffParts.push(`<span class="diff-correct">${item.orig}</span>`);
    } else if (item.type === 'half') {
      halfMistakes++;
      wrongWordsList.push(item.orig);
      // Highlighting: typed mistake in orange, expected word hint next to it
      diffParts.push(`<span class="diff-half" title="Half Mistake: typed '${item.typed}', expected '${item.orig}'">${item.typed}</span> <span class="diff-orig-hint">${item.orig}</span>`);
    } else if (item.type === 'full') {
      fullMistakes++;
      wrongWordsList.push(item.orig);
      // Highlighting: typed mistake in red, expected word hint next to it
      diffParts.push(`<span class="diff-wrong" title="Full Mistake: typed '${item.typed}', expected '${item.orig}'">${item.typed}</span> <span class="diff-orig-hint">${item.orig}</span>`);
    } else if (item.type === 'omitted') {
      // Word completely missed in the attempted portion
      fullMistakes++;
      wrongWordsList.push(item.orig);
      diffParts.push(`<span class="diff-missing" title="Omitted word">${item.orig}</span>`);
    } else if (item.type === 'extra') {
      // Extra unauthorized word inserted by candidate
      fullMistakes++;
      wrongWordsList.push(item.typed);
      diffParts.push(`<span class="diff-extra" title="Extra word">${item.typed}</span>`);
    }
  });

  // Remaining unattempted words at the end of the passage (Skipped)
  // These are NOT penalized as mistakes
  skippedWords.forEach((word) => {
    diffParts.push(`<span class="diff-skipped">${word}</span>`);
  });

  // Official UPPRPB & National Exam Calculation Engine:
  // 1. Total Equivalent Errors = Full Mistakes + (0.5 * Half Mistakes)
  const equivalentErrors = Math.round((fullMistakes + (halfMistakes * 0.5)) * 10) / 10;

  // 2. Gross Speed (WPM): Standard 5 keystrokes = 1 word
  const grossWpm = Math.round((totalKeystrokes / 5 / timeTakenMinutes) * 10) / 10;

  // 3. UPPRPB Board Direct Net Speed (WPM): Gross WPM minus error points per minute
  const penaltyWpm = Math.round((equivalentErrors / timeTakenMinutes) * 10) / 10;
  const netWpm = Math.max(0, Math.round((grossWpm - penaltyWpm) * 10) / 10);

  // 4. Eduquity 5% Error Allowance Pattern (Standard Recruitment Engine):
  // 5% permissible mistake margin on total standard words typed
  const totalStandardWords = Math.round((totalKeystrokes / 5) * 10) / 10;
  const allowedErrors = Math.round(totalStandardWords * 0.05 * 10) / 10;
  const excessMistakes = Math.max(0, Math.round((equivalentErrors - allowedErrors) * 10) / 10);
  const penaltyWords = Math.round(excessMistakes * 10 * 10) / 10; // 10 words penalty per excess mistake
  const eduquityNetWpm = Math.max(0, Math.round(((totalStandardWords - penaltyWords) / timeTakenMinutes) * 10) / 10);

  // 5. Official Exam Passage-Based Accuracy (The UPPRPB 85% Standard):
  // Accuracy is measured against the TOTAL WORDS IN THE GIVEN PASSAGE
  // Formula: [ (Total Typed Words - Total Errors) / Total Passage Words ] * 100
  const totalPassageWords = Math.max(originalWords.length, 1);
  const passageBenchmarkDenominator = Math.max(totalPassageWords, typedWords.length);
  const netCorrectWords = Math.max(0, typedWords.length - equivalentErrors);
  const accuracy = Math.max(
    0,
    Math.min(100, Math.round((netCorrectWords / passageBenchmarkDenominator) * 1000) / 10)
  );

  // 6. Raw Typing Precision (Evaluated only on words attempted by candidate):
  const totalEvaluatedWords = Math.max(1, correctWords + fullMistakes + halfMistakes);
  const typedAccuracy = Math.max(
    0,
    Math.min(100, Math.round(((totalEvaluatedWords - equivalentErrors) / totalEvaluatedWords) * 1000) / 10)
  );

  // 7. Passage Completion Rate %:
  const completionRate = Math.min(
    100,
    Math.round((typedWords.length / totalPassageWords) * 1000) / 10
  );

  // 8. Error Percentage: (Equivalent Errors / Passage Words) * 100
  const errorPercentage = Math.round((equivalentErrors / passageBenchmarkDenominator) * 1000) / 10;

  // Resolve calculation model
  const model: CalculationModel = input.calculationModel ||
    (input.category.includes('up_police') || input.category.includes('upsssc') || input.category.includes('uppsc') ? 'upprpb' :
     input.category.includes('rrb') || input.category.includes('capf') || input.category.includes('bsf') || input.category.includes('ssb') ? 'rrb_eduquity' :
     input.category.includes('ssc') ? 'ssc_dest' :
     input.category.includes('court') || input.category.includes('jja') ? 'court_delhi' :
     input.category.includes('cpct') ? 'mp_cpct' : 'upprpb');

  // Official Qualifying Cutoffs
  const defaultRequiredSpeed = input.language.startsWith('hindi') ? 25 : 30;
  const requiredSpeed = input.targetSpeed && input.targetSpeed > 0 ? input.targetSpeed : defaultRequiredSpeed;
  const requiredAccuracy = input.requiredAccuracy && input.requiredAccuracy > 0 ? input.requiredAccuracy : 85.0;

  // Exam-specific metrics
  const courtMarks = Math.max(0, Math.round((50.0 - (equivalentErrors * 0.1)) * 10) / 10);
  const sscErrorPercentage = Math.round((equivalentErrors / Math.max(1, originalWords.length)) * 1000) / 10;
  const rrbNetWpm = eduquityNetWpm;
  const cpctNetSpeed = Math.round((correctWords / timeTakenMinutes) * 10) / 10;

  let cpctBand: string | undefined;
  if (cpctNetSpeed >= 60) {
    cpctBand = 'Level 1 (80%+ / 60+ WPM)';
  } else if (cpctNetSpeed >= 50) {
    cpctBand = 'Level 2 (70-79% / 50-59 WPM)';
  } else if (cpctNetSpeed >= 40) {
    cpctBand = 'Level 3 (60-69% / 40-49 WPM)';
  } else if (cpctNetSpeed >= 30) {
    cpctBand = 'Level 4 (50-59% / 30-39 WPM)';
  } else {
    cpctBand = 'Below Qualifying Standard';
  }

  // Model-specific qualification verdict
  let isQualified = false;
  switch (model) {
    case 'upprpb': {
      // In official UPPRPB, accuracy is evaluated on words attempted by the candidate (minimum 85%).
      // For practice tests of custom durations (5m, 10m, 15m), typedAccuracy ensures candidates aren't falsely disqualified.
      const effectiveAcc = Math.max(accuracy, typedAccuracy);
      isQualified = netWpm >= requiredSpeed && effectiveAcc >= requiredAccuracy;
      break;
    }

    case 'rrb_eduquity':
      isQualified = rrbNetWpm >= requiredSpeed;
      break;

    case 'ssc_dest': {
      // If limitErrorPercentage is set > 0, use it. Otherwise, default strictly to official SSC gazette limits:
      // SSC CHSL: 7.0% max error for UR (10% reserved). SSC CGL: 5.0% for DEST. Default: 7.0%.
      const permissibleError = (input.limitErrorPercentage && input.limitErrorPercentage > 0)
        ? input.limitErrorPercentage
        : (input.examProfileTitle?.includes('CHSL') ? 7.0 : (input.examProfileTitle?.includes('CGL') ? 5.0 : 7.0));
      isQualified = sscErrorPercentage <= permissibleError && netWpm >= (requiredSpeed > 0 ? requiredSpeed : 25);
      break;
    }

    case 'court_delhi': {
      const courtErrorRate = Math.round((equivalentErrors / Math.max(1, typedWords.length)) * 1000) / 10;
      isQualified = netWpm >= requiredSpeed && courtErrorRate <= 3.0;
      break;
    }

    case 'court_ahc':
      isQualified = netWpm >= requiredSpeed && courtMarks >= 25.0;
      break;

    case 'court_phhc': {
      const phhcSpeed = Math.max(0, Math.round(((typedWords.length - equivalentErrors) / timeTakenMinutes) * 10) / 10);
      isQualified = phhcSpeed >= requiredSpeed;
      break;
    }

    case 'mp_cpct':
      isQualified = cpctNetSpeed >= requiredSpeed;
      break;

    case 'standard':
    default:
      isQualified = netWpm >= requiredSpeed && typedAccuracy >= (requiredAccuracy || 85.0);
      break;
  }

  const examTitle = input.examProfileTitle || (input.category === 'up_police_asi' ? 'UP Police ASI' : 'UP Police Computer Operator');

  return {
    testId: input.testId,
    testTitle: input.testTitle,
    language: input.language,
    category: input.category,
    examProfileTitle: examTitle,
    calculationModel: model,
    inputType: input.inputType,
    inputLimit: input.inputLimit,
    courtMarks,
    sscErrorPercentage,
    rrbNetWpm,
    cpctBand,
    timeAllowedMinutes: input.timeAllowedMinutes,
    timeTakenSeconds: input.timeTakenSeconds,
    totalKeystrokes,
    backspaceCount: input.backspaceCount,
    totalOriginalWords: originalWords.length,
    totalTypedWords: typedWords.length,
    correctWords,
    incorrectWords: fullMistakes,
    skippedWords: skippedWords.length,
    grossWpm,
    netWpm,
    accuracy,
    typedAccuracy,
    completionRate,
    equivalentErrors,
    allowedErrors,
    excessMistakes,
    penaltyWords,
    eduquityNetWpm,
    fullMistakes,
    halfMistakes,
    errorPercentage,
    isQualified,
    qualificationCriteria: {
      requiredSpeed,
      requiredAccuracy,
      achievedSpeed: model === 'rrb_eduquity' ? rrbNetWpm : (model === 'mp_cpct' ? cpctNetSpeed : netWpm),
      achievedAccuracy: model === 'ssc_dest' ? (100 - sscErrorPercentage) : Math.max(accuracy, typedAccuracy),
      examTitle
    },
    wrongWordsList: Array.from(new Set(wrongWordsList)),
    weakKeys: extractWeakKeys(wrongWordsList, input.language),
    diffHtml: diffParts.join(' '),
    originalText: input.originalText,
    typedText: input.typedText,
    timestamp: new Date().toISOString()
  };
}
