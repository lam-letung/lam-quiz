import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Tag,
  Bookmark,
  Folder,
  FileText,
  CreditCard,
} from "lucide-react";
import { SearchFilter } from "@/types/workspace";
import { FOLDER_COLORS } from "@/types/folder";

interface SearchFiltersProps {
  filters: SearchFilter;
  onChange: (filters: SearchFilter) => void;
  onClose: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilter>(filters);
  const [dateRange, setDateRange] = useState<{
    start?: Date;
    end?: Date;
  }>({
    start: filters.dateRange?.start
      ? new Date(filters.dateRange.start)
      : undefined,
    end: filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined,
  });

  // Handle type filter changes
  const handleTypeChange = (
    type: "folder" | "set" | "card",
    checked: boolean,
  ) => {
    const currentTypes = localFilters.type || [];
    const updatedTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);

    setLocalFilters({
      ...localFilters,
      type: updatedTypes.length > 0 ? updatedTypes : undefined,
    });
  };

  // Handle bookmark filter
  const handleBookmarkChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      hasBookmark:
        value === "true" ? true : value === "false" ? false : undefined,
    });
  };

  // Handle date range changes
  const handleDateRangeChange = (
    field: "start" | "end",
    date: Date | undefined,
  ) => {
    const newDateRange = { ...dateRange, [field]: date };
    setDateRange(newDateRange);

    if (newDateRange.start && newDateRange.end) {
      setLocalFilters({
        ...localFilters,
        dateRange: {
          start: newDateRange.start.toISOString(),
          end: newDateRange.end.toISOString(),
        },
      });
    } else if (!newDateRange.start && !newDateRange.end) {
      setLocalFilters({
        ...localFilters,
        dateRange: undefined,
      });
    }
  };

  // Apply filters
  const applyFilters = () => {
    onChange(localFilters);
    onClose();
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalFilters({});
    setDateRange({});
    onChange({});
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.type?.length) count++;
    if (localFilters.hasBookmark !== undefined) count++;
    if (localFilters.dateRange) count++;
    if (localFilters.color) count++;
    if (localFilters.tags?.length) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Content Type Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Content Type</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-folder"
                checked={localFilters.type?.includes("folder") || false}
                onCheckedChange={(checked) =>
                  handleTypeChange("folder", checked as boolean)
                }
              />
              <Label
                htmlFor="type-folder"
                className="text-sm flex items-center"
              >
                <Folder className="w-4 h-4 mr-2 text-purple-500" />
                Folders
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-set"
                checked={localFilters.type?.includes("set") || false}
                onCheckedChange={(checked) =>
                  handleTypeChange("set", checked as boolean)
                }
              />
              <Label htmlFor="type-set" className="text-sm flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                Sets
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-card"
                checked={localFilters.type?.includes("card") || false}
                onCheckedChange={(checked) =>
                  handleTypeChange("card", checked as boolean)
                }
              />
              <Label htmlFor="type-card" className="text-sm flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-green-500" />
                Cards
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bookmark Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Bookmark Status
          </Label>
          <Select
            value={
              localFilters.hasBookmark === true
                ? "true"
                : localFilters.hasBookmark === false
                  ? "false"
                  : "all"
            }
            onValueChange={handleBookmarkChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="true">
                <div className="flex items-center">
                  <Bookmark className="w-4 h-4 mr-2 text-yellow-500" />
                  Bookmarked Only
                </div>
              </SelectItem>
              <SelectItem value="false">Not Bookmarked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Date Range Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Date Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                  size="sm"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateRange.start
                    ? dateRange.start.toLocaleDateString()
                    : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.start}
                  onSelect={(date) => handleDateRangeChange("start", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                  size="sm"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateRange.end
                    ? dateRange.end.toLocaleDateString()
                    : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.end}
                  onSelect={(date) => handleDateRangeChange("end", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Separator />

        {/* Color Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Folder Color</Label>
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant={localFilters.color === undefined ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setLocalFilters({ ...localFilters, color: undefined })
              }
              className="text-xs"
            >
              All
            </Button>
            {Object.entries(FOLDER_COLORS).map(([colorKey, colorData]) => (
              <Button
                key={colorKey}
                variant={
                  localFilters.color === colorKey ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  setLocalFilters({ ...localFilters, color: colorKey })
                }
                className="text-xs"
              >
                <div className={`w-3 h-3 rounded-full mr-1 ${colorData.bg}`} />
                {colorData.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tags Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Tags</Label>
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Enter tags separated by commas"
              value={localFilters.tags?.join(", ") || ""}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0);
                setLocalFilters({
                  ...localFilters,
                  tags: tags.length > 0 ? tags : undefined,
                });
              }}
              className="text-sm"
            />
          </div>
          {localFilters.tags && localFilters.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {localFilters.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updatedTags = localFilters.tags?.filter(
                        (_, i) => i !== index,
                      );
                      setLocalFilters({
                        ...localFilters,
                        tags: updatedTags?.length ? updatedTags : undefined,
                      });
                    }}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
