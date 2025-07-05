import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Flame,
  Clock,
  Target,
  TrendingUp,
  Star,
  Zap,
} from "lucide-react";
import { UserLevel } from "@/types/scoring";
import { ScoringService } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  currentScore: number;
  totalScore: number;
  streak: number;
  accuracy: number;
  timeSpent: number; // in seconds
  level: UserLevel;
  showAnimation?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ScoreDisplay({
  currentScore,
  totalScore,
  streak,
  accuracy,
  timeSpent,
  level,
  showAnimation = true,
  compact = false,
  className,
}: ScoreDisplayProps) {
  const [animatedScore, setAnimatedScore] = useState(currentScore);
  const [lastScoreChange, setLastScoreChange] = useState(0);

  const levelProgress = ScoringService.getLevelProgress(totalScore);

  useEffect(() => {
    if (showAnimation && currentScore !== animatedScore) {
      const difference = currentScore - animatedScore;
      setLastScoreChange(difference);

      // Animate score change
      const duration = 500;
      const startTime = Date.now();
      const startScore = animatedScore;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const newScore = Math.round(
          startScore + (currentScore - startScore) * easeOutCubic,
        );

        setAnimatedScore(newScore);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);

      // Clear the score change indicator after animation
      setTimeout(() => setLastScoreChange(0), 1000);
    }
  }, [currentScore, animatedScore, showAnimation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getLevelColor = (level: UserLevel) => {
    switch (level) {
      case "Beginner":
        return "text-green-600";
      case "Intermediate":
        return "text-blue-600";
      case "Advanced":
        return "text-purple-600";
      case "Expert":
        return "text-yellow-600";
    }
  };

  const getLevelBadgeVariant = (level: UserLevel) => {
    switch (level) {
      case "Beginner":
        return "default";
      case "Intermediate":
        return "secondary";
      case "Advanced":
        return "outline";
      case "Expert":
        return "destructive";
    }
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-bold">{animatedScore}</span>
          {lastScoreChange !== 0 && (
            <span
              className={cn(
                "text-xs animate-fade-in",
                lastScoreChange > 0 ? "text-green-500" : "text-red-500",
              )}
            >
              {lastScoreChange > 0 ? "+" : ""}
              {lastScoreChange}
            </span>
          )}
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{streak}</span>
          </div>
        )}

        <Badge variant={getLevelBadgeVariant(level)} className="text-xs">
          {level}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Main Score */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span className="text-3xl font-bold">
                {animatedScore.toLocaleString()}
              </span>
              {lastScoreChange !== 0 && (
                <span
                  className={cn(
                    "text-lg font-semibold animate-bounce-in",
                    lastScoreChange > 0 ? "text-green-500" : "text-red-500",
                  )}
                >
                  {lastScoreChange > 0 ? "+" : ""}
                  {lastScoreChange}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Session Score</p>
          </div>

          {/* Level Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className={cn("h-5 w-5", getLevelColor(level))} />
                <Badge variant={getLevelBadgeVariant(level)}>{level}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {totalScore.toLocaleString()} total
              </div>
            </div>

            {levelProgress.nextLevel && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress to {levelProgress.nextLevel}</span>
                  <span>{levelProgress.progress}%</span>
                </div>
                <Progress value={levelProgress.progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {levelProgress.pointsToNext.toLocaleString()} points to go
                </p>
              </div>
            )}
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-lg font-semibold">{streak}</div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <Target className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-lg font-semibold">
                {Math.round(accuracy * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-lg font-semibold">
                {formatTime(timeSpent)}
              </div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t">
            {accuracy >= 0.9 && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Excellent!</span>
              </div>
            )}
            {streak >= 5 && (
              <div className="flex items-center gap-1 text-orange-600">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">On Fire!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
