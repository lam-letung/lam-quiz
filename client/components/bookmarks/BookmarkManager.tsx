import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bookmark,
  Star,
  Heart,
  Flag,
  Search,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Calendar,
  Tag,
  Folder,
  FileText,
  Download,
  Trash2,
  Edit,
  Eye,
  Share,
  Plus,
} from "lucide-react";
import { FlashcardSet } from "@/types/flashcard";
import { Folder as FolderType } from "@/types/folder";
import { getSets } from "@/lib/storage";
import { getFolders } from "@/lib/folderStorage";

interface BookmarkedItem {
  id: string;
  type: "folder" | "set";
  name: string;
  description?: string;
  bookmarkedAt: string;
  tags: string[];
  category: string;
  lastAccessed?: string;
  accessCount: number;
  isFavorite: boolean;
}

interface BookmarkManagerProps {
  onItemSelect?: (item: FlashcardSet | FolderType) => void;
  compact?: boolean;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  onItemSelect,
  compact = false,
}) => {
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<BookmarkedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "access">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BookmarkedItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBookmarkedItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [bookmarkedItems, searchQuery, sortBy, sortOrder, selectedCategory]);

  const loadBookmarkedItems = async () => {
    try {
      const folders = getFolders();
      const sets = getSets();

      const bookmarked: BookmarkedItem[] = [
        ...folders
          .filter((folder) => folder.isBookmarked)
          .map((folder) => ({
            id: folder.id,
            type: "folder" as const,
            name: folder.name,
            description: folder.description,
            bookmarkedAt: folder.updatedAt,
            tags: extractTags(folder.description || ""),
            category: "folders",
            accessCount: 0,
            isFavorite: false,
          })),
        ...sets
          .filter((set) => set.isBookmarked || false)
          .map((set) => ({
            id: set.id,
            type: "set" as const,
            name: set.title,
            description: set.description,
            bookmarkedAt: set.updatedAt,
            tags: extractTags(set.description || ""),
            category: "sets",
            accessCount: 0,
            isFavorite: false,
          })),
      ];

      setBookmarkedItems(bookmarked);
    } catch (error) {
      console.error("Error loading bookmarked items:", error);
    }
  };

  const extractTags = (text: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = text.match(tagRegex);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  };

  const filterAndSortItems = () => {
    let filtered = [...bookmarkedItems];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Sort items
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison =
            new Date(a.bookmarkedAt).getTime() -
            new Date(b.bookmarkedAt).getTime();
          break;
        case "access":
          comparison = a.accessCount - b.accessCount;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  };

  const handleItemClick = (item: BookmarkedItem) => {
    // Update access count and last accessed
    const updatedItems = bookmarkedItems.map((bItem) =>
      bItem.id === item.id
        ? {
            ...bItem,
            accessCount: bItem.accessCount + 1,
            lastAccessed: new Date().toISOString(),
          }
        : bItem,
    );
    setBookmarkedItems(updatedItems);

    // Call parent handler
    if (onItemSelect) {
      // You would need to fetch the actual item from storage here
      // This is a simplified version
    }
  };

  const handleToggleFavorite = (itemId: string) => {
    const updatedItems = bookmarkedItems.map((item) =>
      item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item,
    );
    setBookmarkedItems(updatedItems);
  };

  const handleRemoveBookmark = (itemId: string) => {
    const updatedItems = bookmarkedItems.filter((item) => item.id !== itemId);
    setBookmarkedItems(updatedItems);
    // You would also need to update the actual item in storage
  };

  const handleEditBookmark = (item: BookmarkedItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleBulkAction = (action: string) => {
    const selectedIds = Array.from(selectedItems);

    switch (action) {
      case "remove":
        const updatedItems = bookmarkedItems.filter(
          (item) => !selectedIds.includes(item.id),
        );
        setBookmarkedItems(updatedItems);
        break;
      case "favorite":
        const favoriteUpdated = bookmarkedItems.map((item) =>
          selectedIds.includes(item.id) ? { ...item, isFavorite: true } : item,
        );
        setBookmarkedItems(favoriteUpdated);
        break;
      case "export":
        const exportData = bookmarkedItems.filter((item) =>
          selectedIds.includes(item.id),
        );
        downloadBookmarks(exportData);
        break;
    }

    setSelectedItems(new Set());
  };

  const downloadBookmarks = (items: BookmarkedItem[]) => {
    const data = {
      bookmarks: items,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookmarks-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getItemIcon = (type: string, isFavorite: boolean) => {
    if (isFavorite) {
      return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
    }
    return type === "folder" ? (
      <Folder className="w-4 h-4 text-purple-500" />
    ) : (
      <FileText className="w-4 h-4 text-blue-500" />
    );
  };

  const categories = [
    { value: "all", label: "All Bookmarks", count: bookmarkedItems.length },
    {
      value: "folders",
      label: "Folders",
      count: bookmarkedItems.filter((item) => item.type === "folder").length,
    },
    {
      value: "sets",
      label: "Sets",
      count: bookmarkedItems.filter((item) => item.type === "set").length,
    },
    {
      value: "favorites",
      label: "Favorites",
      count: bookmarkedItems.filter((item) => item.isFavorite).length,
    },
  ];

  if (compact) {
    return (
      <div className="w-80 h-96 border rounded-lg bg-white dark:bg-gray-900">
        <div className="p-3 border-b">
          <h3 className="font-medium">Quick Bookmarks</h3>
        </div>
        <ScrollArea className="h-80">
          <div className="p-2 space-y-1">
            {filteredItems.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {getItemIcon(item.type, item.isFavorite)}
                  <span className="text-sm truncate">{item.name}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5" />
            <h1 className="text-xl font-semibold">Bookmarks</h1>
            <Badge variant="secondary">{bookmarkedItems.length} items</Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid3X3 className="w-4 h-4" />
              )}
            </Button>

            {selectedItems.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions ({selectedItems.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("favorite")}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Add to Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleBulkAction("remove")}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Bookmarks
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Sort: {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                Date Added
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("access")}>
                Most Accessed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <SortDesc className="w-4 h-4 mr-2" />
                ) : (
                  <SortAsc className="w-4 h-4 mr-2" />
                )}
                {sortOrder === "asc" ? "Descending" : "Ascending"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-48 border-r p-4">
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`
                  w-full text-left p-2 rounded text-sm transition-colors
                  ${
                    selectedCategory === category.value
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{category.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.count}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No bookmarks found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "Try different search terms"
                      : "Start bookmarking items to see them here"}
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "space-y-2"
                  }
                >
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`
                        group border rounded-lg p-4 cursor-pointer transition-all duration-200
                        ${
                          selectedItems.has(item.id)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }
                        ${viewMode === "list" ? "flex items-center space-x-4" : ""}
                      `}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) {
                          const newSelection = new Set(selectedItems);
                          if (newSelection.has(item.id)) {
                            newSelection.delete(item.id);
                          } else {
                            newSelection.add(item.id);
                          }
                          setSelectedItems(newSelection);
                        } else {
                          handleItemClick(item);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        {getItemIcon(item.type, item.isFavorite)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            {item.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(item.bookmarkedAt).toLocaleDateString()}
                            </span>
                            {item.accessCount > 0 && (
                              <span className="text-xs text-gray-400">
                                {item.accessCount} views
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleItemClick(item)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditBookmark(item)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleFavorite(item.id)}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            {item.isFavorite
                              ? "Remove from Favorites"
                              : "Add to Favorites"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Share className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveBookmark(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Bookmark
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
