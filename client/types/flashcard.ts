 export interface Card {
  id: string;
  term: string;
  definition: string;
  order: number;
  mastered?: boolean;
}

export interface Workplace {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardSet {
  workplaceId: string;
  id: string;
  title: string;
  description: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
  studyProgress?: StudyProgress;
}

export interface StudyProgress {
  setId: string;
  totalCards: number;
  masteredCards: number;
  lastStudied: string;
  studyStreak: number;
}

export interface QuizResult {
  id: string;
  setId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
  questionTypes: QuestionType[];
}

export interface StudySession {
  id: string;
  setId: string;
  mode: StudyMode;
  startTime: string;
  endTime?: string;
  cardsStudied: number;
  accuracy: number;
}

export type StudyMode = "flashcards" | "test" | "match" | "write";

export type QuestionType =
  | "multiple-choice"
  | "true-false"
  | "written"
  | "fill-blank";

export interface Question {
  id: string;
  cardId: string;
  type: QuestionType;
  question: string;
  correctAnswer: string;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface ImportOptions {
  delimiter: "," | "\t" | ";" | string;
  hasHeaders: boolean;
  termColumn: number;
  definitionColumn: number;
}
