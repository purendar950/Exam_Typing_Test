export type Language = 'hindi_mangal' | 'hindi_kruti' | 'english';

export type ExamCategory = 'up_police_co' | 'up_police_asi' | string;

export interface ExamProfile {
  id: string;
  slug: string;
  title: string;
  categoryGroup: 'up_govt' | 'judiciary' | 'ssc' | 'delhi_govt' | 'defense' | 'bihar' | 'central_nta' | 'railways' | 'state_exams';
  language: Language;
  targetSpeed: number;
  durationMinutes: number;
  inputType: 'word' | 'character';
  inputLimit: number;
  isRetyping: boolean;
  limitErrorPercentage?: number;
  minAccuracy: number;
}

export interface UnifiedExamPost {
  id: string;
  postTitle: string;
  categoryGroup: 'up_govt' | 'judiciary' | 'ssc' | 'delhi_govt' | 'defense' | 'bihar' | 'central_nta' | 'railways' | 'state_exams';
  examType: string;
  examTypeLabel: string;
  organization: string;
  variants: ExamProfile[];
}

export interface SubCategoryFilter {
  id: string;
  label: string;
}

export interface Passage {
  id: string;
  testNumber?: number;
  title: string;
  language: Language;
  category: ExamCategory;
  categoryGroup?: string;
  examSlug?: string;
  duration: number; // in minutes (default 15 for UP Police CO / ASI)
  wordCount: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  date?: string; // YYYY-MM-DD format for date-wise tests
}

export interface TestSettings {
  highlightEnabled: boolean;
  autoScroll: boolean;
  soundEnabled: boolean;
  backspaceEnabled: boolean;
  fullScreenEnabled: boolean;
  fontSize: number; // 14 to 28
  autoStartTimer: boolean;
  candidateName?: string;
}

export interface EvaluationResult {
  testId: string;
  testTitle: string;
  language: Language;
  category: ExamCategory;
  examProfileTitle?: string;
  timeAllowedMinutes: number;
  timeTakenSeconds: number;
  totalKeystrokes: number;
  backspaceCount: number;
  totalOriginalWords: number;
  totalTypedWords: number;
  correctWords: number;
  incorrectWords: number;
  skippedWords: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  fullMistakes: number;
  halfMistakes: number;
  errorPercentage: number;
  isQualified: boolean;
  qualificationCriteria: {
    requiredSpeed: number;
    requiredAccuracy: number;
    achievedSpeed: number;
    achievedAccuracy: number;
    examTitle?: string;
  };
  wrongWordsList: string[];
  weakKeys?: WeakKeyStat[];
  diffHtml: string;
  originalText: string;
  typedText: string;
  timestamp: string;
}

export interface WeakKeyStat {
  character: string;
  mistakeCount: number;
  fingerHint?: string;
  keyCombo?: string;
}

export interface DiffToken {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  word: string;
  typed?: string;
}
