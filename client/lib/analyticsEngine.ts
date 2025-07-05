import {
  LearningInsight,
  PerformanceMetrics,
  StudyPattern,
  CardDifficulty,
  LearningGoal,
  StudyRecommendation,
  LearningTrend,
  PredictiveAnalytics,
  ComparisonAnalytics,
  AnalyticsDashboard,
} from "@/types/analytics";
import { StudySession, UserStats, CardProgress } from "@/types/scoring";
import { getProgressStorage } from "@/lib/progressStorage";

const ANALYTICS_STORAGE_KEY = "lam_quiz_analytics";
const GOALS_STORAGE_KEY = "lam_quiz_learning_goals";

export class AnalyticsEngine {
  private storage = getProgressStorage();

  // Generate comprehensive analytics dashboard
  public generateDashboard(userId: string = "default"): AnalyticsDashboard {
    const userStats = this.storage.getUserStats(userId);
    const sessions = this.storage.getStudySessions(userId);
    const cardProgress = this.storage.getAllCardProgress(userId);

    return {
      userId,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(userStats, sessions),
      insights: this.generateInsights(userStats, sessions, cardProgress),
      metrics: this.calculatePerformanceMetrics(sessions, cardProgress),
      patterns: this.identifyStudyPatterns(sessions),
      goals: this.getLearningGoals(userId),
      recommendations: this.generateRecommendations(
        userStats,
        sessions,
        cardProgress,
      ),
      trends: this.calculateTrends(sessions),
      predictions: this.generatePredictions(cardProgress, sessions),
      comparisons: this.generateComparisons(userStats, sessions),
    };
  }

  // Generate summary statistics
  private generateSummary(userStats: UserStats, sessions: StudySession[]) {
    const totalStudyTime = sessions.reduce((total, session) => {
      if (session.endTime) {
        return (
          total +
          (new Date(session.endTime).getTime() -
            new Date(session.startTime).getTime())
        );
      }
      return total;
    }, 0);

    return {
      totalStudyTime: Math.round(totalStudyTime / (1000 * 60)), // Convert to minutes
      cardsStudied: userStats.totalCardsStudied,
      setsCompleted: sessions.filter((s) => s.endTime).length,
      currentStreak: userStats.currentStreak,
      overallAccuracy: userStats.averageAccuracy,
    };
  }

  // Generate learning insights
  private generateInsights(
    userStats: UserStats,
    sessions: StudySession[],
    cardProgress: CardProgress[],
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Accuracy insights
    if (userStats.averageAccuracy < 0.7) {
      insights.push({
        id: `insight_accuracy_${Date.now()}`,
        type: "weakness",
        title: "Low Accuracy Detected",
        description: `Your overall accuracy is ${Math.round(userStats.averageAccuracy * 100)}%. Consider reviewing material more thoroughly before testing.`,
        severity: "high",
        actionable: true,
        metadata: {
          confidence: 0.9,
          dataPoints: sessions.length,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Study streak insights
    if (userStats.currentStreak >= 7) {
      insights.push({
        id: `insight_streak_${Date.now()}`,
        type: "strength",
        title: "Excellent Study Streak!",
        description: `You've maintained a ${userStats.currentStreak}-day study streak. Keep up the consistent practice!`,
        severity: "low",
        actionable: false,
        metadata: {
          confidence: 1.0,
          dataPoints: userStats.currentStreak,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Difficult cards insight
    const difficultCards = cardProgress.filter(
      (cp) => cp.correctAttempts / cp.attempts < 0.5,
    );
    if (difficultCards.length > 5) {
      insights.push({
        id: `insight_difficult_${Date.now()}`,
        type: "weakness",
        title: "Multiple Challenging Cards",
        description: `You have ${difficultCards.length} cards with low accuracy. Focus on these for improvement.`,
        severity: "medium",
        actionable: true,
        metadata: {
          confidence: 0.8,
          dataPoints: difficultCards.length,
          relatedCards: difficultCards.map((cp) => cp.cardId).slice(0, 10),
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Time-based patterns
    const recentSessions = sessions.filter(
      (s) =>
        new Date(s.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );

    if (recentSessions.length === 0) {
      insights.push({
        id: `insight_inactive_${Date.now()}`,
        type: "pattern",
        title: "Study Break Detected",
        description:
          "You haven't studied in the past week. Regular practice helps maintain retention.",
        severity: "medium",
        actionable: true,
        metadata: {
          confidence: 1.0,
          dataPoints: 0,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  // Calculate performance metrics
  private calculatePerformanceMetrics(
    sessions: StudySession[],
    cardProgress: CardProgress[],
  ): PerformanceMetrics {
    // Accuracy calculations
    const overallAccuracy =
      cardProgress.length > 0
        ? cardProgress.reduce(
            (sum, cp) => sum + cp.correctAttempts / cp.attempts,
            0,
          ) / cardProgress.length
        : 0;

    const accuracyTrend = this.calculateAccuracyTrend(sessions);

    // Speed calculations
    const averageResponseTime =
      cardProgress.length > 0
        ? cardProgress.reduce((sum, cp) => sum + cp.averageResponseTime, 0) /
          cardProgress.length
        : 0;

    const speedTrend = this.calculateSpeedTrend(sessions);

    // Retention calculations (simplified)
    const retention = this.calculateRetention(cardProgress);

    // Engagement calculations
    const engagement = this.calculateEngagement(sessions);

    return {
      accuracy: {
        overall: overallAccuracy,
        trend: accuracyTrend,
        bySet: this.calculateAccuracyBySet(cardProgress),
        byCategory: [], // Would implement with category data
      },
      speed: {
        averageResponseTime,
        trend: speedTrend,
        byQuestionType: [], // Would implement with question type data
      },
      retention,
      engagement,
    };
  }

  private calculateAccuracyTrend(sessions: StudySession[]): number[] {
    // Calculate daily accuracy for the last 30 days
    const dailyAccuracy: number[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const daySessions = sessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.toDateString() === date.toDateString();
      });

      const dayAccuracy =
        daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.accuracy, 0) /
            daySessions.length
          : 0;

      dailyAccuracy.push(dayAccuracy);
    }

    return dailyAccuracy;
  }

  private calculateSpeedTrend(sessions: StudySession[]): number[] {
    // Simplified speed trend calculation
    return sessions
      .slice(-30)
      .map(
        (s) =>
          s.cardsStudied /
          ((new Date(s.endTime || s.startTime).getTime() -
            new Date(s.startTime).getTime()) /
            60000),
      );
  }

  private calculateAccuracyBySet(
    cardProgress: CardProgress[],
  ): { setId: string; accuracy: number }[] {
    const setAccuracy: { [setId: string]: { correct: number; total: number } } =
      {};

    cardProgress.forEach((cp) => {
      if (!setAccuracy[cp.setId]) {
        setAccuracy[cp.setId] = { correct: 0, total: 0 };
      }
      setAccuracy[cp.setId].correct += cp.correctAttempts;
      setAccuracy[cp.setId].total += cp.attempts;
    });

    return Object.entries(setAccuracy).map(([setId, data]) => ({
      setId,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
    }));
  }

  private calculateRetention(cardProgress: CardProgress[]) {
    // Simplified retention calculation
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const shortTerm =
      cardProgress.filter(
        (cp) => new Date(cp.lastStudied).getTime() > oneDayAgo,
      ).length / Math.max(cardProgress.length, 1);

    const mediumTerm =
      cardProgress.filter(
        (cp) => new Date(cp.lastStudied).getTime() > oneWeekAgo,
      ).length / Math.max(cardProgress.length, 1);

    const longTerm =
      cardProgress.filter(
        (cp) => new Date(cp.lastStudied).getTime() > oneMonthAgo,
      ).length / Math.max(cardProgress.length, 1);

    // Generate forgetting curve data
    const forgettingCurve = [];
    for (let day = 1; day <= 30; day++) {
      const cutoff = now - day * 24 * 60 * 60 * 1000;
      const retained =
        cardProgress.filter((cp) => new Date(cp.lastStudied).getTime() > cutoff)
          .length / Math.max(cardProgress.length, 1);
      forgettingCurve.push({ day, retention: retained });
    }

    return {
      shortTerm,
      mediumTerm,
      longTerm,
      forgettingCurve,
    };
  }

  private calculateEngagement(sessions: StudySession[]) {
    const studySessions = sessions.length;
    const totalStudyTime = sessions.reduce((total, session) => {
      if (session.endTime) {
        return (
          total +
          (new Date(session.endTime).getTime() -
            new Date(session.startTime).getTime())
        );
      }
      return total;
    }, 0);

    // Calculate streak
    const sortedSessions = sessions
      .filter((s) => s.endTime)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );

    let streakDays = 0;
    let lastStudyDate: Date | null = null;

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);

      if (!lastStudyDate) {
        lastStudyDate = sessionDate;
        streakDays = 1;
      } else {
        const dayDiff =
          (lastStudyDate.getTime() - sessionDate.getTime()) /
          (24 * 60 * 60 * 1000);
        if (dayDiff === 1) {
          streakDays++;
          lastStudyDate = sessionDate;
        } else {
          break;
        }
      }
    }

    // Calculate active hours
    const activeHours: { hour: number; sessions: number }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourSessions = sessions.filter(
        (s) => new Date(s.startTime).getHours() === hour,
      ).length;
      activeHours.push({ hour, sessions: hourSessions });
    }

    return {
      studySessions,
      totalStudyTime: Math.round(totalStudyTime / 60000), // Convert to minutes
      streakDays,
      activeHours,
    };
  }

  // Identify study patterns
  private identifyStudyPatterns(sessions: StudySession[]): StudyPattern[] {
    const patterns: StudyPattern[] = [];

    // Time of day pattern
    const hourCounts: { [hour: number]: number } = {};
    sessions.forEach((session) => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const preferredHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    if (preferredHours.length > 0) {
      patterns.push({
        id: `pattern_time_${Date.now()}`,
        name: "Preferred Study Time",
        description: `You tend to study most effectively at ${preferredHours.map((h) => `${h}:00`).join(", ")}`,
        frequency: hourCounts[preferredHours[0]] / sessions.length,
        pattern: {
          timeOfDay: preferredHours,
          daysOfWeek: this.getPreferredDays(sessions),
          sessionDuration: this.getAverageSessionDuration(sessions),
          cardsPerSession: this.getAverageCardsPerSession(sessions),
        },
        effectiveness: {
          accuracyScore: this.calculatePatternAccuracy(
            sessions,
            preferredHours,
          ),
          retentionScore: 0.8, // Simplified
          speedScore: 0.75, // Simplified
        },
        suggestions: [
          "Continue studying during your peak hours for best results",
          "Consider shorter, more frequent sessions during off-peak times",
        ],
      });
    }

    return patterns;
  }

  private getPreferredDays(sessions: StudySession[]): number[] {
    const dayCounts: { [day: number]: number } = {};
    sessions.forEach((session) => {
      const day = new Date(session.startTime).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day));
  }

  private getAverageSessionDuration(sessions: StudySession[]): number {
    const completedSessions = sessions.filter((s) => s.endTime);
    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, session) => {
      return (
        sum +
        (new Date(session.endTime!).getTime() -
          new Date(session.startTime).getTime())
      );
    }, 0);

    return Math.round(totalDuration / (completedSessions.length * 60000)); // Minutes
  }

  private getAverageCardsPerSession(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0;
    return Math.round(
      sessions.reduce((sum, s) => sum + s.cardsStudied, 0) / sessions.length,
    );
  }

  private calculatePatternAccuracy(
    sessions: StudySession[],
    hours: number[],
  ): number {
    const patternSessions = sessions.filter((s) =>
      hours.includes(new Date(s.startTime).getHours()),
    );

    if (patternSessions.length === 0) return 0;
    return (
      patternSessions.reduce((sum, s) => sum + s.accuracy, 0) /
      patternSessions.length
    );
  }

  // Generate study recommendations
  private generateRecommendations(
    userStats: UserStats,
    sessions: StudySession[],
    cardProgress: CardProgress[],
  ): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];

    // Accuracy-based recommendations
    if (userStats.averageAccuracy < 0.7) {
      recommendations.push({
        id: `rec_accuracy_${Date.now()}`,
        type: "session",
        priority: "high",
        title: "Focus on Review Sessions",
        description:
          "Your accuracy could be improved with more review sessions before testing.",
        reasoning: `Current accuracy: ${Math.round(userStats.averageAccuracy * 100)}%`,
        action: {
          type: "review_session",
          params: { duration: 15, focus: "weak_cards" },
        },
        estimatedBenefit: {
          accuracyImprovement: 15,
          retentionImprovement: 10,
          timeToComplete: 15,
        },
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // Difficult cards recommendations
    const difficultCards = cardProgress.filter(
      (cp) => cp.correctAttempts / cp.attempts < 0.5,
    );
    if (difficultCards.length > 0) {
      recommendations.push({
        id: `rec_difficult_${Date.now()}`,
        type: "card",
        priority: "medium",
        title: "Practice Difficult Cards",
        description: `Focus on ${Math.min(5, difficultCards.length)} cards that need the most work.`,
        reasoning: `${difficultCards.length} cards have accuracy below 50%`,
        action: {
          type: "practice_cards",
          params: {
            cardIds: difficultCards.slice(0, 5).map((cp) => cp.cardId),
          },
        },
        estimatedBenefit: {
          accuracyImprovement: 20,
          retentionImprovement: 15,
          timeToComplete: 10,
        },
        validUntil: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // Study frequency recommendations
    const recentSessions = sessions.filter(
      (s) =>
        new Date(s.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );

    if (recentSessions.length < 3) {
      recommendations.push({
        id: `rec_frequency_${Date.now()}`,
        type: "schedule",
        priority: "medium",
        title: "Increase Study Frequency",
        description:
          "Regular practice sessions will improve retention and performance.",
        reasoning: `Only ${recentSessions.length} sessions this week`,
        action: {
          type: "schedule_sessions",
          params: { frequency: "daily", duration: 10 },
        },
        estimatedBenefit: {
          accuracyImprovement: 10,
          retentionImprovement: 25,
          timeToComplete: 10,
        },
        validUntil: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    return recommendations;
  }

  // Calculate learning trends
  private calculateTrends(sessions: StudySession[]): LearningTrend[] {
    const trends: LearningTrend[] = [];

    // Daily accuracy trend
    const dailyAccuracy = this.calculateDailyMetric(sessions, "accuracy");
    if (dailyAccuracy.length >= 7) {
      const trend = this.determineTrend(dailyAccuracy.map((d) => d.value));
      trends.push({
        period: "daily",
        metric: "accuracy",
        data: dailyAccuracy,
        trend,
        significance: this.calculateTrendSignificance(
          dailyAccuracy.map((d) => d.value),
        ),
      });
    }

    // Weekly session count trend
    const weeklySessions = this.calculateWeeklyMetric(sessions, "count");
    if (weeklySessions.length >= 4) {
      const trend = this.determineTrend(weeklySessions.map((d) => d.value));
      trends.push({
        period: "weekly",
        metric: "study_sessions",
        data: weeklySessions,
        trend,
        significance: this.calculateTrendSignificance(
          weeklySessions.map((d) => d.value),
        ),
      });
    }

    return trends;
  }

  private calculateDailyMetric(sessions: StudySession[], metric: string) {
    const dailyData: { date: string; value: number; change?: number }[] = [];
    const last30Days = 30;

    for (let i = 0; i < last30Days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];

      const daySessions = sessions.filter(
        (s) => new Date(s.startTime).toDateString() === date.toDateString(),
      );

      let value = 0;
      if (metric === "accuracy" && daySessions.length > 0) {
        value =
          daySessions.reduce((sum, s) => sum + s.accuracy, 0) /
          daySessions.length;
      }

      dailyData.unshift({ date: dateStr, value });
    }

    // Calculate changes
    for (let i = 1; i < dailyData.length; i++) {
      dailyData[i].change = dailyData[i].value - dailyData[i - 1].value;
    }

    return dailyData;
  }

  private calculateWeeklyMetric(sessions: StudySession[], metric: string) {
    const weeklyData: { date: string; value: number; change?: number }[] = [];
    const last12Weeks = 12;

    for (let i = 0; i < last12Weeks; i++) {
      const weekStart = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekSessions = sessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      let value = 0;
      if (metric === "count") {
        value = weekSessions.length;
      }

      weeklyData.unshift({
        date: weekStart.toISOString().split("T")[0],
        value,
      });
    }

    return weeklyData;
  }

  private determineTrend(
    values: number[],
  ): "improving" | "declining" | "stable" {
    if (values.length < 2) return "stable";

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.05) return "improving";
    if (change < -0.05) return "declining";
    return "stable";
  }

  private calculateTrendSignificance(values: number[]): number {
    // Simplified significance calculation based on consistency
    if (values.length < 3) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation means more consistent trend
    return Math.max(0, 1 - stdDev / mean);
  }

  // Generate predictions
  private generatePredictions(
    cardProgress: CardProgress[],
    sessions: StudySession[],
  ): PredictiveAnalytics {
    // Simplified prediction algorithms
    return {
      masteryPrediction: this.predictMastery(cardProgress),
      forgettingRisk: this.assessForgettingRisk(cardProgress),
      optimalScheduling: this.calculateOptimalScheduling(
        sessions,
        cardProgress,
      ),
    };
  }

  private predictMastery(cardProgress: CardProgress[]) {
    return cardProgress
      .filter((cp) => cp.correctAttempts / cp.attempts < 0.8) // Not yet mastered
      .map((cp) => {
        const accuracy = cp.correctAttempts / cp.attempts;
        const improvementRate = 0.1; // Simplified
        const sessionsNeeded = Math.ceil((0.8 - accuracy) / improvementRate);
        const estimatedDate = new Date(
          Date.now() + sessionsNeeded * 24 * 60 * 60 * 1000,
        );

        return {
          cardId: cp.cardId,
          estimatedMasteryDate: estimatedDate.toISOString(),
          confidence: Math.min(0.9, accuracy + 0.3),
          requiredSessions: sessionsNeeded,
        };
      });
  }

  private assessForgettingRisk(cardProgress: CardProgress[]) {
    const now = Date.now();

    return cardProgress.map((cp) => {
      const daysSinceStudied =
        (now - new Date(cp.lastStudied).getTime()) / (24 * 60 * 60 * 1000);
      const accuracy = cp.correctAttempts / cp.attempts;

      let riskLevel: "low" | "medium" | "high" = "low";
      if (daysSinceStudied > 7 && accuracy < 0.7) riskLevel = "high";
      else if (daysSinceStudied > 3 && accuracy < 0.8) riskLevel = "medium";

      const estimatedForgettingDate = new Date(
        now + accuracy * 14 * 24 * 60 * 60 * 1000,
      );

      return {
        cardId: cp.cardId,
        riskLevel,
        estimatedForgettingDate: estimatedForgettingDate.toISOString(),
        reviewRecommended: riskLevel !== "low",
      };
    });
  }

  private calculateOptimalScheduling(
    sessions: StudySession[],
    cardProgress: CardProgress[],
  ) {
    // Find optimal time based on past performance
    const hourPerformance: { [hour: number]: number } = {};

    sessions.forEach((session) => {
      const hour = new Date(session.startTime).getHours();
      if (!hourPerformance[hour]) hourPerformance[hour] = 0;
      hourPerformance[hour] += session.accuracy;
    });

    const bestHour = Object.entries(hourPerformance).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0];

    const nextStudySession = new Date();
    if (bestHour) {
      nextStudySession.setHours(parseInt(bestHour), 0, 0, 0);
      if (nextStudySession <= new Date()) {
        nextStudySession.setDate(nextStudySession.getDate() + 1);
      }
    }

    // Recommend cards that need review
    const cardsNeedingReview = cardProgress
      .filter((cp) => {
        const daysSince =
          (Date.now() - new Date(cp.lastStudied).getTime()) /
          (24 * 60 * 60 * 1000);
        return daysSince > 2 || cp.correctAttempts / cp.attempts < 0.7;
      })
      .slice(0, 10)
      .map((cp) => cp.cardId);

    return {
      nextStudySession: nextStudySession.toISOString(),
      recommendedDuration: 20,
      recommendedCards: cardsNeedingReview,
      reasoning: bestHour
        ? `${bestHour}:00 is your most productive study time`
        : "Based on your study patterns and card difficulty",
    };
  }

  // Generate comparison analytics
  private generateComparisons(
    userStats: UserStats,
    sessions: StudySession[],
  ): ComparisonAnalytics {
    // Simplified comparison with synthetic peer data
    const peerAverageAccuracy = 0.75;
    const peerAverageSpeed = 3.5; // cards per minute

    const userAccuracy = userStats.averageAccuracy;
    const userSpeed =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.cardsStudied, 0) / sessions.length
        : 0;

    const percentile = Math.round(
      (userAccuracy / peerAverageAccuracy) * 50 + 25,
    );

    return {
      peer: {
        percentile: Math.min(95, Math.max(5, percentile)),
        averageAccuracy: peerAverageAccuracy,
        averageSpeed: peerAverageSpeed,
        strengthAreas: userAccuracy > peerAverageAccuracy ? ["Accuracy"] : [],
        improvementAreas:
          userAccuracy < peerAverageAccuracy ? ["Accuracy"] : [],
      },
      historical: {
        accuracyImprovement: this.calculateImprovement(sessions, "accuracy"),
        speedImprovement: this.calculateImprovement(sessions, "speed"),
        consistencyScore: this.calculateConsistency(sessions),
        milestones: this.identifyMilestones(userStats, sessions),
      },
    };
  }

  private calculateImprovement(
    sessions: StudySession[],
    metric: string,
  ): number {
    if (sessions.length < 10) return 0;

    const firstTen = sessions.slice(0, 10);
    const lastTen = sessions.slice(-10);

    if (metric === "accuracy") {
      const firstAvg =
        firstTen.reduce((sum, s) => sum + s.accuracy, 0) / firstTen.length;
      const lastAvg =
        lastTen.reduce((sum, s) => sum + s.accuracy, 0) / lastTen.length;
      return ((lastAvg - firstAvg) / firstAvg) * 100;
    }

    return 0;
  }

  private calculateConsistency(sessions: StudySession[]): number {
    if (sessions.length < 5) return 0;

    const accuracies = sessions.map((s) => s.accuracy);
    const mean = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
    const variance =
      accuracies.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) /
      accuracies.length;

    return Math.max(0, 1 - Math.sqrt(variance));
  }

  private identifyMilestones(userStats: UserStats, sessions: StudySession[]) {
    const milestones = [];

    if (userStats.currentStreak >= 7) {
      milestones.push({
        date: new Date().toISOString(),
        achievement: "Week-long Study Streak",
        metric: "consistency",
        value: userStats.currentStreak,
      });
    }

    if (userStats.averageAccuracy >= 0.9) {
      milestones.push({
        date: new Date().toISOString(),
        achievement: "High Accuracy Achievement",
        metric: "accuracy",
        value: Math.round(userStats.averageAccuracy * 100),
      });
    }

    return milestones;
  }

  // Learning Goals Management
  public getLearningGoals(userId: string = "default"): LearningGoal[] {
    try {
      const goals = localStorage.getItem(`${GOALS_STORAGE_KEY}_${userId}`);
      return goals ? JSON.parse(goals) : this.createDefaultGoals();
    } catch (error) {
      console.error("Error loading learning goals:", error);
      return this.createDefaultGoals();
    }
  }

  public saveLearningGoals(
    goals: LearningGoal[],
    userId: string = "default",
  ): void {
    try {
      localStorage.setItem(
        `${GOALS_STORAGE_KEY}_${userId}`,
        JSON.stringify(goals),
      );
    } catch (error) {
      console.error("Error saving learning goals:", error);
    }
  }

  private createDefaultGoals(): LearningGoal[] {
    return [
      {
        id: `goal_accuracy_${Date.now()}`,
        title: "Achieve 80% Accuracy",
        description:
          "Maintain 80% or higher accuracy across all study sessions",
        type: "accuracy",
        target: { value: 80, unit: "%", timeframe: "ongoing" },
        current: { value: 0, progress: 0 },
        status: "active",
        createdAt: new Date().toISOString(),
      },
      {
        id: `goal_streak_${Date.now()}`,
        title: "7-Day Study Streak",
        description: "Study for 7 consecutive days",
        type: "streak",
        target: { value: 7, unit: "days", timeframe: "ongoing" },
        current: { value: 0, progress: 0 },
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

// Singleton instance
export const analyticsEngine = new AnalyticsEngine();

// Helper functions
export const generateAnalyticsDashboard = (
  userId?: string,
): AnalyticsDashboard => {
  return analyticsEngine.generateDashboard(userId);
};

export const getLearningGoals = (userId?: string): LearningGoal[] => {
  return analyticsEngine.getLearningGoals(userId);
};

export const saveLearningGoals = (
  goals: LearningGoal[],
  userId?: string,
): void => {
  analyticsEngine.saveLearningGoals(goals, userId);
};
