import {
  StudySession,
  CardProgress,
  UserStats,
  CardReview,
  WeakCard,
  StudyStatistics,
  DailyProgress,
} from "@/types/scoring";
import { generateId } from "./storage";

const PROGRESS_STORAGE_KEYS = {
  USER_STATS: "lam_quiz_user_stats",
  STUDY_SESSIONS: "lam_quiz_study_sessions",
  CARD_PROGRESS: "lam_quiz_card_progress",
  CARD_REVIEWS: "lam_quiz_card_reviews",
  WEAK_CARDS: "lam_quiz_weak_cards",
  DAILY_PROGRESS: "lam_quiz_daily_progress",
} as const;

// User Statistics Management
export const saveUserStats = (stats: UserStats): void => {
  try {
    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.USER_STATS,
      JSON.stringify(stats),
    );
  } catch (error) {
    console.error("Error saving user stats:", error);
  }
};

export const getUserStats = (): UserStats | null => {
  try {
    const stats = localStorage.getItem(PROGRESS_STORAGE_KEYS.USER_STATS);
    return stats ? JSON.parse(stats) : null;
  } catch (error) {
    console.error("Error loading user stats:", error);
    return null;
  }
};

// Study Sessions Management
export const saveStudySession = (session: StudySession): void => {
  try {
    const sessions = getStudySessions();
    sessions.push(session);
    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.STUDY_SESSIONS,
      JSON.stringify(sessions),
    );
  } catch (error) {
    console.error("Error saving study session:", error);
  }
};

export const getStudySessions = (): StudySession[] => {
  try {
    const sessions = localStorage.getItem(PROGRESS_STORAGE_KEYS.STUDY_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error("Error loading study sessions:", error);
    return [];
  }
};

export const getStudySessionsBySetId = (setId: string): StudySession[] => {
  return getStudySessions().filter((session) => session.setId === setId);
};

// Card Progress Management
export const saveCardProgress = (progress: CardProgress[]): void => {
  try {
    const allProgress = getCardProgress();
    const newProgress = [...allProgress, ...progress];
    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.CARD_PROGRESS,
      JSON.stringify(newProgress),
    );
  } catch (error) {
    console.error("Error saving card progress:", error);
  }
};

export const getCardProgress = (): CardProgress[] => {
  try {
    const progress = localStorage.getItem(PROGRESS_STORAGE_KEYS.CARD_PROGRESS);
    return progress ? JSON.parse(progress) : [];
  } catch (error) {
    console.error("Error loading card progress:", error);
    return [];
  }
};

export const getCardProgressByCard = (cardId: string): CardProgress[] => {
  return getCardProgress().filter((progress) => progress.cardId === cardId);
};

// Card Reviews (Spaced Repetition)
export const saveCardReview = (review: CardReview): void => {
  try {
    const reviews = getCardReviews();
    const existingIndex = reviews.findIndex((r) => r.cardId === review.cardId);

    if (existingIndex >= 0) {
      reviews[existingIndex] = review;
    } else {
      reviews.push(review);
    }

    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.CARD_REVIEWS,
      JSON.stringify(reviews),
    );
  } catch (error) {
    console.error("Error saving card review:", error);
  }
};

export const getCardReviews = (): CardReview[] => {
  try {
    const reviews = localStorage.getItem(PROGRESS_STORAGE_KEYS.CARD_REVIEWS);
    return reviews ? JSON.parse(reviews) : [];
  } catch (error) {
    console.error("Error loading card reviews:", error);
    return [];
  }
};

export const getCardReview = (cardId: string): CardReview | null => {
  const reviews = getCardReviews();
  return reviews.find((review) => review.cardId === cardId) || null;
};

export const getDueCards = (): CardReview[] => {
  const reviews = getCardReviews();
  const now = new Date().toISOString();
  return reviews.filter((review) => review.nextReview <= now);
};

// Weak Cards Management
export const saveWeakCard = (weakCard: WeakCard): void => {
  try {
    const weakCards = getWeakCards();
    const existingIndex = weakCards.findIndex(
      (w) => w.cardId === weakCard.cardId,
    );

    if (existingIndex >= 0) {
      weakCards[existingIndex] = weakCard;
    } else {
      weakCards.push(weakCard);
    }

    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.WEAK_CARDS,
      JSON.stringify(weakCards),
    );
  } catch (error) {
    console.error("Error saving weak card:", error);
  }
};

export const getWeakCards = (): WeakCard[] => {
  try {
    const weakCards = localStorage.getItem(PROGRESS_STORAGE_KEYS.WEAK_CARDS);
    return weakCards ? JSON.parse(weakCards) : [];
  } catch (error) {
    console.error("Error loading weak cards:", error);
    return [];
  }
};

export const getWeakCardsByThreshold = (
  minMistakes: number = 3,
): WeakCard[] => {
  return getWeakCards().filter((weakCard) => weakCard.mistakes >= minMistakes);
};

export const removeWeakCard = (cardId: string): void => {
  try {
    const weakCards = getWeakCards().filter((w) => w.cardId !== cardId);
    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.WEAK_CARDS,
      JSON.stringify(weakCards),
    );
  } catch (error) {
    console.error("Error removing weak card:", error);
  }
};

// Daily Progress Tracking
export const saveDailyProgress = (progress: DailyProgress): void => {
  try {
    const dailyProgress = getDailyProgress();
    const existingIndex = dailyProgress.findIndex(
      (p) => p.date === progress.date,
    );

    if (existingIndex >= 0) {
      // Update existing day's progress
      dailyProgress[existingIndex] = {
        ...dailyProgress[existingIndex],
        score: dailyProgress[existingIndex].score + progress.score,
        cardsStudied:
          dailyProgress[existingIndex].cardsStudied + progress.cardsStudied,
        timeSpent: dailyProgress[existingIndex].timeSpent + progress.timeSpent,
        accuracy:
          (dailyProgress[existingIndex].accuracy + progress.accuracy) / 2,
      };
    } else {
      dailyProgress.push(progress);
    }

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = dailyProgress.filter(
      (p) => new Date(p.date) >= thirtyDaysAgo,
    );

    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.DAILY_PROGRESS,
      JSON.stringify(filtered),
    );
  } catch (error) {
    console.error("Error saving daily progress:", error);
  }
};

export const getDailyProgress = (): DailyProgress[] => {
  try {
    const progress = localStorage.getItem(PROGRESS_STORAGE_KEYS.DAILY_PROGRESS);
    return progress ? JSON.parse(progress) : [];
  } catch (error) {
    console.error("Error loading daily progress:", error);
    return [];
  }
};

// Statistics Calculation
export const calculateStudyStatistics = (): StudyStatistics => {
  const sessions = getStudySessions();
  const cardProgress = getCardProgress();
  const weakCards = getWeakCards();
  const dailyProgress = getDailyProgress();

  const totalStudyTime = Math.round(
    sessions.reduce((sum, session) => sum + session.timeSpent, 0) / 60,
  ); // in minutes

  const totalCards = cardProgress.length;
  const masteredCards = cardProgress.filter((p) => p.isCorrect).length;

  const correctAnswers = cardProgress.filter((p) => p.isCorrect).length;
  const averageAccuracy = totalCards > 0 ? correctAnswers / totalCards : 0;

  // Calculate current streak
  let currentStreak = 0;
  const sortedProgress = [...cardProgress].sort(
    (a, b) =>
      new Date(a.lastReviewAt).getTime() - new Date(b.lastReviewAt).getTime(),
  );

  for (let i = sortedProgress.length - 1; i >= 0; i--) {
    if (sortedProgress[i].isCorrect) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  for (const progress of sortedProgress) {
    if (progress.isCorrect) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Identify weak and strong cards
  const cardStats = new Map<string, { correct: number; total: number }>();
  cardProgress.forEach((progress) => {
    const stats = cardStats.get(progress.cardId) || { correct: 0, total: 0 };
    stats.total++;
    if (progress.isCorrect) stats.correct++;
    cardStats.set(progress.cardId, stats);
  });

  const strongCards: string[] = [];
  const weakCardIds: string[] = [];

  cardStats.forEach((stats, cardId) => {
    const accuracy = stats.correct / stats.total;
    if (stats.total >= 3) {
      // Need at least 3 attempts to classify
      if (accuracy >= 0.8) {
        strongCards.push(cardId);
      } else if (accuracy <= 0.5) {
        weakCardIds.push(cardId);
      }
    }
  });

  return {
    totalStudyTime,
    totalCards,
    masteredCards,
    averageAccuracy,
    currentStreak,
    longestStreak,
    weakCards: weakCardIds,
    strongCards,
    dailyProgress,
  };
};

// Cleanup old data
export const cleanupOldData = (daysToKeep: number = 90): void => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTime = cutoffDate.toISOString();

    // Clean up old sessions
    const sessions = getStudySessions().filter(
      (session) => session.createdAt >= cutoffTime,
    );
    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.STUDY_SESSIONS,
      JSON.stringify(sessions),
    );

    // Clean up old card progress
    const progress = getCardProgress().filter(
      (p) => p.lastReviewAt >= cutoffTime,
    );
    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.CARD_PROGRESS,
      JSON.stringify(progress),
    );

    // Clean up old daily progress (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDaily = getDailyProgress().filter(
      (p) => new Date(p.date) >= thirtyDaysAgo,
    );
    localStorage.setItem(
      PROGRESS_STORAGE_KEYS.DAILY_PROGRESS,
      JSON.stringify(recentDaily),
    );
  } catch (error) {
    console.error("Error cleaning up old data:", error);
  }
};

// Export all data for backup
export const exportProgressData = () => {
  const data = {
    userStats: getUserStats(),
    studySessions: getStudySessions(),
    cardProgress: getCardProgress(),
    cardReviews: getCardReviews(),
    weakCards: getWeakCards(),
    dailyProgress: getDailyProgress(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lam-quiz-progress-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
