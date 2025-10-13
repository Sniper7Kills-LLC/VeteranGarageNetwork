import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  onSearchChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
  className,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const openRef = React.useRef(open);

  // Keep openRef in sync with open state
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (openRef.current) {
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Empty deps - listener stays active

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  const handleToggle = () => {
    setOpen(!open);
    if (open) {
      // Clear search when closing
      setSearchQuery("");
      if (onSearchChange) {
        onSearchChange("");
      }
    }
  };

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const selectedOptions = options.filter((option) =>
    selected.includes(option.value)
  );

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={handleToggle}
      >
        <span className="truncate">
          {selected.length > 0
            ? `${selected.length} selected`
            : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-md shadow-md">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              <>
                {options.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      selected.includes(option.value) && "bg-accent/50"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      {selected.includes(option.value) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                    <span className="flex-1">{option.label}</span>
                    {option.badge && (
                      <Badge
                        variant={option.badgeVariant || "secondary"}
                        className="ml-2"
                      >
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Load More Button */}
          {hasMore && onLoadMore && !isLoading && (
            <div className="border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selected Items */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span>{option.label}</span>
              {option.badge && (
                <span className="text-xs opacity-60">({option.badge})</span>
              )}
              <button
                type="button"
                onClick={(e) => handleRemove(option.value, e)}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
