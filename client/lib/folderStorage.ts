import {
  Folder,
  FolderTree,
  CreateFolderData,
  UpdateFolderData,
  FolderStats,
  FolderWithSets,
} from "@/types/folder";
import { FlashcardSet } from "@/types/flashcard";
import { getSets, saveSet } from "@/lib/storage";
import { generateId } from "@/lib/storage";

const FOLDER_STORAGE_KEYS = {
  FOLDERS: "lam_quiz_folders",
  SET_FOLDER_MAPPING: "lam_quiz_set_folder_mapping",
} as const;

// Folder CRUD Operations
export const saveFolders = (folders: Folder[]): void => {
  try {
    localStorage.setItem(FOLDER_STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (error) {
    console.error("Error saving folders:", error);
  }
};

export const getFolders = (): Folder[] => {
  try {
    const folders = localStorage.getItem(FOLDER_STORAGE_KEYS.FOLDERS);
    return folders ? JSON.parse(folders) : [];
  } catch (error) {
    console.error("Error loading folders:", error);
    return [];
  }
};

export const getFolder = (id: string): Folder | null => {
  const folders = getFolders();
  return folders.find((folder) => folder.id === id) || null;
};

export const createFolder = (data: CreateFolderData): Folder => {
  const now = new Date().toISOString();
  const newFolder: Folder = {
    id: generateId(),
    name: data.name,
    description: data.description,
    color: data.color,
    parentId: data.parentId,
    isBookmarked: false,
    createdAt: now,
    updatedAt: now,
  };

  const folders = getFolders();
  folders.push(newFolder);
  saveFolders(folders);

  return newFolder;
};

export const updateFolder = (
  id: string,
  data: UpdateFolderData,
): Folder | null => {
  const folders = getFolders();
  const folderIndex = folders.findIndex((folder) => folder.id === id);

  if (folderIndex === -1) {
    return null;
  }

  const updatedFolder: Folder = {
    ...folders[folderIndex],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  folders[folderIndex] = updatedFolder;
  saveFolders(folders);

  return updatedFolder;
};

export const deleteFolder = (id: string): boolean => {
  const folders = getFolders();
  const folderToDelete = folders.find((folder) => folder.id === id);

  if (!folderToDelete) {
    return false;
  }

  // Check if folder has children
  const hasChildren = folders.some((folder) => folder.parentId === id);
  if (hasChildren) {
    throw new Error(
      "Cannot delete folder with subfolders. Please delete or move subfolders first.",
    );
  }

  // Remove folder
  const updatedFolders = folders.filter((folder) => folder.id !== id);
  saveFolders(updatedFolders);

  return true;
};

export const deleteFolders = (ids: string[]): boolean => {
  const folders = getFolders();

  // Check if any folder has children that aren't also being deleted
  for (const id of ids) {
    const hasChildren = folders.some(
      (folder) => folder.parentId === id && !ids.includes(folder.id),
    );
    if (hasChildren) {
      throw new Error(
        "Cannot delete folders with subfolders that aren't also being deleted.",
      );
    }
  }

  // Remove folders
  const updatedFolders = folders.filter((folder) => !ids.includes(folder.id));
  saveFolders(updatedFolders);

  return true;
};

export const moveFoldersToParent = (
  folderIds: string[],
  newParentId: string | null,
): void => {
  const folders = getFolders();

  const updatedFolders = folders.map((folder) => {
    if (folderIds.includes(folder.id)) {
      return {
        ...folder,
        parentId: newParentId,
        updatedAt: new Date().toISOString(),
      };
    }
    return folder;
  });

  saveFolders(updatedFolders);
};

export const getFolderWithSets = (folderId: string): FolderWithSets | null => {
  const folder = getFolder(folderId);
  if (!folder) return null;

  // This would be implemented based on how sets are associated with folders
  // For now, return empty sets array
  const sets: any[] = [];
  const stats: FolderStats = {
    totalSets: sets.length,
    totalCards: sets.reduce(
      (total: number, set: any) => total + (set.cards?.length || 0),
      0,
    ),
    lastActivity: folder.updatedAt,
  };

  return {
    ...folder,
    sets,
    stats,
  };
};

// Set-Folder Mapping Operations
interface SetFolderMapping {
  setId: string;
  folderId: string;
}

export const saveSetFolderMappings = (mappings: SetFolderMapping[]): void => {
  try {
    localStorage.setItem(
      FOLDER_STORAGE_KEYS.SET_FOLDER_MAPPING,
      JSON.stringify(mappings),
    );
  } catch (error) {
    console.error("Error saving set-folder mappings:", error);
  }
};

export const getSetFolderMappings = (): SetFolderMapping[] => {
  try {
    const mappings = localStorage.getItem(
      FOLDER_STORAGE_KEYS.SET_FOLDER_MAPPING,
    );
    return mappings ? JSON.parse(mappings) : [];
  } catch (error) {
    console.error("Error loading set-folder mappings:", error);
    return [];
  }
};

export const moveSetToFolder = (
  setId: string,
  folderId: string | null,
): void => {
  const mappings = getSetFolderMappings();
  const existingIndex = mappings.findIndex(
    (mapping) => mapping.setId === setId,
  );

  if (folderId === null) {
    // Move to root level (remove mapping)
    if (existingIndex >= 0) {
      mappings.splice(existingIndex, 1);
    }
  } else {
    // Move to folder
    const newMapping: SetFolderMapping = { setId, folderId };

    if (existingIndex >= 0) {
      mappings[existingIndex] = newMapping;
    } else {
      mappings.push(newMapping);
    }
  }

  saveSetFolderMappings(mappings);
};

export const getSetFolder = (setId: string): string | null => {
  const mappings = getSetFolderMappings();
  const mapping = mappings.find((m) => m.setId === setId);
  return mapping ? mapping.folderId : null;
};

export const getSetsInFolder = (folderId: string | null): FlashcardSet[] => {
  const allSets = getSets();
  const mappings = getSetFolderMappings();

  if (folderId === null) {
    // Return sets not in any folder
    const setIdsInFolders = new Set(mappings.map((m) => m.setId));
    return allSets.filter((set) => !setIdsInFolders.has(set.id));
  } else {
    // Return sets in specific folder
    const setIdsInFolder = new Set(
      mappings.filter((m) => m.folderId === folderId).map((m) => m.setId),
    );
    return allSets.filter((set) => setIdsInFolder.has(set.id));
  }
};

// Folder Tree Operations
export const buildFolderTree = (
  parentId: string | null = null,
  depth: number = 0,
): FolderTree[] => {
  const folders = getFolders();
  const children = folders.filter((folder) => folder.parentId === parentId);

  return children.map((folder) => ({
    folder,
    children: buildFolderTree(folder.id, depth + 1),
    depth,
  }));
};

export const getFolderWithChildren = (folderId: string): Folder | null => {
  const folder = getFolder(folderId);
  if (!folder) return null;

  const allFolders = getFolders();
  const children = allFolders.filter((f) => f.parentId === folderId);

  return {
    ...folder,
    children,
  };
};

export const getFolderPath = (folderId: string): Folder[] => {
  const folders = getFolders();
  const path: Folder[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = folders.find((f) => f.id === currentId);
    if (!folder) break;

    path.unshift(folder);
    currentId = folder.parentId || null;
  }

  return path;
};

// Folder Statistics
export const getFolderStats = (folderId: string | null): FolderStats => {
  const sets = getSetsInFolder(folderId);
  const totalSets = sets.length;
  const totalCards = sets.reduce((sum, set) => sum + set.cards.length, 0);

  // Get latest activity
  const lastActivity =
    sets.length > 0
      ? sets.reduce((latest, set) => {
          const setDate = new Date(set.updatedAt);
          const latestDate = new Date(latest);
          return setDate > latestDate ? set.updatedAt : latest;
        }, sets[0].updatedAt)
      : undefined;

  return {
    totalSets,
    totalCards,
    lastActivity,
    // TODO: Add study progress calculation when we have progress data
    studyProgress: {
      masteredCards: 0,
      totalCards,
      accuracy: 0,
    },
  };
};

export const getFolderWithStats = (folderId: string): FolderWithSets | null => {
  const folder = getFolder(folderId);
  if (!folder) return null;

  const sets = getSetsInFolder(folderId);
  const stats = getFolderStats(folderId);

  return {
    ...folder,
    sets,
    stats,
  };
};

// Utility Functions
export const getAllFoldersFlat = (): Folder[] => {
  return getFolders().sort((a, b) => a.name.localeCompare(b.name));
};

export const getBookmarkedFolders = (): Folder[] => {
  return getFolders().filter((folder) => folder.isBookmarked);
};

export const searchFolders = (query: string): Folder[] => {
  const folders = getFolders();
  const lowercaseQuery = query.toLowerCase();

  return folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(lowercaseQuery) ||
      folder.description?.toLowerCase().includes(lowercaseQuery),
  );
};

export const validateFolderName = (
  name: string,
  excludeId?: string,
): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: "Folder name is required" };
  }

  if (name.length > 50) {
    return { valid: false, error: "Folder name must be 50 characters or less" };
  }

  // Check for duplicate names at the same level
  const folders = getFolders();
  const isDuplicate = folders.some(
    (folder) =>
      folder.name.toLowerCase() === name.toLowerCase() &&
      folder.id !== excludeId,
  );

  if (isDuplicate) {
    return { valid: false, error: "A folder with this name already exists" };
  }

  return { valid: true };
};

// Sample Data Creation
export const createSampleFolders = (): void => {
  const existingFolders = getFolders();
  if (existingFolders.length > 0) return;

  const sampleFolders: Folder[] = [
    {
      id: generateId(),
      name: "Languages",
      description: "Language learning flashcards",
      color: "blue",
      isBookmarked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Science",
      description: "Science subjects and concepts",
      color: "green",
      isBookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Personal",
      description: "Personal study materials",
      color: "purple",
      isBookmarked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  saveFolders(sampleFolders);
};

// Data Export/Import
export const exportFolderData = () => {
  const data = {
    folders: getFolders(),
    setFolderMappings: getSetFolderMappings(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lam-quiz-folders-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFolderData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);

    if (data.folders) {
      saveFolders(data.folders);
    }
    if (data.setFolderMappings) {
      saveSetFolderMappings(data.setFolderMappings);
    }

    return true;
  } catch (error) {
    console.error("Error importing folder data:", error);
    return false;
  }
};
