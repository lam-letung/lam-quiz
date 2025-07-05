import {
  WorkspaceView,
  WorkspaceStats,
  BulkOperation,
  BulkAction,
  ViewMode,
  SortField,
  GroupField,
} from "@/types/workspace";
import { FlashcardSet } from "@/types/flashcard";
import { Folder } from "@/types/folder";
import { getSets, saveSets, saveSet } from "@/lib/storage";
import { getFolders, saveFolders, getFolder } from "@/lib/folderStorage";
import { searchEngine } from "@/lib/searchEngine";

const WORKSPACE_STORAGE_KEYS = {
  VIEWS: "lam_quiz_workspace_views",
  CURRENT_VIEW: "lam_quiz_current_view",
  BULK_HISTORY: "lam_quiz_bulk_history",
  WORKSPACE_SETTINGS: "lam_quiz_workspace_settings",
} as const;

// Workspace Views Management
export const getWorkspaceViews = (): WorkspaceView[] => {
  try {
    const views = localStorage.getItem(WORKSPACE_STORAGE_KEYS.VIEWS);
    if (views) {
      return JSON.parse(views);
    }

    // Return default views if none exist
    return getDefaultViews();
  } catch (error) {
    console.error("Error loading workspace views:", error);
    return getDefaultViews();
  }
};

export const saveWorkspaceViews = (views: WorkspaceView[]): void => {
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEYS.VIEWS, JSON.stringify(views));
  } catch (error) {
    console.error("Error saving workspace views:", error);
  }
};

export const createWorkspaceView = (
  view: Omit<WorkspaceView, "id">,
): WorkspaceView => {
  const views = getWorkspaceViews();
  const newView: WorkspaceView = {
    ...view,
    id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  // If this is set as default, remove default from others
  if (newView.isDefault) {
    views.forEach((v) => (v.isDefault = false));
  }

  views.push(newView);
  saveWorkspaceViews(views);
  return newView;
};

export const updateWorkspaceView = (
  id: string,
  updates: Partial<WorkspaceView>,
): void => {
  const views = getWorkspaceViews();
  const viewIndex = views.findIndex((v) => v.id === id);

  if (viewIndex !== -1) {
    views[viewIndex] = { ...views[viewIndex], ...updates };

    // If setting as default, remove default from others
    if (updates.isDefault) {
      views.forEach((v, i) => {
        if (i !== viewIndex) v.isDefault = false;
      });
    }

    saveWorkspaceViews(views);
  }
};

export const deleteWorkspaceView = (id: string): void => {
  const views = getWorkspaceViews();
  const filteredViews = views.filter((v) => v.id !== id);

  // Ensure we have at least one default view
  if (filteredViews.length > 0 && !filteredViews.some((v) => v.isDefault)) {
    filteredViews[0].isDefault = true;
  }

  saveWorkspaceViews(filteredViews);
};

export const getCurrentView = (): WorkspaceView => {
  try {
    const currentViewId = localStorage.getItem(
      WORKSPACE_STORAGE_KEYS.CURRENT_VIEW,
    );
    if (currentViewId) {
      const views = getWorkspaceViews();
      const view = views.find((v) => v.id === currentViewId);
      if (view) return view;
    }

    // Return default view
    const views = getWorkspaceViews();
    return views.find((v) => v.isDefault) || views[0];
  } catch (error) {
    console.error("Error getting current view:", error);
    return getDefaultViews()[0];
  }
};

export const setCurrentView = (viewId: string): void => {
  localStorage.setItem(WORKSPACE_STORAGE_KEYS.CURRENT_VIEW, viewId);
};

// Default views
function getDefaultViews(): WorkspaceView[] {
  return [
    {
      id: "default_all",
      name: "All Items",
      type: "grid",
      filters: {},
      sortBy: "date",
      sortOrder: "desc",
      isDefault: true,
    },
    {
      id: "default_folders",
      name: "Folders Only",
      type: "tree",
      filters: { type: ["folder"] },
      sortBy: "name",
      sortOrder: "asc",
      isDefault: false,
    },
    {
      id: "default_sets",
      name: "Sets Only",
      type: "list",
      filters: { type: ["set"] },
      sortBy: "date",
      sortOrder: "desc",
      isDefault: false,
    },
    {
      id: "default_bookmarks",
      name: "Bookmarked",
      type: "grid",
      filters: { hasBookmark: true },
      sortBy: "date",
      sortOrder: "desc",
      isDefault: false,
    },
  ];
}

// Workspace Statistics
export const getWorkspaceStats = (): WorkspaceStats => {
  const folders = getFolders();
  const sets = getSets();

  const totalCards = sets.reduce((total, set) => total + set.cards.length, 0);
  const bookmarkedItems = [...folders, ...sets].filter(
    (item) => item.isBookmarked || false,
  ).length;

  // Calculate recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = [
    ...folders.map((f) => ({
      date: f.updatedAt,
      action: "modified",
      itemName: f.name,
      itemType: "folder" as const,
    })),
    ...sets.map((s) => ({
      date: s.updatedAt,
      action: "modified",
      itemName: s.title,
      itemType: "set" as const,
    })),
  ]
    .filter((activity) => new Date(activity.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Calculate storage usage (approximate)
  const folderSize = JSON.stringify(folders).length;
  const setSize = JSON.stringify(sets).length;
  const totalSize = folderSize + setSize;

  return {
    totalFolders: folders.length,
    totalSets: sets.length,
    totalCards,
    bookmarkedItems,
    recentActivity,
    storageUsed: {
      total: totalSize,
      folders: folderSize,
      sets: setSize,
      cards: totalCards,
    },
  };
};

// Bulk Operations
export const getBulkActions = (): BulkAction[] => {
  return [
    {
      id: "move",
      type: "move",
      name: "Move to Folder",
      description: "Move selected items to a different folder",
      icon: "FolderInput",
      confirmationRequired: false,
    },
    {
      id: "bookmark",
      type: "bookmark",
      name: "Toggle Bookmark",
      description: "Add or remove bookmark from selected items",
      icon: "Bookmark",
      confirmationRequired: false,
    },
    {
      id: "color",
      type: "color",
      name: "Change Color",
      description: "Change the color of selected folders",
      icon: "Palette",
      confirmationRequired: false,
    },
    {
      id: "export",
      type: "export",
      name: "Export Items",
      description: "Export selected items to file",
      icon: "Download",
      confirmationRequired: false,
    },
    {
      id: "delete",
      type: "delete",
      name: "Delete Items",
      description: "Permanently delete selected items",
      icon: "Trash2",
      confirmationRequired: true,
    },
  ];
};

export const executeBulkOperation = async (
  operation: BulkOperation,
): Promise<BulkOperation> => {
  const updatedOperation = { ...operation };
  const folders = getFolders();
  const sets = getSets();

  try {
    switch (operation.action.type) {
      case "move":
        const targetFolderId = operation.params?.folderId;

        // Update folder items
        const updatedFolders = folders.map((folder) => {
          if (operation.itemIds.includes(folder.id)) {
            return { ...folder, parentId: targetFolderId };
          }
          return folder;
        });

        // Update set items (move to folder)
        const updatedSets = sets.map((set) => {
          if (operation.itemIds.includes(set.id)) {
            // Implementation would depend on how sets are associated with folders
            return set;
          }
          return set;
        });

        saveFolders(updatedFolders);
        saveSets(updatedSets);
        break;

      case "bookmark":
        const foldersToUpdate = folders.map((folder) => {
          if (operation.itemIds.includes(folder.id)) {
            return { ...folder, isBookmarked: !folder.isBookmarked };
          }
          return folder;
        });

        saveFolders(foldersToUpdate);
        break;

      case "delete":
        const remainingFolders = folders.filter(
          (folder) => !operation.itemIds.includes(folder.id),
        );
        const remainingSets = sets.filter(
          (set) => !operation.itemIds.includes(set.id),
        );

        saveFolders(remainingFolders);
        saveSets(remainingSets);

        // Update search index
        operation.itemIds.forEach((id) => {
          searchEngine.removeItem(id);
        });
        break;

      case "export":
        const exportData = {
          folders: folders.filter((f) => operation.itemIds.includes(f.id)),
          sets: sets.filter((s) => operation.itemIds.includes(s.id)),
          exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lam-quiz-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;

      default:
        throw new Error(`Unknown bulk action: ${operation.action.type}`);
    }

    updatedOperation.progress = {
      completed: operation.itemIds.length,
      total: operation.itemIds.length,
      errors: [],
    };
  } catch (error) {
    updatedOperation.progress = {
      completed: 0,
      total: operation.itemIds.length,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }

  // Save operation to history
  saveBulkOperationHistory(updatedOperation);

  return updatedOperation;
};

export const getBulkOperationHistory = (): BulkOperation[] => {
  try {
    const history = localStorage.getItem(WORKSPACE_STORAGE_KEYS.BULK_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error loading bulk operation history:", error);
    return [];
  }
};

const saveBulkOperationHistory = (operation: BulkOperation): void => {
  try {
    const history = getBulkOperationHistory();
    history.unshift(operation);

    // Keep only last 50 operations
    const trimmedHistory = history.slice(0, 50);

    localStorage.setItem(
      WORKSPACE_STORAGE_KEYS.BULK_HISTORY,
      JSON.stringify(trimmedHistory),
    );
  } catch (error) {
    console.error("Error saving bulk operation history:", error);
  }
};

// Workspace Settings
interface WorkspaceSettings {
  defaultView: ViewMode;
  autoSave: boolean;
  compactMode: boolean;
  showPreview: boolean;
  itemsPerPage: number;
  enableAnimations: boolean;
  theme: "light" | "dark" | "system";
}

export const getWorkspaceSettings = (): WorkspaceSettings => {
  try {
    const settings = localStorage.getItem(
      WORKSPACE_STORAGE_KEYS.WORKSPACE_SETTINGS,
    );
    if (settings) {
      return { ...getDefaultSettings(), ...JSON.parse(settings) };
    }
    return getDefaultSettings();
  } catch (error) {
    console.error("Error loading workspace settings:", error);
    return getDefaultSettings();
  }
};

export const saveWorkspaceSettings = (
  settings: Partial<WorkspaceSettings>,
): void => {
  try {
    const currentSettings = getWorkspaceSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(
      WORKSPACE_STORAGE_KEYS.WORKSPACE_SETTINGS,
      JSON.stringify(updatedSettings),
    );
  } catch (error) {
    console.error("Error saving workspace settings:", error);
  }
};

function getDefaultSettings(): WorkspaceSettings {
  return {
    defaultView: "grid",
    autoSave: true,
    compactMode: false,
    showPreview: true,
    itemsPerPage: 24,
    enableAnimations: true,
    theme: "system",
  };
}

// Utility functions
export const sortWorkspaceItems = (
  items: any[],
  sortBy: SortField,
  sortOrder: "asc" | "desc",
): any[] => {
  return [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = (a.name || a.title || "").localeCompare(
          b.name || b.title || "",
        );
        break;
      case "date":
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case "type":
        const typeA = "cards" in a ? "set" : "folder";
        const typeB = "cards" in b ? "set" : "folder";
        comparison = typeA.localeCompare(typeB);
        break;
      case "size":
        const sizeA = "cards" in a ? a.cards.length : 0;
        const sizeB = "cards" in b ? b.cards.length : 0;
        comparison = sizeA - sizeB;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
};

export const groupWorkspaceItems = (
  items: any[],
  groupBy: GroupField,
): { [key: string]: any[] } => {
  if (groupBy === "none") {
    return { "All Items": items };
  }

  const groups: { [key: string]: any[] } = {};

  items.forEach((item) => {
    let groupKey = "Other";

    switch (groupBy) {
      case "type":
        groupKey = "cards" in item ? "Sets" : "Folders";
        break;
      case "parent":
        groupKey = item.parentId ? `Folder: ${item.parentId}` : "Root";
        break;
      case "color":
        groupKey = item.color || "Default";
        break;
      default:
        groupKey = "All Items";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  });

  return groups;
};
