import React, { useEffect, useState } from "react";
import { FlashcardSet, Question, QuestionType } from "@/types/flashcard";
import {
  Card as UICard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnswerCard } from "./AnswerCard";

interface TestModeProps {
  flashcardSet: FlashcardSet;
  onExit?: () => void;
  onBackToList?: () => void;
}

interface TestConfig {
  questionCount: number;
  questionTypes: QuestionType[];
  timeLimit?: number; // phút
  randomize: boolean;
}

export default function TestMode({
  flashcardSet,
  onExit,
  onBackToList,
}: TestModeProps) {
  const [config, setConfig] = useState<TestConfig>({
    questionCount: Math.min(10, flashcardSet.cards.length),
    questionTypes: ["multiple-choice", "true-false"],
    timeLimit: undefined,
    randomize: true,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Khởi động đồng hồ nếu có giới hạn thời gian
  useEffect(() => {
    if (started && config.timeLimit) {
      const timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000 / 60;
        const rem = config.timeLimit! - elapsed;
        if (rem <= 0) {
          finish();
        } else {
          setTimeLeft(rem);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, startTime, config.timeLimit]);

  // Tạo câu hỏi
  function createQuestion(
    card: (typeof flashcardSet.cards)[0],
    type: QuestionType,
    idx: number,
  ): Question {
    const q: Question = {
      id: `q-${idx}`,
      cardId: card.id,
      type,
      question: "",
      correctAnswer: "",
      options: [],
    };
    switch (type) {
      case "multiple-choice":
        q.question = `Định nghĩa của "${card.term}" là?`;
        q.correctAnswer = card.definition;
        const others = flashcardSet.cards
          .filter((c) => c.id !== card.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        q.options = [card.definition, ...others.map((c) => c.definition)].sort(
          () => Math.random() - 0.5,
        );
        break;
      case "true-false":
        const isTrue = Math.random() > 0.5;
        if (isTrue) {
          q.question = `Đúng hay sai: "${card.term}" nghĩa là "${card.definition}"`;
          q.correctAnswer = "True";
        } else {
          const wrong =
            flashcardSet.cards
              .filter((c) => c.id !== card.id)
              .sort(() => Math.random() - 0.5)[0]?.definition || "Sai";
          q.question = `Đúng hay sai: "${card.term}" nghĩa là "${wrong}"`;
          q.correctAnswer = "False";
        }
        q.options = ["True", "False"];
        break;
      case "written":
        q.question = `Viết định nghĩa của "${card.term}"`;
        q.correctAnswer = card.definition;
        break;
      case "fill-blank":
        const words = card.definition.split(" ");
        const bidx = Math.floor(Math.random() * words.length);
        const blank = words[bidx];
        words[bidx] = "_____";
        q.question = `Điền chỗ trống: "${card.term}" nghĩa là "${words.join(
          " ",
        )}"`;
        q.correctAnswer = blank;
        break;
    }
    return q;
  }

  // Sinh danh sách câu hỏi
  const generate = () => {
    let pool = config.randomize
      ? [...flashcardSet.cards].sort(() => Math.random() - 0.5)
      : flashcardSet.cards;
    pool = pool.slice(0, config.questionCount);
    setQuestions(
      pool.map((c, i) =>
        createQuestion(
          c,
          config.questionTypes[
            Math.floor(Math.random() * config.questionTypes.length)
          ],
          i,
        ),
      ),
    );
  };

  // Bắt đầu bài test
  const start = () => {
    generate();
    setStarted(true);
    setStartTime(Date.now());
    if (config.timeLimit) setTimeLeft(config.timeLimit);
  };

  // Lưu đáp án
  const record = (qid: string, val: string) => {
    setAnswers((a) => ({ ...a, [qid]: val }));
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid ? { ...q, userAnswer: val, isCorrect: check(q, val) } : q,
      ),
    );
  };

  // Kiểm tra đáp án
  const check = (q: Question, ans: string) => {
    if (!ans) return false;
    if (q.type === "multiple-choice" || q.type === "true-false") {
      return ans === q.correctAnswer;
    }
    const u = ans.toLowerCase().trim();
    const c = q.correctAnswer.toLowerCase().trim();
    return u === c || u.includes(c) || c.includes(u);
  };

  // Chuyển câu kế tiếp
  const next = () => {
    const q = questions[current];
    const ans = answers[q.id] || "";
    if (!ans.trim()) {
      toast.error("Bạn chưa chọn/nhập câu trả lời!");
      return;
    }
    // đánh dấu highlight ngay:
    setQuestions((qs) =>
      qs.map((x) =>
        x.id === q.id ? { ...x, userAnswer: ans, isCorrect: check(x, ans) } : x,
      ),
    );
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else finish();
  };

  // Quay lại
  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  // Kết thúc và hiện màn tổng kết
  const finish = () => {
    // đánh dấu tất cả
    const scored = questions.map((q) => ({
      ...q,
      userAnswer: answers[q.id] || "",
      isCorrect: check(q, answers[q.id] || ""),
    }));
    setQuestions(scored);
    setCompleted(true);
    const right = scored.filter((q) => q.isCorrect).length;
    const pct = Math.round((right / scored.length) * 100);
    toast.success(`Bạn hoàn thành: ${pct}%`);
    onComplete?.(pct, scored as Question[]);
  };

  // Định dạng thời gian
  const fmtTime = (m: number) => {
    const mm = Math.floor(m);
    const ss = Math.floor((m - mm) * 60);
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  // ---------- Render ----------

  // 1. Giao diện Cấu hình trước khi bắt đầu
  if (!started) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Cấu hình bài test</h1>
        </div>
        <UICard>
          <CardHeader>
            <CardTitle>Thiết lập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Số câu hỏi</Label>
              <Input
                type="number"
                min={1}
                max={flashcardSet.cards.length}
                value={config.questionCount}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    questionCount: Math.min(
                      parseInt(e.target.value) || 1,
                      flashcardSet.cards.length,
                    ),
                  }))
                }
                className="w-20"
              />
            </div>
            <div>
              <Label>Loại câu hỏi</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "multiple-choice", txt: "Trắc nghiệm" },
                  { id: "true-false", txt: "Đúng/Sai" },
                  { id: "written", txt: "Tự luận" },
                  { id: "fill-blank", txt: "Điền khuyết" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.questionTypes.includes(opt.id as any)}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          questionTypes: e.target.checked
                            ? [...c.questionTypes, opt.id as any]
                            : c.questionTypes.filter((t) => t !== opt.id),
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span>{opt.txt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Thời gian (phút, tuỳ chọn)</Label>
              <Input
                type="number"
                placeholder="Không giới hạn"
                value={config.timeLimit ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    timeLimit: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                className="w-24"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.randomize}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, randomize: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <Label>Trộn ngẫu nhiên</Label>
            </div>
            <Button
              onClick={start}
              disabled={config.questionTypes.length === 0}
              className="w-full gradient-bg"
            >
              Bắt đầu
            </Button>
          </CardContent>
        </UICard>
      </div>
    );
  }

  // 2. Khi test xong: màn tổng kết
  if (completed) {
    const right = questions.filter((q) => q.isCorrect).length;
    const score = Math.round((right / questions.length) * 100);
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <Trophy className="mx-auto h-16 w-16 text-primary mb-4" />
          <h2 className="text-3xl font-bold">Kết thúc bài test</h2>
          <p className="text-lg">Điểm của bạn: {score}%</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UICard>
            <CardContent className="text-center">
              <div className="text-2xl font-bold">{score}%</div>
              <div>Điểm</div>
            </CardContent>
          </UICard>
          <UICard>
            <CardContent className="text-center">
              <div className="text-2xl font-bold">
                {right}/{questions.length}
              </div>
              <div>Đúng</div>
            </CardContent>
          </UICard>
          <UICard>
            <CardContent className="text-center">
              <div className="text-2xl font-bold">
                {config.timeLimit ? fmtTime(config.timeLimit - timeLeft) : "—"}
              </div>
              <div>Thời gian</div>
            </CardContent>
          </UICard>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <UICard
              key={q.id}
              className={cn(
                "border-l-4",
                q.isCorrect ? "border-l-success" : "border-l-destructive",
              )}
            >
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  {q.isCorrect ? (
                    <CheckCircle className="text-success" />
                  ) : (
                    <XCircle className="text-destructive" />
                  )}
                  <span>
                    {i + 1}. {q.question}
                  </span>
                </div>
                <div className="text-sm">
                  <div>
                    Đáp án bạn chọn:{" "}
                    <strong
                      className={
                        q.isCorrect ? "text-success" : "text-destructive"
                      }
                    >
                      {q.userAnswer || "Không có"}
                    </strong>
                  </div>
                  {!q.isCorrect && (
                    <div>
                      Đáp án đúng:{" "}
                      <strong className="text-success">
                        {q.correctAnswer}
                      </strong>
                    </div>
                  )}
                </div>
              </CardContent>
            </UICard>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Test lại
          </Button>
          <Button onClick={onBackToList || onExit}>Quay về danh sách</Button>
        </div>
      </div>
    );
  }

  // 3. Khi đang làm bài
  const q = questions[current];
  const prog = ((current + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-xl font-bold">{flashcardSet.title}</h3>
            <p className="text-sm text-muted-foreground">
              Câu {current + 1}/{questions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {config.timeLimit && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{fmtTime(timeLeft)}</span>
            </div>
          )}
          <Badge variant="secondary">{Math.round(prog)}%</Badge>
        </div>
      </div>

      {/* Thanh tiến độ */}
      <Progress value={prog} />

      {/* Câu hỏi */}
      <UICard>
        <CardHeader>
          <CardTitle className="text-lg">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trắc nghiệm / Đúng sai */}
          {(q.type === "multiple-choice" || q.type === "true-false") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {q.options.map((opt, i) => {
                const chosen = answers[q.id];
                const userAnswered = q.userAnswer !== undefined;

                const isSelected = chosen === opt;
                const isCorrect = userAnswered && opt === q.correctAnswer;
                const isWrong = userAnswered && isSelected && !isCorrect;

                return (
                  <AnswerCard
                    key={i}
                    label={opt}
                    selected={!userAnswered && isSelected}
                    correct={opt === q.correctAnswer && userAnswered}
                    wrong={isSelected && !isCorrect && userAnswered}
                    disabled={userAnswered}
                    onClick={() => record(q.id, opt)}
                  />
                );
              })}
            </div>
          )}

          {/* Viết và điền khuyết */}
          {(q.type === "written" || q.type === "fill-blank") && (
            <div className="space-y-2">
              <Textarea
                placeholder="Nhập đáp án..."
                value={answers[q.id] || ""}
                onChange={(e) => record(q.id, e.target.value)}
                rows={3}
                readOnly={!!questions[current].userAnswer} // khoá sau khi trả lời
                className={cn(
                  questions[current].userAnswer
                    ? questions[current].isCorrect
                      ? "border-success/50 focus:border-success"
                      : "border-destructive/50 focus:border-destructive"
                    : "",
                )}
              />
              {/* nếu đã trả lời và sai thì show đáp án đúng */}
              {questions[current].userAnswer &&
                !questions[current].isCorrect && (
                  <div className="text-sm text-destructive">
                    Đáp án đúng: <strong>{q.correctAnswer}</strong>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </UICard>
      {/* Điều hướng */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={current === 0}>
          Trước
        </Button>
        <Button onClick={next}>
          {current === questions.length - 1 ? "Kết thúc" : "Tiếp theo"}
        </Button>
      </div>
    </div>
  );
}
