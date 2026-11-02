export type Language = 'hindi_mangal' | 'hindi_kruti' | 'english';

export type ExamCategory = 'up_police_co' | 'upsssc_ja' | 'up_police_asi' | 'general';

export interface Passage {
  id: string;
  title: string;
  language: Language;
  category: ExamCategory;
  duration: number; // in minutes (default 15 for UP CO)
  wordCount: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TestSettings {
  highlightEnabled: boolean;
  autoScroll: boolean;
  soundEnabled: boolean;
  backspaceEnabled: boolean;
  fullScreenEnabled: boolean;
  fontSize: number; // 14 to 28
  autoStartTimer: boolean;
}

export interface EvaluationResult {
  testId: string;
  testTitle: string;
  language: Language;
  category: ExamCategory;
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
  };
  wrongWordsList: string[];
  diffHtml: string;
  originalText: string;
  typedText: string;
  timestamp: string;
}

export interface DiffToken {
  type: 'correct' | 'incorrect' | 'missing' | 'extra';
  word: string;
  typed?: string;
}
