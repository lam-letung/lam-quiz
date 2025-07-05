export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color for folder
  userId?: string;
  parentId?: string; // For nested folders
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations (computed)
  parent?: Folder;
  children?: Folder[];
  setIds?: string[]; // IDs of sets in this folder
}

export interface FolderTree {
  folder: Folder;
  children: FolderTree[];
  depth: number;
}

export interface FolderStats {
  totalSets: number;
  totalCards: number;
  lastActivity?: string;
  studyProgress?: {
    masteredCards: number;
    totalCards: number;
    accuracy: number;
  };
}

export type FolderColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "pink"
  | "gray";

export const FOLDER_COLORS: Record<
  FolderColor,
  { name: string; bg: string; text: string; border: string }
> = {
  red: {
    name: "Red",
    bg: "bg-red-100 dark:bg-red-950/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  orange: {
    name: "Orange",
    bg: "bg-orange-100 dark:bg-orange-950/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  yellow: {
    name: "Yellow",
    bg: "bg-yellow-100 dark:bg-yellow-950/20",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  green: {
    name: "Green",
    bg: "bg-green-100 dark:bg-green-950/20",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  blue: {
    name: "Blue",
    bg: "bg-blue-100 dark:bg-blue-950/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  indigo: {
    name: "Indigo",
    bg: "bg-indigo-100 dark:bg-indigo-950/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  purple: {
    name: "Purple",
    bg: "bg-purple-100 dark:bg-purple-950/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  pink: {
    name: "Pink",
    bg: "bg-pink-100 dark:bg-pink-950/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
  },
  gray: {
    name: "Gray",
    bg: "bg-gray-100 dark:bg-gray-950/20",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-800",
  },
};

export interface CreateFolderData {
  name: string;
  description?: string;
  color?: FolderColor;
  parentId?: string;
}

export interface UpdateFolderData {
  name?: string;
  description?: string;
  color?: FolderColor;
  isBookmarked?: boolean;
}

export interface MoveSetToFolderData {
  setId: string;
  folderId: string | null; // null means root level
}

export interface FolderWithSets extends Folder {
  sets: any[]; // FlashcardSet array
  stats: FolderStats;
}
