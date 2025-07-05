import {
  ScoreConfig,
  LevelThresholds,
  UserLevel,
  StudySession,
  CardProgress,
  UserStats,
  SessionResult,
  StudyMode,
} from "@/types/scoring";
import { generateId } from "./storage";

export const SCORE_CONFIG: ScoreConfig = {
  correctAnswer: 10,
  incorrectAnswer: -5,
  timeBonus: {
    fast: 5, // < 3 seconds
    normal: 3, // 3-5 seconds
    slow: 1, // 5-10 seconds
    timeout: 0, // > 10 seconds
  },
  streakBonus: {
    threshold: 5, // every 5 correct answers
    bonus: 2,
  },
};

export const LEVEL_THRESHOLDS: LevelThresholds = {
  Beginner: 100,
  Intermediate: 300,
  Advanced: 500,
  Expert: Infinity,
};

export class ScoringService {
  /**
   * Calculate points for a single answer
   */
  static calculateAnswerScore(
    isCorrect: boolean,
    timeSpent: number,
    streak: number = 0,
  ): {
    baseScore: number;
    timeBonus: number;
    streakBonus: number;
    totalScore: number;
  } {
    const baseScore = isCorrect
      ? SCORE_CONFIG.correctAnswer
      : SCORE_CONFIG.incorrectAnswer;

    let timeBonus = 0;
    if (isCorrect) {
      if (timeSpent < 3) {
        timeBonus = SCORE_CONFIG.timeBonus.fast;
      } else if (timeSpent < 5) {
        timeBonus = SCORE_CONFIG.timeBonus.normal;
      } else if (timeSpent < 10) {
        timeBonus = SCORE_CONFIG.timeBonus.slow;
      } else {
        timeBonus = SCORE_CONFIG.timeBonus.timeout;
      }
    }

    const streakBonus =
      isCorrect &&
      streak > 0 &&
      streak % SCORE_CONFIG.streakBonus.threshold === 0
        ? SCORE_CONFIG.streakBonus.bonus
        : 0;

    const totalScore = Math.max(0, baseScore + timeBonus + streakBonus);

    return {
      baseScore,
      timeBonus,
      streakBonus,
      totalScore,
    };
  }

  /**
   * Calculate session results
   */
  static calculateSessionScore(cardProgresses: CardProgress[]): {
    totalScore: number;
    accuracy: number;
    correctAnswers: number;
    totalAnswers: number;
    averageTime: number;
    streakCount: number;
    timeBonus: number;
    streakBonus: number;
  } {
    let totalScore = 0;
    let correctAnswers = 0;
    let totalTime = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let totalTimeBonus = 0;
    let totalStreakBonus = 0;

    cardProgresses.forEach((progress) => {
      const scoreResult = this.calculateAnswerScore(
        progress.isCorrect,
        progress.timeSpent,
        currentStreak,
      );

      totalScore += scoreResult.totalScore;
      totalTimeBonus += scoreResult.timeBonus;
      totalStreakBonus += scoreResult.streakBonus;
      totalTime += progress.timeSpent;

      if (progress.isCorrect) {
        correctAnswers++;
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    const accuracy =
      cardProgresses.length > 0 ? correctAnswers / cardProgresses.length : 0;
    const averageTime =
      cardProgresses.length > 0 ? totalTime / cardProgresses.length : 0;

    return {
      totalScore,
      accuracy: Math.round(accuracy * 100) / 100,
      correctAnswers,
      totalAnswers: cardProgresses.length,
      averageTime: Math.round(averageTime * 100) / 100,
      streakCount: maxStreak,
      timeBonus: totalTimeBonus,
      streakBonus: totalStreakBonus,
    };
  }

  /**
   * Determine user level based on total score
   */
  static getUserLevel(totalScore: number): UserLevel {
    if (totalScore <= LEVEL_THRESHOLDS.Beginner) {
      return "Beginner";
    } else if (totalScore <= LEVEL_THRESHOLDS.Intermediate) {
      return "Intermediate";
    } else if (totalScore <= LEVEL_THRESHOLDS.Advanced) {
      return "Advanced";
    } else {
      return "Expert";
    }
  }

  /**
   * Get progress to next level
   */
  static getLevelProgress(totalScore: number): {
    currentLevel: UserLevel;
    nextLevel: UserLevel | null;
    progress: number; // 0-100
    pointsToNext: number;
  } {
    const currentLevel = this.getUserLevel(totalScore);

    let nextThreshold: number;
    let currentThreshold: number;
    let nextLevel: UserLevel | null;

    switch (currentLevel) {
      case "Beginner":
        currentThreshold = 0;
        nextThreshold = LEVEL_THRESHOLDS.Beginner;
        nextLevel = "Intermediate";
        break;
      case "Intermediate":
        currentThreshold = LEVEL_THRESHOLDS.Beginner;
        nextThreshold = LEVEL_THRESHOLDS.Intermediate;
        nextLevel = "Advanced";
        break;
      case "Advanced":
        currentThreshold = LEVEL_THRESHOLDS.Intermediate;
        nextThreshold = LEVEL_THRESHOLDS.Advanced;
        nextLevel = "Expert";
        break;
      case "Expert":
        currentThreshold = LEVEL_THRESHOLDS.Advanced;
        nextThreshold = Infinity;
        nextLevel = null;
        break;
    }

    const progress =
      nextLevel === null
        ? 100
        : Math.round(
            ((totalScore - currentThreshold) /
              (nextThreshold - currentThreshold)) *
              100,
          );

    const pointsToNext =
      nextLevel === null ? 0 : Math.max(0, nextThreshold - totalScore);

    return {
      currentLevel,
      nextLevel,
      progress: Math.min(100, Math.max(0, progress)),
      pointsToNext,
    };
  }

  /**
   * Create a new study session
   */
  static createStudySession(
    setId: string,
    mode: StudyMode,
    userId?: string,
  ): StudySession {
    return {
      id: generateId(),
      setId,
      userId,
      mode,
      score: 0,
      accuracy: 0,
      timeSpent: 0,
      createdAt: new Date().toISOString(),
      results: [],
      cardProgress: [],
    };
  }

  /**
   * Complete a study session and calculate final results
   */
  static completeSession(
    session: StudySession,
    cardProgresses: CardProgress[],
    currentUserStats?: UserStats,
  ): SessionResult {
    const sessionStats = this.calculateSessionScore(cardProgresses);

    const updatedSession: StudySession = {
      ...session,
      score: sessionStats.totalScore,
      accuracy: sessionStats.accuracy,
      timeSpent: cardProgresses.reduce((sum, cp) => sum + cp.timeSpent, 0),
      cardProgress: cardProgresses,
    };

    const currentTotalScore = currentUserStats?.totalScore || 0;
    const newTotalScore = currentTotalScore + sessionStats.totalScore;

    const levelBefore = this.getUserLevel(currentTotalScore);
    const levelAfter = this.getUserLevel(newTotalScore);

    return {
      session: updatedSession,
      score: sessionStats.totalScore,
      accuracy: sessionStats.accuracy,
      streak: sessionStats.streakCount,
      levelBefore,
      levelAfter,
      pointsEarned: sessionStats.totalScore,
      timeBonus: sessionStats.timeBonus,
      streakBonus: sessionStats.streakBonus,
    };
  }

  /**
   * Update user statistics after a session
   */
  static updateUserStats(
    currentStats: UserStats | null,
    sessionResult: SessionResult,
  ): UserStats {
    const now = new Date().toISOString();

    if (!currentStats) {
      return {
        id: generateId(),
        userId: sessionResult.session.userId || "default",
        totalScore: sessionResult.pointsEarned,
        totalSessions: 1,
        averageScore: sessionResult.score,
        streak: sessionResult.streak,
        level: sessionResult.levelAfter,
        createdAt: now,
        updatedAt: now,
      };
    }

    const newTotalSessions = currentStats.totalSessions + 1;
    const newTotalScore = currentStats.totalScore + sessionResult.pointsEarned;
    const newAverageScore =
      Math.round((newTotalScore / newTotalSessions) * 100) / 100;

    return {
      ...currentStats,
      totalScore: newTotalScore,
      totalSessions: newTotalSessions,
      averageScore: newAverageScore,
      streak: Math.max(currentStats.streak, sessionResult.streak),
      level: sessionResult.levelAfter,
      updatedAt: now,
    };
  }
}

// Helper functions for localStorage integration
export const SCORING_STORAGE_KEYS = {
  USER_STATS: "lam_quiz_user_stats",
  STUDY_SESSIONS: "lam_quiz_study_sessions",
  CARD_PROGRESS: "lam_quiz_card_progress",
} as const;

export const saveUserStats = (stats: UserStats): void => {
  try {
    localStorage.setItem(
      SCORING_STORAGE_KEYS.USER_STATS,
      JSON.stringify(stats),
    );
  } catch (error) {
    console.error("Error saving user stats:", error);
  }
};

export const getUserStats = (): UserStats | null => {
  try {
    const stats = localStorage.getItem(SCORING_STORAGE_KEYS.USER_STATS);
    return stats ? JSON.parse(stats) : null;
  } catch (error) {
    console.error("Error loading user stats:", error);
    return null;
  }
};

export const saveStudySession = (session: StudySession): void => {
  try {
    const sessions = getStudySessions();
    sessions.push(session);
    localStorage.setItem(
      SCORING_STORAGE_KEYS.STUDY_SESSIONS,
      JSON.stringify(sessions),
    );
  } catch (error) {
    console.error("Error saving study session:", error);
  }
};

export const getStudySessions = (): StudySession[] => {
  try {
    const sessions = localStorage.getItem(SCORING_STORAGE_KEYS.STUDY_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error("Error loading study sessions:", error);
    return [];
  }
};
