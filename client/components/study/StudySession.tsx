import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Target,
  Clock,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { EnhancedFlashcard } from "@/components/flashcard/EnhancedFlashcard";
import { ScoreDisplay } from "@/components/scoring/ScoreDisplay";
import { ResultsSummary } from "@/components/scoring/ResultsSummary";
import { FlashcardSet, Card as FlashCard } from "@/types/flashcard";
import { StudySession as StudySessionType } from "@/types/scoring";
import { ScoringService } from "@/lib/scoring";
import { getProgressStorage } from "@/lib/progressStorage";

interface StudySessionProps {
  set: FlashcardSet;
  onComplete?: (session: StudySessionType) => void;
  onExit?: () => void;
}

interface SessionState {
  currentCardIndex: number;
  startTime: Date;
  answers: Array<{
    cardId: string;
    correct: boolean;
    responseTime: number;
    timestamp: string;
  }>;
  score: number;
  streak: number;
  accuracy: number;
  isComplete: boolean;
  isPaused: boolean;
}

export const StudySession: React.FC<StudySessionProps> = ({
  set,
  onComplete,
  onExit,
}) => {
  const [sessionState, setSessionState] = useState<SessionState>({
    currentCardIndex: 0,
    startTime: new Date(),
    answers: [],
    score: 0,
    streak: 0,
    accuracy: 0,
    isComplete: false,
    isPaused: false,
  });

  const [responseStartTime, setResponseStartTime] = useState<Date>(new Date());
  const [showResults, setShowResults] = useState(false);
  const [scoringService] = useState(new ScoringService());
  const [progressStorage] = useState(getProgressStorage());

  // Initialize response timer when card changes
  useEffect(() => {
    setResponseStartTime(new Date());
  }, [sessionState.currentCardIndex]);

  const currentCard = set.cards[sessionState.currentCardIndex];
  const progress =
    ((sessionState.currentCardIndex + 1) / set.cards.length) * 100;
  const isLastCard = sessionState.currentCardIndex === set.cards.length - 1;

  const handleAnswer = useCallback(
    (cardId: string, correct: boolean) => {
      const responseTime =
        (new Date().getTime() - responseStartTime.getTime()) / 1000;

      const newAnswer = {
        cardId,
        correct,
        responseTime,
        timestamp: new Date().toISOString(),
      };

      setSessionState((prev) => {
        const newAnswers = [...prev.answers, newAnswer];
        const newStreak = correct ? prev.streak + 1 : 0;
        const newAccuracy =
          newAnswers.length > 0
            ? newAnswers.filter((a) => a.correct).length / newAnswers.length
            : 0;

        // Calculate score using scoring service
        const points = scoringService.calculateCardScore({
          isCorrect: correct,
          responseTime,
          difficulty: 1, // Could be dynamic based on card history
          streak: newStreak,
          timeBonus: responseTime < 10 ? Math.max(0, 10 - responseTime) : 0,
        });

        return {
          ...prev,
          answers: newAnswers,
          score: prev.score + points,
          streak: newStreak,
          accuracy: newAccuracy,
        };
      });
    },
    [responseStartTime, scoringService],
  );

  const handleNext = useCallback(() => {
    setSessionState((prev) => {
      if (prev.currentCardIndex < set.cards.length - 1) {
        return {
          ...prev,
          currentCardIndex: prev.currentCardIndex + 1,
        };
      } else {
        // Session complete
        return {
          ...prev,
          isComplete: true,
        };
      }
    });
  }, [set.cards.length]);

  const handlePauseResume = () => {
    setSessionState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const handleRestart = () => {
    setSessionState({
      currentCardIndex: 0,
      startTime: new Date(),
      answers: [],
      score: 0,
      streak: 0,
      accuracy: 0,
      isComplete: false,
      isPaused: false,
    });
    setShowResults(false);
  };

  const completeSession = useCallback(() => {
    const endTime = new Date();
    const duration =
      (endTime.getTime() - sessionState.startTime.getTime()) / 1000;

    const session: StudySessionType = {
      id: `session_${Date.now()}`,
      setId: set.id,
      mode: "flashcards",
      startTime: sessionState.startTime.toISOString(),
      endTime: endTime.toISOString(),
      cardsStudied: sessionState.answers.length,
      accuracy: sessionState.accuracy,
    };

    // Save session to storage
    progressStorage.saveStudySession(session);

    // Update user stats
    const currentStats = progressStorage.getUserStats();
    progressStorage.saveUserStats({
      ...currentStats,
      totalCardsStudied:
        currentStats.totalCardsStudied + sessionState.answers.length,
      totalStudyTime: currentStats.totalStudyTime + Math.round(duration / 60),
      averageAccuracy:
        (currentStats.averageAccuracy * currentStats.totalSessions +
          sessionState.accuracy) /
        (currentStats.totalSessions + 1),
      totalSessions: currentStats.totalSessions + 1,
      currentStreak:
        sessionState.accuracy > 0.7 ? currentStats.currentStreak + 1 : 0,
    });

    // Update card progress
    sessionState.answers.forEach((answer) => {
      const cardProgress = progressStorage.getCardProgress(answer.cardId);
      progressStorage.saveCardProgress(answer.cardId, {
        ...cardProgress,
        attempts: cardProgress.attempts + 1,
        correctAttempts:
          cardProgress.correctAttempts + (answer.correct ? 1 : 0),
        lastStudied: answer.timestamp,
        averageResponseTime:
          (cardProgress.averageResponseTime * cardProgress.attempts +
            answer.responseTime) /
          (cardProgress.attempts + 1),
      });
    });

    setShowResults(true);
    onComplete?.(session);
  }, [sessionState, set.id, progressStorage, onComplete]);

  // Handle session completion
  useEffect(() => {
    if (sessionState.isComplete && !showResults) {
      completeSession();
    }
  }, [sessionState.isComplete, showResults, completeSession]);

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <ResultsSummary
            score={sessionState.score}
            accuracy={sessionState.accuracy}
            totalCards={set.cards.length}
            correctAnswers={
              sessionState.answers.filter((a) => a.correct).length
            }
            totalTime={Math.round(
              (new Date().getTime() - sessionState.startTime.getTime()) / 1000,
            )}
            answers={sessionState.answers.map((answer) => {
              const card = set.cards.find((c) => c.id === answer.cardId);
              return {
                cardId: answer.cardId,
                question: card?.term || "",
                userAnswer: answer.correct
                  ? card?.definition || ""
                  : "Incorrect",
                correctAnswer: card?.definition || "",
                isCorrect: answer.correct,
                responseTime: answer.responseTime,
              };
            })}
            onRestart={handleRestart}
            onExit={onExit}
          />
        </div>
      </div>
    );
  }

  if (sessionState.isPaused) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Session Paused</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Pause className="w-12 h-12 mx-auto text-gray-400" />
            <p className="text-gray-600">Take a break and resume when ready</p>
            <div className="space-y-2">
              <Button onClick={handlePauseResume} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button variant="outline" onClick={onExit} className="w-full">
                Exit Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onExit}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div>
              <h2 className="font-semibold">{set.title}</h2>
              <p className="text-sm text-gray-500">
                Card {sessionState.currentCardIndex + 1} of {set.cards.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Score Display */}
            <ScoreDisplay
              currentScore={sessionState.score}
              accuracy={sessionState.accuracy}
              streak={sessionState.streak}
              compact
            />

            <Button variant="outline" size="sm" onClick={handlePauseResume}>
              <Pause className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Study Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Score</span>
                  </div>
                  <div className="text-2xl font-bold">{sessionState.score}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Accuracy</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(sessionState.accuracy * 100)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Streak</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {sessionState.streak}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <div className="text-sm">
                    {Math.round(
                      (new Date().getTime() -
                        sessionState.startTime.getTime()) /
                        60000,
                    )}
                    m
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Flashcard */}
          <div className="lg:col-span-3">
            <EnhancedFlashcard
              card={currentCard}
              onAnswer={handleAnswer}
              onNext={handleNext}
              autoNextEnabled={true}
              autoNextDelay={15}
              preventEmptyAnswers={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySession;
