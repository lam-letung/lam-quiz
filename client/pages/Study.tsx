import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import StudyMode from "@/components/flashcard/StudyMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlashcardSet } from "@/types/flashcard";
import { BookOpen, Play, ArrowLeft, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Study() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [studyMode, setStudyMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [setId]);

  const loadData = async () => {
    try {
      const res = await fetch("/api/me/flashcard-sets", {
        credentials: "include"
      });
      const data = await res.json();
      setSets(data);

      if (setId) {
        const found = data.find((s: FlashcardSet) => s.id === setId);
        if (found) {
          setSelectedSet(found);
          setStudyMode(true);
        } else {
          navigate("/study");
        }
      }
    } catch (err) {
      console.error("Failed to fetch sets", err);
      navigate("/study");
    }
  };

  const handleSetSelect = (set: FlashcardSet) => {
    setSelectedSet(set);
    setStudyMode(true);
    navigate(`/study/${set.id}`);
  };

  const handleStudyComplete = () => {
    setStudyMode(false);
    setSelectedSet(null);
    navigate("/study");
  };

  const handleStudyExit = () => {
    setStudyMode(false);
    setSelectedSet(null);
    navigate("/study");
  };

  if (studyMode && selectedSet) {
    return (
      <AppLayout showSidebar={false}>
        <StudyMode
          flashcardSet={selectedSet}
          onComplete={handleStudyComplete}
          onExit={handleStudyExit}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Study Mode</h1>
            <p className="text-muted-foreground">
              Choose a study set to begin learning
            </p>
          </div>
        </div>

        {sets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No study sets yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first flashcard set to start studying
              </p>
              <Link to="/create">
                <Button className="gradient-bg">Create Your First Set</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <Card
                key={set.id}
                className="card-hover cursor-pointer transition-all-300"
                onClick={() => handleSetSelect(set)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {set.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {set.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{set.cards.length} cards</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>~{Math.ceil(set.cards.length / 2)} min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Study Mode</Badge>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetSelect(set);
                        }}
                      >
                        <Play className="h-4 w-4" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Study Tips */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Study Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">🧠 Active Recall</h3>
                <p className="text-sm text-muted-foreground">
                  Try to remember the definition before flipping the card
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">🔄 Spaced Repetition</h3>
                <p className="text-sm text-muted-foreground">
                  Review cards at increasing intervals for better retention
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">⏰ Short Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Study for 15-20 minutes at a time for optimal focus
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
