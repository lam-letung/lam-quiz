import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Check,
  X,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { Card as FlashCard } from "@/types/flashcard";

interface CardEditorProps {
  card: FlashCard;
  index: number;
  isEditing: boolean;
  onEdit: (updates: Partial<FlashCard>) => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  errors?: {
    term?: string;
    definition?: string;
  };
}

export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  index,
  isEditing,
  onEdit,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onReorder,
  errors = {},
}) => {
  const [editedTerm, setEditedTerm] = useState(card.term);
  const [editedDefinition, setEditedDefinition] = useState(card.definition);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleSaveEdit = () => {
    if (!editedTerm.trim() || !editedDefinition.trim()) {
      return;
    }

    onEdit({
      term: editedTerm.trim(),
      definition: editedDefinition.trim(),
    });
  };

  const handleCancelEdit = () => {
    setEditedTerm(card.term);
    setEditedDefinition(card.definition);
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Card {index + 1}
            </Badge>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Editing
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editedTerm.trim() || !editedDefinition.trim()}
            >
              <Check className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Term *</label>
            <Input
              value={editedTerm}
              onChange={(e) => setEditedTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter term"
              className={errors.term ? "border-red-500" : ""}
              maxLength={200}
              autoFocus
            />
            {errors.term && (
              <div className="flex items-center space-x-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-500">{errors.term}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {editedTerm.length}/200 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Definition *
            </label>
            <Textarea
              value={editedDefinition}
              onChange={(e) => setEditedDefinition(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter definition"
              className={`min-h-[80px] ${errors.definition ? "border-red-500" : ""}`}
              maxLength={500}
            />
            {errors.definition && (
              <div className="flex items-center space-x-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-500">
                  {errors.definition}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {editedDefinition.length}/500 characters
            </p>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Press Ctrl+Enter to save, or Esc to cancel
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
        errors.term || errors.definition
          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Drag Handle */}
          <div className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Card Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-3">
              <Badge variant="outline" className="text-xs">
                Card {index + 1}
              </Badge>
              {card.mastered && (
                <Badge
                  variant="default"
                  className="text-xs bg-green-100 text-green-800"
                >
                  Mastered
                </Badge>
              )}
              {(errors.term || errors.definition) && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Term</div>
                <div
                  className={`text-base font-medium break-words ${
                    errors.term ? "text-red-600" : ""
                  }`}
                >
                  {card.term || (
                    <span className="text-gray-400 italic">No term</span>
                  )}
                </div>
                {errors.term && (
                  <div className="text-xs text-red-500 mt-1">{errors.term}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Definition</div>
                <div
                  className={`text-sm text-gray-700 dark:text-gray-300 break-words ${
                    errors.definition ? "text-red-600" : ""
                  }`}
                >
                  {card.definition || (
                    <span className="text-gray-400 italic">No definition</span>
                  )}
                </div>
                {errors.definition && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.definition}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 ml-2 sm:ml-4 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onStartEdit}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
