import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import LevelBadge from "@/components/scoring/LevelBadge";
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Flame,
  BookOpen,
  Award,
  Zap,
} from "lucide-react";
import { getUserStats, calculateStudyStatistics } from "@/lib/progressStorage";
import { UserStats, StudyStatistics } from "@/types/scoring";

export default function DashboardStats() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [studyStats, setStudyStats] = useState<StudyStatistics | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const stats = getUserStats();
    const studyStatistics = calculateStudyStatistics();
    setUserStats(stats);
    setStudyStats(studyStatistics);
  };

  if (!userStats || !studyStats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRate = Math.round(
    (studyStats.masteredCards / Math.max(studyStats.totalCards, 1)) * 100,
  );

  return (
    <div className="space-y-6">
      {/* Level and Total Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="gradient-bg text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Your Level</h3>
                <p className="text-white/80 text-sm">
                  Keep learning to level up!
                </p>
              </div>
              <Award className="h-8 w-8 text-white/80" />
            </div>
            <LevelBadge
              level={userStats.level}
              totalScore={userStats.totalScore}
              showProgress={true}
              size="lg"
              className="text-white"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Total Score</h3>
                <p className="text-muted-foreground text-sm">
                  Earned across all sessions
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {userStats.totalScore.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Average: {Math.round(userStats.averageScore)} per session
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Study Sessions
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {studyStats.totalStudyTime} minutes total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cards Mastered
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyStats.masteredCards}</div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {completionRate}% completion rate
              </p>
              <Progress value={completionRate} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyStats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Best: {studyStats.longestStreak} cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(studyStats.averageAccuracy * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {studyStats.totalCards} cards answered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyStats.currentStreak >= 10 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <Flame className="h-6 w-6 text-orange-500" />
                <div>
                  <div className="font-medium">Fire Streak!</div>
                  <div className="text-sm text-muted-foreground">
                    {studyStats.currentStreak} correct in a row
                  </div>
                </div>
              </div>
            )}

            {studyStats.averageAccuracy >= 0.9 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <Target className="h-6 w-6 text-green-500" />
                <div>
                  <div className="font-medium">Sharp Shooter!</div>
                  <div className="text-sm text-muted-foreground">
                    90%+ accuracy
                  </div>
                </div>
              </div>
            )}

            {userStats.totalSessions >= 7 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Clock className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="font-medium">Dedicated Learner!</div>
                  <div className="text-sm text-muted-foreground">
                    {userStats.totalSessions} study sessions
                  </div>
                </div>
              </div>
            )}
          </div>

          {studyStats.currentStreak < 10 &&
            studyStats.averageAccuracy < 0.9 &&
            userStats.totalSessions < 7 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keep studying to unlock achievements!</p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Weak Areas */}
      {studyStats.weakCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You have {studyStats.weakCards.length} cards that need more
                practice.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-red-100 dark:bg-red-950/20 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (studyStats.weakCards.length /
                          Math.max(studyStats.totalCards, 1)) *
                          100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(
                    (studyStats.weakCards.length /
                      Math.max(studyStats.totalCards, 1)) *
                      100,
                  )}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
