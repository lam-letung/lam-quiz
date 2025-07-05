export interface StudySession {
  id: string;
  setId: string;
  userId?: string;
  mode: StudyMode;
  score: number;
  accuracy: number;
  timeSpent: number; // in seconds
  createdAt: string;
  results: QuizResult[];
  cardProgress: CardProgress[];
}

export interface CardProgress {
  id: string;
  cardId: string;
  sessionId: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  attempts: number;
  lastReviewAt: string;
}

export interface UserStats {
  id: string;
  userId: string;
  totalScore: number;
  totalSessions: number;
  averageScore: number;
  streak: number;
  level: UserLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CardReview {
  id: string;
  cardId: string;
  userId?: string;
  difficulty: number; // 1-5
  interval: number; // days
  nextReview: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeakCard {
  id: string;
  cardId: string;
  userId?: string;
  mistakes: number;
  lastMiss: string;
}

export type StudyMode = "FLASHCARD" | "TEST" | "MATCH" | "REVIEW";

export type UserLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface ScoreConfig {
  correctAnswer: number; // +10 points
  incorrectAnswer: number; // -5 points (but never below 0)
  timeBonus: {
    fast: number; // +5 points (< 3 seconds)
    normal: number; // +3 points (3-5 seconds)
    slow: number; // +1 point (5-10 seconds)
    timeout: number; // 0 points (> 10 seconds)
  };
  streakBonus: {
    threshold: number; // every 5 correct answers
    bonus: number; // +2 points
  };
}

export interface LevelThresholds {
  Beginner: number; // 0-100
  Intermediate: number; // 101-300
  Advanced: number; // 301-500
  Expert: number; // 500+
}

export interface SessionResult {
  session: StudySession;
  score: number;
  accuracy: number;
  streak: number;
  levelBefore: UserLevel;
  levelAfter: UserLevel;
  pointsEarned: number;
  timeBonus: number;
  streakBonus: number;
}

export interface StudyStatistics {
  totalStudyTime: number; // in minutes
  totalCards: number;
  masteredCards: number;
  averageAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  weakCards: string[]; // card IDs
  strongCards: string[]; // card IDs
  dailyProgress: DailyProgress[];
}

export interface DailyProgress {
  date: string;
  score: number;
  cardsStudied: number;
  timeSpent: number;
  accuracy: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  unlockedAt?: string;
}

export interface AchievementCondition {
  type: "score" | "streak" | "sessions" | "time" | "accuracy";
  value: number;
  operator: "gte" | "lte" | "eq";
}
