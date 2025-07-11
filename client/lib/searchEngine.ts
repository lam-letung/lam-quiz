import {
  SearchQuery,
  SearchResult,
  SearchFilter,
  SearchIndex,
} from "@/types/workspace";
import { FlashcardSet, Card } from "@/types/flashcard";
import { Folder } from "@/types/folder";
import { getSets } from "@/lib/storage";
import { getFolders } from "@/lib/folderStorage";

const SEARCH_STORAGE_KEY = "lam_quiz_search_index";
const SEARCH_HISTORY_KEY = "lam_quiz_search_history";

export class SearchEngine {
  private index: SearchIndex[] = [];

  constructor() {
    this.loadIndex();
  }

  // Index Management
  private loadIndex(): void {
    try {
      const stored = localStorage.getItem(SEARCH_STORAGE_KEY);
      this.index = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading search index:", error);
      this.index = [];
    }
  }

  private saveIndex(): void {
    try {
      localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(this.index));
    } catch (error) {
      console.error("Error saving search index:", error);
    }
  }

  // Tokenization and preprocessing
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1);
  }

  private createSearchTokens(
    title: string,
    content?: string,
    description?: string,
    tags?: string[],
  ): string[] {
    const tokens = new Set<string>();

    // Add title tokens with higher weight
    this.tokenize(title).forEach((token) => {
      tokens.add(token);
      tokens.add(`title:${token}`);
    });

    // Add content tokens
    if (content) {
      this.tokenize(content).forEach((token) => tokens.add(token));
    }

    // Add description tokens
    if (description) {
      this.tokenize(description).forEach((token) => tokens.add(token));
    }

    // Add tag tokens
    if (tags) {
      tags.forEach((tag) => {
        this.tokenize(tag).forEach((token) => {
          tokens.add(token);
          tokens.add(`tag:${token}`);
        });
      });
    }

    return Array.from(tokens);
  }

  // Index Building
  public buildIndex(): void {
    this.index = [];

    const folders = getFolders();
    const sets = getSets();

    // Index folders
    folders.forEach((folder) => {
      const tokens = this.createSearchTokens(
        folder.name,
        undefined,
        folder.description,
      );

      this.index.push({
        id: folder.id,
        type: "folder",
        content: `${folder.name} ${folder.description || ""}`,
        tokens,
        metadata: {
          title: folder.name,
          description: folder.description,
          parentName: folder.parentId
            ? folders.find((f) => f.id === folder.parentId)?.name
            : undefined,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
        },
      });
    });

    // Index sets
    sets.forEach((set) => {
      const allCardContent = set.cards
        .map((card) => `${card.term} ${card.definition}`)
        .join(" ");

      const tokens = this.createSearchTokens(
        set.title,
        allCardContent,
        set.description,
      );

      this.index.push({
        id: set.id,
        type: "set",
        content: `${set.title} ${set.description || ""} ${allCardContent}`,
        tokens,
        metadata: {
          title: set.title,
          description: set.description,
          createdAt: set.createdAt,
          updatedAt: set.updatedAt,
        },
      });

      // Index individual cards
      set.cards.forEach((card) => {
        const cardTokens = this.createSearchTokens(card.term, card.definition);

        this.index.push({
          id: card.id,
          type: "card",
          content: `${card.term} ${card.definition}`,
          tokens: cardTokens,
          metadata: {
            title: card.term,
            description: card.definition,
            parentName: set.title,
            createdAt: set.createdAt,
            updatedAt: set.updatedAt,
          },
        });
      });
    });

    this.saveIndex();
  }

  // Search functionality
  public search(query: SearchQuery): SearchResult[] {
    if (!query.query.trim() && Object.keys(query.filters).length === 0) {
      return [];
    }

    let results = this.index;

    // Apply type filter
    if (query.filters.type && query.filters.type.length > 0) {
      results = results.filter((item) =>
        query.filters.type!.includes(item.type),
      );
    }

    // Apply date range filter
    if (query.filters.dateRange) {
      const start = new Date(query.filters.dateRange.start);
      const end = new Date(query.filters.dateRange.end);
      results = results.filter((item) => {
        const itemDate = new Date(item.metadata.updatedAt);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Text search with scoring
    const queryTokens = this.tokenize(query.query);
    const searchResults: SearchResult[] = [];

    results.forEach((item) => {
      if (queryTokens.length === 0) {
        // No text query, include all filtered items
        searchResults.push(this.createSearchResult(item, [], 1.0));
        return;
      }

      const matchedTerms: string[] = [];
      let score = 0;

      queryTokens.forEach((queryToken) => {
        // Exact matches
        if (item.tokens.includes(queryToken)) {
          matchedTerms.push(queryToken);
          score += 2;
        }

        // Title matches (higher weight)
        if (item.tokens.includes(`title:${queryToken}`)) {
          score += 3;
        }

        // Tag matches
        if (item.tokens.includes(`tag:${queryToken}`)) {
          score += 2.5;
        }

        // Partial matches
        const partialMatches = item.tokens.filter((token) =>
          token.includes(queryToken),
        );
        if (partialMatches.length > 0) {
          matchedTerms.push(queryToken);
          score += partialMatches.length * 0.5;
        }
      });

      if (matchedTerms.length > 0) {
        // Normalize score based on query length and content length
        const normalizedScore =
          (score / queryTokens.length) *
          (matchedTerms.length / queryTokens.length);

        searchResults.push(
          this.createSearchResult(item, matchedTerms, normalizedScore),
        );
      }
    });

    // Sort results
    searchResults.sort((a, b) => {
      switch (query.sortBy) {
        case "relevance":
          return b.relevanceScore - a.relevanceScore;
        case "date":
          const dateA = new Date(a.lastModified).getTime();
          const dateB = new Date(b.lastModified).getTime();
          return query.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        case "name":
          const nameCompare = a.title.localeCompare(b.title);
          return query.sortOrder === "asc" ? nameCompare : -nameCompare;
        case "type":
          const typeCompare = a.type.localeCompare(b.type);
          return query.sortOrder === "asc" ? typeCompare : -typeCompare;
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });

    // Apply limit
    if (query.limit) {
      return searchResults.slice(0, query.limit);
    }

    return searchResults;
  }

  private createSearchResult(
    item: SearchIndex,
    matchedTerms: string[],
    score: number,
  ): SearchResult {
    return {
      id: item.id,
      type: item.type,
      title: item.metadata.title,
      description: item.metadata.description,
      content: item.type === "card" ? item.content : undefined,
      parentName: item.metadata.parentName,
      relevanceScore: score,
      matchedTerms,
      lastModified: item.metadata.updatedAt,
    };
  }

  // Search suggestions and autocomplete
  public getSuggestions(partial: string, limit: number = 5): string[] {
    if (partial.length < 2) return [];

    const suggestions = new Set<string>();
    const partialLower = partial.toLowerCase();

    this.index.forEach((item) => {
      item.tokens.forEach((token) => {
        if (token.startsWith(partialLower) && token.length > partial.length) {
          suggestions.add(token);
        }
      });

      // Add title words that start with partial
      const titleWords = this.tokenize(item.metadata.title);
      titleWords.forEach((word) => {
        if (word.startsWith(partialLower) && word.length > partial.length) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions)
      .sort((a, b) => a.length - b.length)
      .slice(0, limit);
  }

  // Search history
  public saveSearchQuery(query: string): void {
    if (!query.trim()) return;

    try {
      const history = this.getSearchHistory();
      const updatedHistory = [
        query,
        ...history.filter((h) => h !== query),
      ].slice(0, 20); // Keep last 20 searches

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  }

  public getSearchHistory(): string[] {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error loading search history:", error);
      return [];
    }
  }

  public clearSearchHistory(): void {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }

  // Advanced search features
  public getPopularSearches(): string[] {
    const history = this.getSearchHistory();
    const frequency: { [key: string]: number } = {};

    history.forEach((query) => {
      frequency[query] = (frequency[query] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query]) => query);
  }

  public getTrendingTerms(): string[] {
    const recentHistory = this.getSearchHistory().slice(0, 10);
    const terms = new Set<string>();

    recentHistory.forEach((query) => {
      this.tokenize(query).forEach((term) => {
        if (term.length > 2) terms.add(term);
      });
    });

    return Array.from(terms).slice(0, 8);
  }

  // Update index when data changes
  public updateItem(
    id: string,
    type: "folder" | "set" | "card",
    data: any,
  ): void {
    const existingIndex = this.index.findIndex(
      (item) => item.id === id && item.type === type,
    );

    if (existingIndex !== -1) {
      this.index.splice(existingIndex, 1);
    }

    // Rebuild the specific item
    if (type === "folder") {
      const tokens = this.createSearchTokens(
        data.name,
        undefined,
        data.description,
      );

      this.index.push({
        id: data.id,
        type: "folder",
        content: `${data.name} ${data.description || ""}`,
        tokens,
        metadata: {
          title: data.name,
          description: data.description,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      });
    }

    this.saveIndex();
  }

  public removeItem(id: string, type?: "folder" | "set" | "card"): void {
    this.index = this.index.filter(
      (item) => !(item.id === id && (!type || item.type === type)),
    );
    this.saveIndex();
  }
}

// Singleton instance
export const searchEngine = new SearchEngine();

// Helper functions
export const initializeSearchIndex = (): void => {
  searchEngine.buildIndex();
};

export const searchContent = (query: SearchQuery): SearchResult[] => {
  return searchEngine.search(query);
};

export const getSearchSuggestions = (
  partial: string,
  limit?: number,
): string[] => {
  return searchEngine.getSuggestions(partial, limit);
};

export const saveSearch = (query: string): void => {
  searchEngine.saveSearchQuery(query);
};

export const getSearchHistory = (): string[] => {
  return searchEngine.getSearchHistory();
};
