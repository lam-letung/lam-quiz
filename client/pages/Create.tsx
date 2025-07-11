import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Upload,
  GripVertical,
} from "lucide-react";
import { generateId } from "@/lib/storage";
import { cn } from "@/lib/utils";
import BulkImportModal from "@/components/create/BulkImportModal";
import { Workplace } from "@/types/flashcard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  // đọc giá trị workspace truyền từ modal
  const location = useLocation();
  const prefillWorkspaceId = (location.state as any)?.prefillWorkspaceId;
  const [workplaceId, setWorkplaceId] = useState(prefillWorkspaceId || "");

  const [cards, setCards] = useState<CardForm[]>([
    { id: generateId(), term: "", definition: "", order: 0 },
    { id: generateId(), term: "", definition: "", order: 1 },
  ]);

  const [termLang, setTermLang] = useState("en");
  const [defLang, setDefLang] = useState("vi");

  

  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  useEffect(() => {
    fetch("/api/me/workplaces")
      .then((r) => r.json())
      .then((data) => {
        setWorkplaces(data);
        if (
          prefillWorkspaceId &&
          data.some((w) => w.id === prefillWorkspaceId)
        ) {
          setWorkplaceId(prefillWorkspaceId);
        }
      });
  }, []);

  useEffect(() => {
    if (prefillWorkspaceId) {
      // remove state from history
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  // ✅ Fix Bug 1: Add loading state to prevent double submit
  const [isSaving, setIsSaving] = useState(false);

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

  // ✅ Fix Bug 1: Prevent double submit with loading state
  const handleSave = async () => {
    if (isSaving) return; // Prevent double submit

    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your study set",
        variant: "destructive",
      });
      return;
    }

    const validCards = cards.filter((card) => card.term && card.definition);
    if (!validCards.length) {
      toast({
        title: "No Valid Cards",
        description: "You need at least one card with both term and definition",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/flashcard-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          workplaceId: workplaceId || null,
          cards: validCards.map((c) => ({
            term: c.term,
            definition: c.definition,
          })),
          termLanguage: termLang,
          definitionLanguage: defLang,
        }),
      });
      if (res.ok) {
        // redirect về Index với workspaceId
        navigate("/", {
          state: { afterCreateWorkspace: workplaceId || "all" },
        });
      } else {
        toast({
          title: "Save Failed",
          description: "Failed to save your flashcard set. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description:
          "Unable to save flashcard set. Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Fix Bug 2: Smart import logic - replace empty cards or append to existing
  const handleBulkImport = (
    importedCards: { term: string; definition: string }[],
  ) => {
    if (!importedCards.length) {
      toast({
        title: "No Cards Imported",
        description: "No valid cards found to import",
        variant: "destructive",
      });
      return;
    }

    // Check if current cards are all empty
    const hasValidCards = cards.some(
      (card) => card.term.trim() || card.definition.trim(),
    );

    const newCards: CardForm[] = importedCards.map((card, index) => ({
      id: generateId(),
      term: card.term,
      definition: card.definition,
      order: hasValidCards ? cards.length + index : index, // Start from 0 if replacing
    }));

    if (hasValidCards) {
      // Append to existing cards
      setCards((prev) => [...prev, ...newCards]);
      toast({
        title: "Cards Added",
        description: `Successfully added ${importedCards.length} cards to your set`,
      });
    } else {
      // Replace all empty cards
      setCards(newCards);
      toast({
        title: "Cards Imported",
        description: `Successfully imported ${importedCards.length} cards`,
      });
    }
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
            {/* ✅ Fix Bug 1: Disable button when saving */}
            <Button
              onClick={handleSave}
              className="gradient-bg gap-2"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Set"}
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
                disabled={isSaving}
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
                disabled={isSaving}
              />
            </div>
            <div>
              <Label>Workspace</Label>
              <Select
                value={workplaceId ?? "none"}
                onValueChange={(val) => {
                  setWorkplaceId(val === "none" ? null : val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Không gán workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không gán</SelectItem>
                  {workplaces.map((wp) => (
                    <SelectItem key={wp.id} value={wp.id}>
                      {wp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Term Language</Label>
                <Select value={termLang} onValueChange={setTermLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Definition Language</Label>
                <Select value={defLang} onValueChange={setDefLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Button variant="outline" className="gap-2" disabled={isSaving}>
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
              disabled={isSaving}
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
                        disabled={isSaving}
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
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-8">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCard(card.id)}
                      disabled={cards.length <= 1 || isSaving}
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
                disabled={isSaving}
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
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="gradient-bg gap-2"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Creating..." : "Create Set"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
