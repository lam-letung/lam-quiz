import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Folder,
  FolderOpen,
  FileText,
  Bookmark,
  Clock,
  TrendingUp,
  Star,
  ChevronRight,
  ChevronDown,
  Search,
  Tag,
  Calendar,
  Filter,
  Plus,
} from "lucide-react";
import { WorkspaceView, SearchFilter } from "@/types/workspace";
import { Folder as FolderType, FOLDER_COLORS } from "@/types/folder";
import { FlashcardSet } from "@/types/flashcard";
import { getFolders } from "@/lib/folderStorage";
import { getSets } from "@/lib/storage";
import { getWorkspaceStats } from "@/lib/workspaceStorage";

interface WorkspaceNavigationProps {
  currentView: WorkspaceView;
  onViewChange: (viewId: string) => void;
  onFilterChange: (filters: SearchFilter) => void;
}

export const WorkspaceNavigation: React.FC<WorkspaceNavigationProps> = ({
  currentView,
  onViewChange,
  onFilterChange,
}) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [stats, setStats] = useState<any>(null);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedFolders, loadedSets, loadedStats] = await Promise.all([
        getFolders(),
        getSets(),
        getWorkspaceStats(),
      ]);

      setFolders(loadedFolders);
      setSets(loadedSets);
      setStats(loadedStats);
    } catch (error) {
      console.error("Error loading navigation data:", error);
    }
  };

  // Build folder tree
  const buildFolderTree = (parentId?: string): FolderType[] => {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get sets in folder
  const getSetsInFolder = (folderId?: string): FlashcardSet[] => {
    // This would need to be implemented based on how sets are associated with folders
    return sets.filter((set) => {
      // Placeholder logic - you'd implement actual folder-set relationship
      return false;
    });
  };

  // Handle folder expand/collapse
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Handle filter shortcuts
  const applyQuickFilter = (filter: SearchFilter) => {
    onFilterChange({ ...currentView.filters, ...filter });
  };

  // Render folder tree recursively
  const renderFolderTree = (folders: FolderType[], depth: number = 0) => {
    return folders.map((folder) => {
      const children = buildFolderTree(folder.id);
      const setsInFolder = getSetsInFolder(folder.id);
      const hasChildren = children.length > 0 || setsInFolder.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const colorData = folder.color
        ? FOLDER_COLORS[folder.color as keyof typeof FOLDER_COLORS]
        : null;

      return (
        <div key={folder.id}>
          <div
            className={`
              flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-pointer
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              ${depth > 0 ? `ml-${depth * 4}` : ""}
            `}
            onClick={() => applyQuickFilter({ parentId: folder.id })}
          >
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="h-4 w-4 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            )}

            <div
              className={`
                w-4 h-4 rounded flex items-center justify-center
                ${colorData ? colorData.bg : "bg-purple-100 dark:bg-purple-900/20"}
              `}
            >
              {isExpanded ? (
                <FolderOpen className="w-3 h-3" />
              ) : (
                <Folder className="w-3 h-3" />
              )}
            </div>

            <span className="text-sm truncate flex-1">{folder.name}</span>

            {folder.isBookmarked && (
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
            )}

            <Badge variant="outline" className="text-xs">
              {children.length + setsInFolder.length}
            </Badge>
          </div>

          {hasChildren && isExpanded && (
            <Collapsible open={isExpanded}>
              <CollapsibleContent>
                {renderFolderTree(children, depth + 1)}
                {setsInFolder.map((set) => (
                  <div
                    key={set.id}
                    className={`
                      flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-pointer
                      hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                      ml-${(depth + 1) * 4}
                    `}
                    onClick={() => applyQuickFilter({ parentId: folder.id })}
                  >
                    <div className="w-4 h-4" />
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm truncate flex-1">{set.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {set.cards.length}
                    </Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      );
    });
  };

  const rootFolders = buildFolderTree();
  const bookmarkedItems = [...folders, ...sets].filter(
    (item) => item.isBookmarked,
  );
  const recentItems = [...folders, ...sets]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      {/* Quick Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            placeholder="Quick filter..."
            value={quickSearchQuery}
            onChange={(e) => setQuickSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Quick Filters */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Quick Filters
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7"
                onClick={() => applyQuickFilter({})}
              >
                <FileText className="w-4 h-4 mr-2" />
                All Items
                <Badge variant="outline" className="ml-auto text-xs">
                  {stats?.totalSets + stats?.totalFolders || 0}
                </Badge>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7"
                onClick={() => applyQuickFilter({ type: ["set"] })}
              >
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                Sets Only
                <Badge variant="outline" className="ml-auto text-xs">
                  {stats?.totalSets || 0}
                </Badge>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7"
                onClick={() => applyQuickFilter({ type: ["folder"] })}
              >
                <Folder className="w-4 h-4 mr-2 text-purple-500" />
                Folders Only
                <Badge variant="outline" className="ml-auto text-xs">
                  {stats?.totalFolders || 0}
                </Badge>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7"
                onClick={() => applyQuickFilter({ hasBookmark: true })}
              >
                <Bookmark className="w-4 h-4 mr-2 text-yellow-500" />
                Bookmarked
                <Badge variant="outline" className="ml-auto text-xs">
                  {bookmarkedItems.length}
                </Badge>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Folder Tree */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Folders
              </h3>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {rootFolders.length > 0 ? (
                renderFolderTree(rootFolders)
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                  No folders yet
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Recent Items */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Recent
            </h3>
            <div className="space-y-1">
              {recentItems.slice(0, 5).map((item) => {
                const isSet = "cards" in item;
                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      if (isSet) {
                        applyQuickFilter({ type: ["set"] });
                      } else {
                        applyQuickFilter({ parentId: item.id });
                      }
                    }}
                  >
                    {isSet ? (
                      <FileText className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Folder className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="text-sm truncate flex-1">
                      {isSet ? item.title : item.name}
                    </span>
                    <Clock className="w-3 h-3 text-gray-400" />
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Date Filters */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Time Period
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7"
                onClick={() => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  applyQuickFilter({
                    dateRange: {
                      start: yesterday.toISOString(),
                      end: today.toISOString(),
                    },
                  });
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Today
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7"
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  applyQuickFilter({
                    dateRange: {
                      start: weekAgo.toISOString(),
                      end: today.toISOString(),
                    },
                  });
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                This Week
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7"
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  applyQuickFilter({
                    dateRange: {
                      start: monthAgo.toISOString(),
                      end: today.toISOString(),
                    },
                  });
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                This Month
              </Button>
            </div>
          </div>

          {/* Storage Info */}
          {stats && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Storage
                </h3>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Total items:</span>
                    <span>{stats.totalFolders + stats.totalSets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total cards:</span>
                    <span>{stats.totalCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage used:</span>
                    <span>{Math.round(stats.storageUsed.total / 1024)}KB</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
