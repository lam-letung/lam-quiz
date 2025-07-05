import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { EditSetForm } from "@/components/edit/EditSetForm";
import { CardEditor } from "@/components/edit/CardEditor";
import { AddCardForm } from "@/components/edit/AddCardForm";
import { DeleteConfirmation } from "@/components/edit/DeleteConfirmation";
import { FlashcardSet, Card as FlashCard } from "@/types/flashcard";
import { getSet, saveSet } from "@/lib/storage";

const EditPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const setId = params.id;

  const [originalSet, setOriginalSet] = useState<FlashcardSet | null>(null);
  const [editedSet, setEditedSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (!setId) {
      navigate("/");
      return;
    }

    loadSet();
  }, [setId, navigate]);

  useEffect(() => {
    // Warn user about unsaved changes when leaving page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadSet = async () => {
    setIsLoading(true);
    try {
      const set = getSet(setId!);
      if (!set) {
        toast.error("Study set not found");
        navigate("/");
        return;
      }

      setOriginalSet(set);
      setEditedSet({ ...set });
    } catch (error) {
      console.error("Error loading set:", error);
      toast.error("Failed to load study set");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const detectChanges = (newSet: FlashcardSet) => {
    if (!originalSet) return false;

    return (
      JSON.stringify(originalSet) !== JSON.stringify(newSet) ||
      newSet.title !== originalSet.title ||
      newSet.description !== originalSet.description ||
      newSet.cards.length !== originalSet.cards.length ||
      JSON.stringify(newSet.cards) !== JSON.stringify(originalSet.cards)
    );
  };

  const updateEditedSet = (updates: Partial<FlashcardSet>) => {
    setEditedSet((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      setHasUnsavedChanges(detectChanges(updated));
      return updated;
    });
  };

  const validateSet = (set: FlashcardSet): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};

    if (!set.title.trim()) {
      errors.title = "Title is required";
    }

    if (set.cards.length === 0) {
      errors.cards = "At least one card is required";
    }

    // Validate individual cards
    set.cards.forEach((card, index) => {
      if (!card.term.trim()) {
        errors[`card_${index}_term`] = "Term is required";
      }
      if (!card.definition.trim()) {
        errors[`card_${index}_definition`] = "Definition is required";
      }
    });

    // Check for duplicate terms
    const terms = set.cards.map((card) => card.term.trim().toLowerCase());
    const duplicates = terms.filter(
      (term, index) => terms.indexOf(term) !== index,
    );
    if (duplicates.length > 0) {
      errors.duplicates = "Duplicate terms found";
    }

    return errors;
  };

  const handleSave = async () => {
    if (!editedSet) return;

    setIsSaving(true);
    const errors = validateSet(editedSet);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors before saving");
      setIsSaving(false);
      return;
    }

    try {
      const setToSave = {
        ...editedSet,
        updatedAt: new Date().toISOString(),
      };

      saveSet(setToSave);
      setOriginalSet(setToSave);
      setHasUnsavedChanges(false);
      toast.success("Study set saved successfully!");

      // Redirect to study set detail or back to home
      navigate(`/study/${setId}`);
    } catch (error) {
      console.error("Error saving set:", error);
      toast.error("Failed to save study set");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCard = (newCard: Omit<FlashCard, "id" | "order">) => {
    if (!editedSet) return;

    const card: FlashCard = {
      ...newCard,
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: editedSet.cards.length,
    };

    updateEditedSet({
      cards: [...editedSet.cards, card],
    });

    setShowAddCard(false);
    toast.success("Card added successfully");
  };

  const handleEditCard = (cardId: string, updates: Partial<FlashCard>) => {
    if (!editedSet) return;

    const updatedCards = editedSet.cards.map((card) =>
      card.id === cardId ? { ...card, ...updates } : card,
    );

    updateEditedSet({ cards: updatedCards });
    setEditingCardId(null);
  };

  const handleDeleteCard = (cardId: string) => {
    if (!editedSet) return;

    const updatedCards = editedSet.cards
      .filter((card) => card.id !== cardId)
      .map((card, index) => ({ ...card, order: index }));

    updateEditedSet({ cards: updatedCards });
    setDeletingCardId(null);
    toast.success("Card deleted successfully");
  };

  const handleReorderCards = (startIndex: number, endIndex: number) => {
    if (!editedSet) return;

    const result = Array.from(editedSet.cards);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reorderedCards = result.map((card, index) => ({
      ...card,
      order: index,
    }));

    updateEditedSet({ cards: reorderedCards });
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      );
      if (!confirmLeave) return;
    }
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading study set...</p>
        </div>
      </div>
    );
  }

  if (!editedSet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Study Set Not Found</h2>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button variant="ghost" onClick={handleBack} size="sm">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  Edit Study Set
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {editedSet.cards.length} cards
                  </Badge>
                  {hasUnsavedChanges && (
                    <Badge
                      variant="secondary"
                      className="text-xs text-amber-700"
                    >
                      Unsaved
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAddCard(true)}
                disabled={isSaving}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Card</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                size="sm"
                className="flex-1 sm:flex-none min-w-[80px] sm:min-w-[100px]"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white sm:mr-2"></div>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Save</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Set Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Study Set Details</CardTitle>
              </CardHeader>
              <CardContent>
                <EditSetForm
                  set={editedSet}
                  onUpdate={updateEditedSet}
                  errors={validationErrors}
                />
              </CardContent>
            </Card>

            {/* Cards List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Cards ({editedSet.cards.length})</span>
                  {validationErrors.cards && (
                    <Badge variant="destructive" className="text-xs">
                      {validationErrors.cards}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editedSet.cards.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No cards yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Add your first card to get started
                    </p>
                    <Button onClick={() => setShowAddCard(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Card
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editedSet.cards.map((card, index) => (
                      <CardEditor
                        key={card.id}
                        card={card}
                        index={index}
                        isEditing={editingCardId === card.id}
                        onEdit={(updates) => handleEditCard(card.id, updates)}
                        onDelete={() => setDeletingCardId(card.id)}
                        onStartEdit={() => setEditingCardId(card.id)}
                        onCancelEdit={() => setEditingCardId(null)}
                        onReorder={handleReorderCards}
                        errors={{
                          term: validationErrors[`card_${index}_term`],
                          definition:
                            validationErrors[`card_${index}_definition`],
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-first lg:order-last">
            {/* Validation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {editedSet.title.trim() ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Title provided</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editedSet.cards.length > 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Has cards</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {Object.keys(validationErrors).length === 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">No validation errors</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Cards:</span>
                    <span className="font-medium">
                      {editedSet.cards.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium">
                      {new Date(editedSet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="font-medium">
                      {new Date(editedSet.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <AddCardForm
          onAdd={handleAddCard}
          onCancel={() => setShowAddCard(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingCardId && (
        <DeleteConfirmation
          onConfirm={() => handleDeleteCard(deletingCardId)}
          onCancel={() => setDeletingCardId(null)}
          title="Delete Card"
          message="Are you sure you want to delete this card? This action cannot be undone."
        />
      )}
    </div>
  );
};

export default EditPage;
