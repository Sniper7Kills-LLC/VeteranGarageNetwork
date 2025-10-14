import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

export interface EventCategoryFilterProps {
  categories: readonly string[];
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  categoryDescriptions?: Record<string, string>;
  title?: string;
  allCategoriesLabel?: string;
  height?: string;
}

export default function EventCategoryFilter({
  categories,
  selectedCategories,
  onCategoryToggle,
  categoryDescriptions = {},
  title = 'Filter by Event Type',
  allCategoriesLabel = 'All Events',
  height = 'h-[200px]',
}: EventCategoryFilterProps) {
  const allCategoriesSelected = selectedCategories.size === categories.length;

  const handleAllCategoriesToggle = () => {
    if (allCategoriesSelected) {
      // Deselect all
      categories.forEach((category) => {
        if (selectedCategories.has(category)) {
          onCategoryToggle(category);
        }
      });
    } else {
      // Select all
      categories.forEach((category) => {
        if (!selectedCategories.has(category)) {
          onCategoryToggle(category);
        }
      });
    }
  };

  // Helper function to format category labels
  const formatCategory = (category: string): string => {
    return category.replace(/_/g, ' ');
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="font-semibold mb-3">{title}</h3>
      <ScrollArea className={`${height} pr-4`}>
        <div className="space-y-3">
          {/* All Categories option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-categories"
              checked={allCategoriesSelected}
              onCheckedChange={handleAllCategoriesToggle}
            />
            <label
              htmlFor="all-categories"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {allCategoriesLabel}
            </label>
          </div>

          <div className="border-t border-border my-2" />

          {/* Individual category filters */}
          {categories.map((category) => (
            <HoverCard key={category}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedCategories.has(category)}
                  onCheckedChange={() => onCategoryToggle(category)}
                />
                <HoverCardTrigger asChild>
                  <label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {formatCategory(category)}
                  </label>
                </HoverCardTrigger>
              </div>
              <HoverCardContent className="w-80" side="right">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{formatCategory(category)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {categoryDescriptions[category] || 'No description available'}
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
