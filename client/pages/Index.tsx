import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Clock,
  TrendingUp,
  Play,
  Target,
  Edit,
  MoreVertical,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FlashcardSet, StudyProgress } from "@/types/flashcard";
import { getSets, getAllProgress, saveSet, saveProgress } from "@/lib/storage";
import { createSampleSets, createSampleProgress } from "@/lib/sampleData";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { getUserStats } from "@/lib/progressStorage";
import { DashboardLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

export default function Index() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulate brief loading for smooth UX
      await new Promise((resolve) => setTimeout(resolve, 200));

      const allSets = getSets();
      const allProgress = getAllProgress();
      setSets(allSets);
      setProgress(allProgress);

      // Create sample data if none exists
      if (allSets.length === 0) {
        createSampleData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleData = () => {
    const sampleSets = createSampleSets();
    const sampleProgress = createSampleProgress(sampleSets);

    // Save sample sets
    sampleSets.forEach((set) => saveSet(set));
    setSets(sampleSets);

    // Save sample progress
    sampleProgress.forEach((progress) => saveProgress(progress));
    setProgress(sampleProgress);
  };

  const getSetProgress = (setId: string) => {
    return progress.find((p) => p.setId === setId);
  };

  const recentSets = sets
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <DashboardLoadingSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-6 sm:py-8 md:py-12 gradient-bg rounded-xl sm:rounded-2xl text-white px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 sm:mb-4">
            Master Any Subject with lam-quiz
          </h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
            Level up your learning with smart scoring, progress tracking, and
            intelligent spaced repetition
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4">
            <Link to="/create" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Set
              </Button>
            </Link>
            {sets.length > 0 && (
              <Link to="/study" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary w-full sm:w-auto"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Studying
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Enhanced Dashboard Stats */}
        <DashboardStats />

        {/* Recent Study Sets */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Study Sets</h2>
            <Link to="/create">
              <Button className="gradient-bg">
                <Plus className="h-4 w-4 mr-2" />
                Create New Set
              </Button>
            </Link>
          </div>

          {sets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No study sets yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first flashcard set to get started
                </p>
                <Link to="/create">
                  <Button className="gradient-bg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Set
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {recentSets.map((set) => {
                const setProgress = getSetProgress(set.id);
                const progressPercentage = setProgress
                  ? (setProgress.masteredCards / setProgress.totalCards) * 100
                  : 0;

                return (
                  <Card
                    key={set.id}
                    className="card-hover cursor-pointer transition-all-300"
                    onClick={() => (window.location.href = `/study/${set.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {set.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {set.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {set.cards.length} cards
                          </span>
                          {setProgress && (
                            <Badge variant="secondary">
                              {setProgress.masteredCards}/
                              {setProgress.totalCards} mastered
                            </Badge>
                          )}
                        </div>

                        {setProgress && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progress</span>
                              <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <Progress
                              value={progressPercentage}
                              className="h-2"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-1 sm:gap-2 pt-2">
                          <Link to={`/study/${set.id}`} className="flex-1">
                            <Button
                              size="sm"
                              className="w-full text-xs sm:text-sm"
                            >
                              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Study
                            </Button>
                          </Link>
                          <Link to={`/test/${set.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                              Test
                            </Button>
                          </Link>
                          <Link to={`/edit/${set.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-2 sm:px-3"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/study">
            <Card className="card-hover cursor-pointer text-center p-6">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Study Mode</h3>
              <p className="text-sm text-muted-foreground">
                Review your flashcards
              </p>
            </Card>
          </Link>

          <Link to="/test">
            <Card className="card-hover cursor-pointer text-center p-6">
              <Target className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Take a Test</h3>
              <p className="text-sm text-muted-foreground">Quiz yourself</p>
            </Card>
          </Link>

          <Link to="/match">
            <Card className="card-hover cursor-pointer text-center p-6">
              <div className="h-8 w-8 text-primary mx-auto mb-3 flex items-center justify-center">
                🎯
              </div>
              <h3 className="font-semibold mb-1">Match Game</h3>
              <p className="text-sm text-muted-foreground">
                Match terms with definitions
              </p>
            </Card>
          </Link>

          <Link to="/progress">
            <Card className="card-hover cursor-pointer text-center p-6">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Progress</h3>
              <p className="text-sm text-muted-foreground">
                Track your learning
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
