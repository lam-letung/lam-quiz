import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import TestMode from "@/components/test/TestMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlashcardSet, Question } from "@/types/flashcard";
import { ArrowLeft, PenTool, Clock, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function TestPage() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { userId, loading: authLoading } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selected, setSelected] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [inTest, setInTest] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!userId) {
        return navigate("/login");
      }
      load();
    }
  }, [authLoading, userId, setId]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/me/flashcard-sets", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data: FlashcardSet[] = await res.json();
      setSets(data);
      if (setId) {
        const f = data.find(s => s.id === setId);
        if (f) {
          setSelected(f);
          setInTest(true);
        }
      }
    } catch {
      console.error("Không tải được bộ flashcard");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">Đang tải…</div>
      </AppLayout>
    );
  }

  if (inTest && selected) {
    return (
      <AppLayout showSidebar={false}>
        <TestMode
          flashcardSet={selected}
          onComplete={(score, results: Question[]) => {
            console.log("Kết quả:", score, results);
            setInTest(false);
            setSelected(null);
            navigate("/test");
          }}
          onExit={() => {
            setInTest(false);
            setSelected(null);
            navigate("/test");
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Chọn bộ flashcard để làm bài</h1>
        </div>

        {sets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <PenTool className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>Chưa có bộ flashcard nào.</p>
              <Link to="/create">
                <Button className="mt-4 gradient-bg">Tạo bộ mới</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:shadow-lg transition"
                onClick={() => {
                  setSelected(s);
                  setInTest(true);
                  navigate(`/test/${s.id}`);
                }}
              >
                <CardHeader>
                  <CardTitle>{s.title}</CardTitle>
                  <Badge variant="secondary">
                    {s.cards.length} câu
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground truncate">
                    {s.description || "—"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
