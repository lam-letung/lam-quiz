import { FlashcardSet } from "@/types/flashcard";
import { Folder } from "@/types/folder";
import { getSets, saveSets } from "@/lib/storage";
import { getFolders, saveFolders } from "@/lib/folderStorage";

const BOOKMARK_STORAGE_KEY = "lam_quiz_bookmarks";

export interface BookmarkItem {
  id: string;
  type: "set" | "folder";
  bookmarkedAt: string;
  tags: string[];
  notes?: string;
}

export interface BookmarkStats {
  totalBookmarks: number;
  setBookmarks: number;
  folderBookmarks: number;
  recentlyBookmarked: BookmarkItem[];
  mostUsedTags: { tag: string; count: number }[];
}

// Bookmark Management
export const getBookmarks = (): BookmarkItem[] => {
  try {
    const bookmarks = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    return bookmarks ? JSON.parse(bookmarks) : [];
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    return [];
  }
};

export const saveBookmarks = (bookmarks: BookmarkItem[]): void => {
  try {
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error("Error saving bookmarks:", error);
  }
};

export const addBookmark = (
  id: string,
  type: "set" | "folder",
  tags: string[] = [],
  notes?: string,
): void => {
  const bookmarks = getBookmarks();
  const existingIndex = bookmarks.findIndex(
    (b) => b.id === id && b.type === type,
  );

  const bookmarkItem: BookmarkItem = {
    id,
    type,
    bookmarkedAt: new Date().toISOString(),
    tags,
    notes,
  };

  if (existingIndex >= 0) {
    // Update existing bookmark
    bookmarks[existingIndex] = { ...bookmarks[existingIndex], ...bookmarkItem };
  } else {
    // Add new bookmark
    bookmarks.push(bookmarkItem);
  }

  saveBookmarks(bookmarks);

  // Update the actual item's bookmark status
  if (type === "set") {
    const sets = getSets();
    const setIndex = sets.findIndex((s) => s.id === id);
    if (setIndex >= 0) {
      sets[setIndex] = { ...sets[setIndex], isBookmarked: true };
      saveSets(sets);
    }
  } else {
    const folders = getFolders();
    const folderIndex = folders.findIndex((f) => f.id === id);
    if (folderIndex >= 0) {
      folders[folderIndex] = { ...folders[folderIndex], isBookmarked: true };
      saveFolders(folders);
    }
  }
};

export const removeBookmark = (id: string, type: "set" | "folder"): void => {
  const bookmarks = getBookmarks();
  const updatedBookmarks = bookmarks.filter(
    (b) => !(b.id === id && b.type === type),
  );
  saveBookmarks(updatedBookmarks);

  // Update the actual item's bookmark status
  if (type === "set") {
    const sets = getSets();
    const setIndex = sets.findIndex((s) => s.id === id);
    if (setIndex >= 0) {
      sets[setIndex] = { ...sets[setIndex], isBookmarked: false };
      saveSets(sets);
    }
  } else {
    const folders = getFolders();
    const folderIndex = folders.findIndex((f) => f.id === id);
    if (folderIndex >= 0) {
      folders[folderIndex] = { ...folders[folderIndex], isBookmarked: false };
      saveFolders(folders);
    }
  }
};

export const toggleBookmark = (id: string, type: "set" | "folder"): boolean => {
  const bookmarks = getBookmarks();
  const existing = bookmarks.find((b) => b.id === id && b.type === type);

  if (existing) {
    removeBookmark(id, type);
    return false;
  } else {
    addBookmark(id, type);
    return true;
  }
};

export const isBookmarked = (id: string, type: "set" | "folder"): boolean => {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.id === id && b.type === type);
};

export const updateBookmarkTags = (
  id: string,
  type: "set" | "folder",
  tags: string[],
): void => {
  const bookmarks = getBookmarks();
  const bookmarkIndex = bookmarks.findIndex(
    (b) => b.id === id && b.type === type,
  );

  if (bookmarkIndex >= 0) {
    bookmarks[bookmarkIndex].tags = tags;
    saveBookmarks(bookmarks);
  }
};

export const updateBookmarkNotes = (
  id: string,
  type: "set" | "folder",
  notes: string,
): void => {
  const bookmarks = getBookmarks();
  const bookmarkIndex = bookmarks.findIndex(
    (b) => b.id === id && b.type === type,
  );

  if (bookmarkIndex >= 0) {
    bookmarks[bookmarkIndex].notes = notes;
    saveBookmarks(bookmarks);
  }
};

// Bookmark Queries
export const getBookmarkedSets = (): FlashcardSet[] => {
  const sets = getSets();
  return sets.filter((set) => isBookmarked(set.id, "set"));
};

export const getBookmarkedFolders = (): Folder[] => {
  const folders = getFolders();
  return folders.filter((folder) => isBookmarked(folder.id, "folder"));
};

export const getBookmarksByTag = (tag: string): BookmarkItem[] => {
  const bookmarks = getBookmarks();
  return bookmarks.filter((bookmark) =>
    bookmark.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
};

export const getBookmarksByType = (type: "set" | "folder"): BookmarkItem[] => {
  const bookmarks = getBookmarks();
  return bookmarks.filter((bookmark) => bookmark.type === type);
};

export const getRecentBookmarks = (limit: number = 10): BookmarkItem[] => {
  const bookmarks = getBookmarks();
  return bookmarks
    .sort(
      (a, b) =>
        new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime(),
    )
    .slice(0, limit);
};

// Bookmark Statistics
export const getBookmarkStats = (): BookmarkStats => {
  const bookmarks = getBookmarks();
  const setBookmarksCount = bookmarks.filter((b) => b.type === "set").length;
  const folderBookmarksCount = bookmarks.filter(
    (b) => b.type === "folder",
  ).length;

  // Get most used tags
  const tagFrequency: { [tag: string]: number } = {};
  bookmarks.forEach((bookmark) => {
    bookmark.tags.forEach((tag) => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  const mostUsedTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalBookmarks: bookmarks.length,
    setBookmarks: setBookmarksCount,
    folderBookmarks: folderBookmarksCount,
    recentlyBookmarked: getRecentBookmarks(5),
    mostUsedTags,
  };
};

// Search Bookmarks
export const searchBookmarks = (
  query: string,
  filters?: {
    type?: "set" | "folder";
    tags?: string[];
    dateRange?: { start: string; end: string };
  },
): BookmarkItem[] => {
  let bookmarks = getBookmarks();

  // Apply type filter
  if (filters?.type) {
    bookmarks = bookmarks.filter((b) => b.type === filters.type);
  }

  // Apply tag filter
  if (filters?.tags && filters.tags.length > 0) {
    bookmarks = bookmarks.filter((b) =>
      filters.tags!.some((tag) =>
        b.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
      ),
    );
  }

  // Apply date range filter
  if (filters?.dateRange) {
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);
    bookmarks = bookmarks.filter((b) => {
      const bookmarkDate = new Date(b.bookmarkedAt);
      return bookmarkDate >= start && bookmarkDate <= end;
    });
  }

  // Apply text search
  if (query.trim()) {
    const queryLower = query.toLowerCase();
    bookmarks = bookmarks.filter((bookmark) => {
      // Search in tags
      const tagMatch = bookmark.tags.some((tag) =>
        tag.toLowerCase().includes(queryLower),
      );

      // Search in notes
      const notesMatch =
        bookmark.notes?.toLowerCase().includes(queryLower) || false;

      // Get the actual item and search in its properties
      let itemMatch = false;
      if (bookmark.type === "set") {
        const sets = getSets();
        const set = sets.find((s) => s.id === bookmark.id);
        if (set) {
          itemMatch =
            set.title.toLowerCase().includes(queryLower) ||
            (set.description &&
              set.description.toLowerCase().includes(queryLower));
        }
      } else {
        const folders = getFolders();
        const folder = folders.find((f) => f.id === bookmark.id);
        if (folder) {
          itemMatch =
            folder.name.toLowerCase().includes(queryLower) ||
            (folder.description &&
              folder.description.toLowerCase().includes(queryLower));
        }
      }

      return tagMatch || notesMatch || itemMatch;
    });
  }

  return bookmarks.sort(
    (a, b) =>
      new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime(),
  );
};

// Export/Import Bookmarks
export const exportBookmarks = (): string => {
  const bookmarks = getBookmarks();
  const sets = getSets();
  const folders = getFolders();

  const exportData = {
    bookmarks,
    bookmarkedSets: sets.filter((s) => isBookmarked(s.id, "set")),
    bookmarkedFolders: folders.filter((f) => isBookmarked(f.id, "folder")),
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  return JSON.stringify(exportData, null, 2);
};

export const importBookmarks = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);

    if (data.version === "1.0" && Array.isArray(data.bookmarks)) {
      saveBookmarks(data.bookmarks);

      // Update bookmark status on actual items
      data.bookmarks.forEach((bookmark: BookmarkItem) => {
        if (bookmark.type === "set") {
          const sets = getSets();
          const setIndex = sets.findIndex((s) => s.id === bookmark.id);
          if (setIndex >= 0) {
            sets[setIndex] = { ...sets[setIndex], isBookmarked: true };
          }
          saveSets(sets);
        } else {
          const folders = getFolders();
          const folderIndex = folders.findIndex((f) => f.id === bookmark.id);
          if (folderIndex >= 0) {
            folders[folderIndex] = {
              ...folders[folderIndex],
              isBookmarked: true,
            };
          }
          saveFolders(folders);
        }
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error importing bookmarks:", error);
    return false;
  }
};

// Cleanup orphaned bookmarks
export const cleanupOrphanedBookmarks = (): number => {
  const bookmarks = getBookmarks();
  const sets = getSets();
  const folders = getFolders();

  const validBookmarks = bookmarks.filter((bookmark) => {
    if (bookmark.type === "set") {
      return sets.some((s) => s.id === bookmark.id);
    } else {
      return folders.some((f) => f.id === bookmark.id);
    }
  });

  const removedCount = bookmarks.length - validBookmarks.length;
  if (removedCount > 0) {
    saveBookmarks(validBookmarks);
  }

  return removedCount;
};
