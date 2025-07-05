import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Clock,
  Folder,
  FileText,
  CreditCard,
  Filter,
  X,
  TrendingUp,
  Star,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchQuery, SearchResult, SearchFilter } from "@/types/workspace";
import {
  searchContent,
  getSearchSuggestions,
  saveSearch,
  getSearchHistory,
} from "@/lib/searchEngine";

interface GlobalSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  compact?: boolean;
  autoFocus?: boolean;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onResultSelect,
  placeholder = "Search folders, sets, and cards...",
  showFilters = true,
  compact = false,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFiltersState] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>({});
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string, filters: SearchFilter = {}) => {
      if (!searchQuery.trim() && Object.keys(filters).length === 0) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      try {
        const searchParams: SearchQuery = {
          query: searchQuery,
          filters,
          sortBy: "relevance",
          sortOrder: "desc",
          limit: 50,
        };

        const searchResults = searchContent(searchParams);
        setResults(searchResults);
        setShowResults(true);
        setSelectedIndex(-1);

        // Save search to history if it's a real search
        if (searchQuery.trim()) {
          saveSearch(searchQuery);
          setSearchHistory(getSearchHistory());
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Get suggestions
    if (value.length >= 2) {
      const newSuggestions = getSearchSuggestions(value, 5);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }

    // Debounced search
    debounceRef.current = setTimeout(() => {
      performSearch(value, activeFilter);
    }, 300);
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    setShowResults(false);
    setQuery("");
    onResultSelect?.(result);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion, activeFilter);
    inputRef.current?.focus();
  };

  // Handle history selection
  const handleHistorySelect = (historyItem: string) => {
    setQuery(historyItem);
    performSearch(historyItem, activeFilter);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle filter changes
  const handleFilterChange = (filters: SearchFilter) => {
    setActiveFilter(filters);
    performSearch(query, filters);
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    setSuggestions([]);
  };

  // Get result icon
  const getResultIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <Folder className="w-4 h-4 text-purple-500" />;
      case "set":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "card":
        return <CreditCard className="w-4 h-4 text-green-500" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  // Highlight matched terms
  const highlightMatch = (text: string, matchedTerms: string[]) => {
    if (!matchedTerms.length) return text;

    let highlightedText = text;
    matchedTerms.forEach((term) => {
      const regex = new RegExp(`(${term})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>`,
      );
    });

    return highlightedText;
  };

  const hasActiveFilters = Object.keys(activeFilter).length > 0;

  return (
    <div className={`relative ${compact ? "w-64" : "w-full max-w-2xl"}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query || results.length > 0) {
              setShowResults(true);
            }
          }}
          className={`pl-10 ${query ? "pr-20" : "pr-4"} ${compact ? "h-8" : "h-10"}`}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFiltersState(!showFilters)}
              className={`h-6 w-6 p-0 ${hasActiveFilters ? "text-blue-600" : ""}`}
            >
              <Filter className="w-3 h-3" />
            </Button>
          )}

          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap gap-1">
          {activeFilter.type?.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type}
            </Badge>
          ))}
          {activeFilter.hasBookmark && (
            <Badge variant="secondary" className="text-xs">
              bookmarked
            </Badge>
          )}
          {activeFilter.dateRange && (
            <Badge variant="secondary" className="text-xs">
              date range
            </Badge>
          )}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
        >
          <ScrollArea className="max-h-96">
            {/* Loading State */}
            {isLoading && (
              <div className="p-4 text-center text-gray-500">
                <Search className="w-4 h-4 animate-pulse mx-auto mb-2" />
                Searching...
              </div>
            )}

            {/* No Results */}
            {!isLoading && results.length === 0 && query && (
              <div className="p-4 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">
                  Try different keywords or check filters
                </p>
              </div>
            )}

            {/* Suggestions */}
            {!query && suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm"
                  >
                    <TrendingUp className="w-3 h-3 inline mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Search History */}
            {!query && searchHistory.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </div>
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistorySelect(historyItem)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm"
                  >
                    <Clock className="w-3 h-3 inline mr-2 text-gray-400" />
                    {historyItem}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {!isLoading && results.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Results ({results.length})
                </div>
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultSelect(result)}
                    className={`
                      w-full text-left px-3 py-3 rounded-md transition-colors
                      ${
                        index === selectedIndex
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3
                            className="font-medium text-gray-900 dark:text-gray-100 truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(
                                result.title,
                                result.matchedTerms,
                              ),
                            }}
                          />
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        {result.description && (
                          <p
                            className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1"
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(
                                result.description,
                                result.matchedTerms,
                              ),
                            }}
                          />
                        )}
                        {result.parentName && (
                          <p className="text-xs text-gray-400 mt-1">
                            in {result.parentName}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(result.lastModified).toLocaleDateString()}
                          </span>
                          <div className="flex">
                            {Array.from({
                              length: Math.min(
                                5,
                                Math.ceil(result.relevanceScore),
                              ),
                            }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-2 h-2 text-yellow-400 fill-current"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Search Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40">
          <SearchFilters
            filters={activeFilter}
            onChange={handleFilterChange}
            onClose={() => setShowFiltersState(false)}
          />
        </div>
      )}
    </div>
  );
};
