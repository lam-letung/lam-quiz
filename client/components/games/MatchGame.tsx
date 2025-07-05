import { useState, useEffect, useCallback } from "react";
import { FlashcardSet, Card } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { Card as UICard, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchGameProps {
  flashcardSet: FlashcardSet;
  onComplete?: (score: number, time: number) => void;
  onExit?: () => void;
}

interface GameCard {
  id: string;
  content: string;
  type: "term" | "definition";
  originalCardId: string;
  isMatched: boolean;
  isSelected: boolean;
}

export default function MatchGame({
  flashcardSet,
  onComplete,
  onExit,
}: MatchGameProps) {
  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [incorrectMatches, setIncorrectMatches] = useState<number>(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);

  // Take 6 cards per round
  const cardsPerRound = 6;
  const totalRounds = Math.ceil(flashcardSet.cards.length / cardsPerRound);
  const currentCards = flashcardSet.cards.slice(
    currentRound * cardsPerRound,
    (currentRound + 1) * cardsPerRound,
  );

  useEffect(() => {
    initializeGame();
    setStartTime(Date.now());
  }, [currentRound]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameComplete) {
        setElapsedTime(Date.now() - startTime);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [startTime, gameComplete]);

  const initializeGame = () => {
    const cards: GameCard[] = [];

    currentCards.forEach((card) => {
      cards.push({
        id: `term-${card.id}`,
        content: card.term,
        type: "term",
        originalCardId: card.id,
        isMatched: false,
        isSelected: false,
      });
      cards.push({
        id: `def-${card.id}`,
        content: card.definition,
        type: "definition",
        originalCardId: card.id,
        isMatched: false,
        isSelected: false,
      });
    });

    // Shuffle the cards
    const shuffled = cards.sort(() => Math.random() - 0.5);
    setGameCards(shuffled);
    setSelectedCards([]);
    setMatchedPairs(new Set());
    setGameComplete(false);
    setIncorrectMatches(0);
  };

  const handleCardClick = useCallback(
    (card: GameCard) => {
      if (
        card.isMatched ||
        card.isSelected ||
        selectedCards.length >= 2 ||
        gameComplete
      ) {
        return;
      }

      const newSelectedCards = [...selectedCards, card];
      setSelectedCards(newSelectedCards);

      // Update card selection state
      setGameCards((prevCards) =>
        prevCards.map((c) =>
          c.id === card.id ? { ...c, isSelected: true } : c,
        ),
      );

      if (newSelectedCards.length === 2) {
        // Check for match
        setTimeout(() => {
          checkMatch(newSelectedCards);
        }, 500);
      }
    },
    [selectedCards, gameComplete],
  );

  const checkMatch = (selected: GameCard[]) => {
    const [card1, card2] = selected;
    const isMatch = card1.originalCardId === card2.originalCardId;

    if (isMatch) {
      // Correct match
      const newMatchedPairs = new Set(matchedPairs);
      newMatchedPairs.add(card1.originalCardId);
      setMatchedPairs(newMatchedPairs);

      setGameCards((prevCards) =>
        prevCards.map((c) =>
          c.originalCardId === card1.originalCardId
            ? { ...c, isMatched: true, isSelected: false }
            : { ...c, isSelected: false },
        ),
      );

      // Check if round is complete
      if (newMatchedPairs.size === currentCards.length) {
        if (currentRound + 1 < totalRounds) {
          // Move to next round
          setTimeout(() => {
            setCurrentRound(currentRound + 1);
          }, 1000);
        } else {
          // Game complete
          setGameComplete(true);
          const finalTime = Date.now() - startTime;
          const score = Math.max(
            0,
            1000 - Math.floor(finalTime / 1000) - incorrectMatches * 5,
          );
          onComplete?.(score, finalTime);
        }
      }
    } else {
      // Incorrect match - add penalty
      setIncorrectMatches((prev) => prev + 1);
      setGameCards((prevCards) =>
        prevCards.map((c) => ({ ...c, isSelected: false })),
      );
    }

    setSelectedCards([]);
  };

  const resetGame = () => {
    setCurrentRound(0);
    initializeGame();
    setStartTime(Date.now());
    setElapsedTime(0);
    setIncorrectMatches(0);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, "0")}s`;
  };

  const progress = (matchedPairs.size / currentCards.length) * 100;
  const overallProgress =
    ((currentRound * cardsPerRound + matchedPairs.size) /
      flashcardSet.cards.length) *
    100;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Match Game</h1>
            <p className="text-muted-foreground">
              Round {currentRound + 1} of {totalRounds}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          {incorrectMatches > 0 && (
            <Badge variant="destructive">
              +{incorrectMatches * 5}s penalty
            </Badge>
          )}
          <Button variant="outline" onClick={resetGame}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Round Progress</span>
          <span>
            {matchedPairs.size} / {currentCards.length} pairs
          </span>
        </div>
        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-between text-sm">
          <span>Overall Progress</span>
          <span>
            {currentRound * cardsPerRound + matchedPairs.size} /{" "}
            {flashcardSet.cards.length} cards
          </span>
        </div>
        <Progress value={overallProgress} className="h-1" />
      </div>

      {/* Game Complete */}
      {gameComplete && (
        <UICard className="mb-6 border-success/20 bg-success/5">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-muted-foreground mb-4">
              You completed all {totalRounds} rounds in{" "}
              {formatTime(elapsedTime)}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary">Time: {formatTime(elapsedTime)}</Badge>
              <Badge variant="secondary">Mistakes: {incorrectMatches}</Badge>
            </div>
          </CardContent>
        </UICard>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {gameCards.map((card) => (
          <UICard
            key={card.id}
            className={cn(
              "cursor-pointer transition-all duration-200 transform touch-target",
              "min-h-20 sm:min-h-24 md:min-h-28 border-2",
              "hover:scale-105 active:scale-95",
              card.isMatched &&
                "border-success bg-success/10 cursor-default transform-none",
              card.isSelected &&
                !card.isMatched &&
                "border-primary bg-primary/10",
              !card.isMatched &&
                !card.isSelected &&
                "hover:border-primary/50 hover:shadow-lg",
              card.type === "term"
                ? "bg-blue-50 dark:bg-blue-950/20"
                : "bg-purple-50 dark:bg-purple-950/20",
            )}
            onClick={() => handleCardClick(card)}
          >
            <CardContent className="p-2 sm:p-3 h-full flex items-center justify-center text-center">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase">
                  {card.type}
                </div>
                <div
                  className={cn(
                    "text-xs sm:text-sm font-medium break-words leading-tight",
                    card.isMatched && "text-success",
                  )}
                >
                  {card.content}
                </div>
              </div>
            </CardContent>
          </UICard>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Click cards to match terms with their definitions.</p>
        <p>Each incorrect match adds 5 seconds to your time!</p>
      </div>
    </div>
  );
}
