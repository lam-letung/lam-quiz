import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Trash2,
  Move,
  Bookmark,
  Palette,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FolderInput,
  Tag,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { BulkAction, BulkOperation, WorkspaceItem } from "@/types/workspace";
import { FolderColor, FOLDER_COLORS } from "@/types/folder";
import {
  getBulkActions,
  executeBulkOperation,
  getBulkOperationHistory,
} from "@/lib/workspaceStorage";
import { getFolders } from "@/lib/folderStorage";

interface BulkOperationsProps {
  selectedItemIds: string[];
  onComplete: (operation: BulkOperation) => void;
  onCancel: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItemIds,
  onComplete,
  onCancel,
}) => {
  const [availableActions, setAvailableActions] = useState<BulkAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showParamsDialog, setShowParamsDialog] = useState(false);
  const [actionParams, setActionParams] = useState<any>({});
  const [executionHistory, setExecutionHistory] = useState<BulkOperation[]>([]);
  const [currentOperation, setCurrentOperation] =
    useState<BulkOperation | null>(null);

  useEffect(() => {
    loadAvailableActions();
    loadExecutionHistory();
  }, []);

  const loadAvailableActions = () => {
    const actions = getBulkActions();
    setAvailableActions(actions);
  };

  const loadExecutionHistory = () => {
    const history = getBulkOperationHistory();
    setExecutionHistory(history.slice(0, 5)); // Show last 5 operations
  };

  // Handle action selection
  const handleActionSelect = (action: BulkAction) => {
    setSelectedAction(action);
    setActionParams({});

    // Show parameter dialog for actions that need additional info
    if (needsParameters(action)) {
      setShowParamsDialog(true);
    } else if (action.confirmationRequired) {
      setShowConfirmDialog(true);
    } else {
      executeAction(action, {});
    }
  };

  // Check if action needs additional parameters
  const needsParameters = (action: BulkAction): boolean => {
    return ["move", "color", "tag"].includes(action.type);
  };

  // Execute bulk action
  const executeAction = async (
    action: BulkAction,
    params: any = {},
  ): Promise<void> => {
    setIsExecuting(true);
    setShowConfirmDialog(false);
    setShowParamsDialog(false);

    const operation: BulkOperation = {
      action,
      itemIds: selectedItemIds,
      params,
      progress: {
        completed: 0,
        total: selectedItemIds.length,
        errors: [],
      },
    };

    setCurrentOperation(operation);

    try {
      const result = await executeBulkOperation(operation);
      setCurrentOperation(result);

      if (result.progress?.errors && result.progress.errors.length > 0) {
        toast.error(
          `Action completed with ${result.progress.errors.length} errors`,
        );
      } else {
        toast.success(
          `Successfully ${action.name.toLowerCase()} ${selectedItemIds.length} items`,
        );
      }

      onComplete(result);
      loadExecutionHistory();
    } catch (error) {
      toast.error(`Failed to ${action.name.toLowerCase()}: ${error}`);
      setCurrentOperation(null);
    } finally {
      setIsExecuting(false);
    }
  };

  // Render parameter input based on action type
  const renderParameterInput = () => {
    if (!selectedAction) return null;

    switch (selectedAction.type) {
      case "move":
        return <MoveParameterInput onParamsChange={setActionParams} />;
      case "color":
        return <ColorParameterInput onParamsChange={setActionParams} />;
      case "tag":
        return <TagParameterInput onParamsChange={setActionParams} />;
      default:
        return null;
    }
  };

  // Get action icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "move":
        return <Move className="w-4 h-4" />;
      case "bookmark":
        return <Bookmark className="w-4 h-4" />;
      case "color":
        return <Palette className="w-4 h-4" />;
      case "export":
        return <Download className="w-4 h-4" />;
      case "delete":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  // Get operation status icon
  const getStatusIcon = (operation: BulkOperation) => {
    if (!operation.progress) return <Clock className="w-4 h-4 text-gray-400" />;

    const { completed, total, errors } = operation.progress;
    if (errors.length > 0) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else if (completed === total) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  if (selectedItemIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{selectedItemIds.length} selected</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Choose an action to perform on selected items
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableActions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => handleActionSelect(action)}
            disabled={isExecuting}
            className={`
              flex items-center space-x-2
              ${action.type === "delete" ? "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/20" : ""}
            `}
          >
            {getActionIcon(action.type)}
            <span>{action.name}</span>
          </Button>
        ))}
      </div>

      {/* Current Operation Progress */}
      {currentOperation && currentOperation.progress && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(currentOperation)}
              <span className="text-sm font-medium">
                {currentOperation.action.name}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {currentOperation.progress.completed} of{" "}
              {currentOperation.progress.total}
            </span>
          </div>
          <Progress
            value={
              (currentOperation.progress.completed /
                currentOperation.progress.total) *
              100
            }
            className="h-2"
          />
          {currentOperation.progress.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {currentOperation.progress.errors.length} errors occurred
            </div>
          )}
        </div>
      )}

      {/* Recent Operations */}
      {executionHistory.length > 0 && (
        <div>
          <Separator className="mb-3" />
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Recent Operations
            </span>
          </div>
          <div className="space-y-1">
            {executionHistory.map((operation, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs text-gray-500 py-1"
              >
                <div className="flex items-center space-x-2">
                  {getStatusIcon(operation)}
                  <span>
                    {operation.action.name} on {operation.itemIds.length} items
                  </span>
                </div>
                <span>
                  {operation.progress?.completed || 0}/
                  {operation.progress?.total || operation.itemIds.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Confirm Action</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedAction?.name.toLowerCase()}{" "}
              {selectedItemIds.length} selected items? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAction && executeAction(selectedAction)}
              className="bg-red-600 hover:bg-red-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Parameters Dialog */}
      <Dialog open={showParamsDialog} onOpenChange={setShowParamsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction?.name} - Additional Options
            </DialogTitle>
            <DialogDescription>{selectedAction?.description}</DialogDescription>
          </DialogHeader>

          <div className="py-4">{renderParameterInput()}</div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowParamsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedAction && executeAction(selectedAction, actionParams)
              }
              disabled={!actionParams || Object.keys(actionParams).length === 0}
            >
              Apply {selectedAction?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Parameter input components
const MoveParameterInput: React.FC<{
  onParamsChange: (params: any) => void;
}> = ({ onParamsChange }) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const loadedFolders = getFolders();
    setFolders(loadedFolders);
  };

  const handleFolderChange = (folderId: string) => {
    setSelectedFolder(folderId);
    onParamsChange({ folderId: folderId === "root" ? null : folderId });
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">
        Select destination folder:
      </label>
      <Select value={selectedFolder} onValueChange={handleFolderChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a folder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="root">
            <div className="flex items-center">
              <FolderInput className="w-4 h-4 mr-2" />
              Root Level
            </div>
          </SelectItem>
          {folders.map((folder) => (
            <SelectItem key={folder.id} value={folder.id}>
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded mr-2 ${
                    folder.color
                      ? FOLDER_COLORS[folder.color as FolderColor]?.bg
                      : "bg-gray-200"
                  }`}
                />
                {folder.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const ColorParameterInput: React.FC<{
  onParamsChange: (params: any) => void;
}> = ({ onParamsChange }) => {
  const [selectedColor, setSelectedColor] = useState<string>("");

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onParamsChange({ color });
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">
        Select new color:
      </label>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(FOLDER_COLORS).map(([colorKey, colorData]) => (
          <Button
            key={colorKey}
            variant={selectedColor === colorKey ? "default" : "outline"}
            size="sm"
            onClick={() => handleColorChange(colorKey)}
            className="flex items-center space-x-2"
          >
            <div className={`w-3 h-3 rounded ${colorData.bg}`} />
            <span className="text-xs">{colorData.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

const TagParameterInput: React.FC<{
  onParamsChange: (params: any) => void;
}> = ({ onParamsChange }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag("");
      onParamsChange({ tags: updatedTags });
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    onParamsChange({ tags: updatedTags });
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Add tags:</label>
      <div className="flex space-x-2 mb-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTag()}
          placeholder="Enter tag name"
          className="flex-1 px-3 py-1 border rounded-md text-sm"
        />
        <Button size="sm" onClick={addTag}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTag(tag)}
                className="ml-1 h-4 w-4 p-0"
              >
                <XCircle className="w-2 h-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
