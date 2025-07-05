import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Crown, Trophy, Award } from "lucide-react";
import { UserLevel } from "@/types/scoring";
import { ScoringService } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: UserLevel;
  totalScore: number;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LevelBadge({
  level,
  totalScore,
  showProgress = false,
  size = "md",
  className,
}: LevelBadgeProps) {
  const levelProgress = ScoringService.getLevelProgress(totalScore);

  const getLevelIcon = (level: UserLevel) => {
    const iconSize =
      size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

    switch (level) {
      case "Beginner":
        return <Star className={cn(iconSize, "text-green-600")} />;
      case "Intermediate":
        return <Award className={cn(iconSize, "text-blue-600")} />;
      case "Advanced":
        return <Trophy className={cn(iconSize, "text-purple-600")} />;
      case "Expert":
        return <Crown className={cn(iconSize, "text-yellow-600")} />;
    }
  };

  const getLevelColors = (level: UserLevel) => {
    switch (level) {
      case "Beginner":
        return {
          badge:
            "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100",
          text: "text-green-600 dark:text-green-400",
          progress: "bg-green-500",
        };
      case "Intermediate":
        return {
          badge:
            "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100",
          text: "text-blue-600 dark:text-blue-400",
          progress: "bg-blue-500",
        };
      case "Advanced":
        return {
          badge:
            "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100",
          text: "text-purple-600 dark:text-purple-400",
          progress: "bg-purple-500",
        };
      case "Expert":
        return {
          badge:
            "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100",
          text: "text-yellow-600 dark:text-yellow-400",
          progress: "bg-yellow-500",
        };
    }
  };

  const colors = getLevelColors(level);
  const badgeSize =
    size === "sm"
      ? "text-xs px-2 py-1"
      : size === "lg"
        ? "text-base px-4 py-2"
        : "text-sm px-3 py-1";

  if (!showProgress) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "flex items-center gap-1 font-medium",
          colors.badge,
          badgeSize,
          className,
        )}
      >
        {getLevelIcon(level)}
        {level}
      </Badge>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1 font-medium",
            colors.badge,
            badgeSize,
          )}
        >
          {getLevelIcon(level)}
          {level}
        </Badge>
        <div className={cn("text-sm font-medium", colors.text)}>
          {totalScore.toLocaleString()} pts
        </div>
      </div>

      {levelProgress.nextLevel && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress to {levelProgress.nextLevel}</span>
            <span>{levelProgress.progress}%</span>
          </div>
          <div className="relative">
            <Progress value={levelProgress.progress} className="h-2" />
            <div
              className={cn("absolute inset-0 rounded-full", colors.progress)}
              style={{ width: `${levelProgress.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {levelProgress.pointsToNext.toLocaleString()} points to{" "}
            {levelProgress.nextLevel}
          </p>
        </div>
      )}

      {level === "Expert" && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-600">
            <Crown className="h-4 w-4" />
            <span className="text-xs font-medium">Maximum Level Achieved!</span>
          </div>
        </div>
      )}
    </div>
  );
}
