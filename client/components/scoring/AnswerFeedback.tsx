import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Volume2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnswerFeedbackProps {
  isCorrect?: boolean | null;
  correctAnswer?: string;
  userAnswer?: string;
  showCorrectAnswer?: boolean;
  points?: number;
  timeBonus?: number;
  streakBonus?: number;
  onContinue?: () => void;
  onReset?: () => void;
  showAudio?: boolean;
  className?: string;
}

export default function AnswerFeedback({
  isCorrect = null,
  correctAnswer,
  userAnswer,
  showCorrectAnswer = false,
  points = 0,
  timeBonus = 0,
  streakBonus = 0,
  onContinue,
  onReset,
  showAudio = true,
  className,
}: AnswerFeedbackProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (isCorrect !== null) {
      setShowFeedback(true);
      // Auto-hide feedback after 3 seconds if no user interaction
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  const speakText = (text: string) => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    onContinue?.();
  };

  if (!showFeedback || isCorrect === null) {
    return null;
  }

  return (
    <Card
      className={cn(
        "fixed inset-x-4 top-4 z-50 mx-auto max-w-md",
        "animate-fade-in shadow-lg border-2",
        isCorrect
          ? "border-success bg-success/5"
          : "border-destructive bg-destructive/5",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Result Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <div className="flex items-center gap-2 text-success">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Correct!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <X className="h-5 w-5" />
                  <span className="font-semibold">Incorrect</span>
                </div>
              )}
            </div>

            {/* Points Display */}
            <div className="flex items-center gap-2">
              {points > 0 && (
                <Badge variant="secondary" className="font-mono">
                  +{points} pts
                </Badge>
              )}
              {timeBonus > 0 && (
                <Badge variant="outline" className="text-green-600">
                  +{timeBonus} time
                </Badge>
              )}
              {streakBonus > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  +{streakBonus} streak
                </Badge>
              )}
            </div>
          </div>

          {/* Answer Details */}
          {showCorrectAnswer && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              {userAnswer && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Your answer:
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      isCorrect ? "text-success" : "text-destructive",
                    )}
                  >
                    {userAnswer}
                  </span>
                </div>
              )}

              {!isCorrect && correctAnswer && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Correct answer:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-success font-medium">
                      {correctAnswer}
                    </span>
                    {showAudio && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => speakText(correctAnswer)}
                        className="h-6 w-6"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Try Again
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleContinue}
              className={cn(
                "flex-1",
                isCorrect
                  ? "bg-success hover:bg-success/90"
                  : "bg-primary hover:bg-primary/90",
              )}
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
