import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ASSOCIATION_RELATIONSHIP_VALUES, ASSOCIATION_RELATIONSHIP_DESCRIPTIONS } from '@/../amplify/config/enums';

interface Chapter {
  id: string;
  name: string;
  description: string | null;
  clubName: string;
}

interface ChapterAssociation {
  relationship: string;
  details: string;
}

interface ChapterAssociationSelectorProps {
  chapters: Chapter[];
  selectedChapterIds: string[];
  chapterAssociations: Record<string, ChapterAssociation>;
  onChapterToggle: (chapterId: string) => void;
  onUpdateAssociation: (chapterId: string, field: 'relationship' | 'details', value: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export default function ChapterAssociationSelector({
  chapters,
  selectedChapterIds,
  chapterAssociations,
  onChapterToggle,
  onUpdateAssociation,
  searchQuery,
  onSearchChange,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: ChapterAssociationSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Chapter Associations (Optional)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Associate this shop with specific club chapters. All associations require admin approval.
        </p>
      </div>

      {/* Search Input */}
      <Input
        type="text"
        placeholder="Search chapters..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* Chapter List */}
      <div className="border border-border rounded-md">
        <ScrollArea className="h-[200px] p-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Loading chapters...
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No approved chapters found.
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`chapter-${chapter.id}`}
                    checked={selectedChapterIds.includes(chapter.id)}
                    onCheckedChange={() => onChapterToggle(chapter.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`chapter-${chapter.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {chapter.name}
                      <span className="text-muted-foreground ml-1">({chapter.clubName})</span>
                    </label>
                    {chapter.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {chapter.description}
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

      {/* Selected Chapter Associations */}
      {selectedChapterIds.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Configure Associations</Label>
          {selectedChapterIds.map((chapterId) => {
            const chapter = chapters.find((c) => c.id === chapterId);
            if (!chapter) return null;

            return (
              <div key={chapterId} className="p-4 border border-border rounded-md space-y-3">
                <div className="font-medium">
                  {chapter.name}
                  <span className="text-sm text-muted-foreground ml-2">({chapter.clubName})</span>
                </div>

                <div>
                  <Label>Relationship Type *</Label>
                  <div className="mt-2 space-y-2">
                    {ASSOCIATION_RELATIONSHIP_VALUES.map((type) => (
                      <div key={type} className="flex items-start space-x-2">
                        <input
                          type="radio"
                          id={`chapter-relationship-${chapterId}-${type}`}
                          name={`chapter-relationship-${chapterId}`}
                          value={type}
                          checked={chapterAssociations[chapterId]?.relationship === type}
                          onChange={(e) => onUpdateAssociation(chapterId, 'relationship', e.target.value)}
                          className="mt-1"
                          required
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`chapter-relationship-${chapterId}-${type}`}
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
                  <Label htmlFor={`chapter-details-${chapterId}`}>Details (Optional)</Label>
                  <textarea
                    id={`chapter-details-${chapterId}`}
                    value={chapterAssociations[chapterId]?.details || ''}
                    onChange={(e) => onUpdateAssociation(chapterId, 'details', e.target.value)}
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
