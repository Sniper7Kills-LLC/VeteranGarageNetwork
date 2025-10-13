import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ASSOCIATION_RELATIONSHIP_VALUES, ASSOCIATION_RELATIONSHIP_DESCRIPTIONS } from '@/../amplify/config/enums';

interface Club {
  id: string;
  name: string;
  description: string | null;
}

interface ClubAssociation {
  relationship: string;
  details: string;
}

interface ClubAssociationSelectorProps {
  clubs: Club[];
  selectedClubIds: string[];
  clubAssociations: Record<string, ClubAssociation>;
  onClubToggle: (clubId: string) => void;
  onUpdateAssociation: (clubId: string, field: 'relationship' | 'details', value: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export default function ClubAssociationSelector({
  clubs,
  selectedClubIds,
  clubAssociations,
  onClubToggle,
  onUpdateAssociation,
  searchQuery,
  onSearchChange,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: ClubAssociationSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Club Associations (Optional)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Associate this shop with clubs. All associations require admin approval.
        </p>
      </div>

      {/* Search Input */}
      <Input
        type="text"
        placeholder="Search clubs..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* Club List */}
      <div className="border border-border rounded-md">
        <ScrollArea className="h-[200px] p-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Loading clubs...
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No approved clubs found.
            </div>
          ) : (
            <div className="space-y-2">
              {clubs.map((club) => (
                <div key={club.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`club-${club.id}`}
                    checked={selectedClubIds.includes(club.id)}
                    onCheckedChange={() => onClubToggle(club.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`club-${club.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {club.name}
                    </label>
                    {club.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {club.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
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

      {/* Selected Club Associations */}
      {selectedClubIds.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Configure Associations</Label>
          {selectedClubIds.map((clubId) => {
            const club = clubs.find((c) => c.id === clubId);
            if (!club) return null;

            return (
              <div key={clubId} className="p-4 border border-border rounded-md space-y-3">
                <div className="font-medium">{club.name}</div>

                <div>
                  <Label>Relationship Type *</Label>
                  <div className="mt-2 space-y-2">
                    {ASSOCIATION_RELATIONSHIP_VALUES.map((type) => (
                      <div key={type} className="flex items-start space-x-2">
                        <input
                          type="radio"
                          id={`club-relationship-${clubId}-${type}`}
                          name={`club-relationship-${clubId}`}
                          value={type}
                          checked={clubAssociations[clubId]?.relationship === type}
                          onChange={(e) => onUpdateAssociation(clubId, 'relationship', e.target.value)}
                          className="mt-1"
                          required
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`club-relationship-${clubId}-${type}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {type}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {ASSOCIATION_RELATIONSHIP_DESCRIPTIONS[type]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor={`club-details-${clubId}`}>Details (Optional)</Label>
                  <textarea
                    id={`club-details-${clubId}`}
                    value={clubAssociations[clubId]?.details || ''}
                    onChange={(e) => onUpdateAssociation(clubId, 'details', e.target.value)}
                    placeholder="Describe the relationship..."
                    className="w-full mt-1 p-2 border border-border rounded-md bg-background min-h-[80px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
