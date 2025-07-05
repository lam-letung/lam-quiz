import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Grid3X3,
  List,
  Tree,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
  BookmarkIcon,
  FolderPlus,
  Plus,
  RefreshCw,
  Settings,
  Download,
  Trash2,
  Move,
  Palette,
  Eye,
  EyeOff,
} from "lucide-react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { BulkOperations } from "@/components/bulk/BulkOperations";
import { WorkspaceNavigation } from "@/components/workspace/WorkspaceNavigation";
import { FolderCreator } from "@/components/workspace/FolderCreator";
import {
  WorkspaceView,
  ViewMode,
  SortField,
  GroupField,
  BulkAction,
  WorkspaceStats,
} from "@/types/workspace";
import { FlashcardSet } from "@/types/flashcard";
import { Folder } from "@/types/folder";
import {
  getWorkspaceViews,
  getCurrentView,
  setCurrentView,
  createWorkspaceView,
  updateWorkspaceView,
  deleteWorkspaceView,
  getWorkspaceStats,
  getBulkActions,
  sortWorkspaceItems,
  groupWorkspaceItems,
} from "@/lib/workspaceStorage";
import { getSets } from "@/lib/storage";
import { getFolders } from "@/lib/folderStorage";
import { initializeSearchIndex } from "@/lib/searchEngine";

interface WorkspaceManagerProps {
  onItemSelect?: (item: FlashcardSet | Folder) => void;
  onCreateSet?: () => void;
  onCreateFolder?: () => void;
  showSelection?: boolean;
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  onItemSelect,
  onCreateSet,
  onCreateFolder,
  showSelection = false,
}) => {
  const [currentView, setCurrentViewState] =
    useState<WorkspaceView>(getCurrentView());
  const [allViews, setAllViews] = useState<WorkspaceView[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedFolders, loadedSets, loadedViews, loadedStats] =
        await Promise.all([
          getFolders(),
          getSets(),
          getWorkspaceViews(),
          getWorkspaceStats(),
        ]);

      setFolders(loadedFolders);
      setSets(loadedSets);
      setAllViews(loadedViews);
      setStats(loadedStats);

      // Initialize search index
      initializeSearchIndex();
    } catch (error) {
      console.error("Error loading workspace data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort items based on current view
  const getFilteredItems = useCallback(() => {
    let items: (Folder | FlashcardSet)[] = [];

    // Apply type filter
    if (!currentView.filters.type || currentView.filters.type.length === 0) {
      items = [...folders, ...sets];
    } else {
      if (currentView.filters.type.includes("folder")) {
        items.push(...folders);
      }
      if (currentView.filters.type.includes("set")) {
        items.push(...sets);
      }
    }

    // Apply other filters
    if (currentView.filters.hasBookmark !== undefined) {
      items = items.filter(
        (item) => item.isBookmarked === currentView.filters.hasBookmark,
      );
    }

    if (currentView.filters.parentId !== undefined) {
      items = items.filter(
        (item) =>
          ("parentId" in item ? item.parentId : null) ===
          currentView.filters.parentId,
      );
    }

    if (currentView.filters.dateRange) {
      const start = new Date(currentView.filters.dateRange.start);
      const end = new Date(currentView.filters.dateRange.end);
      items = items.filter((item) => {
        const itemDate = new Date(item.updatedAt);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Sort items
    return sortWorkspaceItems(items, currentView.sortBy, currentView.sortOrder);
  }, [folders, sets, currentView]);

  // Group items if grouping is enabled
  const getGroupedItems = useCallback(() => {
    const filteredItems = getFilteredItems();
    if (currentView.groupBy) {
      return groupWorkspaceItems(filteredItems, currentView.groupBy);
    }
    return { "All Items": filteredItems };
  }, [getFilteredItems, currentView.groupBy]);

  // View management
  const handleViewChange = (viewId: string) => {
    const view = allViews.find((v) => v.id === viewId);
    if (view) {
      setCurrentViewState(view);
      setCurrentView(viewId);
    }
  };

  const handleCreateView = () => {
    const newView = createWorkspaceView({
      name: `Custom View ${allViews.length + 1}`,
      type: "grid",
      filters: currentView.filters,
      sortBy: currentView.sortBy,
      sortOrder: currentView.sortOrder,
      groupBy: currentView.groupBy,
      isDefault: false,
    });
    setAllViews([...allViews, newView]);
    handleViewChange(newView.id);
  };

  const handleUpdateView = (updates: Partial<WorkspaceView>) => {
    const updatedView = { ...currentView, ...updates };
    setCurrentViewState(updatedView);
    updateWorkspaceView(currentView.id, updates);

    // Update views list
    setAllViews(
      allViews.map((v) => (v.id === currentView.id ? updatedView : v)),
    );
  };

  // Selection management
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const selectAllItems = () => {
    const allItems = getFilteredItems();
    setSelectedItems(new Set(allItems.map((item) => item.id)));
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setShowBulkActions(false);
  };

  // Item actions
  const handleItemClick = (item: Folder | FlashcardSet) => {
    if (showSelection) {
      toggleItemSelection(item.id);
    } else {
      onItemSelect?.(item);
    }
  };

  // Render item based on view mode
  const renderItem = (item: Folder | FlashcardSet) => {
    const isSet = "cards" in item;
    const isSelected = selectedItems.has(item.id);

    const itemContent = (
      <div
        className={`
          group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer
          ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}
          ${currentView.type === "list" ? "flex items-center space-x-4" : ""}
        `}
        onClick={() => handleItemClick(item)}
      >
        {showSelection && (
          <Checkbox
            checked={isSelected}
            onChange={() => toggleItemSelection(item.id)}
            className="absolute top-2 right-2 z-10"
          />
        )}

        <div
          className={`
            flex items-center space-x-3 
            ${currentView.type === "list" ? "flex-1" : ""}
          `}
        >
          <div
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium
              ${isSet ? "bg-blue-500" : "bg-purple-500"}
            `}
          >
            {isSet ? "S" : "F"}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {isSet ? item.title : item.name}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {item.description}
              </p>
            )}
            <div className="flex items-center space-x-2 mt-1">
              {item.isBookmarked && (
                <BookmarkIcon className="w-3 h-3 text-yellow-500" />
              )}
              {isSet && (
                <Badge variant="secondary" className="text-xs">
                  {item.cards.length} cards
                </Badge>
              )}
              <span className="text-xs text-gray-400">
                {new Date(item.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onItemSelect?.(item)}>
              <Eye className="w-4 h-4 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <BookmarkIcon className="w-4 h-4 mr-2" />
              {item.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );

    return (
      <div
        key={item.id}
        className={currentView.type === "grid" ? "col-span-1" : ""}
      >
        {itemContent}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const groupedItems = getGroupedItems();
  const filteredItems = getFilteredItems();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Workspace
            </h1>
            {stats && (
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{stats.totalFolders} folders</span>
                <span>{stats.totalSets} sets</span>
                <span>{stats.totalCards} cards</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={onCreateSet}>
              <Plus className="w-4 h-4 mr-2" />
              New Set
            </Button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={currentView.id} onValueChange={handleViewChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allViews.map((view) => (
                  <SelectItem key={view.id} value={view.id}>
                    {view.name}
                  </SelectItem>
                ))}
                <DropdownMenuSeparator />
                <SelectItem value="__create_new__" onSelect={handleCreateView}>
                  + Create New View
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button
                variant={currentView.type === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleUpdateView({ type: "grid" })}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={currentView.type === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleUpdateView({ type: "list" })}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={currentView.type === "tree" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleUpdateView({ type: "tree" })}
              >
                <Tree className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedItems.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedItems.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}

            <Select
              value={currentView.sortBy}
              onValueChange={(value: SortField) =>
                handleUpdateView({ sortBy: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleUpdateView({
                  sortOrder: currentView.sortOrder === "asc" ? "desc" : "asc",
                })
              }
            >
              {currentView.sortOrder === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="border-b p-4">
          <GlobalSearch
            onResultSelect={(result) => {
              // Handle search result selection
              setShowSearch(false);
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <div className="w-64 border-r bg-gray-50 dark:bg-gray-800">
          <WorkspaceNavigation
            currentView={currentView}
            onViewChange={handleViewChange}
            onFilterChange={(filters) => handleUpdateView({ filters })}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {Object.entries(groupedItems).map(([groupName, items]) => (
                <div key={groupName} className="mb-8">
                  {Object.keys(groupedItems).length > 1 && (
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {groupName}
                      </h2>
                      <Separator className="mt-2" />
                    </div>
                  )}

                  <div
                    className={
                      currentView.type === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "space-y-2"
                    }
                  >
                    {items.map(renderItem)}
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No items found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Try adjusting your filters or create a new set.
                  </p>
                  <Button onClick={onCreateSet}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Set
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <BulkOperations
          selectedItemIds={Array.from(selectedItems)}
          onComplete={(operation) => {
            clearSelection();
            loadData(); // Refresh data
          }}
          onCancel={clearSelection}
        />
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <FolderCreator
          mode="modal"
          onSuccess={() => {
            setShowCreateFolder(false);
            loadData();
          }}
          onCancel={() => setShowCreateFolder(false)}
        />
      )}
    </div>
  );
};
