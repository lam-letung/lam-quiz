import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Check, X, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreCounterProps {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  streak: number;
  timeSpent: number; // in seconds
  showAnimation?: boolean;
  variant?: "compact" | "detailed" | "minimal";
  className?: string;
}

export default function ScoreCounter({
  score,
  correctAnswers,
  wrongAnswers,
  totalQuestions,
  streak,
  timeSpent,
  showAnimation = true,
  variant = "detailed",
  className,
}: ScoreCounterProps) {
  const [animatedScore, setAnimatedScore] = useState(score);
  const [animatedCorrect, setAnimatedCorrect] = useState(correctAnswers);
  const [animatedWrong, setAnimatedWrong] = useState(wrongAnswers);
  const [lastScoreIncrease, setLastScoreIncrease] = useState(0);

  // Animate score changes
  useEffect(() => {
    if (showAnimation && score !== animatedScore) {
      const increase = score - animatedScore;
      setLastScoreIncrease(increase);

      const animateValue = (
        startValue: number,
        endValue: number,
        setter: (value: number) => void,
      ) => {
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const currentValue = Math.round(
            startValue + (endValue - startValue) * easeOutCubic,
          );

          setter(currentValue);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      };

      animateValue(animatedScore, score, setAnimatedScore);
      animateValue(animatedCorrect, correctAnswers, setAnimatedCorrect);
      animateValue(animatedWrong, wrongAnswers, setAnimatedWrong);

      // Clear the score increase indicator
      setTimeout(() => setLastScoreIncrease(0), 1500);
    }
  }, [score, correctAnswers, wrongAnswers, animatedScore, showAnimation]);

  const accuracy =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-bold">{animatedScore}</span>
          {lastScoreIncrease > 0 && showAnimation && (
            <span className="text-xs text-green-500 animate-bounce-in">
              +{lastScoreIncrease}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Check className="h-4 w-4 text-green-500" />
          <span>{animatedCorrect}</span>
        </div>
        <div className="flex items-center gap-1">
          <X className="h-4 w-4 text-red-500" />
          <span>{animatedWrong}</span>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-lg font-bold">{animatedScore}</span>
                {lastScoreIncrease > 0 && showAnimation && (
                  <span className="text-sm text-green-500 animate-bounce-in">
                    +{lastScoreIncrease}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-lg font-bold text-green-600">
                  {animatedCorrect}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <X className="h-4 w-4 text-red-500" />
                <span className="text-lg font-bold text-red-600">
                  {animatedWrong}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Wrong</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-bold">
                  {Math.round(accuracy)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className={cn("border-l-4 border-l-primary", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Main Score Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span className="text-3xl font-bold">{animatedScore}</span>
              {lastScoreIncrease > 0 && showAnimation && (
                <span className="text-lg font-semibold text-green-500 animate-bounce-in">
                  +{lastScoreIncrease}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Total Score</p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-green-600">
                {animatedCorrect}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                  <X className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-red-600">
                {animatedWrong}
              </div>
              <div className="text-xs text-muted-foreground">Wrong</div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(accuracy)}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                  {streak > 0 ? (
                    <Flame className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-600" />
                  )}
                </div>
              </div>
              <div className="text-lg font-bold">
                {streak > 0 ? streak : formatTime(timeSpent)}
              </div>
              <div className="text-xs text-muted-foreground">
                {streak > 0 ? "Streak" : "Time"}
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>
                {totalQuestions > 0
                  ? Math.round((totalQuestions / totalQuestions) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${totalQuestions > 0 ? (totalQuestions / totalQuestions) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Performance Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {accuracy >= 90 && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Excellent Accuracy!
              </Badge>
            )}
            {streak >= 5 && (
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800"
              >
                On Fire! 🔥
              </Badge>
            )}
            {correctAnswers >= 10 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Great Progress!
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
