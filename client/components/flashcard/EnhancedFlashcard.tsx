import { useState, useCallback, useEffect } from "react";
import { Card as FlashCard } from "@/types/flashcard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Volume2,
  RotateCcw,
  Check,
  X,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoNext } from "@/hooks/useAutoNext";

interface FeedbackState {
  show: boolean;
  type: "correct" | "incorrect" | null;
  message: string;
}

interface EnhancedFlashcardProps {
  card: FlashCard;
  onAnswer?: (cardId: string, correct: boolean) => void;
  onNext?: () => void;
  showControls?: boolean;
  autoNextEnabled?: boolean;
  autoNextDelay?: number; // in seconds
  preventEmptyAnswers?: boolean;
  className?: string;
}

export const EnhancedFlashcard: React.FC<EnhancedFlashcardProps> = ({
  card,
  onAnswer,
  onNext,
  showControls = true,
  autoNextEnabled = true,
  autoNextDelay = 15,
  preventEmptyAnswers = true,
  className,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    show: false,
    type: null,
    message: "",
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-next timer
  const { startTimer, stopTimer, resetTimer, isRunning } = useAutoNext({
    enabled: autoNextEnabled && feedback.show && !isPaused,
    delay: autoNextDelay * 1000,
    onNext: handleNext,
  });

  // Timer countdown
  useEffect(() => {
    if (feedback.show && !isPaused && autoNextEnabled) {
      setTimeRemaining(autoNextDelay);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [feedback.show, isPaused, autoNextDelay, autoNextEnabled]);

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setIsAnimating(false);
    setFeedback({ show: false, type: null, message: "" });
    setTimeRemaining(0);
    setIsPaused(false);
    stopTimer();
  }, [card.id, stopTimer]);

  const handleFlip = useCallback(() => {
    if (!isAnimating && !feedback.show) {
      setIsAnimating(true);
      setIsFlipped(!isFlipped);
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [isAnimating, isFlipped, feedback.show]);

  const handleAnswer = (correct: boolean) => {
    if (preventEmptyAnswers && !isFlipped) {
      // Force flip to show definition first
      setIsFlipped(true);
      return;
    }

    // Show feedback
    setFeedback({
      show: true,
      type: correct ? "correct" : "incorrect",
      message: correct ? "Correct! Well done!" : "Incorrect. Study this more.",
    });

    // Call parent handler
    onAnswer?.(card.id, correct);

    // Start auto-next timer
    if (autoNextEnabled && !isPaused) {
      startTimer();
    }
  };

  function handleNext() {
    setFeedback({ show: false, type: null, message: "" });
    setTimeRemaining(0);
    stopTimer();
    onNext?.();
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      stopTimer();
    } else {
      resetTimer();
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const getFeedbackStyles = () => {
    if (!feedback.show) return "";

    return feedback.type === "correct"
      ? "border-green-500 bg-green-50 dark:bg-green-950/20 border-4"
      : "border-red-500 bg-red-50 dark:bg-red-950/20 border-4";
  };

  const getProgressColor = () => {
    const remaining = timeRemaining / autoNextDelay;
    if (remaining > 0.5) return "bg-green-500";
    if (remaining > 0.2) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-2xl mx-auto px-2 sm:px-0",
        className,
      )}
    >
      {/* Main Flashcard */}
      <div
        className={cn(
          "flashcard w-full h-64 sm:h-80 select-none transition-all duration-300",
          isFlipped && "flipped",
          isAnimating && "animating",
          getFeedbackStyles(),
        )}
      >
        <div className="flashcard-inner">
          {/* Front Side */}
          <Card
            className={cn(
              "flashcard-front cursor-pointer border-2 transition-all duration-200",
              !feedback.show && "hover:border-primary/30 hover:shadow-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              isAnimating && "pointer-events-none",
              feedback.show && "pointer-events-none",
            )}
            onClick={handleFlip}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFlip();
              }
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6 md:p-8 text-center">
              <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
                <span className="text-sm text-muted-foreground font-medium">
                  TERM
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(card.term);
                  }}
                  className="h-8 w-8 opacity-60 hover:opacity-100"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-relaxed px-2">
                  {card.term}
                </p>
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                {feedback.show
                  ? feedback.message
                  : "Click to reveal definition"}
              </div>
            </CardContent>
          </Card>

          {/* Back Side */}
          <Card
            className={cn(
              "flashcard-back cursor-pointer border-2 border-primary/20 bg-primary/5",
              !feedback.show && "hover:border-primary/40 hover:shadow-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              isAnimating && "pointer-events-none",
              feedback.show && "pointer-events-none",
            )}
            onClick={handleFlip}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFlip();
              }
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 sm:p-6 md:p-8 text-center">
              <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
                <span className="text-sm text-primary font-medium">
                  DEFINITION
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(card.definition);
                  }}
                  className="h-8 w-8 opacity-60 hover:opacity-100"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed px-2">
                  {card.definition}
                </p>
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                {feedback.show
                  ? feedback.message
                  : "How well did you know this?"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timer Progress Bar */}
      {feedback.show && autoNextEnabled && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Auto-advancing in {timeRemaining}s</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePauseResume}
              className="h-6 px-2"
            >
              {isPaused ? (
                <Play className="w-3 h-3" />
              ) : (
                <Pause className="w-3 h-3" />
              )}
            </Button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-1000",
                getProgressColor(),
              )}
              style={{
                width: `${(timeRemaining / autoNextDelay) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Answer Controls */}
      {showControls && isFlipped && !feedback.show && (
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 px-2">
          <Button
            variant="outline"
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-1 sm:gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm sm:text-base px-3 sm:px-4"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Don't Know</span>
            <span className="sm:hidden">No</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFlipped(false)}
            className="opacity-60 hover:opacity-100 h-8 w-8 sm:h-10 sm:w-10"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-1 sm:gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 text-sm sm:text-base px-3 sm:px-4"
          >
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Know It</span>
            <span className="sm:hidden">Yes</span>
          </Button>
        </div>
      )}

      {/* Next Button (shown during feedback) */}
      {feedback.show && (
        <div className="flex items-center justify-center mt-6">
          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
            size="lg"
          >
            Next Card
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Validation Message */}
      {preventEmptyAnswers && !isFlipped && (
        <div className="text-center mt-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Please reveal the definition before answering
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedFlashcard;
