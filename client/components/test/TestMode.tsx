import { useState, useEffect } from "react";
import { FlashcardSet, Card, Question, QuestionType } from "@/types/flashcard";
import {
  Card as UICard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TestModeProps {
  flashcardSet: FlashcardSet;
  onComplete?: (score: number, results: Question[]) => void;
  onExit?: () => void;
}

interface TestConfig {
  questionCount: number;
  questionTypes: QuestionType[];
  timeLimit?: number; // in minutes
  randomize: boolean;
}

export default function TestMode({
  flashcardSet,
  onComplete,
  onExit,
}: TestModeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [config, setConfig] = useState<TestConfig>({
    questionCount: Math.min(10, flashcardSet.cards.length),
    questionTypes: ["multiple-choice", "true-false"],
    timeLimit: undefined,
    randomize: true,
  });

  useEffect(() => {
    if (testStarted && config.timeLimit) {
      const timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
        const remaining = config.timeLimit! - elapsed;

        if (remaining <= 0) {
          finishTest();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, startTime, config.timeLimit]);

  const generateQuestions = () => {
    const selectedCards = config.randomize
      ? [...flashcardSet.cards].sort(() => Math.random() - 0.5)
      : flashcardSet.cards;

    const cardsToUse = selectedCards.slice(0, config.questionCount);
    const generatedQuestions: Question[] = [];

    cardsToUse.forEach((card, index) => {
      const questionType =
        config.questionTypes[
          Math.floor(Math.random() * config.questionTypes.length)
        ];

      const question = createQuestion(card, questionType, index);
      generatedQuestions.push(question);
    });

    setQuestions(generatedQuestions);
  };

  const createQuestion = (
    card: Card,
    type: QuestionType,
    index: number,
  ): Question => {
    const question: Question = {
      id: `q-${index}`,
      cardId: card.id,
      type,
      question: "",
      correctAnswer: "",
      options: [],
    };

    switch (type) {
      case "multiple-choice":
        question.question = `What is the definition of "${card.term}"?`;
        question.correctAnswer = card.definition;

        // Generate wrong answers from other cards
        const otherCards = flashcardSet.cards
          .filter((c) => c.id !== card.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        question.options = [
          card.definition,
          ...otherCards.map((c) => c.definition),
        ].sort(() => Math.random() - 0.5);
        break;

      case "true-false":
        const isCorrect = Math.random() > 0.5;
        if (isCorrect) {
          question.question = `True or False: "${card.term}" means "${card.definition}"`;
          question.correctAnswer = "True";
        } else {
          const wrongDefinition =
            flashcardSet.cards
              .filter((c) => c.id !== card.id)
              .sort(() => Math.random() - 0.5)[0]?.definition ||
            "Wrong definition";
          question.question = `True or False: "${card.term}" means "${wrongDefinition}"`;
          question.correctAnswer = "False";
        }
        question.options = ["True", "False"];
        break;

      case "written":
        question.question = `What does "${card.term}" mean?`;
        question.correctAnswer = card.definition;
        break;

      case "fill-blank":
        const words = card.definition.split(" ");
        const blankIndex = Math.floor(Math.random() * words.length);
        const blankWord = words[blankIndex];
        words[blankIndex] = "_____";
        question.question = `Fill in the blank: "${card.term}" means "${words.join(" ")}"`;
        question.correctAnswer = blankWord;
        break;
    }

    return question;
  };

  const startTest = () => {
    generateQuestions();
    setTestStarted(true);
    setStartTime(Date.now());
    if (config.timeLimit) {
      setTimeRemaining(config.timeLimit);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishTest();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishTest = () => {
    const updatedQuestions = questions.map((q) => ({
      ...q,
      userAnswer: answers[q.id] || "",
      isCorrect: checkAnswer(q, answers[q.id] || ""),
    }));

    setQuestions(updatedQuestions);
    setTestCompleted(true);

    const score = Math.round(
      (updatedQuestions.filter((q) => q.isCorrect).length /
        updatedQuestions.length) *
        100,
    );

    onComplete?.(score, updatedQuestions);
  };

  const checkAnswer = (question: Question, userAnswer: string): boolean => {
    if (!userAnswer.trim()) return false;

    switch (question.type) {
      case "multiple-choice":
      case "true-false":
        return userAnswer === question.correctAnswer;

      case "written":
      case "fill-blank":
        const normalizedUser = userAnswer.toLowerCase().trim();
        const normalizedCorrect = question.correctAnswer.toLowerCase().trim();
        // Allow some flexibility for written answers
        return (
          normalizedUser === normalizedCorrect ||
          normalizedUser.includes(normalizedCorrect) ||
          normalizedCorrect.includes(normalizedUser)
        );

      default:
        return false;
    }
  };

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Configuration Screen
  if (!testStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Test Configuration</h1>
            <p className="text-muted-foreground">
              Set up your test for {flashcardSet.title}
            </p>
          </div>
        </div>

        <UICard>
          <CardHeader>
            <CardTitle>Test Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Number of Questions</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max={flashcardSet.cards.length}
                  value={config.questionCount}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      questionCount: Math.min(
                        parseInt(e.target.value) || 1,
                        flashcardSet.cards.length,
                      ),
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  Max: {flashcardSet.cards.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Question Types</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "multiple-choice", label: "Multiple Choice" },
                  { id: "true-false", label: "True/False" },
                  { id: "written", label: "Written" },
                  { id: "fill-blank", label: "Fill in Blank" },
                ].map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={type.id}
                      checked={config.questionTypes.includes(
                        type.id as QuestionType,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({
                            ...config,
                            questionTypes: [
                              ...config.questionTypes,
                              type.id as QuestionType,
                            ],
                          });
                        } else {
                          setConfig({
                            ...config,
                            questionTypes: config.questionTypes.filter(
                              (t) => t !== type.id,
                            ),
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={type.id} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Time Limit (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="No limit"
                  value={config.timeLimit || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      timeLimit: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="randomize"
                checked={config.randomize}
                onChange={(e) =>
                  setConfig({ ...config, randomize: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="randomize" className="text-sm">
                Randomize question order
              </Label>
            </div>

            <Button
              onClick={startTest}
              disabled={config.questionTypes.length === 0}
              className="w-full gradient-bg"
              size="lg"
            >
              Start Test
            </Button>
          </CardContent>
        </UICard>
      </div>
    );
  }

  // Test Results Screen
  if (testCompleted) {
    const correctAnswers = questions.filter((q) => q.isCorrect).length;
    const score = Math.round((correctAnswers / questions.length) * 100);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Test Complete!</h1>
          <p className="text-muted-foreground">
            You scored {score}% on {flashcardSet.title}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <UICard>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{score}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </CardContent>
          </UICard>
          <UICard>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {correctAnswers}/{questions.length}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </CardContent>
          </UICard>
          <UICard>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {config.timeLimit
                  ? formatTime(config.timeLimit - timeRemaining)
                  : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">Time</div>
            </CardContent>
          </UICard>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Review Answers</h2>
          {questions.map((question, index) => (
            <UICard
              key={question.id}
              className={cn(
                "border-l-4",
                question.isCorrect
                  ? "border-l-success"
                  : "border-l-destructive",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {question.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium mb-2">{question.question}</div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Your answer:{" "}
                        </span>
                        <span
                          className={
                            question.isCorrect
                              ? "text-success"
                              : "text-destructive"
                          }
                        >
                          {question.userAnswer || "No answer"}
                        </span>
                      </div>
                      {!question.isCorrect && (
                        <div>
                          <span className="text-muted-foreground">
                            Correct answer:{" "}
                          </span>
                          <span className="text-success">
                            {question.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </UICard>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Test
          </Button>
          <Button onClick={onExit}>Back to Tests</Button>
        </div>
      </div>
    );
  }

  // Test Taking Screen
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Test: {flashcardSet.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {config.timeLimit && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
          )}
          <Badge variant="secondary">{Math.round(progress)}% Complete</Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-8" />

      {/* Question */}
      {currentQ && (
        <UICard className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.question}</CardTitle>
            <Badge variant="outline" className="w-fit">
              {currentQ.type.replace("-", " ").toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {(currentQ.type === "multiple-choice" ||
              currentQ.type === "true-false") && (
              <RadioGroup
                value={answers[currentQ.id] || ""}
                onValueChange={(value) => handleAnswer(currentQ.id, value)}
              >
                {currentQ.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {(currentQ.type === "written" ||
              currentQ.type === "fill-blank") && (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                className="resize-none"
                rows={3}
              />
            )}
          </CardContent>
        </UICard>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Use arrow keys to navigate
        </div>

        <Button
          onClick={nextQuestion}
          className={cn(
            currentQuestion === questions.length - 1
              ? "gradient-bg"
              : "bg-primary hover:bg-primary/90",
          )}
        >
          {currentQuestion === questions.length - 1 ? "Finish Test" : "Next"}
        </Button>
      </div>
    </div>
  );
}
