import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Move,
  Plus,
  BookmarkIcon,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Folder,
  FolderTree as FolderTreeType,
  FOLDER_COLORS,
} from "@/types/folder";
import { FlashcardSet } from "@/types/flashcard";

interface FolderTreeProps {
  folders: Folder[];
  sets: FlashcardSet[];
  onFolderSelect?: (folder: Folder) => void;
  onFolderEdit?: (folder: Folder) => void;
  onFolderDelete?: (folder: Folder) => void;
  onFolderMove?: (folder: Folder) => void;
  onCreateSubfolder?: (parentId: string) => void;
  selectedFolderId?: string;
  className?: string;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  sets,
  onFolderSelect,
  onFolderEdit,
  onFolderDelete,
  onFolderMove,
  onCreateSubfolder,
  selectedFolderId,
  className,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const buildFolderTree = (parentId?: string): FolderTreeType[] => {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((folder) => ({
        folder,
        children: buildFolderTree(folder.id),
        depth: getDepth(folder.id),
      }));
  };

  const getDepth = (folderId: string, depth = 0): number => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder || !folder.parentId) return depth;
    return getDepth(folder.parentId, depth + 1);
  };

  const getSetsInFolder = (folderId: string): FlashcardSet[] => {
    // This would be implemented based on how sets are associated with folders
    return sets.filter((set) => (set as any).folderId === folderId);
  };

  const getTotalSetsInBranch = (folderId: string): number => {
    const directSets = getSetsInFolder(folderId).length;
    const childFolders = folders.filter((f) => f.parentId === folderId);
    const childSets = childFolders.reduce(
      (total, child) => total + getTotalSetsInBranch(child.id),
      0,
    );
    return directSets + childSets;
  };

  const getTotalCardsInBranch = (folderId: string): number => {
    const directSets = getSetsInFolder(folderId);
    const directCards = directSets.reduce(
      (total, set) => total + set.cards.length,
      0,
    );

    const childFolders = folders.filter((f) => f.parentId === folderId);
    const childCards = childFolders.reduce(
      (total, child) => total + getTotalCardsInBranch(child.id),
      0,
    );

    return directCards + childCards;
  };

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
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

  const renderFolderNode = (
    folderTree: FolderTreeType,
    isLast = false,
  ): React.ReactNode => {
    const { folder, children, depth } = folderTree;
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    const colorClass = getFolderColorClass(folder);
    const totalSets = getTotalSetsInBranch(folder.id);
    const totalCards = getTotalCardsInBranch(folder.id);

    return (
      <div key={folder.id} className="relative">
        {/* Indentation lines */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
            style={{ left: `${(depth - 1) * 24 + 12}px` }}
          />
        )}

        {/* Folder item */}
        <div
          className={cn(
            "group flex items-center space-x-2 py-1.5 px-2 rounded-md transition-colors",
            isSelected
              ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              : "hover:bg-gray-100 dark:hover:bg-gray-800",
            "cursor-pointer",
          )}
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
          onClick={() => onFolderSelect?.(folder)}
        >
          {/* Expand/Collapse button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          {/* Folder icon */}
          <div className={`p-1 rounded ${colorClass.bg}`}>
            {isExpanded ? (
              <FolderOpen className={`w-3 h-3 ${colorClass.text}`} />
            ) : (
              <FolderIcon className={`w-3 h-3 ${colorClass.text}`} />
            )}
          </div>

          {/* Folder name */}
          <span className="flex-1 text-sm font-medium truncate">
            {folder.name}
          </span>

          {/* Badges */}
          <div className="flex items-center space-x-1">
            {folder.isBookmarked && (
              <BookmarkIcon className="w-3 h-3 text-yellow-500 fill-current" />
            )}
            {totalSets > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {totalSets}
              </Badge>
            )}
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFolderSelect?.(folder)}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateSubfolder?.(folder.id)}>
                <Plus className="w-4 h-4 mr-2" />
                New Subfolder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFolderEdit?.(folder)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFolderMove?.(folder)}>
                <Move className="w-4 h-4 mr-2" />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <BookmarkIcon className="w-4 h-4 mr-2" />
                {folder.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onFolderDelete?.(folder)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && (
          <Collapsible open={isExpanded}>
            <CollapsibleContent>
              <div className="space-y-0.5">
                {children.map((child, index) =>
                  renderFolderNode(child, index === children.length - 1),
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Sets in this folder */}
        {isExpanded && getSetsInFolder(folder.id).length > 0 && (
          <div className="space-y-0.5">
            {getSetsInFolder(folder.id).map((set) => (
              <div
                key={set.id}
                className="flex items-center space-x-2 py-1 px-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                style={{ paddingLeft: `${(depth + 1) * 24 + 8}px` }}
              >
                <div className="w-4" />
                <FileText className="w-3 h-3 text-blue-500" />
                <span className="flex-1 truncate">{set.title}</span>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {set.cards.length}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = buildFolderTree();

  return (
    <div className={cn("space-y-0.5", className)}>
      {rootFolders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FolderIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No folders yet</p>
        </div>
      ) : (
        rootFolders.map((folderTree) => renderFolderNode(folderTree))
      )}
    </div>
  );
};

export default FolderTree;
