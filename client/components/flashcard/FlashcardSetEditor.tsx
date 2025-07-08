import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import BulkImportModal from "@/components/create/BulkImportModal";
import { AddCardForm } from "@/components/edit/AddCardForm";
import { FlashcardSet, Card as FlashCardForm, Workplace } from "@/types/flashcard";
import { Plus, Upload, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { generateId } from "@/lib/storage";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface Props {
  mode: "create" | "edit";
  initialData?: FlashcardSet;
  prefillWorkspaceId?: string;
  onSubmit: (payload: {
    title: string;
    description: string;
    workplaceId: string | null;
    cards: { term: string; definition: string }[];
  }) => Promise<void>;
}

export default function FlashcardSetEditor({ mode, initialData, prefillWorkspaceId, onSubmit }: Props) {
  const navigate = useNavigate();
  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [workplaceId, setWorkplaceId] = useState(prefillWorkspaceId ?? initialData?.workplaceId ?? "");
  const [cards, setCards] = useState<FlashCardForm[]>(() => {
    if (initialData) return initialData.cards.map(c => ({ id: generateId(), term: c.term, definition: c.definition, order: c.order }));
    return [
      { id: generateId(), term: "", definition: "", order: 0 },
      { id: generateId(), term: "", definition: "", order: 1 },
    ];
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    fetch("/api/me/workplaces")
      .then(r => r.json())
      .then(setWorkplaces);
  }, []);

  const validate = () => {
    const errs: string[] = [];
    if (!title.trim()) errs.push("Title is required");
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (!validCards.length) errs.push("At least one valid card");
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        workplaceId: workplaceId || null,
        cards: cards.filter(c => c.term.trim() && c.definition.trim()).map(c => ({ term: c.term, definition: c.definition }))
      });
      toast.success(`${mode === "create" ? "Created" : "Saved"} successfully!`);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
      setIsSaving(false);
    }
  };

  const handleImport = (imported: { term: string; definition: string }[]) => {
    setCards(prev => {
      const start = prev.length;
      const added = imported.map((c, idx) => ({
        id: generateId(),
        term: c.term,
        definition: c.definition,
        order: start + idx
      }));
      return [...prev, ...added];
    });
  };

  const addCard = ({ term, definition }: { term: string; definition: string }) => {
    setCards(prev => [...prev, {
      id: generateId(), term, definition, order: prev.length
    }]);
    setShowAddCard(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft /></Button>
          <h1 className="font-bold text-xl">{mode === "create" ? "Create Set" : "Edit Set"}</h1>
          <Button onClick={handleSave} disabled={isSaving} className="gradient-bg">
            <Save className="mr-2" /> {mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {errors.length > 0 && (
          <div className="bg-red-100 text-red-800 p-2 rounded">
            {errors.map((e,i) => <div key={i}>{e}</div>)}
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} disabled={isSaving} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} disabled={isSaving} />
              </div>
              <div>
                <Label>Workspace</Label>
                <Select value={workplaceId || undefined} onValueChange={setWorkplaceId}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={undefined}>-- None --</SelectItem>
                    {workplaces.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cards ({cards.filter(c => c.term && c.definition).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowAddCard(true)} size="sm" className="mb-4">
              <Plus className="mr-2" /> Add Card
            </Button>
            {cards.map((c,i) => (
              <Card key={c.id} className="mb-2">
                <CardContent>
                  <div><strong>Term:</strong> {c.term}</div>
                  <div><strong>Definition:</strong> {c.definition}</div>
                </CardContent>
              </Card>
            ))}
            <BulkImportModal onImport={handleImport}>
              <Button variant="outline"><Upload className="mr-2"/>Import</Button>
            </BulkImportModal>
          </CardContent>
        </Card>

        {showAddCard && (
          <AddCardForm onAdd={addCard} onCancel={() => setShowAddCard(false)} />
        )}
      </div>
    </div>
  );
}
