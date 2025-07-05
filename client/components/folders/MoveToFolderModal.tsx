import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { ResponsiveFormActions } from "@/components/ui/ResponsiveForm";
import { toast } from "sonner";
import {
  Move,
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Folder, FolderColor, FOLDER_COLORS } from "@/types/folder";
import { FlashcardSet } from "@/types/flashcard";
import {
  getFolders,
  updateFolder,
  moveFoldersToParent,
} from "@/lib/folderStorage";
import { getSets, saveSet } from "@/lib/storage";

interface MoveToFolderModalProps {
  itemIds: string[];
  itemType: "folder" | "set";
  onClose: () => void;
  onSuccess: () => void;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  itemIds,
  itemType,
  onClose,
  onSuccess,
}) => {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const folders = getFolders();
  const sets = getSets();

  // Get items being moved
  const getMovingItems = () => {
    if (itemType === "folder") {
      return folders.filter((folder) => itemIds.includes(folder.id));
    } else {
      return sets.filter((set) => itemIds.includes(set.id));
    }
  };

  // Get available destination folders
  const getAvailableDestinations = (): Folder[] => {
    if (itemType === "folder") {
      // For folders, exclude the folders being moved and their descendants
      const excludeIds = new Set<string>();

      const addDescendants = (folderId: string) => {
        excludeIds.add(folderId);
        folders
          .filter((f) => f.parentId === folderId)
          .forEach((child) => addDescendants(child.id));
      };

      itemIds.forEach(addDescendants);
      return folders.filter((folder) => !excludeIds.has(folder.id));
    } else {
      // For sets, all folders are available
      return folders;
    }
  };

  const getParentFolderPath = (folderId: string): string => {
    const path: string[] = [];
    let current = folders.find((f) => f.id === folderId);

    while (current) {
      path.unshift(current.name);
      current = folders.find((f) => f.id === current.parentId);
    }

    return path.join(" / ");
  };

  const getFolderColorClass = (folder: Folder) => {
    if (
      folder.color &&
      FOLDER_COLORS[folder.color as keyof typeof FOLDER_COLORS]
    ) {
      return FOLDER_COLORS[folder.color as keyof typeof FOLDER_COLORS];
    }
    return FOLDER_COLORS.blue;
  };

  const handleMove = async () => {
    setIsMoving(true);

    try {
      if (itemType === "folder") {
        // Move folders
        await moveFoldersToParent(itemIds, selectedParentId);
        toast.success(
          `${itemIds.length} folder${itemIds.length > 1 ? "s" : ""} moved successfully!`,
        );
      } else {
        // Move sets
        const updatedSets = sets.map((set) => {
          if (itemIds.includes(set.id)) {
            return { ...set, folderId: selectedParentId };
          }
          return set;
        });

        // Save updated sets
        updatedSets.forEach((set) => saveSet(set));
        toast.success(
          `${itemIds.length} study set${itemIds.length > 1 ? "s" : ""} moved successfully!`,
        );
      }

      onSuccess();
    } catch (error) {
      toast.error("Failed to move items");
      console.error("Move error:", error);
    } finally {
      setIsMoving(false);
    }
  };

  const movingItems = getMovingItems();
  const availableDestinations = getAvailableDestinations();
  const selectedFolder = selectedParentId
    ? folders.find((f) => f.id === selectedParentId)
    : null;

  const footerActions = (
    <ResponsiveFormActions
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
        disabled: isMoving,
      }}
      primaryAction={{
        label: isMoving ? "Moving..." : "Move Items",
        onClick: handleMove,
        disabled: isMoving,
        loading: isMoving,
      }}
    />
  );

  return (
    <ResponsiveModal
      open={true}
      onOpenChange={onClose}
      title={`Move ${movingItems.length} ${itemType}${movingItems.length > 1 ? "s" : ""}`}
      description="Choose the destination folder for the selected items"
      footer={footerActions}
      size="md"
    >
      <div className="space-y-6">
        {/* Items being moved */}
        <div>
          <h4 className="font-medium mb-3">Items to move:</h4>
          <ScrollArea className="max-h-32 border rounded-lg">
            <div className="p-3 space-y-2">
              {movingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 text-sm"
                >
                  {itemType === "folder" ? (
                    <>
                      <div
                        className={`p-1 rounded ${getFolderColorClass(item as Folder).bg}`}
                      >
                        <FolderIcon
                          className={`w-3 h-3 ${getFolderColorClass(item as Folder).text}`}
                        />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {(item as FlashcardSet).title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {(item as FlashcardSet).cards.length} cards
                      </Badge>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Destination selection */}
        <div>
          <h4 className="font-medium mb-3">Move to:</h4>
          <Select
            value={selectedParentId || "root"}
            onValueChange={(value) =>
              setSelectedParentId(value === "root" ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">
                <div className="flex items-center">
                  <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Root Folder</span>
                </div>
              </SelectItem>
              {availableDestinations.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <div className="flex items-center">
                    <div
                      className={`p-1 rounded mr-2 ${getFolderColorClass(folder).bg}`}
                    >
                      <FolderIcon
                        className={`w-3 h-3 ${getFolderColorClass(folder).text}`}
                      />
                    </div>
                    <span className="truncate max-w-48">
                      {getParentFolderPath(folder.id)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview destination */}
        {selectedFolder && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Moving to:
            </div>
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${getFolderColorClass(selectedFolder).bg}`}
              >
                <FolderOpen
                  className={`w-5 h-5 ${getFolderColorClass(selectedFolder).text}`}
                />
              </div>
              <div>
                <div className="font-medium">{selectedFolder.name}</div>
                {selectedFolder.description && (
                  <div className="text-sm text-gray-500">
                    {selectedFolder.description}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  Path: {getParentFolderPath(selectedFolder.id)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moving to root */}
        {selectedParentId === null && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Moving to:
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                <FolderIcon className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="font-medium">Root Folder</div>
                <div className="text-sm text-gray-500">
                  Top level of your folder structure
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning for moving many items */}
        {movingItems.length > 10 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                  Moving many items
                </div>
                <div className="text-amber-700 dark:text-amber-300 text-sm">
                  You are moving {movingItems.length} items. This operation
                  cannot be undone.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default MoveToFolderModal;
