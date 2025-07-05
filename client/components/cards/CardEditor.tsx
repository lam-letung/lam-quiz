import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save,
  X,
  Edit,
  Trash2,
  Copy,
  Volume2,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";
import { Card as FlashCard } from "@/types/flashcard";
import { cn } from "@/lib/utils";

interface CardEditorProps {
  card: FlashCard;
  onSave?: (card: FlashCard) => void;
  onDelete?: (cardId: string) => void;
  onDuplicate?: (card: FlashCard) => void;
  children?: React.ReactNode;
  mode?: "inline" | "modal";
  className?: string;
}

export default function CardEditor({
  card,
  onSave,
  onDelete,
  onDuplicate,
  children,
  mode = "modal",
  className,
}: CardEditorProps) {
  const [open, setOpen] = useState(false);
  const [editedCard, setEditedCard] = useState<FlashCard>(card);
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ term?: string; definition?: string }>(
    {},
  );

  useEffect(() => {
    setEditedCard(card);
    setIsChanged(false);
    setErrors({});
  }, [card]);

  const handleFieldChange = (field: keyof FlashCard, value: string) => {
    const newCard = { ...editedCard, [field]: value };
    setEditedCard(newCard);
    setIsChanged(
      newCard.term !== card.term || newCard.definition !== card.definition,
    );

    // Clear errors when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateCard = (): boolean => {
    const newErrors: { term?: string; definition?: string } = {};

    if (!editedCard.term.trim()) {
      newErrors.term = "Term is required";
    }

    if (!editedCard.definition.trim()) {
      newErrors.definition = "Definition is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateCard()) return;

    setIsSaving(true);
    try {
      const updatedCard = {
        ...editedCard,
        term: editedCard.term.trim(),
        definition: editedCard.definition.trim(),
      };

      onSave?.(updatedCard);
      setIsChanged(false);

      if (mode === "modal") {
        setOpen(false);
      }
    } catch (error) {
      console.error("Error saving card:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCard(card);
    setIsChanged(false);
    setErrors({});
    if (mode === "modal") {
      setOpen(false);
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this card? This action cannot be undone.",
      )
    ) {
      onDelete?.(card.id);
      if (mode === "modal") {
        setOpen(false);
      }
    }
  };

  const handleDuplicate = () => {
    const duplicatedCard: FlashCard = {
      ...editedCard,
      id: `${card.id}-copy-${Date.now()}`,
      term: `${editedCard.term} (Copy)`,
    };
    onDuplicate?.(duplicatedCard);
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window && text.trim()) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const renderEditor = () => (
    <div className={cn("space-y-6", className)}>
      {/* Card Preview */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Card Preview</span>
            <Badge variant="secondary">#{card.order + 1}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-sm font-medium text-blue-600 mb-2">TERM</div>
              <div className="text-lg font-semibold">
                {editedCard.term || "Enter term..."}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-sm font-medium text-purple-600 mb-2">
                DEFINITION
              </div>
              <div className="text-lg">
                {editedCard.definition || "Enter definition..."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="term">Term</Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => speakText(editedCard.term)}
              className="h-6 w-6"
              disabled={!editedCard.term.trim()}
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          </div>
          <Input
            id="term"
            value={editedCard.term}
            onChange={(e) => handleFieldChange("term", e.target.value)}
            placeholder="Enter the term or question"
            className={cn(errors.term && "border-destructive")}
          />
          {errors.term && (
            <p className="text-sm text-destructive">{errors.term}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="definition">Definition</Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => speakText(editedCard.definition)}
              className="h-6 w-6"
              disabled={!editedCard.definition.trim()}
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          </div>
          <Textarea
            id="definition"
            value={editedCard.definition}
            onChange={(e) => handleFieldChange("definition", e.target.value)}
            placeholder="Enter the definition or answer"
            rows={3}
            className={cn(
              "resize-none",
              errors.definition && "border-destructive",
            )}
          />
          {errors.definition && (
            <p className="text-sm text-destructive">{errors.definition}</p>
          )}
        </div>
      </div>

      {/* Character Count */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Term: {editedCard.term.length} characters</div>
        <div>Definition: {editedCard.definition.length} characters</div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          {onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isChanged && (
            <Alert className="inline-flex items-center p-2 h-auto">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs ml-1">
                Unsaved changes
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isChanged ? "Cancel" : "Close"}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!isChanged || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );

  if (mode === "inline") {
    return renderEditor();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Card
          </DialogTitle>
        </DialogHeader>
        {renderEditor()}
      </DialogContent>
    </Dialog>
  );
}

// Quick Edit Card Component for inline editing
export function QuickEditCard({
  card,
  onSave,
  onCancel,
  className,
}: {
  card: FlashCard;
  onSave: (card: FlashCard) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [term, setTerm] = useState(card.term);
  const [definition, setDefinition] = useState(card.definition);

  const handleSave = () => {
    if (term.trim() && definition.trim()) {
      onSave({
        ...card,
        term: term.trim(),
        definition: definition.trim(),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <Card className={cn("border-primary/50", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            TERM
          </Label>
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter term"
            className="font-medium"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            DEFINITION
          </Label>
          <Textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter definition"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Ctrl+Enter to save, Esc to cancel
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-7"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button onClick={handleSave} size="sm" className="h-7">
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
