import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

export interface ShopServiceFilterProps {
  services: readonly string[];
  selectedServices: Set<string>;
  onServiceToggle: (service: string) => void;
  serviceDescriptions?: Record<string, string>;
  title?: string;
  allServicesLabel?: string;
  height?: string;
}

export default function ShopServiceFilter({
  services,
  selectedServices,
  onServiceToggle,
  serviceDescriptions = {},
  title = 'Filter by Service',
  allServicesLabel = 'All Services',
  height = 'h-[300px]',
}: ShopServiceFilterProps) {
  const allServicesSelected = selectedServices.size === services.length;

  const handleAllServicesToggle = () => {
    if (allServicesSelected) {
      // Deselect all
      services.forEach((service) => {
        if (selectedServices.has(service)) {
          onServiceToggle(service);
        }
      });
    } else {
      // Select all
      services.forEach((service) => {
        if (!selectedServices.has(service)) {
          onServiceToggle(service);
        }
      });
    }
  };

  // Helper function to format service labels
  const formatService = (service: string): string => {
    return service.replace(/_/g, ' ');
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="font-semibold mb-3">{title}</h3>
      <ScrollArea className={`${height} pr-4`}>
        <div className="space-y-3">
          {/* All Services option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-services"
              checked={allServicesSelected}
              onCheckedChange={handleAllServicesToggle}
            />
            <label
              htmlFor="all-services"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {allServicesLabel}
            </label>
          </div>

          <div className="border-t border-border my-2" />

          {/* Individual service filters */}
          {services.map((service) => (
            <HoverCard key={service}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service}`}
                  checked={selectedServices.has(service)}
                  onCheckedChange={() => onServiceToggle(service)}
                />
                <HoverCardTrigger asChild>
                  <label
                    htmlFor={`service-${service}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {formatService(service)}
                  </label>
                </HoverCardTrigger>
              </div>
              <HoverCardContent className="w-80" side="right">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{formatService(service)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {serviceDescriptions[service] || 'No description available'}
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
