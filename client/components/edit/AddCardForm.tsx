import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  ResponsiveFormField,
  ResponsiveFormActions,
} from "@/components/ui/ResponsiveForm";
import { AlertTriangle, Plus } from "lucide-react";
import { Card as FlashCard } from "@/types/flashcard";

interface AddCardFormProps {
  onAdd: (card: Omit<FlashCard, "id" | "order">) => void;
  onCancel: () => void;
}

export const AddCardForm: React.FC<AddCardFormProps> = ({
  onAdd,
  onCancel,
}) => {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!term.trim()) {
      newErrors.term = "Term is required";
    } else if (term.length > 200) {
      newErrors.term = "Term must be less than 200 characters";
    }

    if (!definition.trim()) {
      newErrors.definition = "Definition is required";
    } else if (definition.length > 500) {
      newErrors.definition = "Definition must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onAdd({
      term: term.trim(),
      definition: definition.trim(),
      mastered: false,
    });

    // Reset form
    setTerm("");
    setDefinition("");
    setErrors({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit(e);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const isFormValid = term.trim() && definition.trim();

  const footerActions = (
    <ResponsiveFormActions
      secondaryAction={{
        label: "Cancel",
        onClick: onCancel,
      }}
      primaryAction={{
        label: "Add Card",
        onClick: (e: any) => handleSubmit(e),
        disabled: !isFormValid,
      }}
    />
  );

  return (
    <ResponsiveModal
      open={true}
      onOpenChange={onCancel}
      title="Add New Card"
      description="Create a new flashcard by entering a term and its definition."
      footer={footerActions}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Term Field */}
          <ResponsiveFormField
            label="Term"
            required
            error={errors.term}
            description={`${term.length}/200 characters`}
          >
            <Input
              id="term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter the term or question"
              className={
                errors.term ? "border-red-500 focus:border-red-500" : ""
              }
              maxLength={200}
              autoFocus
            />
          </ResponsiveFormField>

          {/* Definition Field */}
          <ResponsiveFormField
            label="Definition"
            required
            error={errors.definition}
            description={`${definition.length}/500 characters`}
          >
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter the definition or answer"
              className={`min-h-[100px] sm:min-h-[120px] ${
                errors.definition ? "border-red-500 focus:border-red-500" : ""
              }`}
              maxLength={500}
            />
          </ResponsiveFormField>
        </div>

        {/* Preview */}
        {isFormValid && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="text-sm text-gray-500 mb-2">Preview</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Term</div>
                <div className="text-sm font-medium">{term}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Definition</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {definition}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center sm:text-left">
          Press Ctrl+Enter to add card, or Esc to cancel
        </div>
      </form>
    </ResponsiveModal>
  );
};
