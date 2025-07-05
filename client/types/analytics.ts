export interface LearningInsight {
  id: string;
  type: "strength" | "weakness" | "pattern" | "recommendation";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  actionable: boolean;
  metadata: {
    confidence: number;
    dataPoints: number;
    relatedSets?: string[];
    relatedCards?: string[];
  };
  createdAt: string;
}

export interface PerformanceMetrics {
  accuracy: {
    overall: number;
    trend: number[];
    bySet: { setId: string; accuracy: number }[];
    byCategory: { category: string; accuracy: number }[];
  };
  speed: {
    averageResponseTime: number;
    trend: number[];
    byQuestionType: { type: string; avgTime: number }[];
  };
  retention: {
    shortTerm: number; // 1 day
    mediumTerm: number; // 1 week
    longTerm: number; // 1 month
    forgettingCurve: { day: number; retention: number }[];
  };
  engagement: {
    studySessions: number;
    totalStudyTime: number;
    streakDays: number;
    activeHours: { hour: number; sessions: number }[];
  };
}

export interface StudyPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  pattern: {
    timeOfDay: number[];
    daysOfWeek: number[];
    sessionDuration: number;
    cardsPerSession: number;
  };
  effectiveness: {
    accuracyScore: number;
    retentionScore: number;
    speedScore: number;
  };
  suggestions: string[];
}

export interface CardDifficulty {
  cardId: string;
  setId: string;
  term: string;
  definition: string;
  difficulty: "easy" | "medium" | "hard" | "very_hard";
  metrics: {
    attempts: number;
    correctAttempts: number;
    averageResponseTime: number;
    timesToMastery: number;
    lastStudied: string;
  };
  insights: {
    commonMistakes: string[];
    confusedWith: string[];
    learningTips: string[];
  };
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  type: "accuracy" | "speed" | "mastery" | "streak" | "custom";
  target: {
    value: number;
    unit: string;
    timeframe: string;
  };
  current: {
    value: number;
    progress: number; // 0-100
  };
  status: "active" | "completed" | "paused" | "failed";
  deadline?: string;
  reward?: string;
  createdAt: string;
  completedAt?: string;
}

export interface StudyRecommendation {
  id: string;
  type: "card" | "set" | "session" | "schedule";
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  description: string;
  reasoning: string;
  action: {
    type: string;
    params: any;
  };
  estimatedBenefit: {
    accuracyImprovement: number;
    retentionImprovement: number;
    timeToComplete: number;
  };
  validUntil: string;
  createdAt: string;
}

export interface LearningTrend {
  period: "daily" | "weekly" | "monthly";
  metric: string;
  data: {
    date: string;
    value: number;
    change?: number;
  }[];
  trend: "improving" | "declining" | "stable";
  significance: number; // statistical significance
}

export interface PredictiveAnalytics {
  masteryPrediction: {
    cardId: string;
    estimatedMasteryDate: string;
    confidence: number;
    requiredSessions: number;
  }[];
  forgettingRisk: {
    cardId: string;
    riskLevel: "low" | "medium" | "high";
    estimatedForgettingDate: string;
    reviewRecommended: boolean;
  }[];
  optimalScheduling: {
    nextStudySession: string;
    recommendedDuration: number;
    recommendedCards: string[];
    reasoning: string;
  };
}

export interface ComparisonAnalytics {
  peer: {
    percentile: number;
    averageAccuracy: number;
    averageSpeed: number;
    strengthAreas: string[];
    improvementAreas: string[];
  };
  historical: {
    accuracyImprovement: number;
    speedImprovement: number;
    consistencyScore: number;
    milestones: {
      date: string;
      achievement: string;
      metric: string;
      value: number;
    }[];
  };
}

export interface AnalyticsDashboard {
  userId: string;
  generatedAt: string;
  summary: {
    totalStudyTime: number;
    cardsStudied: number;
    setsCompleted: number;
    currentStreak: number;
    overallAccuracy: number;
  };
  insights: LearningInsight[];
  metrics: PerformanceMetrics;
  patterns: StudyPattern[];
  goals: LearningGoal[];
  recommendations: StudyRecommendation[];
  trends: LearningTrend[];
  predictions: PredictiveAnalytics;
  comparisons: ComparisonAnalytics;
}
