import {
  ShareSettings,
  SharedItem,
  ShareLink,
  Comment,
  Collaboration,
  Collaborator,
  Activity,
  ShareVisibility,
} from "@/types/social";
import { FlashcardSet } from "@/types/flashcard";
import { Folder } from "@/types/folder";

const SHARING_STORAGE_KEYS = {
  SHARED_ITEMS: "lam_quiz_shared_items",
  SHARE_LINKS: "lam_quiz_share_links",
  COMMENTS: "lam_quiz_comments",
  COLLABORATIONS: "lam_quiz_collaborations",
  ACTIVITIES: "lam_quiz_activities",
} as const;

// Generate unique share ID
const generateShareId = (): string => {
  return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateShortCode = (): string => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

// Share Settings Management
export const createShareSettings = (
  options: Partial<ShareSettings>,
): ShareSettings => {
  return {
    id: generateShareId(),
    visibility: options.visibility || "private",
    allowComments: options.allowComments ?? true,
    allowCloning: options.allowCloning ?? true,
    allowDownload: options.allowDownload ?? true,
    password: options.password,
    expiresAt: options.expiresAt,
    maxViews: options.maxViews,
    currentViews: 0,
    createdAt: new Date().toISOString(),
  };
};

// Shared Items Management
export const getSharedItems = (): SharedItem[] => {
  try {
    const items = localStorage.getItem(SHARING_STORAGE_KEYS.SHARED_ITEMS);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error("Error loading shared items:", error);
    return [];
  }
};

export const saveSharedItems = (items: SharedItem[]): void => {
  try {
    localStorage.setItem(
      SHARING_STORAGE_KEYS.SHARED_ITEMS,
      JSON.stringify(items),
    );
  } catch (error) {
    console.error("Error saving shared items:", error);
  }
};

export const shareItem = (
  item: FlashcardSet | Folder,
  settings: ShareSettings,
  owner: { id: string; name: string; avatar?: string },
): SharedItem => {
  const isSet = "cards" in item;
  const shareId = generateShareId();

  const sharedItem: SharedItem = {
    id: generateShareId(),
    itemId: item.id,
    itemType: isSet ? "set" : "folder",
    shareId,
    title: isSet ? item.title : item.name,
    description: item.description,
    owner,
    settings,
    stats: {
      views: 0,
      clones: 0,
      comments: 0,
      likes: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sharedItems = getSharedItems();
  sharedItems.push(sharedItem);
  saveSharedItems(sharedItems);

  // Create share link
  const shareLink = createShareLink(sharedItem, settings);

  // Log activity
  logActivity({
    type: "share",
    itemId: item.id,
    itemType: isSet ? "set" : "folder",
    itemName: isSet ? item.title : item.name,
    user: owner,
    description: `Shared ${isSet ? "set" : "folder"} "${isSet ? item.title : item.name}"`,
  });

  return sharedItem;
};

export const getSharedItem = (shareId: string): SharedItem | null => {
  const sharedItems = getSharedItems();
  return sharedItems.find((item) => item.shareId === shareId) || null;
};

export const updateSharedItem = (
  shareId: string,
  updates: Partial<SharedItem>,
): void => {
  const sharedItems = getSharedItems();
  const index = sharedItems.findIndex((item) => item.shareId === shareId);

  if (index !== -1) {
    sharedItems[index] = {
      ...sharedItems[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveSharedItems(sharedItems);
  }
};

export const removeSharedItem = (shareId: string): void => {
  const sharedItems = getSharedItems();
  const filteredItems = sharedItems.filter((item) => item.shareId !== shareId);
  saveSharedItems(filteredItems);

  // Remove associated comments
  const comments = getComments();
  const filteredComments = comments.filter(
    (comment) => comment.shareId !== shareId,
  );
  saveComments(filteredComments);

  // Remove share link
  const shareLinks = getShareLinks();
  const filteredLinks = shareLinks.filter((link) => link.id !== shareId);
  saveShareLinks(filteredLinks);
};

// Share Links Management
export const getShareLinks = (): ShareLink[] => {
  try {
    const links = localStorage.getItem(SHARING_STORAGE_KEYS.SHARE_LINKS);
    return links ? JSON.parse(links) : [];
  } catch (error) {
    console.error("Error loading share links:", error);
    return [];
  }
};

export const saveShareLinks = (links: ShareLink[]): void => {
  try {
    localStorage.setItem(
      SHARING_STORAGE_KEYS.SHARE_LINKS,
      JSON.stringify(links),
    );
  } catch (error) {
    console.error("Error saving share links:", error);
  }
};

export const createShareLink = (
  sharedItem: SharedItem,
  settings: ShareSettings,
): ShareLink => {
  const shortCode = generateShortCode();
  const baseUrl = window.location.origin;

  const shareLink: ShareLink = {
    id: sharedItem.shareId,
    url: `${baseUrl}/shared/${shortCode}`,
    shortCode,
    itemId: sharedItem.itemId,
    itemType: sharedItem.itemType,
    settings,
    analytics: {
      totalViews: 0,
      uniqueViews: 0,
      referrers: [],
      countries: [],
      dailyViews: [],
    },
    createdAt: new Date().toISOString(),
  };

  const shareLinks = getShareLinks();
  shareLinks.push(shareLink);
  saveShareLinks(shareLinks);

  return shareLink;
};

export const getShareLink = (shortCode: string): ShareLink | null => {
  const shareLinks = getShareLinks();
  return shareLinks.find((link) => link.shortCode === shortCode) || null;
};

export const trackShareLinkView = (
  shortCode: string,
  referrer?: string,
  country?: string,
): void => {
  const shareLinks = getShareLinks();
  const linkIndex = shareLinks.findIndex(
    (link) => link.shortCode === shortCode,
  );

  if (linkIndex !== -1) {
    const link = shareLinks[linkIndex];

    // Update analytics
    link.analytics.totalViews++;
    link.analytics.uniqueViews++; // Simplified - would need better tracking for unique views
    link.lastAccessedAt = new Date().toISOString();

    // Track referrer
    if (referrer) {
      const existingReferrer = link.analytics.referrers.find(
        (r) => r.source === referrer,
      );
      if (existingReferrer) {
        existingReferrer.count++;
      } else {
        link.analytics.referrers.push({ source: referrer, count: 1 });
      }
    }

    // Track country
    if (country) {
      const existingCountry = link.analytics.countries.find(
        (c) => c.country === country,
      );
      if (existingCountry) {
        existingCountry.count++;
      } else {
        link.analytics.countries.push({ country, count: 1 });
      }
    }

    // Track daily views
    const today = new Date().toISOString().split("T")[0];
    const existingDay = link.analytics.dailyViews.find((d) => d.date === today);
    if (existingDay) {
      existingDay.views++;
    } else {
      link.analytics.dailyViews.push({ date: today, views: 1 });
    }

    // Keep only last 30 days
    link.analytics.dailyViews = link.analytics.dailyViews.slice(-30);

    saveShareLinks(shareLinks);

    // Update shared item stats
    updateSharedItem(link.id, {
      stats: {
        views: link.analytics.totalViews,
        clones: 0, // Would track separately
        comments: 0, // Would get from comments
        likes: 0, // Would track separately
      },
    });
  }
};

// Comments Management
export const getComments = (): Comment[] => {
  try {
    const comments = localStorage.getItem(SHARING_STORAGE_KEYS.COMMENTS);
    return comments ? JSON.parse(comments) : [];
  } catch (error) {
    console.error("Error loading comments:", error);
    return [];
  }
};

export const saveComments = (comments: Comment[]): void => {
  try {
    localStorage.setItem(
      SHARING_STORAGE_KEYS.COMMENTS,
      JSON.stringify(comments),
    );
  } catch (error) {
    console.error("Error saving comments:", error);
  }
};

export const addComment = (
  shareId: string,
  content: string,
  author: { id: string; name: string; avatar?: string },
  parentId?: string,
): Comment => {
  const comment: Comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    shareId,
    author,
    content,
    parentId,
    reactions: {
      like: 0,
      helpful: 0,
      insightful: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const comments = getComments();
  comments.push(comment);
  saveComments(comments);

  // Log activity
  logActivity({
    type: "comment",
    itemId: shareId,
    itemType: "set", // Simplified
    itemName: "", // Would get from shared item
    user: author,
    description: `Added a comment`,
  });

  return comment;
};

export const getCommentsForShare = (shareId: string): Comment[] => {
  const comments = getComments();
  return comments.filter((comment) => comment.shareId === shareId);
};

export const updateComment = (commentId: string, content: string): void => {
  const comments = getComments();
  const index = comments.findIndex((comment) => comment.id === commentId);

  if (index !== -1) {
    comments[index].content = content;
    comments[index].updatedAt = new Date().toISOString();
    saveComments(comments);
  }
};

export const deleteComment = (commentId: string): void => {
  const comments = getComments();
  const filteredComments = comments.filter(
    (comment) => comment.id !== commentId,
  );
  saveComments(filteredComments);
};

export const reactToComment = (
  commentId: string,
  reaction: "like" | "helpful" | "insightful",
): void => {
  const comments = getComments();
  const index = comments.findIndex((comment) => comment.id === commentId);

  if (index !== -1) {
    comments[index].reactions[reaction]++;
    saveComments(comments);
  }
};

// Collaboration Management
export const getCollaborations = (): Collaboration[] => {
  try {
    const collaborations = localStorage.getItem(
      SHARING_STORAGE_KEYS.COLLABORATIONS,
    );
    return collaborations ? JSON.parse(collaborations) : [];
  } catch (error) {
    console.error("Error loading collaborations:", error);
    return [];
  }
};

export const saveCollaborations = (collaborations: Collaboration[]): void => {
  try {
    localStorage.setItem(
      SHARING_STORAGE_KEYS.COLLABORATIONS,
      JSON.stringify(collaborations),
    );
  } catch (error) {
    console.error("Error saving collaborations:", error);
  }
};

export const createCollaboration = (
  itemId: string,
  itemType: "set" | "folder",
  owner: Collaborator,
): Collaboration => {
  const collaboration: Collaboration = {
    id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    itemId,
    itemType,
    collaborators: [owner],
    permissions: {
      canEdit: true,
      canDelete: true,
      canShare: true,
      canManageCollaborators: true,
      canViewAnalytics: true,
      canExport: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const collaborations = getCollaborations();
  collaborations.push(collaboration);
  saveCollaborations(collaborations);

  return collaboration;
};

export const addCollaborator = (
  collaborationId: string,
  collaborator: Omit<Collaborator, "joinedAt" | "lastActive" | "status">,
): void => {
  const collaborations = getCollaborations();
  const index = collaborations.findIndex(
    (collab) => collab.id === collaborationId,
  );

  if (index !== -1) {
    const newCollaborator: Collaborator = {
      ...collaborator,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: "pending",
    };

    collaborations[index].collaborators.push(newCollaborator);
    collaborations[index].updatedAt = new Date().toISOString();
    saveCollaborations(collaborations);
  }
};

// Activity Tracking
export const getActivities = (): Activity[] => {
  try {
    const activities = localStorage.getItem(SHARING_STORAGE_KEYS.ACTIVITIES);
    return activities ? JSON.parse(activities) : [];
  } catch (error) {
    console.error("Error loading activities:", error);
    return [];
  }
};

export const saveActivities = (activities: Activity[]): void => {
  try {
    localStorage.setItem(
      SHARING_STORAGE_KEYS.ACTIVITIES,
      JSON.stringify(activities),
    );
  } catch (error) {
    console.error("Error saving activities:", error);
  }
};

export const logActivity = (
  activity: Omit<Activity, "id" | "createdAt">,
): void => {
  const newActivity: Activity = {
    ...activity,
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const activities = getActivities();
  activities.unshift(newActivity); // Add to beginning

  // Keep only last 100 activities
  const trimmedActivities = activities.slice(0, 100);
  saveActivities(trimmedActivities);
};

export const getRecentActivities = (limit: number = 20): Activity[] => {
  const activities = getActivities();
  return activities.slice(0, limit);
};

// Utility functions
export const canUserAccess = (
  sharedItem: SharedItem,
  userId?: string,
  password?: string,
): boolean => {
  const settings = sharedItem.settings;

  // Check expiration
  if (settings.expiresAt && new Date(settings.expiresAt) < new Date()) {
    return false;
  }

  // Check max views
  if (settings.maxViews && settings.currentViews >= settings.maxViews) {
    return false;
  }

  // Check visibility
  switch (settings.visibility) {
    case "private":
      return userId === sharedItem.owner.id;
    case "restricted":
      return settings.password === password;
    case "public":
    case "unlisted":
      return true;
    default:
      return false;
  }
};

export const generateShareUrl = (shortCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${shortCode}`;
};

export const copyShareUrl = async (shortCode: string): Promise<boolean> => {
  const url = generateShareUrl(shortCode);

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};
