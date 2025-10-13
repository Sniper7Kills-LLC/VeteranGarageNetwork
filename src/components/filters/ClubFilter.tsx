import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import ClubTypeFilter from './ClubTypeFilter';

export interface ClubFilterProps {
  // Club data
  clubs: Array<{ 
    id: string; 
    name: string; 
    type?: string | null; 
    description?: string | null;
  }>;
  
  // Club type filtering (optional)
  showClubTypeFilter?: boolean;
  clubTypes?: readonly string[];
  selectedClubTypes?: Set<string>;
  onClubTypeToggle?: (type: string) => void;
  clubTypeDescriptions?: Record<string, string>;
  
  // Individual club filtering
  selectedClubIds: Set<string>;
  onClubToggle: (clubId: string) => void;
  
  // Search (optional)
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  
  // Pagination (optional)
  hasMoreClubs?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  
  // Additional content (optional)
  headerContent?: React.ReactNode;
  
  // Labels
  clubTypeFilterTitle?: string;
  clubFilterTitle?: string;
  allTypesLabel?: string;
  allClubsLabel?: string;
}

export default function ClubFilter({
  clubs,
  showClubTypeFilter = false,
  clubTypes = [],
  selectedClubTypes = new Set(),
  onClubTypeToggle,
  clubTypeDescriptions = {},
  selectedClubIds,
  onClubToggle,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search clubs (case-sensitive)...',
  hasMoreClubs = false,
  onLoadMore,
  isLoadingMore = false,
  headerContent,
  clubTypeFilterTitle = 'Filter by Club Type',
  clubFilterTitle = 'Filter by Club',
  allTypesLabel = 'All Types',
  allClubsLabel = 'All Clubs',
}: ClubFilterProps) {
  const allClubsSelected = selectedClubIds.size === clubs.length;

  const handleAllClubsToggle = () => {
    if (allClubsSelected) {
      // Deselect all
      clubs.forEach((club) => {
        if (selectedClubIds.has(club.id)) {
          onClubToggle(club.id);
        }
      });
    } else {
      // Select all
      clubs.forEach((club) => {
        if (!selectedClubIds.has(club.id)) {
          onClubToggle(club.id);
        }
      });
    }
  };

  // Helper function to format club type labels
  const formatClubType = (type: string): string => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header Content (e.g., Register Button) */}
      {headerContent}

      {/* Filter by Club Type */}
      {showClubTypeFilter && clubTypes.length > 0 && onClubTypeToggle && (
        <ClubTypeFilter
          clubTypes={clubTypes}
          selectedClubTypes={selectedClubTypes}
          onClubTypeToggle={onClubTypeToggle}
          clubTypeDescriptions={clubTypeDescriptions}
          title={clubTypeFilterTitle}
          allTypesLabel={allTypesLabel}
        />
      )}

      {/* Filter by Club */}
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">{clubFilterTitle}</h3>
        
        {/* Search Input */}
        {showSearch && (
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="mb-3"
          />
        )}
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {/* All Clubs option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-clubs"
                checked={allClubsSelected}
                onCheckedChange={handleAllClubsToggle}
              />
              <label
                htmlFor="all-clubs"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {allClubsLabel}
              </label>
            </div>

            <div className="border-t border-border my-2" />

            {/* Individual club filters */}
            {clubs.map((club) => (
              <HoverCard key={club.id}>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={club.id}
                    checked={selectedClubIds.has(club.id)}
                    onCheckedChange={() => onClubToggle(club.id)}
                  />
                  <HoverCardTrigger asChild>
                    <label
                      htmlFor={club.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {club.name}
                    </label>
                  </HoverCardTrigger>
                </div>
                <HoverCardContent className="w-80" side="right">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{club.name}</h4>
                    {club.type && (
                      <p className="text-xs text-muted-foreground">
                        Type: {formatClubType(club.type)}
                      </p>
                    )}
                    {club.description ? (
                      <p className="text-sm text-muted-foreground">
                        {club.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No description available
                      </p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
            
            {/* Load More Button */}
            {hasMoreClubs && onLoadMore && (
              <div className="pt-2">
                <Button
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
