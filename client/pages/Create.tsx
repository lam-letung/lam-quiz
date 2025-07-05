import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Upload,
  GripVertical,
  Download,
} from "lucide-react";
import { FlashcardSet, Card as FlashCard } from "@/types/flashcard";
import { generateId, saveSet } from "@/lib/storage";
import { cn } from "@/lib/utils";
import BulkImportModal from "@/components/create/BulkImportModal";

interface CardForm {
  id: string;
  term: string;
  definition: string;
  order: number;
}

export default function Create() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<CardForm[]>([
    { id: generateId(), term: "", definition: "", order: 0 },
    { id: generateId(), term: "", definition: "", order: 1 },
  ]);

  const addCard = () => {
    const newCard: CardForm = {
      id: generateId(),
      term: "",
      definition: "",
      order: cards.length,
    };
    setCards([...cards, newCard]);
  };

  const removeCard = (id: string) => {
    if (cards.length > 1) {
      const newCards = cards
        .filter((card) => card.id !== id)
        .map((card, index) => ({ ...card, order: index }));
      setCards(newCards);
    }
  };

  const updateCard = (
    id: string,
    field: "term" | "definition",
    value: string,
  ) => {
    setCards(
      cards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card,
      ),
    );
  };

  const moveCard = (fromIndex: number, toIndex: number) => {
    const newCards = [...cards];
    const [movedCard] = newCards.splice(fromIndex, 1);
    newCards.splice(toIndex, 0, movedCard);
    setCards(newCards.map((card, index) => ({ ...card, order: index })));
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("Please enter a title");
    const validCards = cards.filter((card) => card.term && card.definition);
    if (!validCards.length) return alert("Need at least one card");
  
    const response = await fetch("/api/flashcard-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        cards: validCards.map((c) => ({ term: c.term, definition: c.definition })),
      }),
    });
  
    if (response.ok) navigate("/");
    else alert("Error saving flashcard set");
  };
  

  const handleBulkImport = (
    importedCards: { term: string; definition: string }[],
  ) => {
    const currentLength = cards.length;
  
    const newCards: CardForm[] = importedCards.map((card, index) => ({
      id: generateId(),
      term: card.term,
      definition: card.definition,
      order: currentLength + index, // nối sau danh sách hiện tại
    }));
  
    setCards((prev) => [...prev, ...newCards]); // ✅ append thay vì replace
  };
  

  const validCardsCount = cards.filter(
    (card) => card.term.trim() && card.definition.trim(),
  ).length;

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Create New Study Set</h1>
            <p className="text-muted-foreground">
              Build your flashcard collection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{validCardsCount} cards</Badge>
            <Button onClick={handleSave} className="gradient-bg gap-2">
              <Save className="h-4 w-4" />
              Save Set
            </Button>
          </div>
        </div>

        {/* Set Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Set Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter a title for your study set"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="focus-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="focus-ring resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Import Options */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <BulkImportModal onImport={handleBulkImport}>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import Cards
                </Button>
              </BulkImportModal>
              <div className="text-sm text-muted-foreground">
                Import from text or file with multiple delimiter options
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cards</h2>
            <Button
              onClick={addCard}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </div>

          {cards.map((card, index) => (
            <Card
              key={card.id}
              className={cn(
                "transition-all-300",
                card.term.trim() && card.definition.trim()
                  ? "border-success/20"
                  : "border-border",
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Textarea
                        placeholder="Enter term"
                        value={card.term}
                        onChange={(e) =>
                          updateCard(card.id, "term", e.target.value)
                        }
                        className="focus-ring resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Definition</Label>
                      <Textarea
                        placeholder="Enter definition"
                        value={card.definition}
                        onChange={(e) =>
                          updateCard(card.id, "definition", e.target.value)
                        }
                        className="focus-ring resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCard(card.id)}
                      disabled={cards.length <= 1}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Card Button */}
          <Card className="border-dashed">
            <CardContent className="p-6">
              <Button
                onClick={addCard}
                variant="ghost"
                className="w-full h-20 border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="text-center">
                  <Plus className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Add another card
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t">
          <div className="text-sm text-muted-foreground">
            {validCardsCount} valid cards • Auto-saved as you type
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gradient-bg gap-2">
              <Save className="h-4 w-4" />
              Create Set
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
