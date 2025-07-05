import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Check,
  X,
  Star,
  RotateCcw,
  Share2,
  Download,
} from "lucide-react";
import { StudySession, QuestionAnswer } from "@/types/scoring";
import { cn } from "@/lib/utils";

interface ResultsSummaryProps {
  session: StudySession;
  answers?: QuestionAnswer[];
  onRestart?: () => void;
  onContinue?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  className?: string;
}

export default function ResultsSummary({
  session,
  answers = [],
  onRestart,
  onContinue,
  onShare,
  onExport,
  className,
}: ResultsSummaryProps) {
  const accuracy = (session.correctAnswers / session.totalQuestions) * 100;
  const timePerQuestion = session.timeSpent / session.totalQuestions;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPerformanceGrade = () => {
    if (accuracy >= 90)
      return { grade: "A", color: "text-green-600", bg: "bg-green-100" };
    if (accuracy >= 80)
      return { grade: "B", color: "text-blue-600", bg: "bg-blue-100" };
    if (accuracy >= 70)
      return { grade: "C", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (accuracy >= 60)
      return { grade: "D", color: "text-orange-600", bg: "bg-orange-100" };
    return { grade: "F", color: "text-red-600", bg: "bg-red-100" };
  };

  const performance = getPerformanceGrade();

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className={cn("p-6 rounded-full", performance.bg)}>
            <Trophy className={cn("h-12 w-12", performance.color)} />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Study Session Complete!</h1>
          <p className="text-muted-foreground">
            Great job! Here's how you performed.
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className={cn("text-4xl font-bold mb-2", performance.color)}>
              {performance.grade}
            </div>
            <div className="text-sm text-muted-foreground">Grade</div>
            <div className="text-lg font-semibold mt-1">
              {Math.round(accuracy)}%
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-4xl font-bold mb-2">{session.score}</div>
            <div className="text-sm text-muted-foreground">Total Score</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Points Earned</span>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-4xl font-bold mb-2">
              {session.correctAnswers}/{session.totalQuestions}
            </div>
            <div className="text-sm text-muted-foreground">Correct Answers</div>
            <div className="text-lg font-semibold text-green-600 mt-1">
              {Math.round(accuracy)}% Accuracy
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-4xl font-bold mb-2">
              {formatTime(session.timeSpent)}
            </div>
            <div className="text-sm text-muted-foreground">Time Spent</div>
            <div className="text-sm mt-1">
              {Math.round(timePerQuestion)}s per question
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Accuracy Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accuracy</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(accuracy)}%
              </span>
            </div>
            <Progress value={accuracy} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>{session.correctAnswers} Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-500" />
                <span>{session.wrongAnswers} Incorrect</span>
              </div>
            </div>
          </div>

          {/* Time Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-semibold">
                {formatTime(session.timeSpent)}
              </div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-semibold">
                {Math.round(timePerQuestion)}s
              </div>
              <div className="text-xs text-muted-foreground">Per Question</div>
            </div>
            <div className="text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-lg font-semibold">
                {timePerQuestion < 10
                  ? "Fast"
                  : timePerQuestion < 20
                    ? "Good"
                    : "Slow"}
              </div>
              <div className="text-xs text-muted-foreground">Speed Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Breakdown */}
      {answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    answer.isCorrect
                      ? "border-l-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-l-red-500 bg-red-50 dark:bg-red-950/20",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          Question {index + 1}
                        </span>
                        {answer.isCorrect ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <Badge
                          variant={answer.isCorrect ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {answer.isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Your answer:{" "}
                          </span>
                          <span
                            className={
                              answer.isCorrect
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {answer.userAnswer}
                          </span>
                        </div>
                        {!answer.isCorrect && (
                          <div>
                            <span className="text-muted-foreground">
                              Correct answer:{" "}
                            </span>
                            <span className="text-green-600 font-medium">
                              {answer.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {answer.timeSpent}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {onRestart && (
          <Button
            variant="outline"
            onClick={onRestart}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Study Again
          </Button>
        )}

        {onShare && (
          <Button
            variant="outline"
            onClick={onShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        )}

        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        )}

        {onContinue && (
          <Button
            onClick={onContinue}
            className="bg-primary hover:bg-primary/90"
          >
            Continue Learning
          </Button>
        )}
      </div>
    </div>
  );
}
