import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { FlashcardSet } from "@/types/flashcard";

interface EditSetFormProps {
  set: FlashcardSet;
  onUpdate: (updates: Partial<FlashcardSet>) => void;
  errors?: { [key: string]: string };
}

export const EditSetForm: React.FC<EditSetFormProps> = ({
  set,
  onUpdate,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      {/* Title Field */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium">
          Title *
        </Label>
        <Input
          id="title"
          type="text"
          value={set.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter study set title"
          className={`mt-2 ${
            errors.title ? "border-red-500 focus:border-red-500" : ""
          }`}
          maxLength={100}
        />
        {errors.title && (
          <div className="flex items-center space-x-1 mt-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-xs text-red-500">{errors.title}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {set.title.length}/100 characters
        </p>
      </div>

      {/* Description Field */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          value={set.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe what this study set is about (optional)"
          className={`mt-2 min-h-[100px] ${
            errors.description ? "border-red-500 focus:border-red-500" : ""
          }`}
          maxLength={500}
        />
        {errors.description && (
          <div className="flex items-center space-x-1 mt-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-xs text-red-500">{errors.description}</span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {set.description.length}/500 characters
        </p>
      </div>

      {/* Additional Info */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Badge variant="outline" className="text-xs">
          {set.cards.length} cards
        </Badge>
        <Badge variant="outline" className="text-xs">
          Created {new Date(set.createdAt).toLocaleDateString()}
        </Badge>
        {set.studyProgress && (
          <Badge variant="outline" className="text-xs">
            {set.studyProgress.masteredCards}/{set.studyProgress.totalCards}{" "}
            mastered
          </Badge>
        )}
      </div>

      {/* Global Errors */}
      {errors.duplicates && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {errors.duplicates}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
