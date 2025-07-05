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
import DashboardStats from "@/components/dashboard/DashboardStats";
import { DashboardLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

export default function Index() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/me/flashcard-sets");
      const data = await res.json();
      setSets(data);
    } catch (err) {
      console.error("Failed to fetch sets", err);
    } finally {
      setIsLoading(false);
    }
  };

  const recentSets = sets
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
        <div className="text-center py-6 sm:py-8 md:py-12 gradient-bg rounded-xl text-white px-4">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3">
            Master Any Subject with lam-quiz
          </h1>
          <p className="text-base md:text-xl opacity-90 mb-4 max-w-2xl mx-auto">
            Level up your learning with smart scoring, progress tracking, and spaced repetition
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/create">
              <Button className="bg-white text-primary">
                <Plus className="h-5 w-5 mr-2" /> Create Your First Set
              </Button>
            </Link>
            {sets.length > 0 && (
              <Link to="/study">
                <Button variant="outline" className="text-white border-white">
                  <Play className="h-5 w-5 mr-2" /> Start Studying
                </Button>
              </Link>
            )}
          </div>
        </div>

        <DashboardStats />

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Study Sets</h2>
            <Link to="/create">
              <Button className="gradient-bg">
                <Plus className="h-4 w-4 mr-2" /> Create New Set
              </Button>
            </Link>
          </div>

          {sets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No study sets yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first flashcard set to get started
                </p>
                <Link to="/create">
                  <Button className="gradient-bg">
                    <Plus className="h-4 w-4 mr-2" /> Create Your First Set
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSets.map((set) => (
                <Card key={set.id} className="card-hover cursor-pointer">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{set.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {set.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>{set.cards.length} cards</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Link to={`/study/${set.id}`} className="flex-1">
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" /> Study
                          </Button>
                        </Link>
                        <Link to={`/test/${set.id}`}>
                          <Button size="sm" variant="outline">
                            Test
                          </Button>
                        </Link>
                        <Link to={`/edit/${set.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}