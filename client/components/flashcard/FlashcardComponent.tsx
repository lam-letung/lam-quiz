import { useState, useCallback, useEffect } from "react";
import { Card as FlashCard } from "@/types/flashcard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, RotateCcw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardComponentProps {
  card: FlashCard;
  onMastered?: (cardId: string, mastered: boolean) => void;
  showControls?: boolean;
  autoFlip?: boolean;
  className?: string;
}

export default function FlashcardComponent({
  card,
  onMastered,
  showControls = true,
  autoFlip = false,
  className,
}: FlashcardComponentProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fix: Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setIsAnimating(false);
  }, [card.id]);

  const handleFlip = useCallback(() => {
    if (!autoFlip && !isAnimating) {
      setIsAnimating(true);
      setIsFlipped(!isFlipped);
      // Reset animation lock after transition completes
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [autoFlip, isAnimating, isFlipped]);

  const handleMastered = (mastered: boolean) => {
    onMastered?.(card.id, mastered);
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={cn(
        "flashcard w-full h-80 select-none",
        isFlipped && "flipped",
        isAnimating && "animating",
        className,
      )}
    >
      <div className="flashcard-inner">
        {/* Front Side */}
        <Card
          className={cn(
            "flashcard-front cursor-pointer border-2 transition-colors duration-200",
            "hover:border-primary/30 hover:shadow-lg",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            isAnimating && "pointer-events-none",
          )}
          onClick={handleFlip}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFlip();
            }
          }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-sm text-muted-foreground font-medium">
                TERM
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(card.term);
                }}
                className="h-8 w-8 opacity-60 hover:opacity-100"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-2xl font-semibold text-foreground leading-relaxed">
                {card.term}
              </p>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              Click to flip
            </div>
          </CardContent>
        </Card>

        {/* Back Side */}
        <Card
          className={cn(
            "flashcard-back cursor-pointer border-2 border-primary/20 bg-primary/5",
            "transition-colors duration-200 hover:border-primary/40 hover:shadow-lg",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            isAnimating && "pointer-events-none",
          )}
          onClick={handleFlip}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFlip();
            }
          }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="text-sm text-primary font-medium">
                DEFINITION
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(card.definition);
                }}
                className="h-8 w-8 opacity-60 hover:opacity-100"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl text-foreground leading-relaxed">
                {card.definition}
              </p>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              Click to flip back
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      {showControls && isFlipped && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => handleMastered(false)}
            className="flex items-center gap-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
            Don't Know
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFlipped(false)}
            className="opacity-60 hover:opacity-100"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleMastered(true)}
            className="flex items-center gap-2 border-success/20 text-success hover:bg-success hover:text-success-foreground"
          >
            <Check className="h-4 w-4" />
            Know
          </Button>
        </div>
      )}
    </div>
  );
}
