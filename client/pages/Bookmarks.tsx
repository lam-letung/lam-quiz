import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookmarkIcon,
  Search,
  Filter,
  Download,
  Upload,
  Star,
  Clock,
  Tag,
  Folder as FolderIcon,
  FileText,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Calendar,
  TrendingUp,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { BookmarkManager } from "@/components/bookmarks/BookmarkManager";
import { ResponsiveContainer } from "@/components/ui/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/ui/ResponsiveGrid";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { FlashcardSet } from "@/types/flashcard";
import { Folder } from "@/types/folder";
import {
  BookmarkItem,
  BookmarkStats,
  getBookmarks,
  getBookmarkedSets,
  getBookmarkedFolders,
  getBookmarkStats,
  searchBookmarks,
  removeBookmark,
  exportBookmarks,
  cleanupOrphanedBookmarks,
} from "@/lib/bookmarkStorage";

const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkedSets, setBookmarkedSets] = useState<FlashcardSet[]>([]);
  const [bookmarkedFolders, setBookmarkedFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "set" | "folder">(
    "all",
  );
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const isMobile = useIsMobile();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBookmarks();
  }, [bookmarks, searchQuery, selectedType, selectedTag]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedBookmarks, loadedSets, loadedFolders, loadedStats] =
        await Promise.all([
          getBookmarks(),
          getBookmarkedSets(),
          getBookmarkedFolders(),
          getBookmarkStats(),
        ]);

      setBookmarks(loadedBookmarks);
      setBookmarkedSets(loadedSets);
      setBookmarkedFolders(loadedFolders);
      setStats(loadedStats);

      // Cleanup orphaned bookmarks
      const removed = cleanupOrphanedBookmarks();
      if (removed > 0) {
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookmarks = () => {
    const filters: any = {};

    if (selectedType !== "all") {
      filters.type = selectedType;
    }

    if (selectedTag) {
      filters.tags = [selectedTag];
    }

    const filtered = searchBookmarks(searchQuery, filters);
    // Update the display based on filtered results
  };

  const handleRemoveBookmark = async (id: string, type: "set" | "folder") => {
    try {
      removeBookmark(id, type);
      await loadData();
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const handleExportBookmarks = () => {
    const exportData = exportBookmarks();
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookmarks-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderBookmarkCard = (
    item: FlashcardSet | Folder,
    type: "set" | "folder",
  ) => {
    const isSet = type === "set";
    const bookmark = bookmarks.find((b) => b.id === item.id && b.type === type);

    return (
      <Card
        key={item.id}
        className="cursor-pointer transition-all duration-200 hover:shadow-md"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                {isSet ? (
                  <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <FolderIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base truncate">
                  {isSet ? (item as FlashcardSet).title : item.name}
                </CardTitle>
                {item.description && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookmarkIcon className="w-4 h-4 text-yellow-500 fill-current" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Tags
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleRemoveBookmark(item.id, type)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Bookmark
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              {isSet ? (
                <div className="flex items-center space-x-4">
                  <span>{(item as FlashcardSet).cards.length} cards</span>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <span>Folder</span>
                </div>
              )}
              {bookmark && (
                <span className="text-xs text-gray-400">
                  {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Tags */}
            {bookmark && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {bookmark.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Notes */}
            {bookmark?.notes && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                {bookmark.notes}
              </div>
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
              <p className="text-gray-600">Loading bookmarks...</p>
            </div>
          </div>
        </ResponsiveContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ResponsiveContainer maxWidth="xl" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <BookmarkIcon className="w-6 h-6 mr-3 text-yellow-500" />
              Bookmarks
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quick access to your favorite content
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportBookmarks}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <ResponsiveGrid
            columns={{ mobile: 2, tablet: 4, desktop: 4 }}
            gap="md"
          >
            <Card>
              <CardContent className="p-4 text-center">
                <BookmarkIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.totalBookmarks}</div>
                <div className="text-sm text-gray-500">Total Bookmarks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.setBookmarks}</div>
                <div className="text-sm text-gray-500">Study Sets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FolderIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {stats.folderBookmarks}
                </div>
                <div className="text-sm text-gray-500">Folders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Tag className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {stats.mostUsedTags.length}
                </div>
                <div className="text-sm text-gray-500">Unique Tags</div>
              </CardContent>
            </Card>
          </ResponsiveGrid>
        )}

        {/* Controls */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
            >
              All
            </Button>
            <Button
              variant={selectedType === "set" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("set")}
            >
              Sets
            </Button>
            <Button
              variant={selectedType === "folder" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("folder")}
            >
              Folders
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Bookmarks</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="tags">By Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {bookmarkedSets.length === 0 && bookmarkedFolders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookmarkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No bookmarks yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Start bookmarking your favorite study sets and folders
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {bookmarkedSets.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Study Sets</h3>
                    <ResponsiveGrid
                      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                      gap="md"
                    >
                      {bookmarkedSets.map((set) =>
                        renderBookmarkCard(set, "set"),
                      )}
                    </ResponsiveGrid>
                  </div>
                )}

                {bookmarkedFolders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Folders</h3>
                    <ResponsiveGrid
                      columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                      gap="md"
                    >
                      {bookmarkedFolders.map((folder) =>
                        renderBookmarkCard(folder, "folder"),
                      )}
                    </ResponsiveGrid>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {stats?.recentlyBookmarked &&
            stats.recentlyBookmarked.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Recently Bookmarked
                </h3>
                <ResponsiveGrid
                  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
                  gap="md"
                >
                  {stats.recentlyBookmarked.map((bookmark) => {
                    const item =
                      bookmark.type === "set"
                        ? bookmarkedSets.find((s) => s.id === bookmark.id)
                        : bookmarkedFolders.find((f) => f.id === bookmark.id);
                    return item
                      ? renderBookmarkCard(item, bookmark.type)
                      : null;
                  })}
                </ResponsiveGrid>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No recent bookmarks
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Your recently bookmarked items will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            {stats?.mostUsedTags && stats.mostUsedTags.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {stats.mostUsedTags.map(({ tag, count }) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedTag(selectedTag === tag ? "" : tag)
                      }
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag} ({count})
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No tags yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Add tags to your bookmarks to organize them better
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </ResponsiveContainer>
    </AppLayout>
  );
};

export default BookmarksPage;
