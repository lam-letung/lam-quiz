import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import TestMode from "@/components/test/TestMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlashcardSet, Question } from "@/types/flashcard";
import { getSets, getSet } from "@/lib/storage";
import { ArrowLeft, Play, Target, Clock, Trophy, PenTool } from "lucide-react";

export default function Test() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    loadData();
  }, [setId]);

  const loadData = () => {
    const allSets = getSets();
    setSets(allSets);

    if (setId) {
      const set = getSet(setId);
      if (set) {
        setSelectedSet(set);
        setTestMode(true);
      } else {
        navigate("/test");
      }
    }
  };

  const handleSetSelect = (set: FlashcardSet) => {
    setSelectedSet(set);
    setTestMode(true);
    navigate(`/test/${set.id}`);
  };

  const handleTestComplete = (score: number, results: Question[]) => {
    console.log("Test completed with score:", score, "results:", results);
    setTestMode(false);
    setSelectedSet(null);
    navigate("/test");
  };

  const handleTestExit = () => {
    setTestMode(false);
    setSelectedSet(null);
    navigate("/test");
  };

  if (testMode && selectedSet) {
    return (
      <AppLayout showSidebar={false}>
        <TestMode
          flashcardSet={selectedSet}
          onComplete={handleTestComplete}
          onExit={handleTestExit}
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
            <h1 className="text-3xl font-bold">Test Mode</h1>
            <p className="text-muted-foreground">
              Quiz yourself with different question types
            </p>
          </div>
        </div>

        {sets.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No study sets yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first flashcard set to start testing
              </p>
              <Link to="/create">
                <Button className="gradient-bg">Create Your First Set</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Test Mode Features */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center space-y-2">
                    <Target className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Multiple Choice</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose from multiple options
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <PenTool className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Written Answers</h3>
                    <p className="text-sm text-muted-foreground">
                      Type your own responses
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <Clock className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Timed Tests</h3>
                    <p className="text-sm text-muted-foreground">
                      Optional time limits
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <Trophy className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Detailed Results</h3>
                    <p className="text-sm text-muted-foreground">
                      See your performance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Sets */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Choose a Study Set</h2>
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
                            <PenTool className="h-4 w-4" />
                            <span>{set.cards.length} questions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              ~{Math.ceil(set.cards.length * 0.5)} min
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Test Mode</Badge>
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetSelect(set);
                            }}
                          >
                            <Play className="h-4 w-4" />
                            Start Test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
