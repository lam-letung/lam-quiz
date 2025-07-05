import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Folder as FolderIcon,
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Move,
  BookmarkIcon,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Filter,
  FileText,
  ArrowUp,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { FolderManager } from "@/components/folders/FolderManager";
import { FolderTree } from "@/components/folders/FolderTree";
import { CreateFolderModal } from "@/components/folders/CreateFolderModal";
import { MoveToFolderModal } from "@/components/folders/MoveToFolderModal";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { Folder, FolderStats, FOLDER_COLORS } from "@/types/folder";
import { FlashcardSet } from "@/types/flashcard";
import {
  getFolders,
  getFolderWithSets,
  deleteFolders,
} from "@/lib/folderStorage";
import { getSets } from "@/lib/storage";

type ViewMode = "grid" | "list" | "tree";
type SortBy = "name" | "date" | "sets" | "cards";

const FoldersPage: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isMobile = useIsMobile();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortFolders();
  }, [folders, searchQuery, sortBy, sortOrder, currentFolder]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedFolders, loadedSets] = await Promise.all([
        getFolders(),
        getSets(),
      ]);
      setFolders(loadedFolders);
      setSets(loadedSets);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortFolders = () => {
    let filtered = folders;

    // Filter by current folder (show children)
    if (currentFolder) {
      filtered = folders.filter((folder) => folder.parentId === currentFolder);
    } else {
      filtered = folders.filter((folder) => !folder.parentId); // Root level
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (folder) =>
          folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (folder.description &&
            folder.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      );
    }

    // Sort folders
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "sets":
          const aSets = getSetsInFolder(a.id).length;
          const bSets = getSetsInFolder(b.id).length;
          comparison = aSets - bSets;
          break;
        case "cards":
          const aCards = getTotalCardsInFolder(a.id);
          const bCards = getTotalCardsInFolder(b.id);
          comparison = aCards - bCards;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredFolders(filtered);
  };

  const getSetsInFolder = (folderId: string): FlashcardSet[] => {
    // This would be implemented based on how sets are associated with folders
    // For now, return empty array - would need to implement set-folder relationships
    return [];
  };

  const getTotalCardsInFolder = (folderId: string): number => {
    const folderSets = getSetsInFolder(folderId);
    return folderSets.reduce((total, set) => total + set.cards.length, 0);
  };

  const getFolderStats = (folder: Folder): FolderStats => {
    const folderSets = getSetsInFolder(folder.id);
    const totalCards = folderSets.reduce(
      (total, set) => total + set.cards.length,
      0,
    );

    return {
      totalSets: folderSets.length,
      totalCards,
      lastActivity: folder.updatedAt,
    };
  };

  const getCurrentFolderPath = (): Folder[] => {
    const path: Folder[] = [];
    let current = currentFolder;

    while (current) {
      const folder = folders.find((f) => f.id === current);
      if (folder) {
        path.unshift(folder);
        current = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  };

  const handleFolderClick = (folder: Folder) => {
    if (selectedFolders.size > 0) {
      // Selection mode
      toggleFolderSelection(folder.id);
    } else {
      // Navigation mode
      setCurrentFolder(folder.id);
    }
  };

  const toggleFolderSelection = (folderId: string) => {
    const newSelection = new Set(selectedFolders);
    if (newSelection.has(folderId)) {
      newSelection.delete(folderId);
    } else {
      newSelection.add(folderId);
    }
    setSelectedFolders(newSelection);
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setShowCreateModal(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setShowCreateModal(true);
  };

  const handleDeleteFolders = async (folderIds: string[]) => {
    try {
      deleteFolders(folderIds);
      await loadData();
      setSelectedFolders(new Set());
    } catch (error) {
      console.error("Error deleting folders:", error);
    }
  };

  const handleBulkMove = () => {
    if (selectedFolders.size > 0) {
      setShowMoveModal(true);
    }
  };

  const navigateUp = () => {
    const path = getCurrentFolderPath();
    if (path.length > 1) {
      setCurrentFolder(path[path.length - 2].id);
    } else {
      setCurrentFolder(null);
    }
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

  const renderFolderCard = (folder: Folder) => {
    const stats = getFolderStats(folder);
    const colorClass = getFolderColorClass(folder);
    const isSelected = selectedFolders.has(folder.id);

    return (
      <Card
        key={folder.id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected
            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : ""
        }`}
        onClick={() => handleFolderClick(folder)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                <FolderIcon className={`w-5 h-5 ${colorClass.text}`} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base truncate">
                  {folder.name}
                </CardTitle>
                {folder.description && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFolderClick(folder)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BookmarkIcon className="w-4 h-4 mr-2" />
                  {folder.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Move className="w-4 h-4 mr-2" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteFolders([folder.id])}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3 text-muted-foreground" />
                <span>{stats.totalSets} sets</span>
              </div>
              {stats.totalCards > 0 && (
                <div className="flex items-center space-x-1">
                  <span>{stats.totalCards} cards</span>
                </div>
              )}
            </div>
            {folder.isBookmarked && (
              <BookmarkIcon className="w-3 h-3 text-yellow-500 fill-current" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <ResponsiveContainer>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading folders...</p>
            </div>
          </div>
        </ResponsiveContainer>
      </AppLayout>
    );
  }

  const currentPath = getCurrentFolderPath();

  return (
    <AppLayout>
      <ResponsiveContainer maxWidth="xl" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Folders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize your study sets with folders
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreateFolder}>
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {currentPath.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolder(null)}
              className="text-blue-600 hover:text-blue-700"
            >
              Root
            </Button>
            {currentPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <span className="text-gray-400">/</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentFolder(folder.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {folder.name}
                </Button>
              </React.Fragment>
            ))}
            {currentPath.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={navigateUp}
                className="ml-2"
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                Up
              </Button>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedFolders.size > 0 && (
              <>
                <span className="text-sm text-gray-500">
                  {selectedFolders.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={handleBulkMove}>
                  <Move className="w-4 h-4 mr-2" />
                  Move
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDeleteFolders(Array.from(selectedFolders))
                  }
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}

            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Select
              value={sortBy}
              onValueChange={(value: SortBy) => setSortBy(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="sets">Sets</SelectItem>
                <SelectItem value="cards">Cards</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        {filteredFolders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery ? "No folders found" : "No folders yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery
                  ? "Try different search terms"
                  : "Create your first folder to organize your study sets"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateFolder}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <ResponsiveGrid
            columns={{ mobile: 1, tablet: 2, desktop: 3, large: 4 }}
            gap="md"
          >
            {filteredFolders.map(renderFolderCard)}
          </ResponsiveGrid>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateFolderModal
            folder={editingFolder}
            parentId={currentFolder}
            onClose={() => {
              setShowCreateModal(false);
              setEditingFolder(null);
            }}
            onSuccess={() => {
              setShowCreateModal(false);
              setEditingFolder(null);
              loadData();
            }}
          />
        )}

        {showMoveModal && (
          <MoveToFolderModal
            itemIds={Array.from(selectedFolders)}
            itemType="folder"
            onClose={() => setShowMoveModal(false)}
            onSuccess={() => {
              setShowMoveModal(false);
              setSelectedFolders(new Set());
              loadData();
            }}
          />
        )}
      </ResponsiveContainer>
    </AppLayout>
  );
};

export default FoldersPage;
