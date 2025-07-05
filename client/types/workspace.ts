export interface WorkspaceItem {
  id: string;
  type: "folder" | "set";
  name: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  isBookmarked: boolean;
  tags?: string[];
  color?: string;
}

export interface SearchResult {
  id: string;
  type: "folder" | "set" | "card";
  title: string;
  description?: string;
  content?: string;
  parentName?: string;
  relevanceScore: number;
  matchedTerms: string[];
  lastModified: string;
}

export interface SearchFilter {
  type?: ("folder" | "set" | "card")[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  hasBookmark?: boolean;
  parentId?: string;
  color?: string;
}

export interface SearchQuery {
  query: string;
  filters: SearchFilter;
  sortBy: "relevance" | "date" | "name" | "type";
  sortOrder: "asc" | "desc";
  limit?: number;
}

export interface WorkspaceView {
  id: string;
  name: string;
  type: "list" | "grid" | "tree" | "kanban";
  filters: SearchFilter;
  sortBy: "name" | "date" | "type" | "size";
  sortOrder: "asc" | "desc";
  groupBy?: "type" | "parent" | "tag" | "color";
  isDefault: boolean;
}

export interface BulkAction {
  id: string;
  type: "move" | "delete" | "bookmark" | "tag" | "color" | "export";
  name: string;
  description: string;
  icon: string;
  confirmationRequired: boolean;
}

export interface BulkOperation {
  action: BulkAction;
  itemIds: string[];
  params?: any;
  progress?: {
    completed: number;
    total: number;
    errors: string[];
  };
}

export interface WorkspaceStats {
  totalFolders: number;
  totalSets: number;
  totalCards: number;
  bookmarkedItems: number;
  recentActivity: {
    date: string;
    action: string;
    itemName: string;
    itemType: "folder" | "set";
  }[];
  storageUsed: {
    total: number;
    folders: number;
    sets: number;
    cards: number;
  };
}

export interface SearchIndex {
  id: string;
  type: "folder" | "set" | "card";
  content: string;
  tokens: string[];
  metadata: {
    title: string;
    description?: string;
    parentName?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export type ViewMode = "list" | "grid" | "tree" | "kanban";
export type SortField = "name" | "date" | "type" | "size" | "relevance";
export type GroupField = "type" | "parent" | "tag" | "color" | "none";
