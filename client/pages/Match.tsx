import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MatchGame from "@/components/games/MatchGame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlashcardSet } from "@/types/flashcard";
import { getSets, getSet } from "@/lib/storage";
import { ArrowLeft, Play, Target, Timer, Zap } from "lucide-react";

export default function Match() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [gameMode, setGameMode] = useState(false);

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
        setGameMode(true);
      } else {
        navigate("/match");
      }
    }
  };

  const handleSetSelect = (set: FlashcardSet) => {
    setSelectedSet(set);
    setGameMode(true);
    navigate(`/match/${set.id}`);
  };

  const handleGameComplete = (score: number, time: number) => {
    console.log("Game completed with score:", score, "time:", time);
    setGameMode(false);
    setSelectedSet(null);
    navigate("/match");
  };

  const handleGameExit = () => {
    setGameMode(false);
    setSelectedSet(null);
    navigate("/match");
  };

  if (gameMode && selectedSet) {
    return (
      <AppLayout showSidebar={false}>
        <MatchGame
          flashcardSet={selectedSet}
          onComplete={handleGameComplete}
          onExit={handleGameExit}
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
            <h1 className="text-3xl font-bold">Match Game</h1>
            <p className="text-muted-foreground">
              Match terms with their definitions as fast as you can
            </p>
          </div>
        </div>

        {sets.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No study sets yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first flashcard set to start playing
              </p>
              <Link to="/create">
                <Button className="gradient-bg">Create Your First Set</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Game Mode Description */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <Target className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Match Pairs</h3>
                    <p className="text-sm text-muted-foreground">
                      Click cards to match terms with definitions
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <Timer className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Beat the Clock</h3>
                    <p className="text-sm text-muted-foreground">
                      Faster matches = higher scores
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <Zap className="h-8 w-8 text-primary mx-auto" />
                    <h3 className="font-semibold">Instant Feedback</h3>
                    <p className="text-sm text-muted-foreground">
                      Wrong matches add time penalties
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
                            <Target className="h-4 w-4" />
                            <span>{set.cards.length} cards</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="h-4 w-4" />
                            <span>
                              ~{Math.ceil(set.cards.length / 6)} rounds
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Match Game</Badge>
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetSelect(set);
                            }}
                          >
                            <Play className="h-4 w-4" />
                            Play
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
