import { useState, useEffect } from "react";
import { FlashcardSet, Card, StudyProgress } from "@/types/flashcard";
import {
  StudySession,
  CardProgress,
  StudyMode as StudyModeType,
} from "@/types/scoring";
import FlashcardComponent from "./FlashcardComponent";
import ScoreDisplay from "@/components/scoring/ScoreDisplay";
import AnswerFeedback from "@/components/scoring/AnswerFeedback";
import { StudyModeLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Flame,
} from "lucide-react";
import { saveProgress } from "@/lib/storage";
import { ScoringService } from "@/lib/scoring";
import {
  getUserStats,
  saveUserStats,
  saveStudySession,
} from "@/lib/progressStorage";
import { generateId } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface StudyModeProps {
  flashcardSet: FlashcardSet;
  onComplete?: () => void;
  onExit?: () => void;
}

export default function StudyMode({
  flashcardSet,
  onComplete,
  onExit,
}: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState<Card[]>(
    flashcardSet.cards,
  );
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [isShuffled, setIsShuffled] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);

  // Scoring system state
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [cardProgresses, setCardProgresses] = useState<CardProgress[]>([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [userStats, setUserStats] = useState(getUserStats());
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState<{
    isCorrect: boolean;
    points: number;
    timeBonus: number;
    streakBonus: number;
  } | null>(null);

  const currentCard = shuffledCards[currentIndex];
  const progressPercentage = ((currentIndex + 1) / shuffledCards.length) * 100;
  const masteredCount = masteredCards.size;
  const remainingCards = shuffledCards.length - currentIndex - 1;

  // Initialize scoring session and handle loading
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        if (!studySession) {
          const session = ScoringService.createStudySession(
            flashcardSet.id,
            "FLASHCARD" as StudyModeType,
          );
          setStudySession(session);
          setSessionStartTime(Date.now());
        }
        // Simulate a brief loading time for smooth UX
        await new Promise((resolve) => setTimeout(resolve, 300));
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [flashcardSet.id, studySession]);

  // Auto-advance functionality
  useEffect(() => {
    if (autoAdvance && currentIndex < shuffledCards.length - 1) {
      const timer = setTimeout(() => {
        handleNext();
      }, 3000);
      setAutoAdvanceTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [autoAdvance, currentIndex]);

  const shuffleCards = () => {
    const shuffled = [...flashcardSet.cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsShuffled(true);
  };

  const resetCards = () => {
    setShuffledCards(flashcardSet.cards);
    setCurrentIndex(0);
    setIsShuffled(false);
    setMasteredCards(new Set());
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    // Reset card timing for next card
    setCardStartTime(Date.now());

    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleMastered = (cardId: string, mastered: boolean) => {
    const cardTimeSpent = Math.round((Date.now() - cardStartTime) / 1000);
    const newStreak = mastered ? studyStreak + 1 : 0;

    // Calculate score for this answer
    const scoreResult = ScoringService.calculateAnswerScore(
      mastered,
      cardTimeSpent,
      studyStreak,
    );

    // Show answer feedback
    setShowAnswerFeedback({
      isCorrect: mastered,
      points: scoreResult.totalScore,
      timeBonus: scoreResult.timeBonus,
      streakBonus: scoreResult.streakBonus,
    });

    // Create card progress entry
    const cardProgress: CardProgress = {
      id: generateId(),
      cardId,
      sessionId: studySession?.id || "",
      isCorrect: mastered,
      timeSpent: cardTimeSpent,
      attempts: 1,
      lastReviewAt: new Date().toISOString(),
    };

    setCardProgresses((prev) => [...prev, cardProgress]);
    setCurrentScore((prev) => prev + scoreResult.totalScore);
    setStudyStreak(newStreak);

    const newMasteredCards = new Set(masteredCards);
    if (mastered) {
      newMasteredCards.add(cardId);
    } else {
      newMasteredCards.delete(cardId);
    }
    setMasteredCards(newMasteredCards);

    // Auto-advance after feedback is shown
    setTimeout(() => {
      setShowAnswerFeedback(null);
      handleNext();
    }, 1500);
  };

  const handleComplete = () => {
    if (!studySession) return;

    // Complete scoring session
    const sessionResult = ScoringService.completeSession(
      studySession,
      cardProgresses,
      userStats,
    );

    // Update user stats
    const updatedStats = ScoringService.updateUserStats(
      userStats,
      sessionResult,
    );
    setUserStats(updatedStats);
    saveUserStats(updatedStats);

    // Save study session
    saveStudySession(sessionResult.session);

    // Save traditional progress for backward compatibility
    const progress: StudyProgress = {
      setId: flashcardSet.id,
      totalCards: flashcardSet.cards.length,
      masteredCards: masteredCards.size,
      lastStudied: new Date().toISOString(),
      studyStreak: sessionResult.streak,
    };
    saveProgress(progress);

    onComplete?.();
  };

  const toggleAutoAdvance = () => {
    setAutoAdvance(!autoAdvance);
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
  };

  // Show loading skeleton while initializing
  if (isLoading) {
    return <StudyModeLoadingSkeleton />;
  }

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No cards available</h3>
          <p className="text-muted-foreground">
            This set doesn't have any cards to study.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{flashcardSet.title}</h1>
          <p className="text-muted-foreground">{flashcardSet.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {userStats && (
            <ScoreDisplay
              currentScore={currentScore}
              totalScore={userStats.totalScore}
              streak={studyStreak}
              accuracy={
                cardProgresses.length > 0
                  ? cardProgresses.filter((cp) => cp.isCorrect).length /
                    cardProgresses.length
                  : 0
              }
              timeSpent={Math.round((Date.now() - sessionStartTime) / 1000)}
              level={userStats.level}
              compact={true}
              className="hidden sm:flex"
            />
          )}
          <Button variant="outline" onClick={onExit}>
            Exit Study
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Card {currentIndex + 1} of {shuffledCards.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {masteredCount} mastered • {remainingCards} remaining
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Button
            variant={isShuffled ? "default" : "outline"}
            size="sm"
            onClick={shuffleCards}
            className="gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetCards}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoAdvance ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoAdvance}
            className="gap-2"
          >
            {autoAdvance ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Auto-advance
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Options
          </Button>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex items-center justify-center mb-8">
        <FlashcardComponent
          card={currentCard}
          termLanguage={flashcardSet.termLanguage}
          definitionLanguage={flashcardSet.definitionLanguage}
          onMastered={handleMastered}
          className="w-full max-w-lg"
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Use arrow keys to navigate
          </span>
        </div>

        <Button
          onClick={handleNext}
          className={cn(
            "gap-2",
            currentIndex === shuffledCards.length - 1
              ? "gradient-bg"
              : "bg-primary hover:bg-primary/90",
          )}
        >
          {currentIndex === shuffledCards.length - 1 ? "Complete" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Answer Feedback Overlay */}
      {showAnswerFeedback && (
        <AnswerFeedback
          isCorrect={showAnswerFeedback.isCorrect}
          points={showAnswerFeedback.points}
          timeBonus={showAnswerFeedback.timeBonus}
          streakBonus={showAnswerFeedback.streakBonus}
          onContinue={() => {
            setShowAnswerFeedback(null);
            handleNext();
          }}
        />
      )}
    </div>
  );
}
