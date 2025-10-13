import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

export interface ClubTypeFilterProps {
  clubTypes: readonly string[];
  selectedClubTypes: Set<string>;
  onClubTypeToggle: (type: string) => void;
  clubTypeDescriptions?: Record<string, string>;
  title?: string;
  allTypesLabel?: string;
  height?: string;
}

export default function ClubTypeFilter({
  clubTypes,
  selectedClubTypes,
  onClubTypeToggle,
  clubTypeDescriptions = {},
  title = 'Filter by Club Type',
  allTypesLabel = 'All Types',
  height = 'h-[200px]',
}: ClubTypeFilterProps) {
  const allTypesSelected = selectedClubTypes.size === clubTypes.length;

  const handleAllTypesToggle = () => {
    if (allTypesSelected) {
      // Deselect all
      clubTypes.forEach((type) => {
        if (selectedClubTypes.has(type)) {
          onClubTypeToggle(type);
        }
      });
    } else {
      // Select all
      clubTypes.forEach((type) => {
        if (!selectedClubTypes.has(type)) {
          onClubTypeToggle(type);
        }
      });
    }
  };

  // Helper function to format club type labels
  const formatClubType = (type: string): string => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="font-semibold mb-3">{title}</h3>
      <ScrollArea className={`${height} pr-4`}>
        <div className="space-y-3">
          {/* All Types option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-types"
              checked={allTypesSelected}
              onCheckedChange={handleAllTypesToggle}
            />
            <label
              htmlFor="all-types"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {allTypesLabel}
            </label>
          </div>

          <div className="border-t border-border my-2" />

          {/* Individual type filters */}
          {clubTypes.map((type) => (
            <HoverCard key={type}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedClubTypes.has(type)}
                  onCheckedChange={() => onClubTypeToggle(type)}
                />
                <HoverCardTrigger asChild>
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {formatClubType(type)}
                  </label>
                </HoverCardTrigger>
              </div>
              <HoverCardContent className="w-80" side="right">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{formatClubType(type)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {clubTypeDescriptions[type] || 'No description available'}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
