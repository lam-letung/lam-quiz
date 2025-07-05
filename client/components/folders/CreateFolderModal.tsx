import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  ResponsiveFormField,
  ResponsiveFormActions,
} from "@/components/ui/ResponsiveForm";
import { toast } from "sonner";
import { FolderPlus, Palette } from "lucide-react";
import {
  Folder,
  CreateFolderData,
  UpdateFolderData,
  FolderColor,
  FOLDER_COLORS,
} from "@/types/folder";
import { createFolder, updateFolder, getFolders } from "@/lib/folderStorage";

interface CreateFolderModalProps {
  folder?: Folder | null; // For editing
  parentId?: string | null;
  onClose: () => void;
  onSuccess: (folder: Folder) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  folder,
  parentId,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!folder;
  const [formData, setFormData] = useState({
    name: folder?.name || "",
    description: folder?.description || "",
    color: (folder?.color as FolderColor) || "blue",
    parentId: folder?.parentId || parentId,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableParents = getFolders().filter(
    (f) => f.id !== folder?.id && !isDescendant(f.id, folder?.id),
  );

  // Check if a folder is a descendant of another folder
  function isDescendant(
    potentialDescendant: string,
    ancestorId?: string,
  ): boolean {
    if (!ancestorId) return false;

    const folders = getFolders();
    let current = folders.find((f) => f.id === potentialDescendant);

    while (current) {
      if (current.parentId === ancestorId) return true;
      current = folders.find((f) => f.id === current!.parentId);
    }

    return false;
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Folder name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Folder name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    // Check for duplicate names in the same parent folder
    const siblings = getFolders().filter(
      (f) =>
        f.parentId === formData.parentId &&
        f.id !== folder?.id &&
        f.name.toLowerCase() === formData.name.toLowerCase().trim(),
    );

    if (siblings.length > 0) {
      newErrors.name =
        "A folder with this name already exists in this location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let resultFolder: Folder;

      if (isEditing && folder) {
        const updateData: UpdateFolderData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        };
        resultFolder = updateFolder(folder.id, updateData);
        toast.success("Folder updated successfully!");
      } else {
        const createData: CreateFolderData = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
          parentId: formData.parentId || undefined,
        };
        resultFolder = createFolder(createData);
        toast.success("Folder created successfully!");
      }

      onSuccess(resultFolder);
    } catch (error) {
      toast.error(
        isEditing ? "Failed to update folder" : "Failed to create folder",
      );
      console.error("Folder operation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParentFolderPath = (folderId: string): string => {
    const folders = getFolders();
    const path: string[] = [];
    let current = folders.find((f) => f.id === folderId);

    while (current) {
      path.unshift(current.name);
      current = folders.find((f) => f.id === current!.parentId);
    }

    return path.join(" / ");
  };

  const footerActions = (
    <ResponsiveFormActions
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
        disabled: isSubmitting,
      }}
      primaryAction={{
        label: isEditing ? "Update Folder" : "Create Folder",
        onClick: handleSubmit,
        disabled: isSubmitting || !formData.name.trim(),
        loading: isSubmitting,
      }}
    />
  );

  return (
    <ResponsiveModal
      open={true}
      onOpenChange={onClose}
      title={isEditing ? "Edit Folder" : "Create New Folder"}
      description={
        isEditing
          ? "Update the folder details"
          : "Create a new folder to organize your study sets"
      }
      footer={footerActions}
      size="md"
    >
      <div className="space-y-6">
        {/* Folder Name */}
        <ResponsiveFormField
          label="Folder Name"
          required
          error={errors.name}
          description={`${formData.name.length}/100 characters`}
        >
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter folder name"
            maxLength={100}
            className={errors.name ? "border-red-500" : ""}
          />
        </ResponsiveFormField>

        {/* Description */}
        <ResponsiveFormField
          label="Description"
          error={errors.description}
          description={`${formData.description.length}/500 characters (optional)`}
        >
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe what this folder contains (optional)"
            maxLength={500}
            className={`min-h-[80px] ${errors.description ? "border-red-500" : ""}`}
          />
        </ResponsiveFormField>

        {/* Parent Folder */}
        <ResponsiveFormField
          label="Parent Folder"
          description="Choose where to place this folder"
        >
          <Select
            value={formData.parentId || "root"}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                parentId: value === "root" ? undefined : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">
                <div className="flex items-center">
                  <span>📁 Root</span>
                </div>
              </SelectItem>
              {availableParents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded mr-2 ${
                        parent.color
                          ? FOLDER_COLORS[parent.color as FolderColor]?.bg
                          : FOLDER_COLORS.blue.bg
                      }`}
                    />
                    <span className="truncate">
                      {getParentFolderPath(parent.id)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ResponsiveFormField>

        {/* Color Selection */}
        <ResponsiveFormField
          label="Folder Color"
          description="Choose a color to help organize your folders"
        >
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Object.entries(FOLDER_COLORS).map(([colorKey, colorData]) => (
              <button
                key={colorKey}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    color: colorKey as FolderColor,
                  }))
                }
                className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all ${
                  formData.color === colorKey
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className={`w-4 h-4 rounded ${colorData.bg}`} />
                <span className="text-sm font-medium">{colorData.name}</span>
              </button>
            ))}
          </div>
        </ResponsiveFormField>

        {/* Preview */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Preview:
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                FOLDER_COLORS[formData.color as FolderColor]?.bg ||
                FOLDER_COLORS.blue.bg
              }`}
            >
              <FolderPlus
                className={`w-5 h-5 ${
                  FOLDER_COLORS[formData.color as FolderColor]?.text ||
                  FOLDER_COLORS.blue.text
                }`}
              />
            </div>
            <div>
              <div className="font-medium">
                {formData.name || "Folder Name"}
              </div>
              {formData.description && (
                <div className="text-sm text-gray-500 truncate">
                  {formData.description}
                </div>
              )}
              <div className="text-xs text-gray-400">
                Location:{" "}
                {formData.parentId
                  ? getParentFolderPath(formData.parentId)
                  : "Root"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default CreateFolderModal;
