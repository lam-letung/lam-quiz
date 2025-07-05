import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Folder,
  Check,
  X,
  AlertCircle,
  Palette,
  FolderPlus,
} from "lucide-react";
import {
  CreateFolderData,
  FolderColor,
  FOLDER_COLORS,
  Folder as FolderType,
} from "@/types/folder";
import {
  createFolder,
  getFolders,
  validateFolderName,
} from "@/lib/folderStorage";
import { cn } from "@/lib/utils";

interface FolderCreatorProps {
  parentId?: string;
  onFolderCreated?: (folder: FolderType) => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  mode?: "modal" | "inline";
  className?: string;
}

export default function FolderCreator({
  parentId,
  onFolderCreated,
  onCancel,
  children,
  mode = "modal",
  className,
}: FolderCreatorProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [folderData, setFolderData] = useState<CreateFolderData>({
    name: "",
    description: "",
    color: "blue",
    parentId,
  });
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const handleFieldChange = (field: keyof CreateFolderData, value: string) => {
    setFolderData({ ...folderData, [field]: value });

    // Clear errors when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; description?: string } = {};

    // Validate name
    const nameValidation = validateFolderName(folderData.name);
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    // Validate description length
    if (folderData.description && folderData.description.length > 200) {
      newErrors.description = "Description must be 200 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const newFolder = createFolder({
        ...folderData,
        name: folderData.name.trim(),
        description: folderData.description?.trim(),
      });

      onFolderCreated?.(newFolder);
      handleReset();

      if (mode === "modal") {
        setOpen(false);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      setErrors({ name: "Failed to create folder. Please try again." });
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setFolderData({
      name: "",
      description: "",
      color: "blue",
      parentId,
    });
    setErrors({});
  };

  const handleCancel = () => {
    handleReset();
    if (mode === "modal") {
      setOpen(false);
    } else {
      onCancel?.();
    }
  };

  const getParentFolderName = (): string | null => {
    if (!parentId) return null;
    const folders = getFolders();
    const parent = folders.find((f) => f.id === parentId);
    return parent?.name || null;
  };

  const renderColorPicker = () => (
    <div className="space-y-3">
      <Label>Folder Color</Label>
      <div className="grid grid-cols-9 gap-2">
        {Object.entries(FOLDER_COLORS).map(([colorKey, colorData]) => (
          <button
            key={colorKey}
            type="button"
            onClick={() => handleFieldChange("color", colorKey)}
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all",
              colorData.bg,
              folderData.color === colorKey
                ? "border-primary scale-110"
                : "border-gray-300 hover:scale-105",
            )}
            title={colorData.name}
          >
            {folderData.color === colorKey && (
              <Check className="w-4 h-4 mx-auto text-white" />
            )}
          </button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Selected: {FOLDER_COLORS[folderData.color as FolderColor]?.name}
      </div>
    </div>
  );

  const renderForm = () => (
    <div className={cn("space-y-6", className)}>
      {/* Folder Preview */}
      <Card
        className={cn(
          "border-l-4",
          FOLDER_COLORS[folderData.color as FolderColor]?.border,
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded",
                FOLDER_COLORS[folderData.color as FolderColor]?.bg,
              )}
            >
              <Folder
                className={cn(
                  "h-4 w-4",
                  FOLDER_COLORS[folderData.color as FolderColor]?.text,
                )}
              />
            </div>
            <span>Folder Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="font-semibold">
              {folderData.name || "New Folder"}
            </div>
            <div className="text-sm text-muted-foreground">
              {folderData.description || "No description"}
            </div>
            {getParentFolderName() && (
              <Badge variant="outline" className="text-xs">
                in {getParentFolderName()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="folder-name">Folder Name *</Label>
          <Input
            id="folder-name"
            value={folderData.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            placeholder="Enter folder name"
            className={cn(errors.name && "border-destructive")}
            maxLength={50}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
          <div className="text-xs text-muted-foreground">
            {folderData.name.length}/50 characters
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="folder-description">Description</Label>
          <Textarea
            id="folder-description"
            value={folderData.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            placeholder="Optional description for this folder"
            rows={3}
            className={cn(
              "resize-none",
              errors.description && "border-destructive",
            )}
            maxLength={200}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
          <div className="text-xs text-muted-foreground">
            {folderData.description?.length || 0}/200 characters
          </div>
        </div>

        {renderColorPicker()}

        {/* Parent Folder Info */}
        {getParentFolderName() && (
          <Alert>
            <Folder className="h-4 w-4" />
            <AlertDescription>
              This folder will be created inside{" "}
              <strong>{getParentFolderName()}</strong>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {parentId ? "Creating subfolder" : "Creating root folder"}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          <Button
            onClick={handleCreate}
            disabled={!folderData.name.trim() || isCreating}
            className="gradient-bg"
          >
            {isCreating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Folder
          </Button>
        </div>
      </div>
    </div>
  );

  if (mode === "inline") {
    return renderForm();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}

// Quick Folder Creator for inline use
export function QuickFolderCreator({
  parentId,
  onFolderCreated,
  onCancel,
  className,
}: {
  parentId?: string;
  onFolderCreated: (folder: FolderType) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>("");

  const handleCreate = () => {
    const validation = validateFolderName(name);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    try {
      const newFolder = createFolder({
        name: name.trim(),
        parentId,
        color: "blue",
      });
      onFolderCreated(newFolder);
    } catch (err) {
      setError("Failed to create folder");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <Card className={cn("border-primary/50", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">New Folder</span>
        </div>

        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Folder name"
            autoFocus
            maxLength={50}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Enter to create, Esc to cancel
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
            <Button
              onClick={handleCreate}
              size="sm"
              className="h-7"
              disabled={!name.trim()}
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
