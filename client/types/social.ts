export interface ShareSettings {
  id: string;
  visibility: "private" | "public" | "unlisted" | "restricted";
  allowComments: boolean;
  allowCloning: boolean;
  allowDownload: boolean;
  password?: string;
  expiresAt?: string;
  maxViews?: number;
  currentViews: number;
  createdAt: string;
}

export interface SharedItem {
  id: string;
  itemId: string;
  itemType: "set" | "folder";
  shareId: string;
  title: string;
  description?: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  settings: ShareSettings;
  stats: {
    views: number;
    clones: number;
    comments: number;
    likes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  shareId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  parentId?: string; // for replies
  reactions: {
    like: number;
    helpful: number;
    insightful: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Collaboration {
  id: string;
  itemId: string;
  itemType: "set" | "folder";
  collaborators: Collaborator[];
  permissions: CollaborationPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "editor" | "viewer" | "commenter";
  joinedAt: string;
  lastActive: string;
  status: "active" | "pending" | "declined";
}

export interface CollaborationPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManageCollaborators: boolean;
  canViewAnalytics: boolean;
  canExport: boolean;
}

export interface Activity {
  id: string;
  type: "create" | "edit" | "delete" | "share" | "clone" | "comment" | "like";
  itemId: string;
  itemType: "set" | "folder" | "card";
  itemName: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  url: string;
  shortCode: string;
  itemId: string;
  itemType: "set" | "folder";
  settings: ShareSettings;
  analytics: {
    totalViews: number;
    uniqueViews: number;
    referrers: { source: string; count: number }[];
    countries: { country: string; count: number }[];
    dailyViews: { date: string; views: number }[];
  };
  createdAt: string;
  lastAccessedAt?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  memberCount: number;
  itemCount: number;
  moderators: Collaborator[];
  rules: string[];
  tags: string[];
  createdAt: string;
}

export interface CommunityMembership {
  communityId: string;
  userId: string;
  role: "member" | "moderator" | "admin";
  joinedAt: string;
  contributions: {
    setsShared: number;
    commentsPosted: number;
    helpfulVotes: number;
  };
}

export type ShareVisibility = "private" | "public" | "unlisted" | "restricted";
export type CollaboratorRole = "owner" | "editor" | "viewer" | "commenter";
export type ActivityType =
  | "create"
  | "edit"
  | "delete"
  | "share"
  | "clone"
  | "comment"
  | "like";
