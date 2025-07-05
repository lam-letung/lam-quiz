import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Brain,
  Clock,
  Target,
  Zap,
  Shuffle,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Timer,
  TrendingUp,
  Award,
  Star,
  Lightning,
  Focus,
  Gamepad2,
  Layers,
  BookOpen,
  PenTool,
  Mic,
  Volume2,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { FlashcardSet, Card as FlashCard } from "@/types/flashcard";
import { StudySession } from "@/types/scoring";

interface AdvancedStudyModesProps {
  set: FlashcardSet;
  onComplete?: (session: StudySession) => void;
  onExit?: () => void;
}

interface StudyModeConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  features: string[];
  settings: { [key: string]: any };
}

interface StudySessionState {
  mode: string;
  currentCardIndex: number;
  cards: FlashCard[];
  startTime: Date;
  responses: { cardId: string; correct: boolean; responseTime: number }[];
  score: number;
  streak: number;
  timeRemaining?: number;
  isPaused: boolean;
  showSettings: boolean;
}

export const AdvancedStudyModes: React.FC<AdvancedStudyModesProps> = ({
  set,
  onComplete,
  onExit,
}) => {
  const [selectedMode, setSelectedMode] = useState<StudyModeConfig | null>(
    null,
  );
  const [sessionState, setSessionState] = useState<StudySessionState | null>(
    null,
  );
  const [showModeSelector, setShowModeSelector] = useState(true);

  const studyModes: StudyModeConfig[] = [
    {
      id: "spaced_repetition",
      name: "Spaced Repetition",
      description: "AI-powered review based on your memory strength",
      icon: <Brain className="w-6 h-6" />,
      difficulty: "medium",
      estimatedTime: 15,
      features: ["Adaptive scheduling", "Memory tracking", "Optimal intervals"],
      settings: {
        algorithm: "sm2",
        initialInterval: 1,
        maxInterval: 180,
        easeFactor: 2.5,
      },
    },
    {
      id: "speed_drill",
      name: "Speed Drill",
      description: "Rapid-fire review to improve recall speed",
      icon: <Zap className="w-6 h-6" />,
      difficulty: "hard",
      estimatedTime: 10,
      features: ["Time pressure", "Speed tracking", "Streak bonuses"],
      settings: {
        timePerCard: 5,
        showTimer: true,
        streakBonus: true,
        penalizeWrong: true,
      },
    },
    {
      id: "adaptive_difficulty",
      name: "Adaptive Learning",
      description: "Difficulty adjusts based on your performance",
      icon: <Target className="w-6 h-6" />,
      difficulty: "medium",
      estimatedTime: 20,
      features: ["Dynamic difficulty", "Performance tracking", "Weak spots"],
      settings: {
        minDifficulty: 1,
        maxDifficulty: 5,
        adaptationRate: 0.1,
        focusWeakCards: true,
      },
    },
    {
      id: "memory_palace",
      name: "Memory Palace",
      description: "Visual memory techniques with spatial association",
      icon: <Layers className="w-6 h-6" />,
      difficulty: "hard",
      estimatedTime: 25,
      features: ["Visual mnemonics", "Spatial memory", "Story building"],
      settings: {
        useImages: true,
        createStories: true,
        spatialLayout: true,
        memoryPrompts: true,
      },
    },
    {
      id: "competitive_mode",
      name: "Competitive Challenge",
      description: "Compete against your past performance or others",
      icon: <Award className="w-6 h-6" />,
      difficulty: "hard",
      estimatedTime: 15,
      features: ["Leaderboards", "Achievement unlocks", "Performance stats"],
      settings: {
        competitionType: "personal_best",
        showLeaderboard: true,
        unlockAchievements: true,
        publicScore: false,
      },
    },
    {
      id: "focus_mode",
      name: "Deep Focus",
      description: "Distraction-free studying with concentration aids",
      icon: <Focus className="w-6 h-6" />,
      difficulty: "easy",
      estimatedTime: 30,
      features: ["Minimal UI", "Background sounds", "Break reminders"],
      settings: {
        minimalInterface: true,
        backgroundSound: "white_noise",
        breakInterval: 25,
        blockNotifications: true,
      },
    },
    {
      id: "listening_mode",
      name: "Audio Learning",
      description: "Text-to-speech for auditory learning",
      icon: <Volume2 className="w-6 h-6" />,
      difficulty: "easy",
      estimatedTime: 20,
      features: ["Text-to-speech", "Audio controls", "Hands-free mode"],
      settings: {
        speechRate: 1.0,
        autoPlay: true,
        repeatCount: 1,
        voiceGender: "female",
      },
    },
    {
      id: "writing_practice",
      name: "Writing Practice",
      description: "Type or write answers to improve retention",
      icon: <PenTool className="w-6 h-6" />,
      difficulty: "medium",
      estimatedTime: 25,
      features: ["Typing practice", "Spelling check", "Writing analysis"],
      settings: {
        requireTyping: true,
        spellCheck: true,
        caseSensitive: false,
        showHints: true,
      },
    },
  ];

  const startStudyMode = (mode: StudyModeConfig) => {
    setSelectedMode(mode);
    setShowModeSelector(false);

    // Prepare cards based on mode
    let studyCards = [...set.cards];

    // Apply mode-specific card preparation
    switch (mode.id) {
      case "spaced_repetition":
        // Sort by memory strength (simplified)
        studyCards = studyCards.sort((a, b) => (a.mastered ? 1 : -1));
        break;
      case "speed_drill":
        // Shuffle for variety
        studyCards = shuffleArray(studyCards);
        break;
      case "adaptive_difficulty":
        // Start with easier cards
        studyCards = studyCards.sort((a, b) => a.term.length - b.term.length);
        break;
      default:
        studyCards = shuffleArray(studyCards);
    }

    setSessionState({
      mode: mode.id,
      currentCardIndex: 0,
      cards: studyCards,
      startTime: new Date(),
      responses: [],
      score: 0,
      streak: 0,
      timeRemaining: mode.settings.timePerCard
        ? mode.settings.timePerCard
        : undefined,
      isPaused: false,
      showSettings: false,
    });
  };

  const handleCardResponse = (correct: boolean, responseTime: number) => {
    if (!sessionState || !selectedMode) return;

    const currentCard = sessionState.cards[sessionState.currentCardIndex];
    const newResponse = {
      cardId: currentCard.id,
      correct,
      responseTime,
    };

    const newScore = correct
      ? sessionState.score + (sessionState.streak >= 3 ? 15 : 10)
      : sessionState.score;
    const newStreak = correct ? sessionState.streak + 1 : 0;

    setSessionState((prev) => ({
      ...prev!,
      responses: [...prev!.responses, newResponse],
      score: newScore,
      streak: newStreak,
      currentCardIndex: prev!.currentCardIndex + 1,
    }));

    // Check if session is complete
    if (sessionState.currentCardIndex + 1 >= sessionState.cards.length) {
      completeSession();
    }
  };

  const completeSession = () => {
    if (!sessionState || !selectedMode) return;

    const endTime = new Date();
    const duration =
      (endTime.getTime() - sessionState.startTime.getTime()) / 1000;
    const accuracy =
      sessionState.responses.filter((r) => r.correct).length /
      sessionState.responses.length;

    const session: StudySession = {
      id: `session_${Date.now()}`,
      setId: set.id,
      mode: "advanced" as any, // Extended from base type
      startTime: sessionState.startTime.toISOString(),
      endTime: endTime.toISOString(),
      cardsStudied: sessionState.responses.length,
      accuracy,
    };

    toast.success(
      `Session complete! Score: ${sessionState.score}, Accuracy: ${Math.round(accuracy * 100)}%`,
    );

    onComplete?.(session);
  };

  const pauseSession = () => {
    setSessionState((prev) => prev && { ...prev, isPaused: !prev.isPaused });
  };

  const exitSession = () => {
    setSessionState(null);
    setSelectedMode(null);
    setShowModeSelector(true);
    onExit?.();
  };

  if (showModeSelector) {
    return <ModeSelector modes={studyModes} onModeSelect={startStudyMode} />;
  }

  if (!sessionState || !selectedMode) {
    return null;
  }

  return (
    <StudyInterface
      mode={selectedMode}
      sessionState={sessionState}
      onCardResponse={handleCardResponse}
      onPause={pauseSession}
      onExit={exitSession}
    />
  );
};

// Mode Selector Component
const ModeSelector: React.FC<{
  modes: StudyModeConfig[];
  onModeSelect: (mode: StudyModeConfig) => void;
}> = ({ modes, onModeSelect }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "hard":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Choose Your Study Mode
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Select the learning method that works best for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => onModeSelect(mode)}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-600 dark:text-blue-400">
                  {mode.icon}
                </div>
                <Badge
                  variant="outline"
                  className={getDifficultyColor(mode.difficulty)}
                >
                  {mode.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {mode.name}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {mode.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />~{mode.estimatedTime}{" "}
                  minutes
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Features:</div>
                  <div className="flex flex-wrap gap-1">
                    {mode.features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full group-hover:bg-blue-600 transition-colors"
                  onClick={() => onModeSelect(mode)}
                >
                  Start Session
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Study Interface Component
const StudyInterface: React.FC<{
  mode: StudyModeConfig;
  sessionState: StudySessionState;
  onCardResponse: (correct: boolean, responseTime: number) => void;
  onPause: () => void;
  onExit: () => void;
}> = ({ mode, sessionState, onCardResponse, onPause, onExit }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<Date>(new Date());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const currentCard = sessionState.cards[sessionState.currentCardIndex];
  const progress =
    (sessionState.currentCardIndex / sessionState.cards.length) * 100;

  useEffect(() => {
    setResponseStartTime(new Date());
    setIsFlipped(false);

    if (mode.settings.timePerCard && !sessionState.isPaused) {
      setTimeLeft(mode.settings.timePerCard);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            // Auto-advance on timeout
            handleResponse(false);
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionState.currentCardIndex, sessionState.isPaused]);

  const handleResponse = (correct: boolean) => {
    const responseTime =
      (new Date().getTime() - responseStartTime.getTime()) / 1000;
    onCardResponse(correct, responseTime);
  };

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (sessionState.isPaused) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Pause className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Session Paused</h3>
            <p className="text-gray-600 mb-6">
              Take a break and resume when ready
            </p>
            <div className="space-y-3">
              <Button onClick={onPause} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button variant="outline" onClick={onExit} className="w-full">
                Exit Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-blue-600 dark:text-blue-400">{mode.icon}</div>
            <div>
              <h2 className="font-semibold">{mode.name}</h2>
              <p className="text-sm text-gray-500">
                Card {sessionState.currentCardIndex + 1} of{" "}
                {sessionState.cards.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Score Display */}
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {sessionState.score}
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>

            {/* Streak Display */}
            {sessionState.streak > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {sessionState.streak}
                </div>
                <div className="text-xs text-gray-500">Streak</div>
              </div>
            )}

            {/* Timer */}
            {timeLeft !== null && (
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${
                    timeLeft <= 3 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {timeLeft}s
                </div>
                <div className="text-xs text-gray-500">Time</div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onExit}>
                Exit
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="min-h-[400px] flex items-center justify-center">
          {/* Flashcard */}
          <Card
            className={`w-full max-w-2xl min-h-[300px] cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
              isFlipped ? "bg-blue-50 dark:bg-blue-950/20" : ""
            }`}
            onClick={handleCardFlip}
          >
            <CardContent className="p-12 text-center flex items-center justify-center min-h-[300px]">
              <div className="w-full">
                {!isFlipped ? (
                  <div>
                    <div className="text-sm text-gray-500 mb-4">Term</div>
                    <div className="text-2xl font-medium mb-8">
                      {currentCard.term}
                    </div>
                    <div className="text-sm text-gray-400">
                      Click to reveal definition
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-500 mb-4">Definition</div>
                    <div className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                      {currentCard.definition}
                    </div>
                    <div className="text-sm text-gray-400">
                      How well did you know this?
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Buttons */}
        {isFlipped && (
          <div className="flex justify-center space-x-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleResponse(false)}
              className="flex items-center space-x-2 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <XCircle className="w-5 h-5 text-red-500" />
              <span>Didn't Know</span>
            </Button>
            <Button
              size="lg"
              onClick={() => handleResponse(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Got It Right</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Utility functions
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
